import { useState } from 'react'
import { motion } from 'framer-motion'

export function ModelMode() {
  const [modelSettings, setModelSettings] = useState({
    wireframe: false,
    particles: true,
    grid: true,
    autoRotate: false,
    rotationSpeed: 1,
    scale: 1,
    opacity: 0.8
  })

  const [animations, setAnimations] = useState({
    float: true,
    pulse: false,
    spin: false
  })

  const updateSetting = (key: string, value: any) => {
    setModelSettings(prev => ({ ...prev, [key]: value }))
  }

  const toggleAnimation = (key: string) => {
    setAnimations(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const presets = [
    { name: 'Default', settings: { wireframe: false, particles: true, grid: true, autoRotate: false, rotationSpeed: 1, scale: 1, opacity: 0.8 } },
    { name: 'Wireframe', settings: { wireframe: true, particles: false, grid: false, autoRotate: true, rotationSpeed: 0.5, scale: 1.2, opacity: 1 } },
    { name: 'Hologram', settings: { wireframe: false, particles: true, grid: true, autoRotate: true, rotationSpeed: 0.3, scale: 0.8, opacity: 0.6 } },
    { name: 'Solid', settings: { wireframe: false, particles: false, grid: false, autoRotate: false, rotationSpeed: 1, scale: 1, opacity: 1 } }
  ]

  const applyPreset = (preset: any) => {
    setModelSettings(preset.settings)
  }

  return (
    <div className="mode-panel model-mode">
      <div className="mode-header">
        <h3>📦 3D MODEL CONTROLS</h3>
      </div>

      <div className="model-presets">
        <h4>Quick Presets</h4>
        <div className="preset-grid">
          {presets.map(preset => (
            <button
              key={preset.name}
              className="preset-btn"
              onClick={() => applyPreset(preset)}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="model-controls">
        <div className="control-section">
          <h4>Display Settings</h4>
          
          <div className="control-item">
            <label>Scale</label>
            <div className="slider-container">
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={modelSettings.scale}
                onChange={(e) => updateSetting('scale', parseFloat(e.target.value))}
              />
              <span className="slider-value">{modelSettings.scale}x</span>
            </div>
          </div>

          <div className="control-item">
            <label>Opacity</label>
            <div className="slider-container">
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={modelSettings.opacity}
                onChange={(e) => updateSetting('opacity', parseFloat(e.target.value))}
              />
              <span className="slider-value">{Math.round(modelSettings.opacity * 100)}%</span>
            </div>
          </div>

          <div className="control-item">
            <label>Rotation Speed</label>
            <div className="slider-container">
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={modelSettings.rotationSpeed}
                onChange={(e) => updateSetting('rotationSpeed', parseFloat(e.target.value))}
              />
              <span className="slider-value">{modelSettings.rotationSpeed}x</span>
            </div>
          </div>
        </div>

        <div className="control-section">
          <h4>Visual Effects</h4>
          <div className="toggle-grid">
            <div className="toggle-item">
              <label>Wireframe</label>
              <button
                className={`toggle-btn ${modelSettings.wireframe ? 'active' : ''}`}
                onClick={() => updateSetting('wireframe', !modelSettings.wireframe)}
              >
                {modelSettings.wireframe ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="toggle-item">
              <label>Particles</label>
              <button
                className={`toggle-btn ${modelSettings.particles ? 'active' : ''}`}
                onClick={() => updateSetting('particles', !modelSettings.particles)}
              >
                {modelSettings.particles ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="toggle-item">
              <label>Grid</label>
              <button
                className={`toggle-btn ${modelSettings.grid ? 'active' : ''}`}
                onClick={() => updateSetting('grid', !modelSettings.grid)}
              >
                {modelSettings.grid ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="toggle-item">
              <label>Auto Rotate</label>
              <button
                className={`toggle-btn ${modelSettings.autoRotate ? 'active' : ''}`}
                onClick={() => updateSetting('autoRotate', !modelSettings.autoRotate)}
              >
                {modelSettings.autoRotate ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        <div className="control-section">
          <h4>Animations</h4>
          <div className="animation-grid">
            {Object.entries(animations).map(([key, enabled]) => (
              <div key={key} className="animation-item">
                <button
                  className={`animation-btn ${enabled ? 'active' : ''}`}
                  onClick={() => toggleAnimation(key)}
                >
                  <span className="animation-icon">
                    {key === 'float' ? '🎈' : key === 'pulse' ? '💓' : '🌀'}
                  </span>
                  <span className="animation-label">{key.toUpperCase()}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="model-info">
        <h4>Model Information</h4>
        <div className="info-grid">
          <div className="info-item">
            <span>VERTICES:</span> 1,024
          </div>
          <div className="info-item">
            <span>FACES:</span> 2,048
          </div>
          <div className="info-item">
            <span>MATERIALS:</span> 1
          </div>
          <div className="info-item">
            <span>RENDER TIME:</span> 16ms
          </div>
        </div>
      </div>
    </div>
  )
}