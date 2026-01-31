import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export function HomeMode() {
  const [systemHealth, setSystemHealth] = useState({
    overall: 95,
    sensors: 98,
    ai: 92,
    network: 100,
    power: 87
  })

  const [recentActivity] = useState([
    { time: '14:32', action: 'Face scan completed', status: 'success' },
    { time: '14:28', action: 'Motion detected', status: 'info' },
    { time: '14:25', action: 'System calibrated', status: 'success' },
    { time: '14:20', action: 'Voice command processed', status: 'info' }
  ])

  const [quickStats] = useState({
    uptime: '2d 14h 32m',
    scansToday: 12,
    commandsProcessed: 47,
    dataExported: '2.3MB'
  })

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setSystemHealth(prev => ({
        ...prev,
        overall: Math.max(90, Math.min(100, prev.overall + (Math.random() - 0.5) * 2)),
        sensors: Math.max(95, Math.min(100, prev.sensors + (Math.random() - 0.5) * 1)),
        ai: Math.max(85, Math.min(100, prev.ai + (Math.random() - 0.5) * 3))
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getHealthColor = (value: number) => {
    if (value >= 95) return '#00ff00'
    if (value >= 85) return '#ffff00'
    return '#ff0000'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      default: return 'ℹ️'
    }
  }

  return (
    <div className="mode-panel home-mode">
      <div className="mode-header">
        <h3>🏠 SYSTEM OVERVIEW</h3>
        <div className="system-status">
          <span className="status-dot" style={{ backgroundColor: getHealthColor(systemHealth.overall) }}></span>
          <span>OPERATIONAL</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card health-card">
          <h4>System Health</h4>
          <div className="health-items">
            {Object.entries(systemHealth).map(([key, value]) => (
              <div key={key} className="health-item">
                <span className="health-label">{key.toUpperCase()}</span>
                <div className="health-bar">
                  <div 
                    className="health-fill" 
                    style={{ 
                      width: `${value}%`,
                      backgroundColor: getHealthColor(value)
                    }}
                  ></div>
                </div>
                <span className="health-value">{value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card stats-card">
          <h4>Quick Stats</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">⏱️</div>
              <div className="stat-info">
                <span className="stat-label">UPTIME</span>
                <span className="stat-value">{quickStats.uptime}</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">👁️</div>
              <div className="stat-info">
                <span className="stat-label">SCANS TODAY</span>
                <span className="stat-value">{quickStats.scansToday}</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🎤</div>
              <div className="stat-info">
                <span className="stat-label">COMMANDS</span>
                <span className="stat-value">{quickStats.commandsProcessed}</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <span className="stat-label">DATA EXPORTED</span>
                <span className="stat-value">{quickStats.dataExported}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card activity-card">
          <h4>Recent Activity</h4>
          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <motion.div 
                key={index}
                className="activity-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="activity-time">{activity.time}</span>
                <span className="activity-icon">{getStatusIcon(activity.status)}</span>
                <span className="activity-text">{activity.action}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="dashboard-card sensors-card">
          <h4>Sensor Status</h4>
          <div className="sensor-status-grid">
            <div className="sensor-status-item active">
              <span className="sensor-dot"></span>
              <span>Motion</span>
              <span className="sensor-value">ACTIVE</span>
            </div>
            <div className="sensor-status-item active">
              <span className="sensor-dot"></span>
              <span>Camera</span>
              <span className="sensor-value">ONLINE</span>
            </div>
            <div className="sensor-status-item ready">
              <span className="sensor-dot"></span>
              <span>Gesture</span>
              <span className="sensor-value">READY</span>
            </div>
            <div className="sensor-status-item active">
              <span className="sensor-dot"></span>
              <span>Light</span>
              <span className="sensor-value">65%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <button className="quick-action-btn">
          <span className="action-icon">🔄</span>
          <span>REFRESH</span>
        </button>
        <button className="quick-action-btn">
          <span className="action-icon">📊</span>
          <span>DIAGNOSTICS</span>
        </button>
        <button className="quick-action-btn">
          <span className="action-icon">⚙️</span>
          <span>SETTINGS</span>
        </button>
      </div>
    </div>
  )
}