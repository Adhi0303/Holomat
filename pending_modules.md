# HoloMat - Pending Modules (Software-First Priority)

**Last Updated:** January 8, 2026  
**Priority:** Software features first → Hardware sensors later

---

## Priority Overview

| Priority | Phase | Modules |
|----------|-------|---------|
| **P1** | Core Software | Backend API, Frontend WebSocket, Dashboard |
| **P2** | 3D & Visualization | 3D File Rendering, Blender/Unity Integration, Real-time Camera 3D |
| **P3** | AI & Voice | Jarvis Enhancements, Voice Commands, AI Actions |
| **P4** | Hardware | Sensors (PIR, LDR, Ultrasonic), LCD, LED |

---

# PHASE 1: Core Software (HIGH PRIORITY)

---

## 1.1 Backend API Server

### Status: 🔴 Not Started | Priority: CRITICAL

### What Needs to Be Done
Create FastAPI backend that serves as the central hub for all communication.

### Tasks
1. **Set up FastAPI project** structure
2. **REST API endpoints:**
   - `GET /api/status` - System health
   - `GET /api/sensors` - Sensor data (mock first)
   - `GET /api/user` - Current user
   - `POST /api/hologram/model` - Change 3D model
   - `POST /api/jarvis/command` - Voice command
3. **WebSocket server** for real-time updates
4. **Database** (SQLite) for users and settings

### File Structure
```
backend/
├── main.py
├── config.py
├── requirements.txt
├── api/
│   ├── routes.py
│   └── websocket.py
└── database/
    └── db.py
```

### Dependencies
```bash
pip install fastapi uvicorn websockets python-multipart pydantic sqlite3
```

### Assignee: __________ | Est. Time: 3-4 days

---

## 1.2 Frontend WebSocket Client

### Status: 🔴 Not Started | Priority: HIGH

### What Needs to Be Done
Connect frontend to backend via WebSocket for real-time data.

### Tasks
1. **Create `useWebSocket.ts` hook**
2. **Connect to `ws://localhost:8000/ws`**
3. **Handle events:** sensor updates, gestures, user changes
4. **Replace mock data** with real WebSocket data
5. **Auto-reconnect** on connection loss

### File to Create
```
frontend UI/src/hooks/useWebSocket.ts
```

### Code Example
```typescript
export function useWebSocket() {
    const [connected, setConnected] = useState(false)
    const ws = useRef<WebSocket | null>(null)

    useEffect(() => {
        ws.current = new WebSocket('ws://localhost:8000/ws')
        ws.current.onopen = () => setConnected(true)
        ws.current.onmessage = (e) => handleEvent(JSON.parse(e.data))
        return () => ws.current?.close()
    }, [])
}
```

### Assignee: __________ | Est. Time: 1-2 days

---

## 1.3 Dashboard Screen

### Status: 🔴 Not Started | Priority: HIGH

### What Needs to Be Done
Create the main control center screen for the HoloMat UI.

### Tasks
1. **Create `DashboardScreen.tsx`**
2. **Layout sections:**
   - 3D Hologram viewer (center)
   - Sensor status panel (left)
   - Jarvis panel (bottom)
   - Quick actions menu (right)
3. **Integrate with state** (Zustand)
4. **Responsive design** for different screens

### File to Create
```
frontend UI/src/screens/DashboardScreen.tsx
```

### Assignee: __________ | Est. Time: 2 days

---

## 1.4 Gesture Control (Software)

### Status: 🟡 Partial | Priority: HIGH

### What Needs to Be Done
Implement gesture recognition logic that will later connect to ultrasonic sensors.

### Current State
- Frontend has placeholder for gesture events
- No gesture detection algorithm

### Tasks
1. **Create gesture state in Zustand:**
   ```typescript
   gesture: 'none' | 'swipe_left' | 'swipe_right' | 'push' | 'pull'
   ```
2. **Create gesture handler functions:**
   - `onSwipeLeft()` - Navigate previous
   - `onSwipeRight()` - Navigate next
   - `onPush()` - Select/Confirm
   - `onPull()` - Back/Cancel
3. **UI animations** for gesture feedback
4. **Keyboard simulation** for testing (Arrow keys)
5. **WebSocket handler** to receive gesture events

### Files to Modify
```
frontend UI/src/stores/appStore.ts
frontend UI/src/hooks/useGestures.ts (CREATE)
```

### Assignee: __________ | Est. Time: 1-2 days

---

# PHASE 2: 3D & Visualization (MEDIUM PRIORITY)

---

## 2.1 3D File Rendering System

### Status: 🟡 Partial | Priority: HIGH

### Current State
- ✅ Three.js with basic shapes (Cube, Sphere, Torus)
- ❌ Cannot load external 3D files

### What Needs to Be Done
Enable loading of custom 3D models from files.

### Tasks
1. **Add GLTFLoader** for .gltf/.glb files
2. **Add OBJLoader** for .obj files
3. **Create file upload UI**
4. **Model caching** system
5. **Auto-scaling** to fit viewport

### Dependencies
```bash
npm install three @types/three
```

### Code Example
```typescript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

const loader = new GLTFLoader()
loader.load('/models/ironman.glb', (gltf) => {
    scene.add(gltf.scene)
})
```

### File to Modify
```
frontend UI/src/components/HologramScene.tsx
frontend UI/src/components/ModelUploader.tsx (CREATE)
```

### Assignee: __________ | Est. Time: 2 days

---

## 2.2 Blender Integration

### Status: 🔴 Not Started | Priority: MEDIUM

### What Needs to Be Done
Create a pipeline to export Blender models directly to HoloMat.

### Tasks
1. **Blender export script** - Export to GLTF with optimizations
2. **Material conversion** - Convert to holographic shader
3. **Animation export** - Preserve skeletal/morph animations
4. **Hot reload** - Auto-update when file changes
5. **Documentation** for 3D artists

### File to Create
```
tools/blender_export.py (Blender addon)
docs/blender-workflow.md
```

### Blender Export Settings
```
Format: GLTF 2.0 (.glb)
Materials: Principled BSDF → PBR
Animations: Bake all
Scale: 1 unit = 1 meter
```

### Assignee: __________ | Est. Time: 2-3 days

---

## 2.3 Real-Time Camera 3D Rendering

### Status: 🔴 Not Started | Priority: MEDIUM

### What Needs to Be Done
Create 3D visualization from camera input using depth estimation.

### Options
| Method | Tech | Requirements |
|--------|------|--------------|
| **NeRF/3D Gaussian** | AI-based | High GPU |
| **Depth Camera** | Intel RealSense | Hardware |
| **Photogrammetry** | Multiple photos | Processing time |
| **AR.js/8th Wall** | Browser AR | Simple setup |

### Tasks
1. **Research best approach** for Pi 3B+ constraints
2. **Camera feed integration** (already have webcam access)
3. **Point cloud generation** from depth
4. **Three.js point cloud renderer**
5. **Real-time updates** at 10+ FPS

### Recommended Approach for Pi
```
Use MediaPipe for body/hand tracking → 
Generate 3D mesh from landmarks →
Render in Three.js
```

### File to Create
```
frontend UI/src/components/CameraToMesh.tsx
```

### Assignee: __________ | Est. Time: 3-4 days

---

## 2.4 Unity/Unreal Integration (Optional)

### Status: 🔴 Not Started | Priority: LOW

### What Needs to Be Done
Alternative to Three.js for more complex 3D scenes.

### Options
| Option | Pros | Cons |
|--------|------|------|
| **Unity WebGL** | Rich features | Large bundle size |
| **Unreal Pixel Streaming** | Best graphics | Requires server |
| **PlayCanvas** | Web-native | Less features |

### Tasks (if Unity chosen)
1. **Unity WebGL build** with HoloMat scene
2. **JavaScript bridge** for React communication
3. **Event system** to receive commands
4. **Optimized shaders** for Pi

### Note
This is optional — Three.js may be sufficient for most use cases.

### Assignee: __________ | Est. Time: 4-5 days

---

# PHASE 3: AI & Voice (MEDIUM PRIORITY)

---

## 3.1 Jarvis Voice Enhancements

### Status: 🟡 Partial | Priority: MEDIUM

### Current State
- ✅ Web Speech API for STT/TTS
- ✅ Groq AI for responses
- ❌ No wake word detection
- ❌ Limited system commands

### Tasks
1. **Wake word detection** - "Hey Jarvis" using Porcupine
2. **Continuous listening mode** - Always ready
3. **Audio feedback** - Chime when activated
4. **Better TTS voice** - Edge TTS or ElevenLabs

### System Commands to Add
| Command | Action |
|---------|--------|
| "change model to [name]" | Switch 3D model |
| "rotate left/right" | Rotate hologram |
| "fullscreen" | Maximize hologram |
| "show sensors" | Display sensor panel |
| "take a photo" | Capture current view |

### File to Modify
```
frontend UI/src/services/aiService.ts
frontend UI/src/hooks/useVoiceAssistant.ts
```

### Assignee: __________ | Est. Time: 2 days

---

## 3.2 AI-Powered 3D Generation

### Status: 🔴 Not Started | Priority: LOW

### What Needs to Be Done
Use AI to generate or modify 3D models from text prompts.

### Options
| Service | Type | Cost |
|---------|------|------|
| **Point-E (OpenAI)** | Text-to-3D | API |
| **Shap-E** | Text-to-3D | Free/Open |
| **Meshy.ai** | Text-to-3D | Paid |
| **Stable Diffusion + 3D** | Image-to-3D | Free |

### Tasks
1. **API integration** with Shap-E or similar
2. **Prompt input UI** in Jarvis panel
3. **3D model conversion** to Three.js format
4. **Loading/progress indicator**

### Example Flow
```
User: "Hey Jarvis, create a 3D Iron Man helmet"
→ AI generates 3D model
→ Model loaded into hologram viewer
```

### Assignee: __________ | Est. Time: 3-4 days

---

# PHASE 4: Hardware Integration (LOW PRIORITY)

> ⚠️ **Note:** These modules can be done AFTER all software features are working. The software should work with mock data first.

---

## 4.1 PIR Motion Sensor
- **Priority:** Low (do after Phase 1-3)
- **Purpose:** Auto wake-up when approaching
- **Hardware:** HC-SR501 on GPIO 4
- **Assignee:** __________ | Est. Time: 1 day

---

## 4.2 LDR Light Sensor
- **Priority:** Low
- **Purpose:** Auto brightness adjustment
- **Hardware:** LDR + MCP3008 ADC
- **Assignee:** __________ | Est. Time: 1 day

---

## 4.3 Ultrasonic Gesture Sensors
- **Priority:** Low
- **Purpose:** Physical gesture detection
- **Hardware:** 3x HC-SR04 sensors
- **Assignee:** __________ | Est. Time: 2 days

---

## 4.4 Face Authentication (Hardware)
- **Priority:** Low
- **Purpose:** User recognition on Pi camera
- **Hardware:** USB Camera + OpenCV
- **Assignee:** __________ | Est. Time: 2-3 days

---

## 4.5 LCD Display Panels
- **Priority:** Low
- **Purpose:** Time, status, notifications
- **Hardware:** 2x I2C LCD 20x4
- **Assignee:** __________ | Est. Time: 1-2 days

---

## 4.6 LED Strip Control
- **Priority:** Low
- **Purpose:** Ambient Iron Man lighting
- **Hardware:** WS2812B on GPIO 18
- **Assignee:** __________ | Est. Time: 1-2 days

---

# Team Assignment Summary

| Priority | Module | Assignee | Status |
|----------|--------|----------|--------|
| **P1** | 1.1 Backend API | ________ | ⬜ |
| **P1** | 1.2 WebSocket Client | ________ | ⬜ |
| **P1** | 1.3 Dashboard Screen | ________ | ⬜ |
| **P1** | 1.4 Gesture Control (SW) | ________ | ⬜ |
| **P2** | 2.1 3D File Rendering | ________ | ⬜ |
| **P2** | 2.2 Blender Integration | ________ | ⬜ |
| **P2** | 2.3 Camera 3D Render | ________ | ⬜ |
| **P2** | 2.4 Unity (Optional) | ________ | ⬜ |
| **P3** | 3.1 Jarvis Enhancements | ________ | ⬜ |
| **P3** | 3.2 AI 3D Generation | ________ | ⬜ |
| **P4** | 4.1-4.6 Hardware | ________ | ⬜ Later |

---

## Recommended Team Split

**Team A (Frontend/3D):**
- Dashboard Screen
- 3D File Rendering
- Blender Integration
- Camera 3D Render

**Team B (Backend/AI):**
- Backend API Server
- WebSocket Integration
- Jarvis Enhancements
- AI 3D Generation

**Team C (Hardware - Later):**
- All sensor integrations
- LCD/LED control

---

## Git Branch Naming

```
feature/backend-api
feature/frontend-websocket
feature/dashboard-screen
feature/3d-file-loader
feature/blender-export
feature/camera-3d
feature/jarvis-wake-word
```
