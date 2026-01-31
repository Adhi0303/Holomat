import './index.css'
import './styles/modes.css'
import './styles/data-visualization.css'
import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from './stores/appStore'
import { HologramScene, ModelSelector, type ModelType } from './components/HologramScene'
import { StandbyScreen, ScanningScreen, WelcomeScreen, type ScreenState } from './screens'
import { useApiData } from './hooks/useApiData'
import { useVoiceAssistant } from './hooks/useVoiceAssistant'
import { useGestureEvents } from './hooks/useGestureEvents'
import { ScanMode, MeasureMode, SettingsMode, ExportMode, ModelMode, HomeMode, DataVisualizationMode } from './components/modes'

// Menu items for the circular dome
const menuItems = [
  { id: 'scan', icon: '📷', label: 'Scan' },
  { id: 'model', icon: '📦', label: '3D Model' },
  { id: 'measure', icon: '📐', label: 'Measure' },
  { id: 'analytics', icon: '📊', label: 'Analytics' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
  { id: 'export', icon: '📤', label: 'Export' },
  { id: 'voice', icon: '🎤', label: 'Voice' },
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
  const [tapTimeout, setTapTimeout] = useState<number | null>(null)

  const {
    userName,
    systemStats,
    lastResponse,
  } = useAppStore()

  // Enable API data fetching
  const { isConnected } = useApiData()

  // Voice assistant (Jarvis) with mode switching
  const { isListening, isSpeaking, transcript, toggleListening, isSupported } = useVoiceAssistant()

  // Handle voice-controlled mode switching
  useEffect(() => {
    const handleModeSwitch = (event: CustomEvent) => {
      const { mode } = event.detail
      console.log(`🎯 Voice command switching to: ${mode}`)
      setActiveMode(mode)
    }

    window.addEventListener('jarvis-mode-switch', handleModeSwitch as EventListener)
    return () => window.removeEventListener('jarvis-mode-switch', handleModeSwitch as EventListener)
  }, [])

  // Basic gesture events
  const { currentGesture } = useGestureEvents()

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Gesture event handlers are managed by the useGestureEvents hook

  // Mock sensor data for demo
  const sensors = [
    { id: 'motion', name: 'Motion', value: 'Active', status: 'active' as const },
    { id: 'light', name: 'Light', value: '100%', status: 'active' as const },
    { id: 'camera', name: 'Camera', value: 'Online', status: 'active' as const },
    { id: 'gesture', name: 'Gesture', value: 'Ready', status: 'active' as const }
  ]

  // Format time for display
  const formatTime = () => {
    return time.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Format date for display
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
    let tapCount = 0
    tapCount++

    // Clear existing timeout
    if (tapTimeout) {
      clearTimeout(tapTimeout)
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      // Check tap count after delay
      if (tapCount === 2 && !isFullscreen) {
        // Double tap - enter fullscreen
        setIsFullscreen(true)
      } else if (tapCount === 3 && isFullscreen) {
        // Triple tap - exit fullscreen
        setIsFullscreen(false)
      }
      tapCount = 0 // Reset
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
              <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`}></span>
              <span className={`status-label ${isConnected ? '' : 'offline'}`}>{isConnected ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}</span>
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
              <div 
                className={`cpu-fill ${!isConnected ? 'offline' : ''}`} 
                style={{ width: `${isConnected ? systemStats.cpu : 0}%` }}
              ></div>
            </div>
            <span className={`cpu-value ${!isConnected ? 'offline' : ''}`}>
              {isConnected ? `${systemStats.cpu}%` : 'N/A'}
            </span>
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
                  className={`dome-item ${activeMode === item.id ? 'active' : ''} ${!menuExpanded ? 'collapsed' : ''} ${item.id === 'voice' && (isListening || isSpeaking) ? 'voice-active' : ''}`}
                  onClick={() => {
                    if (item.id === 'voice') {
                      toggleListening()
                    } else {
                      setActiveMode(item.id)
                    }
                  }}
                  title={item.id === 'voice' ? 
                    (!isSupported ? 'Not Supported' :
                      isSpeaking ? 'SPEAKING...' :
                        isListening ? (transcript || 'LISTENING...') :
                          'Say "Hey Jarvis"') : item.label}
                  style={{ pointerEvents: menuExpanded ? 'auto' : 'none' }}
                >
                  <span className="dome-item-icon">
                    {item.id === 'voice' ? 
                      (isSpeaking ? '💬' : isListening ? '🎤' : item.icon) : 
                      item.icon}
                  </span>
                  <span className="dome-item-label">{item.label}</span>
                  {item.id === 'voice' && (isListening || isSpeaking) && (
                    <div className="voice-rings-small">
                      <div className="voice-ring-small"></div>
                      <div className="voice-ring-small"></div>
                    </div>
                  )}
                </button>
              ))}
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

          {/* Right - Mode Panel */}
          <aside className="info-panel">
            {/* Dynamic Mode Content */}
            {activeMode === 'home' && <HomeMode />}
            {activeMode === 'scan' && <ScanMode />}
            {activeMode === 'model' && <ModelMode />}
            {activeMode === 'measure' && <MeasureMode />}
            {activeMode === 'analytics' && <DataVisualizationMode />}
            {activeMode === 'settings' && <SettingsMode />}
            {activeMode === 'export' && <ExportMode />}

            {/* Compact Info Section */}
            <div className="panel-section compact">
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">MODE</span>
                  <span className="info-value highlight">{activeMode.toUpperCase()}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">MODEL</span>
                  <span className="info-value">{modelNames[currentModel]}</span>
                </div>
              </div>
            </div>

            {/* Compact Sensor Status */}
            <div className="panel-section sensors compact">
              <h3 className="panel-header">SENSORS</h3>
              <div className="sensor-grid compact">
                <div className={`sensor-item ${sensors.find(s => s.id === 'motion')?.status === 'active' ? 'active' : ''}`}>
                  <span className="sensor-dot"></span>
                  <span>Motion</span>
                </div>
                <div className={`sensor-item ${sensors.find(s => s.id === 'light')?.status === 'active' ? 'active' : ''}`}>
                  <span className="sensor-dot"></span>
                  <span>Light</span>
                </div>
                <div className={`sensor-item ${currentGesture !== 'READY' ? 'active' : ''}`}>
                  <span className="sensor-dot"></span>
                  <span>Gesture</span>
                </div>
                <div className={`sensor-item ${sensors.find(s => s.id === 'camera')?.status === 'active' ? 'active' : ''}`}>
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
