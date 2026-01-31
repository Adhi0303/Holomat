from fastapi import APIRouter

router = APIRouter()

@router.post("/jarvis/command")
def handle_command(payload: dict):
    command = payload.get("command", "")

    return {
        "state": "speaking",
        "response": f"Command '{command}' acknowledged"
    }
