"""
Pokemon service - Queries Pokemon data from Supabase database
Data is pre-populated from PokeAPI using populate_pokemon.py
"""

import json
from typing import List, Optional
from fastapi import HTTPException, status
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
        sort_order: str = 'asc',
        trainer_id: Optional[str] = None,
        captured_only: bool = False
    ) -> PokemonListResponse:
        """
        Get paginated list of Pokemon from database with filtering and sorting
        
        Args:
            page: Page number (1-indexed)
            page_size: Number of Pokemon per page (max 50)
            types: List of types to filter by (AND logic)
            sort_by: Field to sort by (id, name, height, weight, stats_total)
            sort_order: Sort order (asc or desc)
            trainer_id: Current trainer ID to check captured status
            captured_only: If True, only return captured Pokemon
        """
        try:
            # Limit page size
            page_size = min(page_size, 50)
            offset = (page - 1) * page_size
            
            # Build base query
            query = supabase.table('pokemon').select(
                'id, name, types, sprite_official, sprite_default, height, weight, stats_total',
                count='exact'
            )
            
            # Apply type filters (AND logic - Pokemon must have ALL specified types)
            if types:
                for pokemon_type in types:
                    query = query.contains('types', [pokemon_type])
            
            # If captured_only is True, filter by captured Pokemon
            if captured_only and trainer_id:
                # Get list of captured Pokemon IDs for this trainer
                captured_response = supabase.table('captured_pokemon').select('pokemon_id').eq('trainer_id', trainer_id).execute()
                captured_ids = [row['pokemon_id'] for row in (captured_response.data or [])]
                
                if not captured_ids:
                    # No captured Pokemon, return empty list
                    return PokemonListResponse(
                        pokemon=[],
                        total=0,
                        page=page,
                        page_size=page_size,
                        has_more=False,
                        total_pages=0
                    )
                
                # Filter to only show captured Pokemon
                query = query.in_('id', captured_ids)
            
            # Apply sorting
            ascending = sort_order == 'asc'
            query = query.order(sort_by, desc=not ascending)
            
            # Apply pagination
            query = query.range(offset, offset + page_size - 1)
            
            # Execute query
            response = query.execute()
            
            total = response.count if response.count is not None else 0
            pokemon_data = response.data or []
            
            # Get captured status for current trainer
            captured_ids = set()
            if trainer_id:
                captured_response = supabase.table('captured_pokemon').select('pokemon_id').eq('trainer_id', trainer_id).execute()
                captured_ids = {row['pokemon_id'] for row in captured_response.data}
            
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
                    stats_total=p['stats_total'],
                    is_captured=p['id'] in captured_ids
                ))
            
            # Calculate pagination info
            total_pages = (total + page_size - 1) // page_size if total > 0 else 0
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
    async def fetch_pokemon_detail(pokemon_id: int, trainer_id: Optional[str] = None) -> Optional[PokemonDetail]:
        """Get detailed Pokemon information by ID from database"""
        try:
            response = supabase.table('pokemon').select('*').eq('id', pokemon_id).execute()
            
            if not response.data:
                return None
            
            p = response.data[0]
            
            # Check if captured by trainer
            is_captured = False
            nickname = None
            if trainer_id:
                captured_response = supabase.table('captured_pokemon').select('nickname').eq('trainer_id', trainer_id).eq('pokemon_id', pokemon_id).execute()
                if captured_response.data:
                    is_captured = True
                    nickname = captured_response.data[0].get('nickname')
            
            # Transform stats to PokemonStat objects
            stats = [
                PokemonStat(name='hp', base_stat=p['stats_hp']),
                PokemonStat(name='attack', base_stat=p['stats_attack']),
                PokemonStat(name='defense', base_stat=p['stats_defense']),
                PokemonStat(name='special-attack', base_stat=p['stats_special_attack']),
                PokemonStat(name='special-defense', base_stat=p['stats_special_defense']),
                PokemonStat(name='speed', base_stat=p['stats_speed']),
            ]
            
            # Parse JSON strings from database
            sprites = p.get('sprites', {})
            if isinstance(sprites, str):
                sprites = json.loads(sprites)
            
            abilities = p.get('abilities', [])
            if isinstance(abilities, str):
                abilities = json.loads(abilities)
            
            return PokemonDetail(
                id=p['id'],
                name=p['name'],
                types=p['types'],
                sprites=sprites,
                height=p['height'],
                weight=p['weight'],
                stats=stats,
                stats_total=p['stats_total'],
                abilities=abilities,
                base_experience=p.get('base_experience'),
                is_captured=is_captured,
                nickname=nickname,
                description=p.get('description')  # Add description from database
            )
            
        except Exception as e:
            print(f"Error fetching Pokemon {pokemon_id}: {e}")
            return None
    
    @staticmethod
    async def capture_pokemon(trainer_id: str, pokemon_id: int, nickname: Optional[str] = None):
        """Capture a Pokemon for a trainer"""
        try:
            # Check if Pokemon exists
            pokemon_response = supabase.table('pokemon').select('id, name').eq('id', pokemon_id).execute()
            if not pokemon_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Pokemon with ID {pokemon_id} not found"
                )
            
            pokemon_name = pokemon_response.data[0]['name']
            
            # Check if already captured
            existing = supabase.table('captured_pokemon').select('id').eq('trainer_id', trainer_id).eq('pokemon_id', pokemon_id).execute()
            if existing.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"You have already captured {pokemon_name.capitalize()}!"
                )
            
            # Insert capture record
            capture_data = {
                'trainer_id': trainer_id,
                'pokemon_id': pokemon_id,
                'nickname': nickname
            }
            response = supabase.table('captured_pokemon').insert(capture_data).execute()
            
            return {
                'message': f'Successfully captured {pokemon_name.capitalize()}!',
                'pokemon_id': pokemon_id,
                'pokemon_name': pokemon_name,
                'captured': True
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to capture Pokemon: {str(e)}"
            )
    
    @staticmethod
    async def release_pokemon(trainer_id: str, pokemon_id: int):
        """Release a captured Pokemon"""
        try:
            # Check if Pokemon is captured
            captured = supabase.table('captured_pokemon').select('id').eq('trainer_id', trainer_id).eq('pokemon_id', pokemon_id).execute()
            if not captured.data:
                # Get Pokemon name for better error message
                pokemon_response = supabase.table('pokemon').select('name').eq('id', pokemon_id).execute()
                pokemon_name = pokemon_response.data[0]['name'] if pokemon_response.data else f"Pokemon #{pokemon_id}"
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"You haven't captured {pokemon_name.capitalize()} yet"
                )
            
            # Delete capture record
            supabase.table('captured_pokemon').delete().eq('trainer_id', trainer_id).eq('pokemon_id', pokemon_id).execute()
            
            # Get Pokemon name for response
            pokemon_response = supabase.table('pokemon').select('name').eq('id', pokemon_id).execute()
            pokemon_name = pokemon_response.data[0]['name'] if pokemon_response.data else f"Pokemon #{pokemon_id}"
            
            return {
                'message': f'Released {pokemon_name.capitalize()}',
                'pokemon_id': pokemon_id,
                'pokemon_name': pokemon_name,
                'captured': False
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to release Pokemon: {str(e)}"
            )