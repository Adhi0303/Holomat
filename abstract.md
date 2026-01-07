# HoloMat - Project Abstract

## Iron Man-Inspired IoT Workstation

**HoloMat** is an intelligent, sensor-driven workstation inspired by Tony Stark's lab from the Iron Man universe. The project combines cutting-edge IoT technology, artificial intelligence, and immersive 3D visualization to create a futuristic engineering workspace that responds to the user's presence, voice, and gestures.

---

## Vision

To build a self-aware workstation that:
- **Awakens** when you approach
- **Recognizes** your face and greets you by name
- **Listens** to voice commands via J.A.R.V.I.S. AI assistant
- **Responds** to hand gestures for touchless control
- **Displays** interactive 3D holograms
- **Adapts** to ambient lighting conditions

---

## Core Features

| Feature | Technology | Description |
|---------|------------|-------------|
| **Proximity Wake-Up** | PIR Sensor (HC-SR501) | Auto-activates when motion detected within 2m |
| **Face Authentication** | OpenCV + face_recognition | Identifies registered users for personalized access |
| **Gesture Control** | 3× Ultrasonic Sensors (HC-SR04) | Swipe, push, pull gestures for UI navigation |
| **AI Voice Assistant** | Groq LLM + Web Speech API | Natural language interaction with "Jarvis" personality |
| **3D Hologram Display** | Three.js + Projection | Interactive 3D models with Iron Man aesthetic |
| **Ambient Intelligence** | LDR Sensor + WS2812B LEDs | Auto-brightness and reactive RGB lighting |
| **System Monitoring** | LCD Panels (20×4 I2C) | Real-time display of time, weather, and system stats |

---

## Technology Stack

### Hardware
- **Controller:** Raspberry Pi 3B+
- **Sensors:** PIR, Ultrasonic (×3), LDR, USB Camera, USB Microphone
- **Output:** Monitor, Projector, LCD Panels, RGB LED Strip, Speaker

### Software
- **Backend:** Python 3.11+ with FastAPI
- **Frontend:** React 18 + TypeScript + Vite
- **3D Engine:** Three.js with React Three Fiber
- **AI/LLM:** Groq API (openai/gpt-oss-120b)
- **Vision:** OpenCV + face_recognition
- **Speech:** Web Speech API (STT/TTS)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Browser)                    │
│         React + Three.js + WebSocket + Voice            │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP / WebSocket
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Raspberry Pi)                  │
│                     FastAPI Server                       │
│  ┌─────────────┬──────────────┬──────────────────────┐  │
│  │   Sensors   │    Vision    │         AI           │  │
│  │  (GPIO/SPI) │   (Camera)   │   (Groq/OpenAI)      │  │
│  └─────────────┴──────────────┴──────────────────────┘  │
│             Hardware Control: GPIO • I2C • USB          │
└─────────────────────────────────────────────────────────┘
```

---

## Project Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Setup & Sensors | Week 1-2 | Pi configuration, sensor wiring |
| Vision & Auth | Week 3-4 | Face recognition system |
| AI Integration | Week 5 | Jarvis voice assistant |
| Display & UI | Week 6-7 | Hologram, LCD, LEDs, Frontend |
| Integration | Week 8 | Complete system, testing, demo |

---

## Success Metrics

- ✅ Motion wake-up: 100% reliability
- ✅ Face recognition: >95% accuracy
- ✅ Gesture control: >90% accuracy
- ✅ Voice response: <3 second latency
- ✅ 3D rendering: >30 FPS
- ✅ System stability: >24 hours uptime

---

## Author

**Suriya**  
December 2024 - January 2025

---

*"Sometimes you gotta run before you can walk."* — Tony Stark
