import { useAppStore } from '../stores/appStore'
import { CircularMeter, ProgressBar, StatusIndicator } from './common'
import { useWebSocket } from '../hooks/useWebSocket'
import './SystemStats.css'

export function SystemStats() {
    const { systemStats } = useAppStore()
    const { isConnected, connect } = useWebSocket()

    console.log('📊 SystemStats render - isConnected:', isConnected, 'systemStats:', systemStats)

    const handleRefresh = () => {
        console.log('🔄 Manual refresh triggered')
        connect()
    }

    return (
        <div className="system-stats">
            <div className="system-stats__header">
                <h3>System Status</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusIndicator
                        status={isConnected ? 'active' : 'error'}
                        label={isConnected ? 'Live' : 'Offline'}
                    />
                    <button 
                        onClick={handleRefresh}
                        style={{ 
                            padding: '4px 8px', 
                            fontSize: '10px', 
                            background: '#007acc', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }}
                        title="Force connection check"
                    >
                        🔄
                    </button>
                </div>
                {!isConnected && (
                    <div style={{ 
                        fontSize: '12px', 
                        color: '#ff6b6b', 
                        fontWeight: 'bold',
                        marginTop: '4px',
                        animation: 'blink 1s infinite'
                    }}>
                        🚨 BACKEND DISCONNECTED 🚨
                    </div>
                )}
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                    Debug: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                </div>
            </div>

            <div className={`system-stats__metrics ${!isConnected ? 'offline' : ''}`}>
                {/* CPU Usage */}
                <div className="system-stats__metric">
                    <CircularMeter
                        value={isConnected ? systemStats.cpu : 0}
                        size={80}
                        label="CPU"
                    />
                </div>

                {/* RAM Usage */}
                <div className="system-stats__metric">
                    <CircularMeter
                        value={isConnected ? systemStats.ram : 0}
                        size={80}
                        label="RAM"
                    />
                </div>

                {/* Temperature */}
                <div className="system-stats__metric">
                    <CircularMeter
                        value={isConnected ? systemStats.temp : 0}
                        size={80}
                        label="TEMP"
                    />
                </div>
            </div>

            <div className={`system-stats__bars ${!isConnected ? 'offline' : ''}`}>
                <ProgressBar
                    value={isConnected ? systemStats.cpu : 0}
                    label="CPU Usage"
                    variant={isConnected ? (systemStats.cpu > 80 ? 'error' : systemStats.cpu > 60 ? 'warning' : 'success') : 'error'}
                />
                <ProgressBar
                    value={isConnected ? systemStats.ram : 0}
                    label="Memory"
                    variant={isConnected ? (systemStats.ram > 80 ? 'error' : systemStats.ram > 60 ? 'warning' : 'success') : 'error'}
                />
                <ProgressBar
                    value={isConnected ? systemStats.temp : 0}
                    label="Temperature"
                    variant={isConnected ? (systemStats.temp > 80 ? 'error' : systemStats.temp > 60 ? 'warning' : 'success') : 'error'}
                />
            </div>
        </div>
    )
}
