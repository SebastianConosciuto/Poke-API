"""
Pokemon data models
"""

from pydantic import BaseModel
from typing import List, Optional

class PokemonStat(BaseModel):
    """Individual Pokemon stat"""
    name: str
    base_stat: int

class PokemonBasic(BaseModel):
    """Basic Pokemon information for list views"""
    id: int
    name: str
    types: List[str]
    sprite: Optional[str]
    height: int
    weight: int
    stats_total: int
    is_captured: bool = False  # Whether the current user has captured this Pokemon

class PokemonDetail(BaseModel):
    """Detailed Pokemon information"""
    id: int
    name: str
    types: List[str]
    sprites: dict
    height: int
    weight: int
    stats: List[PokemonStat]
    stats_total: int
    abilities: List[dict]
    base_experience: Optional[int]
    is_captured: bool = False  # Whether the current user has captured this Pokemon
    nickname: Optional[str] = None  # Custom nickname if captured
    description: Optional[str] = None  # Pokedex flavor text description

class PokemonListResponse(BaseModel):
    """Response for paginated Pokemon list"""
    pokemon: List[PokemonBasic]
    total: int
    page: int
    page_size: int
    has_more: bool
    total_pages: int