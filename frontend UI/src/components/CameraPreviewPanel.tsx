/**
 * CameraPreviewPanel
 * Draggable HUD mini-screen that shows the live camera feed with
 * real-time hand landmark skeleton drawn on top.
 *
 * Lives alongside HandTrackingOverlay — shares the same hook state
 * passed down as props to avoid double-initialising MediaPipe.
 */

import { useRef, useEffect, useState, useCallback } from 'react'
import type { RefObject } from 'react'
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import type { HandGesture } from '../hooks/useHandTracking'
import '../styles/CameraPreviewPanel.css'

// ─── MediaPipe hand connections (pairs of landmark indices) ───────────────────
const HAND_CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],         // thumb
  [0,5],[5,6],[6,7],[7,8],         // index
  [5,9],[9,10],[10,11],[11,12],    // middle
  [9,13],[13,14],[14,15],[15,16],  // ring
  [13,17],[17,18],[18,19],[19,20], // pinky
  [0,17],                          // palm outer
]

// Fingertip indices for highlight dots
const FINGERTIPS = [4, 8, 12, 16, 20]

// ─── Gesture colour mapping ───────────────────────────────────────────────────
const GESTURE_COLOR: Record<HandGesture, string> = {
  none:     '#00d4ff',
  open:     '#00d4ff',
  pinch:    '#00ff88',
  fist:     '#ffa028',
  zoom_in:  '#c060ff',
  zoom_out: '#c060ff',
}

const GESTURE_LABEL: Record<HandGesture, string> = {
  none:     'NO HAND',
  open:     'HOVER',
  pinch:    'CLICK',
  fist:     'GRAB',
  zoom_in:  'ZOOM +',
  zoom_out: 'ZOOM −',
}

// ─── Skeleton drawing ─────────────────────────────────────────────────────────
function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  landmarks: NormalizedLandmark[],
  color: string,
) {
  if (!landmarks || landmarks.length < 21) return

  // Draw connection lines
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.globalAlpha = 0.75

  for (const [a, b] of HAND_CONNECTIONS) {
    const lA = landmarks[a]
    const lB = landmarks[b]
    if (!lA || !lB) continue
    // Mirror X so preview matches the hand cursor
    const x1 = (1 - lA.x) * w
    const y1 = lA.y * h
    const x2 = (1 - lB.x) * w
    const y2 = lB.y * h

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  // Draw joint dots
  ctx.globalAlpha = 1
  for (let i = 0; i < 21; i++) {
    const lm = landmarks[i]
    if (!lm) continue
    const x = (1 - lm.x) * w
    const y = lm.y * h
    const isTip = FINGERTIPS.includes(i)

    ctx.beginPath()
    ctx.arc(x, y, isTip ? 5 : 3, 0, Math.PI * 2)
    ctx.fillStyle = isTip ? color : 'rgba(255,255,255,0.85)'
    ctx.shadowColor = color
    ctx.shadowBlur = isTip ? 8 : 4
    ctx.fill()
  }

  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  enabled: boolean
  videoRef: RefObject<HTMLVideoElement | null>
  landmarks: NormalizedLandmark[][]
  gesture: HandGesture
  isTracking: boolean
  isActive: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────
export function CameraPreviewPanel({
  enabled,
  videoRef,
  landmarks,
  gesture,
  isTracking,
  isActive,
}: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const skeletonRef = useRef<HTMLCanvasElement>(null)
  const rafId      = useRef<number>(-1)

  // Dragging state
  const [pos, setPos]         = useState({ x: 16, y: 76 })
  const [minimised, setMin]   = useState(false)
  const dragState              = useRef<{ dragging: boolean; ox: number; oy: number }>({
    dragging: false, ox: 0, oy: 0,
  })

  // ── Mirror video onto canvas at 60fps ──────────────────────────────────────
  useEffect(() => {
    if (!enabled) return

    const loop = () => {
      const video  = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) {
        rafId.current = requestAnimationFrame(loop)
        return
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Draw mirrored frame
      ctx.save()
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      ctx.restore()

      rafId.current = requestAnimationFrame(loop)
    }

    rafId.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId.current)
  }, [enabled, videoRef])

  // ── Draw skeleton on separate overlay canvas ───────────────────────────────
  useEffect(() => {
    const sk = skeletonRef.current
    if (!sk) return
    const ctx = sk.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, sk.width, sk.height)

    if (landmarks.length > 0) {
      const color = GESTURE_COLOR[gesture]
      for (const hand of landmarks) {
        drawSkeleton(ctx, sk.width, sk.height, hand, color)
      }
    }
  }, [landmarks, gesture])

  // ── Drag logic ─────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragState.current = { dragging: true, ox: e.clientX - pos.x, oy: e.clientY - pos.y }
    e.preventDefault()
  }, [pos])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragState.current.dragging) return
      setPos({ x: e.clientX - dragState.current.ox, y: e.clientY - dragState.current.oy })
    }
    const onUp = () => { dragState.current.dragging = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  if (!enabled) return null

  const color = GESTURE_COLOR[gesture]
  const label = GESTURE_LABEL[gesture]

  return (
    <div
      className={`cam-panel${minimised ? ' cam-panel--min' : ''}`}
      style={{ left: pos.x, top: pos.y, ['--gesture-color' as string]: color }}
      aria-label="Camera preview"
      id="cam-preview-panel"
    >
      {/* ── Title bar (drag handle) ── */}
      <div className="cam-panel__bar" onMouseDown={onMouseDown}>
        <div className="cam-panel__bar-dot" />
        <span className="cam-panel__bar-title">◈ CAM FEED</span>
        <div className="cam-panel__bar-status">
          <span
            className={`cam-panel__dot ${isTracking ? 'cam-panel__dot--on' : ''}`}
          />
          <span className="cam-panel__bar-state">
            {isTracking ? (isActive ? label : 'READY') : 'INIT…'}
          </span>
        </div>
        <button
          className="cam-panel__min-btn"
          onClick={() => setMin(v => !v)}
          title={minimised ? 'Expand' : 'Minimise'}
          aria-label={minimised ? 'Expand camera preview' : 'Minimise camera preview'}
        >
          {minimised ? '▲' : '▼'}
        </button>
      </div>

      {/* ── Video + skeleton body ── */}
      {!minimised && (
        <div className="cam-panel__body">
          {/* Raw video frames */}
          <canvas
            ref={canvasRef}
            className="cam-panel__canvas"
            width={240}
            height={180}
          />
          {/* Hand skeleton overlay */}
          <canvas
            ref={skeletonRef}
            className="cam-panel__skeleton"
            width={240}
            height={180}
          />

          {/* Gesture badge */}
          <div className={`cam-panel__badge ${isActive ? 'cam-panel__badge--active' : ''}`}>
            {label}
          </div>

          {/* Scan-line overlay for sci-fi feel */}
          <div className="cam-panel__scanlines" />

          {/* Corner HUD brackets */}
          <div className="cam-panel__tl" />
          <div className="cam-panel__br" />
        </div>
      )}
    </div>
  )
}
