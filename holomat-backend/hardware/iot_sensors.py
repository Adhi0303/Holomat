"""
Real IoT Sensor Integration for HoloMat
Requires: Raspberry Pi with connected sensors
"""

import time
import threading
from typing import Dict, Any, Optional
import logging

# Conditional imports for Raspberry Pi
try:
    import RPi.GPIO as GPIO
    import Adafruit_DHT
    import cv2
    from gpiozero import MotionSensor, LightSensor
    RASPBERRY_PI = True
except ImportError:
    RASPBERRY_PI = False
    print("⚠️  Raspberry Pi libraries not found. Using simulation mode.")

class IoTSensorManager:
    def __init__(self):
        self.sensors_active = RASPBERRY_PI
        self.sensor_data = {}
        self.running = False
        
        if self.sensors_active:
            self.setup_gpio()
        
    def setup_gpio(self):
        """Initialize GPIO pins for sensors"""
        if not self.sensors_active:
            return
            
        try:
            # PIR Motion Sensor (GPIO 18)
            self.pir = MotionSensor(18)
            
            # Ultrasonic Sensors (GPIO pins)
            self.ultrasonic_pins = [
                {"trigger": 23, "echo": 24},  # Left sensor
                {"trigger": 25, "echo": 8},   # Center sensor  
                {"trigger": 7, "echo": 1}     # Right sensor
            ]
            
            # Setup ultrasonic pins
            for sensor in self.ultrasonic_pins:
                GPIO.setup(sensor["trigger"], GPIO.OUT)
                GPIO.setup(sensor["echo"], GPIO.IN)
            
            # DHT22 Temperature/Humidity (GPIO 4)
            self.dht_pin = 4
            
            # Camera
            self.camera = cv2.VideoCapture(0)
            
            print("✅ Real IoT sensors initialized")
            
        except Exception as e:
            print(f"❌ Sensor setup failed: {e}")
            self.sensors_active = False

    def read_pir_motion(self) -> bool:
        """Read PIR motion sensor"""
        if not self.sensors_active:
            return False
            
        try:
            return self.pir.motion_detected
        except:
            return False

    def read_ultrasonic_distance(self, sensor_index: int) -> float:
        """Read distance from ultrasonic sensor"""
        if not self.sensors_active or sensor_index >= len(self.ultrasonic_pins):
            return 0.0
            
        try:
            sensor = self.ultrasonic_pins[sensor_index]
            
            # Send trigger pulse
            GPIO.output(sensor["trigger"], True)
            time.sleep(0.00001)
            GPIO.output(sensor["trigger"], False)
            
            # Measure echo time
            start_time = time.time()
            stop_time = time.time()
            
            while GPIO.input(sensor["echo"]) == 0:
                start_time = time.time()
                
            while GPIO.input(sensor["echo"]) == 1:
                stop_time = time.time()
                
            # Calculate distance (cm)
            time_elapsed = stop_time - start_time
            distance = (time_elapsed * 34300) / 2
            
            return round(distance, 1)
            
        except Exception as e:
            print(f"Ultrasonic sensor {sensor_index} error: {e}")
            return 0.0

    def read_temperature_humidity(self) -> Dict[str, float]:
        """Read DHT22 temperature and humidity"""
        if not self.sensors_active:
            return {"temperature": 0.0, "humidity": 0.0}
            
        try:
            humidity, temperature = Adafruit_DHT.read_retry(Adafruit_DHT.DHT22, self.dht_pin)
            
            if humidity is not None and temperature is not None:
                return {
                    "temperature": round(temperature, 1),
                    "humidity": round(humidity, 1)
                }
            else:
                return {"temperature": 0.0, "humidity": 0.0}
                
        except Exception as e:
            print(f"DHT22 sensor error: {e}")
            return {"temperature": 0.0, "humidity": 0.0}

    def detect_gestures(self) -> str:
        """Detect hand gestures using ultrasonic sensors"""
        if not self.sensors_active:
            return "READY"
            
        try:
            # Read all three ultrasonic sensors
            distances = []
            for i in range(3):
                dist = self.read_ultrasonic_distance(i)
                distances.append(dist)
            
            left, center, right = distances
            
            # Gesture detection logic
            if center < 30:  # Hand very close to center
                return "GRAB"
            elif left < 50 and center > 100 and right > 100:
                return "SWIPE_LEFT"
            elif right < 50 and center > 100 and left > 100:
                return "SWIPE_RIGHT"
            elif all(d < 80 for d in distances):
                return "PUSH"
            elif all(d > 150 for d in distances):
                return "PULL"
            else:
                return "READY"
                
        except Exception as e:
            print(f"Gesture detection error: {e}")
            return "READY"

    def get_sensor_data(self) -> Dict[str, Any]:
        """Get current sensor readings"""
        if not self.sensors_active:
            # Simulation fallback
            import random
            return {
                "motion": random.choice([True, False]),
                "distances": [random.uniform(50, 150) for _ in range(3)],
                "gesture": random.choice(["READY", "SWIPE_LEFT", "SWIPE_RIGHT", "GRAB"]),
                "environment": {
                    "temperature": random.uniform(20, 30),
                    "humidity": random.uniform(40, 70)
                },
                "timestamp": time.time()
            }
        
        return {
            "motion": self.read_pir_motion(),
            "distances": [self.read_ultrasonic_distance(i) for i in range(3)],
            "gesture": self.detect_gestures(),
            "environment": self.read_temperature_humidity(),
            "timestamp": time.time()
        }

# Global sensor manager
sensor_manager = IoTSensorManager()