/**
 * HandTrackingOverlay Component (v2 — Gesture Sync)
 * ===================================================
 * Renders a sci-fi camera preview in the bottom corner.
 * Now sends detected gestures to the Pi backend via WebSocket
 * so the projector display reacts to hand movements.
 *
 * Shows:
 *   - Live webcam feed (mirrored)
 *   - MediaPipe skeleton landmarks
 *   - Current detected gesture label
 *   - WebSocket sync status indicator
 */

import { useState, useEffect, useRef } from 'react'
import { useHandTracking, type HandGesture } from '../hooks/useHandTracking'
import { useGestureSync, type GestureType } from '../hooks/useGestureSync'
import { useAppStore } from '../stores/appStore'
import '../styles/HandTrackingOverlay.css'

// Map gestures to emoji labels for the HUD
const GESTURE_ICONS: Record<HandGesture, string> = {
    none:        '·  ·  ·',
    hover:       '✋ HOVER',
    grab:        '✊ GRAB',
    swipe_left:  '👈 SWIPE LEFT',
    swipe_right: '👉 SWIPE RIGHT',
    push:        '☝️ POINT',
    pull:        '🤚 PULL',
}

interface HandTrackingOverlayProps {
    /** Only activate tracking once the dashboard is fully loaded */
    enabled?: boolean
}

export function HandTrackingOverlay({ enabled: dashboardReady = false }: HandTrackingOverlayProps) {
    const [trackingOn, setTrackingOn] = useState(true)
    const [collapsed, setCollapsed] = useState(false)
    const { handSensitivity } = useAppStore()

    // Hand tracking from camera
    const { videoRef, canvasRef, status, error, currentGesture, handVisible } =
        useHandTracking({ enabled: dashboardReady && trackingOn, sensitivity: handSensitivity })

    // WebSocket sync to Pi backend (control mode = laptop sends gestures)
    const { sendGesture, isConnected } = useGestureSync('control')

    // Track the last gesture we sent to avoid spamming
    const lastSentGesture = useRef<HandGesture>('none')

    // Send gestures to Pi backend when they change
    useEffect(() => {
        if (currentGesture !== 'none' && currentGesture !== lastSentGesture.current) {
            sendGesture(currentGesture as GestureType, 0.9)
            lastSentGesture.current = currentGesture
        } else if (currentGesture === 'none') {
            lastSentGesture.current = 'none'
        }
    }, [currentGesture, sendGesture])

    // Don't render the widget at all during the boot/login flow
    if (!dashboardReady) return null

    return (
        <div className={`ht-overlay ${collapsed ? 'ht-collapsed' : ''}`}>
            {/* Header bar */}
            <div className="ht-header">
                <span className="ht-title">
                    <span className={`ht-dot ${handVisible ? 'ht-dot--active' : ''}`} />
                    HAND TRACKING
                    {/* WebSocket sync indicator */}
                    <span
                        className={`ht-sync-dot ${isConnected ? 'ht-sync--connected' : 'ht-sync--disconnected'}`}
                        title={isConnected ? 'Synced to projector' : 'Not connected to Pi'}
                    />
                </span>
                <div className="ht-controls">
                    <button
                        className={`ht-btn ${trackingOn ? 'ht-btn--on' : 'ht-btn--off'}`}
                        onClick={() => setTrackingOn((v: boolean) => !v)}
                        title={trackingOn ? 'Disable tracking' : 'Enable tracking'}
                    >
                        {trackingOn ? 'ON' : 'OFF'}
                    </button>
                    <button
                        className="ht-btn ht-btn--icon"
                        onClick={() => setCollapsed(c => !c)}
                        title={collapsed ? 'Expand' : 'Collapse'}
                    >
                        {collapsed ? '▲' : '▼'}
                    </button>
                </div>
            </div>

            {/* Camera feed (hidden when collapsed) */}
            {!collapsed && (
                <div className="ht-feed">
                    {/* Status overlays */}
                    {status === 'loading' && (
                        <div className="ht-status ht-status--loading">
                            <div className="ht-spinner" />
                            Loading model…
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="ht-status ht-status--error">
                            ⚠️ {error ?? 'Error'}
                        </div>
                    )}
                    {status === 'disabled' && (
                        <div className="ht-status ht-status--disabled">
                            Hand tracking OFF
                        </div>
                    )}

                    {/* Video + overlay canvas stacked */}
                    <div className="ht-video-wrap">
                        <video
                            ref={videoRef}
                            className="ht-video"
                            muted
                            playsInline
                        />
                        <canvas ref={canvasRef} className="ht-canvas" />
                    </div>

                    {/* Gesture label */}
                    <div className={`ht-gesture ${currentGesture !== 'none' ? 'ht-gesture--active' : ''}`}>
                        {GESTURE_ICONS[currentGesture]}
                    </div>

                    {/* Sync status bar */}
                    <div className={`ht-sync-bar ${isConnected ? 'ht-sync-bar--active' : ''}`}>
                        {isConnected ? '🔗 SYNCED TO PROJECTOR' : '⚠️ PROJECTOR OFFLINE'}
                    </div>
                </div>
            )}
        </div>
    )
}
