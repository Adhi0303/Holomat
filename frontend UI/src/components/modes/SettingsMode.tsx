import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../../stores/appStore'

export function SettingsMode() {
  const { handSensitivity, setHandSensitivity } = useAppStore()
  const [settings, setSettings] = useState({
    motionSensitivity: 75,
    lightThreshold: 50,
    gestureTimeout: 3000,
    voiceVolume: 80,
    ledBrightness: 90,
    autoSleep: true,
    faceRecognition: true,
    gestureControl: true,
    voiceWakeup: true
  })

  const [activeTab, setActiveTab] = useState('sensors')

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetToDefaults = () => {
    setSettings({
      motionSensitivity: 75,
      lightThreshold: 50,
      gestureTimeout: 3000,
      voiceVolume: 80,
      ledBrightness: 90,
      autoSleep: true,
      faceRecognition: true,
      gestureControl: true,
      voiceWakeup: true
    })
  }

  const tabs = [
    { id: 'sensors', label: 'SENSORS', icon: '📡' },
    { id: 'display', label: 'DISPLAY', icon: '🖥️' },
    { id: 'ai', label: 'AI/VOICE', icon: '🤖' }
  ]

  return (
    <div className="mode-panel settings-mode">
      <div className="mode-header">
        <h3>⚙️ SYSTEM SETTINGS</h3>
        <button className="reset-btn" onClick={resetToDefaults}>
          RESET DEFAULTS
        </button>
      </div>

      <div className="settings-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="settings-content">
        {activeTab === 'sensors' && (
          <motion.div 
            className="settings-section"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="setting-item">
              <label>Motion Sensitivity</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.motionSensitivity}
                  onChange={(e) => updateSetting('motionSensitivity', parseInt(e.target.value))}
                />
                <span className="slider-value">{settings.motionSensitivity}%</span>
              </div>
            </div>

            <div className="setting-item">
              <label>Light Threshold</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.lightThreshold}
                  onChange={(e) => updateSetting('lightThreshold', parseInt(e.target.value))}
                />
                <span className="slider-value">{settings.lightThreshold}%</span>
              </div>
            </div>

            <div className="setting-item">
              <label>Gesture Timeout (ms)</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="500"
                  value={settings.gestureTimeout}
                  onChange={(e) => updateSetting('gestureTimeout', parseInt(e.target.value))}
                />
                <span className="slider-value">{settings.gestureTimeout}ms</span>
              </div>
            </div>

            <div className="toggle-group">
              <div className="toggle-item">
                <label>Face Recognition</label>
                <button
                  className={`toggle-btn ${settings.faceRecognition ? 'active' : ''}`}
                  onClick={() => updateSetting('faceRecognition', !settings.faceRecognition)}
                >
                  {settings.faceRecognition ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="toggle-item">
                <label>Gesture Control</label>
                <button
                  className={`toggle-btn ${settings.gestureControl ? 'active' : ''}`}
                  onClick={() => updateSetting('gestureControl', !settings.gestureControl)}
                >
                  {settings.gestureControl ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="setting-item">
              <label>✋ Hand Cursor Sensitivity</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={Math.round(handSensitivity * 100)}
                  onChange={(e) => setHandSensitivity(parseInt(e.target.value) / 100)}
                />
                <span className="slider-value">{handSensitivity.toFixed(1)}x</span>
              </div>
              <span className="setting-hint" style={{ fontSize: '10px', color: 'rgba(0,212,255,0.5)', marginTop: '4px', display: 'block' }}>
                Controls how much hand movement maps to cursor movement (0.5x–3.0x)
              </span>
            </div>
          </motion.div>
        )}

        {activeTab === 'display' && (
          <motion.div 
            className="settings-section"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="setting-item">
              <label>LED Brightness</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.ledBrightness}
                  onChange={(e) => updateSetting('ledBrightness', parseInt(e.target.value))}
                />
                <span className="slider-value">{settings.ledBrightness}%</span>
              </div>
            </div>

            <div className="toggle-item">
              <label>Auto Sleep Mode</label>
              <button
                className={`toggle-btn ${settings.autoSleep ? 'active' : ''}`}
                onClick={() => updateSetting('autoSleep', !settings.autoSleep)}
              >
                {settings.autoSleep ? 'ON' : 'OFF'}
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'ai' && (
          <motion.div 
            className="settings-section"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="setting-item">
              <label>Voice Volume</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.voiceVolume}
                  onChange={(e) => updateSetting('voiceVolume', parseInt(e.target.value))}
                />
                <span className="slider-value">{settings.voiceVolume}%</span>
              </div>
            </div>

            <div className="toggle-item">
              <label>Voice Wakeup</label>
              <button
                className={`toggle-btn ${settings.voiceWakeup ? 'active' : ''}`}
                onClick={() => updateSetting('voiceWakeup', !settings.voiceWakeup)}
              >
                {settings.voiceWakeup ? 'ON' : 'OFF'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}