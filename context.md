# HoloMat - Iron Man IoT Workstation

## Project Overview

An intelligent, sensor-driven workstation inspired by Tony Stark's lab that:
- **Auto-wakes** when you approach (PIR motion sensor)
- **Authenticates you** via face recognition
- **Adapts brightness** based on ambient light (LDR sensor)
- **Responds to gestures** (ultrasonic sensors)
- **Communicates via AI** (Jarvis using OpenAI)
- **Displays 3D holograms** (projection-based)
- **Shows notifications** on LCD panels

---

## Confirmed Specifications

| Component | Value |
|-----------|-------|
| **Main Controller** | Raspberry Pi 3B+ |
| **Display** | Dedicated monitor |
| **Hologram** | Projection-based |
| **AI/LLM** | OpenAI API |
| **Timeline** | 2 months |

---

## System Features

### 1. 🚶 Proximity Wake-Up
- **Sensor**: PIR (HC-SR501)
- Motion triggers system wake from sleep
- Initiates face recognition sequence

### 2. 👤 Face Recognition
- **Hardware**: USB Webcam
- **Tech**: OpenCV Haar Cascades
- Authenticates user and loads personalized profile

### 3. 💡 Auto Brightness
- **Sensor**: LDR + MCP3008 ADC
- Adjusts display/LED brightness based on ambient light

### 4. 🖐️ Gesture Control
- **Sensors**: 3x HC-SR04 Ultrasonic
- Swipe left/right, push/pull gestures
- Navigate UI without touching anything

### 5. 🤖 Jarvis AI Assistant
- **API**: OpenAI GPT
- Wake word: "Hey Jarvis"
- Voice commands for full workstation control

### 6. 🎮 3D Hologram Display
- **Tech**: Projection-based holography
- Three.js for real-time 3D rendering
- Iron Man aesthetic UI

### 7. 📟 LCD Notification Panels
- **Displays**: I2C LCD 20x4
- Time, date, system status, alerts

### 8. 💡 Ambient LED Lighting
- **Hardware**: WS2812B RGB Strip
- Reactive animations, Iron Man color scheme

---

## Hardware List

| Component | Model | Have? |
|-----------|-------|-------|
| Raspberry Pi 3B+ | - | ✅ Yes |
| PIR Motion Sensor | HC-SR501 | ❓ Check |
| Ultrasonic Sensors (x3) | HC-SR04 | ❓ Check |
| LDR Sensor | - | ❓ Check |
| ADC Converter | MCP3008 | ❓ Check |
| USB Webcam | 1080p | ❓ Check |
| USB Microphone | - | ❓ Check |
| Speaker | 3.5mm | ❓ Check |
| I2C LCD (x2) | 20x4 | ❓ Check |
| RGB LED Strip | WS2812B | ❓ Check |
| Monitor | - | ✅ Yes |
| Mini Projector | For hologram | ❓ Check |

---

## Project Structure

```
d:\Projects\Holomat\
├── context.md              # This file
├── README.md               # Project overview
├── hardware/
│   └── wiring_diagrams/    # Circuit diagrams
├── src/
│   ├── sensors/            # Sensor modules
│   ├── vision/             # Face recognition
│   ├── ai/                 # Jarvis LLM
│   ├── display/            # LCD, LED control
│   ├── ui/                 # Web UI (3D, hologram)
│   └── main.py             # Main entry
├── config/
│   └── settings.yaml       # Configuration
└── requirements.txt        # Dependencies
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Sensors | RPi.GPIO, gpiozero |
| Vision | OpenCV, face_recognition |
| AI | OpenAI API, Whisper |
| 3D Rendering | Three.js, WebGL |
| UI | HTML, CSS, JavaScript |
| Backend | FastAPI |
| LEDs | rpi_ws281x |
| LCD | RPLCD |

---

## Timeline (2 Months)

| Week | Phase | Deliverable |
|------|-------|-------------|
| 1-2 | Setup & Sensors | Pi setup, all sensors working |
| 3-4 | Vision & Auth | Face recognition system |
| 5 | AI Integration | Jarvis voice assistant |
| 6-7 | Display & UI | Hologram, LCD, LEDs |
| 8 | Integration | Complete system, testing |

---

## Reference

- **Original Inspiration**: [Concept Bytes HoloMat](https://youtu.be/Yrj8bTTsQ2I)
- **Style**: Iron Man / Tony Stark Workstation
