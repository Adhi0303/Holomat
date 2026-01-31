"""
HoloMat Backend API Server
FastAPI server with REST endpoints and WebSocket for real-time communication.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import json
import random
from datetime import datetime
from typing import List

from api.routes import router
from api.websocket import ConnectionManager

# WebSocket connection manager
manager = ConnectionManager()

# Background task for broadcasting sensor updates
async def broadcast_sensor_updates():
    """Broadcast mock sensor data every second"""
    while True:
        await asyncio.sleep(1)
        if manager.active_connections:
            sensor_data = {
                "type": "sensor_update",
                "data": {
                    "cpu": random.randint(30, 70),
                    "ram": random.randint(40, 80),
                    "temp": random.randint(45, 65),
                    "motion": random.choice([True, False, False, False]),  # 25% chance
                    "light": random.randint(30, 100),
                    "timestamp": datetime.now().isoformat()
                }
            }
            await manager.broadcast(json.dumps(sensor_data))

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Start background task
    task = asyncio.create_task(broadcast_sensor_updates())
    print("🚀 HoloMat Backend Started")
    print("📡 WebSocket ready at ws://localhost:8000/ws")
    yield
    # Cleanup
    task.cancel()
    print("👋 HoloMat Backend Stopped")

# Create FastAPI app
app = FastAPI(
    title="HoloMat API",
    description="Backend API for the Iron Man IoT Workstation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST routes
app.include_router(router, prefix="/api")

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "message": "Welcome to HoloMat, sir."
        })
        
        while True:
            # Receive messages from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "gesture":
                # Broadcast gesture to all clients
                await manager.broadcast(json.dumps({
                    "type": "gesture",
                    "gesture": message.get("gesture")
                }))
            elif message.get("type") == "command":
                # Handle Jarvis command
                await manager.broadcast(json.dumps({
                    "type": "jarvis_response",
                    "command": message.get("command"),
                    "response": f"Acknowledged: {message.get('command')}"
                }))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Health check
@app.get("/")
async def root():
    return {
        "status": "online",
        "name": "HoloMat Backend",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
