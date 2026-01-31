import { useState, useEffect } from 'react'
import { useGestureEvents, type GestureType } from '../hooks/useGestureEvents'
import './GestureRecognizer.css'

interface GestureRecognizerProps {
    className?: string
    showInstructions?: boolean
}

export function GestureRecognizer({ className = '', showInstructions = true }: GestureRecognizerProps) {
    const { currentGesture, isReady } = useGestureEvents()
    const [lastGesture, setLastGesture] = useState<GestureType | null>(null)
    const [gestureHistory, setGestureHistory] = useState<GestureType[]>([])

    // Track gesture history
    useEffect(() => {
        if (currentGesture && currentGesture !== 'READY' && currentGesture !== lastGesture) {
            setLastGesture(currentGesture as GestureType)
            setGestureHistory(prev => [currentGesture as GestureType, ...prev.slice(0, 4)]) // Keep last 5
        }
    }, [currentGesture, lastGesture])

    const getGestureIcon = (gesture: GestureType): string => {
        switch (gesture) {
            case 'SWIPE_UP': return '👆'
            case 'SWIPE_DOWN': return '👇'
            case 'SWIPE_LEFT': return '👈'
            case 'SWIPE_RIGHT': return '👉'
            case 'GRAB': return '✊'
            case 'POINT': return '👆'
            case 'TAP': return '👋'
            case 'PINCH_IN': return '🤏'
            case 'PINCH_OUT': return '👐'
            case 'ROTATE_CLOCKWISE': return '🔄'
            case 'ROTATE_COUNTERCLOCKWISE': return '🔄'
            default: return '🤖'
        }
    }

    const getGestureDescription = (gesture: GestureType): string => {
        switch (gesture) {
            case 'SWIPE_UP': return 'Menu Open / Volume Up'
            case 'SWIPE_DOWN': return 'Menu Close / Volume Down'
            case 'SWIPE_LEFT': return 'Previous / Navigate Left'
            case 'SWIPE_RIGHT': return 'Next / Navigate Right'
            case 'GRAB': return 'Voice Activation'
            case 'POINT': return 'Select / Focus'
            case 'TAP': return 'Primary Action'
            case 'PINCH_IN': return 'Zoom Out'
            case 'PINCH_OUT': return 'Zoom In'
            case 'ROTATE_CLOCKWISE': return 'Rotate Right'
            case 'ROTATE_COUNTERCLOCKWISE': return 'Rotate Left'
            default: return 'Unknown Gesture'
        }
    }

    return (
        <div className={`gesture-recognizer ${className}`}>
            <div className="gesture-status">
                <div className={`gesture-indicator ${isReady ? 'ready' : 'active'}`}>
                    <span className="gesture-icon">
                        {isReady ? '👁️' : getGestureIcon(currentGesture as GestureType)}
                    </span>
                    <span className="gesture-text">
                        {isReady ? 'Ready for Gesture' : `Detecting: ${currentGesture}`}
                    </span>
                </div>
            </div>

            {showInstructions && (
                <div className="gesture-instructions">
                    <h4>Available Gestures:</h4>
                    <div className="gesture-list">
                        <div className="gesture-item">
                            <span className="gesture-key">↑↓←→</span>
                            <span>Swipe to navigate</span>
                        </div>
                        <div className="gesture-item">
                            <span className="gesture-key">G</span>
                            <span>Grab for voice</span>
                        </div>
                        <div className="gesture-item">
                            <span className="gesture-key">P</span>
                            <span>Point to select</span>
                        </div>
                        <div className="gesture-item">
                            <span className="gesture-key">Space</span>
                            <span>Tap for action</span>
                        </div>
                    </div>
                </div>
            )}

            {gestureHistory.length > 0 && (
                <div className="gesture-history">
                    <h4>Recent Gestures:</h4>
                    <div className="gesture-history-list">
                        {gestureHistory.map((gesture, index) => (
                            <div key={`${gesture}-${index}`} className="gesture-history-item">
                                <span className="gesture-history-icon">{getGestureIcon(gesture)}</span>
                                <span className="gesture-history-desc">{getGestureDescription(gesture)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}