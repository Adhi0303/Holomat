"""
HoloMat Voice Listener
======================
Background service that listens to a USB microphone on the Pi,
runs offline speech-to-text via Vosk, and feeds recognized
commands into the Jarvis API.

WAKE WORD: "jarvis", "holomat", or "hey jarvis"
After wake word is detected, the next phrase is treated as a command.

REQUIREMENTS:
  pip install vosk pyaudio
  Download model: vosk-model-small-en-us-0.15.zip → unzip to backend/vosk-model/

USAGE:
  from hardware.voice_listener import voice_listener
  voice_listener.start()
"""

import threading
import time
import json
import os

# Try to import audio dependencies — they may not be available on all systems
try:
    import pyaudio
    PYAUDIO_AVAILABLE = True
except ImportError:
    PYAUDIO_AVAILABLE = False

try:
    from vosk import Model, KaldiRecognizer
    VOSK_AVAILABLE = True
except ImportError:
    VOSK_AVAILABLE = False

# ============================================================
# CONFIGURATION
# ============================================================
SAMPLE_RATE     = 16000
CHUNK_SIZE      = 4000
WAKE_WORDS      = ["jarvis", "holomat", "hey jarvis", "hello jarvis"]
LISTEN_TIMEOUT  = 8       # Seconds to listen for a command after wake word
MODEL_PATH      = os.path.join(os.path.dirname(__file__), "..", "vosk-model")

# ============================================================
# VOICE LISTENER
# ============================================================

class VoiceListener:
    """
    Background thread that:
    1. Continuously listens for wake words
    2. On wake word → listens for command
    3. Sends command to Jarvis API internally
    """

    def __init__(self):
        self._thread     = None
        self._running    = False
        self._listening  = False
        self._enabled    = True
        self._model      = None
        self._callbacks  = []  # List of callback functions for recognized commands

    def start(self):
        if not PYAUDIO_AVAILABLE:
            print("[HoloMat Voice] ⚠️  pyaudio not installed. Voice input disabled.")
            print("[HoloMat Voice]    Install with: pip install pyaudio")
            return

        if not VOSK_AVAILABLE:
            print("[HoloMat Voice] ⚠️  vosk not installed. Voice input disabled.")
            print("[HoloMat Voice]    Install with: pip install vosk")
            return

        if not os.path.exists(MODEL_PATH):
            print(f"[HoloMat Voice] ⚠️  Vosk model not found at: {MODEL_PATH}")
            print("[HoloMat Voice]    Download from: https://alphacephei.com/vosk/models")
            print("[HoloMat Voice]    Extract to: backend/vosk-model/")
            return

        if self._thread and self._thread.is_alive():
            return

        self._running = True
        self._thread = threading.Thread(
            target=self._listen_loop,
            name="VoiceListenerThread",
            daemon=True,
        )
        self._thread.start()
        print("[HoloMat Voice] 🎤 Voice listener started (wake words: jarvis, holomat)")

    def stop(self):
        self._running = False

    def set_enabled(self, enabled: bool):
        self._enabled = enabled

    def is_listening(self) -> bool:
        return self._listening

    def on_command(self, callback):
        """Register a callback: callback(command_text: str)"""
        self._callbacks.append(callback)

    def _fire_callbacks(self, text: str):
        for cb in self._callbacks:
            try:
                cb(text)
            except Exception as e:
                print(f"[HoloMat Voice] Callback error: {e}")

    def _listen_loop(self):
        """Main listening loop."""
        try:
            self._model = Model(MODEL_PATH)
            print("[HoloMat Voice] Vosk model loaded successfully.")
        except Exception as e:
            print(f"[HoloMat Voice] Failed to load model: {e}")
            return

        audio = pyaudio.PyAudio()

        # Find USB microphone
        mic_index = self._find_usb_mic(audio)
        if mic_index is None:
            print("[HoloMat Voice] ⚠️  No USB microphone found. Voice disabled.")
            audio.terminate()
            return

        print(f"[HoloMat Voice] Using microphone: index {mic_index}")

        while self._running:
            if not self._enabled:
                time.sleep(1)
                continue

            try:
                stream = audio.open(
                    format=pyaudio.paInt16,
                    channels=1,
                    rate=SAMPLE_RATE,
                    input=True,
                    frames_per_buffer=CHUNK_SIZE,
                    input_device_index=mic_index,
                )

                recognizer = KaldiRecognizer(self._model, SAMPLE_RATE)
                print("[HoloMat Voice] 🎧 Listening for wake word...")

                while self._running and self._enabled:
                    data = stream.read(CHUNK_SIZE, exception_on_overflow=False)

                    if recognizer.AcceptWaveform(data):
                        result = json.loads(recognizer.Result())
                        text = result.get("text", "").lower().strip()

                        if text and self._contains_wake_word(text):
                            # Remove wake word from text
                            command = self._extract_command(text)

                            if command:
                                # Wake word + command in same utterance
                                print(f"[HoloMat Voice] 🗣️  Command: '{command}'")
                                self._fire_callbacks(command)
                            else:
                                # Just wake word — listen for next phrase
                                print("[HoloMat Voice] 🔔 Wake word detected! Listening for command...")
                                self._listening = True
                                cmd = self._listen_for_command(stream, recognizer)
                                self._listening = False

                                if cmd:
                                    print(f"[HoloMat Voice] 🗣️  Command: '{cmd}'")
                                    self._fire_callbacks(cmd)

                stream.stop_stream()
                stream.close()

            except Exception as e:
                print(f"[HoloMat Voice] Stream error: {e}. Retrying in 3s...")
                time.sleep(3)

        audio.terminate()

    def _listen_for_command(self, stream, recognizer) -> str | None:
        """After wake word, listen for the actual command."""
        start = time.time()
        recognizer.Reset()

        while time.time() - start < LISTEN_TIMEOUT:
            data = stream.read(CHUNK_SIZE, exception_on_overflow=False)
            if recognizer.AcceptWaveform(data):
                result = json.loads(recognizer.Result())
                text = result.get("text", "").strip()
                if text:
                    return text

        # Check partial result
        partial = json.loads(recognizer.FinalResult())
        text = partial.get("text", "").strip()
        return text if text else None

    def _contains_wake_word(self, text: str) -> bool:
        for wake in WAKE_WORDS:
            if wake in text:
                return True
        return False

    def _extract_command(self, text: str) -> str:
        """Remove wake word from text to get the command portion."""
        for wake in sorted(WAKE_WORDS, key=len, reverse=True):
            if text.startswith(wake):
                cmd = text[len(wake):].strip()
                return cmd
        return ""

    def _find_usb_mic(self, audio) -> int | None:
        """Find the first USB microphone."""
        for i in range(audio.get_device_count()):
            info = audio.get_device_info_by_index(i)
            name = info.get("name", "").lower()
            max_channels = info.get("maxInputChannels", 0)

            if max_channels > 0 and ("usb" in name or "mic" in name):
                return i

        # Fallback: use default input
        try:
            default = audio.get_default_input_device_info()
            if default.get("maxInputChannels", 0) > 0:
                return default["index"]
        except Exception:
            pass

        return None


# ============================================================
# SINGLETON
# ============================================================
voice_listener = VoiceListener()
