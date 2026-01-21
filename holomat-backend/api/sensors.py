from fastapi import APIRouter

router = APIRouter()

@router.get("/sensors")
def get_sensors():
    return [
        {"id": "motion", "name": "Motion", "value": "ACTIVE", "status": "active"},
        {"id": "light", "name": "Light", "value": "65%", "status": "active"},
        {"id": "gesture", "name": "Gesture", "value": "READY", "status": "ready"},
        {"id": "camera", "name": "Camera", "value": "ON", "status": "active"},
        {"id": "jarvis", "name": "Jarvis", "value": "IDLE", "status": "idle"}
    ]
