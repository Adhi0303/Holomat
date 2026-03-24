/**
 * ModeNavTabs — Zone 3 (Right) Navigation
 * Vertical tab list replacing the circular dome menu
 */
import { Camera, Box, Ruler, BarChart3, Settings, Download, Mic, Keyboard, Home, Wifi, WifiOff, Radio, Sparkles } from 'lucide-react'
import { useAppStore } from '../stores/appStore'

interface ModeNavTabsProps {
  activeMode: string
  onModeChange: (mode: string) => void
  isListening: boolean
  isSpeaking: boolean
  isConnected: boolean
  onToggleVoice: () => void
  onOpenKeyboard: () => void
}

const modeItems = [
  { id: 'home',      icon: Home,     label: 'Home'      },
  { id: 'scan',      icon: Camera,   label: 'Scan'      },
  { id: 'model',     icon: Box,      label: '3D Model'  },
  { id: 'design',    icon: Sparkles, label: 'Design'    },
  { id: 'measure',   icon: Ruler,    label: 'Measure'   },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'settings',  icon: Settings, label: 'Settings'  },
  { id: 'export',    icon: Download, label: 'Export'    },
]

export function ModeNavTabs({
  activeMode, onModeChange, isListening, isSpeaking,
  isConnected, onToggleVoice, onOpenKeyboard
}: ModeNavTabsProps) {
  return (
    <div className="zone zone--sensors">
      <div className="zone-header">
        <span className="zone-dot" />
        <span>control</span>
      </div>
      <div className="zone-body">
        {/* Connection Status */}
        <div className="nav-status-block">
          <div className="nav-status-row">
            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className={isConnected ? 'status-online' : 'status-offline'}>
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Sensor Indicators */}
        <div className="nav-sensor-block">
          <div className="nav-section-title">SENSORS</div>
          <SensorDot label="Motion" active />
          <SensorDot label="Light" active />
          <SensorDot label="Camera" active />
        </div>

        {/* Mode Navigation */}
        <div className="nav-mode-block">
          <div className="nav-section-title">MODULES</div>
          {modeItems.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`nav-tab ${activeMode === item.id ? 'nav-tab--active' : ''}`}
                onClick={() => onModeChange(item.id)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Voice & Keyboard Controls */}
        <div className="nav-controls-block">
          <div className="nav-section-title">INPUT</div>
          <button
            className={`nav-tab nav-tab--voice ${isListening ? 'nav-tab--active listening' : ''} ${isSpeaking ? 'nav-tab--active speaking' : ''}`}
            onClick={onToggleVoice}
          >
            <Mic size={16} />
            <span>{isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Voice'}</span>
            {(isListening || isSpeaking) && <Radio size={12} className="pulse-icon" />}
          </button>
          <button className="nav-tab" onClick={onOpenKeyboard}>
            <Keyboard size={16} />
            <span>Keyboard</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function SensorDot({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="sensor-dot-row">
      <span className={`sensor-indicator ${active ? 'active' : ''}`} />
      <span>{label}</span>
    </div>
  )
}
