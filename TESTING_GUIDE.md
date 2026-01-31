# 🧪 HoloMat Testing Guide

## 🚀 How to Test Everything

### 1. Start Backend Server
```bash
cd "Holomat/holomat-backend"
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
**Expected**: Server starts on http://127.0.0.1:8000

### 2. Start Frontend
```bash
cd "Holomat/frontend UI"
npm install
npm run dev
```
**Expected**: Frontend starts on http://localhost:5173

## 📡 API Endpoints That Work

### Basic Sensor Data
```bash
curl http://127.0.0.1:8000/api/sensors
```
**Response**: Array of 8 sensors with real-time values

### Detailed Measurements (Measure Mode)
```bash
curl http://127.0.0.1:8000/api/sensors/measurements
```
**Response**: Distance, angle, temperature, humidity with timestamp

### Face Scan (Scan Mode)
```bash
curl -X POST http://127.0.0.1:8000/api/sensors/scan/start
```
**Response**: Scan ID and status

### Gesture Testing
```bash
curl -X POST http://127.0.0.1:8000/api/test/gesture/SWIPE_LEFT
```
**Response**: Gesture triggered confirmation

### Motion Testing
```bash
curl -X POST http://127.0.0.1:8000/api/test/motion/trigger
```
**Response**: Motion triggered confirmation

### Settings (Settings Mode)
```bash
curl http://127.0.0.1:8000/api/sensors/settings
```
**Response**: Current sensor configuration

### Export Data (Export Mode)
```bash
curl -X POST http://127.0.0.1:8000/api/sensors/export \
  -H "Content-Type: application/json" \
  -d '{"format":"json","data_types":["sensorData"]}'
```
**Response**: Export ID and download info

### System Health (Home Mode)
```bash
curl http://127.0.0.1:8000/api/sensors/health
```
**Response**: System health percentages and stats

### Jarvis Commands
```bash
curl -X POST http://127.0.0.1:8000/api/jarvis/command \
  -H "Content-Type: application/json" \
  -d '{"command":"activate hologram"}'
```
**Response**: Jarvis acknowledgment

## 🎮 Frontend Features That Work

### Circular Dome Menu
- ✅ **Home Mode**: System dashboard with health stats
- ✅ **Scan Mode**: Face recognition with progress animation
- ✅ **Model Mode**: 3D model controls and presets
- ✅ **Measure Mode**: Real-time sensor measurements
- ✅ **Settings Mode**: Sensor configuration panels
- ✅ **Export Mode**: Data export with format selection

### 3D Hologram Viewer
- ✅ **4 Models**: Cube, Sphere, Torus, Arc Reactor
- ✅ **Interactive**: Drag to rotate, scroll to zoom
- ✅ **Fullscreen**: Double-tap to enter, triple-tap to exit
- ✅ **Effects**: Particles, grid, glow materials

### Real-time Updates
- ✅ **WebSocket**: Live sensor data streaming
- ✅ **Sensor Status**: Motion, light, gesture, camera indicators
- ✅ **System Stats**: CPU, RAM, temperature monitoring

### Voice Assistant
- ✅ **Jarvis Panel**: Voice recording button
- ✅ **Visual Feedback**: Waveform animation
- ✅ **State Management**: Idle, listening, speaking states

## 🔧 Testing Scenarios

### Test Motion Detection
1. Open frontend
2. Click dome menu → **Home Mode**
3. Use API: `POST /api/test/motion/trigger`
4. **Expected**: Motion sensor shows "ACTIVE" in dashboard

### Test Gesture Recognition
1. Click dome menu → **Measure Mode**
2. Use API: `POST /api/test/gesture/SWIPE_LEFT`
3. **Expected**: Gesture sensor shows "SWIPE_LEFT"

### Test Face Scan
1. Click dome menu → **Scan Mode**
2. Click "START SCAN" button
3. **Expected**: Animated scan with progress bar, then results

### Test Settings
1. Click dome menu → **Settings Mode**
2. Adjust sliders (motion sensitivity, LED brightness)
3. **Expected**: Settings update in real-time

### Test Export
1. Click dome menu → **Export Mode**
2. Select format (JSON/CSV/XML/PDF)
3. Select data types
4. Click "START EXPORT"
5. **Expected**: Export progress, then download link

### Test 3D Models
1. Use model selector buttons (📦🔮⭕⚡)
2. **Expected**: 3D model changes with smooth transition
3. Double-tap hologram area
4. **Expected**: Fullscreen mode

## 📊 Expected Behavior

### Sensor Values Change Every 100ms
- **Motion**: Random ACTIVE/IDLE
- **Distance**: 50-150cm with gradual changes
- **Temperature**: 20-30°C with slow drift
- **Humidity**: 40-70% with realistic changes
- **Light**: 0-100% gradual changes
- **Gesture**: READY → SWIPE_LEFT/RIGHT/GRAB/PUSH/PULL

### WebSocket Updates Every 2 seconds
- System stats (CPU/RAM/Temp)
- Sensor readings
- Real-time dashboard updates

### Interactive Features
- All dome menu modes are functional
- Settings actually affect sensor behavior
- Export generates realistic file sizes
- Scan mode has realistic timing (3 seconds)

## 🎯 Success Indicators

✅ **Backend**: All API endpoints return JSON responses
✅ **Frontend**: Dome menu switches between 6 functional modes
✅ **WebSocket**: Real-time data updates in UI
✅ **3D Viewer**: Interactive hologram with 4 models
✅ **Sensors**: Realistic IoT sensor simulation
✅ **Testing**: Manual trigger endpoints work

## 🚨 Troubleshooting

**Backend won't start**: Install dependencies
```bash
pip install fastapi uvicorn
```

**Frontend won't start**: Install Node.js dependencies
```bash
npm install
```

**No WebSocket data**: Check backend is running on port 8000

**API errors**: Verify endpoints with browser: http://127.0.0.1:8000/docs