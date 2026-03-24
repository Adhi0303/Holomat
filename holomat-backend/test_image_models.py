"""Test which image models still have quota"""
import os
from dotenv import load_dotenv
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

from google import genai
from google.genai import types

client = genai.Client(api_key=GEMINI_API_KEY)

MODELS = [
    "gemini-3.1-flash-image-preview",
    "gemini-3-pro-image-preview",
    "gemini-2.5-flash-image",
]

for model in MODELS:
    try:
        print(f"\nTesting {model}...")
        response = client.models.generate_content(
            model=model,
            contents="a simple red circle on white background",
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"]
            )
        )
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                print(f"  ✅ SUCCESS! Got image ({len(part.inline_data.data)} bytes b64)")
                break
        else:
            print(f"  ⚠️  No image in response")
    except Exception as e:
        err = str(e)[:120]
        print(f"  ❌ {err}")
