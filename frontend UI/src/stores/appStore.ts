import { create } from 'zustand'
import type { Sensor } from '../components/SensorStatus'

// ─── Hand Cursor State ───────────────────────────────────────────────────────

export interface HandCursorState {
    screenX: number
    screenY: number
    visible: boolean
    isPinching: boolean
    isGrabbing: boolean
}

// ─── App State ───────────────────────────────────────────────────────────────

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

    // Gesture Control
    gesture: 'none' | 'swipe_left' | 'swipe_right' | 'push' | 'pull' | 'hover' | 'grab'
    currentModel: string

    // Hand Cursor (Virtual Hand Pointer)
    handCursor: HandCursorState
    handSensitivity: number  // 0.5 – 3.0

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
    setGesture: (gesture: 'none' | 'swipe_left' | 'swipe_right' | 'push' | 'pull' | 'hover' | 'grab') => void
    setCurrentModel: (model: string) => void
    setHandCursor: (cursor: HandCursorState) => void
    setHandSensitivity: (sensitivity: number) => void
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

    // Gesture Control
    gesture: 'none',
    currentModel: 'cube',

    // Hand Cursor (Virtual Hand)
    handCursor: {
        screenX: 0,
        screenY: 0,
        visible: false,
        isPinching: false,
        isGrabbing: false,
    },
    handSensitivity: 1.5,

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

    setGesture: (gesture) => set({ gesture }),

    setCurrentModel: (currentModel) => set({ currentModel }),

    setHandCursor: (handCursor) => set({ handCursor }),

    setHandSensitivity: (handSensitivity) => set({ handSensitivity }),
}))
