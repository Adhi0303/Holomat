/**
 * useHandTracking
 * MediaPipe-powered hand tracking with gesture recognition.
 * Cursor position is updated via a ref-callback (not React state) for 60fps performance.
 * Gestures are bridged into the global appStore for system-wide reactivity.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { useAppStore } from '../stores/appStore'

// ─── Types ────────────────────────────────────────────────────────────────────
export type HandGesture = 'none' | 'open' | 'pinch' | 'fist' | 'zoom_in' | 'zoom_out'

export interface HandTrackingState {
  gesture: HandGesture
  isActive: boolean         // hand is visible
  isTracking: boolean       // MediaPipe is running
  landmarks: NormalizedLandmark[][] // raw landmark data for mini-screen visualization
}

// ─── Constants ────────────────────────────────────────────────────────────────
const WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
const MODEL_PATH =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

const PINCH_THRESHOLD = 0.07   // thumb-tip ↔ index-tip normalized distance
const FIST_THRESHOLD  = 0.14   // average fingertip ↔ wrist distance for fist

// ─── Geometry helpers ─────────────────────────────────────────────────────────
function dist2D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function classifyGesture(
  lm: NormalizedLandmark[],
  allHands: NormalizedLandmark[][]
): HandGesture {
  if (!lm || lm.length < 21) return 'none'

  const thumbTip  = lm[4]
  const indexTip  = lm[8]
  const middleTip = lm[12]
  const ringTip   = lm[16]
  const pinkyTip  = lm[20]
  const wrist     = lm[0]
  const middleMcp = lm[9] // Reference point for palm size

  // Calculate palm size to make thresholds scale-invariant (works closer to or farther from camera)
  const palmSize = dist2D(wrist, middleMcp)

  // Pinch: thumb and index close together
  if (dist2D(thumbTip, indexTip) < PINCH_THRESHOLD) return 'pinch'

  // Two-hand zoom: both hands visible, classified at call site
  if (allHands.length >= 2) return 'zoom_in'

  // Fist: all fingertips curled inward toward the wrist
  // An open hand has fingertips ~2x to 2.5x palm size away. A fist is ~1.2x.
  const avgFingertipDist =
    (dist2D(indexTip, wrist) +
     dist2D(middleTip, wrist) +
     dist2D(ringTip, wrist) +
     dist2D(pinkyTip, wrist)) / 4

  // Use 1.4x palmSize for a more forgiving and reliable grab detection
  if (avgFingertipDist < palmSize * 1.4) return 'fist'

  return 'open'
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useHandTracking(enabled: boolean) {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const landmarker  = useRef<HandLandmarker | null>(null)
  const rafId       = useRef<number>(-1)

  // Cursor position update callback — set by the overlay component
  // so cursor DOM updates bypass React entirely (60fps)
  const onCursorMove = useRef<(x: number, y: number, active: boolean) => void>(() => {})

  // Gesture transitions — only update React state when gesture *changes*
  const prevGesture = useRef<HandGesture>('none')
  const prevZoomDist = useRef<number | null>(null)

  // Bridge to global store for system-wide gesture reactivity
  const setStoreGesture = useAppStore(s => s.setGesture)
  const updateSensor    = useAppStore(s => s.updateSensor)

  const [state, setState] = useState<HandTrackingState>({
    gesture: 'none',
    isActive: false,
    isTracking: false,
    landmarks: [],
  })

  // Trigger a real click+hover on the element beneath the cursor
  const fireClick = useCallback((x: number, y: number) => {
    const el = document.elementFromPoint(x, y)
    if (!el) return
    const target = el.closest('button, a, [role="button"], [data-hand-target], input, select') ?? el
    ;(target as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y })
    )
  }, [])

  // MediaPipe init — once per mount
  const init = useCallback(async () => {
    const vision = await FilesetResolver.forVisionTasks(WASM_PATH)
    landmarker.current = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_PATH,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.6,
      minHandPresenceConfidence: 0.6,
      minTrackingConfidence: 0.5,
    })
  }, [])

  useEffect(() => {
    if (!enabled) return

    let alive = true
    let stream: MediaStream | null = null

    // Acquire camera with retry — face detection may still be releasing it
    const acquireCamera = async (attempts = 5): Promise<MediaStream> => {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        })
      } catch (err: unknown) {
        const name = err instanceof Error ? err.name : ''
        if ((name === 'NotReadableError' || name === 'AbortError') && attempts > 1) {
          console.warn(`[HandTracking] Camera busy, retrying in 1s… (${attempts - 1} left)`)
          await new Promise(r => setTimeout(r, 1000))
          return acquireCamera(attempts - 1)
        }
        throw err
      }
    }

    const run = async () => {
      try {
        await init()
        if (!alive) return

        stream = await acquireCamera()
        if (!alive || !videoRef.current) return

        videoRef.current.srcObject = stream
        await videoRef.current.play()

        setState(s => ({ ...s, isTracking: true }))

        const loop = () => {
          if (!alive || !landmarker.current || !videoRef.current) return

          const result = landmarker.current.detectForVideo(videoRef.current, performance.now())
          const hands  = result.landmarks ?? []

          if (hands.length > 0) {
            const lm      = hands[0]
            const tipLm   = lm[8]                          // index fingertip = cursor

            // Mirror X: webcam is a selfie view
            const cx = (1 - tipLm.x) * window.innerWidth
            const cy = tipLm.y * window.innerHeight

            // Cursor position via DOM ref — no React state
            onCursorMove.current(cx, cy, true)

            // Gesture classification
            let gesture = classifyGesture(lm, hands)

            // Refine zoom_in → zoom_out based on inter-hand distance delta
            if (hands.length >= 2 && gesture === 'zoom_in') {
              const h2tip    = hands[1][8]
              const d        = dist2D(tipLm, h2tip)
              if (prevZoomDist.current !== null) {
                gesture = d > prevZoomDist.current ? 'zoom_in' : 'zoom_out'

                // Dispatch wheel event for native zoom on hovered element
                const delta = (prevZoomDist.current - d) * 1500
                const el = document.elementFromPoint(cx, cy)
                el?.dispatchEvent(
                  new WheelEvent('wheel', { deltaY: delta, bubbles: true, cancelable: true })
                )
              }
              prevZoomDist.current = d
            } else {
              prevZoomDist.current = null
            }

            // Fire click on pinch START (not every frame)
            if (gesture === 'pinch' && prevGesture.current !== 'pinch') {
              fireClick(cx, cy)
            }

            // Update React state only on gesture change
            if (gesture !== prevGesture.current) {
              prevGesture.current = gesture
              setState(s => ({ ...s, gesture, isActive: true, landmarks: hands }))

              // ── Bridge to global store ──────────────────────────────────
              // Map MediaPipe gestures to store gesture vocabulary
              const storeGesture: Parameters<typeof setStoreGesture>[0] =
                gesture === 'open'  ? 'hover'      :
                gesture === 'pinch' ? 'push'        :
                gesture === 'fist'  ? 'pull'        :
                'none'
              setStoreGesture(storeGesture)
              updateSensor('gesture', gesture.toUpperCase(), 'active')
              updateSensor('camera',  'ON', 'active')
              // ────────────────────────────────────────────────────────────
            } else {
              // Keep landmarks updated every frame even when gesture unchanged
              setState(s => ({ ...s, isActive: true, landmarks: hands }))
            }
          } else {
            onCursorMove.current(0, 0, false)
            if (prevGesture.current !== 'none') {
              prevGesture.current = 'none'
              setState(s => ({ ...s, gesture: 'none', isActive: false, landmarks: [] }))

              // ── Bridge to global store: hand lost ──────────────────────
              setStoreGesture('none')
              updateSensor('gesture', 'READY', 'ready')
              // ────────────────────────────────────────────────────────────
            } else {
              setState(s => ({ ...s, landmarks: [] }))
            }
          }

          rafId.current = requestAnimationFrame(loop)
        }

        rafId.current = requestAnimationFrame(loop)
      } catch (err) {
        console.error('[HandTracking] Failed to start:', err)
        setState(s => ({ ...s, isTracking: false }))
      }
    }

    run()

    return () => {
      alive = false
      cancelAnimationFrame(rafId.current)
      stream?.getTracks().forEach(t => t.stop())
      if (videoRef.current) videoRef.current.srcObject = null
      setState({ gesture: 'none', isActive: false, isTracking: false, landmarks: [] })
      setStoreGesture('none')
      updateSensor('gesture', 'READY', 'ready')
    }
  }, [enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  return { state, videoRef, onCursorMove }
}
