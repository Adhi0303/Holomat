import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore } from '../stores/appStore'

// TypeScript definitions for Web Speech API
interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList
    resultIndex: number
}

interface SpeechRecognitionResultList {
    length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
    isFinal: boolean
    length: number
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    abort(): void
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onend: (() => void) | null
    onstart: (() => void) | null
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string
    message: string
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition
        webkitSpeechRecognition: new () => SpeechRecognition
    }
}

// Jarvis command responses
const jarvisResponses: Record<string, string[]> = {
    hello: [
        "Hello sir. How may I assist you today?",
        "Good day. I'm at your service.",
        "Greetings. What can I do for you?",
    ],
    status: [
        "All systems are operational, sir.",
        "Running diagnostics... Everything is functioning within normal parameters.",
        "System status: Online. All sensors active.",
    ],
    time: [
        `The current time is ${new Date().toLocaleTimeString()}.`,
        `It's ${new Date().toLocaleTimeString()}, sir.`,
    ],
    weather: [
        "I'm unable to access weather data at the moment, but I'm working on it.",
        "Weather module not yet connected. Shall I prioritize this integration?",
    ],
    joke: [
        "Why do programmers prefer dark mode? Because light attracts bugs.",
        "I'd tell you a chemistry joke, but I know I wouldn't get a reaction.",
        "Why did the developer go broke? Because he used up all his cache.",
    ],
    thanks: [
        "You're welcome, sir.",
        "Happy to help.",
        "Anytime, sir.",
    ],
    default: [
        "I'm not sure I understand. Could you rephrase that?",
        "I'll need more information to process that request.",
        "Command not recognized. Would you like me to learn this?",
    ],
}

// Get random response from category
const getRandomResponse = (category: keyof typeof jarvisResponses): string => {
    const responses = jarvisResponses[category]
    return responses[Math.floor(Math.random() * responses.length)]
}

// Parse command and get appropriate response
const parseCommand = (command: string): string => {
    const lowerCommand = command.toLowerCase()

    if (lowerCommand.includes('hello') || lowerCommand.includes('hi') || lowerCommand.includes('hey')) {
        return getRandomResponse('hello')
    }
    if (lowerCommand.includes('status') || lowerCommand.includes('systems')) {
        return getRandomResponse('status')
    }
    if (lowerCommand.includes('time') || lowerCommand.includes('what time')) {
        return `The current time is ${new Date().toLocaleTimeString()}.`
    }
    if (lowerCommand.includes('weather')) {
        return getRandomResponse('weather')
    }
    if (lowerCommand.includes('joke') || lowerCommand.includes('funny')) {
        return getRandomResponse('joke')
    }
    if (lowerCommand.includes('thank')) {
        return getRandomResponse('thanks')
    }

    return getRandomResponse('default')
}

/**
 * Voice Assistant hook - implements Jarvis with speech recognition and synthesis
 */
export function useVoiceAssistant() {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [isSupported, setIsSupported] = useState(true)
    const [isSpeaking, setIsSpeaking] = useState(false)

    const recognitionRef = useRef<SpeechRecognition | null>(null)
    const synthesisRef = useRef<SpeechSynthesis | null>(null)
    const [voicesLoaded, setVoicesLoaded] = useState(false)

    const {
        setJarvisState,
        setLastCommand,
        setLastResponse,
    } = useAppStore()

    // Initialize speech recognition and synthesis
    useEffect(() => {
        if (typeof window === 'undefined') return

        // Speech Recognition setup
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

        if (!SpeechRecognition) {
            setIsSupported(false)
            console.warn('🎤 Speech Recognition not supported in this browser')
            return
        }

        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onstart = () => {
            setIsListening(true)
            setJarvisState('listening')
            console.log('🎤 Jarvis is listening...')
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = ''
            let interimTranscript = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i]
                if (result.isFinal) {
                    finalTranscript += result[0].transcript
                } else {
                    interimTranscript += result[0].transcript
                }
            }

            setTranscript(interimTranscript || finalTranscript)

            if (finalTranscript) {
                setLastCommand(finalTranscript)
                recognition.stop()
                processCommand(finalTranscript)
            }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('🎤 Speech recognition error:', event.error)

            // Handle different error types
            switch (event.error) {
                case 'no-speech':
                    console.log('🎤 No speech detected, still listening...')
                    return
                case 'network':
                    console.warn('🎤 Network error - retrying...')
                    setTimeout(() => {
                        if (recognitionRef.current) {
                            try { recognitionRef.current.start() } catch (e) { console.error(e) }
                        }
                    }, 1000)
                    return
                case 'aborted':
                    return
            }

            setIsListening(false)
            setJarvisState('idle')
        }

        recognition.onend = () => {
            console.log('🎤 Recognition ended')
            if (!isSpeaking) {
                setIsListening(false)
                setJarvisState('idle')
            }
        }

        recognitionRef.current = recognition
        synthesisRef.current = window.speechSynthesis

        // Wait for voices to load
        const loadVoices = () => {
            const voices = synthesisRef.current?.getVoices()
            if (voices && voices.length > 0) {
                setVoicesLoaded(true)
                console.log('🔊 Speech synthesis voices loaded:', voices.length)
            }
        }

        loadVoices() // Try immediately
        if (synthesisRef.current) {
            synthesisRef.current.onvoiceschanged = loadVoices
        }

        return () => {
            recognition.abort()
        }
    }, [setJarvisState, setLastCommand, isSpeaking])

    // Text-to-Speech
    const speak = useCallback((text: string) => {
        if (!synthesisRef.current || !voicesLoaded) {
            console.warn('🔊 Speech synthesis not ready or voices not loaded')
            return
        }

        // Cancel any ongoing speech
        synthesisRef.current.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.volume = 1

        // Try to find a suitable voice
        const voices = synthesisRef.current.getVoices()
        const preferredVoice = voices.find(voice =>
            voice.name.includes('Daniel') ||
            voice.name.includes('Alex') ||
            voice.name.includes('Google UK English Male') ||
            voice.name.includes('Microsoft David') ||
            voice.name.includes('Microsoft Mark')
        ) || voices.find(voice => voice.lang.startsWith('en') && voice.name.toLowerCase().includes('male'))

        if (preferredVoice) {
            utterance.voice = preferredVoice
            console.log('🔊 Using voice:', preferredVoice.name)
        } else {
            console.log('🔊 Using default voice')
        }

        utterance.onstart = () => {
            setIsSpeaking(true)
            setJarvisState('speaking')
            console.log('🔊 Jarvis speaking...')
        }

        utterance.onend = () => {
            setIsSpeaking(false)
            setJarvisState('idle')
            console.log('🔊 Jarvis finished speaking')
        }

        utterance.onerror = (event) => {
            console.error('🔊 Speech synthesis error:', event)
            setIsSpeaking(false)
            setJarvisState('idle')
        }

        try {
            synthesisRef.current.speak(utterance)
        } catch (error) {
            console.error('🔊 Failed to speak:', error)
            setIsSpeaking(false)
            setJarvisState('idle')
        }
    }, [setJarvisState, voicesLoaded])

    // Process voice command using enhanced backend
    const processCommand = useCallback(async (command: string) => {
        setJarvisState('processing')
        console.log(`🤖 Processing: "${command}"`)

        try {
            // Call enhanced Jarvis backend
            const response = await fetch('/api/jarvis/command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ command })
            })
            
            const result = await response.json()
            console.log('🤖 Jarvis response:', result)
            
            // Handle mode switching if requested
            if (result.action === 'switch_mode' && result.target_mode) {
                console.log(`🔄 Switching to ${result.target_mode} mode`)
                // Trigger mode switch event
                window.dispatchEvent(new CustomEvent('jarvis-mode-switch', {
                    detail: { mode: result.target_mode }
                }))
            }
            
            setLastResponse(`"${result.response}"`)
            speak(result.response)
            
        } catch (error) {
            console.error('🤖 Jarvis API error:', error)
            // Fallback to local processing
            const fallback = parseCommand(command)
            console.log('🤖 Fallback response:', fallback)
            setLastResponse(`"${fallback}"`)
            speak(fallback)
        }
    }, [setJarvisState, setLastResponse, speak])

    // Start listening
    const startListening = useCallback(() => {
        if (!recognitionRef.current || isListening) return

        setTranscript('')
        try {
            recognitionRef.current.start()
        } catch (error) {
            console.error('Failed to start recognition:', error)
        }
    }, [isListening])

    // Stop listening
    const stopListening = useCallback(() => {
        if (!recognitionRef.current) return
        recognitionRef.current.stop()
    }, [])

    // Toggle listening
    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening()
        } else {
            startListening()
        }
    }, [isListening, startListening, stopListening])

    return {
        isListening,
        isSpeaking,
        transcript,
        isSupported,
        startListening,
        stopListening,
        toggleListening,
        speak,
    }
}
