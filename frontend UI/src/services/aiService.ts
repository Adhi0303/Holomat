import { useAppStore } from '../stores/appStore'

/**
 * Get current system context for Jarvis
 */
function getSystemContext(): string {
    const state = useAppStore.getState()
    const { systemStats, sensors, userName, isOnline } = state

    return `
CURRENT SYSTEM STATUS:
- User: ${userName}
- Online: ${isOnline ? 'Yes' : 'No'}
- CPU Usage: ${systemStats.cpu}%
- RAM Usage: ${systemStats.ram}%
- Temperature: ${systemStats.temp}°C
- Sensors: ${sensors.map(s => `${s.name}: ${s.value}`).join(', ')}
- Current Time: ${new Date().toLocaleTimeString()}
- Current Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
`
}

/**
 * Send a message to Jarvis and get a response
 */
export async function chat(userMessage: string): Promise<string> {
    try {
        // Add system context to the user message
        const contextualMessage = `${getSystemContext()}\n\nUser command: ${userMessage}`

        // Call backend Jarvis API
        const response = await fetch('/api/jarvis/command', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ command: contextualMessage }),
        })

        if (response.ok) {
            const data = await response.json()
            return data.response || "Command acknowledged, sir."
        } else {
            throw new Error('Backend Jarvis API failed')
        }
    } catch (error) {
        console.error('Jarvis API Error:', error)
        return "I'm experiencing a temporary disruption in my systems, sir. Please try again."
    }
}

/**
 * Check if the AI service is properly configured
 */
export function isConfigured(): boolean {
    return true // Backend handles AI now
}
