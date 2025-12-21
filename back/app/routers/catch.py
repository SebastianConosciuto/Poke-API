"""
Catching router - API endpoints for Pokemon catching minigame
"""

from fastapi import APIRouter, Depends
from typing import List
from app.models.catch import (
    CatchRequest,
    CatchChallenge,
    CatchAttemptResult,
    CatchResult
)
from app.services.catch_service import CatchService
from app.utils.auth import get_current_user

router = APIRouter(prefix="/catch", tags=["Catching"])

@router.get("/regions", response_model=List[str])
async def get_regions():
    """Get list of available Pokemon regions"""
    return CatchService.get_available_regions()

@router.get("/habitats", response_model=List[str])
async def get_habitats():
    """Get list of available Pokemon habitats/biomes"""
    return CatchService.get_available_habitats()

@router.post("/start", response_model=CatchChallenge)
async def start_catch_attempt(
    request: CatchRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Start a new catch attempt
    
    Returns a random Pokemon from the selected region/habitat
    along with a QTE challenge based on difficulty
    """
    return await CatchService.get_random_pokemon(
        region=request.region,
        habitat=request.habitat,
        difficulty=request.difficulty
    )

@router.post("/complete", response_model=CatchResult)
async def complete_catch_attempt(
    attempt: CatchAttemptResult,
    current_user: str = Depends(get_current_user)
):
    """
    Submit catch attempt result
    
    Records the attempt and captures the Pokemon if successful
    """
    return await CatchService.record_catch_attempt(
        trainer_id=current_user,
        attempt=attempt
    )