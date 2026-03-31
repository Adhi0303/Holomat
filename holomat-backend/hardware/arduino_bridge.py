"""
HoloMat Arduino Bridge
======================
Runs as a background thread. Connects to the Arduino via USB Serial,
reads the JSON stream, and stores the latest sensor state in memory.

The rest of the backend reads from `arduino_bridge.get_sensor_data()`
instead of directly from the serial port.

ARDUINO OUTPUT FORMAT (115200 baud, one line per 100ms):
  {"motion":true,"distance":42.5,"zone":"GESTURE","light":78,"light_status":"BRIGHT","lcd":true,"uptime":12}
"""

import serial
import serial.tools.list_ports
import json
import threading
import time
import platform

# ============================================================
# CONFIGURATION
# ============================================================
BAUD_RATE     = 115200
RECONNECT_SEC = 5      # How long to wait before retrying a failed connection
DATA_TIMEOUT  = 3.0    # If no data in 3 seconds, consider Arduino disconnected


def _find_arduino_port() -> str | None:
    """
    Auto-detect the Arduino serial port on both Windows and Linux/Pi.
    - Windows: looks for COM ports, prefers the USB-flagged ones
    - Linux/Pi: looks for /dev/ttyACM0 or /dev/ttyUSB0
    """
    ports = list(serial.tools.list_ports.comports())

    # Prefer any port with 'Arduino' or 'CH340' in its description
    for p in ports:
        desc = (p.description or "").lower()
        if "arduino" in desc or "ch340" in desc or "usb serial" in desc:
            return p.device

    # Fallback: on Pi/Linux grab the first ttyACM or ttyUSB
    if platform.system() != "Windows":
        for p in ports:
            if "ttyACM" in p.device or "ttyUSB" in p.device:
                return p.device

    # Last resort: return COM5 on Windows (our tested default)
    if platform.system() == "Windows" and ports:
        return "COM5"

    return None


class ArduinoBridge:
    """
    Singleton class that manages the Serial connection to the Arduino
    and exposes the latest parsed sensor data.
    """

    def __init__(self):
        self._lock          = threading.Lock()
        self._thread        = None
        self._running       = False
        self._connected     = False
        self._last_data_time = 0.0

        # Latest sensor state — default values (safe fallback)
        self._sensor_cache = {
            "motion":       False,
            "distance":     None,
            "zone":         "NONE",
            "light":        50,
            "light_status": "NORMAL",
            "lcd":          False,
            "uptime":       0,
            "source":       "mock",  # "arduino" | "mock"
        }

    # ----------------------------------------------------------
    # PUBLIC API
    # ----------------------------------------------------------

    def start(self):
        """Start the background reader thread."""
        if self._thread and self._thread.is_alive():
            return  # Already running
        self._running = True
        self._thread  = threading.Thread(
            target=self._reader_loop,
            name="ArduinoBridgeThread",
            daemon=True,  # Dies automatically when Python exits
        )
        self._thread.start()
        print("[HoloMat Hardware] Arduino bridge started.")

    def stop(self):
        """Stop the background reader thread."""
        self._running = False

    def is_connected(self) -> bool:
        """Returns True if we are actively receiving data from the Arduino."""
        return self._connected

    def get_sensor_data(self) -> dict:
        """Return the most recent sensor reading as a dict."""
        with self._lock:
            return dict(self._sensor_cache)

    # ----------------------------------------------------------
    # INTERNAL LOOP
    # ----------------------------------------------------------

    def _reader_loop(self):
        """Background thread: connect → read → reconnect on error."""
        while self._running:
            port = _find_arduino_port()

            if not port:
                print("[HoloMat Hardware] No Arduino detected. Retrying in "
                      f"{RECONNECT_SEC}s... (Mock data active)")
                self._mark_disconnected()
                time.sleep(RECONNECT_SEC)
                continue

            print(f"[HoloMat Hardware] Connecting to Arduino on {port} at {BAUD_RATE} baud...")

            try:
                with serial.Serial(port, BAUD_RATE, timeout=1) as ser:
                    print(f"[HoloMat Hardware] ✅ Connected to Arduino on {port}!")
                    self._last_data_time = time.time()

                    while self._running:
                        raw = ser.readline().decode("utf-8", errors="ignore").strip()

                        if not raw:
                            # Check for timeout (Arduino stopped sending)
                            if time.time() - self._last_data_time > DATA_TIMEOUT:
                                print("[HoloMat Hardware] ⚠️  No data from Arduino — reconnecting...")
                                self._mark_disconnected()
                                break
                            continue

                        if raw.startswith("{") and raw.endswith("}"):
                            self._parse_and_cache(raw)

            except serial.SerialException as e:
                print(f"[HoloMat Hardware] Serial error: {e}. Reconnecting in {RECONNECT_SEC}s...")
                self._mark_disconnected()
                time.sleep(RECONNECT_SEC)

    def _parse_and_cache(self, raw_json: str):
        """Parse one JSON line from Arduino and update the sensor cache."""
        try:
            data = json.loads(raw_json)
            self._last_data_time = time.time()

            with self._lock:
                self._connected = True
                self._sensor_cache.update({
                    "motion":       data.get("motion",       self._sensor_cache["motion"]),
                    "distance":     data.get("distance",     self._sensor_cache["distance"]),
                    "zone":         data.get("zone",         self._sensor_cache["zone"]),
                    "light":        data.get("light",        self._sensor_cache["light"]),
                    "light_status": data.get("light_status", self._sensor_cache["light_status"]),
                    "lcd":          data.get("lcd",          self._sensor_cache["lcd"]),
                    "uptime":       data.get("uptime",       self._sensor_cache["uptime"]),
                    "source":       "arduino",
                })

        except json.JSONDecodeError:
            pass  # Ignore garbled lines during Arduino startup

    def _mark_disconnected(self):
        with self._lock:
            self._connected = False
            self._sensor_cache["source"] = "mock"


# ============================================================
# SINGLETON INSTANCE — import this from anywhere in the backend
# ============================================================
arduino_bridge = ArduinoBridge()
