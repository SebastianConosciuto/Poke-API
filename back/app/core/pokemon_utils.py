"""
Pokemon-specific helper functions used by services.

Centralizes JSON-field parsing, sprite URL fallbacks, and name formatting
that were previously duplicated across catch_service.py and pokemon_service.py.
"""

import json
from typing import Any, Dict, List, Optional


# ----------------------------------------------------------------------
# JSON field parsing
# ----------------------------------------------------------------------

def parse_json_field(value: Any, default: Any) -> Any:
    """
    Supabase sometimes returns JSON fields as Python objects, sometimes as
    JSON strings (depending on the column type). Parse if necessary, otherwise
    return the value unchanged.
    """
    if value is None:
        return default
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return default
    return value


def parse_sprites(value: Any) -> Dict[str, Any]:
    """Parse the `sprites` JSON column into a dict (empty dict on failure)."""
    return parse_json_field(value, {})


def parse_abilities(value: Any) -> List[Dict[str, Any]]:
    """Parse the `abilities` JSON column into a list (empty list on failure)."""
    return parse_json_field(value, [])


# ----------------------------------------------------------------------
# Sprite URL resolution
# ----------------------------------------------------------------------

def get_sprite_url(sprites: Dict[str, Any], pokemon_id: int) -> str:
    """
    Pick the best available sprite URL with sensible fallbacks:
        1. front_default
        2. official-artwork.front_default
        3. PokeAPI raw GitHub URL by ID

    The third option mirrors what catch_service.py used to inline.
    """
    if sprites:
        front_default = sprites.get("front_default")
        if front_default:
            return front_default

        official = (
            sprites.get("other", {})
            .get("official-artwork", {})
            .get("front_default")
        )
        if official:
            return official

    return (
        f"https://raw.githubusercontent.com/PokeAPI/sprites/"
        f"master/sprites/pokemon/{pokemon_id}.png"
    )


# ----------------------------------------------------------------------
# Name formatting
# ----------------------------------------------------------------------

def format_pokemon_name(name: Optional[str]) -> str:
    """
    Capitalize a Pokemon name for display (e.g. 'pikachu' -> 'Pikachu').

    Returns 'Pokemon' if name is missing — matches the previous fallback
    used in pokemon_service.release_pokemon.
    """
    if not name:
        return "Pokemon"
    return name.capitalize()
