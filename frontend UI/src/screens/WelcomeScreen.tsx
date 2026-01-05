import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface WelcomeScreenProps {
    userName: string
    onComplete: () => void
}

const jarvisGreetings = [
    "Good morning, Mr. Stark. All systems are operational.",
    "Welcome back, sir. I've prepared your workspace.",
    "At your service, Mr. Stark. The lab is ready.",
    "Hello, sir. Another productive day awaits.",
]

export function WelcomeScreen({ userName, onComplete }: WelcomeScreenProps) {
    const [displayedText, setDisplayedText] = useState('')
    const [showGreeting, setShowGreeting] = useState(false)
    // FIX: Use useState to prevent greeting from changing on every render
    const [greeting] = useState(() =>
        jarvisGreetings[Math.floor(Math.random() * jarvisGreetings.length)]
    )

    // Typing effect for Jarvis greeting - FASTER
    useEffect(() => {
        const timer = setTimeout(() => setShowGreeting(true), 800)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (!showGreeting) return

        let index = 0
        const typingInterval = setInterval(() => {
            if (index <= greeting.length) {
                setDisplayedText(greeting.slice(0, index))
                index++
            } else {
                clearInterval(typingInterval)
                setTimeout(onComplete, 1000)
            }
        }, 25)

        return () => clearInterval(typingInterval)
    }, [showGreeting, greeting, onComplete])

    return (
        <motion.div
            className="screen welcome-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="welcome-content">
                {/* Success checkmark */}
                <motion.div
                    className="success-icon"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, type: 'spring', bounce: 0.5 }}
                >
                    <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" />
                        <motion.path
                            d="M30 50 L45 65 L70 35"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.4, delay: 0.5 }}
                        />
                    </svg>
                </motion.div>

                {/* Welcome text */}
                <motion.div
                    className="welcome-text"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                >
                    <h1 className="welcome-title">WELCOME BACK</h1>
                    <motion.h2
                        className="welcome-name"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2, duration: 0.4 }}
                    >
                        {userName.toUpperCase()}
                    </motion.h2>
                </motion.div>

                {/* Jarvis greeting */}
                <motion.div
                    className="jarvis-greeting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: showGreeting ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="jarvis-avatar">
                        <motion.div
                            className="jarvis-ring"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        />
                        <span className="jarvis-icon">🤖</span>
                    </div>
                    <div className="jarvis-message">
                        <span className="jarvis-label">JARVIS</span>
                        <p className="jarvis-text">
                            "{displayedText}"
                            <motion.span
                                className="cursor"
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                            >|</motion.span>
                        </p>
                    </div>
                </motion.div>

                {/* Loading bar */}
                <motion.div
                    className="loading-section"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                >
                    <p className="loading-text">Initializing dashboard...</p>
                    <div className="loading-bar">
                        <motion.div
                            className="loading-fill"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ delay: 1.2, duration: 1.5, ease: 'easeInOut' }}
                        />
                    </div>
                </motion.div>
            </div>

            {/* Decorative particles */}
            <div className="welcome-particles">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="particle"
                        initial={{ opacity: 0, y: 100 }}
                        animate={{
                            opacity: [0, 1, 0],
                            y: -200,
                            x: Math.random() * 100 - 50
                        }}
                        transition={{
                            duration: 3,
                            delay: Math.random() * 2,
                            repeat: Infinity,
                            repeatDelay: Math.random() * 2
                        }}
                        style={{
                            left: `${Math.random() * 100}%`,
                            bottom: 0
                        }}
                    />
                ))}
            </div>
        </motion.div>
    )
}
