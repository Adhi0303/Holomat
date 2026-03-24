"""
Enhanced Mock IoT Sensor System for HoloMat
Simulates realistic sensor behavior for development/testing
"""

import time
import random
import threading
from typing import Dict, Any
from datetime import datetime

class MockIoTSensors:
    def __init__(self):
        self.running = False
        self.sensor_data = {
            "motion": {"active": False, "last_trigger": 0},
            "distance": {"left": 100, "center": 100, "right": 100},
            "temperature": 22.5,
            "humidity": 45.0,
            "light": 65,
            "gesture": "READY",
            "face_detected": False,
            "voice_active": False
        }
        self.settings = {
            "motion_sensitivity": 75,
            "light_threshold": 50,
            "gesture_timeout": 3000,
            "auto_brightness": True
        }
        
    def start_simulation(self):
        """Start realistic sensor simulation"""
        self.running = True
        
        def simulation_loop():
            while self.running:
                self._update_motion_sensor()
                self._update_distance_sensors()
                self._update_environmental_sensors()
                self._update_gesture_detection()
                self._update_light_sensor()
                time.sleep(0.1)  # 10Hz update
                
        self.thread = threading.Thread(target=simulation_loop, daemon=True)
        self.thread.start()
        print("[SENSORS] Mock IoT sensors started")
    
    def _update_motion_sensor(self):
        """Simulate PIR motion sensor"""
        # Random motion events every 10-30 seconds
        if time.time() - self.sensor_data["motion"]["last_trigger"] > random.uniform(10, 30):
            if random.random() > 0.7:  # 30% chance
                self.sensor_data["motion"]["active"] = True
                self.sensor_data["motion"]["last_trigger"] = time.time()
                print("[MOTION] Motion detected!")
            else:
                self.sensor_data["motion"]["active"] = False
    
    def _update_distance_sensors(self):
        """Simulate 3 ultrasonic sensors with realistic movement"""
        # Simulate hand movements
        for sensor in ["left", "center", "right"]:
            current = self.sensor_data["distance"][sensor]
            # Add realistic noise and gradual changes
            change = random.uniform(-5, 5)
            new_value = max(20, min(200, current + change))
            self.sensor_data["distance"][sensor] = round(new_value, 1)
    
    def _update_environmental_sensors(self):
        """Simulate temperature and humidity with realistic drift"""
        # Temperature: 20-30°C with slow changes
        temp_change = random.uniform(-0.1, 0.1)
        self.sensor_data["temperature"] = max(20, min(30, 
            self.sensor_data["temperature"] + temp_change))
        
        # Humidity: 40-70% with slow changes
        hum_change = random.uniform(-0.2, 0.2)
        self.sensor_data["humidity"] = max(40, min(70, 
            self.sensor_data["humidity"] + hum_change))
    
    def _update_gesture_detection(self):
        """Simulate gesture recognition based on distance sensors"""
        left = self.sensor_data["distance"]["left"]
        center = self.sensor_data["distance"]["center"]
        right = self.sensor_data["distance"]["right"]
        
        # Gesture detection logic
        if center < 40:
            self.sensor_data["gesture"] = "GRAB"
        elif left < 60 and center > 120 and right > 120:
            self.sensor_data["gesture"] = "SWIPE_LEFT"
        elif right < 60 and center > 120 and left > 120:
            self.sensor_data["gesture"] = "SWIPE_RIGHT"
        elif all(d < 80 for d in [left, center, right]):
            self.sensor_data["gesture"] = "PUSH"
        elif all(d > 150 for d in [left, center, right]):
            self.sensor_data["gesture"] = "PULL"
        else:
            self.sensor_data["gesture"] = "READY"
    
    def _update_light_sensor(self):
        """Simulate light sensor with day/night cycle"""
        # Simulate gradual light changes
        light_change = random.uniform(-2, 2)
        self.sensor_data["light"] = max(0, min(100, 
            self.sensor_data["light"] + light_change))
    
    def trigger_motion(self):
        """Manually trigger motion for testing"""
        self.sensor_data["motion"]["active"] = True
        self.sensor_data["motion"]["last_trigger"] = time.time()
        print("[TRIGGER] Motion manually triggered")
    
    def simulate_face_scan(self):
        """Simulate face recognition process"""
        self.sensor_data["face_detected"] = True
        print("[FACE] Face scan simulated")
        # Reset after 3 seconds
        threading.Timer(3.0, lambda: setattr(self.sensor_data, "face_detected", False)).start()
    
    def simulate_gesture(self, gesture: str):
        """Manually trigger specific gesture"""
        valid_gestures = ["READY", "SWIPE_LEFT", "SWIPE_RIGHT", "GRAB", "PUSH", "PULL"]
        if gesture in valid_gestures:
            self.sensor_data["gesture"] = gesture
            print(f"[GESTURE] Gesture '{gesture}' simulated")
            # Reset to READY after 2 seconds
            threading.Timer(2.0, lambda: setattr(self.sensor_data, "gesture", "READY")).start()
    
    def get_sensor_readings(self) -> Dict[str, Any]:
        """Get current sensor data"""
        return {
            "motion": {
                "active": self.sensor_data["motion"]["active"],
                "last_trigger": self.sensor_data["motion"]["last_trigger"]
            },
            "distances": {
                "left": self.sensor_data["distance"]["left"],
                "center": self.sensor_data["distance"]["center"],
                "right": self.sensor_data["distance"]["right"]
            },
            "environment": {
                "temperature": round(self.sensor_data["temperature"], 1),
                "humidity": round(self.sensor_data["humidity"], 1)
            },
            "light": round(self.sensor_data["light"]),
            "gesture": self.sensor_data["gesture"],
            "face_detected": self.sensor_data["face_detected"],
            "voice_active": self.sensor_data["voice_active"],
            "timestamp": time.time()
        }
    
    def update_settings(self, new_settings: Dict[str, Any]):
        """Update sensor settings"""
        self.settings.update(new_settings)
        print(f"[SETTINGS] Settings updated: {new_settings}")
    
    def calibrate_sensors(self):
        """Simulate sensor calibration"""
        print("[CALIBRATE] Calibrating sensors...")
        # Reset to baseline values
        self.sensor_data["distance"] = {"left": 100, "center": 100, "right": 100}
        self.sensor_data["temperature"] = 22.5
        self.sensor_data["humidity"] = 45.0
        self.sensor_data["light"] = 65
        return {"status": "calibrated", "timestamp": datetime.now().isoformat()}
    
    def stop_simulation(self):
        """Stop sensor simulation"""
        self.running = False
        print("[SENSORS] Mock IoT sensors stopped")

# Global mock sensor instance
mock_sensors = MockIoTSensors()