from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
import random
import time
from datetime import datetime
from hardware.sensor_manager import sensor_manager

router = APIRouter()

# Store exported files temporarily
exported_files = {}

# sensor_manager starts both the Arduino bridge and mock simulation on import

@router.get("/sensors")
def get_sensors():
    """Get current sensor readings"""
    data = sensor_manager.get_sensor_readings()
    source = sensor_manager.get_hardware_source()

    return [
        {"id": "motion", "name": "Motion", "value": "ACTIVE" if data["motion"]["active"] else "IDLE", "status": "active", "source": source},
        {"id": "light", "name": "Light", "value": f"{data['light']}%", "status": "active", "source": source},
        {"id": "gesture", "name": "Gesture", "value": data["gesture"], "status": "active" if data["gesture"] != "READY" else "ready", "source": source},
        {"id": "camera", "name": "Camera", "value": "SCANNING" if data["face_detected"] else "ON", "status": "active"},
        {"id": "jarvis", "name": "Jarvis", "value": "LISTENING" if data["voice_active"] else "IDLE", "status": "active" if data["voice_active"] else "idle"},
        {"id": "distance", "name": "Distance", "value": f"{data['distances']['center']} cm", "status": "active", "source": source},
        {"id": "temperature", "name": "Temperature", "value": f"{data['environment']['temperature']}°C", "status": "active"},
        {"id": "humidity", "name": "Humidity", "value": f"{data['environment']['humidity']}%", "status": "active"}
    ]

@router.get("/sensors/measurements")
def get_measurements():
    """Get detailed sensor measurements for measure mode"""
    data = sensor_manager.get_sensor_readings()
    return {
        "distance": data["distances"]["center"],
        "angle": random.uniform(0, 360),  # Simulated angle
        "temperature": data["environment"]["temperature"],
        "humidity": data["environment"]["humidity"],
        "source": sensor_manager.get_hardware_source(),
        "timestamp": datetime.now().isoformat()
    }

@router.post("/sensors/calibrate")
def calibrate_sensors():
    """Calibrate all sensors"""
    result = sensor_manager.calibrate_sensors()
    return {
        "status": "success",
        "message": "Sensor calibration completed",
        "data": result
    }

@router.post("/sensors/trigger/motion")
def trigger_motion():
    """Manually trigger motion sensor for testing"""
    sensor_manager.trigger_motion()
    return {"status": "triggered", "sensor": "motion"}

@router.post("/sensors/trigger/gesture")
def trigger_gesture(payload: dict):
    """Manually trigger gesture for testing"""
    gesture = payload.get("gesture", "READY")
    sensor_manager.simulate_gesture(gesture)
    return {"status": "triggered", "gesture": gesture}

@router.get("/sensors/hardware")
def get_hardware_status():
    """Check if real Arduino hardware is connected"""
    connected = sensor_manager.is_hardware_connected()
    return {
        "connected": connected,
        "source": sensor_manager.get_hardware_source(),
        "message": "Arduino hardware active" if connected else "Using mock simulation"
    }

@router.get("/sensors/raw")
def get_raw_arduino_data():
    """Get raw physical sensor readings directly from Arduino bridge"""
    return sensor_manager.get_raw_arduino_data()

@router.post("/sensors/scan/start")
def start_biometric_scan():
    """Start biometric face scan"""
    sensor_manager.simulate_face_scan()
    return {
        "scan_id": f"scan_{int(time.time())}",
        "status": "started",
        "estimated_time": "3 seconds"
    }

@router.get("/sensors/scan/result/{scan_id}")
def get_scan_result(scan_id: str):
    """Get biometric scan result"""
    data = sensor_manager.get_sensor_readings()
    return {
        "scan_id": scan_id,
        "status": "completed",
        "face_detected": data["face_detected"],
        "user": "Tony Stark" if data["face_detected"] else "Unknown",
        "confidence": round(random.uniform(95, 99.9), 1) if data["face_detected"] else 0,
        "timestamp": datetime.now().isoformat(),
        "authenticated": data["face_detected"]
    }

@router.get("/sensors/settings")
def get_sensor_settings():
    """Get current sensor settings"""
    return sensor_manager.settings

@router.post("/sensors/settings")
def update_sensor_settings(settings: dict):
    """Update sensor settings"""
    sensor_manager.update_settings(settings)
    return {
        "status": "success",
        "message": "Settings updated",
        "settings": sensor_manager.settings
    }

@router.post("/sensors/export")
def export_sensor_data(export_config: dict):
    """Export sensor data in specified format"""
    format_type = export_config.get("format", "json")
    data_types = export_config.get("data_types", [])
    
    # Get actual sensor data
    sensor_data = sensor_manager.get_sensor_readings()
    
    # Build export data based on selected types
    export_data = {}
    
    if "sensorData" in data_types:
        export_data["sensor_readings"] = [
            {
                "timestamp": datetime.now().isoformat(),
                "motion": sensor_data["motion"]["active"],
                "distance_left": sensor_data["distances"]["left"],
                "distance_center": sensor_data["distances"]["center"],
                "distance_right": sensor_data["distances"]["right"],
                "temperature": sensor_data["environment"]["temperature"],
                "humidity": sensor_data["environment"]["humidity"],
                "light": sensor_data["light"],
                "gesture": sensor_data["gesture"]
            }
        ]
    
    if "systemLogs" in data_types:
        export_data["system_logs"] = [
            {"timestamp": datetime.now().isoformat(), "event": "motion_detected", "status": "success"},
            {"timestamp": datetime.now().isoformat(), "event": "sensor_calibrated", "status": "success"},
            {"timestamp": datetime.now().isoformat(), "event": "face_scan_completed", "status": "success"}
        ]
    
    if "measurements" in data_types:
        export_data["measurements"] = [
            {
                "timestamp": datetime.now().isoformat(),
                "distance": sensor_data["distances"]["center"],
                "temperature": sensor_data["environment"]["temperature"],
                "humidity": sensor_data["environment"]["humidity"],
                "angle": random.uniform(0, 360)
            }
        ]
    
    if "settings" in data_types:
        export_data["settings"] = sensor_manager.settings
    
    if "userProfiles" in data_types:
        export_data["user_profiles"] = [
            {"name": "Tony Stark", "role": "Administrator", "last_login": datetime.now().isoformat()}
        ]
    
    # Generate file content based on format
    export_id = f"export_{int(time.time())}"
    
    if format_type == "json":
        import json
        file_content = json.dumps(export_data, indent=2)
    elif format_type == "csv":
        import csv
        import io
        output = io.StringIO()
        if "sensor_readings" in export_data:
            writer = csv.DictWriter(output, fieldnames=export_data["sensor_readings"][0].keys())
            writer.writeheader()
            writer.writerows(export_data["sensor_readings"])
        file_content = output.getvalue()
    elif format_type == "xml":
        file_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<export>
    <metadata>
        <timestamp>{datetime.now().isoformat()}</timestamp>
        <format>{format_type}</format>
    </metadata>
    <data>{str(export_data)}</data>
</export>"""
    else:  # pdf
        file_content = f"HoloMat Export Report\nGenerated: {datetime.now().isoformat()}\nData: {str(export_data)}"
    
    # Store file for download
    exported_files[f"{export_id}.{format_type}"] = file_content
    
    return {
        "export_id": export_id,
        "format": format_type,
        "status": "completed",
        "size": f"{len(file_content)}B",
        "items_count": len(data_types),
        "download_url": f"/api/download/{export_id}.{format_type}",
        "file_content": file_content,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/download/{filename}")
def download_file(filename: str):
    """Download exported file"""
    if filename not in exported_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_content = exported_files[filename]
    file_extension = filename.split('.')[-1]
    
    # Set appropriate content type
    content_types = {
        'json': 'application/json',
        'csv': 'text/csv',
        'xml': 'application/xml',
        'pdf': 'text/plain'
    }
    
    content_type = content_types.get(file_extension, 'text/plain')
    
    return Response(
        content=file_content,
        media_type=content_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/sensors/analytics/historical")
def get_historical_data(hours: int = 1):
    """Get historical sensor data for analytics"""
    import random
    from datetime import datetime, timedelta
    
    data_points = []
    now = datetime.now()
    
    # Generate data points for the specified hours
    points_count = hours * 60  # One point per minute
    
    for i in range(points_count):
        timestamp = now - timedelta(minutes=i)
        data_points.append({
            "timestamp": timestamp.isoformat(),
            "temperature": 20 + random.uniform(-3, 8) + (i * 0.01),
            "humidity": 45 + random.uniform(-10, 15) + (i * 0.005),
            "distance": 80 + random.uniform(-30, 40),
            "light": 60 + random.uniform(-20, 25),
            "motion": random.random() > 0.7,
            "cpu_usage": random.uniform(30, 85),
            "memory_usage": random.uniform(40, 90)
        })
    
    return {
        "data": list(reversed(data_points)),
        "total_points": len(data_points),
        "time_range": f"{hours}h",
        "generated_at": datetime.now().isoformat()
    }

@router.get("/sensors/analytics/performance")
def get_performance_metrics():
    """Get system performance analytics"""
    return {
        "response_time": {
            "avg": random.uniform(10, 15),
            "min": random.uniform(5, 8),
            "max": random.uniform(20, 30),
            "unit": "ms"
        },
        "throughput": {
            "data_points_per_hour": 3600,
            "requests_per_minute": random.randint(50, 120),
            "export_count_today": random.randint(5, 25)
        },
        "reliability": {
            "uptime_percentage": random.uniform(99.5, 99.9),
            "error_rate": random.uniform(0.1, 0.5),
            "accuracy": random.uniform(96, 99)
        },
        "resource_usage": {
            "cpu_avg": random.uniform(45, 75),
            "memory_avg": random.uniform(55, 85),
            "storage_used": random.uniform(60, 90)
        }
    }
@router.get("/sensors/health")
def get_sensor_health():
    """Get overall sensor system health"""
    return {
        "overall": random.randint(95, 100),
        "sensors": random.randint(98, 100),
        "ai": random.randint(90, 100),
        "network": random.randint(95, 100),
        "power": random.randint(85, 95),
        "uptime": "2d 14h 32m",
        "scans_today": random.randint(10, 50),
        "commands_processed": random.randint(40, 100),
        "data_exported": f"{random.uniform(1, 5):.1f}MB",
        "last_check": datetime.now().isoformat()
    }

@router.get("/sensors/analytics/trends")
def get_sensor_trends():
    """Get sensor trend analysis"""
    return {
        "temperature": {
            "trend": "increasing",
            "change_rate": "+0.3°C/hour",
            "prediction": "stable"
        },
        "humidity": {
            "trend": "decreasing",
            "change_rate": "-1.2%/hour",
            "prediction": "seasonal_low"
        },
        "motion_activity": {
            "peak_hours": ["09:00", "14:00", "18:00"],
            "total_events_today": random.randint(150, 300),
            "avg_events_per_hour": random.randint(8, 15)
        },
        "system_alerts": [
            {"time": "10:30", "type": "info", "message": "Sensor calibration completed"},
            {"time": "09:15", "type": "warning", "message": "High temperature detected"},
            {"time": "08:45", "type": "success", "message": "System startup successful"}
        ]
    }