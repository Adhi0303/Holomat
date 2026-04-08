"""
HoloMat Arduino Bridge v2.0
============================
Bidirectional. Reads sensor JSON from Arduino AND sends commands back.

READS:  {"motion":true,"distance":42.5,"zone":"GESTURE","light":78,"light_raw":800,...}
SENDS:  {"cmd":"ir","action":"brightness_up"}
        {"cmd":"lcd","line1":"HOLOMAT","line2":"Welcome Sir"}
        {"cmd":"lcd_status","text":"STANDBY"}
"""

import serial
import serial.tools.list_ports
import json
import threading
import time
import platform
import queue

# ============================================================
# CONFIGURATION
# ============================================================
BAUD_RATE     = 115200
RECONNECT_SEC = 5
DATA_TIMEOUT  = 3.0


def _find_arduino_port() -> str | None:
    """Auto-detect the Arduino serial port."""
    ports = list(serial.tools.list_ports.comports())

    for p in ports:
        desc = (p.description or "").lower()
        if "arduino" in desc or "ch340" in desc or "usb serial" in desc:
            return p.device

    if platform.system() != "Windows":
        for p in ports:
            if "ttyACM" in p.device or "ttyUSB" in p.device:
                return p.device

    if platform.system() == "Windows" and ports:
        return "COM5"

    return None


class ArduinoBridge:
    """
    Bidirectional bridge to Arduino.
    - Background thread reads sensor JSON from serial
    - send_command() writes JSON commands back to Arduino
    """

    def __init__(self):
        self._lock           = threading.Lock()
        self._thread         = None
        self._running        = False
        self._connected      = False
        self._last_data_time = 0.0
        self._serial_port    = None
        self._serial_lock    = threading.Lock()

        # Command queue: Pi → Arduino
        self._cmd_queue = queue.Queue(maxsize=50)

        # Latest sensor state
        self._sensor_cache = {
            "motion":       False,
            "distance":     None,
            "zone":         "NONE",
            "light":        50,
            "light_raw":    512,
            "light_status": "NORMAL",
            "lcd":          False,
            "uptime":       0,
            "source":       "mock",
        }

        # Motion tracking for sleep/wake
        self._last_motion_time = 0.0
        self._motion_active    = False

    # ----------------------------------------------------------
    # PUBLIC API
    # ----------------------------------------------------------

    def start(self):
        """Start the background reader thread."""
        if self._thread and self._thread.is_alive():
            return
        self._running = True
        self._thread  = threading.Thread(
            target=self._reader_loop,
            name="ArduinoBridgeThread",
            daemon=True,
        )
        self._thread.start()
        print("[HoloMat Hardware] Arduino bridge v2.0 started (bidirectional).")

    def stop(self):
        self._running = False

    def is_connected(self) -> bool:
        return self._connected

    def get_sensor_data(self) -> dict:
        with self._lock:
            return dict(self._sensor_cache)

    def get_last_motion_time(self) -> float:
        """Last time motion was detected (epoch seconds)."""
        return self._last_motion_time

    def is_motion_active(self) -> bool:
        """True if motion was recently detected."""
        return self._motion_active

    def send_command(self, cmd: dict):
        """
        Send a JSON command to the Arduino.
        Examples:
            send_command({"cmd": "ir", "action": "brightness_up"})
            send_command({"cmd": "lcd", "line1": "HELLO", "line2": "WORLD"})
            send_command({"cmd": "lcd_status", "text": "STANDBY"})
        """
        try:
            self._cmd_queue.put_nowait(cmd)
        except queue.Full:
            print("[HoloMat Hardware] Command queue full, dropping command.")

    def send_ir(self, action: str):
        """Shortcut: send an IR command."""
        self.send_command({"cmd": "ir", "action": action})

    def send_lcd(self, line1: str, line2: str = ""):
        """Shortcut: send LCD text."""
        self.send_command({"cmd": "lcd", "line1": line1, "line2": line2})

    def send_lcd_status(self, text: str):
        """Shortcut: set persistent LCD status text."""
        self.send_command({"cmd": "lcd_status", "text": text})

    # ----------------------------------------------------------
    # INTERNAL LOOP
    # ----------------------------------------------------------

    def _reader_loop(self):
        while self._running:
            port = _find_arduino_port()

            if not port:
                print(f"[HoloMat Hardware] No Arduino detected. Retrying in {RECONNECT_SEC}s...")
                self._mark_disconnected()
                time.sleep(RECONNECT_SEC)
                continue

            print(f"[HoloMat Hardware] Connecting to Arduino on {port} at {BAUD_RATE} baud...")

            try:
                with serial.Serial(port, BAUD_RATE, timeout=1) as ser:
                    print(f"[HoloMat Hardware] ✅ Connected to Arduino on {port}!")
                    self._last_data_time = time.time()

                    with self._serial_lock:
                        self._serial_port = ser

                    while self._running:
                        # --- Send any queued commands to Arduino ---
                        self._flush_commands(ser)

                        # --- Read sensor data from Arduino ---
                        raw = ser.readline().decode("utf-8", errors="ignore").strip()

                        if not raw:
                            if time.time() - self._last_data_time > DATA_TIMEOUT:
                                print("[HoloMat Hardware] ⚠️  No data — reconnecting...")
                                self._mark_disconnected()
                                break
                            continue

                        # Filter: only parse sensor JSON, ignore IR confirmation lines
                        if raw.startswith("{") and raw.endswith("}") and "\"motion\"" in raw:
                            self._parse_and_cache(raw)

            except serial.SerialException as e:
                print(f"[HoloMat Hardware] Serial error: {e}. Reconnecting in {RECONNECT_SEC}s...")
                self._mark_disconnected()
                time.sleep(RECONNECT_SEC)
            finally:
                with self._serial_lock:
                    self._serial_port = None

    def _flush_commands(self, ser):
        """Send all queued commands to Arduino."""
        while not self._cmd_queue.empty():
            try:
                cmd = self._cmd_queue.get_nowait()
                cmd_json = json.dumps(cmd) + "\n"
                ser.write(cmd_json.encode("utf-8"))
                ser.flush()
            except (queue.Empty, serial.SerialException):
                break

    def _parse_and_cache(self, raw_json: str):
        try:
            data = json.loads(raw_json)
            self._last_data_time = time.time()

            motion_now = data.get("motion", False)

            with self._lock:
                self._connected = True
                self._motion_active = motion_now

                if motion_now:
                    self._last_motion_time = time.time()

                self._sensor_cache.update({
                    "motion":       motion_now,
                    "distance":     data.get("distance",     self._sensor_cache["distance"]),
                    "zone":         data.get("zone",         self._sensor_cache["zone"]),
                    "light":        data.get("light",        self._sensor_cache["light"]),
                    "light_raw":    data.get("light_raw",    self._sensor_cache["light_raw"]),
                    "light_status": data.get("light_status", self._sensor_cache["light_status"]),
                    "lcd":          data.get("lcd",          self._sensor_cache["lcd"]),
                    "uptime":       data.get("uptime",       self._sensor_cache["uptime"]),
                    "source":       "arduino",
                })

        except json.JSONDecodeError:
            pass

    def _mark_disconnected(self):
        with self._lock:
            self._connected = False
            self._sensor_cache["source"] = "mock"


# ============================================================
# SINGLETON
# ============================================================
arduino_bridge = ArduinoBridge()
