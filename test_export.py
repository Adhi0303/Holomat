#!/usr/bin/env python3
"""
Test Export Download Functionality
"""

import requests
import json

def test_export_download():
    base_url = "http://127.0.0.1:8000/api"
    
    print("🧪 Testing Export Download Functionality")
    print("="*50)
    
    # Test export creation
    export_data = {
        "format": "json",
        "data_types": ["sensorData", "measurements"]
    }
    
    try:
        print("1. Creating export...")
        response = requests.post(f"{base_url}/sensors/export", json=export_data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Export created: {result['export_id']}")
            print(f"📄 Format: {result['format']}")
            print(f"📊 Size: {result['size']}")
            print(f"🔗 Download URL: {result['download_url']}")
            
            # Test file download
            print("\n2. Testing download...")
            download_response = requests.get(f"http://127.0.0.1:8000{result['download_url']}")
            
            if download_response.status_code == 200:
                print("✅ Download successful!")
                print(f"📄 Content type: {download_response.headers.get('content-type')}")
                print(f"📁 Content length: {len(download_response.text)} bytes")
                print("\n📋 Sample content:")
                print(download_response.text[:200] + "..." if len(download_response.text) > 200 else download_response.text)
            else:
                print(f"❌ Download failed: {download_response.status_code}")
        else:
            print(f"❌ Export creation failed: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Server not running. Start with: uvicorn main:app --reload")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_export_download()