import { useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/appStore'

export type GestureType =
  | 'SWIPE_UP'
  | 'SWIPE_DOWN'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'GRAB'
  | 'POINT'
  | 'TAP'
  | 'PINCH_IN'
  | 'PINCH_OUT'
  | 'ROTATE_CLOCKWISE'
  | 'ROTATE_COUNTERCLOCKWISE'

export interface GestureEvent {
  type: GestureType
  timestamp: number
  confidence?: number
  position?: { x: number; y: number }
}

/**
 * Gesture Events Hook - Basic gesture recognition
 */
export function useGestureEvents() {
    const { sensors, updateSensor } = useAppStore()

    // Get current gesture sensor value
    const gestureSensor = sensors.find(s => s.id === 'gesture')
    const currentGesture = gestureSensor?.value as string

    // Basic gesture handler
    const handleGesture = useCallback((gestureType: GestureType) => {
        const gestureEvent: GestureEvent = {
            type: gestureType,
            timestamp: Date.now(),
            confidence: 0.9
        }

        console.log(`🤖 Gesture: ${gestureType}`, gestureEvent)

        // Dispatch custom event
        const event = new CustomEvent(`gesture:${gestureType.toLowerCase()}`, {
            detail: gestureEvent,
            bubbles: true
        })
        window.dispatchEvent(event)

        // Reset gesture sensor
        setTimeout(() => {
            updateSensor('gesture', 'READY', 'ready')
        }, 500)

    }, [updateSensor])

    // Listen for gesture sensor changes
    useEffect(() => {
        if (!currentGesture || currentGesture === 'READY') return

        const gestureType = currentGesture as GestureType
        if (gestureType) {
            handleGesture(gestureType)
        }
    }, [currentGesture, handleGesture])

    // Trigger gesture for testing
    const triggerGesture = useCallback((gestureType: GestureType) => {
        updateSensor('gesture', gestureType, 'active')
    }, [updateSensor])

    return {
        currentGesture,
        triggerGesture,
        isReady: currentGesture === 'READY'
    }
}