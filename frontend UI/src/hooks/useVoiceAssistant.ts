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


/**
 * Voice Assistant hook - implements Jarvis with speech recognition and synthesis
 * 
 * FIX: isSpeaking is now tracked via a REF (isSpeakingRef) inside the useEffect
 * so the recognition callbacks always see the CURRENT value — not a stale closure.
 * This prevents the recognition loop from dying every time speech starts/stops.
 */
export function useVoiceAssistant() {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [isSupported, setIsSupported] = useState(true)
    const [isSpeaking, setIsSpeaking] = useState(false)

    const recognitionRef = useRef<SpeechRecognition | null>(null)
    const synthesisRef = useRef<SpeechSynthesis | null>(null)
    const shouldListenRef = useRef(false)
    const isSpeakingRef = useRef(false)   // Mirror of isSpeaking — always current
    const networkRetryRef = useRef(0)
    const [voicesLoaded, setVoicesLoaded] = useState(false)

    const {
        setJarvisState,
        setLastCommand,
        setLastResponse,
    } = useAppStore()

    // Keep ref in sync with state
    useEffect(() => {
        isSpeakingRef.current = isSpeaking
    }, [isSpeaking])

    // Initialize speech recognition ONCE (no isSpeaking dependency!)
    useEffect(() => {
        if (typeof window === 'undefined') return

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

        if (!SpeechRecognition) {
            setIsSupported(false)
            console.warn('Speech Recognition not supported in this browser')
            return
        }

        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onstart = () => {
            setIsListening(true)
            setJarvisState('listening')
            console.log('Jarvis is listening...')
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            networkRetryRef.current = 0
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
                // processCommand is called via ref so it's always current
                processCommandRef.current?.(finalTranscript)
            }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            // Suppress harmless 'aborted' events (browser fires these on stop())
            if (event.error === 'aborted') return
            
            // Microphone permission denied
            if (event.error === 'not-allowed') {
                shouldListenRef.current = false
                setIsListening(false)
                setJarvisState('idle')
                return
            }

            console.error('Speech recognition error:', event.error)

            if (event.error === 'network') {
                networkRetryRef.current++
                if (networkRetryRef.current > 3) {
                    console.warn('Speech: max network retries reached, stopping.')
                    shouldListenRef.current = false
                    setIsListening(false)
                    setJarvisState('idle')
                    networkRetryRef.current = 0
                    return
                }
                console.warn(`Speech network error - retry ${networkRetryRef.current}/3...`)
                setIsListening(false)
                if (shouldListenRef.current && !isSpeakingRef.current) {
                    setTimeout(() => {
                        if (shouldListenRef.current && !isSpeakingRef.current) {
                            try { recognition.start() } catch (_e) { /* already started */ }
                        }
                    }, 2000)
                }
                return
            }

            if (event.error === 'no-speech') {
                if (shouldListenRef.current && !isSpeakingRef.current) {
                    setTimeout(() => {
                        try { recognition.start() } catch (_e) { /* */ }
                    }, 300)
                }
                return
            }

            setIsListening(false)
            setJarvisState('idle')
        }

        recognition.onend = () => {
            setIsListening(false)

            // Use ref so we always see the CURRENT speaking state
            if (shouldListenRef.current && !isSpeakingRef.current) {
                setTimeout(() => {
                    if (shouldListenRef.current && !isSpeakingRef.current) {
                        try { recognition.start() } catch (_e) { /* */ }
                    }
                }, 200)
            } else {
                if (!isSpeakingRef.current) setJarvisState('idle')
            }
        }

        recognitionRef.current = recognition
        synthesisRef.current = window.speechSynthesis

        // Wait for voices to load
        const loadVoices = () => {
            const voices = synthesisRef.current?.getVoices()
            if (voices && voices.length > 0) {
                setVoicesLoaded(true)
            }
        }

        loadVoices()
        if (synthesisRef.current) {
            synthesisRef.current.onvoiceschanged = loadVoices
        }

        return () => {
            shouldListenRef.current = false
            recognition.abort()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setJarvisState, setLastCommand]) // NO isSpeaking here!

    // Text-to-Speech
    const speak = useCallback((text: string) => {
        if (!synthesisRef.current || !voicesLoaded) {
            console.warn('Speech synthesis not ready')
            return
        }

        synthesisRef.current.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 1.0

        const voices = synthesisRef.current.getVoices()
        const preferredVoice = voices.find(voice =>
            voice.name.includes('Daniel') || voice.name.includes('Google UK English Male')
        ) || voices.find(voice => voice.lang.startsWith('en'))
        if (preferredVoice) utterance.voice = preferredVoice

        utterance.onstart = () => {
            setIsSpeaking(true)
            setJarvisState('speaking')
            // Abort recognition while speaking
            if (recognitionRef.current) recognitionRef.current.abort()
        }

        utterance.onend = () => {
            setIsSpeaking(false)
            setJarvisState('idle')

            // Resume listening after speaking
            if (shouldListenRef.current) {
                setTimeout(() => {
                    try {
                        recognitionRef.current?.start()
                    } catch (_e) { /* */ }
                }, 300)
            }
        }

        utterance.onerror = () => {
            setIsSpeaking(false)
            setJarvisState('idle')
        }

        try {
            synthesisRef.current.speak(utterance)
        } catch (error) {
            console.error('Failed to speak:', error)
            setIsSpeaking(false)
            setJarvisState('idle')
        }
    }, [setJarvisState, voicesLoaded])

    // Process command — routes through backend
    const processCommand = useCallback(async (command: string) => {
        if (command.toLowerCase().match(/^(stop|cancel|quiet|silence|goodbye|exit)/)) {
            shouldListenRef.current = false
            setIsListening(false)
            setJarvisState('idle')
            speak("Goodbye, sir.")
            return
        }

        setJarvisState('processing')
        console.log(`Processing: "${command}"`)

        try {
            const res = await fetch('http://localhost:8001/api/jarvis/command', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ command }),
            })
            
            if (!res.ok) {
                throw new Error(`Backend returned ${res.status}`)
            }
            
            const data = await res.json()
            console.log('Backend response:', data)

            if (data.action === 'switch_mode' && data.target_mode) {
                window.dispatchEvent(new CustomEvent('jarvis-mode-switch', {
                    detail: { mode: data.target_mode }
                }))
            }

            if (data.action === 'generate_image' && data.payload) {
                window.dispatchEvent(new CustomEvent('jarvis-image-generated', {
                    detail: {
                        prompt: data.payload.prompt,
                        style:  data.payload.style,
                    }
                }))
            }

            const responseText = data.response || "Command acknowledged, sir."
            setLastResponse(responseText)
            speak(responseText)

        } catch (error) {
            console.error('Backend error:', error)
            const fallback = "I'm having trouble connecting to the backend, sir."
            setLastResponse(fallback)
            speak(fallback)
        }
    }, [setJarvisState, setLastResponse, speak])

    // Keep processCommand accessible to the recognition callback via ref
    const processCommandRef = useRef(processCommand)
    useEffect(() => {
        processCommandRef.current = processCommand
    }, [processCommand])

    // Public controls
    const startListening = useCallback(() => {
        if (!recognitionRef.current) return
        shouldListenRef.current = true
        networkRetryRef.current = 0
        try {
            recognitionRef.current.start()
        } catch (error) {
            console.error('Failed to start:', error)
        }
    }, [])

    const stopListening = useCallback(() => {
        shouldListenRef.current = false
        if (recognitionRef.current) recognitionRef.current.stop()
        if (synthesisRef.current) synthesisRef.current.cancel()
        setIsListening(false)
        setIsSpeaking(false)
        setJarvisState('idle')
    }, [setJarvisState])

    const toggleListening = useCallback(() => {
        if (isListening || shouldListenRef.current) {
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
        toggleListening,
        startListening,
        stopListening,
        processTextCommand: processCommand
    }
}
