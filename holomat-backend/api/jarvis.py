from fastapi import APIRouter
from pydantic import BaseModel
import re
import random

router = APIRouter()

class VoiceCommand(BaseModel):
    command: str
    transcript: str = ""
    confidence: float = 0.0

class JarvisResponse(BaseModel):
    state: str
    response: str
    action: str = ""
    target_mode: str = ""
    success: bool = True

# Enhanced voice command patterns for mode switching
COMMAND_PATTERNS = {
    # Mode switching commands
    r"(?:switch to|go to|open|show me|activate)\s+(scan|scanning)\s*(?:mode)?": {
        "action": "switch_mode",
        "target": "scan",
        "response": "Switching to scan mode. Biometric scanner is now active."
    },
    r"(?:switch to|go to|open|show me|activate)\s+(measure|measurement)\s*(?:mode)?": {
        "action": "switch_mode",
        "target": "measure",
        "response": "Activating measurement mode. Sensor readings are now displayed."
    },
    r"(?:switch to|go to|open|show me|activate)\s+(analytics|data|charts?)\s*(?:mode)?": {
        "action": "switch_mode",
        "target": "analytics",
        "response": "Opening analytics dashboard. Data visualization is now active."
    },
    r"(?:switch to|go to|open|show me|activate)\s+(settings?)\s*(?:mode)?": {
        "action": "switch_mode",
        "target": "settings",
        "response": "Accessing system settings. Configuration panel is now open."
    },
    r"(?:switch to|go to|open|show me|activate)\s+(export)\s*(?:mode)?": {
        "action": "switch_mode",
        "target": "export",
        "response": "Opening export interface. Data export options are now available."
    },
    r"(?:switch to|go to|open|show me|activate)\s+(home|dashboard)\s*(?:mode)?": {
        "action": "switch_mode",
        "target": "home",
        "response": "Returning to home dashboard. System overview is now displayed."
    },
    r"(?:switch to|go to|open|show me|activate)\s+(?:3d\s*)?(?:model|hologram)\s*(?:mode)?": {
        "action": "switch_mode",
        "target": "model",
        "response": "Activating 3D model viewer. Holographic display is now ready."
    },
    r"(?:what is|show me|display)\s+(?:the\s+)?(?:system\s+)?status": {
        "action": "system_status",
        "response": "All systems operational. CPU at 78%, sensors active, network connected."
    },
    r"(?:hello|hi|hey)\s+jarvis": {
        "action": "greeting",
        "response": "Good day, Mr. Stark. How may I assist you today?"
    },
    r"(?:calibrate|reset)\s+(?:all\s+)?sensors?": {
        "action": "calibrate_sensors",
        "response": "Initiating sensor calibration sequence. Please wait 3 seconds."
    },
    r"(?:start|begin|initiate)\s+(?:face\s+)?scan": {
        "action": "start_scan",
        "response": "Biometric scan initiated. Please look at the camera."
    }
}

def process_voice_command(command: str) -> dict:
    """Process voice command and return appropriate response with actions"""
    command_lower = command.lower().strip()
    
    # Check for voice command patterns first
    for pattern, config in COMMAND_PATTERNS.items():
        if re.search(pattern, command_lower):
            return {
                "state": "speaking",
                "response": config["response"],
                "action": config.get("action", ""),
                "target_mode": config.get("target", ""),
                "success": True
            }
    
    # Fallback to original Jarvis personality responses
    response = parse_command(command)
    return {
        "state": "speaking",
        "response": response,
        "action": "general",
        "success": True
    }

# Jarvis personality responses
JARVIS_RESPONSES = {
    "greetings": [
        "Good morning, Mr. Stark. All systems are operational.",
        "Welcome back, sir. I've prepared your workstation.",
        "Hello, sir. How may I assist you today?",
        "Systems online. Ready for your command.",
    ],
    "system_status": [
        "All systems are functioning within normal parameters, sir.",
        "System diagnostics complete. Everything is in order.",
        "Monitoring systems show optimal performance, sir.",
    ],
    "cpu_high": [
        "CPU usage is elevated. Running diagnostics.",
        "Processing load is high, sir. Optimizing performance.",
    ],
    "temp_high": [
        "Temperature is rising. Monitoring closely.",
        "Thermal readings are elevated, sir. Adjusting cooling systems.",
    ],
    "motion_detected": [
        "Motion detected in the vicinity.",
        "I've detected movement nearby, sir.",
    ],
    "light_low": [
        "Light levels are low. Shall I adjust the display?",
        "It's getting dark, sir. Activating night mode.",
    ],
    "acknowledged": [
        "Command acknowledged, sir.",
        "Processing your request.",
        "Understood, sir.",
    ],
    "default": [
        "I'm here to assist, sir.",
        "How can I help you today?",
        "Ready for your next command.",
    ]
}

def parse_command(command: str) -> str:
    """Parse the user command and return appropriate Jarvis response"""
    command_lower = command.lower()

    # Extract system context if present
    system_info = ""
    if "CURRENT SYSTEM STATUS:" in command:
        # Extract system info for context-aware responses
        system_match = re.search(r'CURRENT SYSTEM STATUS:(.*?)(?=User command:|$)', command, re.DOTALL)
        if system_match:
            system_info = system_match.group(1).strip()

    # Extract actual user command
    user_command_match = re.search(r'User command:\s*(.*)', command, re.IGNORECASE)
    user_command = user_command_match.group(1).strip() if user_command_match else command

    # Check for specific keywords and system conditions
    if any(word in user_command.lower() for word in ['hello', 'hi', 'good morning', 'good evening']):
        return random.choice(JARVIS_RESPONSES["greetings"])

    if any(word in user_command.lower() for word in ['status', 'system', 'how are you']):
        # Check system conditions from context
        if 'CPU Usage: ' in system_info:
            cpu_match = re.search(r'CPU Usage:\s*(\d+)%', system_info)
            if cpu_match and int(cpu_match.group(1)) > 70:
                return random.choice(JARVIS_RESPONSES["cpu_high"])

        if 'Temperature: ' in system_info:
            temp_match = re.search(r'Temperature:\s*(\d+)°C', system_info)
            if temp_match and int(temp_match.group(1)) > 70:
                return random.choice(JARVIS_RESPONSES["temp_high"])

        return random.choice(JARVIS_RESPONSES["system_status"])

    if any(word in user_command.lower() for word in ['motion', 'movement']):
        return random.choice(JARVIS_RESPONSES["motion_detected"])

    if any(word in user_command.lower() for word in ['light', 'dark']):
        return random.choice(JARVIS_RESPONSES["light_low"])

    # Default response
    return random.choice(JARVIS_RESPONSES["acknowledged"])

@router.post("/jarvis/command")
def handle_command(payload: dict):
    command = payload.get("command", "")
    
    try:
        # Use enhanced voice command processing
        result = process_voice_command(command)
        return result
    except Exception as e:
        return {
            "state": "speaking",
            "response": "I'm experiencing a technical difficulty. Please try again.",
            "action": "error",
            "success": False
        }

@router.post("/jarvis/speech-to-text")
def speech_to_text(audio_data: dict):
    """Convert speech to text (Web Speech API integration)"""
    return {
        "transcript": "switch to scan mode",
        "confidence": 0.95,
        "language": "en",
        "duration": 2.3
    }

@router.get("/jarvis/commands")
def get_available_commands():
    """Get list of available voice commands"""
    return {
        "commands": [
            "Switch to scan mode",
            "Switch to measure mode", 
            "Switch to analytics mode",
            "Switch to settings mode",
            "Switch to export mode",
            "Switch to home mode",
            "Show system status",
            "Calibrate sensors",
            "Start face scan",
            "Hello Jarvis"
        ]
    }
