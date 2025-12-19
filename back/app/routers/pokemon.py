from fastapi import APIRouter, Query, Depends, HTTPException, status
from typing import List, Optional
from app.models.pokemon import PokemonListResponse, PokemonDetail
from app.services.pokemon_service import PokemonService
from app.utils.auth import get_current_user

router = APIRouter(prefix="/pokemon", tags=["Pokemon"])

@router.get("/types", response_model=List[str])
async def get_pokemon_types():
    """Get list of all available Pokemon types"""
    return PokemonService.get_available_types()

@router.get("/", response_model=PokemonListResponse)
async def get_pokemon_list(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=50, description="Pokemon per page (max 50)"),
    types: Optional[str] = Query(None, description="Comma-separated type names (max 2)"),
    sort_by: Optional[str] = Query(None, description="Sort field: id, name, height, weight, stats_total"),
    sort_order: str = Query("asc", regex="^(asc|desc)$", description="Sort order: asc or desc"),
    captured_only: bool = Query(False, description="Show only captured Pokemon"),
    current_user: str = Depends(get_current_user)
):
    """
    Get paginated list of Pokemon with optional filtering and sorting
    
    - **page**: Page number (starting at 1)
    - **page_size**: Number of Pokemon per page (max 50)
    - **types**: Filter by types (comma-separated, max 2 types)
    - **sort_by**: Sort by field (id, name, height, weight, stats_total)
    - **sort_order**: Sort order (asc or desc)
    - **captured_only**: If true, only show Pokemon captured by the current user
    """
    # Parse types filter
    type_list = None
    if types:
        type_list = [t.strip().lower() for t in types.split(",")]
        if len(type_list) > 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 2 types can be selected for filtering"
            )
    
    # Validate sort_by field
    valid_sort_fields = ["id", "name", "height", "weight", "stats_total"]
    if sort_by and sort_by not in valid_sort_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid sort_by field. Must be one of: {', '.join(valid_sort_fields)}"
        )
    
    try:
        result = await PokemonService.get_pokemon_list(
            page=page,
            page_size=page_size,
            types=type_list,
            sort_by=sort_by,
            sort_order=sort_order,
            trainer_id=current_user,
            captured_only=captured_only
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch Pokemon: {str(e)}"
        )

@router.get("/{pokemon_id}", response_model=PokemonDetail)
async def get_pokemon_detail(
    pokemon_id: int,
    current_user: str = Depends(get_current_user)
):
    """Get detailed information about a specific Pokemon"""
    try:
        pokemon = await PokemonService.fetch_pokemon_detail(pokemon_id)
        if not pokemon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pokemon with ID {pokemon_id} not found"
            )
        return pokemon
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch Pokemon detail: {str(e)}"
        )

@router.post("/{pokemon_id}/capture")
async def capture_pokemon(
    pokemon_id: int,
    current_user: str = Depends(get_current_user)
):
    """Capture a Pokemon"""
    try:
        result = await PokemonService.capture_pokemon(current_user, pokemon_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to capture Pokemon: {str(e)}"
        )

@router.delete("/{pokemon_id}/capture")
async def release_pokemon(
    pokemon_id: int,
    current_user: str = Depends(get_current_user)
):
    """Release a captured Pokemon"""
    try:
        result = await PokemonService.release_pokemon(current_user, pokemon_id)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to release Pokemon: {str(e)}"
        )