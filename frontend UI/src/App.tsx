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
import { HandTrackingOverlay } from './components/HandTrackingOverlay'
import { VirtualHandCursor } from './components/VirtualHandCursor'
import { useHandClick } from './hooks/useHandClick'
import { useGestureSync } from './hooks/useGestureSync'

// New eDEX-UI Zone Components
import { SystemInfoPanel } from './components/SystemInfoPanel'
import { ModeNavTabs } from './components/ModeNavTabs'
import { JarvisTerminal } from './components/JarvisTerminal'
import { VirtualKeyboard } from './components/VirtualKeyboard'

// Mode Components
import { ScanMode, MeasureMode, SettingsMode, ExportMode, ModelMode, DataVisualizationMode, CanvasMode } from './components/modes'
import { DesignMode } from './components/DesignMode'

// Icons
import { Zap, FolderOpen, FileText, Database, Image, Save } from 'lucide-react'

function App() {
  // Screen state
  const [screenState, setScreenState] = useState<ScreenState>('standby')
  const [showSystemReady, setShowSystemReady] = useState(false)

  // Dashboard state
  const [activeMode, setActiveMode] = useState('home')
  const [currentModel, setCurrentModel] = useState<ModelType>('cube')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [keyboardInput, setKeyboardInput] = useState('')
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'jarvis', message: string }>>([])
  const [waitingForResponse, setWaitingForResponse] = useState(false)
  const [designPrompt, setDesignPrompt] = useState('')
  const [designStyle, setDesignStyle] = useState('holographic')

  const { userName, lastResponse } = useAppStore()
  const { isConnected } = useApiData()
  const { isListening, isSpeaking, transcript, toggleListening, processTextCommand } = useVoiceAssistant()

  // Control client: send bypass to projector over WebSocket
  const { sendBypass, isConnected: piConnected } = useGestureSync('control')

  // Activate hand→click dispatcher when on dashboard
  useHandClick()

  // Track Jarvis responses for keyboard chat
  useEffect(() => {
    if (waitingForResponse && lastResponse && !isSpeaking) {
      setConversationHistory(prev => [...prev, { role: 'jarvis', message: lastResponse }])
      setWaitingForResponse(false)
    }
  }, [lastResponse, isSpeaking, waitingForResponse])

  // Handle voice-controlled mode switching
  useEffect(() => {
    const handleModeSwitch = (event: CustomEvent) => {
      const { mode } = event.detail
      setActiveMode(mode)
    }
    window.addEventListener('jarvis-mode-switch', handleModeSwitch as EventListener)
    return () => window.removeEventListener('jarvis-mode-switch', handleModeSwitch as EventListener)
  }, [])

  // Handle Jarvis image generation events from voice/text commands
  useEffect(() => {
    const handleImageGen = (event: CustomEvent) => {
      const { prompt, style } = event.detail
      setDesignPrompt(prompt || '')
      setDesignStyle(style || 'holographic')
      setActiveMode('design') // Auto-switch to Design mode
    }
    window.addEventListener('jarvis-image-generated', handleImageGen as EventListener)
    return () => window.removeEventListener('jarvis-image-generated', handleImageGen as EventListener)
  }, [])

  // Handle Jarvis 3D model generation events
  useEffect(() => {
    const handle3DGen = (event: CustomEvent) => {
      const { url } = event.detail
      if (url) {
        setCurrentModel(url)
        setActiveMode('home') // Auto-switch to view model
      }
    }
    window.addEventListener('jarvis-3d-generated', handle3DGen as EventListener)
    return () => window.removeEventListener('jarvis-3d-generated', handle3DGen as EventListener)
  }, [])

  // Keyboard shortcut: ESC to reset
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isKeyboardOpen) {
        if (isFullscreen) {
          setIsFullscreen(false)
        } else {
          setScreenState('standby')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, isKeyboardOpen])

  // Model names for display
  const modelNames: Record<ModelType, string> = {
    cube: 'CUBE', sphere: 'SPHERE', torus: 'TORUS', reactor: 'ARC REACTOR'
  }

  // Screen transition handlers
  const handleActivate = useCallback(() => setScreenState('scanning'), [])
  const handleScanComplete = useCallback(() => setScreenState('welcome'), [])
  const handleWelcomeComplete = useCallback(() => {
    setScreenState('dashboard')
    setShowSystemReady(true)
  }, [])

  // Terminal & keyboard submit
  const handleTerminalSubmit = useCallback((text: string) => {
    processTextCommand(text)
  }, [processTextCommand])

  const handleKeyboardSubmit = async () => {
    if (keyboardInput.trim()) {
      const userMessage = keyboardInput
      setConversationHistory(prev => [...prev, { role: 'user', message: userMessage }])
      setKeyboardInput('')
      setWaitingForResponse(true)
      
      await processTextCommand(userMessage)
    }
  }

  return (
    <>
      {/* Screen overlays */}
      <AnimatePresence mode="wait">
        {screenState === 'standby' && <StandbyScreen key="standby" onActivate={handleActivate} />}
        {screenState === 'scanning' && <ScanningScreen key="scanning" onComplete={handleScanComplete} />}
        {screenState === 'welcome' && <WelcomeScreen key="welcome" userName={userName} onComplete={handleWelcomeComplete} />}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════
          5-ZONE GRID DASHBOARD (eDEX-UI Inspired)
          ═══════════════════════════════════════════ */}
      <motion.div
        className={`holomat-grid${isKeyboardOpen ? ' holomat-grid--keyboard-open' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: screenState === 'dashboard' ? 1 : 0 }}
        style={{ pointerEvents: screenState === 'dashboard' ? 'auto' : 'none' }}
      >
        {/* ── HEADER BAR (Top) ── */}
        <div className="zone zone--header">
          <div className="header-bar">
            <div className="header-section">
              <Zap size={14} color="var(--color-primary)" />
              <span className="header-title">HOLOMAT</span>
              <span className="header-tab active">SYSTEM</span>
              <span className="header-tab">TERMINAL</span>
              <span className="header-tab">NETWORK</span>
            </div>
            <div className="header-section">
              <span className="header-stat">USER: <strong>{userName}</strong></span>
              <span className="header-stat">MODE: <strong>{activeMode.toUpperCase()}</strong></span>
            </div>
          </div>
        </div>

        {/* ── ZONE 1: System Info (Left) ── */}
        <SystemInfoPanel />

        {/* ── ZONE 2: Main Viewport (Center) ── */}
        <div className="zone zone--viewport">
          <div className="viewport-container">
            {/* HUD Corners */}
            <div className="viewport-hud">
              <div className="viewport-corner tl" />
              <div className="viewport-corner tr" />
              <div className="viewport-corner bl" />
              <div className="viewport-corner br" />
              <span className="viewport-mode-label">{activeMode.toUpperCase()}</span>
              <div className="viewport-info">
                <span>MODEL: {modelNames[currentModel]}</span>
                <span>DRAG TO ROTATE</span>
              </div>
            </div>

            {/* Content Area */}
            <div className="viewport-canvas">
              {activeMode === 'home' && (
                <>
                  <HologramScene modelType={currentModel} showParticles={true} showGrid={true} />
                  <ModelSelector currentModel={currentModel} onSelect={setCurrentModel} />
                </>
              )}
              {activeMode === 'scan'      && <ScanMode />}
              {activeMode === 'model'     && <ModelMode />}
              {activeMode === 'canvas'    && <CanvasMode />}
              {activeMode === 'measure'   && <MeasureMode />}
              {activeMode === 'analytics' && <DataVisualizationMode />}
              {activeMode === 'settings'  && <SettingsMode />}
              {activeMode === 'export'    && <ExportMode />}
              {activeMode === 'design'    && (
                <DesignMode
                  key={designPrompt} // re-mount when prompt changes from voice
                  initialPrompt={designPrompt}
                  initialStyle={designStyle}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── ZONE 3: Control Panel (Right) ── */}
        <ModeNavTabs
          activeMode={activeMode}
          onModeChange={setActiveMode}
          isListening={isListening}
          isSpeaking={isSpeaking}
          isConnected={isConnected}
          onToggleVoice={toggleListening}
          onOpenKeyboard={() => setIsKeyboardOpen(true)}
        />

        {/* ── ZONE 4: Quick Actions (Bottom Left) — fades out when keyboard opens ── */}
        <AnimatePresence>
          {!isKeyboardOpen && (
            <motion.div
              key="actions"
              className="zone zone--actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="zone-header">
                <span className="zone-dot" />
                <span>actions</span>
              </div>
              <div className="zone-body">
                <div className="quickactions-grid">
                  <button className="quickaction-btn" onClick={() => setActiveMode('scan')}>
                    <FolderOpen size={16} /> <span>SCAN</span>
                  </button>
                  <button className="quickaction-btn" onClick={() => setActiveMode('export')}>
                    <Save size={16} /> <span>EXPORT</span>
                  </button>
                  <button className="quickaction-btn" onClick={() => setActiveMode('analytics')}>
                    <Database size={16} /> <span>DATA</span>
                  </button>
                  <button className="quickaction-btn" onClick={() => setActiveMode('model')}>
                    <Image size={16} /> <span>3D</span>
                  </button>
                  <button className="quickaction-btn design" onClick={() => { setDesignPrompt(''); setActiveMode('design') }}>
                    <Zap size={16} /> <span>DESIGN</span>
                  </button>
                  <button className="quickaction-btn">
                    <FileText size={16} /> <span>LOGS</span>
                  </button>
                  <button className="quickaction-btn" onClick={() => setScreenState('standby')}>
                    <Zap size={16} /> <span>LOCK</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ZONE 5: Jarvis Terminal (Bottom Center) ── */}
        <JarvisTerminal
          onSubmit={handleTerminalSubmit}
          transcript={transcript}
          isListening={isListening}
          isSpeaking={isSpeaking}
        />

        {/* ── ZONE 4b: Virtual Keyboard (inline, next to terminal) ── */}
        <AnimatePresence>
          {isKeyboardOpen && (
            <motion.div
              key="keyboard"
              className="zone zone--keyboard"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <VirtualKeyboard
                inputValue={keyboardInput}
                setInputValue={setKeyboardInput}
                onSubmit={handleKeyboardSubmit}
                onClose={() => {
                  setIsKeyboardOpen(false)
                  setConversationHistory([])
                }}
                conversationHistory={conversationHistory}
              />
            </motion.div>
          )}
        </AnimatePresence>
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
            <div className="popup-content" onClick={e => e.stopPropagation()}>
              <div className="popup-icon">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>✓</motion.div>
              </div>
              <h2 className="popup-title">System Ready</h2>
              <p className="popup-message">{lastResponse}</p>
              <div className="popup-status">
                <span className="status-indicator-dot" />
                <span>All systems operational</span>
              </div>
              <p className="popup-hint">Click anywhere to continue</p>
            </div>
            <div className="popup-overlay" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hand Tracking Overlay (only active on dashboard, not during boot) ── */}
      <HandTrackingOverlay enabled={screenState === 'dashboard'} />

      {/* ── Virtual Hand Cursor (full-screen pointer following hand position) ── */}
      {screenState === 'dashboard' && <VirtualHandCursor />}

      {/* ── Floating Projector Bypass Button (visible on laptop during standby/scan/welcome) ── */}
      {screenState !== 'dashboard' && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
        }}>
          <button
            onClick={sendBypass}
            disabled={!piConnected}
            style={{
              padding: '12px 24px',
              background: piConnected ? 'rgba(0, 212, 255, 0.12)' : 'rgba(60,60,60,0.3)',
              border: `1px solid ${piConnected ? 'rgba(0,212,255,0.7)' : 'rgba(100,100,100,0.3)'}`,
              color: piConnected ? 'rgba(0,212,255,1)' : 'rgba(120,120,120,0.5)',
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: '13px',
              letterSpacing: '0.2em',
              cursor: piConnected ? 'pointer' : 'not-allowed',
              borderRadius: '6px',
              backdropFilter: 'blur(10px)',
              boxShadow: piConnected ? '0 0 20px rgba(0,212,255,0.2)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            ⚡ UNLOCK PROJECTOR
          </button>
          <span style={{
            fontSize: '9px',
            color: piConnected ? 'rgba(0,212,255,0.4)' : 'rgba(255,80,80,0.5)',
            fontFamily: 'Share Tech Mono, monospace',
            letterSpacing: '0.15em',
          }}>
            {piConnected ? 'PI CONNECTED' : 'PI DISCONNECTED'}
          </span>
        </div>
      )}
    </>
  )
}

export default App
