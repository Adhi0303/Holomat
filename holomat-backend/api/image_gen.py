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
    prompt: str
    style: str = "holographic"


class ImageGenResponse(BaseModel):
    success: bool
    image_url: str = ""
    prompt_used: str = ""
    engine: str = ""
    error: str = ""


# ─── Engine 1: Gemini ────────────────────────────────────────────────────────

async def _try_gemini(full_prompt: str) -> bytes | None:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model="gemini-3.1-flash-image-preview",
        contents=full_prompt,
        config=types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"]
        )
    )
    for part in response.candidates[0].content.parts:
        if part.inline_data and part.inline_data.mime_type.startswith("image/"):
            return base64.b64decode(part.inline_data.data)
    return None


# ─── Engine 2: Pollinations.ai ───────────────────────────────────────────────

def _pollinations_url(full_prompt: str) -> str:
    import urllib.parse
    encoded = urllib.parse.quote(full_prompt)
    seed    = uuid.uuid4().int % 999999
    url = (
        f"https://gen.pollinations.ai/image/{encoded}"
        f"?width=768&height=768&model=flux&seed={seed}&nologo=true"
    )
    if POLLINATIONS_TOKEN:
        url += f"&key={POLLINATIONS_TOKEN}"  # API requires ?key= not ?token=
    return url


# ─── Main Endpoint ───────────────────────────────────────────────────────────

@router.post("/generate-image", response_model=ImageGenResponse)
async def generate_image(req: ImageGenRequest):
    if not req.prompt.strip():
        return ImageGenResponse(success=False, error="Prompt cannot be empty.")

    style_suffix = STYLE_PROMPTS.get(req.style, STYLE_PROMPTS["holographic"])
    full_prompt  = f"{req.prompt}, {style_suffix}"

    # ── Try Gemini first ──
    if GEMINI_API_KEY:
        try:
            img_bytes = await _try_gemini(full_prompt)
            if img_bytes:
                filename = f"{uuid.uuid4().hex}.png"
                (STATIC_DIR / filename).write_bytes(img_bytes)
                return ImageGenResponse(
                    success=True,
                    image_url=f"/static/generated/{filename}",
                    prompt_used=full_prompt,
                    engine="gemini"
                )
        except Exception as e:
            print(f"[ImageGen] Gemini failed → {str(e)[:100]}")

    # ── Fallback: Pollinations.ai ──
    if POLLINATIONS_TOKEN:
        # Authenticated — return URL directly (browser loads image)
        poll_url = _pollinations_url(full_prompt)
        return ImageGenResponse(
            success=True,
            image_url=poll_url,
            prompt_used=full_prompt,
            engine="pollinations"
        )

    # ── Both unavailable ──
    return ImageGenResponse(
        success=False,
        error=(
            "Gemini quota exhausted for today. "
            "To enable a fallback: get a FREE token at https://enter.pollinations.ai "
            "and add POLLINATIONS_TOKEN=your_token to holomat-backend/.env"
        )
    )


@router.get("/generate-image/styles")
def get_styles():
    return {"styles": list(STYLE_PROMPTS.keys())}
