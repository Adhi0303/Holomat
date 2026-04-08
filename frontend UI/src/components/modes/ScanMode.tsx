import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, RefreshCw, Wand2, Box, Loader } from 'lucide-react'
import { generateImage, type ImageEngine } from '../../services/imageGenService'
import './ScanMode.css'

export function ScanMode() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [viewState, setViewState] = useState<'CAMERA' | 'PREVIEW' | 'PROCESSING_IMAGE' | 'AI_RESULT' | 'PROCESSING_3D'>('CAMERA')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [aiImage, setAiImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [engine, setEngine] = useState<ImageEngine>('auto')

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } })
      streamRef.current = ms
      if (videoRef.current) videoRef.current.srcObject = ms
      setViewState('CAMERA')
      setError(null)
    } catch (err) {
      setError('Camera access denied or unavailable.')
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    startCamera()
    return () => {
        stopCamera()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        setCapturedImage(dataUrl)
        stopCamera()
        setViewState('PREVIEW')
      }
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setAiImage(null)
    startCamera()
  }

  const processWithAI = async () => {
    if (!capturedImage) return
    setViewState('PROCESSING_IMAGE')
    setError(null)
    try {
      // Use the captured image as the prompt context
      const result = await generateImage(
        'Enhance and stylize this captured object photo, make it look professional and detailed',
        'realistic',
        engine
      )
      if (result.success && result.imageUrl) {
        setAiImage(result.imageUrl)
        setViewState('AI_RESULT')
      } else {
        setError(result.error || 'AI Vision processing failed.')
        setViewState('PREVIEW')
      }
    } catch (e) {
      setError(`AI processing error: ${(e as Error).message}`)
      setViewState('PREVIEW')
    }
  }

  const generate3D = async () => {
    if (!aiImage) return
    setViewState('PROCESSING_3D')
    setError(null)
    try {
      const res = await fetch('/api/generate-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: aiImage }),
      })
      const data = await res.json()
      if (data.model_url) {
        stopCamera()
        window.dispatchEvent(new CustomEvent('jarvis-3d-generated', { detail: { url: data.model_url } }))
      } else {
        setError(data.detail || '3D generation failed.')
        setViewState('AI_RESULT')
      }
    } catch (e) {
      setError('Network error during 3D generation.')
      setViewState('AI_RESULT')
    }
  }

  return (
    <div className="mode-panel scan-mode">
      <div className="mode-header">
        <h3>🔍 OBJECT SCANNER</h3>
        <div className="scan-status line-clamp">
            {viewState.replace('_', ' ')}
        </div>
      </div>

      <div className="scan-content">
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <AnimatePresence mode="wait">
        {viewState === 'CAMERA' && (
          <motion.div key="camera" className="scan-frame active" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <video ref={videoRef} autoPlay playsInline muted className="webcam-video" />
            
            <div className="scan-overlay-target">
                {/* Center crosshair */}
                <div className="crosshair h"></div>
                <div className="crosshair v"></div>
            </div>

            <div className="scan-corners">
              <div className="corner top-left" /><div className="corner top-right" />
              <div className="corner bottom-left" /><div className="corner bottom-right" />
            </div>
            {error && <div className="scan-error-msg">{error}</div>}
            
            <div className="scan-controls-overlay">
               <button className="scan-action-btn primary" onClick={capturePhoto}>
                 <Camera size={18} /> CAPTURE OBJECT
               </button>
            </div>
          </motion.div>
        )}

        {viewState === 'PREVIEW' && capturedImage && (
          <motion.div key="preview" className="scan-frame preview" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
             <img src={capturedImage} alt="Captured" className="captured-img" />
             {error && <div className="scan-error-msg">{error}</div>}
             
             <div className="engine-selector">
                <label>AI MODEL</label>
                <select value={engine} onChange={e => setEngine(e.target.value as ImageEngine)}>
                   <option value="auto">Auto (Gemini → Pollinations)</option>
                   <option value="gemini-2.5-flash-image">⚡ Gemini 2.5 Flash Image</option>
                   <option value="gemini-3.1-flash-image-preview">⚡ Gemini 3.1 Flash Preview</option>
                   <option value="gemini-3-pro-image-preview">⭐ Gemini 3 Pro Image</option>
                   <option value="pollinations-flux">🌐 Pollinations: Flux Core</option>
                   <option value="pollinations-flux-realism">🌐 Pollinations: Flux Realism</option>
                </select>
             </div>

             <div className="scan-controls-overlay split">
               <button className="scan-action-btn secondary" onClick={retakePhoto}>
                 <RefreshCw size={16} /> RETAKE
               </button>
               <button className="scan-action-btn primary" onClick={processWithAI}>
                 <Wand2 size={16} /> PROCESS WITH AI
               </button>
             </div>
          </motion.div>
        )}

        {viewState === 'PROCESSING_IMAGE' && (
           <motion.div key="proc_img" className="scan-loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
             <Loader size={48} className="spin accent-color" />
             <p className="loading-title">AI VISION PROCESSING</p>
             <p className="loading-desc">Extracting detailed object features</p>
             <p className="loading-engine">Gemini 2.0 Flash Exp → Pollinations</p>
           </motion.div>
        )}

        {viewState === 'AI_RESULT' && aiImage && (
          <motion.div key="ai_result" className="scan-frame result" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
             <img src={aiImage} alt="AI Processed" className="captured-img" />
             {error && <div className="scan-error-msg">{error}</div>}
             <div className="scan-controls-overlay split">
               <button className="scan-action-btn secondary" onClick={retakePhoto}>
                 <RefreshCw size={16} /> NEW SCAN
               </button>
               <button className="scan-action-btn accent" onClick={generate3D}>
                 <Box size={16} /> TO 3D MODEL
               </button>
             </div>
          </motion.div>
        )}

        {viewState === 'PROCESSING_3D' && (
           <motion.div key="proc_3d" className="scan-loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
             <Loader size={48} className="spin accent-color" />
             <p className="loading-title">GENERATING 3D MODEL</p>
             <p className="loading-desc">Extruding mesh and baking textures...</p>
             <p className="loading-engine">Stability AI (Stable Fast 3D)</p>
           </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  )
}