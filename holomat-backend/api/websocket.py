"""
HoloMat WebSocket Hub v2.0
===========================
Multi-client WebSocket hub with:
  - Sensor data broadcasting (Arduino or mock)
  - Sleep/wake system (PIR-driven)
  - Gesture routing (laptop → projector)
  - Face auth relay (laptop → all clients)

CLIENT TYPES:
  - "control" = laptop browser (sends gestures, face auth)
  - "display" = Pi Chromium on projector (receives everything)

INCOMING MESSAGES (from laptop):
  {"type": "gesture_input", "gesture": "swipe_left", "confidence": 0.95}
  {"type": "face_auth", "authenticated": true, "user": "Adarsh", "confidence": 98.2}
  {"type": "client_register", "role": "control"}

OUTGOING MESSAGES (to all clients):
  {"type": "sensor_update", "payload": [...], "source": "arduino"}
  {"type": "system_update", "payload": {"cpu":50, "ram":60, ...}}
  {"type": "gesture_action", "gesture": "swipe_left", "action": "next_mode"}
  {"type": "auth_result", "success": true, "user": "Adarsh"}
  {"type": "display_wake"}
  {"type": "display_sleep"}
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import random
import json
import time
from hardware.sensor_manager import sensor_manager
from hardware.arduino_bridge import arduino_bridge

ws_router = APIRouter()

# ============================================================
# CONNECTED CLIENTS
# ============================================================
connected_clients: list[WebSocket] = []
client_roles: dict[WebSocket, str] = {}  # ws -> "control" | "display"

# ============================================================
# SLEEP/WAKE STATE
# ============================================================
SLEEP_TIMEOUT_SEC = 120  # 2 minutes of no motion → sleep
display_awake = True
last_wake_broadcast = 0.0
last_sleep_broadcast = 0.0

# ============================================================
# GESTURE → ACTION MAPPING
# ============================================================
GESTURE_ACTIONS = {
    "swipe_left":  {"action": "next_mode",     "description": "Switch to next mode"},
    "swipe_right": {"action": "prev_mode",     "description": "Switch to previous mode"},
    "grab":        {"action": "select",        "description": "Select / grab element"},
    "push":        {"action": "confirm",       "description": "Confirm / click"},
    "pull":        {"action": "back",          "description": "Go back"},
    "hover":       {"action": "hover",         "description": "Hover cursor"},
}


def _build_sensor_payload(data: dict, source: str) -> list:
    """Convert sensor_manager readings to the WebSocket sensor array format."""
    return [
        {"id": "motion",      "name": "Motion",      "value": "ACTIVE" if data["motion"]["active"] else "IDLE",    "status": "active",                                          "source": source},
        {"id": "light",       "name": "Light",        "value": f"{data['light']}%",                                 "status": "active",                                          "source": source},
        {"id": "gesture",     "name": "Gesture",      "value": data["gesture"],                                     "status": "active" if data["gesture"] != "READY" else "ready", "source": source},
        {"id": "camera",      "name": "Camera",       "value": "SCANNING" if data["face_detected"] else "ON",       "status": "active"},
        {"id": "jarvis",      "name": "Jarvis",       "value": "LISTENING" if data["voice_active"] else "IDLE",     "status": "active" if data["voice_active"] else "idle"},
        {"id": "distance",    "name": "Distance",     "value": f"{data['distances']['center']} cm",                 "status": "active",                                          "source": source},
        {"id": "temperature", "name": "Temperature",  "value": f"{data['environment']['temperature']}°C",           "status": "active"},
        {"id": "humidity",    "name": "Humidity",     "value": f"{data['environment']['humidity']}%",               "status": "active"},
    ]


async def broadcast(message: dict, exclude: WebSocket | None = None):
    """Send a message to all connected clients (optionally excluding one)."""
    dead = []
    text = json.dumps(message)
    for ws in connected_clients:
        if ws is exclude:
            continue
        try:
            await ws.send_text(text)
        except Exception:
            dead.append(ws)
    for ws in dead:
        _remove_client(ws)


def _remove_client(ws: WebSocket):
    if ws in connected_clients:
        connected_clients.remove(ws)
    client_roles.pop(ws, None)


async def check_sleep_wake():
    """Check if display should sleep or wake based on PIR motion."""
    global display_awake, last_wake_broadcast, last_sleep_broadcast

    now = time.time()
    motion_active = False

    # Check Arduino motion
    if arduino_bridge.is_connected():
        data = arduino_bridge.get_sensor_data()
        motion_active = data.get("motion", False)
    else:
        # Mock: always awake when no Arduino
        motion_active = True

    if motion_active:
        if not display_awake and (now - last_wake_broadcast > 2):
            display_awake = True
            last_wake_broadcast = now
            await broadcast({"type": "display_wake"})
            # Tell Arduino to update LCD
            arduino_bridge.send_lcd("  HOLOMAT ONLINE", "  Welcome, Sir")
            print("[HoloMat Display] 🌅 Waking up — motion detected!")

    else:
        # No motion — check timeout
        last_motion = arduino_bridge.get_last_motion_time()
        if last_motion > 0 and (now - last_motion) > SLEEP_TIMEOUT_SEC:
            if display_awake and (now - last_sleep_broadcast > 2):
                display_awake = False
                last_sleep_broadcast = now
                await broadcast({"type": "display_sleep"})
                arduino_bridge.send_lcd_status("STANDBY")
                print("[HoloMat Display] 😴 Sleeping — no motion for 2 minutes.")


async def handle_incoming_message(ws: WebSocket, data: dict):
    """Process incoming WebSocket messages from clients (laptop)."""
    msg_type = data.get("type", "")

    if msg_type == "client_register":
        role = data.get("role", "display")
        client_roles[ws] = role
        print(f"[HoloMat WS] Client registered as: {role}")

    elif msg_type == "gesture_input":
        gesture = data.get("gesture", "none")
        confidence = data.get("confidence", 0.0)

        action_info = GESTURE_ACTIONS.get(gesture, {"action": "unknown"})

        # Broadcast the gesture action to all display clients
        await broadcast({
            "type": "gesture_action",
            "gesture": gesture,
            "confidence": confidence,
            "action": action_info["action"],
            "description": action_info.get("description", ""),
        }, exclude=ws)

        print(f"[HoloMat Gesture] {gesture} → {action_info['action']} (conf: {confidence:.2f})")

    elif msg_type == "face_auth":
        authenticated = data.get("authenticated", False)
        user = data.get("user", "Unknown")
        confidence = data.get("confidence", 0.0)

        # Broadcast auth result to all clients
        await broadcast({
            "type": "auth_result",
            "success": authenticated,
            "user": user,
            "confidence": confidence,
        })

        if authenticated:
            arduino_bridge.send_lcd("ACCESS GRANTED", f"  {user}")
            print(f"[HoloMat Auth] ✅ {user} authenticated (conf: {confidence:.1f}%)")
        else:
            arduino_bridge.send_lcd("ACCESS DENIED", "  UNAUTHORIZED")
            print(f"[HoloMat Auth] ❌ Authentication failed")

    elif msg_type == "bypass_login":
        # Laptop sent a bypass command — unlock projector without face scan
        user = data.get("user", "Commander")
        await broadcast({
            "type": "auth_result",
            "success": True,
            "user": user,
            "confidence": 100.0,
        }, exclude=ws)
        arduino_bridge.send_lcd("BYPASS GRANTED", f"  {user}")
        print(f"[HoloMat Auth] ⚡ Bypass login from laptop → {user}")


@ws_router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    connected_clients.append(ws)
    client_roles[ws] = "display"  # Default role

    source = sensor_manager.get_hardware_source()
    total = len(connected_clients)
    print(f"✅ WebSocket client connected (sensor source: {source}, total clients: {total})")

    # Send initial state
    await ws.send_text(json.dumps({
        "type": "display_state",
        "awake": display_awake,
    }))

    try:
        # Run two tasks concurrently:
        # 1. Broadcast sensor data every 2 seconds
        # 2. Listen for incoming messages from this client
        await asyncio.gather(
            _sensor_broadcast_loop(ws),
            _message_listener(ws),
        )
    except (WebSocketDisconnect, Exception) as e:
        print(f"🔚 WebSocket client disconnected ({e})")
    finally:
        _remove_client(ws)
        print(f"🔚 WebSocket connection ended (remaining clients: {len(connected_clients)})")


async def _sensor_broadcast_loop(ws: WebSocket):
    """Periodically broadcast sensor data and check sleep/wake."""
    while ws in connected_clients:
        try:
            source = sensor_manager.get_hardware_source()

            # System stats
            system_data = {
                "type": "system_update",
                "payload": {
                    "cpu":    random.randint(30, 80),
                    "ram":    random.randint(40, 90),
                    "temp":   random.randint(35, 85),
                    "source": source,
                },
            }
            await ws.send_text(json.dumps(system_data))

            # Live sensor data
            sensor_data_raw = sensor_manager.get_sensor_readings()
            sensor_data = {
                "type": "sensor_update",
                "payload": _build_sensor_payload(sensor_data_raw, source),
                "hardware_connected": sensor_manager.is_hardware_connected(),
                "source": source,
            }
            await ws.send_text(json.dumps(sensor_data))

            # Check sleep/wake
            await check_sleep_wake()

        except Exception:
            break

        await asyncio.sleep(2)


async def _message_listener(ws: WebSocket):
    """Listen for incoming messages from this client."""
    while ws in connected_clients:
        try:
            text = await ws.receive_text()
            data = json.loads(text)
            await handle_incoming_message(ws, data)
        except (WebSocketDisconnect, json.JSONDecodeError):
            break
        except Exception as e:
            print(f"[HoloMat WS] Error handling message: {e}")
            break
