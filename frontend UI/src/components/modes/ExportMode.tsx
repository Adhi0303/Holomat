import { useState } from 'react'
import { motion } from 'framer-motion'

export function ExportMode() {
  const [exportFormat, setExportFormat] = useState('json')
  const [exportData, setExportData] = useState({
    sensorData: true,
    systemLogs: true,
    userProfiles: false,
    measurements: true,
    settings: false
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportHistory, setExportHistory] = useState<any[]>([])

  const formats = [
    { id: 'json', label: 'JSON', icon: '📄' },
    { id: 'csv', label: 'CSV', icon: '📊' },
    { id: 'xml', label: 'XML', icon: '📋' },
    { id: 'pdf', label: 'PDF', icon: '📑' }
  ]

  const startExport = async () => {
    setIsExporting(true)
    
    try {
      // Get selected data types
      const selectedDataTypes = Object.entries(exportData)
        .filter(([_, enabled]) => enabled)
        .map(([key, _]) => key)
      
      // Call backend export API
      const response = await fetch('/api/sensors/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: exportFormat,
          data_types: selectedDataTypes
        })
      })
      
      const result = await response.json()
      
      // Create export record with download function
      const exportRecord = {
        id: Date.now(),
        format: exportFormat,
        timestamp: new Date().toLocaleTimeString(),
        size: result.size,
        items: selectedDataTypes.length,
        fileContent: result.file_content,
        downloadUrl: result.download_url
      }
      
      setExportHistory(prev => [exportRecord, ...prev.slice(0, 4)])
      setIsExporting(false)
      
    } catch (error) {
      console.error('Export failed:', error)
      setIsExporting(false)
    }
  }

  const downloadFile = (record: any) => {
    // Create blob from file content
    const blob = new Blob([record.fileContent], {
      type: getContentType(record.format)
    })
    
    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `holomat_export_${record.timestamp.replace(/:/g, '-')}.${record.format}`
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    window.URL.revokeObjectURL(url)
  }
  
  const getContentType = (format: string) => {
    switch (format) {
      case 'json': return 'application/json'
      case 'csv': return 'text/csv'
      case 'xml': return 'application/xml'
      case 'pdf': return 'text/plain'
      default: return 'text/plain'
    }
  }

  const toggleDataType = (key: string) => {
    setExportData(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
  }

  return (
    <div className="mode-panel export-mode">
      <div className="mode-header">
        <h3>📤 DATA EXPORT</h3>
        <div className="export-status">
          {isExporting ? 'EXPORTING...' : 'READY'}
        </div>
      </div>

      <div className="export-formats">
        <h4>Export Format</h4>
        <div className="format-grid">
          {formats.map(format => (
            <button
              key={format.id}
              className={`format-btn ${exportFormat === format.id ? 'active' : ''}`}
              onClick={() => setExportFormat(format.id)}
            >
              <span className="format-icon">{format.icon}</span>
              <span className="format-label">{format.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="export-data">
        <h4>Data Selection</h4>
        <div className="data-options">
          {Object.entries(exportData).map(([key, enabled]) => (
            <div key={key} className="data-option">
              <button
                className={`checkbox ${enabled ? 'checked' : ''}`}
                onClick={() => toggleDataType(key)}
              >
                {enabled ? '✓' : ''}
              </button>
              <label>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="export-preview">
        <h4>Export Preview</h4>
        <div className="preview-info">
          <div className="preview-item">
            <span>FORMAT:</span> {exportFormat.toUpperCase()}
          </div>
          <div className="preview-item">
            <span>ITEMS:</span> {Object.values(exportData).filter(Boolean).length}
          </div>
          <div className="preview-item">
            <span>EST. SIZE:</span> ~{Math.floor(Math.random() * 300 + 50)}KB
          </div>
        </div>
      </div>

      <div className="export-controls">
        <button 
          className={`export-btn ${isExporting ? 'loading' : ''}`}
          onClick={startExport}
          disabled={isExporting || Object.values(exportData).every(v => !v)}
        >
          {isExporting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              ⚙️
            </motion.div>
          ) : (
            'START EXPORT'
          )}
        </button>
      </div>

      {exportHistory.length > 0 && (
        <div className="export-history">
          <h4>Recent Exports</h4>
          {exportHistory.map(record => (
            <div key={record.id} className="history-item">
              <div className="history-info">
                <span className="history-format">{record.format.toUpperCase()}</span>
                <span className="history-time">{record.timestamp}</span>
              </div>
              <div className="history-details">
                <span>{record.items} items • {record.size}</span>
                <button 
                  className="download-btn"
                  onClick={() => downloadFile(record)}
                  title="Download file"
                >
                  📥
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}