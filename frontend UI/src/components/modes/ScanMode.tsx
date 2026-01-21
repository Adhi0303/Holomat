import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ScanModeProps {
  onScanComplete?: (result: any) => void
}

export function ScanMode({ onScanComplete }: ScanModeProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanResult, setScanResult] = useState<any>(null)

  const startScan = () => {
    setIsScanning(true)
    setScanProgress(0)
    setScanResult(null)

    // Simulate scanning process
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsScanning(false)
          const result = {
            faceDetected: true,
            user: 'Tony Stark',
            confidence: 98.5,
            timestamp: new Date().toISOString()
          }
          setScanResult(result)
          onScanComplete?.(result)
          return 100
        }
        return prev + 2
      })
    }, 50)
  }

  return (
    <div className="mode-panel scan-mode">
      <div className="mode-header">
        <h3>🔍 BIOMETRIC SCAN</h3>
        <div className="scan-status">
          {isScanning ? 'SCANNING...' : scanResult ? 'COMPLETE' : 'READY'}
        </div>
      </div>

      <div className="scan-area">
        <div className={`scan-frame ${isScanning ? 'active' : ''}`}>
          <div className="scan-corners">
            <div className="corner top-left"></div>
            <div className="corner top-right"></div>
            <div className="corner bottom-left"></div>
            <div className="corner bottom-right"></div>
          </div>
          
          {isScanning && (
            <motion.div 
              className="scan-line"
              animate={{ y: [0, 200, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>

        {isScanning && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${scanProgress}%` }}></div>
            <span className="progress-text">{scanProgress}%</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {scanResult && (
          <motion.div 
            className="scan-result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="result-item">
              <span>USER:</span> {scanResult.user}
            </div>
            <div className="result-item">
              <span>CONFIDENCE:</span> {scanResult.confidence}%
            </div>
            <div className="result-item">
              <span>STATUS:</span> AUTHENTICATED
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="scan-controls">
        <button 
          className="scan-btn"
          onClick={startScan}
          disabled={isScanning}
        >
          {isScanning ? 'SCANNING...' : 'START SCAN'}
        </button>
      </div>
    </div>
  )
}