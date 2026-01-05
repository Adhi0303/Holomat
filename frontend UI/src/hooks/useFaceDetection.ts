import { useEffect, useRef, useState, useCallback } from 'react'
import * as faceDetection from '@tensorflow-models/face-detection'
import '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'

interface FaceDetectionProps {
    onFaceDetected: () => void
    onNoFace: () => void
    isActive: boolean
}

export function useFaceDetection({ onFaceDetected, onNoFace, isActive }: FaceDetectionProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [detector, setDetector] = useState<faceDetection.FaceDetector | null>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [faceCount, setFaceCount] = useState(0)
    const [isModelLoading, setIsModelLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const detectionIntervalRef = useRef<number | null>(null)

    // Initialize the face detection model
    useEffect(() => {
        const loadModel = async () => {
            try {
                setIsModelLoading(true)
                const model = faceDetection.SupportedModels.MediaPipeFaceDetector
                const detectorConfig: faceDetection.MediaPipeFaceDetectorTfjsModelConfig = {
                    runtime: 'tfjs',
                    maxFaces: 1,
                    modelType: 'short', // 'short' or 'full' - short is faster
                }

                const det = await faceDetection.createDetector(model, detectorConfig)
                setDetector(det)
                setIsModelLoading(false)
            } catch (err) {
                console.error('Failed to load face detection model:', err)
                setError('Failed to load face detection model')
                setIsModelLoading(false)
            }
        }

        loadModel()

        return () => {
            if (detector) {
                detector.dispose()
            }
        }
    }, [])

    // Access webcam
    useEffect(() => {
        if (!isActive) {
            // Turn off camera when scanning completes
            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop()
                    console.log('✓ CAMERA TURNED OFF - Facial recognition complete')
                })
                setStream(null)
                if (videoRef.current) {
                    videoRef.current.srcObject = null
                }
            }
            return
        }

        const startVideo = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user'
                    },
                    audio: false
                })

                setStream(mediaStream)

                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream
                }
            } catch (err) {
                console.error('Failed to access webcam:', err)
                setError('Failed to access webcam. Please grant camera permissions.')
            }
        }

        startVideo()

        return () => {
            // Cleanup on unmount
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [isActive])

    // Face detection loop
    const detectFaces = useCallback(async () => {
        if (!detector || !videoRef.current || !isActive) return

        try {
            const video = videoRef.current

            // Make sure video is ready
            if (video.readyState !== video.HAVE_ENOUGH_DATA) {
                return
            }

            const faces = await detector.estimateFaces(video, { flipHorizontal: false })
            setFaceCount(faces.length)

            if (faces.length > 0) {
                onFaceDetected()
            } else {
                onNoFace()
            }
        } catch (err) {
            console.error('Face detection error:', err)
        }
    }, [detector, isActive, onFaceDetected, onNoFace])

    // Run detection at intervals
    useEffect(() => {
        if (!detector || !isActive) return

        detectionIntervalRef.current = window.setInterval(() => {
            detectFaces()
        }, 200) // Run detection every 200ms

        return () => {
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current)
            }
        }
    }, [detector, isActive, detectFaces])

    return {
        videoRef,
        faceCount,
        isModelLoading,
        error,
        stream
    }
}
