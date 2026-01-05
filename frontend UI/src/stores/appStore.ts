import { create } from 'zustand'
import type { Sensor } from '../components/SensorStatus'

interface AppState {
    // User
    isAuthenticated: boolean
    userName: string
    userRole: string
    authState: 'idle' | 'scanning' | 'authenticated' | 'denied'

    // Sensors
    sensors: Sensor[]

    // Jarvis
    jarvisState: 'idle' | 'listening' | 'processing' | 'speaking'
    lastCommand: string
    lastResponse: string

    // System
    systemStats: {
        cpu: number
        ram: number
        temp: number
    }

    // Connection
    isOnline: boolean

    // Actions
    setUser: (name: string, role: string) => void
    setAuthState: (state: 'idle' | 'scanning' | 'authenticated' | 'denied') => void
    updateSensor: (id: string, value: string | number, status?: 'active' | 'ready' | 'idle' | 'error') => void
    setJarvisState: (state: 'idle' | 'listening' | 'processing' | 'speaking') => void
    setJarvisResponse: (command: string, response: string) => void
    setLastCommand: (command: string) => void
    setLastResponse: (response: string) => void
    updateSystemStats: (stats: Partial<{ cpu: number; ram: number; temp: number }>) => void
    setOnline: (online: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
    // Initial User State
    isAuthenticated: true,
    userName: 'Mr. Stark',
    userRole: 'Admin',
    authState: 'authenticated',

    // Initial Sensors
    sensors: [
        { id: 'motion', name: 'Motion', value: 'ACTIVE', status: 'active' },
        { id: 'light', name: 'Light', value: '65%', status: 'active' },
        { id: 'gesture', name: 'Gesture', value: 'READY', status: 'ready' },
        { id: 'camera', name: 'Camera', value: 'ON', status: 'active' },
        { id: 'jarvis', name: 'Jarvis', value: 'IDLE', status: 'idle' },
    ],

    // Initial Jarvis State
    jarvisState: 'idle',
    lastCommand: '',
    lastResponse: '"Good morning, Mr. Stark. All systems are operational."',

    // Initial System Stats
    systemStats: {
        cpu: 78,
        ram: 62,
        temp: 52,
    },

    // Connection
    isOnline: true,

    // Actions
    setUser: (name, role) => set({ userName: name, userRole: role }),

    setAuthState: (authState) => set({
        authState,
        isAuthenticated: authState === 'authenticated'
    }),

    updateSensor: (id, value, status) => set((state) => ({
        sensors: state.sensors.map((sensor) =>
            sensor.id === id
                ? { ...sensor, value, ...(status && { status }) }
                : sensor
        ),
    })),

    setJarvisState: (jarvisState) => set((state) => {
        // Also update the Jarvis sensor
        const sensors = state.sensors.map((sensor) =>
            sensor.id === 'jarvis'
                ? {
                    ...sensor,
                    value: jarvisState.toUpperCase(),
                    status: jarvisState === 'idle' ? 'idle' as const : 'active' as const
                }
                : sensor
        )
        return { jarvisState, sensors }
    }),

    setJarvisResponse: (command, response) => set({
        lastCommand: command,
        lastResponse: response
    }),

    setLastCommand: (lastCommand) => set({ lastCommand }),

    setLastResponse: (lastResponse) => set({ lastResponse }),

    updateSystemStats: (stats) => set((state) => ({
        systemStats: { ...state.systemStats, ...stats },
    })),

    setOnline: (isOnline) => set({ isOnline }),
}))
