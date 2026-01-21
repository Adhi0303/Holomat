# 🔌 IoT Sensor Hardware Connection & Data Flow

## 🛠️ Physical Hardware Setup

### Yes, ALL sensors connect to breadboard/Raspberry Pi simultaneously:

```
┌─────────────────────────────────────────────────────────────┐
│                    RASPBERRY PI 3B+                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   GPIO PINS                              │ │
│  │  2  4  6  8  10 12 14 16 18 20 22 24 26 28 30 32 34 36 │ │
│  │  1  3  5  7  9  11 13 15 17 19 21 23 25 27 29 31 33 35 │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BREADBOARD                              │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ HC-SR04 #1  │  │ HC-SR04 #2  │  │ HC-SR04 #3  │         │
│  │ (LEFT)      │  │ (CENTER)    │  │ (RIGHT)     │         │
│  │ Trig: GPIO23│  │ Trig: GPIO25│  │ Trig: GPIO7 │         │
│  │ Echo: GPIO24│  │ Echo: GPIO8 │  │ Echo: GPIO1 │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   DHT22     │  │ PIR HC-SR501│  │    LDR      │         │
│  │ Data: GPIO4 │  │ Out: GPIO18 │  │ → MCP3008   │         │
│  │ VCC: 3.3V   │  │ VCC: 5V     │  │ → GPIO10-11 │         │
│  │ GND: GND    │  │ GND: GND    │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │ WS2812B LED │  │  LCD 20x4   │                          │
│  │ Data: GPIO18│  │ SDA: GPIO2  │                          │
│  │ VCC: 5V     │  │ SCL: GPIO3  │                          │
│  │ GND: GND    │  │ VCC: 5V     │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  USB CAMERA     │
                    │  USB MICROPHONE │
                    │  USB SPEAKER    │
                    └─────────────────┘
```

## 📊 Complete Data Flow Process

### 1. 🔌 Hardware Layer (Physical Sensors)
```python
# All sensors connected and reading simultaneously
PIR_SENSOR → GPIO18 → Motion Detection (True/False)
ULTRASONIC_1 → GPIO23/24 → Distance Left (cm)
ULTRASONIC_2 → GPIO25/8 → Distance Center (cm)  
ULTRASONIC_3 → GPIO7/1 → Distance Right (cm)
DHT22 → GPIO4 → Temperature (°C) + Humidity (%)
LDR → MCP3008 → GPIO10/11 → Light Level (0-100%)
USB_CAMERA → USB Port → Video Stream
USB_MIC → USB Port → Audio Stream
```

### 2. 🐍 Python Hardware Interface
```python
# /hardware/real_sensors.py
class RealIoTSensors:
    def __init__(self):
        # Initialize ALL sensors at startup
        self.pir = MotionSensor(18)
        self.ultrasonic_left = {"trigger": 23, "echo": 24}
        self.ultrasonic_center = {"trigger": 25, "echo": 8}
        self.ultrasonic_right = {"trigger": 7, "echo": 1}
        self.dht22 = DHT22(4)
        self.light_sensor = MCP3008(0)
        self.camera = cv2.VideoCapture(0)
        
    def read_all_sensors(self):
        # Read ALL sensors every 100ms
        return {
            "motion": self.pir.motion_detected,
            "distances": {
                "left": self.read_ultrasonic(0),
                "center": self.read_ultrasonic(1), 
                "right": self.read_ultrasonic(2)
            },
            "temperature": self.dht22.temperature,
            "humidity": self.dht22.humidity,
            "light": self.light_sensor.value * 100,
            "timestamp": time.time()
        }
```

### 3. 🔄 Continuous Sensor Loop
```python
# Runs in background thread - 10Hz (every 100ms)
def sensor_monitoring_loop():
    while True:
        # Read ALL sensors simultaneously
        sensor_data = real_sensors.read_all_sensors()
        
        # Process gesture detection
        gesture = detect_gesture(sensor_data["distances"])
        sensor_data["gesture"] = gesture
        
        # Update global state
        update_sensor_cache(sensor_data)
        
        # Send to WebSocket clients
        broadcast_to_websocket(sensor_data)
        
        time.sleep(0.1)  # 100ms = 10Hz update rate
```

### 4. 🌐 FastAPI Backend Integration
```python
# /api/sensors_enhanced.py
from hardware.real_sensors import real_sensors

@router.get("/sensors")
def get_sensors():
    # Get latest readings from sensor cache
    data = real_sensors.get_cached_data()
    
    return [
        {"id": "motion", "value": "ACTIVE" if data["motion"] else "IDLE"},
        {"id": "distance", "value": f"{data['distances']['center']} cm"},
        {"id": "temperature", "value": f"{data['temperature']}°C"},
        {"id": "humidity", "value": f"{data['humidity']}%"},
        {"id": "light", "value": f"{data['light']}%"},
        {"id": "gesture", "value": data["gesture"]}
    ]

@router.get("/sensors/measurements")  
def get_measurements():
    # For Measure Mode - detailed readings
    data = real_sensors.get_cached_data()
    return {
        "distance": data["distances"]["center"],
        "angle": calculate_angle(data["distances"]),  # Derived from 3 sensors
        "temperature": data["temperature"],
        "humidity": data["humidity"]
    }
```

### 5. 📡 WebSocket Real-time Updates
```python
# /api/websocket.py
@ws_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    while True:
        # Get fresh sensor data every 2 seconds
        sensor_data = real_sensors.get_cached_data()
        
        # Send to frontend
        await websocket.send_json({
            "type": "sensor_update",
            "payload": format_for_frontend(sensor_data)
        })
        
        await asyncio.sleep(2)  # 2Hz WebSocket updates
```

### 6. 🌐 Frontend Data Reception
```typescript
// /hooks/useWebSocket.ts
const ws = new WebSocket('ws://127.0.0.1:8000/ws')

ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    
    if (data.type === 'sensor_update') {
        // Update React state with real sensor data
        updateSensorState(data.payload)
        
        // Update specific mode displays
        if (currentMode === 'measure') {
            updateMeasurements(data.payload)
        }
    }
}
```

### 7. 🎮 Frontend Display Updates
```typescript
// /components/modes/MeasureMode.tsx
useEffect(() => {
    // Receive real sensor data via WebSocket
    const unsubscribe = subscribeToSensorUpdates((sensorData) => {
        setMeasurements({
            distance: sensorData.distances.center,    // Real ultrasonic reading
            angle: sensorData.calculated_angle,       // Calculated from 3 sensors
            temperature: sensorData.temperature,      // Real DHT22 reading
            humidity: sensorData.humidity            // Real DHT22 reading
        })
    })
    
    return unsubscribe
}, [])
```

## ⚡ Complete Data Flow Timeline

```
0ms:   Sensors read physical environment
10ms:  Python processes raw sensor data  
20ms:  Data cached in backend memory
100ms: Next sensor reading cycle
2000ms: WebSocket sends data to frontend
2010ms: React updates UI components
2020ms: User sees real measurements
```

## 🔧 Hardware Connection Steps

### Step 1: Physical Wiring
```bash
# Connect ALL sensors to Raspberry Pi GPIO pins
PIR Sensor → GPIO 18
Ultrasonic #1 → GPIO 23 (Trigger), GPIO 24 (Echo)
Ultrasonic #2 → GPIO 25 (Trigger), GPIO 8 (Echo)
Ultrasonic #3 → GPIO 7 (Trigger), GPIO 1 (Echo)
DHT22 → GPIO 4
LDR + MCP3008 → GPIO 10, 11 (SPI)
LCD → GPIO 2, 3 (I2C)
LED Strip → GPIO 18
USB Camera → USB Port
USB Microphone → USB Port
```

### Step 2: Software Installation
```bash
# On Raspberry Pi
pip install RPi.GPIO gpiozero Adafruit-DHT opencv-python rpi_ws281x RPLCD
```

### Step 3: Code Switch
```python
# In /api/sensors_enhanced.py
# Change from:
from hardware.mock_sensors import mock_sensors

# To:
from hardware.real_sensors import RealIoTSensors
real_sensors = RealIoTSensors()
real_sensors.start_sensor_monitoring()
```

### Step 4: Deploy & Run
```bash
# On Raspberry Pi
cd holomat-backend
uvicorn main:app --host 0.0.0.0 --port 8000

# On any device with browser
cd "frontend UI"  
npm run dev
# Open http://raspberry-pi-ip:5173
```

## 🎯 Result: Real-time IoT Dashboard

- **All sensors** connected and reading simultaneously
- **10Hz sensor updates** (every 100ms)
- **2Hz frontend updates** (every 2 seconds)
- **Real measurements** in Measure Mode
- **Actual gesture detection** from 3 ultrasonic sensors
- **Environmental monitoring** with real temperature/humidity
- **Motion detection** triggers system wake-up

The same UI you see now with mock data will show **real sensor readings** from your physical IoT setup!