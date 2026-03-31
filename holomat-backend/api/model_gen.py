"""
model_gen.py — 3D Model Generation via Stability AI (Stable Fast 3D)
Generates high-quality 3D assets from a single 2D input image in < 5 seconds.

Flow:
  1. Resolve image_url (relative → absolute, or use as-is)
  2. Download image bytes via httpx
  3. POST multipart/form-data to Stability AI v2beta/3d/stable-fast-3d
  4. Save response content directly to /static/models/
  5. Return local /static/models/model_{uuid}.glb
"""
import os
import uuid
import httpx
from pathlib import Path
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from loguru import logger

STABILITY_API_KEY = os.getenv("STABILITY_API_KEY", "").strip()
STABILITY_URL     = "https://api.stability.ai/v2beta/3d/stable-fast-3d"

# Local backend base URL — used to resolve relative image paths from the frontend
BACKEND_BASE  = os.getenv("BACKEND_BASE_URL", "http://127.0.0.1:8001")

# Where we save downloaded GLB files (served via /static)
BASE_DIR   = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "static" / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter()


class ModelRequest(BaseModel):
    image_url: str  # accepts relative (/static/...) or absolute (http://...)


def _abs_url(image_url: str) -> str:
    """Convert a relative URL to an absolute one using the backend base."""
    if image_url.startswith("http://") or image_url.startswith("https://"):
        return image_url
    # Relative path from frontend (e.g. /static/generated/abc.png)
    return f"{BACKEND_BASE}{image_url}"


@router.post("/generate-3d")
async def generate_3d_model(req: ModelRequest):
    if not STABILITY_API_KEY:
        raise HTTPException(status_code=500, detail="STABILITY_API_KEY not configured in .env")

    abs_image_url = _abs_url(req.image_url)

    try:
        # ── Step 1: Download image ──────────────────────────────────────────
        logger.info(f"[3D Gen] Downloading image: {abs_image_url}")
        async with httpx.AsyncClient(timeout=30.0) as http:
            resp = await http.get(abs_image_url)
            resp.raise_for_status()
            image_bytes = resp.content

        # ── Step 2: Send to Stability AI ─────────────────────────────────────
        logger.info("[3D Gen] Sending to Stability AI (Stable Fast 3D)...")
        
        headers = {
            "Authorization": f"Bearer {STABILITY_API_KEY}",
            # Optional: Add any app tracking headers if needed
            "stability-client-id": "holomat-ui",
            "stability-client-version": "1.0.0"
        }
        
        files = {
            "image": ("image.png", image_bytes, "image/png")
        }

        async with httpx.AsyncClient(timeout=60.0) as http:
            # We don't use typical request kwargs for files, httpx expects `files=...`
            stability_resp = await http.post(
                STABILITY_URL,
                headers=headers,
                files=files
            )

        if stability_resp.status_code != 200:
            error_msg = f"Stability AI error ({stability_resp.status_code}): {stability_resp.text}"
            logger.error(f"[3D Gen] {error_msg}")
            raise HTTPException(status_code=502, detail=error_msg)

        # ── Step 3: Save GLB ─────────────────────────────────────────────────
        task_id = uuid.uuid4().hex[:8]
        filename = f"model_sf3d_{task_id}.glb"
        local_path = MODELS_DIR / filename

        local_path.write_bytes(stability_resp.content)
        logger.info(f"[3D Gen] ✅ GLB saved → {local_path} ({len(stability_resp.content)} bytes)")

        return {"model_url": f"/static/models/{filename}"}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"[3D Gen] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
