# OpenCV Face Recognition Setup

## Installation Steps

### 1. Install OpenCV Dependencies
```bash
cd holomat-backend
pip install -r requirements_opencv.txt
```

### 2. Verify OpenCV Installation
```python
import cv2
print(cv2.__version__)  # Should show 4.8.1 or higher
```

### 3. Test Haar Cascade
```python
import cv2
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
print(face_cascade.empty())  # Should be False
```

## API Endpoints

### Face Detection
```bash
POST /api/opencv/detect
Content-Type: multipart/form-data
Body: image file

Response:
{
  "faces_detected": 1,
  "faces": [{"x": 100, "y": 50, "width": 150, "height": 150}],
  "message": "Detected 1 face(s)"
}
```

### Face Recognition
```bash
POST /api/opencv/recognize
Content-Type: multipart/form-data
Body: image file

Response:
{
  "success": true,
  "user_id": "user_1",
  "confidence": 85.5,
  "message": "Recognized: John Doe"
}
```

### Train User Face
```bash
POST /api/opencv/train/user_1?name=John Doe
Content-Type: multipart/form-data
Body: multiple image files (key: "images")

Response:
{
  "success": true,
  "message": "Trained 5 faces for John Doe",
  "user_id": "user_1"
}
```

### Get Users
```bash
GET /api/opencv/users

Response:
{
  "users": [
    {"id": "user_1", "name": "John Doe", "trained": true}
  ],
  "total": 1
}
```

## How It Works

### 1. Face Detection (Haar Cascade)
- Uses OpenCV's pre-trained Haar Cascade classifier
- Detects faces in uploaded images
- Returns bounding box coordinates
- Fast and reliable for frontal faces

### 2. Face Recognition (LBPH)
- Local Binary Pattern Histogram algorithm
- Trains on multiple face images per user
- Creates unique face signatures
- Returns confidence score (lower = better match)

### 3. Training Process
1. Upload multiple images of a person (5-10 recommended)
2. System detects faces in each image
3. Extracts and normalizes face regions (200x200px)
4. Trains LBPH model with all user faces
5. Saves model to `face_model.yml`

### 4. Recognition Process
1. Upload image for recognition
2. Detect face using Haar Cascade
3. Extract face region
4. Compare against trained LBPH model
5. Return user ID and confidence score

## File Structure
```
holomat-backend/
├── face_data/           # User face images
│   ├── user_1/
│   │   ├── face_0.jpg
│   │   └── face_1.jpg
│   └── user_2/
├── face_model.yml       # Trained LBPH model
└── api/
    └── opencv_face.py   # OpenCV API
```

## Integration with HoloMat

### Add to Scan Mode
Replace mock face scanning with real OpenCV detection:

```typescript
// In ScanMode component
const handleRealFaceScan = async () => {
  // Capture from camera or upload image
  const formData = new FormData()
  formData.append('image', imageFile)
  
  const response = await fetch('/api/opencv/recognize', {
    method: 'POST',
    body: formData
  })
  
  const result = await response.json()
  // Handle recognition result
}
```

## Performance Notes

- **Detection Speed**: ~50-100ms per image
- **Recognition Speed**: ~10-30ms per face
- **Training Time**: ~1-5 seconds for 10 images
- **Memory Usage**: ~50MB for model + images
- **Accuracy**: 85-95% with good training data

## Troubleshooting

### Common Issues:
1. **Import Error**: Install opencv-contrib-python
2. **Cascade Not Found**: Check cv2.data.haarcascades path
3. **No Faces Detected**: Ensure good lighting and frontal view
4. **Low Recognition Accuracy**: Add more training images

### Optimization Tips:
1. Use 5-10 training images per person
2. Vary lighting conditions in training images
3. Include different facial expressions
4. Ensure faces are clearly visible and frontal
5. Resize images to reasonable size (max 1024px) before upload