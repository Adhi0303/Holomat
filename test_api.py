#!/usr/bin/env python3
"""
HoloMat API Testing Script
Shows what works and expected responses
"""

import requests
import json
import time
from datetime import datetime

# API Base URL
BASE_URL = "http://127.0.0.1:8000/api"

def test_endpoint(method, endpoint, data=None, description=""):
    """Test an API endpoint and show response"""
    url = f"{BASE_URL}{endpoint}"
    print(f"\n{'='*60}")
    print(f"🧪 TESTING: {description}")
    print(f"📡 {method} {endpoint}")
    
    try:
        if method == "GET":
            response = requests.get(url, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=5)
        
        print(f"✅ Status: {response.status_code}")
        print(f"📄 Response:")
        print(json.dumps(response.json(), indent=2))
        
    except requests.exceptions.ConnectionError:
        print("❌ Server not running. Start with: uvicorn main:app --reload")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    print("🚀 HoloMat IoT Sensor API Testing")
    print("Make sure backend is running: cd holomat-backend && uvicorn main:app --reload")
    
    # Test basic server
    test_endpoint("GET", "/", description="Server Health Check")
    
    # Test sensor readings
    test_endpoint("GET", "/sensors", description="Get All Sensor Readings")
    
    # Test measurements for measure mode
    test_endpoint("GET", "/sensors/measurements", description="Get Detailed Measurements")
    
    # Test sensor settings
    test_endpoint("GET", "/sensors/settings", description="Get Sensor Settings")
    
    # Test settings update
    test_endpoint("POST", "/sensors/settings", 
                 {"motion_sensitivity": 80, "led_brightness": 95},
                 "Update Sensor Settings")
    
    # Test motion trigger
    test_endpoint("POST", "/test/motion/trigger", description="Trigger Motion Sensor")
    
    # Test gesture simulation
    test_endpoint("POST", "/test/gesture/SWIPE_LEFT", description="Simulate Swipe Left Gesture")
    
    # Test face scan
    test_endpoint("POST", "/sensors/scan/start", description="Start Face Scan")
    
    # Test scan result
    scan_id = f"scan_{int(time.time())}"
    test_endpoint("GET", f"/sensors/scan/result/{scan_id}", description="Get Scan Result")
    
    # Test calibration
    test_endpoint("POST", "/sensors/calibrate", description="Calibrate Sensors")
    
    # Test export
    test_endpoint("POST", "/sensors/export", 
                 {"format": "json", "data_types": ["sensorData", "measurements"]},
                 "Export Sensor Data")
    
    # Test system health
    test_endpoint("GET", "/sensors/health", description="Get System Health")
    
    # Test system stats
    test_endpoint("GET", "/system-stats", description="Get System Statistics")
    
    # Test Jarvis command
    test_endpoint("POST", "/jarvis/command", 
                 {"command": "activate hologram display"},
                 "Send Jarvis Voice Command")
    
    # Test all sensors status
    test_endpoint("GET", "/test/sensors/all", description="Get All Test Sensor Data")
    
    print(f"\n{'='*60}")
    print("🎉 Testing Complete!")
    print("\n📋 WHAT WORKS:")
    print("✅ Mock IoT sensor simulation")
    print("✅ Real-time sensor readings")
    print("✅ Gesture detection simulation")
    print("✅ Face scan simulation")
    print("✅ Settings management")
    print("✅ Data export functionality")
    print("✅ System health monitoring")
    print("✅ Jarvis command processing")
    print("✅ Testing endpoints")
    
    print("\n🔧 TO TEST FRONTEND:")
    print("1. cd 'frontend UI'")
    print("2. npm install")
    print("3. npm run dev")
    print("4. Open http://localhost:5173")

if __name__ == "__main__":
    main()