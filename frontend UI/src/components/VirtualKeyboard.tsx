import { useState, useEffect } from 'react'
import './VirtualKeyboard.css'
import { X } from 'lucide-react'

interface VirtualKeyboardProps {
  inputValue: string
  setInputValue: (value: string) => void
  onSubmit: () => void
  onClose: () => void
  conversationHistory: Array<{ role: 'user' | 'jarvis', message: string }>
}

const keyboardLayout = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
]

export function VirtualKeyboard({ inputValue, setInputValue, onSubmit, onClose }: VirtualKeyboardProps) {
  const [shift, setShift] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const flash = (key: string) => {
    setActiveKey(key)
    setTimeout(() => setActiveKey(null), 150)
  }

  const handleKeyPress = (key: string) => {
    flash(key)
    const isUpper = shift || capsLock
    setInputValue(inputValue + (isUpper ? key.toUpperCase() : key.toLowerCase()))
    if (shift) setShift(false)
  }

  const handleBackspace = () => { flash('Backspace'); setInputValue(inputValue.slice(0, -1)) }
  const handleSpace    = () => { flash('Space');     setInputValue(inputValue + ' ')        }
  const handleEnter    = () => { flash('Enter');     onSubmit()                             }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      flash(e.key)
      if (e.key === 'Enter')          { e.preventDefault(); onSubmit() }
      else if (e.key === 'Backspace') { e.preventDefault(); setInputValue(inputValue.slice(0, -1)) }
      else if (e.key === ' ')         { e.preventDefault(); setInputValue(inputValue + ' ') }
      else if (e.key === 'Shift')     setShift(true)
      else if (e.key === 'CapsLock')  setCapsLock(c => !c)
      else if (e.key.length === 1) {
        e.preventDefault()
        const up = shift || capsLock || e.getModifierState('CapsLock')
        setInputValue(inputValue + (up ? e.key.toUpperCase() : e.key.toLowerCase()))
        if (shift) setShift(false)
      }
    }
    const up = (e: KeyboardEvent) => { if (e.key === 'Shift') setShift(false) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [inputValue, setInputValue, onSubmit, onClose, shift, capsLock])

  return (
    <div className="vkb-root">
      {/* Zone header bar */}
      <div className="zone-header">
        <span className="zone-dot" />
        <span>keyboard input</span>
        <button className="vkb-close-btn" onClick={onClose} title="Close keyboard">
          <X size={12} />
        </button>
      </div>

      {/* Current input display */}
      <div className="vkb-input-bar">
        <span className="vkb-input-text">{inputValue || 'Type your command...'}</span>
        <span className="vkb-cursor" />
      </div>

      {/* Key grid */}
      <div className="vkb-keys">
        {keyboardLayout.map((row, ri) => (
          <div key={ri} className="vkb-row">
            {row.map(key => (
              <button
                key={key}
                className={`vkb-key${activeKey === key || activeKey === key.toLowerCase() ? ' active' : ''}`}
                onClick={() => handleKeyPress(key)}
              >
                {shift || capsLock ? key : key.toLowerCase()}
              </button>
            ))}
          </div>
        ))}

        {/* Special keys row */}
        <div className="vkb-row vkb-row--bottom">
          <button className={`vkb-key vkb-key--special${shift ? ' active' : ''}`}    onClick={() => setShift(!shift)}>SHIFT</button>
          <button className={`vkb-key vkb-key--special${capsLock ? ' active' : ''}`} onClick={() => setCapsLock(!capsLock)}>CAPS</button>
          <button className={`vkb-key vkb-key--space${activeKey === 'Space' || activeKey === ' ' ? ' active' : ''}`} onClick={handleSpace}>SPACE</button>
          <button className={`vkb-key vkb-key--special${activeKey === 'Backspace' ? ' active' : ''}`} onClick={handleBackspace}>⌫</button>
          <button className={`vkb-key vkb-key--send${activeKey === 'Enter' ? ' active' : ''}`} onClick={handleEnter}>SEND ↵</button>
        </div>
      </div>

      <div className="vkb-hint">ESC to close · physical keyboard active</div>
    </div>
  )
}
