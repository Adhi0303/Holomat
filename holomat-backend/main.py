import sys
from pathlib import Path

# 🔴 IMPORTANT: Fix Python import path for uvicorn reload
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.sensors_enhanced import router as sensors_router
from api.system import router as system_router
from api.jarvis import router as jarvis_router
from api.websocket import ws_router
from api.testing import router as testing_router

app = FastAPI(title="HoloMat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensors_router, prefix="/api")
app.include_router(system_router, prefix="/api")
app.include_router(jarvis_router, prefix="/api")
app.include_router(testing_router, prefix="/api")
app.include_router(ws_router)

@app.get("/")
def root():
    return {"status": "HoloMat backend running"}
