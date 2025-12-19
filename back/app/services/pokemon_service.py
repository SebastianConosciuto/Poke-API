"""
Pokemon service - Queries Pokemon data from Supabase database
Data is pre-populated from PokeAPI using populate_pokemon.py
"""

from typing import List, Optional
from app.database import supabase
from app.models.pokemon import (
    PokemonBasic,
    PokemonDetail,
    PokemonListResponse,
    PokemonStat
)

class PokemonService:
    """Service for querying Pokemon data from Supabase"""
    
    @staticmethod
    def get_available_types() -> List[str]:
        """Get list of all unique Pokemon types from database"""
        try:
            # Query all pokemon and extract unique types
            response = supabase.table('pokemon').select('types').execute()
            
            types_set = set()
            for row in response.data:
                types_set.update(row['types'])
            
            return sorted(list(types_set))
            
        except Exception as e:
            print(f"Error fetching types: {e}")
            # Return common types as fallback
            return [
                'normal', 'fire', 'water', 'electric', 'grass', 'ice',
                'fighting', 'poison', 'ground', 'flying', 'psychic',
                'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
            ]
    
    @staticmethod
    async def get_pokemon_list(
        page: int = 1,
        page_size: int = 20,
        types: Optional[List[str]] = None,
        sort_by: str = 'id',
        sort_order: str = 'asc'
    ) -> PokemonListResponse:
        """
        Get paginated list of Pokemon from database with filtering and sorting
        
        Args:
            page: Page number (1-indexed)
            page_size: Number of Pokemon per page (max 50)
            types: List of types to filter by (AND logic)
            sort_by: Field to sort by (id, name, height, weight, stats_total)
            sort_order: Sort order (asc or desc)
        """
        try:
            # Limit page size
            page_size = min(page_size, 50)
            offset = (page - 1) * page_size
            
            # Build query
            query = supabase.table('pokemon').select(
                'id, name, types, sprite_official, sprite_default, height, weight, stats_total',
                count='exact'
            )
            
            # Apply type filters (AND logic - Pokemon must have ALL specified types)
            if types:
                for pokemon_type in types:
                    query = query.contains('types', [pokemon_type])
            
            # Apply sorting
            ascending = sort_order == 'asc'
            query = query.order(sort_by, desc=not ascending)
            
            # Apply pagination
            query = query.range(offset, offset + page_size - 1)
            
            # Execute query
            response = query.execute()
            
            total = response.count if response.count is not None else 0
            pokemon_data = response.data or []
            
            # Transform to PokemonBasic objects
            pokemon_list = []
            for p in pokemon_data:
                pokemon_list.append(PokemonBasic(
                    id=p['id'],
                    name=p['name'],
                    types=p['types'],
                    sprite=p['sprite_official'] or p['sprite_default'],
                    height=p['height'],
                    weight=p['weight'],
                    stats_total=p['stats_total']
                ))
            
            # Calculate pagination info
            total_pages = (total + page_size - 1) // page_size
            has_more = page < total_pages
            
            return PokemonListResponse(
                pokemon=pokemon_list,
                total=total,
                page=page,
                page_size=page_size,
                has_more=has_more,
                total_pages=total_pages
            )
            
        except Exception as e:
            print(f"Error fetching Pokemon list: {e}")
            raise
    
    @staticmethod
    async def fetch_pokemon_detail(pokemon_id: int) -> Optional[PokemonDetail]:
        """Get detailed Pokemon information by ID from database"""
        try:
            response = supabase.table('pokemon').select('*').eq('id', pokemon_id).execute()
            
            if not response.data:
                return None
            
            p = response.data[0]
            
            # Transform stats to PokemonStat objects
            stats = [
                PokemonStat(name='hp', base_stat=p['stats_hp']),
                PokemonStat(name='attack', base_stat=p['stats_attack']),
                PokemonStat(name='defense', base_stat=p['stats_defense']),
                PokemonStat(name='special-attack', base_stat=p['stats_special_attack']),
                PokemonStat(name='special-defense', base_stat=p['stats_special_defense']),
                PokemonStat(name='speed', base_stat=p['stats_speed']),
            ]
            
            return PokemonDetail(
                id=p['id'],
                name=p['name'],
                types=p['types'],
                sprites=p.get('sprites', {}),
                height=p['height'],
                weight=p['weight'],
                stats=stats,
                stats_total=p['stats_total'],
                abilities=p.get('abilities', []),
                base_experience=p.get('base_experience')
            )
            
        except Exception as e:
            print(f"Error fetching Pokemon {pokemon_id}: {e}")
            return None