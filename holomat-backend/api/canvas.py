"""
canvas.py - AI-powered canvas drawing to image generation
Uses Gemini Vision to understand sketches and generate detailed images
"""
import os
import base64
import httpx
from urllib.parse import quote
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
POLLINATIONS_API = "https://image.pollinations.ai/prompt"

class CanvasRequest(BaseModel):
    image: str  # base64 encoded image data

def extract_base64_data(data_url: str) -> bytes:
    """Extract base64 image data from data URL"""
    if ',' in data_url:
        return base64.b64decode(data_url.split(',')[1])
    return base64.b64decode(data_url)

async def analyze_sketch_with_gemini(image_bytes: bytes) -> str:
    """
    Use Gemini 2.0 Flash Vision to analyze the sketch and generate a detailed prompt
    """
    if not GEMINI_API_KEY:
        print("[CANVAS] No Gemini API key - using fallback prompt")
        return "futuristic holographic device with glowing blue circuits"
    
    try:
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # gemini-2.0-flash: stable, fast, multimodal model
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
        
        prompt = """Analyze this hand-drawn sketch carefully. 

Your task:
1. Identify what object, device, or concept the user is trying to draw
2. Describe it in detail as if you're creating a prompt for an AI image generator
3. Add technical and visual details to make it look futuristic and holographic
4. Keep the description under 100 words

Format: Just return the detailed description, nothing else.

Example output: "A futuristic arc reactor with glowing blue energy core, intricate metallic rings, holographic interface panels, neon cyan circuits, Tony Stark technology, highly detailed, 8K render, cinematic lighting"
"""
        
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/png",
                            "data": image_b64
                        }
                    }
                ]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 200,
            }
        }
        
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            
            if "candidates" in data and len(data["candidates"]) > 0:
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                print(f"[GEMINI] Sketch analyzed: {text.strip()[:80]}...")
                return text.strip()
            
            print("[GEMINI] No candidates in response, using fallback")
            return "futuristic holographic device with glowing circuits"
            
    except Exception as e:
        print(f"[GEMINI ERROR] {e}")
        return "futuristic holographic device with glowing blue neon circuits, sci-fi, ultra detailed"

async def generate_image_from_prompt(prompt: str) -> str:
    """
    Generate image using Pollinations AI (free, no API key needed).
    Downloads the image and returns a base64 data URL to avoid frontend CORS issues.
    """
    enhanced_prompt = f"{prompt}, futuristic holographic style, neon blue glow, high detail, 8K render, cinematic lighting, sci-fi technology"
    image_url = f"{POLLINATIONS_API}/{quote(enhanced_prompt)}"
    print(f"[CANVAS] Requesting image from Pollinations...")

    try:
        async with httpx.AsyncClient(timeout=90, follow_redirects=True) as client:
            response = await client.get(image_url)
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "image/jpeg")
            # Strip charset or extra params from content type
            content_type = content_type.split(";")[0].strip()
            
            image_data = base64.b64encode(response.content).decode("utf-8")
            data_url = f"data:{content_type};base64,{image_data}"
            
            print(f"[CANVAS] Image downloaded: {len(response.content)} bytes, type: {content_type}")
            return data_url
        
    except Exception as e:
        print(f"[IMAGE GEN ERROR] {e}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

@router.post("/canvas/generate")
async def generate_from_canvas(request: CanvasRequest):
    """
    Main endpoint: Receives canvas drawing, analyzes with Gemini 2.0 Flash, generates image

    Flow:
    1. Receive base64 canvas image
    2. Send to Gemini 2.0 Flash Vision for sketch analysis
    3. Get detailed prompt from Gemini
    4. Generate image using Pollinations AI (downloaded and proxied as base64)
    5. Return base64 data URL
    """
    try:
        print("[CANVAS] Received drawing, analyzing with AI...")
        
        image_bytes = extract_base64_data(request.image)
        
        print("[CANVAS] Analyzing sketch with Gemini 2.0 Flash Vision...")
        detailed_prompt = await analyze_sketch_with_gemini(image_bytes)
        print(f"[CANVAS] Gemini analysis complete: {detailed_prompt[:60]}...")
        
        print("[CANVAS] Generating image from Pollinations AI...")
        image_data_url = await generate_image_from_prompt(detailed_prompt)
        print("[CANVAS] Image ready, returning to frontend")
        
        return {
            "success": True,
            "image_url": image_data_url,
            "prompt": detailed_prompt,
            "message": "Image generated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[CANVAS ERROR] {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to generate image"
        }

@router.get("/canvas/test")
def test_canvas_api():
    """Test endpoint to verify API is working"""
    return {
        "status": "Canvas API operational",
        "gemini_configured": bool(GEMINI_API_KEY),
        "model": "gemini-2.0-flash",
        "image_delivery": "base64 data URL (CORS-safe)",
        "features": [
            "Sketch analysis with Gemini 2.0 Flash Vision",
            "AI image generation via Pollinations",
            "Holographic style rendering",
            "Proxied image delivery (no CORS)"
        ]
    }
