import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useFaceDetection } from '../hooks/useFaceDetection'

interface ScanningScreenProps {
    onComplete: () => void
}

export function ScanningScreen({ onComplete }: ScanningScreenProps) {
    const [progress, setProgress] = useState(0)
    const [status, setStatus] = useState('Initializing camera...')
    const [faceDetected, setFaceDetected] = useState(false)
    const [isScanning, setIsScanning] = useState(true) // Track if actively scanning

    // Face detection hook
    const { videoRef, faceCount, isModelLoading, error, stream } = useFaceDetection({
        onFaceDetected: () => {
            setFaceDetected(true)
        },
        onNoFace: () => {
            setFaceDetected(false)
        },
        isActive: isScanning // Use isScanning state instead of hardcoded true
    })

    // Progress simulation with real face detection
    useEffect(() => {
        if (error) {
            setStatus('Camera access denied. Using simulation mode...')
            // Fall back to simulated scanning
            simulatedScanning()
            return
        }

        if (isModelLoading) {
            setStatus('Loading AI model...')
            return
        }

        if (!stream) {
            setStatus('Waiting for camera...')
            return
        }

        // Real scanning with face detection
        setStatus('Position your face in frame...')

        const stages = [
            { minProgress: 0, status: 'Detecting face...' },
            { minProgress: 25, status: 'Analyzing facial features...' },
            { minProgress: 50, status: 'Matching database...' },
            { minProgress: 75, status: 'Verifying identity...' },
            { minProgress: 95, status: 'Access granted!' },
        ]

        // Progress increases faster when face is detected
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                // Increase by 2-5 points per interval if face detected, otherwise 1
                const increment = faceDetected ? Math.random() * 3 + 2 : 1
                const newProgress = Math.min(prev + increment, 100)

                // Update status based on progress
                const stage = stages.find(s => newProgress >= s.minProgress)
                if (stage) {
                    setStatus(stage.status)
                }

                if (newProgress >= 100) {
                    clearInterval(progressInterval)
                    // Turn off camera BEFORE transitioning
                    setIsScanning(false)
                    console.log('🔴 Stopping camera - scan complete')
                    setTimeout(onComplete, 800) // Give time for camera to turn off
                }

                return newProgress
            })
        }, faceDetected ? 150 : 300) // Faster progress when face detected

        return () => clearInterval(progressInterval)
    }, [stream, isModelLoading, error, faceDetected, onComplete])

    // Simulated scanning fallback
    const simulatedScanning = () => {
        const stages = [
            { progress: 15, status: 'Detecting face...' },
            { progress: 35, status: 'Analyzing features...' },
            { progress: 55, status: 'Matching database...' },
            { progress: 75, status: 'Verifying identity...' },
            { progress: 95, status: 'Access granted!' },
            { progress: 100, status: 'Welcome!' },
        ]

        let currentStage = 0
        const interval = setInterval(() => {
            if (currentStage < stages.length) {
                setProgress(stages[currentStage].progress)
                setStatus(stages[currentStage].status)
                currentStage++
            } else {
                clearInterval(interval)
                setIsScanning(false) // Turn off camera
                console.log('🔴 Stopping camera - simulated scan complete')
                setTimeout(onComplete, 800)
            }
        }, 600)
    }

    return (
        <motion.div
            className="screen scanning-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="scanning-content">
                {/* Video Feed */}
                {stream && !error && (
                    <div className="video-container">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="webcam-feed"
                        />
                        {faceCount > 0 && (
                            <motion.div
                                className="face-detected-indicator"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <span>✓ Face Detected</span>
                            </motion.div>
                        )}
                    </div>
                )}

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
                            transition={{ duration: 0.5, ease: 'easeOut' }}
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
                        <motion.div
                            className="scan-face-icon"
                            animate={{
                                scale: faceDetected ? [1, 1.1, 1] : 1,
                                color: faceDetected ? '#00ff88' : '#00d4ff'
                            }}
                            transition={{ duration: 1, repeat: faceDetected ? Infinity : 0 }}
                        >
                            <svg viewBox="0 0 100 100">
                                <circle cx="50" cy="35" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
                                <path d="M22 80 Q22 55 50 55 Q78 55 78 80" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </motion.div>
                        <div className="scan-percentage">{Math.round(progress)}%</div>
                    </div>
                </div>

                {/* Status text */}
                <motion.h2
                    className="scan-title"
                    key={status}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    FACIAL RECOGNITION
                </motion.h2>

                <motion.p
                    className="scan-status"
                    key={`status-${progress}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    {status}
                </motion.p>

                {error && (
                    <p className="scan-error">{error}</p>
                )}

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
