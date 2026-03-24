/**
 * useWebSocket Hook
 * Real-time WebSocket connection to HoloMat backend
 * Features:
 * - Auto-connect to WebSocket on mount
 * - Real-time system stats and sensor updates
 * - Automatic reconnection on disconnect
 * - Connection health monitoring with heartbeat
 * - Gesture and Jarvis response handling
 */

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
        case 1005: return 'No status received'
        case 1006: return 'Abnormal closure'
        case 1007: return 'Invalid frame payload data'
        case 1008: return 'Policy violation'
        case 1009: return 'Message too big'
        case 1011: return 'Internal error'
        case 1012: return 'Service restart'
        case 1013: return 'Try again later'
        case 1015: return 'TLS handshake'
        default: return `Unknown code: ${code}`
    }
}

type WebSocketMessage = {
    type: string
    data?: Record<string, unknown>
    payload?: Record<string, unknown> | Array<{ id: string; value: string | number; status?: string }>
    message?: string
    gesture?: string
    response?: string
}

export function useWebSocket(url: string = 'ws://localhost:8001/ws') {
    const {
        updateSystemStats,
        updateSensor,
        setGesture,
        setLastResponse
    } = useAppStore()

    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const heartbeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const reconnectAttempts = useRef(0)
    const maxReconnectAttempts = 10

    const [connected, setConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Heartbeat to detect dead connections
    const startHeartbeat = useCallback(() => {
        if (heartbeatTimeoutRef.current) {
            clearTimeout(heartbeatTimeoutRef.current)
        }

        heartbeatTimeoutRef.current = setTimeout(() => {
            console.log('⏱️ Heartbeat timeout - connection may be dead')
            if (wsRef.current) {
                wsRef.current.close()
            }
        }, 45000) // 45 seconds — long enough for 3D generation
    }, [])

    const resetHeartbeat = useCallback(() => {
        startHeartbeat()
    }, [startHeartbeat])

    // Ping backend to check if it's alive
    const pingBackend = useCallback(async (): Promise<boolean> => {
        try {
            const response = await fetch(`${url.replace('ws://', 'http://').replace('/ws', '/api/status')}`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            })
            return response.ok
        } catch {
            return false
        }
    }, [url])

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return

        try {
            const ws = new WebSocket(url)
            wsRef.current = ws

            ws.onopen = () => {
                console.log('✅ WebSocket connected')
                setConnected(true)
                setError(null)
                reconnectAttempts.current = 0
                startHeartbeat()
            }

            ws.onmessage = (event) => {
                resetHeartbeat()
                try {
                    const message: WebSocketMessage = JSON.parse(event.data)

                    switch (message.type) {
                        case 'connected':
                            console.log('🔌 WebSocket:', message.message)
                            break

                        case 'system_update':
                            if (message.payload) {
                                updateSystemStats(message.payload as { cpu?: number; ram?: number; temp?: number })
                            }
                            break

                        case 'sensor_update':
                            if (message.data) {
                                updateSystemStats({
                                    cpu: message.data.cpu as number,
                                    ram: message.data.ram as number,
                                    temp: message.data.temp as number
                                })
                            }
                            // Also handle array payload for individual sensors
                            if (Array.isArray(message.payload)) {
                                message.payload.forEach((sensor) => {
                                    updateSensor(sensor.id, sensor.value, sensor.status as 'active' | 'ready' | 'idle' | 'error' | undefined)
                                })
                            }
                            break

                        case 'gesture':
                            if (message.gesture) {
                                console.log('👋 Gesture:', message.gesture)
                                setGesture(message.gesture as 'none' | 'swipe_left' | 'swipe_right' | 'push' | 'pull' | 'hover')
                            }
                            break

                        case 'jarvis_response':
                            if (message.response) {
                                setLastResponse(message.response)
                            }
                            break

                        default:
                            console.log('📨 WebSocket message:', message)
                    }
                } catch (err) {
                    console.error('Failed to parse WebSocket message:', err)
                }
            }

            ws.onclose = async (event) => {
                const reason = getWebSocketCloseReason(event.code)
                console.log(`❌ WebSocket disconnected: Code=${event.code}, Reason="${reason}"`)
                setConnected(false)
                wsRef.current = null

                if (heartbeatTimeoutRef.current) {
                    clearTimeout(heartbeatTimeoutRef.current)
                }

                // Only attempt reconnection if it wasn't a clean close
                if (!event.wasClean && reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectAttempts.current++
                    console.log(`🔄 Attempting reconnection... (${reconnectAttempts.current}/${maxReconnectAttempts})`)

                    const backendAlive = await pingBackend()
                    if (backendAlive) {
                        reconnectTimeoutRef.current = setTimeout(() => {
                            connect()
                        }, 3000 * reconnectAttempts.current)
                    } else {
                        console.log('🏥 Backend is down - not attempting reconnection')
                    }
                }
            }

            ws.onerror = () => {
                console.error('🚨 WebSocket error')
                setError('WebSocket connection failed')
                setConnected(false)
            }

        } catch (err) {
            console.error('Failed to create WebSocket connection:', err)
            setError('Failed to create WebSocket')
            setConnected(false)
        }
    }, [url, updateSystemStats, updateSensor, setGesture, setLastResponse, resetHeartbeat, startHeartbeat, pingBackend])

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
        setConnected(false)
    }, [])

    // Send message to server
    const sendMessage = useCallback((type: string, data?: Record<string, unknown>) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, ...data }))
        } else {
            console.warn('WebSocket not connected, cannot send message')
        }
    }, [])

    // Send gesture event
    const sendGesture = useCallback((gesture: string) => {
        sendMessage('gesture', { gesture })
    }, [sendMessage])

    // Send Jarvis command
    const sendCommand = useCallback((command: string) => {
        sendMessage('command', { command })
    }, [sendMessage])

    // Connect on mount
    useEffect(() => {
        connect()

        return () => {
            disconnect()
        }
    }, [connect, disconnect])

    return {
        connected,
        error,
        sendMessage,
        sendGesture,
        sendCommand,
        reconnect: connect,
        disconnect
    }
}
