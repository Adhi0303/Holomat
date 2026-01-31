from fastapi import APIRouter, WebSocket
import asyncio
import random
import json

ws_router = APIRouter()

# Simulate sensor data
def generate_sensor_data():
    return [
        {"id": "motion", "name": "Motion", "value": random.choice(["ACTIVE", "IDLE"]), "status": "active" if random.random() > 0.7 else "ready"},
        {"id": "light", "name": "Light", "value": f"{random.randint(20, 90)}%", "status": "active"},
        {"id": "gesture", "name": "Gesture", "value": random.choice(["READY", "SWIPE_UP", "SWIPE_DOWN", "SWIPE_LEFT", "SWIPE_RIGHT", "GRAB", "POINT", "TAP"]), "status": "ready" if random.random() > 0.95 else "active"},
        {"id": "camera", "name": "Camera", "value": "ON", "status": "active"},
        {"id": "jarvis", "name": "Jarvis", "value": random.choice(["IDLE", "LISTENING", "SPEAKING"]), "status": "idle" if random.random() > 0.8 else "active"}
    ]

@ws_router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    print("✅ WebSocket client connected")

    try:
        while True:
            try:
                # Send system stats
                system_data = {
                    "type": "system_update",
                    "payload": {
                        "cpu": random.randint(30, 80),
                        "ram": random.randint(40, 90),
                        "temp": random.randint(35, 85)
                    }
                }
                await ws.send_text(json.dumps(system_data))
                print("📤 Sent system update")

                # Send sensor updates (less frequently)
                if random.random() > 0.7:  # 30% chance every 2 seconds
                    sensor_data = {
                        "type": "sensor_update",
                        "payload": generate_sensor_data()
                    }
                    await ws.send_text(json.dumps(sensor_data))
                    print("📤 Sent sensor update")

            except Exception as e:
                print(f"❌ Error sending WebSocket data: {e}")
                break

            await asyncio.sleep(2)

    except Exception as e:
        print(f"❌ WebSocket error: {e}")
    finally:
        print("🔚 WebSocket connection ended")
