from pydantic import BaseModel
from typing import List, Optional

class PokemonType(BaseModel):
    """Schema for Pokemon type"""
    name: str
    url: str

class PokemonSprites(BaseModel):
    """Schema for Pokemon sprites"""
    front_default: Optional[str] = None
    front_shiny: Optional[str] = None
    other: Optional[dict] = None

class PokemonStat(BaseModel):
    """Schema for Pokemon stat"""
    name: str
    base_stat: int

class PokemonBasic(BaseModel):
    """Schema for basic Pokemon info (list view)"""
    id: int
    name: str
    types: List[str]  # Just type names like ["fire", "flying"]
    sprite: Optional[str]
    height: int
    weight: int
    stats_total: int  # Sum of all base stats

class PokemonDetail(BaseModel):
    """Schema for detailed Pokemon info"""
    id: int
    name: str
    types: List[str]
    sprites: dict
    height: int
    weight: int
    stats: List[PokemonStat]
    stats_total: int
    abilities: List[dict]
    base_experience: Optional[int] = None

class PokemonListResponse(BaseModel):
    """Schema for paginated Pokemon list response"""
    pokemon: List[PokemonBasic]
    total: int
    page: int
    page_size: int
    has_more: bool
    total_pages: int