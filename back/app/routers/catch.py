"""
Catching router — endpoints for the Pokemon catching minigame.

Thin layer; delegates everything to CatchService.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends

from app.core.errors import handle_route_errors
from app.models.catch import (
    CatchAttemptResult,
    CatchChallenge,
    CatchRequest,
    CatchResult,
)
from app.services.catch_service import CatchService
from app.utils.auth import get_current_user

router = APIRouter(prefix="/catch", tags=["Catching"])


# ----------------------------------------------------------------------
# Filter option lookups
# ----------------------------------------------------------------------

@router.get("/regions", response_model=List[str])
async def get_regions():
    """Canonical list of regions."""
    return CatchService.get_available_regions()


@router.get("/habitats", response_model=List[str])
@handle_route_errors("Failed to fetch habitats")
async def get_habitats(region: Optional[str] = None):
    """Habitats with at least one Pokemon — optionally restricted to a region."""
    return await CatchService.get_available_habitats(region)


@router.get("/difficulties", response_model=List[str])
@handle_route_errors("Failed to fetch difficulties")
async def get_difficulties(region: Optional[str] = None, habitat: Optional[str] = None):
    """Difficulty keys that have at least one Pokemon under the given filters."""
    return await CatchService.get_available_difficulties(region, habitat)


# ----------------------------------------------------------------------
# Catch attempt lifecycle
# ----------------------------------------------------------------------

@router.post("/start", response_model=CatchChallenge)
@handle_route_errors("Failed to start catch attempt")
async def start_catch_attempt(
    request: CatchRequest,
    current_user: str = Depends(get_current_user),
):
    """Pick a random Pokemon for the filters and return a QTE challenge."""
    return await CatchService.get_random_pokemon(
        region=request.region,
        habitat=request.habitat,
        difficulty=request.difficulty,
    )


@router.post("/complete", response_model=CatchResult)
@handle_route_errors("Failed to record catch attempt")
async def complete_catch_attempt(
    attempt: CatchAttemptResult,
    current_user: str = Depends(get_current_user),
):
    """Record outcome, capture if successful, award XP either way."""
    return await CatchService.record_catch_attempt(
        trainer_id=current_user,
        attempt=attempt,
    )
