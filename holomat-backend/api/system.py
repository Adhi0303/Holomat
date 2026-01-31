from fastapi import APIRouter
import random

router = APIRouter()

@router.get("/system-stats")
def get_system_stats():
    return {
        "cpu": random.randint(30, 80),
        "ram": random.randint(40, 90),
        "temp": random.randint(35, 85)
    }
