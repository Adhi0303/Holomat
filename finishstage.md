# 🚀 HoloMat - FINISH STAGE: Hardware IoT Integration Master Plan

> Created: 2026-03-31  
> Author: Orchestrator (project-planner + backend-specialist + documentation-writer)  
> Status: **PHASE 4 — Hardware Integration**

---

## 🏗️ ARCHITECTURE DECISION (FINAL)

### ✅ Chosen Architecture: Arduino → USB Serial → Raspberry Pi

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPONENT SPLIT                              │
│                                                                 │
│  ┌─────────────────────┐       ┌─────────────────────────────┐  │
│  │    ARDUINO UNO       │       │     RASPBERRY PI 3B+         │  │
│  │  (Sensor Hub)        │──USB──│  (AI + Backend + WiFi Host)  │  │
│  │                      │Serial │                             │  │
│  │  • PIR Motion        │       │  • FastAPI Backend           │  │
│  │  • HC-SR04 Ultrasonic│       │  • OpenCV Face Recognition   │  │
│  │  • LDR Light Sensor  │       │  • Groq AI / Voice (Jarvis)  │  │
│  │  • 16x2 LCD Display  │       │  • WebSocket Server          │  │
│  │  • OV7670 Camera*    │       │  • USB Camera (main)         │  │
│  │  • Sends JSON data   │       │  • USB Microphone            │  │
│  └─────────────────────┘       │  • Serves Frontend UI        │  │
│                                 └─────────────────────────────┘  │
│                                              │                    │
│              ┌───────────────────────────────┤                    │
│              │          ESP32                 │                    │
│              │  (Optional: WiFi data bridge   │                    │
│              │   if wireless Arduino needed)  │                    │
│              └───────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Split?
| Decision | Reason |
|----------|--------|
| **Arduino handles sensors** | Arduino excels at real-time GPIO, precise timing (ultrasonic pulse), analog reads (LDR). Pi GPIO can fail under CPU load |
| **Pi handles AI + Backend** | Pi has Linux, Python, network stack — perfect for FastAPI, OpenCV, Groq API calls |
| **USB Serial communication** | Most reliable. No WiFi drops. Pi can power Arduino via USB. Simple JSON protocol. 115200 baud = fast enough |
| **ESP32 optional** | Only needed if you want Wi-Fi sensor data without USB cable. For now, USB is better |
| **Backend on Pi** | Pi serves everything on local WiFi network. Frontend on laptop accesses Pi via IP address |

### Communication Protocol: USB Serial (115200 baud)
```
Arduino → sends JSON every 100ms → Raspberry Pi
Pi reads serial → parses → injects into FastAPI sensor cache
Pi → WebSocket → Frontend (browser on laptop)
```

---

## 🖥️ OS RECOMMENDATION FOR RASPBERRY PI

**→ USE: Raspberry Pi OS Lite (64-bit) — Bookworm**

| Option | Verdict | Reason |
|--------|---------|--------|
| **Raspberry Pi OS Lite 64-bit (Bookworm)** | ✅ **BEST CHOICE** | Headless, minimal, boots fast, perfect for server use |
| Raspberry Pi OS Desktop | ❌ Skip | GUI wastes RAM (Pi 3B+ has only 1GB) |
| Ubuntu Server 22.04 | ⚠️ OK | Heavier, slower boot, fewer Pi-specific tools |
| DietPi | ⚠️ Advanced | Very lightweight but complex setup |

**Download:** https://www.raspberrypi.com/software/operating-systems/  
**Flash Tool:** Raspberry Pi Imager (Windows) → use "OS Lite 64-bit"

---

## 📋 HARDWARE COMPONENTS YOU HAVE

| # | Component | Count | Role |
|---|-----------|-------|------|
| 1 | Arduino Uno | 1 | Sensor hub — reads all IoT sensors |
| 2 | Raspberry Pi 3B+ | 1 | AI + Backend server |
| 3 | PIR Motion Sensor (HC-SR501) | 1 | Motion/proximity detection |
| 4 | HC-SR04 Ultrasonic | 1 | Distance measurement (gesture zone) |
| 5 | LDR + Resistor | 1 | Light level detection |
| 6 | I2C LCD (16x2 or 20x4) | 1 | Physical status display |
| 7 | ESP32 | 1 | Reserved as WiFi bridge (optional later) |
| 8 | Small camera (OV7670 / SerialCam) | 1 | Object scan (Arduino-side, limited) |
| 9 | Breadboard | 1 | Circuit prototyping |
| 10 | Jumper wires | many | Connections |
| 11 | USB Microphone | 1 | Voice input → Pi |

> ⚠️ **IMPORTANT:** The small camera for Arduino (OV7670) is very low-res and complex to code.
> **Recommendation:** Use a USB webcam on the Pi for face recognition. Use the Arduino camera only for basic scan triggers if needed.

---

## ✅ MASTER TODO LIST — Follow This Order Exactly

---

### 🔴 STAGE 0: Raspberry Pi OS Setup  
**Do this FIRST — before any coding**

- [ ] **S0.1** — Download Raspberry Pi OS Lite 64-bit (Bookworm) from raspberrypi.com
- [ ] **S0.2** — Flash OS to microSD card using Raspberry Pi Imager
  - Enable SSH in Imager settings
  - Set hostname: `holomat`
  - Set username: `pi`, password: your choice
  - Configure your WiFi SSID + password in Imager
- [ ] **S0.3** — Boot Pi, find its IP address (`ping holomat.local` or check router)
- [ ] **S0.4** — SSH into Pi: `ssh pi@holomat.local`
- [ ] **S0.5** — Run system update:
  ```bash
  sudo apt update && sudo apt upgrade -y
  sudo apt install python3-pip python3-venv git -y
  ```
- [ ] **S0.6** — Install Python libraries on Pi:
  ```bash
  pip3 install fastapi uvicorn python-dotenv pyserial
  pip3 install opencv-python-headless
  pip3 install face-recognition
  pip3 install RPi.GPIO gpiozero
  pip3 install RPLCD
  ```
- [ ] **S0.7** — Clone/copy project to Pi:
  ```bash
  git clone https://github.com/Adhi0303/Holomat.git
  # OR use scp to copy files from Windows
  ```
- [ ] **S0.8** — Verify Pi can run backend: `cd holomat-backend && uvicorn main:app --host 0.0.0.0 --port 8000`

---

### 🟡 STAGE 1: Arduino Sensor Code
**Write all Arduino sketches — test each sensor one at a time**

#### 1A — PIR Motion Sensor
- [ ] **S1.1** — Wire: PIR VCC → 5V, GND → GND, OUT → Pin 7
- [ ] **S1.2** — Write Arduino sketch: `arduino/pir_test/pir_test.ino`
  - Read digital HIGH/LOW from pin 7
  - Print to Serial: `{"motion": true}` or `{"motion": false}`
- [ ] **S1.3** — Upload sketch, open Serial Monitor, verify output

#### 1B — HC-SR04 Ultrasonic Sensor
- [ ] **S1.4** — Wire: VCC → 5V, GND → GND, TRIG → Pin 9, ECHO → Pin 10
- [ ] **S1.5** — Write Arduino sketch: `arduino/ultrasonic_test/ultrasonic_test.ino`
  - Pulse TRIG, measure ECHO duration
  - Calculate distance in cm: `distance = (duration * 0.034) / 2`
  - Print: `{"distance": 45.3}`
- [ ] **S1.6** — Test: wave hand, verify distance changes in Serial Monitor

#### 1C — LDR Light Sensor
- [ ] **S1.7** — Wire: LDR + 10kΩ resistor voltage divider → A0 pin
- [ ] **S1.8** — Write Arduino sketch: `arduino/ldr_test/ldr_test.ino`
  - `analogRead(A0)` → value 0-1023
  - Convert to 0–100%: `light = map(val, 0, 1023, 0, 100)`
  - Print: `{"light": 78}`
- [ ] **S1.9** — Test: cover with hand (dark) → bright light, verify range

#### 1D — LCD Display (I2C)
- [ ] **S1.10** — Wire: VCC → 5V, GND → GND, SDA → A4, SCL → A5
- [ ] **S1.11** — Install LiquidCrystal_I2C library in Arduino IDE
- [ ] **S1.12** — Write sketch: `arduino/lcd_test/lcd_test.ino`
  - Scan I2C address first (use `i2c_scanner.ino`)
  - Display: "HoloMat Ready" on line 1
  - Display current sensor values on lines 2–4
- [ ] **S1.13** — Test: verify text appears on LCD

---

### 🟡 STAGE 2: Arduino Master Sensor Hub
**Combine all sensors into one sketch that sends JSON over Serial**

- [ ] **S2.1** — Write: `arduino/holomat_sensor_hub/holomat_sensor_hub.ino`
  - Read all sensors every 100ms
  - Send compact JSON line:
    ```json
    {"motion":true,"distance":42.5,"light":78,"timestamp":12345}
    ```
  - Update LCD with live readings
- [ ] **S2.2** — Add error handling: sensor timeout, bad readings → send default values
- [ ] **S2.3** — Test: open Serial Monitor at 115200 baud → verify JSON stream
- [ ] **S2.4** — Test: unplug each sensor while running → verify graceful degradation

---

### 🟢 STAGE 3: Raspberry Pi Serial Bridge
**Python code on Pi to read Arduino serial data**

- [ ] **S3.1** — Create file: `holomat-backend/hardware/arduino_bridge.py`
  - Opens `/dev/ttyACM0` (or `ttyUSB0`) at 115200 baud
  - Reads JSON lines from Arduino
  - Parses and stores in `sensor_cache` dict
  - Runs in background thread
- [ ] **S3.2** — Add auto-reconnect logic: if Arduino disconnects → retry every 5s
- [ ] **S3.3** — Add logging: print sensor data to Pi terminal for debugging
- [ ] **S3.4** — Test standalone: `python3 arduino_bridge.py` → verify JSON being received

---

### 🟢 STAGE 4: Backend Integration (Switch Mock → Real)
**Connect Arduino bridge to FastAPI sensor endpoints**

- [ ] **S4.1** — Modify `holomat-backend/hardware/real_sensors.py`:
  - Replace direct GPIO reads with `arduino_bridge.get_sensor_data()`
  - Pi-direct sensors stay on Pi (camera, microphone)
  - Arduino sensors (PIR, ultrasonic, LDR, LCD) come via serial bridge
- [ ] **S4.2** — Create `holomat-backend/hardware/sensor_manager.py`:
  - Unified sensor interface
  - Tries real (Arduino bridge) first → falls back to mock if not connected
  - Single `get_all_sensors()` function used by all API routes
- [ ] **S4.3** — Update `holomat-backend/api/sensors_enhanced.py`:
  - Replace `mock_sensors` import with `sensor_manager`
  - All `/api/sensors` endpoints use real data
- [ ] **S4.4** — Update `holomat-backend/api/websocket.py`:
  - WebSocket broadcasts real sensor data every 2s
- [ ] **S4.5** — Test: run backend on Pi → check `http://pi-ip:8000/api/sensors` in browser

---

### 🟢 STAGE 5: Camera Integration on Pi
**USB webcam for face recognition**

- [ ] **S5.1** — Connect USB webcam to Pi USB port
- [ ] **S5.2** — Test camera works: `python3 -c "import cv2; cap=cv2.VideoCapture(0); print(cap.read()[0])"`
- [ ] **S5.3** — Verify face recognition library works:
  ```bash
  python3 -c "import face_recognition; print('face_recognition OK')"
  ```
- [ ] **S5.4** — Check existing scan API: `holomat-backend/api/jarvis.py` and confirm camera route works
- [ ] **S5.5** — Test Scan Mode in frontend → verify real camera preview shows

---

### 🟢 STAGE 6: Microphone + Voice (Jarvis on Pi)
**USB microphone → Groq AI → Voice response**

- [ ] **S6.1** — Connect USB microphone to Pi
- [ ] **S6.2** — Test microphone: `arecord -l` → verify mic shows up
- [ ] **S6.3** — Test audio capture: `arecord -d 5 test.wav && aplay test.wav`
- [ ] **S6.4** — Verify Groq API key is in Pi's `.env` file
- [ ] **S6.5** — Test Jarvis voice endpoint: `holomat-backend/api/jarvis.py`
- [ ] **S6.6** — Test from frontend: press voice button → speak → get response

---

### 🔵 STAGE 7: Frontend Network Config
**Point frontend to Pi's IP instead of localhost**

- [ ] **S7.1** — Find Pi's IP address: `hostname -I` on Pi
- [ ] **S7.2** — Update `frontend UI/src/config/api.ts`:
  - Local dev: `localhost:8000` (when running backend on laptop)
  - Pi mode: `http://192.168.x.x:8000` (Pi's actual IP)
  - Add env variable `VITE_API_URL` for switching
- [ ] **S7.3** — Update `.env` in frontend: `VITE_API_BASE_URL=http://holomat.local:8000`
- [ ] **S7.4** — Rebuild frontend: `npm run build` → copy `dist/` to Pi
- [ ] **S7.5** — Configure Pi to serve frontend:
  - Option A: `serve -s dist` via npm
  - Option B: FastAPI serves the index.html as static files (simpler!)
- [ ] **S7.6** — Test: open `http://holomat.local:5173` from laptop → full HoloMat UI with real data

---

### 🔵 STAGE 8: ESP32 (Optional — Future WiFi Bridge)
**Only if you want wireless Arduino sensor data**

- [ ] **S8.1** — Flash ESP32 with Arduino IDE
- [ ] **S8.2** — ESP32 reads sensor data via SoftwareSerial from Arduino
- [ ] **S8.3** — ESP32 sends JSON data to Pi via HTTP POST (REST) or MQTT
- [ ] **S8.4** — Pi backend receives HTTP POSTs → updates sensor cache
> ⏭️ **Skip this for now — USB Serial is faster and more reliable for prototyping.**

---

### ⚪ STAGE 9: Final Testing & Calibration

- [ ] **S9.1** — End-to-end test: move hand in front of ultrasonic → frontend shows distance change
- [ ] **S9.2** — Motion test: walk past PIR → frontend motion indicator lights up
- [ ] **S9.3** — Light test: cover LDR → light level drops in frontend
- [ ] **S9.4** — LCD test: verify LCD shows current system status
- [ ] **S9.5** — Voice test: say "Hey Jarvis" → get AI response via speaker
- [ ] **S9.6** — Face scan test: click Scan Mode → camera activates → face detected
- [ ] **S9.7** — Calibrate gesture detection thresholds in `sensor_manager.py`
- [ ] **S9.8** — Stress test: run all sensors 30 minutes → check for errors/crashes
- [ ] **S9.9** — Network test: access from multiple devices on same WiFi

---

### ⚪ STAGE 10: Project Wrap-Up

- [ ] **S10.1** — Update `PROJECT_STATUS.md` — mark all hardware as complete
- [ ] **S10.2** — Create `SETUP_GUIDE.md` — step-by-step setup for anyone building this
- [ ] **S10.3** — Create `WIRING_DIAGRAM.md` — exact pin-by-pin wiring reference
- [ ] **S10.4** — Record demo video of full system working
- [ ] **S10.5** — Final Git commit: `git add . && git commit -m "feat: hardware IoT integration complete"`
- [ ] **S10.6** — Push to GitHub: `git push origin main`

---

## 📌 QUICK REFERENCE: Pin Wiring (Arduino Uno)

```
SENSOR          ARDUINO PIN
──────────────────────────────
PIR Motion      ← Digital 7
HC-SR04 TRIG    ← Digital 9
HC-SR04 ECHO    ← Digital 10
LDR             ← Analog A0 (+ 10kΩ to GND)
LCD SDA         ← A4
LCD SCL         ← A5
LCD VCC         ← 5V
All GND         ← GND
Arduino → Pi    ← USB Cable (also powers Arduino)
```

---

## 📌 QUICK REFERENCE: Files to Create/Modify

| # | File | Action | Stage |
|---|------|--------|-------|
| 1 | `arduino/holomat_sensor_hub/holomat_sensor_hub.ino` | **CREATE** | S2.1 |
| 2 | `arduino/pir_test/pir_test.ino` | **CREATE** | S1.2 |
| 3 | `arduino/ultrasonic_test/ultrasonic_test.ino` | **CREATE** | S1.5 |
| 4 | `arduino/ldr_test/ldr_test.ino` | **CREATE** | S1.8 |
| 5 | `arduino/lcd_test/lcd_test.ino` | **CREATE** | S1.12 |
| 6 | `holomat-backend/hardware/arduino_bridge.py` | **CREATE** | S3.1 |
| 7 | `holomat-backend/hardware/sensor_manager.py` | **CREATE** | S4.2 |
| 8 | `holomat-backend/hardware/real_sensors.py` | **MODIFY** | S4.1 |
| 9 | `holomat-backend/api/sensors_enhanced.py` | **MODIFY** | S4.3 |
| 10 | `holomat-backend/api/websocket.py` | **MODIFY** | S4.4 |
| 11 | `frontend UI/src/config/api.ts` | **MODIFY** | S7.2 |
| 12 | `frontend UI/.env` | **MODIFY** | S7.3 |

---

## 🔄 CURRENT STATUS TRACKER

| Stage | Name | Status |
|-------|------|--------|
| S0 | Raspberry Pi OS Setup | ❌ Not Started |
| S1 | Arduino Sensor Code | ✅ Complete |
| S2 | Arduino Master Hub Sketch | ✅ Complete |
| S3 | Pi Serial Bridge (Python) | ❌ Not Started |
| S4 | Backend Integration | ❌ Not Started |
| S5 | Camera Integration | ❌ Not Started |
| S6 | Microphone + Voice | ❌ Not Started |
| S7 | Frontend Network Config | ❌ Not Started |
| S8 | ESP32 WiFi Bridge | ⏭️ Skipped (optional) |
| S9 | Final Testing | ❌ Not Started |
| S10 | Project Wrap-Up | ❌ Not Started |

---

## 💡 TIPS & GOTCHAS

1. **Arduino powered via USB from Pi** — no separate power supply needed for Arduino
2. **LDR needs a 10kΩ pull-down resistor** — without it, readings will be garbage
3. **I2C LCD address** — most common is `0x27`, some are `0x3F`. Run i2c_scanner sketch to find yours
4. **HC-SR04 ECHO pin** — outputs 5V but Pi GPIO is 3.3V tolerant. On Arduino it's fine. If directly connecting to Pi, use a voltage divider
5. **Serial port on Pi** — Arduino shows as `/dev/ttyACM0` or `/dev/ttyUSB0`. Run `ls /dev/tty*` before and after plugging in to find it
6. **Face recognition on Pi 3B+** — it's slow (Pi 3 is weak). Reduce resolution to 320x240 for faster processing
7. **Run backend as service** — use `systemd` service so backend auto-starts on Pi boot
8. **Use `holomat.local`** — this mDNS hostname works on local network without knowing Pi's IP

---

*Last updated: 2026-03-31 | Follow stages in order | Check off items as completed*
