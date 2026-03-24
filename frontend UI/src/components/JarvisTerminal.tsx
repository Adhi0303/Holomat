/**
 * JarvisTerminal — Zone 5 (Bottom Center)
 * Terminal-style chat interface for Jarvis AI
 */
import { useState, useEffect, useRef } from 'react'
import { Terminal, Send } from 'lucide-react'
import { useAppStore } from '../stores/appStore'

interface Message {
  type: 'user' | 'jarvis' | 'system'
  text: string
  timestamp: Date
}

interface JarvisTerminalProps {
  onSubmit: (text: string) => void
  transcript: string
  isListening: boolean
  isSpeaking: boolean
}

export function JarvisTerminal({ onSubmit, transcript, isListening, isSpeaking }: JarvisTerminalProps) {
  const { lastResponse, jarvisState } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([
    { type: 'system', text: 'JARVIS Terminal v2.0 — HoloMat Command Interface', timestamp: new Date() },
    { type: 'system', text: 'Type a command or use voice input. Type "help" for commands.', timestamp: new Date() },
  ])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Add Jarvis responses to message log
  useEffect(() => {
    if (lastResponse && lastResponse.length > 0) {
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last?.type === 'jarvis' && last.text === lastResponse) return prev
        return [...prev, { type: 'jarvis', text: lastResponse, timestamp: new Date() }]
      })
    }
  }, [lastResponse])

  // Show transcript while listening
  useEffect(() => {
    if (transcript && isListening) {
      // Show live transcript
    }
  }, [transcript, isListening])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim()) return

    setMessages(prev => [...prev, { type: 'user', text: input.trim(), timestamp: new Date() }])
    onSubmit(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="zone zone--terminal zone--active">
      <div className="zone-header">
        <span className="zone-dot" />
        <Terminal size={12} />
        <span>jarvis terminal</span>
        {isSpeaking && <span className="terminal-status speaking">SPEAKING</span>}
        {isListening && <span className="terminal-status listening">LISTENING</span>}
        {jarvisState === 'processing' && <span className="terminal-status processing">PROCESSING</span>}
      </div>
      <div className="zone-body terminal-body" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`terminal-line terminal-line--${msg.type}`}>
            <span className="terminal-time">[{formatTime(msg.timestamp)}]</span>
            {msg.type === 'user' && <span className="terminal-prompt">&gt;</span>}
            {msg.type === 'jarvis' && <span className="terminal-prompt jarvis">&lt;</span>}
            {msg.type === 'system' && <span className="terminal-prompt system">#</span>}
            <span className="terminal-text">{msg.text}</span>
          </div>
        ))}
        {isListening && transcript && (
          <div className="terminal-line terminal-line--live">
            <span className="terminal-time">[{formatTime(new Date())}]</span>
            <span className="terminal-prompt">&gt;</span>
            <span className="terminal-text">{transcript}<span className="cursor-blink">_</span></span>
          </div>
        )}
      </div>
      <form className="terminal-input-row" onSubmit={handleSubmit}>
        <span className="terminal-input-prompt">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          className="terminal-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className="terminal-send-btn" disabled={!input.trim()}>
          <Send size={14} />
        </button>
      </form>
    </div>
  )
}
