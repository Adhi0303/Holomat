# HoloMat - Project Modules

This document divides the HoloMat IoT Workstation into **10 distinct modules**, each with its own purpose, components, and deliverables.

---

## Module Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           HOLOMAT SYSTEM                                    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│   │ Module 1 │  │ Module 2 │  │ Module 3 │  │ Module 4 │  │ Module 5 │   │
│   │ Proximity│  │  Light   │  │ Gesture  │  │  Face    │  │    AI    │   │
│   │  Sensor  │  │  Sensor  │  │  Control │  │  Auth    │  │  Jarvis  │   │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│        │             │             │             │             │          │
│        └─────────────┴─────────────┴─────────────┴─────────────┘          │
│                                    │                                       │
│                                    ▼                                       │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│   │ Module 6 │  │ Module 7 │  │ Module 8 │  │ Module 9 │  │Module 10 │   │
│   │   LCD    │  │   LED    │  │ Hologram │  │ Backend  │  │ Frontend │   │
│   │ Display  │  │ Lighting │  │   3D     │  │   API    │  │    UI    │   │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Module 1: Proximity Detection System

### Purpose
Automatically wake up the workstation when user approaches.

### Hardware
| Component | Model | Pins |
|-----------|-------|------|
| PIR Motion Sensor | HC-SR501 | GPIO 4 |

### Functionality
- Detect motion within 2-7 meter range
- Trigger system wake-up from sleep mode
- Initiate face recognition sequence
- Time-based cooldown to prevent false triggers

### Software Components
```
src/sensors/pir_motion.py
├── class PIRSensor
│   ├── __init__(pin)
│   ├── start_monitoring()
│   ├── on_motion_detected(callback)
│   └── set_cooldown(seconds)
```

### Deliverables
- [ ] Wired PIR sensor to Pi
- [ ] Python class for PIR reading
- [ ] Event callback system
- [ ] Integration with main controller

---

## Module 2: Ambient Light Sensing

### Purpose
Automatically adjust display and LED brightness based on room lighting.

### Hardware
| Component | Model | Pins |
|-----------|-------|------|
| LDR Sensor | Photoresistor | MCP3008 CH0 |
| ADC Converter | MCP3008 | SPI0 (GPIO 8,9,10,11) |

### Functionality
- Read analog light levels (0-1023)
- Convert to lux values
- Map brightness levels (30%, 60%, 100%)
- Smooth transitions to prevent flicker

### Software Components
```
src/sensors/light_sensor.py
├── class LightSensor
│   ├── __init__(channel)
│   ├── read_raw()
│   ├── read_lux()
│   ├── get_brightness_level()
│   └── on_change(callback, threshold)
```

### Deliverables
- [ ] Wired LDR with MCP3008 ADC
- [ ] SPI communication setup
- [ ] Brightness calculation algorithm
- [ ] Auto-adjustment integration

---

## Module 3: Gesture Control System

### Purpose
Enable touchless UI navigation using hand gestures.

### Hardware
| Component | Model | Pins |
|-----------|-------|------|
| Ultrasonic Sensor 1 (Left) | HC-SR04 | GPIO 17 (Trig), GPIO 27 (Echo) |
| Ultrasonic Sensor 2 (Center) | HC-SR04 | GPIO 22 (Trig), GPIO 23 (Echo) |
| Ultrasonic Sensor 3 (Right) | HC-SR04 | GPIO 24 (Trig), GPIO 25 (Echo) |

### Functionality
| Gesture | Detection Method | Action |
|---------|------------------|--------|
| Swipe Left | S1→S2→S3 trigger sequence | Navigate previous |
| Swipe Right | S3→S2→S1 trigger sequence | Navigate next |
| Push | Decreasing distance on S2 | Select/Confirm |
| Pull | Increasing distance on S2 | Back/Cancel |
| Hover | Stable distance on any | Highlight |

### Software Components
```
src/sensors/ultrasonic.py
├── class UltrasonicSensor
│   ├── __init__(trig_pin, echo_pin)
│   ├── measure_distance()
│   └── is_object_near(threshold)
│
src/sensors/gesture_detector.py
├── class GestureDetector
│   ├── __init__(sensors[])
│   ├── start_detection()
│   ├── on_gesture(callback)
│   └── calibrate()
```

### Deliverables
- [ ] Three ultrasonic sensors wired
- [ ] Distance measurement functions
- [ ] Gesture recognition algorithm
- [ ] Event emission to backend

---

## Module 4: Face Authentication System

### Purpose
Recognize registered users for personalized access control.

### Hardware
| Component | Model | Connection |
|-----------|-------|------------|
| USB Webcam | 1080p | USB Port |

### Functionality
- Capture video frames at 10 FPS
- Detect faces using Haar Cascades
- Encode faces for recognition
- Match against user database
- Return authentication result

### Software Components
```
src/vision/camera_manager.py
├── class CameraManager
│   ├── __init__(camera_id)
│   ├── start_capture()
│   ├── get_frame()
│   └── release()
│
src/vision/face_recognition.py
├── class FaceAuthenticator
│   ├── __init__(database_path)
│   ├── register_user(name, frames[])
│   ├── authenticate(frame)
│   ├── get_known_users()
│   └── delete_user(name)
```

### User Database Schema
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    face_encoding BLOB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Deliverables
- [ ] Camera setup and testing
- [ ] Face detection implementation
- [ ] Face encoding and storage
- [ ] Real-time authentication
- [ ] User registration interface

---

## Module 5: AI Voice Assistant (Jarvis)

### Purpose
Natural language voice interaction for workstation control.

### Hardware
| Component | Model | Connection |
|-----------|-------|------------|
| USB Microphone | Any | USB Port |
| Speaker | 3.5mm | Audio Jack |

### Functionality
| Feature | Technology |
|---------|------------|
| Wake Word | "Hey Jarvis" (Porcupine/Custom) |
| Speech-to-Text | OpenAI Whisper API |
| LLM Processing | GPT-4 API |
| Text-to-Speech | pyttsx3 / gTTS |

### Command Examples
| Voice Command | Action |
|---------------|--------|
| "Hey Jarvis, what time is it?" | Speaks current time |
| "Hey Jarvis, dim the lights" | Reduce LED brightness |
| "Hey Jarvis, show me sensor data" | Navigate to sensor view |
| "Hey Jarvis, who am I?" | Speak authenticated user name |

### Software Components
```
src/ai/jarvis.py
├── class Jarvis
│   ├── __init__(openai_key)
│   ├── process_command(text)
│   ├── execute_action(intent)
│   └── speak(response)
│
src/ai/speech_to_text.py
├── class SpeechRecognizer
│   ├── start_listening()
│   ├── detect_wake_word()
│   └── transcribe()
│
src/ai/text_to_speech.py
├── class VoiceSynthesizer
│   ├── speak(text)
│   └── set_voice(name)
```

### Deliverables
- [ ] Microphone input setup
- [ ] Wake word detection
- [ ] OpenAI API integration
- [ ] Voice synthesis output
- [ ] Command parsing logic

---

## Module 6: LCD Notification Display

### Purpose
Display time, date, system status, and alerts on dedicated panels.

### Hardware
| Component | Model | Address | Pins |
|-----------|-------|---------|------|
| LCD Panel 1 | 20x4 I2C | 0x27 | SDA/SCL |
| LCD Panel 2 | 20x4 I2C | 0x3F | SDA/SCL |

### Display Layout

**Panel 1: Time & Info**
```
┌────────────────────┐
│ 20:54    SUN       │
│ December 29, 2024  │
│ Chennai   28°C     │
│ Partly Cloudy      │
└────────────────────┘
```

**Panel 2: System Status**
```
┌────────────────────┐
│ CPU: 45%  MEM: 62% │
│ Temp: 52°C         │
│ User: Suriya       │
│ Status: ACTIVE     │
└────────────────────┘
```

### Software Components
```
src/display/lcd_panels.py
├── class LCDManager
│   ├── __init__(addresses[])
│   ├── write_line(panel, line, text)
│   ├── clear(panel)
│   ├── show_time()
│   ├── show_status(data)
│   └── show_notification(message)
```

### Deliverables
- [ ] I2C LCD wiring
- [ ] RPLCD library setup
- [ ] Time/date display
- [ ] System stats display
- [ ] Notification scrolling

---

## Module 7: Ambient LED Lighting

### Purpose
Create immersive Iron Man aesthetic with reactive RGB lighting.

### Hardware
| Component | Model | Pins |
|-----------|-------|------|
| LED Strip | WS2812B (60 LEDs/m) | GPIO 18 (PWM) |
| Power Supply | 5V 3A | External |

### LED Modes
| Mode | Pattern | Trigger |
|------|---------|---------|
| Idle | Slow blue pulse | System standby |
| Active | Steady cyan glow | User authenticated |
| Alert | Orange flash | Notifications |
| Voice | Audio-reactive pulse | Jarvis speaking |
| Loading | Rotating animation | Processing |

### Color Patterns
```python
COLORS = {
    "arc_blue": (0, 212, 255),
    "gold": (255, 215, 0),
    "alert_orange": (255, 107, 0),
    "success_green": (0, 255, 136),
    "off": (0, 0, 0)
}
```

### Software Components
```
src/display/led_controller.py
├── class LEDController
│   ├── __init__(pin, num_leds)
│   ├── set_color(r, g, b)
│   ├── set_mode(mode_name)
│   ├── pulse(color, speed)
│   ├── wave(colors[], speed)
│   └── set_brightness(level)
```

### Deliverables
- [ ] LED strip wiring with level shifter
- [ ] WS2812B library setup
- [ ] Animation patterns
- [ ] Mode switching logic
- [ ] Brightness integration with LDR

---

## Module 8: 3D Hologram Visualization

### Purpose
Display interactive 3D content with holographic projection effect.

### Hardware
| Component | Purpose |
|-----------|---------|
| Monitor/Projector | Display 3D content |
| Acrylic Sheet (45°) | Pepper's Ghost reflection |
| Frame/Mount | Hold acrylic at angle |

### Hologram Setup
```
      [MONITOR/PROJECTOR]
              │
              ▼
        ┌──────────┐
        │  45°     │ ← Acrylic/Glass
        │   /      │
        └──────────┘
              │
         [VIEWING]
```

### 3D Content Types
| Content | Description |
|---------|-------------|
| HUD Elements | Iron Man-style interface overlays |
| 3D Models | Rotating objects, wireframes |
| Sensor Data | Real-time 3D graphs |
| Animations | Welcome sequences, alerts |

### Software Components
```
frontend/src/components/
├── Hologram3D.tsx
│   ├── Scene setup (Three.js)
│   ├── Camera controls
│   ├── Model loader
│   └── Animation loop
│
├── HUDOverlay.tsx
│   ├── Iron Man UI elements
│   ├── Circular meters
│   └── Scan lines effect
```

### Deliverables
- [ ] Three.js scene setup
- [ ] 3D model loading
- [ ] HUD overlay design
- [ ] Gesture-based rotation
- [ ] Hologram frame construction

---

## Module 9: Backend API Server

### Purpose
Central server managing all modules, processes, and communication.

### Technology
| Component | Technology |
|-----------|------------|
| Framework | FastAPI (Python) |
| Async | asyncio |
| Parallelism | multiprocessing |
| Real-time | WebSocket |
| Database | SQLite |

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/status` | System status |
| GET | `/api/sensors` | All sensor readings |
| GET | `/api/user` | Current user info |
| POST | `/api/led/mode` | Change LED mode |
| POST | `/api/jarvis/speak` | TTS command |
| WS | `/ws` | Real-time events |

### Process Architecture
```
Main Process (FastAPI)
    ├── Sensor Process (Core 1)
    ├── Vision Process (Core 2)
    └── AI Process (Core 3)
```

### Software Components
```
backend/
├── main.py              # Entry point
├── config.py            # Settings
├── api/
│   ├── routes.py        # REST endpoints
│   └── websocket.py     # WS handlers
├── processes/
│   ├── sensor_process.py
│   ├── vision_process.py
│   └── ai_process.py
└── models/
    └── events.py        # Pydantic models
```

### Deliverables
- [ ] FastAPI project setup
- [ ] REST API endpoints
- [ ] WebSocket implementation
- [ ] Multiprocessing setup
- [ ] Inter-process communication

---

## Module 10: Frontend User Interface

### Purpose
Modern, responsive web UI with 3D hologram integration.

### Technology
| Component | Technology |
|-----------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| 3D | Three.js + React Three Fiber |
| Styling | CSS + Framer Motion |
| State | Zustand |
| Real-time | WebSocket |

### UI Screens
| Screen | Content |
|--------|---------|
| Welcome | Face scan animation, greeting |
| Dashboard | Main HUD, sensor panels |
| Hologram | 3D model viewer |
| Settings | User preferences |
| Jarvis | Voice interaction UI |

### Iron Man Theme
```css
:root {
    --primary: #00D4FF;
    --secondary: #FFD700;
    --background: #1A1A2E;
    --panel: #16213E;
    --text: #FFFFFF;
    --accent: #00F5FF;
}
```

### Software Components
```
frontend/src/
├── App.tsx
├── components/
│   ├── Dashboard.tsx
│   ├── SensorPanel.tsx
│   ├── Hologram3D.tsx
│   ├── VoiceButton.tsx
│   └── StatusBar.tsx
├── hooks/
│   ├── useWebSocket.ts
│   └── useSensors.ts
├── stores/
│   └── appStore.ts
└── styles/
    └── ironman.css
```

### Deliverables
- [ ] React + Vite project setup
- [ ] Iron Man CSS theme
- [ ] Dashboard layout
- [ ] WebSocket integration
- [ ] Three.js 3D scene
- [ ] Responsive design

---

## Module Dependencies

```
Module 1 (PIR) ──────────────────┐
Module 2 (LDR) ──────────────────┼──► Module 9 (Backend) ──► Module 10 (Frontend)
Module 3 (Gesture) ──────────────┤              │
Module 4 (Face) ─────────────────┤              │
Module 5 (Jarvis) ───────────────┘              │
                                                │
Module 6 (LCD) ◄────────────────────────────────┤
Module 7 (LED) ◄────────────────────────────────┤
Module 8 (Hologram) ◄───────────────────────────┘
```

---

## Implementation Order

| Order | Module | Reason |
|-------|--------|--------|
| 1 | Module 9: Backend | Foundation for all communication |
| 2 | Module 1: PIR | Simple, validates GPIO setup |
| 3 | Module 2: LDR | Tests SPI/ADC |
| 4 | Module 3: Gesture | Multiple sensors working together |
| 5 | Module 6: LCD | Visual feedback for testing |
| 6 | Module 7: LED | Aesthetic feedback |
| 7 | Module 4: Face | Complex vision module |
| 8 | Module 5: Jarvis | AI integration |
| 9 | Module 10: Frontend | Main UI |
| 10 | Module 8: Hologram | Final integration |

---

## Progress Tracker

| Module | Status | Completion |
|--------|--------|------------|
| 1. Proximity Detection | ⬜ Not Started | 0% |
| 2. Ambient Light Sensing | ⬜ Not Started | 0% |
| 3. Gesture Control | ⬜ Not Started | 0% |
| 4. Face Authentication | ⬜ Not Started | 0% |
| 5. AI Voice Assistant | ⬜ Not Started | 0% |
| 6. LCD Notification | ⬜ Not Started | 0% |
| 7. Ambient LED | ⬜ Not Started | 0% |
| 8. 3D Hologram | ⬜ Not Started | 0% |
| 9. Backend API | ⬜ Not Started | 0% |
| 10. Frontend UI | ⬜ Not Started | 0% |
