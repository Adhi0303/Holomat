import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'

export function OpenCVFaceRecognition() {
  const [isDetecting, setIsDetecting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (file: File, action: 'detect' | 'recognize') => {
    setIsDetecting(true)
    
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const endpoint = action === 'detect' ? '/api/opencv/detect' : '/api/opencv/recognize'
      const response = await fetch(`/api${endpoint}`, {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      setResult(data)
      
    } catch (error) {
      console.error('OpenCV operation failed:', error)
      setResult({ success: false, message: 'Operation failed' })
    } finally {
      setIsDetecting(false)
    }
  }

  const handleTrainUser = async (userId: string, name: string, files: FileList) => {
    try {
      const formData = new FormData()
      
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i])
      }
      
      const response = await fetch(`/api/opencv/train/${userId}?name=${name}`, {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        loadUsers()
      }
      
    } catch (error) {
      console.error('Training failed:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/opencv/users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const triggerFileInput = (action: 'detect' | 'recognize') => {
    if (fileInputRef.current) {
      fileInputRef.current.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          handleImageUpload(file, action)
        }
      }
      fileInputRef.current.click()
    }
  }

  return (
    <div className="opencv-face-recognition">
      <div className="opencv-header">
        <h3>🔍 OpenCV Face Recognition</h3>
        <p>LBPH + Haar Cascade Implementation</p>
      </div>

      <div className="opencv-controls">
        <button 
          className="opencv-btn detect"
          onClick={() => triggerFileInput('detect')}
          disabled={isDetecting}
        >
          📷 Detect Faces
        </button>
        
        <button 
          className="opencv-btn recognize"
          onClick={() => triggerFileInput('recognize')}
          disabled={isDetecting}
        >
          👤 Recognize Face
        </button>
        
        <button 
          className="opencv-btn users"
          onClick={loadUsers}
        >
          👥 Load Users
        </button>
      </div>

      {isDetecting && (
        <motion.div 
          className="opencv-loading"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          ⚙️ Processing...
        </motion.div>
      )}

      {result && (
        <div className={`opencv-result ${result.success ? 'success' : 'error'}`}>
          <h4>Result:</h4>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {users.length > 0 && (
        <div className="opencv-users">
          <h4>Trained Users ({users.length}):</h4>
          {users.map(user => (
            <div key={user.id} className="user-item">
              <span>{user.name}</span>
              <span className={`status ${user.trained ? 'trained' : 'not-trained'}`}>
                {user.trained ? '✅ Trained' : '❌ Not Trained'}
              </span>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
      />

      <div className="opencv-info">
        <h4>How to use:</h4>
        <ol>
          <li><strong>Detect Faces:</strong> Upload image to detect faces using Haar Cascade</li>
          <li><strong>Train User:</strong> Use API to train LBPH with multiple face images</li>
          <li><strong>Recognize:</strong> Upload image to recognize trained faces</li>
        </ol>
        
        <div className="api-example">
          <h5>Training API Example:</h5>
          <code>
            POST /api/opencv/train/user_1?name=John<br/>
            Body: FormData with multiple 'images' files
          </code>
        </div>
      </div>
    </div>
  )
}