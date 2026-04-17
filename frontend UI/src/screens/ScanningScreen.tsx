/**
 * ScanningScreen
 * Pure animated boot sequence — NO camera usage.
 * User taps to activate → system runs a timed visual boot animation → calls onComplete.
 */

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface ScanningScreenProps {
    onComplete: () => void
}

const BOOT_STAGES = [
    { at: 0,   progress: 0,   status: 'INITIALIZING SYSTEMS...' },
    { at: 400, progress: 15,  status: 'LOADING NEURAL ENGINE...' },
    { at: 900, progress: 32,  status: 'CALIBRATING SENSORS...' },
    { at: 1400, progress: 50, status: 'ESTABLISHING UPLINK...' },
    { at: 1900, progress: 68, status: 'VERIFYING IDENTITY...' },
    { at: 2400, progress: 84, status: 'SYNCING SUBSYSTEMS...' },
    { at: 2900, progress: 97, status: 'ACCESS GRANTED' },
    { at: 3200, progress: 100, status: 'WELCOME, MR. STARK' },
]

export function ScanningScreen({ onComplete }: ScanningScreenProps) {
    const [progress, setProgress] = useState(0)
    const [stageIndex, setStageIndex] = useState(0)

    useEffect(() => {
        const timers: ReturnType<typeof setTimeout>[] = []

        BOOT_STAGES.forEach((stage, i) => {
            timers.push(
                setTimeout(() => {
                    setProgress(stage.progress)
                    setStageIndex(i)
                }, stage.at)
            )
        })

        // Finish after the last stage + brief hold
        timers.push(
            setTimeout(() => {
                onComplete()
            }, BOOT_STAGES[BOOT_STAGES.length - 1].at + 600)
        )

        return () => timers.forEach(clearTimeout)
    }, [onComplete])

    const currentStage = BOOT_STAGES[stageIndex]
    const isDone = progress === 100

    return (
        <motion.div
            className="screen scanning-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="scanning-content">
                {/* Progress ring */}
                <div className="progress-container">
                    <svg className="progress-ring" viewBox="0 0 200 200">
                        {/* Background ring */}
                        <circle
                            cx="100"
                            cy="100"
                            r="90"
                            fill="none"
                            stroke="rgba(0, 212, 255, 0.1)"
                            strokeWidth="4"
                        />
                        {/* Progress ring */}
                        <motion.circle
                            cx="100"
                            cy="100"
                            r="90"
                            fill="none"
                            stroke="url(#progressGradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={565.48}
                            strokeDashoffset={565.48 - (565.48 * progress) / 100}
                            transform="rotate(-90 100 100)"
                            initial={{ strokeDashoffset: 565.48 }}
                            animate={{ strokeDashoffset: 565.48 - (565.48 * progress) / 100 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                        />
                        {/* Inner decorative rings */}
                        <circle
                            cx="100"
                            cy="100"
                            r="70"
                            fill="none"
                            stroke="rgba(0, 212, 255, 0.2)"
                            strokeWidth="1"
                            strokeDasharray="10 5"
                        />
                        <circle
                            cx="100"
                            cy="100"
                            r="50"
                            fill="none"
                            stroke="rgba(0, 212, 255, 0.15)"
                            strokeWidth="1"
                        />
                        {/* Gradient definition */}
                        <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#00d4ff" />
                                <stop offset="100%" stopColor="#00f5ff" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Center content */}
                    <div className="scan-center">
                        {/* Holomat logo / power icon instead of face */}
                        <motion.div
                            className="scan-face-icon"
                            animate={{
                                scale: isDone ? [1, 1.15, 1] : 1,
                                color: isDone ? '#00ff88' : '#00d4ff',
                            }}
                            transition={{ duration: 0.6, repeat: isDone ? 0 : 0 }}
                        >
                            <svg viewBox="0 0 100 100">
                                {/* Zap / power bolt */}
                                <polygon
                                    points="55,10 30,55 50,55 45,90 70,45 50,45"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </motion.div>
                        <div className="scan-percentage">{Math.round(progress)}%</div>
                    </div>
                </div>

                {/* Title */}
                <motion.h2
                    className="scan-title"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    HOLOMAT BOOT
                </motion.h2>

                {/* Status text */}
                <motion.p
                    className="scan-status"
                    key={currentStage.status}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    {currentStage.status}
                </motion.p>

                {/* Scanning lines effect */}
                <div className="scan-lines-container">
                    <motion.div
                        className="scan-line"
                        animate={{ y: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                </div>
            </div>
        </motion.div>
    )
}
