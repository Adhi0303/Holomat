from fastapi import APIRouter, WebSocket
import asyncio
import random
import json
from hardware.sensor_manager import sensor_manager

ws_router = APIRouter()


def _build_sensor_payload(data: dict, source: str) -> list:
    """Convert sensor_manager readings to the WebSocket sensor array format."""
    return [
        {"id": "motion",      "name": "Motion",      "value": "ACTIVE" if data["motion"]["active"] else "IDLE",    "status": "active",                                         "source": source},
        {"id": "light",       "name": "Light",        "value": f"{data['light']}%",                                 "status": "active",                                         "source": source},
        {"id": "gesture",     "name": "Gesture",      "value": data["gesture"],                                     "status": "active" if data["gesture"] != "READY" else "ready", "source": source},
        {"id": "camera",      "name": "Camera",       "value": "SCANNING" if data["face_detected"] else "ON",       "status": "active"},
        {"id": "jarvis",      "name": "Jarvis",       "value": "LISTENING" if data["voice_active"] else "IDLE",     "status": "active" if data["voice_active"] else "idle"},
        {"id": "distance",    "name": "Distance",     "value": f"{data['distances']['center']} cm",                 "status": "active",                                         "source": source},
        {"id": "temperature", "name": "Temperature",  "value": f"{data['environment']['temperature']}°C",           "status": "active"},
        {"id": "humidity",    "name": "Humidity",     "value": f"{data['environment']['humidity']}%",               "status": "active"},
    ]


@ws_router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    source = sensor_manager.get_hardware_source()
    print(f"✅ WebSocket client connected (sensor source: {source})")

    try:
        while True:
            try:
                source = sensor_manager.get_hardware_source()

                # System stats (CPU, RAM, temp are still simulated — Pi will provide real ones later)
                system_data = {
                    "type": "system_update",
                    "payload": {
                        "cpu":    random.randint(30, 80),
                        "ram":    random.randint(40, 90),
                        "temp":   random.randint(35, 85),
                        "source": source,
                    }
                }
                await ws.send_text(json.dumps(system_data))

                # Live sensor data from sensor_manager (Arduino or Mock)
                sensor_data_raw = sensor_manager.get_sensor_readings()
                sensor_data = {
                    "type": "sensor_update",
                    "payload": _build_sensor_payload(sensor_data_raw, source),
                    "hardware_connected": sensor_manager.is_hardware_connected(),
                    "source": source,
                }
                await ws.send_text(json.dumps(sensor_data))

            except Exception as e:
                print(f"❌ Error sending WebSocket data: {e}")
                break

            await asyncio.sleep(2)

    except Exception as e:
        print(f"❌ WebSocket error: {e}")
    finally:
        print("🔚 WebSocket connection ended")

