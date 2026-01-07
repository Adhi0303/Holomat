import Groq from 'groq-sdk'
import { useAppStore } from '../stores/appStore'

// Groq client initialization
const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true // Required for browser usage
})

// Model configuration
const AI_MODEL = import.meta.env.VITE_AI_MODEL || 'openai/gpt-oss-120b'

// Jarvis system prompt - Iron Man personality
const JARVIS_SYSTEM_PROMPT = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), Tony Stark's AI assistant from the Iron Man universe. You respond with wit, intelligence, and a touch of British formality.

PERSONALITY:
- Address the user as "sir" or "Mr. Stark"
- Be helpful but slightly sardonic, like the Jarvis from Iron Man films
- Keep responses concise (1-3 sentences) unless asked for detail
- Show personality - you're not just an AI, you're Jarvis

CAPABILITIES:
You have access to the HoloMat workstation and can report on:
- System status, CPU, RAM, temperature (when provided in context)
- Current time and date
- General knowledge and reasoning

When asked about system status, use the context provided in the user message.
When you don't have specific data, make a witty response that fits Jarvis's character.

IMPORTANT:
- Never break character
- Never mention being an AI language model or that you're Claude/GPT/etc
- You ARE Jarvis, created by Tony Stark
- If asked to do something you can't, say something like "I'm afraid that capability isn't online yet, sir" or "Working on it, sir. That module is still in development."
`

// Conversation history for context
type Message = {
    role: 'system' | 'user' | 'assistant'
    content: string
}
let conversationHistory: Message[] = []

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

        // Build messages array
        const messages: Message[] = [
            { role: 'system', content: JARVIS_SYSTEM_PROMPT },
            ...conversationHistory.slice(-10), // Keep last 10 messages for context
            { role: 'user', content: contextualMessage }
        ]

        // Call Groq API
        const completion = await groq.chat.completions.create({
            model: AI_MODEL,
            messages: messages,
            temperature: 0.8,
            max_completion_tokens: 500,
            top_p: 1,
        })

        const response = completion.choices[0]?.message?.content || "I'm having trouble processing that, sir."

        // Store in conversation history
        conversationHistory.push({ role: 'user', content: userMessage })
        conversationHistory.push({ role: 'assistant', content: response })

        // Limit history size
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20)
        }

        return response
    } catch (error) {
        console.error('Jarvis AI Error:', error)

        // Handle specific error types
        if (error instanceof Error) {
            if (error.message.includes('API key')) {
                return "I'm afraid my neural network credentials are misconfigured, sir. Please check the API key."
            }
            if (error.message.includes('rate limit')) {
                return "I need a moment to cool down, sir. Too many requests at once."
            }
        }

        return "I'm experiencing a temporary disruption in my systems, sir. Please try again."
    }
}

/**
 * Clear conversation history
 */
export function clearHistory(): void {
    conversationHistory = []
}

/**
 * Check if the AI service is properly configured
 */
export function isConfigured(): boolean {
    return !!import.meta.env.VITE_GROQ_API_KEY
}
