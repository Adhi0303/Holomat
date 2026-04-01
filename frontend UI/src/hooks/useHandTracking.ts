/**
 * useHandTracking Hook
 * =====================
 * Runs Google MediaPipe HandLandmarker entirely inside the browser.
 * Detects hand landmarks at ~30 FPS, classifies them into gestures,
 * and pushes the result into the Zustand store via setGesture().
 *
 * React StrictMode safe: uses a single cleanup-aware effect with a
 * cancelled flag so the double-invocation doesn't break camera init.
 */

import { useEffect, useRef, useState } from 'react'
import {
    HandLandmarker,
    FilesetResolver,
    type HandLandmarkerResult,
} from '@mediapipe/tasks-vision'
import { useAppStore } from '../stores/appStore'

// ─── Types ────────────────────────────────────────────────────────────────────

export type HandGesture =
    | 'none'
    | 'swipe_left'
    | 'swipe_right'
    | 'push'
    | 'pull'
    | 'hover'
    | 'grab'

export type TrackingStatus = 'loading' | 'ready' | 'error' | 'disabled'

// ─── Constants ────────────────────────────────────────────────────────────────

const WRIST      = 0
const INDEX_TIP  = 8
const MIDDLE_TIP = 12
const RING_TIP   = 16
const PINKY_TIP  = 20
const INDEX_MCP  = 5
const MIDDLE_MCP = 9
const RING_MCP   = 13
const PINKY_MCP  = 17

const SWIPE_THRESHOLD       = 0.08
const VELOCITY_HISTORY      = 6
const GESTURE_COOLDOWN_FRAMES = 20

// ─── Gesture Classifier ───────────────────────────────────────────────────────

interface Point { x: number; y: number; z: number }
type Landmarks = Point[]

function isFingerExtended(tip: Point, mcp: Point): boolean {
    return tip.y < mcp.y
}

function classifyHandShape(landmarks: Landmarks): HandGesture {
    const indexUp  = isFingerExtended(landmarks[INDEX_TIP],  landmarks[INDEX_MCP])
    const middleUp = isFingerExtended(landmarks[MIDDLE_TIP], landmarks[MIDDLE_MCP])
    const ringUp   = isFingerExtended(landmarks[RING_TIP],   landmarks[RING_MCP])
    const pinkyUp  = isFingerExtended(landmarks[PINKY_TIP],  landmarks[PINKY_MCP])

    const fingersUp = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length

    if (fingersUp === 0) return 'grab'
    if (fingersUp >= 3)  return 'hover'
    if (indexUp && !middleUp && !ringUp && !pinkyUp) return 'push'
    return 'hover'
}

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseHandTrackingOptions {
    enabled?: boolean
}

export function useHandTracking({ enabled = true }: UseHandTrackingOptions = {}) {
    const { setGesture, updateSensor } = useAppStore()

    const videoRef    = useRef<HTMLVideoElement>(null)
    const canvasRef   = useRef<HTMLCanvasElement>(null)
    const rafId       = useRef<number>(0)
    const wristHistory = useRef<number[]>([])
    const cooldown    = useRef(0)
    const currentGestureRef = useRef<HandGesture>('none')

    const [status, setStatus]   = useState<TrackingStatus>('loading')
    const [error, setError]     = useState<string | null>(null)
    const [currentGesture, setCurrentGesture] = useState<HandGesture>('none')
    const [handVisible, setHandVisible]       = useState(false)

    // ── Single master effect: load → camera → detection loop ─────────────────
    useEffect(() => {
        if (!enabled) {
            setStatus('disabled')
            return
        }

        // Cancelled flag prevents async callbacks running after cleanup
        let cancelled = false
        let stream: MediaStream | null = null
        let landmarker: HandLandmarker | null = null
        let rafHandle = 0

        setStatus('loading')

        async function start() {
            // 1. Load MediaPipe model
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
                )
                if (cancelled) return

                landmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
                        delegate: 'GPU',
                    },
                    runningMode:                'VIDEO',
                    numHands:                    1,
                    minHandDetectionConfidence:  0.6,
                    minHandPresenceConfidence:   0.6,
                    minTrackingConfidence:       0.5,
                })
                if (cancelled) { landmarker.close(); return }
                console.log('✋ MediaPipe HandLandmarker loaded!')
            } catch (err) {
                if (!cancelled) {
                    setError('Failed to load hand tracking model — check internet connection')
                    setStatus('error')
                }
                return
            }

            // 2. Open webcam
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, facingMode: 'user' },
                    audio: false,
                })
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

                // Attach stream to video element (poll until ref is available)
                let attempts = 0
                while (!videoRef.current && attempts < 20) {
                    await new Promise(r => setTimeout(r, 50))
                    attempts++
                }
                if (cancelled || !videoRef.current) return

                videoRef.current.srcObject = stream
                await videoRef.current.play()
                if (cancelled) return
            } catch (err) {
                if (!cancelled) {
                    const msg = (err as Error).name === 'NotAllowedError'
                        ? 'Camera permission denied — allow camera in browser settings'
                        : 'Could not open camera'
                    setError(msg)
                    setStatus('error')
                }
                return
            }

            // 3. Start detection loop
            setStatus('ready')

            function detect() {
                if (cancelled) return

                const video  = videoRef.current
                const canvas = canvasRef.current

                if (!video || !canvas || !landmarker || video.readyState < 2) {
                    rafHandle = requestAnimationFrame(detect)
                    return
                }

                const now    = performance.now()
                const result: HandLandmarkerResult = landmarker.detectForVideo(video, now)

                // Draw skeleton
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    canvas.width  = video.videoWidth
                    canvas.height = video.videoHeight
                    ctx.clearRect(0, 0, canvas.width, canvas.height)
                    if (result.landmarks.length > 0) {
                        drawLandmarks(ctx, result.landmarks[0], canvas.width, canvas.height)
                    }
                }

                // Classify gesture
                if (result.landmarks.length === 0) {
                    setHandVisible(false)
                    wristHistory.current = []
                    if (currentGestureRef.current !== 'none') {
                        currentGestureRef.current = 'none'
                        setCurrentGesture('none')
                        setGesture('none')
                        updateSensor('gesture', 'READY', 'ready')
                    }
                } else {
                    setHandVisible(true)
                    const landmarks = result.landmarks[0]
                    const wristX    = landmarks[WRIST].x

                    wristHistory.current.push(wristX)
                    if (wristHistory.current.length > VELOCITY_HISTORY) {
                        wristHistory.current.shift()
                    }

                    if (cooldown.current > 0) {
                        cooldown.current--
                    } else if (wristHistory.current.length >= VELOCITY_HISTORY) {
                        const delta = wristHistory.current[0] - wristHistory.current[wristHistory.current.length - 1]

                        let detected: HandGesture = 'none'
                        if (delta > SWIPE_THRESHOLD)       detected = 'swipe_right'
                        else if (delta < -SWIPE_THRESHOLD) detected = 'swipe_left'
                        else                               detected = classifyHandShape(landmarks)

                        if (detected !== 'none' && detected !== currentGestureRef.current) {
                            currentGestureRef.current = detected
                            setCurrentGesture(detected)

                            const storeGesture = detected === 'grab' ? 'push' : detected
                            setGesture(storeGesture as Parameters<typeof setGesture>[0])

                            const label = detected.replace('_', ' ').toUpperCase()
                            updateSensor('gesture', label, 'active')
                            console.log(`✋ Hand gesture: ${detected}`)
                            cooldown.current = GESTURE_COOLDOWN_FRAMES
                        }
                    }
                }

                rafHandle = requestAnimationFrame(detect)
            }

            rafHandle = requestAnimationFrame(detect)
        }

        start()

        // Cleanup: cancel everything on unmount / enabled toggle / StrictMode re-run
        return () => {
            cancelled = true
            cancelAnimationFrame(rafHandle)
            stream?.getTracks().forEach(t => t.stop())
            landmarker?.close()
            setStatus('loading')
            setHandVisible(false)
            setCurrentGesture('none')
            currentGestureRef.current = 'none'
        }
    }, [enabled, setGesture, updateSensor])

    return { videoRef, canvasRef, status, error, currentGesture, handVisible }
}

// ─── Canvas Drawing ──────────────────────────────────────────────────────────

const CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [0,9],[9,10],[10,11],[11,12],
    [0,13],[13,14],[14,15],[15,16],
    [0,17],[17,18],[18,19],[19,20],
    [5,9],[9,13],[13,17],
]

function drawLandmarks(
    ctx: CanvasRenderingContext2D,
    landmarks: { x: number; y: number; z: number }[],
    w: number,
    h: number
) {
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.7)'
    ctx.lineWidth   = 2
    for (const [a, b] of CONNECTIONS) {
        ctx.beginPath()
        ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h)
        ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h)
        ctx.stroke()
    }
    for (const lm of landmarks) {
        ctx.beginPath()
        ctx.arc(lm.x * w, lm.y * h, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#FFD700'
        ctx.fill()
    }
}
