"""
HoloMat Sensor Manager
======================
The "Smart Switch" between real Arduino hardware and mock simulation.

  Arduino connected  →  serves LIVE data from arduino_bridge
  Arduino missing    →  seamlessly falls back to mock_sensors simulation

All API routes and WebSocket code should import from here, NOT from
mock_sensors or arduino_bridge directly.

USAGE:
    from hardware.sensor_manager import sensor_manager

    data = sensor_manager.get_sensor_readings()
    #   data["source"] == "arduino"  →  real hardware  🟢
    #   data["source"] == "mock"     →  simulation    🟡
"""

from hardware.arduino_bridge import arduino_bridge
from hardware.mock_sensors   import mock_sensors


class SensorManager:
    """
    Unified sensor interface that transparently switches between real
    Arduino hardware and mock simulation based on connection status.
    """

    def __init__(self):
        # Start the Arduino bridge background thread immediately.
        # If no Arduino is found, it just retries every 5s silently.
        arduino_bridge.start()

        # Also make sure the mock simulation is running (used as fallback)
        mock_sensors.start_simulation()

    # ------------------------------------------------------------------
    # CORE DATA METHOD — used by all API routes
    # ------------------------------------------------------------------

    def get_sensor_readings(self) -> dict:
        """
        Returns a unified sensor data dict that matches the schema
        expected by the rest of the backend (same as mock_sensors output).

        If the Arduino is connected, real fields override the mock data.
        """
        # Always get the mock baseline (temperature, humidity, gestures, etc.)
        mock_data = mock_sensors.get_sensor_readings()

        if arduino_bridge.is_connected():
            hw = arduino_bridge.get_sensor_data()

            # Merge: override mock fields with real Arduino readings
            mock_data["motion"]["active"]     = hw["motion"]
            mock_data["distances"]["center"]  = hw["distance"] if hw["distance"] else mock_data["distances"]["center"]
            mock_data["light"]                = hw["light"]
            mock_data["gesture"]              = _zone_to_gesture(hw["zone"])
            mock_data["source"]               = "arduino"
        else:
            mock_data["source"] = "mock"

        return mock_data

    # ------------------------------------------------------------------
    # PASS-THROUGH HELPERS (so existing API code doesn't break)
    # ------------------------------------------------------------------

    def calibrate_sensors(self) -> dict:
        return mock_sensors.calibrate_sensors()

    def trigger_motion(self):
        mock_sensors.trigger_motion()

    def simulate_gesture(self, gesture: str):
        mock_sensors.simulate_gesture(gesture)

    def simulate_face_scan(self):
        mock_sensors.simulate_face_scan()

    def update_settings(self, settings: dict):
        mock_sensors.update_settings(settings)

    @property
    def settings(self):
        return mock_sensors.settings

    # ------------------------------------------------------------------
    # STATUS HELPERS
    # ------------------------------------------------------------------

    def is_hardware_connected(self) -> bool:
        """True if a physical Arduino is currently sending data."""
        return arduino_bridge.is_connected()

    def get_hardware_source(self) -> str:
        """Returns 'arduino' or 'mock'."""
        return "arduino" if arduino_bridge.is_connected() else "mock"

    def get_raw_arduino_data(self) -> dict:
        """Returns the raw physical sensor cache directly from the Arduino bridge."""
        return arduino_bridge.get_sensor_data()


# ------------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------------

def _zone_to_gesture(zone: str) -> str:
    """
    Convert the Arduino distance zone to a gesture label the
    frontend UI already understands (from the mock schema).
    """
    mapping = {
        "GRAB":    "GRAB",
        "GESTURE": "READY",
        "NEAR":    "POINT",
        "FAR":     "READY",
        "NONE":    "READY",
    }
    return mapping.get(zone, "READY")


# ============================================================
# SINGLETON — import this in every API file
# ============================================================
sensor_manager = SensorManager()
