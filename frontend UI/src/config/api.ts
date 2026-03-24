/**
 * API Configuration
 * Centralized backend URL configuration for all API calls
 */

// Backend URL - change this when deploying to Raspberry Pi
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8001'

// API endpoints
export const API_ENDPOINTS = {
    // System
    status: `${API_BASE_URL}/api/status`,
    systemStats: `${API_BASE_URL}/api/system-stats`,

    // Sensors
    sensors: `${API_BASE_URL}/api/sensors`,
    sensorsExport: `${API_BASE_URL}/api/sensors/export`,

    // Jarvis
    jarvisCommand: `${API_BASE_URL}/api/jarvis/command`,

    // Testing
    testMotion: `${API_BASE_URL}/api/test/motion`,
    testLight: `${API_BASE_URL}/api/test/light`,

    // WebSocket
    websocket: `${WS_BASE_URL}/ws`
}

// Helper to make API calls
export async function apiCall(endpoint: string, options?: RequestInit) {
    try {
        const response = await fetch(endpoint, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers
            }
        })

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`)
        }

        return response.json()
    } catch (error) {
        console.error('API call failed:', error)
        throw error
    }
}
