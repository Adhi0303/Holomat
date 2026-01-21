import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export function MeasureMode() {
  const [measurements, setMeasurements] = useState({
    distance: 0,
    angle: 0,
    temperature: 0,
    humidity: 0
  })
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [measurementHistory, setMeasurementHistory] = useState<any[]>([])

  useEffect(() => {
    // Simulate real-time sensor readings
    const interval = setInterval(() => {
      setMeasurements({
        distance: Math.random() * 100 + 50, // 50-150cm
        angle: Math.random() * 360,
        temperature: Math.random() * 10 + 20, // 20-30°C
        humidity: Math.random() * 30 + 40 // 40-70%
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const calibrateSensors = () => {
    setIsCalibrating(true)
    setTimeout(() => {
      setIsCalibrating(false)
    }, 3000)
  }

  const saveMeasurement = () => {
    const newMeasurement = {
      ...measurements,
      timestamp: new Date().toLocaleTimeString(),
      id: Date.now()
    }
    setMeasurementHistory(prev => [newMeasurement, ...prev.slice(0, 4)])
  }

  return (
    <div className="mode-panel measure-mode">
      <div className="mode-header">
        <h3>📐 SENSOR MEASUREMENTS</h3>
        <button 
          className={`calibrate-btn ${isCalibrating ? 'active' : ''}`}
          onClick={calibrateSensors}
          disabled={isCalibrating}
        >
          {isCalibrating ? 'CALIBRATING...' : 'CALIBRATE'}
        </button>
      </div>

      <div className="sensor-grid">
        <div className="sensor-card">
          <div className="sensor-icon">📏</div>
          <div className="sensor-label">DISTANCE</div>
          <div className="sensor-value">{measurements.distance.toFixed(1)} cm</div>
          <div className="sensor-bar">
            <div 
              className="sensor-fill" 
              style={{ width: `${(measurements.distance / 150) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="sensor-card">
          <div className="sensor-icon">🧭</div>
          <div className="sensor-label">ANGLE</div>
          <div className="sensor-value">{measurements.angle.toFixed(1)}°</div>
          <div className="angle-indicator">
            <div 
              className="angle-needle" 
              style={{ transform: `rotate(${measurements.angle}deg)` }}
            ></div>
          </div>
        </div>

        <div className="sensor-card">
          <div className="sensor-icon">🌡️</div>
          <div className="sensor-label">TEMPERATURE</div>
          <div className="sensor-value">{measurements.temperature.toFixed(1)}°C</div>
          <div className="sensor-bar">
            <div 
              className="sensor-fill temp" 
              style={{ width: `${((measurements.temperature - 20) / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="sensor-card">
          <div className="sensor-icon">💧</div>
          <div className="sensor-label">HUMIDITY</div>
          <div className="sensor-value">{measurements.humidity.toFixed(1)}%</div>
          <div className="sensor-bar">
            <div 
              className="sensor-fill humidity" 
              style={{ width: `${((measurements.humidity - 40) / 30) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="measurement-controls">
        <button className="measure-btn" onClick={saveMeasurement}>
          SAVE MEASUREMENT
        </button>
      </div>

      {measurementHistory.length > 0 && (
        <div className="measurement-history">
          <h4>RECENT MEASUREMENTS</h4>
          {measurementHistory.map((measurement) => (
            <div key={measurement.id} className="history-item">
              <span className="history-time">{measurement.timestamp}</span>
              <span className="history-data">
                {measurement.distance.toFixed(1)}cm, {measurement.angle.toFixed(1)}°
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}