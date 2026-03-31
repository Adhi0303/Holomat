import { useState, useRef, useEffect } from 'react'
import { Pencil, Eraser, Circle, Square, Trash2, Maximize2, Minimize2, Send } from 'lucide-react'
import './CanvasMode.css'

type Tool = 'pen' | 'eraser' | 'circle' | 'rectangle'

export function CanvasMode() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#00f3ff')
  const [lineWidth, setLineWidth] = useState(3)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [tapCount, setTapCount] = useState(0)
  const tapTimeoutRef = useRef<number | null>(null)

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.strokeStyle = tool === 'eraser' ? '#0a0f1a' : color
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#0a0f1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const handleDoubleTap = () => {
    setTapCount(prev => prev + 1)

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current)
    }

    tapTimeoutRef.current = window.setTimeout(() => {
      if (tapCount + 1 === 2) {
        setIsFullscreen(!isFullscreen)
      }
      setTapCount(0)
    }, 300)
  }

  const sendToAI = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsGenerating(true)
    setGeneratedImage(null)

    try {
      // Convert canvas to base64
      const imageData = canvas.toDataURL('image/png')

      // Send to backend
      const response = await fetch('http://localhost:8001/api/canvas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      })

      const data = await response.json()

      if (data.success && data.image_url) {
        setGeneratedImage(data.image_url)
      } else {
        console.error('AI generation failed:', data.error)
      }
    } catch (error) {
      console.error('Failed to send to AI:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size
    canvas.width = isFullscreen ? window.innerWidth : 800
    canvas.height = isFullscreen ? window.innerHeight : 600

    // Fill with dark background
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#0a0f1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [isFullscreen])

  return (
    <div className={`canvas-mode ${isFullscreen ? 'fullscreen' : ''}`}>
      {!isFullscreen && (
        <div className="canvas-header">
          <h3 className="canvas-title">DRAWING CANVAS</h3>
          <p className="canvas-subtitle">Draw your concept and let AI bring it to life</p>
        </div>
      )}

      <div className="canvas-container" onClick={handleDoubleTap}>
        <canvas
          ref={canvasRef}
          className="drawing-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />

        {/* Toolbar */}
        <div className="canvas-toolbar">
          <div className="tool-group">
            <button
              className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
              onClick={() => setTool('pen')}
              title="Pen"
            >
              <Pencil size={18} />
            </button>
            <button
              className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
              onClick={() => setTool('eraser')}
              title="Eraser"
            >
              <Eraser size={18} />
            </button>
            <button
              className={`tool-btn ${tool === 'circle' ? 'active' : ''}`}
              onClick={() => setTool('circle')}
              title="Circle"
            >
              <Circle size={18} />
            </button>
            <button
              className={`tool-btn ${tool === 'rectangle' ? 'active' : ''}`}
              onClick={() => setTool('rectangle')}
              title="Rectangle"
            >
              <Square size={18} />
            </button>
          </div>

          <div className="tool-group">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="color-picker"
              title="Color"
            />
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="line-width-slider"
              title="Line Width"
            />
          </div>

          <div className="tool-group">
            <button className="tool-btn" onClick={clearCanvas} title="Clear Canvas">
              <Trash2 size={18} />
            </button>
            <button
              className="tool-btn"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>

          <button
            className="send-ai-btn"
            onClick={sendToAI}
            disabled={isGenerating}
            title="Send to AI"
          >
            <Send size={18} />
            {isGenerating ? 'GENERATING...' : 'SEND TO AI'}
          </button>
        </div>

        {/* Hint */}
        {!isFullscreen && (
          <div className="canvas-hint">
            Double-tap canvas for fullscreen • Draw and click "Send to AI"
          </div>
        )}
      </div>

      {/* Generated Image Preview */}
      {generatedImage && (
        <div className="generated-preview">
          <div className="preview-header">
            <h4>AI GENERATED IMAGE</h4>
            <button className="close-preview" onClick={() => setGeneratedImage(null)}>✕</button>
          </div>
          <img src={generatedImage} alt="AI Generated" className="preview-image" />
          <div className="preview-actions">
            <button className="preview-btn">Download</button>
            <button className="preview-btn primary">Convert to 3D</button>
          </div>
        </div>
      )}
    </div>
  )
}
