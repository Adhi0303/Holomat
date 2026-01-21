"""
EXPECTED API RESPONSES - What You Should See
"""

# 1. GET /api/sensors - Basic sensor readings
SENSOR_RESPONSE = {
  "sensors": [
    {"id": "motion", "name": "Motion", "value": "ACTIVE", "status": "active"},
    {"id": "light", "name": "Light", "value": "67%", "status": "active"},
    {"id": "gesture", "name": "Gesture", "value": "SWIPE_LEFT", "status": "active"},
    {"id": "camera", "name": "Camera", "value": "ON", "status": "active"},
    {"id": "jarvis", "name": "Jarvis", "value": "IDLE", "status": "idle"},
    {"id": "distance", "name": "Distance", "value": "85.3 cm", "status": "active"},
    {"id": "temperature", "name": "Temperature", "value": "23.2°C", "status": "active"},
    {"id": "humidity", "name": "Humidity", "value": "48.7%", "status": "active"}
  ]
}

# 2. GET /api/sensors/measurements - Detailed measurements
MEASUREMENTS_RESPONSE = {
  "distance": 85.3,
  "angle": 127.8,
  "temperature": 23.2,
  "humidity": 48.7,
  "timestamp": "2024-12-28T10:30:45.123456"
}

# 3. POST /api/sensors/scan/start - Start face scan
SCAN_START_RESPONSE = {
  "scan_id": "scan_1735380645",
  "status": "started",
  "estimated_time": "3 seconds"
}

# 4. GET /api/sensors/scan/result/{scan_id} - Scan result
SCAN_RESULT_RESPONSE = {
  "scan_id": "scan_1735380645",
  "status": "completed",
  "face_detected": True,
  "user": "Tony Stark",
  "confidence": 98.7,
  "timestamp": "2024-12-28T10:30:48.123456",
  "authenticated": True
}

# 5. POST /api/test/motion/trigger - Trigger motion
MOTION_TRIGGER_RESPONSE = {
  "status": "Motion triggered",
  "test": "passed"
}

# 6. POST /api/test/gesture/SWIPE_LEFT - Test gesture
GESTURE_RESPONSE = {
  "status": "Gesture SWIPE_LEFT triggered",
  "test": "passed"
}

# 7. GET /api/sensors/health - System health
HEALTH_RESPONSE = {
  "overall": 97,
  "sensors": 99,
  "ai": 94,
  "network": 100,
  "power": 89,
  "uptime": "2d 14h 32m",
  "scans_today": 23,
  "commands_processed": 67,
  "data_exported": "3.2MB",
  "last_check": "2024-12-28T10:30:45.123456"
}

# 8. POST /api/jarvis/command - Voice command
JARVIS_RESPONSE = {
  "state": "speaking",
  "response": "Command 'activate hologram display' acknowledged"
}

# 9. POST /api/sensors/export - Export data
EXPORT_RESPONSE = {
  "export_id": "export_1735380645",
  "format": "json",
  "status": "completed",
  "size": "347KB",
  "items_count": 2,
  "download_url": "/downloads/export_1735380645.json",
  "timestamp": "2024-12-28T10:30:45.123456"
}

# 10. GET /api/sensors/settings - Current settings
SETTINGS_RESPONSE = {
  "motion_sensitivity": 75,
  "light_threshold": 50,
  "gesture_timeout": 3000,
  "auto_brightness": True
}

print("📋 EXPECTED API RESPONSES:")
print("="*50)

responses = [
    ("Sensor Readings", SENSOR_RESPONSE),
    ("Measurements", MEASUREMENTS_RESPONSE),
    ("Scan Start", SCAN_START_RESPONSE),
    ("Scan Result", SCAN_RESULT_RESPONSE),
    ("Motion Trigger", MOTION_TRIGGER_RESPONSE),
    ("Gesture Test", GESTURE_RESPONSE),
    ("System Health", HEALTH_RESPONSE),
    ("Jarvis Command", JARVIS_RESPONSE),
    ("Data Export", EXPORT_RESPONSE),
    ("Settings", SETTINGS_RESPONSE)
]

for name, response in responses:
    print(f"\n🔹 {name}:")
    import json
    print(json.dumps(response, indent=2))