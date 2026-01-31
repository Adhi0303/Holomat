"""
REST API Routes
All REST endpoints for the HoloMat API.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import random

router = APIRouter()

# ----- Pydantic Models -----

class SystemStatus(BaseModel):
    status: str
    uptime: str
    cpu: int
    ram: int
    temp: int
    timestamp: str

class SensorData(BaseModel):
    motion: bool
    light: int
    gesture: Optional[str] = None
    distance_left: float
    distance_center: float
    distance_right: float

class UserInfo(BaseModel):
    name: str
    authenticated: bool
    avatar: Optional[str] = None

class HologramModel(BaseModel):
    model: str

class JarvisCommand(BaseModel):
    command: str

# ----- Mock Data -----

current_user = {
    "name": "Suriya",
    "authenticated": True,
    "avatar": None
}

current_model = "cube"

# ----- Endpoints -----

@router.get("/status", response_model=SystemStatus)
async def get_status():
    """Get system status and health"""
    return {
        "status": "online",
        "uptime": "2h 34m",
        "cpu": random.randint(30, 70),
        "ram": random.randint(40, 80),
        "temp": random.randint(45, 65),
        "timestamp": datetime.now().isoformat()
    }

@router.get("/sensors", response_model=SensorData)
async def get_sensors():
    """Get current sensor readings"""
    return {
        "motion": random.choice([True, False]),
        "light": random.randint(30, 100),
        "gesture": None,
        "distance_left": round(random.uniform(10, 100), 2),
        "distance_center": round(random.uniform(10, 100), 2),
        "distance_right": round(random.uniform(10, 100), 2)
    }

@router.get("/user", response_model=UserInfo)
async def get_user():
    """Get current authenticated user"""
    return current_user

@router.post("/hologram/model")
async def change_model(data: HologramModel):
    """Change the 3D hologram model"""
    global current_model
    valid_models = ["cube", "sphere", "torus", "reactor", "custom"]
    
    if data.model not in valid_models:
        raise HTTPException(status_code=400, detail=f"Invalid model. Choose from: {valid_models}")
    
    current_model = data.model
    return {
        "success": True,
        "model": current_model,
        "message": f"Model changed to {current_model}"
    }

@router.get("/hologram/model")
async def get_current_model():
    """Get current hologram model"""
    return {"model": current_model}

@router.post("/jarvis/command")
async def jarvis_command(data: JarvisCommand):
    """Send command to Jarvis"""
    command = data.command.lower()
    
    # Simple command parsing
    responses = {
        "time": f"The current time is {datetime.now().strftime('%I:%M %p')}, sir.",
        "date": f"Today is {datetime.now().strftime('%A, %B %d, %Y')}, sir.",
        "status": "All systems nominal, sir. CPU and memory within normal parameters.",
        "hello": "Good day, sir. How may I assist you?",
        "help": "I can help you with: time, date, status, changing models, and more."
    }
    
    # Check for matching command
    for key, response in responses.items():
        if key in command:
            return {"command": command, "response": response}
    
    # Default response
    return {
        "command": command,
        "response": f"I've noted your request: '{data.command}'. Processing, sir."
    }

@router.get("/gestures")
async def get_gesture_info():
    """Get available gestures"""
    return {
        "gestures": [
            {"name": "swipe_left", "action": "Navigate to previous"},
            {"name": "swipe_right", "action": "Navigate to next"},
            {"name": "push", "action": "Select/Confirm"},
            {"name": "pull", "action": "Back/Cancel"},
            {"name": "hover", "action": "Highlight"}
        ]
    }
