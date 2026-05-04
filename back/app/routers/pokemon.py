"""
Pokemon router — list, detail, capture, release endpoints.

All business logic lives in PokemonService; this file is the HTTP layer only.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.constants import (
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
    MAX_TYPE_FILTERS,
    VALID_POKEMON_SORT_FIELDS,
)
from app.core.errors import handle_route_errors
from app.models.pokemon import PokemonDetail, PokemonListResponse
from app.services.pokemon_service import PokemonService
from app.utils.auth import get_current_user

router = APIRouter(prefix="/pokemon", tags=["Pokemon"])


# ----------------------------------------------------------------------
# Filter option lookups
# ----------------------------------------------------------------------

@router.get("/types", response_model=List[str])
async def get_pokemon_types():
    """List of all Pokemon types in the database."""
    return PokemonService.get_available_types()


@router.get("/regions", response_model=List[str])
async def get_pokemon_regions():
    """List of all Pokemon regions in the database."""
    return PokemonService.get_available_regions()


@router.get("/habitats", response_model=List[str])
async def get_pokemon_habitats():
    """List of all Pokemon habitats in the database."""
    return PokemonService.get_available_habitats()


# ----------------------------------------------------------------------
# Pokemon list
# ----------------------------------------------------------------------

def _parse_type_filter(types: Optional[str]) -> Optional[List[str]]:
    """Parse and validate the comma-separated `types` query parameter."""
    if not types:
        return None
    type_list = [t.strip().lower() for t in types.split(",")]
    if len(type_list) > MAX_TYPE_FILTERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_TYPE_FILTERS} types can be selected for filtering",
        )
    return type_list


def _validate_sort_field(sort_by: Optional[str]) -> None:
    """Reject unknown sort fields with a 400."""
    if sort_by and sort_by not in VALID_POKEMON_SORT_FIELDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid sort_by field. Must be one of: "
                + ", ".join(VALID_POKEMON_SORT_FIELDS)
            ),
        )


@router.get("/", response_model=PokemonListResponse)
@handle_route_errors("Failed to fetch Pokemon")
async def get_pokemon_list(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(
        DEFAULT_PAGE_SIZE,
        ge=1,
        le=MAX_PAGE_SIZE,
        description=f"Pokemon per page (max {MAX_PAGE_SIZE})",
    ),
    types: Optional[str] = Query(
        None, description=f"Comma-separated type names (max {MAX_TYPE_FILTERS})"
    ),
    region: Optional[str] = Query(None, description="Filter by region"),
    habitat: Optional[str] = Query(None, description="Filter by habitat"),
    difficulty: Optional[str] = Query(
        None,
        description="Filter by difficulty (weak, easy, medium, hard, legendary, mythical)",
    ),
    sort_by: Optional[str] = Query(
        None, description=f"Sort field: {', '.join(VALID_POKEMON_SORT_FIELDS)}"
    ),
    sort_order: str = Query(
        "asc", regex="^(asc|desc)$", description="Sort order: asc or desc"
    ),
    captured_only: bool = Query(False, description="Show only captured Pokemon"),
    current_user: str = Depends(get_current_user),
):
    """Paginated, filtered, sorted Pokemon list — see query params for filters."""
    type_list = _parse_type_filter(types)
    _validate_sort_field(sort_by)

    return await PokemonService.get_pokemon_list(
        page=page,
        page_size=page_size,
        types=type_list,
        region=region,
        habitat=habitat,
        difficulty=difficulty,
        sort_by=sort_by or "id",
        sort_order=sort_order,
        trainer_id=current_user,
        captured_only=captured_only,
    )


# ----------------------------------------------------------------------
# Pokemon detail
# ----------------------------------------------------------------------

@router.get("/{pokemon_id}", response_model=PokemonDetail)
@handle_route_errors("Failed to fetch Pokemon detail")
async def get_pokemon_detail(
    pokemon_id: int,
    current_user: str = Depends(get_current_user),
):
    """Detailed info for a single Pokemon, including capture status."""
    pokemon = await PokemonService.fetch_pokemon_detail(pokemon_id, current_user)
    if not pokemon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pokemon with ID {pokemon_id} not found",
        )
    return pokemon


# ----------------------------------------------------------------------
# Capture / release
# ----------------------------------------------------------------------

@router.post("/{pokemon_id}/capture")
@handle_route_errors("Failed to capture Pokemon")
async def capture_pokemon(
    pokemon_id: int,
    current_user: str = Depends(get_current_user),
):
    """Add a Pokemon to the current trainer's collection."""
    return await PokemonService.capture_pokemon(current_user, pokemon_id)


@router.delete("/{pokemon_id}/capture")
@handle_route_errors("Failed to release Pokemon")
async def release_pokemon(
    pokemon_id: int,
    current_user: str = Depends(get_current_user),
):
    """Remove a Pokemon from the current trainer's collection."""
    return await PokemonService.release_pokemon(current_user, pokemon_id)
