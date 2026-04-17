"""
Quick API Test Script for Image & 3D Pipeline
Run this to verify backend is working correctly
"""
import requests
import json
import time

BASE_URL = "http://localhost:8001"

def test_image_generation():
    print("\n🎨 Testing Image Generation API...")
    print("-" * 50)
    
    payload = {
        "prompt": "futuristic holographic cube",
        "style": "holographic"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/generate-image",
            json=payload,
            timeout=120
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Image generation SUCCESS")
            print(f"   Image URL: {data['image_url']}")
            print(f"   Engine: {data['engine']}")
            print(f"   Prompt: {data['prompt_used'][:80]}...")
            return data['image_url']
        else:
            print(f"❌ Failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None

def test_3d_generation(image_url):
    if not image_url:
        print("\n⚠️  Skipping 3D test (no image URL)")
        return
    
    print("\n🎯 Testing 3D Model Generation API...")
    print("-" * 50)
    
    payload = {
        "image_url": image_url
    }
    
    try:
        print("   Submitting task (this may take 30-90 seconds)...")
        response = requests.post(
            f"{BASE_URL}/api/generate-3d",
            json=payload,
            timeout=300  # 5 minutes max
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 3D generation SUCCESS")
            print(f"   Model URL: {data['model_url']}")
            print(f"   Task ID: {data['task_id']}")
            return data['model_url']
        else:
            print(f"❌ Failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return None

def test_health():
    print("\n🏥 Testing Backend Health...")
    print("-" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Backend returned {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend not reachable: {e}")
        return False

def main():
    print("=" * 50)
    print("🧪 HoloMat API Test Suite")
    print("=" * 50)
    
    # Test 1: Health check
    if not test_health():
        print("\n⚠️  Backend is not running!")
        print("   Start it with: cd holomat-backend && uvicorn main:app --reload --port 8001")
        return
    
    # Test 2: Image generation
    image_url = test_image_generation()
    
    # Test 3: 3D generation (only if image succeeded)
    if image_url:
        time.sleep(2)  # Brief pause
        test_3d_generation(image_url)
    
    print("\n" + "=" * 50)
    print("✅ Testing Complete!")
    print("=" * 50)

if __name__ == "__main__":
    main()
