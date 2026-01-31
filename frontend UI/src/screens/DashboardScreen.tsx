/**
 * Dashboard Screen
 * Main control center for HoloMat with hologram, sensors, and Jarvis panels
 */

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../stores/appStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { useGestures } from '../hooks/useGestures'
import { HologramViewer } from '../components/HologramViewer'
import { SensorStatus } from '../components/SensorStatus'
import { SystemStats } from '../components/SystemStats'
import { JarvisPanel } from '../components/JarvisPanel'
import { useVoiceAssistant } from '../hooks/useVoiceAssistant'
import './DashboardScreen.css'

export function DashboardScreen() {
    const { userName, systemStats, currentModel, sensors, jarvisState, lastResponse } = useAppStore()
    const { connected, error } = useWebSocket()
    const { gesture } = useGestures()
    const { startListening, stopListening, isListening } = useVoiceAssistant()

    // Log connection status
    useEffect(() => {
        if (connected) {
            console.log('✅ Dashboard connected to backend')
        } else if (error) {
            console.warn('⚠️ Backend connection failed:', error)
        }
    }, [connected, error])

    return (
        <div className="dashboard-screen">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-left">
                    <span className="status-dot" data-connected={connected} />
                    <span className="system-status">
                        {connected ? 'SYSTEM ONLINE' : 'OFFLINE MODE'}
                    </span>
                </div>
                <div className="header-center">
                    <h1 className="dashboard-title">HOLOMAT</h1>
                    <span className="user-greeting">Welcome, {userName}</span>
                </div>
                <div className="header-right">
                    <div className="stat-item">
                        <span className="stat-label">CPU</span>
                        <span className="stat-value">{systemStats.cpu}%</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">RAM</span>
                        <span className="stat-value">{systemStats.ram}%</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">TEMP</span>
                        <span className="stat-value">{systemStats.temp}°C</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main">
                {/* Left Sidebar - Sensors */}
                <aside className="dashboard-sidebar left">
                    <h2 className="sidebar-title">SENSORS</h2>
                    <SensorStatus sensors={sensors} />

                    {/* Gesture Indicator */}
                    {gesture !== 'none' && (
                        <motion.div
                            className="gesture-indicator"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <span className="gesture-icon">👋</span>
                            <span className="gesture-name">{gesture.replace('_', ' ').toUpperCase()}</span>
                        </motion.div>
                    )}
                </aside>

                {/* Center - Hologram */}
                <section className="dashboard-center">
                    <div className="hologram-container">
                        <HologramViewer />
                    </div>
                    <div className="model-info">
                        <span className="model-label">MODEL:</span>
                        <span className="model-name">{currentModel.toUpperCase()}</span>
                        <span className="model-hint">← → Arrow keys to change</span>
                    </div>
                </section>

                {/* Right Sidebar - Stats & Actions */}
                <aside className="dashboard-sidebar right">
                    <h2 className="sidebar-title">SYSTEM</h2>
                    <SystemStats />
                </aside>
            </main>

            <footer className="dashboard-footer">
                <JarvisPanel
                    state={jarvisState}
                    lastResponse={lastResponse}
                    onActivate={startListening}
                />

                {/* Voice Button */}
                <button
                    className={`jarvis-button ${isListening ? 'listening' : ''}`}
                    onClick={() => isListening ? stopListening() : startListening()}
                >
                    <span className="mic-icon">🎤</span>
                    <span className="button-text">
                        {isListening ? 'LISTENING...' : 'TALK TO JARVIS'}
                    </span>
                </button>
            </footer>

            {/* Connection Status Toast */}
            {!connected && (
                <motion.div
                    className="connection-toast"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    <span>⚠️ Running in offline mode. Backend not connected.</span>
                </motion.div>
            )}
        </div>
    )
}

export default DashboardScreen
