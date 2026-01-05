import './index.css'
import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from './stores/appStore'
import { HologramScene, ModelSelector, type ModelType } from './components/HologramScene'
import { StandbyScreen, ScanningScreen, WelcomeScreen, type ScreenState } from './screens'
import { useMockData } from './hooks/useMockData'
import { useVoiceAssistant } from './hooks/useVoiceAssistant'

// Menu items for the circular dome
const menuItems = [
  { id: 'scan', icon: '📷', label: 'Scan' },
  { id: 'model', icon: '📦', label: '3D Model' },
  { id: 'measure', icon: '📐', label: 'Measure' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
  { id: 'export', icon: '📤', label: 'Export' },
  { id: 'home', icon: '🏠', label: 'Home' },
]

function App() {
  // Screen state
  const [screenState, setScreenState] = useState<ScreenState>('standby')
  const [showSystemReady, setShowSystemReady] = useState(false)

  // Dashboard state
  const [activeMode, setActiveMode] = useState('home')
  const [currentModel, setCurrentModel] = useState<ModelType>('cube')
  const [time, setTime] = useState(new Date())
  const [menuExpanded, setMenuExpanded] = useState(true) // Menu toggle state
  const [isFullscreen, setIsFullscreen] = useState(false) // Hologram fullscreen
  const [tapCount, setTapCount] = useState(0)
  const [tapTimeout, setTapTimeout] = useState<number | null>(null)

  const {
    userName,
    systemStats,
    lastResponse,
  } = useAppStore()

  // Enable mock data simulation
  useMockData()

  // Voice assistant (Jarvis)
  const { isListening, isSpeaking, transcript, toggleListening, isSupported } = useVoiceAssistant()

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = () => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDate = () => {
    return time.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Model names for display
  const modelNames: Record<ModelType, string> = {
    cube: 'CUBE',
    sphere: 'SPHERE',
    torus: 'TORUS',
    reactor: 'ARC REACTOR'
  }

  // Screen transition handlers
  const handleActivate = useCallback(() => {
    setScreenState('scanning')
  }, [])

  const handleScanComplete = useCallback(() => {
    setScreenState('welcome')
  }, [])

  const handleWelcomeComplete = useCallback(() => {
    setScreenState('dashboard')
    setShowSystemReady(true) // Show system ready popup
  }, [])

  // Keyboard shortcut to reset to standby (for demo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false) // Exit fullscreen first
        } else {
          setScreenState('standby')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  // Handle tap detection for fullscreen
  const handleHologramTap = () => {
    setTapCount(prev => prev + 1)

    // Clear existing timeout
    if (tapTimeout) {
      clearTimeout(tapTimeout)
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      // Check tap count after delay
      setTapCount(current => {
        if (current === 2 && !isFullscreen) {
          // Double tap - enter fullscreen
          setIsFullscreen(true)
        } else if (current === 3 && isFullscreen) {
          // Triple tap - exit fullscreen
          setIsFullscreen(false)
        }
        return 0 // Reset
      })
    }, 300) // 300ms window for detecting taps

    setTapTimeout(timeout)
  }

  return (
    <>
      {/* Screen overlays */}
      <AnimatePresence mode="wait">
        {screenState === 'standby' && (
          <StandbyScreen key="standby" onActivate={handleActivate} />
        )}
        {screenState === 'scanning' && (
          <ScanningScreen
            key="scanning"
            onComplete={handleScanComplete}
          />
        )}
        {screenState === 'welcome' && (
          <WelcomeScreen
            key="welcome"
            userName={userName}
            onComplete={handleWelcomeComplete}
          />
        )}
      </AnimatePresence>

      {/* Main Dashboard (always rendered, hidden during other screens) */}
      <motion.div
        className="holomat-app"
        initial={{ opacity: 0 }}
        animate={{ opacity: screenState === 'dashboard' ? 1 : 0 }}
        style={{ pointerEvents: screenState === 'dashboard' ? 'auto' : 'none' }}
      >
        {/* Top Status Bar */}
        <header className="status-bar">
          <div className="status-left">
            <div className="system-status">
              <span className="status-indicator online"></span>
              <span className="status-label">SYSTEM ONLINE</span>
            </div>
            <div className="device-status">
              <span className="device-icon" title="Camera">📷</span>
              <span className="device-icon" title="Sensors">📡</span>
              <span className="device-icon" title="AI">🤖</span>
            </div>
          </div>

          <div className="status-center">
            <span className="cpu-label">CPU</span>
            <div className="cpu-bar">
              <div className="cpu-fill" style={{ width: `${systemStats.cpu}%` }}></div>
            </div>
            <span className="cpu-value">{systemStats.cpu}%</span>
          </div>

          <div className="status-right">
            <span className="date-display">{formatDate()}</span>
            <span className="time-display">{formatTime()}</span>
            <div className="network-icons">
              <span className="network-icon wifi">📶</span>
              <span className="network-icon">🔋</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-container">
          {/* Left - Circular Dome Menu */}
          <aside className="dome-container">
            <div className="dome-menu">
              <div className="dome-center">
                <div
                  className="dome-core"
                  onClick={() => setMenuExpanded(!menuExpanded)}
                >
                  <span className="core-icon">⚡</span>
                </div>
              </div>
              <div className="dome-ring"></div>
              <div className="dome-ring outer"></div>
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={`dome-item ${activeMode === item.id ? 'active' : ''} ${!menuExpanded ? 'collapsed' : ''}`}
                  onClick={() => setActiveMode(item.id)}
                  title={item.label}
                  style={{ pointerEvents: menuExpanded ? 'auto' : 'none' }}
                >
                  <span className="dome-item-icon">{item.icon}</span>
                  <span className="dome-item-label">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Jarvis Voice Button - Under dome menu */}
            <div className="voice-section voice-section--left">
              <button
                className={`voice-button ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
                onClick={toggleListening}
                disabled={!isSupported}
              >
                <div className="voice-rings">
                  <div className="voice-ring"></div>
                  <div className="voice-ring"></div>
                  <div className="voice-ring"></div>
                </div>
                <div className="voice-icon">{isSpeaking ? '💬' : '🎤'}</div>
                {(isListening || isSpeaking) && (
                  <div className="waveform">
                    <span className="wave-bar"></span>
                    <span className="wave-bar"></span>
                    <span className="wave-bar"></span>
                    <span className="wave-bar"></span>
                    <span className="wave-bar"></span>
                  </div>
                )}
              </button>
              <span className="voice-label">
                {!isSupported ? 'Not Supported' :
                  isSpeaking ? 'SPEAKING...' :
                    isListening ? (transcript || 'LISTENING...') :
                      'Say "Hey Jarvis"'}
              </span>
            </div>
          </aside>

          {/* Center - Three.js Hologram Viewer */}
          <section className="hologram-section">
            <div
              className={`hologram-viewer ${isFullscreen ? 'fullscreen' : ''}`}
              onClick={handleHologramTap}
            >
              <div className="hud-corners">
                <div className="hud-corner top-left"></div>
                <div className="hud-corner top-right"></div>
                <div className="hud-corner bottom-left"></div>
                <div className="hud-corner bottom-right"></div>
              </div>
              <div className="three-canvas-container">
                <HologramScene
                  modelType={currentModel}
                  showParticles={true}
                  showGrid={true}
                />
              </div>
              <div className="hologram-info">
                <span className="model-name">{modelNames[currentModel]}</span>
                <span className="drag-hint">
                  {isFullscreen
                    ? 'Triple-tap to exit fullscreen'
                    : 'Double-tap for fullscreen • Drag to rotate • Scroll to zoom'
                  }
                </span>
              </div>
            </div>

            {/* Model Selector */}
            <ModelSelector
              currentModel={currentModel}
              onSelect={setCurrentModel}
            />
          </section>

          {/* Right - Info Panel */}
          <aside className="info-panel">
            <div className="panel-section">
              <h3 className="panel-header">INFORMATION</h3>
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">MODE</span>
                  <span className="info-value highlight">{activeMode.toUpperCase()}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">MODEL</span>
                  <span className="info-value">{modelNames[currentModel]}</span>
                </div>
                <div className="info-row coordinates">
                  <div className="coord">
                    <span className="coord-label">X</span>
                    <span className="coord-value">100</span>
                  </div>
                  <div className="coord">
                    <span className="coord-label">Y</span>
                    <span className="coord-value">0</span>
                  </div>
                  <div className="coord">
                    <span className="coord-label">Z</span>
                    <span className="coord-value">20</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-section">
              <h3 className="panel-header">DIMENSIONS</h3>
              <div className="dimension-info">
                <div className="dim-row">
                  <span>📐 150mm × 100mm</span>
                </div>
                <div className="dim-row">
                  <span className="dim-label-inline">MATERIAL</span>
                  <span className="dim-value">Hologram</span>
                </div>
                <div className="dim-row">
                  <span className="dim-label-inline">RENDER</span>
                  <span className="dim-value">Three.js</span>
                </div>
              </div>
            </div>

            <div className="panel-section sensors">
              <h3 className="panel-header">SENSORS</h3>
              <div className="sensor-grid">
                <div className="sensor-item active">
                  <span className="sensor-dot"></span>
                  <span>Motion</span>
                </div>
                <div className="sensor-item active">
                  <span className="sensor-dot"></span>
                  <span>Light</span>
                </div>
                <div className="sensor-item">
                  <span className="sensor-dot"></span>
                  <span>Gesture</span>
                </div>
                <div className="sensor-item active">
                  <span className="sensor-dot"></span>
                  <span>Camera</span>
                </div>
              </div>
            </div>
          </aside>
        </main>

        {/* Bottom Section */}
        <footer className="bottom-section">
          {/* Center Branding */}
          <div className="branding">
            <span className="brand-sub">Press ESC to reset</span>
          </div>
        </footer>
      </motion.div>

      {/* System Ready Popup */}
      <AnimatePresence>
        {showSystemReady && (
          <motion.div
            className="system-ready-popup"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onClick={() => setShowSystemReady(false)}
          >
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              <div className="popup-icon">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  ✓
                </motion.div>
              </div>
              <h2 className="popup-title">System Ready</h2>
              <p className="popup-message">{lastResponse}</p>
              <div className="popup-status">
                <span className="status-indicator-dot"></span>
                <span>All systems operational</span>
              </div>
              <p className="popup-hint">Click anywhere to continue</p>
            </div>
            <div className="popup-overlay" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default App
