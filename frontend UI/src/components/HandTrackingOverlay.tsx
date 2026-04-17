/**
 * HandTrackingOverlay
 * Full-screen transparent overlay rendering the virtual hand cursor.
 * Cursor position updates DOM directly (bypasses React) for 60fps.
 * Also renders the CameraPreviewPanel mini-screen.
 */

import { useRef, useEffect } from 'react'
import { useHandTracking, type HandGesture } from '../hooks/useHandTracking'
import { CameraPreviewPanel } from './CameraPreviewPanel'
import '../styles/HandTrackingOverlay.css'

// ─── Gesture meta ──────────────────────────────────────────────────────────────
const GESTURE_LABEL: Record<HandGesture, string> = {
  none:     'NO HAND',
  open:     'HOVER',
  pinch:    'CLICK',
  fist:     'GRAB',
  zoom_in:  'ZOOM +',
  zoom_out: 'ZOOM −',
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  enabled: boolean
}

export function HandTrackingOverlay({ enabled }: Props) {
  const { state, videoRef, onCursorMove } = useHandTracking(enabled)

  // Cursor DOM ref — position updated via JS, not React state
  const cursorRef    = useRef<HTMLDivElement>(null)
  const isActiveRef  = useRef(false)

  // Hover element tracking
  const hoverEl      = useRef<Element | null>(null)

  // Throttle hover lookups to every N frames
  const hoverFrame   = useRef(0)

  // ── Register cursor-move callback (direct DOM, no re-renders) ──────────────
  useEffect(() => {
    onCursorMove.current = (x: number, y: number, active: boolean) => {
      const el = cursorRef.current
      if (!el) return

      if (active) {
        el.style.transform = `translate(${x - 20}px, ${y - 20}px)`

        if (!isActiveRef.current) {
          el.classList.remove('ht-cursor--inactive')
          isActiveRef.current = true
        }

        // Hover detection (every 3 frames for perf)
        hoverFrame.current++
        if (hoverFrame.current % 3 === 0) {
          const target = document.elementFromPoint(x, y)
          const interactive = target?.closest(
            'button, a, [role="button"], [data-hand-target], input, select, .quickaction-btn, .mode-tab, .model-btn'
          )
          if (interactive !== hoverEl.current) {
            hoverEl.current?.classList.remove('hand-hover')
            interactive?.classList.add('hand-hover')
            hoverEl.current = interactive ?? null
          }
        }
      } else {
        if (isActiveRef.current) {
          el.classList.add('ht-cursor--inactive')
          isActiveRef.current = false
          hoverEl.current?.classList.remove('hand-hover')
          hoverEl.current = null
        }
      }
    }
  }, [onCursorMove])

  // ── Sync gesture class on the cursor div ──────────────────────────────────
  const prevGestureClass = useRef<string>('')
  useEffect(() => {
    const el = cursorRef.current
    if (!el) return

    const newClass = `ht-cursor--${state.gesture}`
    if (newClass !== prevGestureClass.current) {
      if (prevGestureClass.current) el.classList.remove(prevGestureClass.current)
      if (state.gesture !== 'none') el.classList.add(newClass)
      prevGestureClass.current = newClass
    }
  }, [state.gesture])

  // ── Cleanup hover on disable ──────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) {
      hoverEl.current?.classList.remove('hand-hover')
      hoverEl.current = null
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <div className="ht-overlay" aria-hidden="true">
        {/* Hidden camera feed consumed by MediaPipe — actual display is in CameraPreviewPanel */}
        <video
          ref={videoRef}
          className="ht-video"
          playsInline
          muted
        />

        {/* ── Virtual hand cursor ── */}
        <div
          ref={cursorRef}
          className="ht-cursor ht-cursor--inactive"
        >
          <div className="ht-cursor__ring" />
          <div className="ht-cursor__cross" />
          <div className="ht-cursor__bracket" />
          <div className="ht-cursor__dot" />
          <span className="ht-cursor__label">
            {GESTURE_LABEL[state.gesture]}
          </span>
        </div>

        {/* ── Status HUD (top-right) ── */}
        <div className={`ht-hud ${state.isActive ? 'ht-hud--active' : ''}`}>
          <div className="ht-hud__dot" />
          <span className="ht-hud__text">
            {state.isTracking
              ? state.isActive
                ? GESTURE_LABEL[state.gesture]
                : 'CAM READY'
              : 'INITIALIZING...'}
          </span>
        </div>
      </div>

      {/* ── Mini camera preview panel — draggable, live feed + skeleton ── */}
      <CameraPreviewPanel
        enabled={enabled}
        videoRef={videoRef}
        landmarks={state.landmarks}
        gesture={state.gesture}
        isTracking={state.isTracking}
        isActive={state.isActive}
      />
    </>
  )
}
