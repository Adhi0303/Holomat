# 🤖 HoloMat - Iron Man Inspired IoT Workstation

An **Iron Man-inspired holographic workstation** with circular dome interface, 3D holograms, voice assistant (Jarvis), and real-time IoT sensor integration.

![HoloMat Interface](https://img.shields.io/badge/Status-Operational-brightgreen)
![Tech Stack](https://img.shields.io/badge/Tech-React%20%7C%20FastAPI%20%7C%20Three.js-blue)
![Voice Assistant](https://img.shields.io/badge/Jarvis-Enabled-orange)

## ✨ Features

### 🎯 Core Interface
- **Circular Dome Menu** - 8 interactive modes with Iron Man styling
- **3D Holographic Models** - Interactive Three.js models (Cube, Sphere, Torus, Arc Reactor)
- **Real-time Status Bar** - System health, CPU usage, network status
- **Animated Transitions** - Smooth Framer Motion animations

### 🎤 Voice Assistant (Jarvis)
- **Speech Recognition** - Natural language voice commands
- **Text-to-Speech** - Jarvis responds with voice
- **Mode Switching** - "Switch to scan mode", "Show system status"
- **Smart Responses** - Contextual AI responses

### 📡 IoT Sensor System
- **Real-time Data** - WebSocket streaming sensor updates
- **Mock Sensors** - Motion, Light, Camera, Gesture, Temperature
- **Status Monitoring** - Live sensor health indicators
- **Data Visualization** - Interactive charts and analytics

### 🎮 Interactive Features
- **Gesture Recognition** - Basic hand gesture simulation
- **Data Export** - JSON, CSV, XML, PDF export functionality
- **System Analytics** - Performance metrics and trends
- **Fullscreen Mode** - Immersive hologram viewing

## 🏗️ Architecture

```
HoloMat/
├── holomat-backend/          # FastAPI Python backend
│   ├── api/                  # REST API endpoints
│   ├── hardware/             # IoT sensor interfaces
│   └── data/                 # Mock data generators
├── frontend UI/              # React TypeScript frontend
│   ├── src/components/       # UI components
│   ├── src/hooks/           # Custom React hooks
│   ├── src/modes/           # Application modes
│   └── src/styles/          # CSS styling
└── docs/                    # Documentation
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.8+ with pip
- **Modern browser** with WebGL support

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd HoloMat
```

### 2. Backend Setup
```bash
cd holomat-backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### 3. Frontend Setup
```bash
cd "frontend UI"
npm install
npm run dev
```

### 4. Access HoloMat
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8001/docs

## 🎯 Usage Guide

### Dome Menu Modes
1. **🏠 Home** - System overview and dashboard
2. **📷 Scan** - Face scanning simulation
3. **📦 Model** - 3D model controls and viewer
4. **📐 Measure** - Measurement tools and calibration
5. **📊 Analytics** - Data visualization dashboard
6. **⚙️ Settings** - System configuration
7. **📤 Export** - Data export functionality
8. **🎤 Voice** - Jarvis voice assistant activation

### Voice Commands
- *"Hello Jarvis"* - Greeting and activation
- *"System status"* - Get system health report
- *"Switch to [mode] mode"* - Navigate between modes
- *"What time is it"* - Current time
- *"Show analytics"* - Open data dashboard

### Gesture Controls
- **Swipe Up/Down** - Navigate menus
- **Grab** - Activate voice assistant
- **Point** - Select items
- **Tap** - Confirm actions
- **Double Tap** - Toggle fullscreen

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **WebSocket** - Real-time data streaming
- **Pydantic** - Data validation and serialization
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI framework with hooks
- **TypeScript** - Type-safe JavaScript
- **Three.js** - 3D graphics and holograms
- **Framer Motion** - Smooth animations
- **Recharts** - Data visualization
- **Web Speech API** - Voice recognition

### IoT Integration
- **Mock Sensors** - Realistic sensor simulation
- **WebSocket Streaming** - Real-time data updates
- **Modular Design** - Easy hardware integration

## 📊 API Endpoints

### Sensors
- `GET /api/sensors` - Get all sensor data
- `GET /api/sensors/{sensor_id}` - Get specific sensor
- `POST /api/sensors/calibrate` - Calibrate sensors

### System
- `GET /api/system-stats` - System performance metrics
- `GET /api/system/health` - Health check

### Voice Assistant
- `POST /api/jarvis/command` - Process voice commands

### Data Export
- `POST /api/sensors/export` - Export sensor data

## 🔧 Configuration

### Environment Variables
```bash
# Backend (.env)
DEBUG=true
WEBSOCKET_HOST=127.0.0.1
WEBSOCKET_PORT=8001

# Frontend (.env.local)
VITE_API_URL=http://localhost:8001
VITE_WS_URL=ws://localhost:8001
```

### Sensor Configuration
Edit `holomat-backend/hardware/mock_sensors.py` to customize sensor behavior:
- Update intervals
- Value ranges
- Sensor types
- Simulation patterns

## 🎨 Customization

### Adding New Modes
1. Create component in `frontend UI/src/components/modes/`
2. Add to dome menu in `App.tsx`
3. Update CSS positioning in `components.css`

### Custom Voice Commands
1. Add patterns to `holomat-backend/api/jarvis.py`
2. Update frontend voice hook in `useVoiceAssistant.ts`

### New 3D Models
1. Add model to `HologramScene.tsx`
2. Update model selector options
3. Add Three.js geometry definitions

## 🚨 Troubleshooting

### Common Issues

**WebSocket Connection Failed**
```bash
# Check if backend is running on correct port
lsof -i:8001
# Update WebSocket URL in useWebSocket.ts
```

**Voice Recognition Not Working**
- Enable microphone permissions in browser
- Use HTTPS for production deployment
- Check browser compatibility (Chrome/Edge recommended)

**3D Models Not Loading**
- Ensure WebGL is enabled in browser
- Check browser console for Three.js errors
- Verify GPU acceleration is available

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Iron Man/Marvel** - Inspiration for the holographic interface design
- **Three.js Community** - 3D graphics and WebGL support
- **FastAPI Team** - Modern Python web framework
- **React Team** - Component-based UI framework

## 🔮 Future Enhancements

- [ ] Real IoT hardware integration (Raspberry Pi, Arduino)
- [ ] OpenCV face recognition system
- [ ] Advanced gesture recognition with computer vision
- [ ] Mobile app companion
- [ ] Cloud deployment and scaling
- [ ] Machine learning for predictive analytics
- [ ] Augmented reality (AR) support

---

**Built with ❤️ by [Your Name]**

*"Sometimes you gotta run before you can walk." - Tony Stark*