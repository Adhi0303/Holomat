/**
 * useWebSocket Hook
 * Real-time WebSocket connection to HoloMat backend
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAppStore } from '../stores/appStore'

type WebSocketMessage = {
    type: string
    data?: Record<string, unknown>
    message?: string
    gesture?: string
    response?: string
}

export function useWebSocket(url: string = 'ws://localhost:8000/ws') {
    const [connected, setConnected] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const ws = useRef<WebSocket | null>(null)
    const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    const {
        updateSystemStats,
        setGesture,
        setLastResponse
    } = useAppStore()

    // Handle incoming messages
    const handleMessage = useCallback((event: MessageEvent) => {
        try {
            const message: WebSocketMessage = JSON.parse(event.data)

            switch (message.type) {
                case 'connected':
                    console.log('🔌 WebSocket:', message.message)
                    break

                case 'sensor_update':
                    if (message.data) {
                        updateSystemStats({
                            cpu: message.data.cpu as number,
                            ram: message.data.ram as number,
                            temp: message.data.temp as number
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
    }, [updateSystemStats, setGesture, setLastResponse])

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (ws.current?.readyState === WebSocket.OPEN) return

        try {
            ws.current = new WebSocket(url)

            ws.current.onopen = () => {
                setConnected(true)
                setError(null)
                console.log('✅ WebSocket connected')
            }

            ws.current.onmessage = handleMessage

            ws.current.onclose = () => {
                setConnected(false)
                console.log('❌ WebSocket disconnected')

                // Auto-reconnect after 3 seconds
                reconnectTimeout.current = setTimeout(() => {
                    console.log('🔄 Attempting to reconnect...')
                    connect()
                }, 3000)
            }

            ws.current.onerror = () => {
                setError('WebSocket connection failed')
                setConnected(false)
            }
        } catch (err) {
            setError('Failed to create WebSocket')
            console.error('WebSocket error:', err)
        }
    }, [url, handleMessage])

    // Send message to server
    const sendMessage = useCallback((type: string, data?: Record<string, unknown>) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type, ...data }))
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
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current)
            }
            ws.current?.close()
        }
    }, [connect])

    return {
        connected,
        error,
        sendMessage,
        sendGesture,
        sendCommand,
        reconnect: connect
    }
}
