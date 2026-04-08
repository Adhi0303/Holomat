"""
HoloMat Brightness Controller
==============================
Reads ambient light level from LDR (via Arduino bridge) and
automatically adjusts projector brightness via IR LED commands.

Uses hysteresis + cooldown to prevent constant flickering.

THRESHOLDS:
  light < 25%  →  send IR brightness_up   (dark room → projector too bright)
  light > 75%  →  send IR brightness_down  (bright room → projector too dim)
  25-75%       →  no action (normal range)

COOLDOWN: Only sends IR commands once every 30 seconds minimum.
"""

import threading
import time
from hardware.arduino_bridge import arduino_bridge

# ============================================================
# CONFIGURATION
# ============================================================
LIGHT_LOW_THRESHOLD  = 25   # Below this → increase projector brightness
LIGHT_HIGH_THRESHOLD = 75   # Above this → decrease projector brightness
HYSTERESIS           = 5    # Buffer zone to prevent oscillation
COOLDOWN_SEC         = 30   # Minimum seconds between IR adjustments
CHECK_INTERVAL       = 5    # Check light level every 5 seconds


class BrightnessController:
    """
    Background thread that monitors ambient light and sends
    IR brightness commands to the projector via Arduino.
    """

    def __init__(self):
        self._thread   = None
        self._running  = False
        self._last_adjust_time = 0.0
        self._last_action      = None  # "up" | "down" | None
        self._enabled          = True

    def start(self):
        if self._thread and self._thread.is_alive():
            return
        self._running = True
        self._thread = threading.Thread(
            target=self._monitor_loop,
            name="BrightnessControllerThread",
            daemon=True,
        )
        self._thread.start()
        print("[HoloMat Brightness] Auto-brightness controller started.")

    def stop(self):
        self._running = False

    def set_enabled(self, enabled: bool):
        """Enable/disable auto-brightness."""
        self._enabled = enabled
        print(f"[HoloMat Brightness] Auto-brightness {'enabled' if enabled else 'disabled'}.")

    def is_enabled(self) -> bool:
        return self._enabled

    def _monitor_loop(self):
        while self._running:
            try:
                if self._enabled and arduino_bridge.is_connected():
                    data = arduino_bridge.get_sensor_data()
                    light = data.get("light", 50)
                    now = time.time()

                    # Check cooldown
                    if now - self._last_adjust_time < COOLDOWN_SEC:
                        time.sleep(CHECK_INTERVAL)
                        continue

                    # Apply hysteresis: only act if we've crossed a threshold
                    # AND we're not already in that state
                    if light < LIGHT_LOW_THRESHOLD - HYSTERESIS and self._last_action != "up":
                        # Dark room → projector is relatively too bright, dim it
                        # Actually in a dark room, we want the projector dimmer
                        arduino_bridge.send_ir("brightness_down")
                        self._last_action = "down"
                        self._last_adjust_time = now
                        print(f"[HoloMat Brightness] Room dark ({light}%) → dimming projector")

                    elif light > LIGHT_HIGH_THRESHOLD + HYSTERESIS and self._last_action != "down":
                        # Bright room → projector needs to be brighter to be visible
                        arduino_bridge.send_ir("brightness_up")
                        self._last_action = "up"
                        self._last_adjust_time = now
                        print(f"[HoloMat Brightness] Room bright ({light}%) → brightening projector")

                    elif LIGHT_LOW_THRESHOLD <= light <= LIGHT_HIGH_THRESHOLD:
                        # Normal range → reset action state
                        self._last_action = None

            except Exception as e:
                print(f"[HoloMat Brightness] Error: {e}")

            time.sleep(CHECK_INTERVAL)


# ============================================================
# SINGLETON
# ============================================================
brightness_controller = BrightnessController()
