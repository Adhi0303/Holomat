# HoloMat - Pending Modules for Team Assignment

**Last Updated:** January 8, 2026  
**Project Status:** Frontend ~70% complete, Backend 0%, Hardware 0%

---

## Quick Reference

| Module | Status | Complexity | Assignee |
|--------|--------|------------|----------|
| 1. PIR Proximity Sensor | 🔴 Not Started | Easy | ________ |
| 2. LDR Light Sensor | 🔴 Not Started | Medium | ________ |
| 3. Gesture Control | 🔴 Not Started | Hard | ________ |
| 4. Face Authentication | 🟡 Partial (Frontend Mock) | Hard | ________ |
| 5. AI Voice Assistant | 🟡 Partial (Browser TTS) | Medium | ________ |
| 6. LCD Display | 🔴 Not Started | Medium | ________ |
| 7. LED Lighting | 🔴 Not Started | Medium | ________ |
| 8. 3D Hologram | 🟢 Mostly Done | Easy | ________ |
| 9. Backend API Server | 🔴 Not Started | Hard | ________ |
| 10. Frontend UI | 🟢 Mostly Done | Easy | ________ |

---

## What's Already Implemented ✅

### Frontend UI (Module 10)
- ✅ React + Vite + TypeScript project
- ✅ Iron Man themed CSS (variables, animations)
- ✅ 3D Hologram viewer (Three.js + React Three Fiber)
- ✅ Zustand state management
- ✅ Voice assistant hook (Web Speech API)
- ✅ Face detection hook (TensorFlow.js mock)
- ✅ Screens: Standby, Scanning, Welcome
- ✅ Components: Header, JarvisPanel, SensorStatus, SystemStats
- ✅ Groq AI integration for Jarvis responses

### What's Missing
- ❌ WebSocket connection to backend
- ❌ Dashboard screen
- ❌ Settings screen
- ❌ Real sensor data (currently mocked)

---

## 🔴 MODULE 1: PIR Proximity Sensor

### Status: Not Started

### What Needs to Be Done
Create a Python module that detects motion using the HC-SR501 PIR sensor and triggers the system wake-up sequence.

### Hardware Requirements
| Component | Pins |
|-----------|------|
| HC-SR501 PIR Sensor | GPIO 4 |

### Tasks
1. **Wire the PIR sensor** to Raspberry Pi GPIO 4
2. **Create Python module** `src/sensors/pir_motion.py`
3. **Implement PIRSensor class** with:
   - `start_monitoring()` - Begin motion detection loop
   - `on_motion_detected(callback)` - Trigger callback when motion detected
   - `set_cooldown(seconds)` - Prevent repeated triggers
4. **Test with LED** - Make LED turn on when motion detected
5. **Integrate with backend** - Send motion event via queue

### File to Create
```
backend/src/sensors/pir_motion.py
```

### Dependencies
```bash
pip install RPi.GPIO gpiozero
```

### Acceptance Criteria
- [ ] Motion detected within 2-7 meters
- [ ] Callback fired within 100ms of motion
- [ ] Cooldown prevents rapid re-triggering
- [ ] Events logged to console

### Reference Code
```python
from gpiozero import MotionSensor
from signal import pause

pir = MotionSensor(4)

def on_motion():
    print("Motion detected!")

pir.when_motion = on_motion
pause()
```

---

## 🔴 MODULE 2: LDR Ambient Light Sensor

### Status: Not Started

### What Needs to Be Done
Read ambient light levels using an LDR sensor with MCP3008 ADC and auto-adjust display/LED brightness.

### Hardware Requirements
| Component | Pins |
|-----------|------|
| LDR + 10kΩ Resistor | MCP3008 CH0 |
| MCP3008 ADC | SPI0 (GPIO 8,9,10,11) |

### Tasks
1. **Wire MCP3008** to SPI bus with LDR on Channel 0
2. **Enable SPI** on Raspberry Pi (`sudo raspi-config`)
3. **Create Python module** `src/sensors/light_sensor.py`
4. **Implement LightSensor class** with:
   - `read_raw()` - Get raw ADC value (0-1023)
   - `read_percentage()` - Convert to 0-100%
   - `get_brightness_level()` - Return "low", "medium", "high"
   - `on_change(callback, threshold)` - Fire when light changes
5. **Integrate with LED module** for auto-brightness

### File to Create
```
backend/src/sensors/light_sensor.py
```

### Dependencies
```bash
pip install spidev
```

### Acceptance Criteria
- [ ] ADC reads 0-1023 values
- [ ] Brightness mapped to 3 levels
- [ ] Smooth transitions (no flicker)
- [ ] Updates sent every 500ms

### Wiring Diagram
```
LDR ──┬── 3.3V
      │
      ├── MCP3008 CH0
      │
     10kΩ
      │
     GND
```

---

## 🔴 MODULE 3: Gesture Control System

### Status: Not Started

### What Needs to Be Done
Enable touchless UI navigation using 3 ultrasonic sensors to detect swipe, push, and pull gestures.

### Hardware Requirements
| Sensor | Trigger Pin | Echo Pin |
|--------|-------------|----------|
| Left | GPIO 17 | GPIO 27 |
| Center | GPIO 22 | GPIO 23 |
| Right | GPIO 24 | GPIO 25 |

### Tasks
1. **Wire 3 HC-SR04 sensors** in left-center-right arrangement
2. **Create UltrasonicSensor class** - Read distance from single sensor
3. **Create GestureDetector class** - Combine all 3 sensors
4. **Implement gesture recognition:**
   - Swipe Left: S1→S2→S3 trigger in sequence
   - Swipe Right: S3→S2→S1 trigger in sequence
   - Push: Decreasing distance on center sensor
   - Pull: Increasing distance on center sensor
5. **Send gestures to backend** via event queue

### Files to Create
```
backend/src/sensors/ultrasonic.py
backend/src/sensors/gesture_detector.py
```

### Dependencies
```bash
pip install gpiozero
```

### Gesture Detection Logic
```python
# Swipe Left: Objects pass Left → Center → Right
# Within 500ms window, if all 3 sensors triggered in order

# Push: Center sensor distance decreases rapidly
# Pull: Center sensor distance increases rapidly
```

### Acceptance Criteria
- [ ] Distance accurate within ±2cm
- [ ] Gestures detected with >90% accuracy
- [ ] Response time <200ms
- [ ] No false positives from ambient movement

---

## 🟡 MODULE 4: Face Authentication System

### Status: Partial (Frontend has TensorFlow.js mock)

### What Needs to Be Done
Implement server-side face recognition using OpenCV for user authentication.

### Hardware Requirements
| Component | Connection |
|-----------|------------|
| USB Webcam 1080p | USB Port |

### Current Implementation
- Frontend has `useFaceDetection.ts` using TensorFlow.js (browser-based)
- This is for demo only, needs server-side for real authentication

### Tasks
1. **Set up USB camera** on Raspberry Pi
2. **Create CameraManager class** - Handle video capture
3. **Create FaceAuthenticator class** with:
   - `register_user(name, frames[])` - Store face encoding
   - `authenticate(frame)` - Match face to database
   - `get_known_users()` - List registered users
   - `delete_user(name)` - Remove user
4. **Create user database** (SQLite) for face encodings
5. **API endpoint** for authentication status

### Files to Create
```
backend/src/vision/camera_manager.py
backend/src/vision/face_authenticator.py
backend/database/users.db (SQLite)
```

### Dependencies
```bash
pip install opencv-python face-recognition numpy
```

### Database Schema
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    face_encoding BLOB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Acceptance Criteria
- [ ] Face detected within 5 seconds
- [ ] Recognition accuracy >95%
- [ ] Multiple users supported
- [ ] Unknown faces rejected

---

## 🟡 MODULE 5: AI Voice Assistant (Jarvis)

### Status: Partial (Frontend Groq integration done)

### What Needs to Be Done
Add server-side wake word detection and text-to-speech using Python.

### Current Implementation
- ✅ Frontend uses Web Speech API for STT/TTS
- ✅ Groq AI integration for responses
- ❌ No wake word detection ("Hey Jarvis")
- ❌ No server-side TTS (browser-dependent)

### Tasks
1. **Add wake word detection** using Porcupine or Snowboy
2. **Server-side TTS** using pyttsx3 or Edge TTS
3. **Audio playback** through 3.5mm speaker
4. **Command parsing** for system actions
5. **API endpoint** for voice commands

### Files to Create
```
backend/src/ai/speech_to_text.py
backend/src/ai/text_to_speech.py
backend/src/ai/wake_word.py
```

### Dependencies
```bash
pip install pyttsx3 pvporcupine edge-tts pyaudio
```

### System Actions to Implement
| Command | Action |
|---------|--------|
| "dim the lights" | LED brightness 30% |
| "bright mode" | LED brightness 100% |
| "change model to sphere" | Frontend model change |
| "what's my CPU usage" | Read system stats |
| "goodnight" | System standby |

### Acceptance Criteria
- [ ] Wake word detected >90% accuracy
- [ ] Response latency <3 seconds
- [ ] TTS audible through speaker
- [ ] System commands executed

---

## 🔴 MODULE 6: LCD Notification Display

### Status: Not Started

### What Needs to Be Done
Display time, date, weather, and system status on two I2C LCD panels.

### Hardware Requirements
| Component | I2C Address | Pins |
|-----------|-------------|------|
| LCD Panel 1 | 0x27 | SDA/SCL (GPIO 2/3) |
| LCD Panel 2 | 0x3F | SDA/SCL (GPIO 2/3) |

### Tasks
1. **Wire LCD panels** to I2C bus (parallel connection)
2. **Enable I2C** on Raspberry Pi (`sudo raspi-config`)
3. **Create LCDManager class** with:
   - `write_line(panel, line, text)` - Write to specific line
   - `clear(panel)` - Clear display
   - `show_time()` - Display current time/date
   - `show_status(cpu, ram, temp)` - Show system stats
   - `show_notification(message, duration)` - Temporary message
4. **Scrolling text** for long messages
5. **Integration with backend** for real-time updates

### File to Create
```
backend/src/display/lcd_panels.py
```

### Dependencies
```bash
pip install RPLCD smbus2
```

### Display Layout
**Panel 1 (Time):**
```
┌────────────────────┐
│ 20:54    SUN       │
│ December 29, 2024  │
│ Chennai   28°C     │
│ Partly Cloudy      │
└────────────────────┘
```

**Panel 2 (Status):**
```
┌────────────────────┐
│ CPU: 45%  MEM: 62% │
│ Temp: 52°C         │
│ User: Suriya       │
│ Status: ACTIVE     │
└────────────────────┘
```

### Acceptance Criteria
- [ ] Both LCDs addressable
- [ ] Time updates every second
- [ ] System stats update every 5 seconds
- [ ] Custom characters for icons

---

## 🔴 MODULE 7: Ambient LED Lighting

### Status: Not Started

### What Needs to Be Done
Control WS2812B RGB LED strip for Iron Man aesthetic lighting effects.

### Hardware Requirements
| Component | Pins |
|-----------|------|
| WS2812B LED Strip (60 LEDs) | GPIO 18 (PWM) |
| Level Shifter (3.3V→5V) | Between Pi and LEDs |
| 5V 3A Power Supply | External |

### Tasks
1. **Wire LED strip** with level shifter to GPIO 18
2. **Create LEDController class** with:
   - `set_color(r, g, b)` - Set all LEDs to color
   - `set_mode(mode_name)` - Apply preset mode
   - `pulse(color, speed)` - Breathing effect
   - `wave(colors[], speed)` - Moving color wave
   - `set_brightness(level)` - 0-100%
3. **Implement modes:**
   - Idle: Slow blue pulse
   - Active: Steady cyan glow
   - Alert: Orange flash
   - Voice: Audio-reactive
   - Loading: Rotating animation
4. **Integration with LDR** for auto-brightness

### File to Create
```
backend/src/display/led_controller.py
```

### Dependencies
```bash
sudo pip install rpi_ws281x adafruit-circuitpython-neopixel
```

### Color Palette
```python
COLORS = {
    "arc_blue": (0, 212, 255),
    "gold": (255, 215, 0),
    "alert_orange": (255, 107, 0),
    "success_green": (0, 255, 136),
}
```

### Acceptance Criteria
- [ ] All 60 LEDs individually addressable
- [ ] Smooth animations at 60 FPS
- [ ] Brightness responds to LDR
- [ ] Multiple modes work correctly

---

## 🟢 MODULE 8: 3D Hologram Visualization

### Status: Mostly Complete

### What's Done
- ✅ Three.js scene with hologram rendering
- ✅ Multiple 3D models (Cube, Sphere, Torus, ArcReactor)
- ✅ Grid floor and particle effects
- ✅ Holographic material/shaders
- ✅ Model selector UI

### What's Remaining
1. **Gesture-based rotation** - Connect to ultrasonic sensors
2. **Load custom 3D models** - GLTF/OBJ file support
3. **Build physical hologram frame**:
   - 45° acrylic sheet
   - Projector/monitor mounting
   - Frame construction

### Files Implemented
```
frontend UI/src/components/HologramScene.tsx
frontend UI/src/components/HologramViewer.tsx
```

### Physical Setup Task
```
      [MONITOR/PROJECTOR]
              │
              ▼
        ┌──────────┐
        │  45°     │ ← Acrylic/Glass Sheet
        │   /      │
        └──────────┘
              │
         [VIEWING AREA]
```

### Acceptance Criteria
- [ ] Physical frame built
- [ ] Pepper's Ghost effect working
- [ ] Gestures rotate 3D model
- [ ] Custom models loadable

---

## 🔴 MODULE 9: Backend API Server

### Status: Not Started (CRITICAL - Blocking Other Modules)

### What Needs to Be Done
Create the FastAPI backend that orchestrates all modules and communicates with frontend.

### Tasks
1. **Set up FastAPI project** structure
2. **Create REST API endpoints:**
   - `GET /api/status` - System health
   - `GET /api/sensors` - All sensor readings
   - `GET /api/user` - Current authenticated user
   - `POST /api/led/mode` - Change LED mode
   - `POST /api/jarvis/command` - Send voice command
3. **Implement WebSocket** for real-time data:
   - `WS /ws` - Bidirectional event stream
4. **Multiprocessing** for parallel tasks:
   - Sensor Process (Core 1)
   - Vision Process (Core 2)
   - AI Process (Core 3)
5. **Inter-process communication** using queues

### Project Structure
```
backend/
├── main.py              # Entry point
├── config.py            # Settings
├── requirements.txt     # Dependencies
├── api/
│   ├── routes.py        # REST endpoints
│   └── websocket.py     # WS handlers
├── processes/
│   ├── sensor_process.py
│   ├── vision_process.py
│   └── ai_process.py
├── src/
│   ├── sensors/         # Modules 1-3
│   ├── vision/          # Module 4
│   ├── ai/              # Module 5
│   └── display/         # Modules 6-7
└── database/
    └── users.db         # SQLite
```

### Dependencies
```bash
pip install fastapi uvicorn websockets python-multipart pydantic
```

### WebSocket Event Types
```json
{
    "type": "motion_detected",
    "data": {"timestamp": 1234567890}
}

{
    "type": "gesture",
    "data": {"gesture": "swipe_left"}
}

{
    "type": "face_recognized",
    "data": {"user": "Suriya", "confidence": 0.98}
}
```

### Acceptance Criteria
- [ ] FastAPI server runs on Pi
- [ ] All REST endpoints working
- [ ] WebSocket connection from frontend
- [ ] Multiprocessing utilizes all 4 cores
- [ ] 24+ hours stable uptime

---

## 🟢 MODULE 10: Frontend User Interface

### Status: Mostly Complete

### What's Done
- ✅ React + Vite + TypeScript
- ✅ Iron Man CSS theme
- ✅ 3D Hologram viewer (Three.js)
- ✅ Voice assistant UI (JarvisPanel)
- ✅ State management (Zustand)
- ✅ Screens: Standby, Scanning, Welcome
- ✅ Components: SensorStatus, SystemStats, UserProfile

### What's Remaining
1. **WebSocket client** - Connect to backend
2. **Dashboard screen** - Main control center
3. **Settings screen** - User preferences
4. **Real sensor data** - Replace mock data

### Files to Modify
```
frontend UI/src/hooks/useWebSocket.ts (CREATE)
frontend UI/src/screens/DashboardScreen.tsx (CREATE)
frontend UI/src/screens/SettingsScreen.tsx (CREATE)
```

### WebSocket Hook Implementation
```typescript
// useWebSocket.ts
export function useWebSocket() {
    const [socket, setSocket] = useState<WebSocket | null>(null)
    const { updateSensor, setUser } = useAppStore()

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/ws')
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            // Handle different event types
        }
        setSocket(ws)
    }, [])
}
```

### Acceptance Criteria
- [ ] WebSocket connected to backend
- [ ] Real sensor data displayed
- [ ] All screens navigable
- [ ] Responsive on different devices

---

## Implementation Priority Order

| Priority | Module | Reason | Estimated Time |
|----------|--------|--------|----------------|
| **1** | Module 9: Backend | Foundation for all other modules | 3-4 days |
| **2** | Module 1: PIR | Simple, validates GPIO setup | 1 day |
| **3** | Module 2: LDR | Tests SPI/ADC communication | 1 day |
| **4** | Module 6: LCD | Visual feedback for debugging | 1-2 days |
| **5** | Module 7: LED | Aesthetic feedback | 1-2 days |
| **6** | Module 3: Gesture | More complex sensor integration | 2-3 days |
| **7** | Module 4: Face | Vision processing | 2-3 days |
| **8** | Module 5: Jarvis | AI integration | 2 days |
| **9** | Module 8: Hologram | Physical construction | 1-2 days |
| **10** | Module 10: Frontend | Final integration | 1-2 days |

---

## Team Assignment Template

Copy this section and assign each module to a team member:

```
TEAM ASSIGNMENTS
================

Module 1 (PIR Sensor):      __________________
Module 2 (LDR Sensor):      __________________
Module 3 (Gesture):         __________________
Module 4 (Face Auth):       __________________
Module 5 (AI Jarvis):       __________________
Module 6 (LCD Display):     __________________
Module 7 (LED Lighting):    __________________
Module 8 (Hologram):        __________________
Module 9 (Backend API):     __________________ (Critical!)
Module 10 (Frontend):       __________________
```

---

## Communication Channels

For each module, report progress on:
- [ ] Hardware wiring complete
- [ ] Python module created
- [ ] Unit tests passing
- [ ] Integrated with backend
- [ ] Documentation updated

**Git Branch Naming:** `feature/module-{number}-{short-name}`

Example: `feature/module-1-pir-sensor`
