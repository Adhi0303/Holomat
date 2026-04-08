/**
 * useGestureSync — WebSocket Gesture Synchronization Hook
 * ========================================================
 * 
 * TWO MODES:
 *   "control" (laptop browser) — sends gesture events TO the Pi backend
 *   "display" (Pi Chromium/projector) — receives gesture events FROM the Pi backend
 * 
 * USAGE (laptop):
 *   const { sendGesture, sendAuth } = useGestureSync("control")
 *   sendGesture("swipe_left", 0.95)
 * 
 * USAGE (projector):
 *   const { lastGesture, lastAuth, isAwake } = useGestureSync("display")
 */

import { useEffect, useRef, useState, useCallback } from 'react'

export type GestureType = 'none' | 'hover' | 'grab' | 'swipe_left' | 'swipe_right' | 'push' | 'pull'

export interface GestureAction {
  gesture: GestureType
  action: string
  confidence: number
  description: string
  timestamp: number
}

export interface AuthResult {
  success: boolean
  user: string
  confidence: number
  timestamp: number
}

interface UseGestureSyncReturn {
  // Display mode: received data
  lastGesture: GestureAction | null
  lastAuth: AuthResult | null
  isAwake: boolean
  isConnected: boolean

  // Control mode: send data
  sendGesture: (gesture: GestureType, confidence: number) => void
  sendAuth: (authenticated: boolean, user: string, confidence: number) => void
}

export function useGestureSync(role: 'control' | 'display' = 'display'): UseGestureSyncReturn {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const [lastGesture, setLastGesture] = useState<GestureAction | null>(null)
  const [lastAuth, setLastAuth] = useState<AuthResult | null>(null)
  const [isAwake, setIsAwake] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  // Determine WebSocket URL
  const getWsUrl = useCallback(() => {
    const host = window.location.hostname
    const port = '8001'
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${protocol}://${host}:${port}/ws`
  }, [])

  // Connect to WebSocket
  const connect = useCallback(() => {
    const url = getWsUrl()
    const ws = new WebSocket(url)

    ws.onopen = () => {
      setIsConnected(true)
      // Register our role with the server
      ws.send(JSON.stringify({ type: 'client_register', role }))
      console.log(`[GestureSync] Connected as "${role}" to ${url}`)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'gesture_action':
            setLastGesture({
              gesture: data.gesture,
              action: data.action,
              confidence: data.confidence || 0,
              description: data.description || '',
              timestamp: Date.now(),
            })
            break

          case 'auth_result':
            setLastAuth({
              success: data.success,
              user: data.user || 'Unknown',
              confidence: data.confidence || 0,
              timestamp: Date.now(),
            })
            break

          case 'display_wake':
            setIsAwake(true)
            break

          case 'display_sleep':
            setIsAwake(false)
            break

          case 'display_state':
            setIsAwake(data.awake ?? true)
            break
        }
      } catch {
        // Ignore non-JSON messages
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      console.log('[GestureSync] Disconnected. Reconnecting in 3s...')
      reconnectTimerRef.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }

    wsRef.current = ws
  }, [getWsUrl, role])

  // Lifecycle
  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  // Send gesture (control mode)
  const sendGesture = useCallback((gesture: GestureType, confidence: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'gesture_input',
        gesture,
        confidence,
      }))
    }
  }, [])

  // Send face auth result (control mode)
  const sendAuth = useCallback((authenticated: boolean, user: string, confidence: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'face_auth',
        authenticated,
        user,
        confidence,
      }))
    }
  }, [])

  return {
    lastGesture,
    lastAuth,
    isAwake,
    isConnected,
    sendGesture,
    sendAuth,
  }
}
