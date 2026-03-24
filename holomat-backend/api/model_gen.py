"""
model_gen.py — 3D Model Generation via Tripo3D API
Uses Tripo3D's official Python SDK for image-to-model conversion.
Flow: Download image -> Format -> SDK upload_file -> SDK image_to_model -> Return GLB URL
"""
import os
import io
import httpx
import tempfile
from PIL import Image
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from loguru import logger
from tripo3d import TripoClient, TaskStatus

TRIPO_API_KEY = os.getenv("TRIPO_API_KEY", "").strip()

router = APIRouter()

class ModelRequest(BaseModel):
    image_url: str

@router.post("/generate-3d")
async def generate_3d_model(req: ModelRequest):
    if not TRIPO_API_KEY:
        raise HTTPException(status_code=500, detail="TRIPO_API_KEY not configured in .env")

    try:
        # 1. Download the image from URL
        logger.info(f"[3D Gen] Downloading image: {req.image_url}")
        async with httpx.AsyncClient() as http_client:
            img_res = await http_client.get(req.image_url, timeout=30.0)
            img_res.raise_for_status()
            
            # Convert any image format to pristine PNG using Pillow
            image = Image.open(io.BytesIO(img_res.content))
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            # Save to temp file for Tripo SDK
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                image.save(tmp, format="PNG")
                tmp_path = tmp.name

        try:
            logger.info("[3D Gen] Starting Tripo SDK workflow...")
            async with TripoClient(api_key=TRIPO_API_KEY) as client:
                # 2. Upload Image
                logger.info(f"[3D Gen] Uploading image {tmp_path}")
                file_info = await client.upload_file(tmp_path)
                if isinstance(file_info, dict):
                    image_token = file_info.get("image_token") or file_info.get("data", {}).get("image_token")
                else:
                    image_token = getattr(file_info, "image_token", str(file_info))
                
                # 3. Start task
                logger.info("[3D Gen] Starting image_to_model task...")
                task_id = await client.image_to_model(
                    file_token=image_token
                )
                logger.info(f"[3D Gen] Task started: {task_id}. Polling...")

                # 4. Wait for completion
                task = await client.wait_for_task(task_id, verbose=True)
                
                if task.status == TaskStatus.SUCCESS:
                    model_url = task.result.model.url
                    logger.info(f"[3D Gen] Complete! URL: {model_url}")
                    return {"model_url": model_url}
                else:
                    raise Exception(f"Tripo Task failed: {task.status}")
        finally:
            os.remove(tmp_path)

    except Exception as e:
        logger.error(f"[3D Gen] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
