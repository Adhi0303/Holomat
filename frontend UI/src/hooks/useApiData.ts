import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import { useWebSocket } from './useWebSocket'

/**
 * API data integration hook - fetches real data from backend
 * Features:
 * - Real-time system stats and sensors via WebSocket
 * - Fallback API calls for initial data
 * - Automatic reconnection handling
 */
export function useApiData() {
    const {
        updateSensor,
    } = useAppStore()

    const intervalRef = useRef<number | null>(null)

    // Use WebSocket for real-time updates
    const { isConnected } = useWebSocket()

    // Fallback: Fetch sensors from API if WebSocket not connected
    const fetchSensors = useCallback(async () => {
        if (isConnected) return // Skip if WebSocket is connected

        try {
            const response = await fetch('/api/sensors')
            if (response.ok) {
                const sensors = await response.json()
                sensors.forEach((sensor: any) => {
                    updateSensor(sensor.id, sensor.value, sensor.status)
                })
            }
        } catch (error) {
            console.error('Failed to fetch sensors:', error)
        }
    }, [updateSensor, isConnected])

    // Start fallback polling only if WebSocket fails
    useEffect(() => {
        if (isConnected) {
            // WebSocket connected, clear any polling
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            return
        }

        // WebSocket not connected, start polling
        fetchSensors()
        intervalRef.current = window.setInterval(() => {
            fetchSensors()
        }, 5000)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [fetchSensors, isConnected])

    return { isConnected } // Return connection status for UI updates
}