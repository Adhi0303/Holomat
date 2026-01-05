# HoloMat Software Architecture

## Overview

The HoloMat uses a **multi-process Python backend** with a **React + Three.js frontend**, designed for real-time sensor processing and responsive UI on a Raspberry Pi 3B+.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Browser)                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                     React + TypeScript + Vite                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │   Three.js   │  │   WebSocket  │  │     UI       │  │   Voice    │ │ │
│  │  │  3D Render   │  │    Client    │  │  Components  │  │  Recorder  │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                          WebSocket + REST API
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (Raspberry Pi 3B+)                          │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        FastAPI Server (Main)                           │ │
│  │              Async Event Loop • WebSocket Handler • REST API           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│            ┌───────────────────────┼───────────────────────┐                │
│            │                       │                       │                │
│            ▼                       ▼                       ▼                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │  SENSOR PROCESS  │  │  VISION PROCESS  │  │    AI PROCESS    │          │
│  │   (Multiprocess) │  │   (Multiprocess) │  │   (Multiprocess) │          │
│  │                  │  │                  │  │                  │          │
│  │  • PIR Motion    │  │  • Camera Feed   │  │  • OpenAI API    │          │
│  │  • Ultrasonic    │  │  • Face Detect   │  │  • Speech-to-Text│          │
│  │  • Light Sensor  │  │  • Face Recog    │  │  • Text-to-Speech│          │
│  │                  │  │                  │  │  • Command Parse │          │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘          │
│           │                     │                     │                     │
│           └─────────────────────┴─────────────────────┘                     │
│                                 │                                           │
│                    Python Multiprocessing Queues                            │
│                                 │                                           │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                       HARDWARE CONTROL                                 │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                    │ │
│  │  │ LCD Manager │  │ LED Manager │  │GPIO Handler │                    │ │
│  │  │  (I2C Bus)  │  │ (WS2812B)   │  │  (Sensors)  │                    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend (Runs in Browser on any device)

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | React 18 + TypeScript | Component-based UI |
| **Build Tool** | Vite | Fast dev server, hot reload |
| **3D Engine** | Three.js + React Three Fiber | Hologram 3D rendering |
| **Styling** | CSS + Framer Motion | Iron Man aesthetics, animations |
| **State** | Zustand | Lightweight state management |
| **Real-time** | WebSocket | Live sensor data, gesture events |
| **Voice** | Web Audio API | Record audio for Jarvis |

### Backend (Runs on Raspberry Pi 3B+)

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Server** | FastAPI (Python) | Async REST API + WebSocket |
| **Parallelism** | multiprocessing | Separate processes for sensors |
| **Async I/O** | asyncio | Non-blocking operations |
| **GPIO** | gpiozero / RPi.GPIO | Sensor/LED control |
| **Vision** | OpenCV + face_recognition | Camera, face detection |
| **AI** | OpenAI API | Jarvis LLM |
| **Speech** | Whisper API + pyttsx3 | STT + TTS |
| **LCD** | RPLCD | I2C LCD control |
| **LEDs** | rpi_ws281x | Addressable LED strips |
| **Database** | SQLite | User profiles, settings |

---

## Parallel Processing Strategy

### Why Multiprocessing?

The Pi 3B+ has **4 CPU cores**. We use **Python multiprocessing** to:
- Run sensors continuously without blocking the web server
- Process camera frames in parallel
- Handle AI requests without freezing other systems

### Process Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    PROCESS OVERVIEW                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CORE 0: Main Process (FastAPI)                             │
│          └── Async WebSocket + REST API                      │
│          └── Event coordination                              │
│                                                              │
│  CORE 1: Sensor Process                                      │
│          └── PIR polling (50ms interval)                     │
│          └── Ultrasonic readings (100ms)                     │
│          └── LDR readings (500ms)                            │
│          └── Gesture detection algorithm                     │
│                                                              │
│  CORE 2: Vision Process                                      │
│          └── Camera frame capture (10 FPS)                   │
│          └── Face detection + recognition                    │
│          └── Motion tracking (optional)                      │
│                                                              │
│  CORE 3: AI Process                                          │
│          └── Audio capture                                   │
│          └── Speech-to-text (Whisper)                        │
│          └── LLM query (OpenAI)                              │
│          └── Text-to-speech                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Inter-Process Communication

```python
# Shared queues for communication
sensor_queue = multiprocessing.Queue()   # Sensor → Main
vision_queue = multiprocessing.Queue()   # Vision → Main  
ai_queue = multiprocessing.Queue()       # AI → Main
command_queue = multiprocessing.Queue()  # Main → All (commands)
```

---

## Data Flow

### Example: User Approaches Workstation

```
1. PIR Sensor Process
   └── Detects motion
   └── Sends {"event": "motion_detected"} to sensor_queue

2. Main Process (FastAPI)
   └── Reads from sensor_queue
   └── Sends "start_scan" to Vision Process via command_queue
   └── Broadcasts to frontend via WebSocket

3. Vision Process
   └── Activates camera
   └── Runs face detection
   └── Sends {"event": "face_recognized", "user": "Suriya"} to vision_queue

4. Main Process
   └── Updates state: authenticated = true
   └── Sends "greet_user" to AI Process
   └── Broadcasts to frontend: show welcome screen

5. AI Process
   └── Generates greeting with OpenAI
   └── Speaks: "Welcome back, Suriya"

6. Frontend
   └── Receives WebSocket events
   └── Triggers 3D hologram animation
   └── Displays personalized UI
```

---

## Project Structure

```
d:\Projects\Holomat\
├── backend/
│   ├── main.py                 # FastAPI entry point
│   ├── config.py               # Settings & environment
│   ├── processes/
│   │   ├── __init__.py
│   │   ├── sensor_process.py   # Sensor readings loop
│   │   ├── vision_process.py   # Camera + face recognition
│   │   └── ai_process.py       # LLM + voice
│   ├── hardware/
│   │   ├── gpio_manager.py     # GPIO pin management
│   │   ├── lcd_display.py      # I2C LCD control
│   │   └── led_strip.py        # WS2812B control
│   ├── api/
│   │   ├── routes.py           # REST endpoints
│   │   └── websocket.py        # WebSocket handlers
│   ├── models/
│   │   └── events.py           # Pydantic models
│   └── utils/
│       └── logger.py           # Logging setup
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx            # Entry point
│   │   ├── App.tsx             # Main component
│   │   ├── components/
│   │   │   ├── Hologram3D.tsx  # Three.js 3D scene
│   │   │   ├── StatusPanel.tsx # System status
│   │   │   ├── VoiceButton.tsx # Jarvis trigger
│   │   │   └── GestureOverlay.tsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts # WebSocket connection
│   │   │   └── useSensors.ts   # Sensor state
│   │   ├── stores/
│   │   │   └── appStore.ts     # Zustand state
│   │   └── styles/
│   │       └── ironman.css     # Iron Man theme
│   └── public/
│       └── models/             # 3D model files
│
├── config/
│   ├── settings.yaml           # App configuration
│   └── users.db                # SQLite database
│
├── scripts/
│   ├── start.sh                # Launch all processes
│   └── install.sh              # Install dependencies
│
└── requirements.txt            # Python dependencies
```

---

## API Design

### REST Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/status` | System status |
| GET | `/api/sensors` | Current sensor values |
| POST | `/api/led/mode` | Change LED mode |
| POST | `/api/jarvis/speak` | Send text to TTS |
| GET | `/api/user/current` | Current authenticated user |

### WebSocket Events

| Event | Direction | Data |
|-------|-----------|------|
| `sensor_update` | Server → Client | Sensor readings |
| `gesture` | Server → Client | Detected gesture type |
| `face_detected` | Server → Client | User info |
| `jarvis_response` | Server → Client | AI response text |
| `voice_audio` | Client → Server | Audio data for STT |
| `command` | Client → Server | Manual commands |

---

## Summary

| Aspect | Choice | Reason |
|--------|--------|--------|
| **Frontend** | React + Vite + Three.js | Fast, modern, great 3D support |
| **Backend** | Python + FastAPI | Easy GPIO, great async support |
| **Parallelism** | multiprocessing | Utilize all 4 Pi cores |
| **Communication** | WebSocket | Real-time bidirectional |
| **3D Rendering** | Browser (Three.js) | Offloads GPU work from Pi |
