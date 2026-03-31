/* DesignMode.tsx — Gemini AI Image Generation Studio
   @frontend-specialist
*/
import { useState } from 'react'
import { Sparkles, Image, Loader, Download, RotateCcw, Box } from 'lucide-react'
import './DesignMode.css'

const STYLES = [
  { id: 'holographic', label: 'Holographic', icon: '◈' },
  { id: 'blueprint',   label: 'Blueprint',   icon: '⊞' },
  { id: 'wireframe',   label: 'Wireframe',   icon: '◻' },
  { id: 'realistic',   label: 'Realistic',   icon: '◉' },
  { id: 'concept',     label: 'Concept Art', icon: '◈' },
]

interface DesignModeProps {
  initialPrompt?: string
  initialStyle?: string
}

export function DesignMode({ initialPrompt = '', initialStyle = 'holographic' }: DesignModeProps) {
  const [prompt, setPrompt]     = useState(initialPrompt)
  const [style, setStyle]       = useState(initialStyle)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [promptUsed, setPromptUsed] = useState('')
  const [isGenerating3D, setIsGenerating3D] = useState(false)
  const [engineSelector, setEngineSelector] = useState('auto')
  const [runtimeEngine, setRuntimeEngine] = useState<string>('')

  const generate = async () => {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError(null)
    setImageUrl(null)

    try {
      const res = await fetch('/api/generate-image', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ prompt: prompt.trim(), style, engine: engineSelector }),
      })
      const data = await res.json()

      if (data.success) {
        setImageUrl(data.image_url)
        setPromptUsed(data.prompt_used)
        setRuntimeEngine(data.engine || 'ai')
      } else {
        setError(data.error || 'Generation failed.')
      }
    } catch (e) {
      setError('Network error — check backend connection.')
    } finally {
      setLoading(false)
    }
  }

  const generate3D = async () => {
    if (!imageUrl || isGenerating3D) return
    setIsGenerating3D(true)
    setError(null)
    setRuntimeEngine('stability')
    try {
      const res = await fetch('/api/generate-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl }),
      })
      const data = await res.json()
      if (data.model_url) {
        // Dispatch event so App.tsx can switch mode to Home and load the model
        window.dispatchEvent(new CustomEvent('jarvis-3d-generated', { detail: { url: data.model_url } }))
      } else {
        setError(data.detail || '3D generation failed.')
      }
    } catch (e) {
      setError('3D Network error. Task might still be running.')
    } finally {
      setIsGenerating3D(false)
      setRuntimeEngine(imageUrl.includes('pollinations') ? 'pollinations' : 'gemini') // revert engine display
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate() }
  }

  const download = () => {
    if (!imageUrl) return
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = `holomat-design-${Date.now()}.png`
    a.click()
  }

  return (
    <div className="design-mode">
      {/* ── Controls Header ── */}
      <div className="design-controls">
        <div className="design-style-bar">
          <span className="design-label">STYLE</span>
          <div className="style-list">
            {STYLES.map(s => (
              <button
                key={s.id}
                className={`design-style-btn${style === s.id ? ' active' : ''}`}
                onClick={() => setStyle(s.id)}
              >
                <span>{s.icon}</span>{s.label}
              </button>
            ))}
          </div>
          
          <div className="design-engine-select">
             <span className="design-label">AI MODEL</span>
             <select value={engineSelector} onChange={e => setEngineSelector(e.target.value)}>
                <option value="auto">Automatic</option>
                <option value="gemini-3.1-flash">Gemini 3.1 Flash</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="pollinations-flux">Pollinations: Flux Core</option>
                <option value="pollinations-klein">Pollinations: Flux Klein</option>
                <option value="pollinations-gpt">Pollinations: GPT Image</option>
             </select>
          </div>
        </div>

        <div className="design-prompt-bar">
          <Sparkles size={14} className="design-prompt-icon" />
          <input
            className="design-prompt-input"
            placeholder="Describe what you want Gemini to create..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className={`design-generate-btn${loading ? ' loading' : ''}`}
            onClick={generate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? <Loader size={14} className="spin" /> : <Sparkles size={14} />}
            {loading ? 'RENDERING...' : 'GENERATE'}
          </button>
        </div>
      </div>

      {/* ── Canvas Area ── */}
      <div className="design-canvas">
        {loading || isGenerating3D ? (
          <div className="design-loading">
            <div className="design-loading-ring" />
            <p className="design-loading-text">{isGenerating3D ? 'BUILDING 3D MESH' : 'AI RENDERING'}</p>
            <p className="design-loading-sub">
              {runtimeEngine === 'pollinations' ? 'Using Pollinations.ai (Gemini unavailable)...' :
               runtimeEngine === 'stability' ? '~5s. Fast 3D Mesh Generation (Stability AI)...' : 'Generating via Gemini AI...'}
            </p>
          </div>
        ) : null}

        {(!loading && !isGenerating3D && imageUrl) && (
          <div className="design-result">
            <button className="design-action-btn-floating" onClick={generate3D} title="Extrude to 3D Model">
              <Box size={14} /> TO 3D
            </button>
            <img
              src={imageUrl}
              alt={promptUsed}
              className="design-image"
            />
            <div className="design-result-bar">
              <span className="design-result-info">
                <Image size={12} /> {style.toUpperCase()} ·{' '}
                {runtimeEngine.includes('gemini') || runtimeEngine.includes('imagen') ? '⚡ GOOGLE AI' : runtimeEngine.includes('pollinations') ? '🌐 POLLINATIONS.AI' : 'AI GENERATED'}
              </span>
              <div className="design-result-actions">
                <button className="design-action-btn" onClick={download} title="Download">
                  <Download size={13} /> SAVE
                </button>
                <button className="design-action-btn" onClick={() => { setImageUrl(null); setPrompt('') }} title="New">
                  <RotateCcw size={13} /> NEW
                </button>
              </div>
            </div>
          </div>
        )}

        {(!loading && !isGenerating3D && !imageUrl && !error) && (
          <div className="design-empty">
            <div className="design-empty-icon">
              <Sparkles size={32} />
            </div>
            <p className="design-empty-title">GEMINI DESIGN STUDIO</p>
            <p className="design-empty-sub">
              Describe an object, machine, or scene above.<br />
              Jarvis will route it directly to Gemini AI.
            </p>
            <div className="design-suggestions">
              {['Arc reactor blueprint', 'Robotic arm wireframe', 'Holographic Iron Man suit'].map(s => (
                <button key={s} className="design-suggestion" onClick={() => setPrompt(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="design-error">
            <p>⚠ {error}</p>
            <button className="design-action-btn" onClick={() => setError(null)}>DISMISS</button>
          </div>
        )}
      </div>
    </div>
  )
}
