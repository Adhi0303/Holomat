/**
 * VirtualHandCursor Component
 * ============================
 * Full-screen overlay rendering a sci-fi Iron Man–style cursor
 * that tracks the user's index finger tip position from MediaPipe.
 *
 * Visual states:
 *   - Hover (open hand):  cyan ring + dot
 *   - Point (index only): small precise cyan dot
 *   - Pinch (tap/click):  gold burst effect
 *   - Grab (fist):        orange dashed rotating ring
 *   - Hidden:             fades out when no hand detected
 */

import { useRef, useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import '../styles/VirtualHandCursor.css'

// Trail dot for visual movement feedback
interface TrailDot {
    x: number
    y: number
    id: number
}

export function VirtualHandCursor() {
    const { handCursor } = useAppStore()
    const trailRef = useRef<TrailDot[]>([])
    const trailIdRef = useRef(0)
    const trailContainerRef = useRef<HTMLDivElement>(null)
    const lastTrailPos = useRef({ x: 0, y: 0 })

    // Determine cursor visual state
    const getCursorState = (): string => {
        if (!handCursor.visible) return 'hidden'
        if (handCursor.isPinching) return 'pinch'
        if (handCursor.isGrabbing) return 'grab'
        return 'hover'
    }

    const getLabel = (): string => {
        if (handCursor.isPinching) return 'TAP'
        if (handCursor.isGrabbing) return 'GRAB'
        return 'TRACK'
    }

    const state = getCursorState()

    // Add trail dots on movement
    useEffect(() => {
        if (!handCursor.visible) return

        const dx = handCursor.screenX - lastTrailPos.current.x
        const dy = handCursor.screenY - lastTrailPos.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        // Only add trail if moved significantly
        if (dist > 15) {
            lastTrailPos.current = { x: handCursor.screenX, y: handCursor.screenY }

            const id = ++trailIdRef.current
            trailRef.current.push({ x: handCursor.screenX, y: handCursor.screenY, id })

            // Keep max 8 trail dots
            if (trailRef.current.length > 8) {
                trailRef.current.shift()
            }

            // Clean up old trail dots after animation
            setTimeout(() => {
                trailRef.current = trailRef.current.filter(t => t.id !== id)
            }, 500)
        }
    }, [handCursor.screenX, handCursor.screenY, handCursor.visible])

    return (
        <div className="vhc-overlay">
            {/* Trail dots */}
            <div ref={trailContainerRef}>
                {trailRef.current.map(dot => (
                    <div
                        key={dot.id}
                        className="vhc-trail"
                        style={{ left: dot.x, top: dot.y }}
                    />
                ))}
            </div>

            {/* Main cursor */}
            <div
                className={`vhc-cursor vhc-cursor--${state}`}
                style={{
                    left: handCursor.screenX,
                    top: handCursor.screenY,
                }}
            >
                <div className="vhc-ring" />
                <div className="vhc-dot" />
                {handCursor.visible && (
                    <div className="vhc-label">{getLabel()}</div>
                )}
            </div>
        </div>
    )
}
