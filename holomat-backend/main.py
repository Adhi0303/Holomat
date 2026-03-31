import sys
import io
from pathlib import Path

# Fix Windows UTF-8 encoding (prevents crash from emoji in logs)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# Load .env FIRST before any router imports that call os.getenv()
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from dotenv import load_dotenv
load_dotenv(BASE_DIR / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.sensors_enhanced import router as sensors_router
from api.system import router as system_router
from api.jarvis import router as jarvis_router
from api.websocket import ws_router
from api.testing import router as testing_router
from api.image_gen import router as image_gen_router
from api.model_gen import router as model_gen_router
from api.canvas import router as canvas_router

app = FastAPI(title="HoloMat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -- Serve generated images --
STATIC_DIR = BASE_DIR / "static"
STATIC_DIR.mkdir(exist_ok=True)
(STATIC_DIR / "generated").mkdir(exist_ok=True)
(STATIC_DIR / "models").mkdir(exist_ok=True)  # GLB model output directory
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

app.include_router(sensors_router, prefix="/api")
app.include_router(system_router, prefix="/api")
app.include_router(jarvis_router, prefix="/api")
app.include_router(testing_router, prefix="/api")
app.include_router(image_gen_router, prefix="/api")
app.include_router(model_gen_router, prefix="/api")
app.include_router(canvas_router, prefix="/api")
app.include_router(ws_router)

@app.get("/")
def root():
    return {"status": "HoloMat backend running"}
