"""
REAL IoT SENSOR CONNECTION CODE
Use this when you have actual hardware connected to Raspberry Pi

HARDWARE REQUIREMENTS:
- Raspberry Pi 3B+ or 4
- PIR Sensor (HC-SR501) 
- 3x Ultrasonic Sensors (HC-SR04)
- DHT22 Temperature/Humidity Sensor
- LDR + MCP3008 ADC
- USB Camera
- USB Microphone
- WS2812B LED Strip
- I2C LCD Display

WIRING DIAGRAM:
GPIO 18 - PIR Motion Sensor
GPIO 23 - Ultrasonic Left Trigger
GPIO 24 - Ultrasonic Left Echo  
GPIO 25 - Ultrasonic Center Trigger
GPIO 8  - Ultrasonic Center Echo
GPIO 7  - Ultrasonic Right Trigger
GPIO 1  - Ultrasonic Right Echo
GPIO 4  - DHT22 Data Pin
GPIO 2  - I2C SDA (LCD)
GPIO 3  - I2C SCL (LCD)
GPIO 10 - SPI MOSI (MCP3008)
GPIO 9  - SPI MISO (MCP3008)
GPIO 11 - SPI SCLK (MCP3008)
GPIO 8  - SPI CE0 (MCP3008)
GPIO 18 - WS2812B LED Data

INSTALLATION:
pip install RPi.GPIO gpiozero Adafruit-DHT opencv-python rpi_ws281x RPLCD
"""

import time
import threading
import logging
from typing import Dict, Any, Optional

# Real hardware imports (install on Raspberry Pi)
try:
    import RPi.GPIO as GPIO
    import Adafruit_DHT
    import cv2
    from gpiozero import MotionSensor, MCP3008
    import board
    import neopixel
    from RPLCD.i2c import CharLCD
    HARDWARE_AVAILABLE = True
except ImportError:
    HARDWARE_AVAILABLE = False
    print("⚠️ Hardware libraries not installed. Install on Raspberry Pi:")
    print("pip install RPi.GPIO gpiozero Adafruit-DHT opencv-python rpi_ws281x RPLCD")

class RealIoTSensors:
    def __init__(self):
        self.hardware_ready = HARDWARE_AVAILABLE
        self.running = False
        self.sensor_data = {}
        
        if self.hardware_ready:
            self._setup_hardware()
        else:
            print("❌ Hardware not available - using simulation mode")
    
    def _setup_hardware(self):
        """Initialize all real IoT sensors"""
        try:
            # PIR Motion Sensor
            self.pir = MotionSensor(18)
            print("✅ PIR Motion Sensor initialized (GPIO 18)")
            
            # Ultrasonic Sensors Setup
            self.ultrasonic_sensors = [
                {"name": "left", "trigger": 23, "echo": 24},
                {"name": "center", "trigger": 25, "echo": 8}, 
                {"name": "right", "trigger": 7, "echo": 1}
            ]
            
            GPIO.setmode(GPIO.BCM)
            for sensor in self.ultrasonic_sensors:
                GPIO.setup(sensor["trigger"], GPIO.OUT)
                GPIO.setup(sensor["echo"], GPIO.IN)
            print("✅ 3x Ultrasonic Sensors initialized")
            
            # DHT22 Temperature/Humidity
            self.dht_pin = 4
            self.dht_sensor = Adafruit_DHT.DHT22
            print("✅ DHT22 Temperature/Humidity Sensor initialized (GPIO 4)")
            
            # Light Sensor (LDR via MCP3008 ADC)
            self.light_sensor = MCP3008(channel=0)  # Channel 0 of MCP3008
            print("✅ Light Sensor initialized (MCP3008 Channel 0)")
            
            # Camera
            self.camera = cv2.VideoCapture(0)
            if self.camera.isOpened():
                print("✅ USB Camera initialized")
            else:
                print("❌ Camera not found")
            
            # LED Strip (WS2812B)
            self.led_count = 30
            self.led_strip = neopixel.NeoPixel(board.D18, self.led_count, auto_write=False)
            print("✅ WS2812B LED Strip initialized (30 LEDs)")
            
            # LCD Display (I2C)
            self.lcd = CharLCD('PCF8574', 0x27, cols=20, rows=4)
            self.lcd.clear()
            self.lcd.write_string("HoloMat System\\nInitializing...")
            print("✅ I2C LCD Display initialized (20x4)")
            
            self.hardware_ready = True
            
        except Exception as e:
            print(f"❌ Hardware setup failed: {e}")
            self.hardware_ready = False
    
    def read_motion_sensor(self) -> bool:
        """Read PIR motion sensor"""
        if not self.hardware_ready:
            return False
        try:
            return self.pir.motion_detected
        except Exception as e:
            print(f"Motion sensor error: {e}")
            return False
    
    def read_ultrasonic_distance(self, sensor_index: int) -> float:
        """Read distance from specific ultrasonic sensor"""
        if not self.hardware_ready or sensor_index >= len(self.ultrasonic_sensors):
            return 0.0
        
        try:
            sensor = self.ultrasonic_sensors[sensor_index]
            
            # Send 10µs trigger pulse
            GPIO.output(sensor["trigger"], GPIO.HIGH)
            time.sleep(0.00001)
            GPIO.output(sensor["trigger"], GPIO.LOW)
            
            # Measure echo duration
            pulse_start = time.time()
            pulse_end = time.time()
            
            # Wait for echo start
            timeout = time.time() + 0.1  # 100ms timeout
            while GPIO.input(sensor["echo"]) == 0 and time.time() < timeout:
                pulse_start = time.time()
            
            # Wait for echo end
            timeout = time.time() + 0.1
            while GPIO.input(sensor["echo"]) == 1 and time.time() < timeout:
                pulse_end = time.time()
            
            # Calculate distance (speed of sound = 34300 cm/s)
            pulse_duration = pulse_end - pulse_start
            distance = (pulse_duration * 34300) / 2
            
            # Filter invalid readings
            if 2 <= distance <= 400:
                return round(distance, 1)
            else:
                return 0.0
                
        except Exception as e:
            print(f"Ultrasonic sensor {sensor_index} error: {e}")
            return 0.0
    
    def read_temperature_humidity(self) -> Dict[str, float]:
        """Read DHT22 temperature and humidity"""
        if not self.hardware_ready:
            return {"temperature": 0.0, "humidity": 0.0}
        
        try:
            humidity, temperature = Adafruit_DHT.read_retry(self.dht_sensor, self.dht_pin)
            
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
    
    def read_light_level(self) -> int:
        """Read light sensor (LDR) value"""
        if not self.hardware_ready:
            return 0
        
        try:
            # Read analog value from MCP3008 (0-1023)
            raw_value = self.light_sensor.value * 1023
            # Convert to percentage (0-100%)
            light_percentage = int((raw_value / 1023) * 100)
            return light_percentage
            
        except Exception as e:
            print(f"Light sensor error: {e}")
            return 0
    
    def detect_gesture(self) -> str:
        """Detect hand gestures using 3 ultrasonic sensors"""
        if not self.hardware_ready:
            return "READY"
        
        try:
            # Read all three sensors
            distances = []
            for i in range(3):
                dist = self.read_ultrasonic_distance(i)
                distances.append(dist)
            
            left, center, right = distances
            
            # Gesture recognition logic
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
            elif center < 60:
                return "POINT"
            else:
                return "READY"
                
        except Exception as e:
            print(f"Gesture detection error: {e}")
            return "READY"
    
    def capture_camera_frame(self):
        """Capture frame from USB camera"""
        if not self.hardware_ready or not self.camera.isOpened():
            return None
        
        try:
            ret, frame = self.camera.read()
            return frame if ret else None
        except Exception as e:
            print(f"Camera error: {e}")
            return None
    
    def update_led_strip(self, color=(0, 212, 255), brightness=0.5):
        """Update WS2812B LED strip"""
        if not self.hardware_ready:
            return
        
        try:
            # Set all LEDs to specified color
            for i in range(self.led_count):
                self.led_strip[i] = tuple(int(c * brightness) for c in color)
            self.led_strip.show()
            
        except Exception as e:
            print(f"LED strip error: {e}")
    
    def update_lcd_display(self, line1="", line2="", line3="", line4=""):
        """Update I2C LCD display"""
        if not self.hardware_ready:
            return
        
        try:
            self.lcd.clear()
            lines = [line1, line2, line3, line4]
            for i, line in enumerate(lines):
                if line:
                    self.lcd.cursor_pos = (i, 0)
                    self.lcd.write_string(line[:20])  # Max 20 chars per line
                    
        except Exception as e:
            print(f"LCD display error: {e}")
    
    def start_sensor_monitoring(self):
        """Start continuous sensor monitoring"""
        if not self.hardware_ready:
            print("❌ Hardware not ready - cannot start monitoring")
            return
        
        self.running = True
        
        def monitoring_loop():
            while self.running:
                try:
                    # Read all sensors
                    motion = self.read_motion_sensor()
                    distances = [self.read_ultrasonic_distance(i) for i in range(3)]
                    env_data = self.read_temperature_humidity()
                    light = self.read_light_level()
                    gesture = self.detect_gesture()
                    
                    # Update sensor data
                    self.sensor_data = {
                        "motion": motion,
                        "distances": {"left": distances[0], "center": distances[1], "right": distances[2]},
                        "temperature": env_data["temperature"],
                        "humidity": env_data["humidity"],
                        "light": light,
                        "gesture": gesture,
                        "timestamp": time.time()
                    }
                    
                    # Update LCD with current data
                    self.update_lcd_display(
                        f"Motion: {'YES' if motion else 'NO'}",
                        f"Temp: {env_data['temperature']:.1f}C",
                        f"Light: {light}%",
                        f"Gesture: {gesture}"
                    )
                    
                    # Update LED strip based on motion
                    if motion:
                        self.update_led_strip((0, 255, 0), 0.8)  # Green when motion
                    else:
                        self.update_led_strip((0, 212, 255), 0.3)  # Blue when idle
                    
                    time.sleep(0.1)  # 10Hz update rate
                    
                except Exception as e:
                    print(f"Monitoring loop error: {e}")
                    time.sleep(1)
        
        self.monitoring_thread = threading.Thread(target=monitoring_loop, daemon=True)
        self.monitoring_thread.start()
        print("🔄 Real IoT sensor monitoring started")
    
    def stop_sensor_monitoring(self):
        """Stop sensor monitoring"""
        self.running = False
        if hasattr(self, 'monitoring_thread'):
            self.monitoring_thread.join(timeout=1)
        print("⏹️ Sensor monitoring stopped")
    
    def get_all_sensor_data(self) -> Dict[str, Any]:
        """Get current readings from all sensors"""
        if not self.hardware_ready:
            return {"error": "Hardware not available"}
        
        return self.sensor_data.copy()
    
    def cleanup(self):
        """Cleanup all hardware resources"""
        if self.hardware_ready:
            try:
                if hasattr(self, 'camera'):
                    self.camera.release()
                if hasattr(self, 'lcd'):
                    self.lcd.clear()
                    self.lcd.write_string("System Shutdown")
                GPIO.cleanup()
                print("🧹 Hardware cleanup completed")
            except Exception as e:
                print(f"Cleanup error: {e}")

# Usage Example:
# real_sensors = RealIoTSensors()
# real_sensors.start_sensor_monitoring()
# 
# # Get sensor data
# data = real_sensors.get_all_sensor_data()
# print(data)
# 
# # Cleanup when done
# real_sensors.stop_sensor_monitoring()
# real_sensors.cleanup()

"""
TO SWITCH FROM MOCK TO REAL SENSORS:

1. Install hardware libraries on Raspberry Pi:
   pip install RPi.GPIO gpiozero Adafruit-DHT opencv-python rpi_ws281x RPLCD

2. Connect all sensors according to wiring diagram above

3. In sensors_enhanced.py, replace:
   from hardware.mock_sensors import mock_sensors
   
   With:
   from hardware.real_sensors import RealIoTSensors
   real_sensors = RealIoTSensors()
   real_sensors.start_sensor_monitoring()

4. Update API endpoints to use real_sensors.get_all_sensor_data()

5. Test each sensor individually before full integration
"""