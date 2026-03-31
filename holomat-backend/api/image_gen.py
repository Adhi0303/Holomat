"""
image_gen.py — Dual-Engine Image Generation
Primary:  Gemini 3.1 Flash Image (when quota available)
Fallback: Pollinations.ai (free API key from enter.pollinations.ai)

To enable Pollinations fallback, add to .env:
  POLLINATIONS_TOKEN=your_token_here
Get a free token at: https://enter.pollinations.ai
"""
import os
import base64
import uuid
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

GEMINI_API_KEY    = os.getenv("GEMINI_API_KEY", "")
POLLINATIONS_TOKEN = os.getenv("POLLINATIONS_TOKEN", "")  # Optional — free at enter.pollinations.ai

STATIC_DIR = Path(__file__).resolve().parent.parent / "static" / "generated"
STATIC_DIR.mkdir(parents=True, exist_ok=True)

# Base instruction requested by user for 3D model generation
BASE_INSTRUCTION = (
    "Generate a 1:1 scale 3D model of the key subject only, ignoring all background elements. "
    "Preserve original design/proportions, orient to most informative front-facing view. "
    "Render with advanced PBR materials, ray-traced global illumination, "
    "and sharp volumetric shadows to showcase maximum depth and realism. "
    "Isolate the final render on a plain black background."
)

STYLE_PROMPTS = {
    "realistic":    f"{BASE_INSTRUCTION} photorealistic, highly detailed, studio lighting, 8K",
    "blueprint":    f"{BASE_INSTRUCTION} technical blueprint, white lines, engineering schematic",
    "wireframe":    f"{BASE_INSTRUCTION} 3D wireframe mesh, glowing cyan edges, holographic",
    "concept":      f"{BASE_INSTRUCTION} concept art, digital painting, sci-fi aesthetic",
    "holographic":  f"{BASE_INSTRUCTION} holographic projection, neon cyan glow, Iron Man HUD style",
}


class ImageGenRequest(BaseModel):
    prompt: str = ""
    style: str = "holographic"
    base64_image: str | None = None
    engine: str = "auto"


class ImageGenResponse(BaseModel):
    success: bool
    image_url: str = ""
    prompt_used: str = ""
    engine: str = ""
    error: str = ""


# ─── Engine 1: Gemini ────────────────────────────────────────────────────────

async def _try_gemini(full_prompt: str, model_name: str = "models/gemini-3.1-flash-image-preview") -> bytes | None:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model=model_name,
        contents=full_prompt,
        config=types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"]
        )
    )
    for part in response.candidates[0].content.parts:
        if part.inline_data and part.inline_data.mime_type.startswith("image/"):
            return base64.b64decode(part.inline_data.data)
    return None


async def _try_gemini_vision(base64_image: str) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=GEMINI_API_KEY)
    
    # Strip data:image/...;base64,
    if "," in base64_image:
        base64_image = base64_image.split(",", 1)[1]
    image_bytes = base64.b64decode(base64_image)

    prompt = (
        "Describe the single primary physical object in this image in extreme, accurate detail. "
        "Include its material, colors, shape, and defining features. "
        "Ignore the background entirely. Return ONLY the description."
    )
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            prompt,
            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg",)
        ]
    )
    return response.text.strip()


# ─── Engine 2: Pollinations.ai ───────────────────────────────────────────────

def _pollinations_url(full_prompt: str, model_name: str = "flux") -> str:
    import urllib.parse
    encoded = urllib.parse.quote(full_prompt)
    seed    = uuid.uuid4().int % 999999
    url = (
        f"https://image.pollinations.ai/prompt/{encoded}"
        f"?width=768&height=768&model={model_name}&seed={seed}&nologo=true"
    )
    if POLLINATIONS_TOKEN:
        url += f"&key={POLLINATIONS_TOKEN}"  # API requires ?key= not ?token=
    return url


# ─── Main Endpoint ───────────────────────────────────────────────────────────

@router.post("/generate-image", response_model=ImageGenResponse)
async def generate_image(req: ImageGenRequest):
    # If base64 image provided, extract vision description to use as prompt
    if req.base64_image and GEMINI_API_KEY:
        try:
            print("[ImageGen] Using Gemini Vision to describe webcam image...")
            vision_desc = await _try_gemini_vision(req.base64_image)
            print(f"[ImageGen] Vision Description: {vision_desc}")
            req.prompt = vision_desc  # Override empty prompt with vision description
        except Exception as e:
            print(f"[ImageGen] Vision processing failed → {e}")
            return ImageGenResponse(success=False, error="AI Vision processing failed.")

    if not req.prompt.strip():
        return ImageGenResponse(success=False, error="Prompt cannot be empty.")

    style_suffix = STYLE_PROMPTS.get(req.style, STYLE_PROMPTS["holographic"])
    full_prompt  = f"{req.prompt}, {style_suffix}"

    # ── Handle Explicit Engine Requirements ──
    if req.engine == "gemini-flash" and not GEMINI_API_KEY:
        return ImageGenResponse(success=False, error="Gemini API Key is missing.")
    if req.engine.startswith("pollinations") and not POLLINATIONS_TOKEN:
        return ImageGenResponse(success=False, error="Pollinations TOKEN is missing.")

    # ── Engine 1: Gemini ──
    gemini_models = {
        "gemini-3.1-flash": "models/gemini-3.1-flash-image-preview",
        "gemini-2.5-flash": "models/gemini-2.5-flash-image"
    }

    if GEMINI_API_KEY and (req.engine in gemini_models or req.engine == "auto"):
        g_model = gemini_models.get(req.engine, "models/gemini-3.1-flash-image-preview")
        try:
            img_bytes = await _try_gemini(full_prompt, model_name=g_model)
            if img_bytes:
                filename = f"{uuid.uuid4().hex}.png"
                (STATIC_DIR / filename).write_bytes(img_bytes)
                return ImageGenResponse(
                    success=True,
                    image_url=f"/static/generated/{filename}",
                    prompt_used=full_prompt,
                    engine=req.engine if req.engine != "auto" else "gemini-flash"
                )
        except Exception as e:
            print(f"[ImageGen] Gemini failed → {str(e)[:100]}")
            if req.engine in gemini_models:
                return ImageGenResponse(success=False, error=f"Gemini Engine failed: {str(e)[:100]}")

    # ── Engine 2: Pollinations.ai ──
    pollination_models = {
        "pollinations-flux": "flux",
        "pollinations-klein": "flux-klein",
        "pollinations-gpt": "gpt-image"
    }
    
    if POLLINATIONS_TOKEN and (req.engine in pollination_models or req.engine == "auto"):
        # Authenticated — return URL directly (browser loads image)
        p_model = pollination_models.get(req.engine, "flux")
        poll_url = _pollinations_url(full_prompt, model_name=p_model)
        return ImageGenResponse(
            success=True,
            image_url=poll_url,
            prompt_used=full_prompt,
            engine=req.engine if req.engine != "auto" else "pollinations-flux"
        )

    # ── Both unavailable ──
    return ImageGenResponse(
        success=False,
        error=(
            "No valid generative models available. "
            "Gemini quota exhausted or Pollinations API unavailable."
        )
    )


@router.get("/generate-image/styles")
def get_styles():
    return {"styles": list(STYLE_PROMPTS.keys())}
