"""
Sensor Testing API - For development and hardware validation
"""

from fastapi import APIRouter
from hardware.mock_sensors import mock_sensors

router = APIRouter()

@router.post("/test/motion/trigger")
def test_trigger_motion():
    """Test motion sensor trigger"""
    mock_sensors.trigger_motion()
    return {"status": "Motion triggered", "test": "passed"}

@router.post("/test/gesture/{gesture_type}")
def test_gesture(gesture_type: str):
    """Test specific gesture"""
    valid_gestures = ["SWIPE_LEFT", "SWIPE_RIGHT", "GRAB", "PUSH", "PULL", "READY"]
    if gesture_type.upper() in valid_gestures:
        mock_sensors.simulate_gesture(gesture_type.upper())
        return {"status": f"Gesture {gesture_type} triggered", "test": "passed"}
    else:
        return {"status": "Invalid gesture", "valid_gestures": valid_gestures}

@router.post("/test/face/scan")
def test_face_scan():
    """Test face recognition scan"""
    mock_sensors.simulate_face_scan()
    return {"status": "Face scan triggered", "test": "passed"}

@router.get("/test/sensors/all")
def test_all_sensors():
    """Get all sensor readings for testing"""
    data = mock_sensors.get_sensor_readings()
    return {
        "status": "All sensors read",
        "data": data,
        "test": "passed"
    }

@router.post("/test/calibrate")
def test_calibration():
    """Test sensor calibration"""
    result = mock_sensors.calibrate_sensors()
    return {
        "status": "Calibration completed",
        "result": result,
        "test": "passed"
    }

@router.get("/test/status")
def test_system_status():
    """Get system test status"""
    return {
        "mock_sensors": "active",
        "simulation": "running",
        "hardware_ready": False,
        "test_endpoints": [
            "/test/motion/trigger",
            "/test/gesture/{type}",
            "/test/face/scan",
            "/test/sensors/all",
            "/test/calibrate"
        ]
    }