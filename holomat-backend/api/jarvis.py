"""
jarvis.py — Intelligent command router: Groq (chat) vs Gemini (image)
@backend-specialist
"""
import os
import re
import random
import httpx
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# ── API Keys ──
GROQ_API_KEY    = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY", "")
GROQ_MODEL      = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

# ─────────────────────────────────────────────
# Intent Classifier: Does the user want an image?
# ─────────────────────────────────────────────
IMAGE_INTENT_KEYWORDS = [
    r"\bgenerate\b", r"\bcreate\b", r"\bdraw\b", r"\bdesign\b",
    r"\brender\b",   r"\bvisualize\b", r"\bsketch\b", r"\bshow\s+me\s+a\b",
    r"\bimage\b",    r"\bpicture\b",   r"\bphoto\b",  r"\billustrate\b",
    r"\bblueprin",   r"\bwireframe\b", r"\bhologram\b", r"\b3d\s+model\b",
]

STYLE_MAP = {
    "blueprint":   "blueprint",
    "wireframe":   "wireframe",
    "holographic": "holographic",
    "hologram":    "holographic",
    "realistic":   "realistic",
    "concept":     "concept",
}

def detect_image_intent(command: str) -> bool:
    cmd = command.lower()
    return any(re.search(kw, cmd) for kw in IMAGE_INTENT_KEYWORDS)

def detect_style(command: str) -> str:
    cmd = command.lower()
    for keyword, style in STYLE_MAP.items():
        if keyword in cmd:
            return style
    return "holographic"

def extract_subject(command: str) -> str:
    """Strip intent keywords to isolate the actual subject."""
    clean = re.sub(
        r"(?:please\s+)?(?:generate|create|draw|design|render|visualize|make|show\s+me)\s+(?:a\s+|an\s+)?",
        "", command, flags=re.IGNORECASE
    ).strip()
    return clean or command

# ─────────────────────────────────────────────
# Groq Chat (non-image queries)
# ─────────────────────────────────────────────
JARVIS_SYSTEM_PROMPT = """You are JARVIS, the AI from Tony Stark's Iron Man.
You are an advanced AI assistant integrated into the HoloMat holographic workstation.
Speak concisely, with confidence and a refined wit. Address the user as "sir" or by name.
Keep responses under 3 sentences. Never break character."""

async def call_groq(command: str) -> str:
    if not GROQ_API_KEY:
        return fallback_response(command)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": JARVIS_SYSTEM_PROMPT},
                        {"role": "user", "content": command}
                    ],
                    "max_tokens": 150,
                    "temperature": 0.7,
                }
            )
            data = r.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        return fallback_response(command)

def fallback_response(command: str) -> str:
    patterns = {
        r"hello|hi|hey":                 "Good day, sir. All systems are online and ready.",
        r"status|how are you|system":    "All systems are functioning within normal parameters, sir.",
        r"scan":                         "Biometric scan initiated. Please look at the camera, sir.",
        r"calibrate|reset":              "Initiating sensor calibration sequence. Please stand by.",
    }
    for pat, resp in patterns.items():
        if re.search(pat, command.lower()):
            return resp
    return random.choice([
        "Command acknowledged, sir.",
        "Processing your request.",
        "Understood, sir. Standing by.",
    ])

# ─────────────────────────────────────────────
# Mode-Switch Patterns (instant, no API call)
# ─────────────────────────────────────────────
MODE_PATTERNS = {
    r"(?:switch to|open|show|go to|activate)\s+(?:scan)":       ("scan",      "Switching to scan mode. Biometric scanner active."),
    r"(?:switch to|open|show|go to|activate)\s+(?:measure)":    ("measure",   "Activating measurement mode."),
    r"(?:switch to|open|show|go to|activate)\s+(?:analytics|data)": ("analytics","Opening analytics dashboard."),
    r"(?:switch to|open|show|go to|activate)\s+(?:settings?)":  ("settings",  "Accessing system settings panel."),
    r"(?:switch to|open|show|go to|activate)\s+(?:export)":     ("export",    "Opening export interface."),
    r"(?:switch to|open|show|go to|activate)\s+(?:home|dashboard)": ("home",  "Returning to home dashboard."),
    r"(?:switch to|open|show|go to|activate)\s+(?:design)":     ("design",    "Opening Design Studio. What shall I create for you, sir?"),
    r"(?:switch to|open|show|go to|activate)\s+(?:3d|model|hologram)": ("model","Activating 3D holographic display."),
}

def check_mode_switch(command: str):
    cmd = command.lower().strip()
    for pattern, (mode, response) in MODE_PATTERNS.items():
        if re.search(pattern, cmd):
            return mode, response
    return None, None

# ─────────────────────────────────────────────
# Main Command Handler
# ─────────────────────────────────────────────
class VoiceCommand(BaseModel):
    command: str
    transcript: str = ""
    confidence: float = 0.0

@router.post("/jarvis/command")
async def handle_command(payload: dict):
    command = payload.get("command", "").strip()
    if not command:
        return {"state": "idle", "response": "", "action": "", "success": True}

    # 1. Check instant mode switches first
    mode, mode_response = check_mode_switch(command)
    if mode:
        return {
            "state":       "speaking",
            "response":    mode_response,
            "action":      "switch_mode",
            "target_mode": mode,
            "success":     True,
        }

    # 2. Image generation intent?
    if detect_image_intent(command):
        subject = extract_subject(command)
        style   = detect_style(command)
        return {
            "state":    "generating",
            "response": f"Initiating Gemini image generation for '{subject}', sir. Rendering now...",
            "action":   "generate_image",
            "payload":  {"prompt": subject, "style": style},
            "success":  True,
        }

    # 3. Fall through to Groq chat
    response_text = await call_groq(command)
    return {
        "state":   "speaking",
        "response": response_text,
        "action":  "chat",
        "success": True,
    }

@router.post("/jarvis/speech-to-text")
def speech_to_text(audio_data: dict):
    return {"transcript": "switch to scan mode", "confidence": 0.95}

@router.get("/jarvis/commands")
def get_available_commands():
    return {
        "commands": [
            "Generate an arc reactor (→ Gemini image)",
            "Draw a robotic arm blueprint (→ Gemini image)",
            "Switch to scan / measure / analytics / design mode",
            "Show system status",
            "Hello Jarvis",
        ]
    }
