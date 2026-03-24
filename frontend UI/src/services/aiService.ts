import { Groq } from 'groq-sdk'
import { useAppStore } from '../stores/appStore'

// Initialize Groq client
const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true
})

// Advanced "Iron Man" Persona & JSON Schema
const JARVIS_SYSTEM_PROMPT = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), a highly advanced AI system controller.
Your personality is polite, dry, witty, concise, and hyper-efficient.
You address the user as "Sir".

CRITICAL INSTRUCTION:
You have full control over the dashboard. You must output a JSON object to perform actions.
Do NOT output markdown formatting like \`\`\`json. Just output the raw JSON object.

Input Context is provided in the message. Use it.

RESPONSE FORMAT:
{
  "response": "Your spoken response to the user (Keep it short, under 2 sentences).",
  "action": "switch_mode | system_command | none",
  "target": "scan | measure | model | home | settings | export | analytics | voice",
  "confidence": 0.0 to 1.0,
  "thought": "Brief internal reasoning"
}

AVAILABLE MODES (target):
- home (Dashboard)
- scan (Facial Analysis)
- model (3D Hologram Viewer)
- measure (Sensor Readings)
- analytics (Data Visualization)
- export (Data Export)
- settings (System Configuration)

EXAMPLES:
User: "Switch to scan mode."
Output: {"response": "Initiating biometric scan sequence.", "action": "switch_mode", "target": "scan", "confidence": 1.0, "thought": "User requested scan mode."}

User: "Hello Jarvis."
Output: {"response": "At your service, Sir. All systems online.", "action": "none", "target": "none", "confidence": 1.0, "thought": "Standard greeting."}

User: "Show me the 3D model."
Output: {"response": "Projecting the holographic model now.", "action": "switch_mode", "target": "model", "confidence": 1.0, "thought": "User requested 3D model viewer."}
`

function getSystemContext(): string {
    const state = useAppStore.getState()
    const { systemStats, sensors, userName, isOnline } = state

    return `
SYSTEM TELEMETRY:
- User: ${userName}
- Online: ${isOnline}
- CPU: ${systemStats.cpu}% | RAM: ${systemStats.ram}% | Temp: ${systemStats.temp}°C
- Time: ${new Date().toLocaleTimeString()}
- Active Sensor: ${sensors.find(s => s.status === 'active')?.name || 'None'}
`
}

export async function chat(userMessage: string): Promise<string> {
    try {
        if (!import.meta.env.VITE_GROQ_API_KEY) {
            return "Configuration Error: Groq API Key missing."
        }

        const systemContext = getSystemContext()
        const fullPrompt = `${systemContext}\n\nUSER COMMAND: "${userMessage}"`

        console.log('🤖 Sending to Groq:', fullPrompt)

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: JARVIS_SYSTEM_PROMPT },
                { role: 'user', content: fullPrompt }
            ],
            model: import.meta.env.VITE_AI_MODEL || 'llama3-8b-8192',
            temperature: 0.6,
            max_tokens: 300,
            response_format: { type: 'json_object' } // Force JSON mode if supported
        })

        const content = completion.choices[0]?.message?.content
        if (!content) return "I didn't receive a response from my neural net."

        try {
            // Parse JSON response works even if model adds markdown wrappers
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim()
            const data = JSON.parse(cleanContent)

            console.log('🤖 Jarvis Action:', data)

            // EXECUTE ACTION
            if (data.action === 'switch_mode' && data.target) {
                console.log(`🚀 Executing Action: Switch to ${data.target}`)
                window.dispatchEvent(new CustomEvent('jarvis-mode-switch', {
                    detail: { mode: data.target }
                }))
            }

            return data.response

        } catch (e) {
            console.error('JSON Parse Error:', e)
            return content // Fallback to raw text if not JSON
        }

    } catch (error) {
        console.error('Groq API Error:', error)
        return "I'm experiencing a connection error, Sir."
    }
}

export function isConfigured(): boolean {
    return !!import.meta.env.VITE_GROQ_API_KEY
}
