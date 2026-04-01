/**
 * HandTrackingOverlay Component
 * ==============================
 * Renders a sci-fi style camera preview in the bottom corner of the UI.
 * Shows:
 *   - Live webcam feed (mirrored)
 *   - MediaPipe skeleton landmarks drawn on top
 *   - Current detected gesture label
 *   - Toggle button to enable/disable tracking
 */

import { useState } from 'react'
import { useHandTracking, type HandGesture } from '../hooks/useHandTracking'
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

export function HandTrackingOverlay() {
    const [enabled, setEnabled] = useState(true)
    const [collapsed, setCollapsed] = useState(false)

    const { videoRef, canvasRef, status, error, currentGesture, handVisible } =
        useHandTracking({ enabled })

    return (
        <div className={`ht-overlay ${collapsed ? 'ht-collapsed' : ''}`}>
            {/* Header bar */}
            <div className="ht-header">
                <span className="ht-title">
                    <span className={`ht-dot ${handVisible ? 'ht-dot--active' : ''}`} />
                    HAND TRACKING
                </span>
                <div className="ht-controls">
                    <button
                        className={`ht-btn ${enabled ? 'ht-btn--on' : 'ht-btn--off'}`}
                        onClick={() => setEnabled(e => !e)}
                        title={enabled ? 'Disable tracking' : 'Enable tracking'}
                    >
                        {enabled ? 'ON' : 'OFF'}
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
                </div>
            )}
        </div>
    )
}
