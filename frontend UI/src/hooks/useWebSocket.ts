import { useEffect, useRef, useCallback, useState } from 'react'
import { useAppStore } from '../stores/appStore'

/**
 * Get human-readable description of WebSocket close codes
 */
function getWebSocketCloseReason(code: number): string {
    switch (code) {
        case 1000: return 'Normal closure'
        case 1001: return 'Going away'
        case 1002: return 'Protocol error'
        case 1003: return 'Unsupported data'
        case 1004: return 'Reserved'
        case 1005: return 'No status received'
        case 1006: return 'Abnormal closure'
        case 1007: return 'Invalid frame payload data'
        case 1008: return 'Policy violation'
        case 1009: return 'Message too big'
        case 1010: return 'Missing extension'
        case 1011: return 'Internal error'
        case 1012: return 'Service restart'
        case 1013: return 'Try again later'
        case 1014: return 'Bad gateway'
        case 1015: return 'TLS handshake'
        default: return `Unknown code: ${code}`
    }
}

/**
 * WebSocket integration hook - connects to backend WebSocket for real-time updates
 * Features:
 * - Auto-connect to WebSocket on mount
 * - Real-time system stats and sensor updates
 * - Automatic reconnection on disconnect
 * - Connection health monitoring
 * - Error handling
 */
export function useWebSocket() {
    const { updateSystemStats, updateSensor } = useAppStore()
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<number | null>(null)
    const heartbeatTimeoutRef = useRef<number | null>(null)
    const reconnectAttempts = useRef(0)
    const maxReconnectAttempts = 5

    // Add state to track connection status
    const [isConnected, setIsConnected] = useState(false)

    // Heartbeat to detect dead connections
    const startHeartbeat = useCallback(() => {
        if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current)
        }

        heartbeatTimeoutRef.current = window.setTimeout(() => {
            console.log('Heartbeat timeout - connection may be dead')
            if (wsRef.current) {
                wsRef.current.close()
            }
        }, 10000) // 10 seconds timeout
    }, [])

    const resetHeartbeat = useCallback(() => {
        startHeartbeat()
    }, [startHeartbeat])

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return

        try {
            const ws = new WebSocket('ws://127.0.0.1:8001/ws')
            wsRef.current = ws

            ws.onopen = () => {
                console.log('🔗 WebSocket connected - setting status to LIVE')
                setIsConnected(true) // Update state
                reconnectAttempts.current = 0
                // Heartbeat will be reset when messages are received
            }

            ws.onmessage = (event) => {
                resetHeartbeat() // Reset heartbeat on any message
                try {
                    const data = JSON.parse(event.data)

                    if (data.type === 'system_update' && data.payload) {
                        updateSystemStats(data.payload)
                    } else if (data.type === 'sensor_update' && data.payload) {
                        // Update all sensors from the payload
                        data.payload.forEach((sensor: any) => {
                            updateSensor(sensor.id, sensor.value, sensor.status)
                        })
                    }
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error)
                }
            }

            ws.onclose = async (event) => {
                const reason = getWebSocketCloseReason(event.code)
                console.log(`❌ WebSocket disconnected: Code=${event.code}, Reason="${reason}", WasClean=${event.wasClean}`)
                // Remove annoying alert popup - just log to console
                setIsConnected(false) // Update state immediately
                wsRef.current = null

                if (heartbeatTimeoutRef.current) {
                    clearTimeout(heartbeatTimeoutRef.current)
                }

                // Only attempt reconnection if it wasn't a clean close and we haven't exceeded max attempts
                if (!event.wasClean && reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectAttempts.current++
                    console.log(`🔄 Attempting reconnection... (${reconnectAttempts.current}/${maxReconnectAttempts})`)

                    // Check if backend is still alive before attempting reconnection
                    const backendAlive = await pingBackend()
                    if (backendAlive) {
                        // Wait before reconnecting to avoid hammering the server
                        setTimeout(() => {
                            connect()
                        }, 5000 * reconnectAttempts.current) // Longer backoff - 5 seconds base
                    } else {
                        console.log('🏥 Backend is down - not attempting reconnection')
                    }
                } else {
                    console.log('🔚 Not attempting reconnection (clean close or max attempts reached)')
                }
            }

            ws.onerror = async (error) => {
                console.error('🚨 WebSocket error:', error, '- checking backend status')
                // Check if backend is down
                const backendAlive = await pingBackend()
                if (!backendAlive) {
                    console.log('🏥 Backend is down - setting offline')
                    setIsConnected(false)
                }
            }

        } catch (error) {
            console.error('Failed to create WebSocket connection:', error)
            setIsConnected(false)
        }
    }, [updateSystemStats, updateSensor, resetHeartbeat])

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }

        if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current)
            heartbeatTimeoutRef.current = null
        }

        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }
        setIsConnected(false)
    }, [])

    useEffect(() => {
        connect()

        return () => {
            disconnect()
        }
    }, [connect, disconnect])

    // Fallback: HTTP ping to check backend availability
    const pingBackend = useCallback(async () => {
        try {
            console.log('🏥 Starting backend ping...')
            const response = await fetch('/api/system-stats', { 
                method: 'GET',
                signal: AbortSignal.timeout(2000) // 2 second timeout instead of 0.5
            })
            const success = response.ok
            console.log('🏥 Backend ping result:', success ? 'SUCCESS' : 'FAILED')
            return success
        } catch (error) {
            console.log('🏥 Backend ping failed:', error instanceof Error ? error.message : String(error), '- BACKEND IS DOWN')
            return false
        }
    }, [])

    // Combined connection check
    const checkConnection = useCallback(async () => {
        const backendAlive = await pingBackend()

        console.log('🔍 PERIODIC CHECK - Backend alive:', backendAlive, '| Current isConnected:', isConnected)

        if (!backendAlive && isConnected) {
            console.log('🚨 BACKEND WENT DOWN - SETTING OFFLINE')
            alert('🚨 Backend disconnected! System is now offline.')
            setIsConnected(false)
        } else if (backendAlive && !isConnected) {
            console.log('✅ Backend came back - attempting reconnection')
            connect()
        }
    }, [pingBackend, isConnected, connect])

    // Check connection periodically
    useEffect(() => {
        const interval = setInterval(checkConnection, 5000) // Check every 5 seconds instead of 0.5
        return () => clearInterval(interval)
    }, [checkConnection])

    return {
        isConnected,
        connect,
        disconnect
    }
}