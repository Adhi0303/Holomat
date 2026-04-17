"""
Quick integration test for the HuggingFace FLUX + Tripo3D pipeline.
"""
import sys
import asyncio
import httpx

# Force UTF-8 output on Windows to avoid CP1252 UnicodeEncodeError
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = "http://127.0.0.1:8001"


async def test_image_gen():
    print("\n" + "="*60)
    print("TEST 1: FLUX.1-dev Image Generation")
    print("="*60)

    payload = {"prompt": "a futuristic robot toy", "style": "realistic"}

    async with httpx.AsyncClient(timeout=120.0) as client:
        print(f">> POST {BASE}/api/generate-image ...")
        resp = await client.post(f"{BASE}/api/generate-image", json=payload)

    print(f"  Status: {resp.status_code}")
    data = resp.json()
    print(f"  Response: {data}")

    if resp.status_code == 200 and data.get("success"):
        image_url = data["image_url"]
        print(f"\n[OK] Image generated: {image_url}")
        print(f"     Engine: {data.get('engine')}")
        return image_url
    else:
        print(f"\n[FAIL] Image generation FAILED: {data.get('error', data)}")
        return None


async def test_3d_gen(image_url: str):
    print("\n" + "="*60)
    print("TEST 2: Tripo3D 3D Model Generation")
    print("="*60)

    payload = {"image_url": image_url}

    async with httpx.AsyncClient(timeout=300.0) as client:
        print(f">> POST {BASE}/api/generate-3d (may take 30-90s) ...")
        resp = await client.post(f"{BASE}/api/generate-3d", json=payload)

    print(f"  Status: {resp.status_code}")
    data = resp.json()
    print(f"  Response: {data}")

    if resp.status_code == 200 and data.get("success"):
        print(f"\n[OK] 3D Model generated: {data['model_url']}")
        print(f"     Task ID: {data.get('task_id')}")
    else:
        print(f"\n[FAIL] 3D generation FAILED: {data.get('detail', data)}")


async def main():
    image_url = await test_image_gen()
    if image_url:
        await test_3d_gen(image_url)
    print("\n" + "="*60)
    print("DONE")
    print("="*60)


asyncio.run(main())

