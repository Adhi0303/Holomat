# 🎨 Canvas Mode - AI-Powered Drawing to Image Generation

## Overview
Canvas Mode allows users to draw freehand sketches which are analyzed by Gemini Vision AI and converted into detailed images.

## Features
- Freehand drawing with pen tool
- Eraser, color picker, line width adjustment
- Double-tap or button for fullscreen
- AI-powered sketch-to-image generation
- Preview and download generated images

## How It Works
1. Draw on canvas
2. Click "SEND TO AI"
3. Gemini Vision analyzes sketch
4. Generates detailed prompt
5. Pollinations AI creates image
6. Display result

## API Endpoint
**POST** `/api/canvas/generate`

Request:
```json
{
  "image": "data:image/png;base64,..."
}
```

Response:
```json
{
  "success": true,
  "image_url": "https://...",
  "prompt": "detailed description"
}
```

## Prompt Engineering
Gemini analyzes sketch and creates detailed prompt with:
- Object identification
- Technical details
- Futuristic/holographic styling
- Visual enhancements

## Configuration
Set `GEMINI_API_KEY` in backend `.env` file
