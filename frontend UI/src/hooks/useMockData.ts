import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../stores/appStore'

// Helper to find sensor value by ID
const getSensorValue = (id: string): string | number => {
    const sensor = useAppStore.getState().sensors.find(s => s.id === id)
    return sensor?.value ?? ''
}

/**
 * Mock data simulation hook - simulates real sensor data updates
 * Features:
 * - Auto-updating CPU/RAM/Temp values
 * - Random motion detection events
 * - Day/night light cycle
 * - Gesture simulation via keyboard
 */
export function useMockData() {
    const {
        updateSystemStats,
        updateSensor,
        setJarvisState,
        setLastResponse
    } = useAppStore()

    const intervalRef = useRef<number | null>(null)
    const motionTimeoutRef = useRef<number | null>(null)

    // Generate realistic fluctuating values
    const fluctuate = (current: number, min: number, max: number, volatility: number = 5) => {
        const change = (Math.random() - 0.5) * volatility * 2
        const newValue = current + change
        return Math.min(max, Math.max(min, Math.round(newValue)))
    }

    // Simulate system stats updates
    const updateStats = useCallback(() => {
        const store = useAppStore.getState()
        const { cpu, ram, temp } = store.systemStats

        updateSystemStats({
            cpu: fluctuate(cpu, 15, 95, 8),
            ram: fluctuate(ram, 30, 85, 3),
            temp: fluctuate(temp, 35, 75, 2)
        })
    }, [updateSystemStats])

    // Simulate random motion detection
    const simulateMotion = useCallback(() => {
        const shouldDetectMotion = Math.random() > 0.7 // 30% chance

        if (shouldDetectMotion) {
            updateSensor('motion', 'DETECTED', 'active')

            // Clear motion after 2-4 seconds
            if (motionTimeoutRef.current) {
                clearTimeout(motionTimeoutRef.current)
            }
            motionTimeoutRef.current = window.setTimeout(() => {
                updateSensor('motion', 'IDLE', 'ready')
            }, 2000 + Math.random() * 2000)
        }
    }, [updateSensor])

    // Simulate day/night light cycle (changes every 30 seconds for demo)
    const updateLightLevel = useCallback(() => {
        const now = new Date()
        const seconds = now.getSeconds()

        // Simulate day/night: 0-30s = day (high light), 30-60s = night (low light)
        const isDaytime = seconds < 30
        const baseLight = isDaytime ? 75 : 25
        const lightLevel = Math.round(baseLight + (Math.random() - 0.5) * 20)

        updateSensor('light', `${Math.min(100, Math.max(0, lightLevel))}%`)
    }, [updateSensor])

    // Start simulation
    useEffect(() => {
        // Initial values
        updateSystemStats({ cpu: 45, ram: 52, temp: 42 })
        updateSensor('motion', 'IDLE', 'ready')
        updateSensor('light', '65%')
        updateSensor('gesture', 'READY', 'ready')
        updateSensor('camera', 'ON', 'active')

        // Update every 2 seconds
        intervalRef.current = window.setInterval(() => {
            updateStats()
            simulateMotion()
            updateLightLevel()
        }, 2000)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
            if (motionTimeoutRef.current) {
                clearTimeout(motionTimeoutRef.current)
            }
        }
    }, [updateStats, simulateMotion, updateLightLevel, updateSystemStats, updateSensor])

    // Keyboard shortcuts for testing
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle if not in input field
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return
            }

            switch (e.key.toLowerCase()) {
                case 'm':
                    // Toggle motion
                    const currentMotion = getSensorValue('motion')
                    const isActive = currentMotion === 'DETECTED'
                    updateSensor('motion', isActive ? 'IDLE' : 'DETECTED', isActive ? 'ready' : 'active')
                    console.log(`🏃 Motion: ${!isActive ? 'DETECTED' : 'cleared'}`)
                    break

                case 'l':
                    // Cycle light levels: low → medium → high → low
                    const currentLight = parseInt(String(getSensorValue('light'))) || 50
                    const newLight = currentLight < 33 ? 65 : currentLight < 66 ? 90 : 15
                    updateSensor('light', `${newLight}%`)
                    console.log(`💡 Light level: ${newLight}%`)
                    break

                case 'j':
                    // Toggle Jarvis listening
                    const currentState = useAppStore.getState().jarvisState
                    const nextState = currentState === 'idle' ? 'listening' : 'idle'
                    setJarvisState(nextState)
                    if (nextState === 'listening') {
                        setLastResponse('"Listening for your command, sir..."')
                    }
                    console.log(`🤖 Jarvis: ${nextState}`)
                    break

                case 'arrowup':
                    updateSensor('gesture', 'SWIPE UP', 'active')
                    console.log('👆 Gesture: Swipe Up')
                    setTimeout(() => updateSensor('gesture', 'READY', 'ready'), 1000)
                    break

                case 'arrowdown':
                    updateSensor('gesture', 'SWIPE DOWN', 'active')
                    console.log('👇 Gesture: Swipe Down')
                    setTimeout(() => updateSensor('gesture', 'READY', 'ready'), 1000)
                    break

                case 'arrowleft':
                    updateSensor('gesture', 'SWIPE LEFT', 'active')
                    console.log('👈 Gesture: Swipe Left')
                    setTimeout(() => updateSensor('gesture', 'READY', 'ready'), 1000)
                    break

                case 'arrowright':
                    updateSensor('gesture', 'SWIPE RIGHT', 'active')
                    console.log('👉 Gesture: Swipe Right')
                    setTimeout(() => updateSensor('gesture', 'READY', 'ready'), 1000)
                    break

                case 'g':
                    updateSensor('gesture', 'GRAB', 'active')
                    console.log('✊ Gesture: Grab')
                    setTimeout(() => updateSensor('gesture', 'READY', 'ready'), 1000)
                    break

                case 'p':
                    updateSensor('gesture', 'POINT', 'active')
                    console.log('👆 Gesture: Point')
                    setTimeout(() => updateSensor('gesture', 'READY', 'ready'), 1000)
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [updateSensor, setJarvisState, setLastResponse])

    return null // This hook has no visual output
}

// Jarvis responses for different scenarios
export const jarvisResponses = {
    greetings: [
        "Good morning, Mr. Stark. All systems are operational.",
        "Welcome back, sir. I've prepared your workstation.",
        "Hello, sir. How may I assist you today?",
        "Systems online. Ready for your command.",
    ],
    motionDetected: [
        "Motion detected in the vicinity.",
        "I've detected movement nearby.",
        "Someone's approaching, sir.",
    ],
    lowLight: [
        "Light levels are low. Shall I adjust the display?",
        "It's getting dark, sir. Activating night mode.",
    ],
    highCPU: [
        "CPU usage is elevated. Running diagnostics.",
        "Processing load is high, sir.",
    ],
    highTemp: [
        "Temperature is rising. Monitoring closely.",
        "Thermal readings are elevated, sir.",
    ],
    gestureAcknowledged: [
        "Gesture acknowledged.",
        "Command received, sir.",
        "Processing your gesture.",
    ],
}
