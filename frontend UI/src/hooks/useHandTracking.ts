/**
 * useHandTracking Hook
 * =====================
 * Runs Google MediaPipe HandLandmarker entirely inside the browser.
 * Detects hand landmarks at ~30 FPS, classifies them into gestures,
 * and pushes the result into the Zustand store via setGesture().
 *
 * No server needed. No Python. Completely runs on the GPU via WebAssembly.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
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

// MediaPipe landmark indices (from the 21-point hand model)
const WRIST        = 0
const INDEX_TIP    = 8
const MIDDLE_TIP   = 12
const RING_TIP     = 16
const PINKY_TIP    = 20
const INDEX_MCP    = 5  // knuckle
const MIDDLE_MCP   = 9
const RING_MCP     = 13
const PINKY_MCP    = 17

// How far (0–1 normalised) a hand must move horizontally to count as a swipe
const SWIPE_THRESHOLD = 0.08
// How many frames we keep in the velocity window for swipe detection
const VELOCITY_HISTORY = 6
// Minimum frames between gesture detections (prevents rapid-fire)
const GESTURE_COOLDOWN_FRAMES = 20

// ─── Gesture Classifier ───────────────────────────────────────────────────────

interface Point { x: number; y: number; z: number }
type Landmarks = Point[]

/** Is this finger tip above its knuckle (i.e. extended)? */
function isFingerExtended(tip: Point, mcp: Point): boolean {
    return tip.y < mcp.y  // y=0 is top of frame
}

/** Classify the static hand shape */
function classifyHandShape(landmarks: Landmarks): HandGesture {
    const indexUp  = isFingerExtended(landmarks[INDEX_TIP],  landmarks[INDEX_MCP])
    const middleUp = isFingerExtended(landmarks[MIDDLE_TIP], landmarks[MIDDLE_MCP])
    const ringUp   = isFingerExtended(landmarks[RING_TIP],   landmarks[RING_MCP])
    const pinkyUp  = isFingerExtended(landmarks[PINKY_TIP],  landmarks[PINKY_MCP])

    const fingersUp = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length

    if (fingersUp === 0)  return 'grab'   // closed fist
    if (fingersUp >= 3)   return 'hover'  // open palm / hover
    if (indexUp && !middleUp && !ringUp && !pinkyUp) return 'push' // one finger point
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
    const landmarker  = useRef<HandLandmarker | null>(null)
    const rafId       = useRef<number>(0)
    const wristHistory = useRef<number[]>([])  // stores wrist x positions
    const cooldown    = useRef(0)

    const [status, setStatus]   = useState<TrackingStatus>('loading')
    const [error, setError]     = useState<string | null>(null)
    const [currentGesture, setCurrentGesture] = useState<HandGesture>('none')
    const [handVisible, setHandVisible]       = useState(false)

    // ── Load the MediaPipe model ─────────────────────────────────────────────
    useEffect(() => {
        if (!enabled) { setStatus('disabled'); return }

        async function load() {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
                )
                landmarker.current = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
                        delegate: 'GPU',
                    },
                    runningMode:          'VIDEO',
                    numHands:              1,
                    minHandDetectionConfidence: 0.6,
                    minHandPresenceConfidence:  0.6,
                    minTrackingConfidence:      0.5,
                })
                setStatus('ready')
                console.log('✋ MediaPipe HandLandmarker loaded successfully!')
            } catch (err) {
                console.error('MediaPipe load failed:', err)
                setError('Failed to load hand tracking model')
                setStatus('error')
            }
        }

        load()

        return () => { landmarker.current?.close() }
    }, [enabled])

    // ── Start webcam ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (status !== 'ready' || !videoRef.current) return

        let stream: MediaStream | null = null

        async function startCam() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, facingMode: 'user' },
                    audio: false,
                })
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    videoRef.current.play()
                }
            } catch (err) {
                setError('Camera permission denied')
                setStatus('error')
            }
        }

        startCam()

        return () => { stream?.getTracks().forEach(t => t.stop()) }
    }, [status])

    // ── Processing loop ───────────────────────────────────────────────────────
    const processFrame = useCallback(() => {
        const video = videoRef.current
        const canvas = canvasRef.current
        const lm = landmarker.current

        if (!video || !canvas || !lm || video.readyState < 2) {
            rafId.current = requestAnimationFrame(processFrame)
            return
        }

        const now = performance.now()
        const result: HandLandmarkerResult = lm.detectForVideo(video, now)

        // Draw skeleton on canvas
        const ctx = canvas.getContext('2d')
        if (ctx) {
            canvas.width  = video.videoWidth
            canvas.height = video.videoHeight
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            if (result.landmarks.length > 0) {
                drawLandmarks(ctx, result.landmarks[0], canvas.width, canvas.height)
            }
        }

        // ── Gesture classification ──────────────────────────────────────────
        if (result.landmarks.length === 0) {
            setHandVisible(false)
            wristHistory.current = []
            if (currentGesture !== 'none') {
                setCurrentGesture('none')
                setGesture('none')
                updateSensor('gesture', 'READY', 'ready')
            }
        } else {
            setHandVisible(true)
            const landmarks = result.landmarks[0]
            const wristX = landmarks[WRIST].x

            // Track wrist x position over time for swipe detection
            wristHistory.current.push(wristX)
            if (wristHistory.current.length > VELOCITY_HISTORY) {
                wristHistory.current.shift()
            }

            // Detect swipe if enough history
            let detected: HandGesture = 'none'

            if (cooldown.current > 0) {
                cooldown.current--
            } else if (wristHistory.current.length >= VELOCITY_HISTORY) {
                const delta = wristHistory.current[0] - wristHistory.current[wristHistory.current.length - 1]

                if (delta > SWIPE_THRESHOLD) {
                    // Note: MediaPipe video is mirrored, so left/right are flipped
                    detected = 'swipe_right'
                } else if (delta < -SWIPE_THRESHOLD) {
                    detected = 'swipe_left'
                } else {
                    detected = classifyHandShape(landmarks)
                }

                if (detected !== 'none' && detected !== currentGesture) {
                    setCurrentGesture(detected)

                    // Map to store gesture types (grab/hover stay as internal)
                    const storeGesture = detected === 'grab' ? 'push' : detected
                    setGesture(storeGesture as ReturnType<typeof setGesture extends (g: infer G) => void ? (g: G) => G : never>)

                    // Update the gesture sensor in the sidebar
                    const label = detected.replace('_', ' ').toUpperCase()
                    updateSensor('gesture', label, 'active')

                    console.log(`✋ Hand gesture: ${detected}`)
                    cooldown.current = GESTURE_COOLDOWN_FRAMES
                }
            }
        }

        rafId.current = requestAnimationFrame(processFrame)
    }, [setGesture, updateSensor, currentGesture])

    // Start / stop the loop
    useEffect(() => {
        if (status !== 'ready') return

        rafId.current = requestAnimationFrame(processFrame)
        return () => { cancelAnimationFrame(rafId.current) }
    }, [status, processFrame])

    return { videoRef, canvasRef, status, error, currentGesture, handVisible }
}

// ─── Canvas Drawing ──────────────────────────────────────────────────────────

const CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],       // thumb
    [0,5],[5,6],[6,7],[7,8],       // index
    [0,9],[9,10],[10,11],[11,12],  // middle
    [0,13],[13,14],[14,15],[15,16],// ring
    [0,17],[17,18],[18,19],[19,20],// pinky
    [5,9],[9,13],[13,17],          // palm
]

function drawLandmarks(
    ctx: CanvasRenderingContext2D,
    landmarks: { x: number; y: number; z: number }[],
    w: number,
    h: number
) {
    // Connections
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.7)'
    ctx.lineWidth   = 2
    for (const [a, b] of CONNECTIONS) {
        ctx.beginPath()
        ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h)
        ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h)
        ctx.stroke()
    }

    // Joints
    for (const lm of landmarks) {
        ctx.beginPath()
        ctx.arc(lm.x * w, lm.y * h, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#FFD700'
        ctx.fill()
    }
}
