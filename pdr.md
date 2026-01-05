# HoloMat - Project Design Requirements (PDR)

**Project Title:** HoloMat - Iron Man IoT Workstation  
**Version:** 1.0  
**Date:** December 29, 2024  
**Author:** Suriya  
**Status:** Planning Phase

---

## 1. Executive Summary

The HoloMat is an intelligent IoT workstation inspired by Tony Stark's lab from Iron Man. It combines sensor automation, AI voice assistant, face recognition, gesture control, and holographic 3D visualization to create a futuristic engineering workspace.

### Key Objectives
- Build a motion-activated, self-aware workstation
- Implement face-based user authentication
- Enable gesture-based UI control
- Integrate AI voice assistant (Jarvis)
- Create immersive 3D holographic display
- Design with professional CS/EE engineering aesthetics

---

## 2. Project Scope

### 2.1 In Scope
| Feature | Description |
|---------|-------------|
| Proximity Wake-Up | PIR sensor activates system on approach |
| Face Authentication | Camera-based user recognition |
| Ambient Light Control | Auto-adjust display brightness via LDR |
| Gesture Control | Ultrasonic sensors for hand gestures |
| AI Voice Assistant | OpenAI-powered Jarvis integration |
| 3D Hologram Display | Projection-based 3D visualization |
| LCD Notification Panels | Time, status, alerts display |
| Ambient LED Lighting | Reactive RGB lighting effects |

### 2.2 Out of Scope (Future Enhancements)
- Integration with 3D printers
- Laser cutter connectivity
- Smart home automation
- Mobile app control
- Multi-user simultaneous tracking

---

## 3. System Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | System shall wake from sleep when motion is detected within 2m | High |
| FR-02 | System shall capture and recognize registered faces within 5 seconds | High |
| FR-03 | System shall grant/deny access based on face recognition result | High |
| FR-04 | System shall adjust display brightness based on ambient light | Medium |
| FR-05 | System shall detect hand gestures (swipe, push, pull) | High |
| FR-06 | System shall execute UI commands based on detected gestures | High |
| FR-07 | System shall respond to voice commands with "Hey Jarvis" wake word | High |
| FR-08 | System shall display 3D models with holographic projection | High |
| FR-09 | System shall show time, date, and notifications on LCD panels | Medium |
| FR-10 | System shall control RGB LED strips based on system state | Low |

### 3.2 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | System latency for gesture response | < 200ms |
| NFR-02 | Face recognition accuracy | > 95% |
| NFR-03 | System boot time | < 30 seconds |
| NFR-04 | Continuous operation without restart | > 24 hours |
| NFR-05 | Voice command recognition accuracy | > 90% |
| NFR-06 | 3D rendering frame rate | > 30 FPS |
| NFR-07 | Power consumption (idle) | < 10W |

---

## 4. Hardware Specifications

### 4.1 Core Processing Unit

| Component | Specification |
|-----------|---------------|
| **Model** | Raspberry Pi 3B+ |
| **CPU** | Quad-core Cortex-A53 @ 1.4GHz |
| **RAM** | 1GB LPDDR2 |
| **Storage** | 32GB+ MicroSD (Class 10) |
| **OS** | Raspberry Pi OS (64-bit Lite) |

### 4.2 Sensors

| Sensor | Model | Quantity | Interface | Purpose |
|--------|-------|----------|-----------|---------|
| PIR Motion | HC-SR501 | 1 | GPIO | Proximity detection |
| Ultrasonic | HC-SR04 | 3 | GPIO | Gesture sensing |
| Light (LDR) | Generic | 1 | ADC (MCP3008) | Ambient light |
| Camera | USB 1080p | 1 | USB | Face recognition |
| Microphone | USB | 1 | USB | Voice input |

### 4.3 Output Devices

| Device | Model | Quantity | Interface | Purpose |
|--------|-------|----------|-----------|---------|
| LCD Display | 20x4 I2C | 2 | I2C | Notifications |
| LED Strip | WS2812B | 1m | GPIO (PWM) | Ambient lighting |
| Speaker | 3.5mm | 1 | Audio jack | Voice output |
| Monitor | 1080p | 1 | HDMI | Main display |
| Projector | Mini 720p+ | 1 | HDMI | Hologram projection |

### 4.4 Pin Allocation

| GPIO Pin | Component | Function |
|----------|-----------|----------|
| GPIO 4 | PIR Sensor | Motion input |
| GPIO 17 | Ultrasonic 1 | Trigger |
| GPIO 27 | Ultrasonic 1 | Echo |
| GPIO 22 | Ultrasonic 2 | Trigger |
| GPIO 23 | Ultrasonic 2 | Echo |
| GPIO 24 | Ultrasonic 3 | Trigger |
| GPIO 25 | Ultrasonic 3 | Echo |
| GPIO 18 | WS2812B LED | Data (PWM) |
| SDA (GPIO 2) | LCD 1 & 2 | I2C Data |
| SCL (GPIO 3) | LCD 1 & 2 | I2C Clock |
| SPI0 | MCP3008 | ADC for LDR |

### 4.5 Wiring Diagram (Simplified)

```
                                RASPBERRY PI 3B+
                        ┌─────────────────────────────┐
                        │                             │
    PIR Sensor ─────────┤ GPIO 4                      │
                        │                             │
    Ultrasonic 1 ───────┤ GPIO 17 (Trig)              │
                ────────┤ GPIO 27 (Echo)              │
                        │                             │
    Ultrasonic 2 ───────┤ GPIO 22 (Trig)              │
                ────────┤ GPIO 23 (Echo)              │
                        │                             │
    Ultrasonic 3 ───────┤ GPIO 24 (Trig)              │
                ────────┤ GPIO 25 (Echo)              │
                        │                             │
    WS2812B LED ────────┤ GPIO 18 (PWM)          3.3V ├──── LDR + MCP3008
                        │                             │
    LCD Displays ───────┤ SDA/SCL (I2C)               │
                        │                             │
    USB Webcam ─────────┤ USB Port 1                  │
    USB Mic ────────────┤ USB Port 2                  │
                        │                             │
    Monitor ────────────┤ HDMI                        │
    Speaker ────────────┤ 3.5mm Audio                 │
                        │                             │
                        └─────────────────────────────┘
```

---

## 5. Software Specifications

### 5.1 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Backend** | Python | 3.11+ |
| **Web Framework** | FastAPI | 0.104+ |
| **Frontend** | React + TypeScript | 18.x |
| **Build Tool** | Vite | 5.x |
| **3D Engine** | Three.js | Latest |
| **Vision** | OpenCV | 4.8+ |
| **Face Recognition** | face_recognition | 1.3+ |
| **AI/LLM** | OpenAI API | GPT-4 |
| **Speech-to-Text** | Whisper API | Latest |
| **Text-to-Speech** | pyttsx3 / gTTS | Latest |

### 5.2 Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND (Browser)                         │
│               React + Three.js + WebSocket                    │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP/WebSocket
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    BACKEND (Pi 3B+)                           │
│                      FastAPI Server                           │
│  ┌────────────────┬────────────────┬────────────────────┐    │
│  │ Sensor Process │ Vision Process │    AI Process      │    │
│  │  (Core 1)      │   (Core 2)     │     (Core 3)       │    │
│  └────────────────┴────────────────┴────────────────────┘    │
│                    Hardware Control Layer                     │
│              GPIO • I2C • SPI • USB • Audio                   │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 Process Communication

| Queue | Producer | Consumer | Data Type |
|-------|----------|----------|-----------|
| sensor_queue | Sensor Process | Main | Motion, gesture, light |
| vision_queue | Vision Process | Main | Face detection results |
| ai_queue | AI Process | Main | Voice responses |
| command_queue | Main | All | Control commands |

---

## 6. User Interface Design

### 6.1 Main Display (Monitor/Projector)

```
┌─────────────────────────────────────────────────────────────────┐
│  ╔═══════════════════════════════════════════════════════════╗  │
│  ║                     HOLOMAT v1.0                          ║  │
│  ║                   Welcome, Suriya                          ║  │
│  ╚═══════════════════════════════════════════════════════════╝  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │                                                           │  │
│  │                    3D HOLOGRAM AREA                       │  │
│  │                                                           │  │
│  │               (Three.js 3D Model Viewer)                  │  │
│  │                                                           │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐  │
│  │   SENSORS   │  │   JARVIS    │  │   DISPLAY   │  │SETTINGS│  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────┘  │
│                                                                 │
│  Status: ACTIVE    │    Light: 65%    │    Gesture: READY      │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 LCD Panel Layout

**Panel 1 (Time & Weather)**
```
┌────────────────────┐
│ 20:12    SUN       │
│ Dec 29, 2024       │
│ Chennai  28°C      │
│ Partly Cloudy      │
└────────────────────┘
```

**Panel 2 (System Status)**
```
┌────────────────────┐
│ CPU: 45%  RAM: 62% │
│ Temp: 52°C         │
│ User: Suriya       │
│ Uptime: 2h 34m     │
└────────────────────┘
```

### 6.3 Iron Man Color Scheme

| Element | Color | Hex Code |
|---------|-------|----------|
| Primary (Accent) | Arc Reactor Blue | `#00D4FF` |
| Secondary | Gold | `#FFD700` |
| Background | Dark Gray | `#1A1A2E` |
| Panel Background | Dark Blue | `#16213E` |
| Text Primary | White | `#FFFFFF` |
| Text Secondary | Cyan | `#00F5FF` |
| Alert/Warning | Orange | `#FF6B00` |
| Success | Green | `#00FF88` |

---

## 7. Hologram Implementation

### 7.1 Projection Method: Pepper's Ghost + Enhancement

```
                    ┌─────────────────────┐
                    │   PROJECTOR/MONITOR │
                    │   (facing down/back)│
                    └──────────┬──────────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │                                │
              │     45° ACRYLIC/GLASS SHEET    │
              │            /                   │
              │           /                    │
              │          /                     │
              └────────────────────────────────┘
                               │
                       ┌───────┴───────┐
                       │  VIEWING AREA │
                       │   (User sits) │
                       └───────────────┘
```

### 7.2 3D Content

| Model Type | Source | Interactive |
|------------|--------|-------------|
| Iron Man HUD Elements | Custom Three.js | Yes |
| Rotating Logo | Procedural | Yes |
| Project Visualizations | User uploads | Yes |
| Sensor Data Graphs | Real-time | Yes |

---

## 8. Implementation Timeline

### 8.1 Gantt Chart (8 Weeks)

```
Week    1    2    3    4    5    6    7    8
        ├────┴────┴────┴────┴────┴────┴────┴────┤
Phase 1 ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ Hardware Setup
Phase 2 ░░░░░░░░░░██████████░░░░░░░░░░░░░░░░░░░░ Sensor Integration
Phase 3 ░░░░░░░░░░░░░░░░░░░░██████████░░░░░░░░░░ Vision + AI
Phase 4 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████ UI + Hologram
Phase 5 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████ Testing
```

### 8.2 Detailed Milestones

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1-2 | Hardware Setup | Pi configured, all sensors wired, basic readings |
| 2-3 | Sensor Integration | PIR, ultrasonic, LDR working with Python |
| 3-4 | Face Recognition | Camera setup, face detection, user database |
| 4-5 | AI Integration | Jarvis voice commands, OpenAI responses |
| 5-6 | Frontend Development | React UI, Three.js 3D scene |
| 6-7 | Hologram Setup | Projection setup, 3D content |
| 7-8 | Integration & Testing | All systems integrated, bug fixes |
| 8 | Documentation | Final report, demo video |

---

## 9. Testing Plan

### 9.1 Unit Tests

| Component | Test Case | Expected Result |
|-----------|-----------|-----------------|
| PIR Sensor | Motion in range | Event triggered |
| Ultrasonic | Distance measurement | Accurate ±2cm |
| LDR | Light level change | Value changes proportionally |
| Face Recognition | Known face | Correct identification |
| Face Recognition | Unknown face | Access denied |
| Gesture Detection | Swipe left | UI navigates left |
| Voice Command | "Hey Jarvis" | Wake word detected |

### 9.2 Integration Tests

| Scenario | Components | Expected Flow |
|----------|------------|---------------|
| Wake-up | PIR → Camera → Face | System activates, user identified |
| Gesture Control | Ultrasonic → UI | UI responds to gestures |
| Voice Interaction | Mic → AI → Speaker | Jarvis responds correctly |
| Brightness Auto | LDR → Display | Brightness adjusts smoothly |

### 9.3 End-to-End Demo

1. Walk toward workstation
2. System wakes, camera activates
3. Face recognized, "Welcome, Suriya"
4. UI loads with personalized dashboard
5. Swipe gestures navigate 3D models
6. "Hey Jarvis, what's the time?"
7. Jarvis responds with current time

---

## 10. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Pi 3B+ performance issues | Medium | High | Optimize code, reduce FPS if needed |
| Face recognition failures | Low | Medium | Add multiple angles to training |
| Gesture false positives | Medium | Medium | Tune detection thresholds |
| OpenAI API rate limits | Low | Medium | Implement caching, fallback responses |
| Hardware damage | Low | High | Use proper voltage levels, fuses |
| Timeline delays | Medium | Medium | Prioritize core features first |

---

## 11. Success Criteria

| Criteria | Target | Measurement |
|----------|--------|-------------|
| Motion wake-up works | 100% | PIR triggers correctly |
| Face recognition works | > 95% accuracy | Test with 20+ attempts |
| Gesture control works | > 90% accuracy | Test all gesture types |
| Jarvis responds | Within 3 seconds | Measure response latency |
| 3D hologram displays | Smooth 30+ FPS | FPS counter in app |
| System stability | 24+ hours uptime | Stress test |

---

## 12. Appendix

### 12.1 Reference Links

- [Raspberry Pi GPIO Documentation](https://www.raspberrypi.com/documentation/)
- [OpenCV Python Tutorials](https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Three.js Documentation](https://threejs.org/docs/)
- [OpenAI API Reference](https://platform.openai.com/docs/)

### 12.2 Inspiration

- [Concept Bytes HoloMat](https://youtu.be/Yrj8bTTsQ2I)
- [Hacksmith Iron Man Desk](https://www.youtube.com/hacksmith)

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 29, 2024 | Suriya | Initial PDR |
