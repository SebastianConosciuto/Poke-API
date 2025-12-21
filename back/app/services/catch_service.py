"""
Catching service - Handles Pokemon catching minigame logic
"""

import random
from typing import Optional
from fastapi import HTTPException, status
from app.database import supabase
from app.models.catch import (
    CatchRequest,
    CatchChallenge,
    ButtonSequence,
    CatchAttemptResult,
    CatchResult,
    DifficultyLevel
)

class CatchService:
    """Service for Pokemon catching minigame"""
    
    # Arrow key options for QTE
    ARROW_KEYS = ['up', 'down', 'left', 'right']
    
    @staticmethod
    def calculate_qte_difficulty(stats_total: int, difficulty: DifficultyLevel) -> ButtonSequence:
        """
        Calculate QTE parameters based on Pokemon stats
        Uses EXACT formula from design specifications
        
        Stats Ranges:
        - 180-300 (Weak): 3 buttons, 1.5s per button
        - 301-400 (Easy): 4 buttons, 1.2s per button  
        - 401-500 (Medium): 5 buttons, 1.0s per button
        - 501-600 (Hard): 6 buttons, 0.8s per button
        - 601-720 (Legendary): 7 buttons, 0.6s per button
        - 721+ (Mythical): 8 buttons, 0.5s per button
        """
        # Determine buttons and time based on EXACT stat ranges
        if stats_total < 301:
            buttons = 3
            time_per_button = 1.5
        elif stats_total < 401:
            buttons = 4
            time_per_button = 1.2
        elif stats_total < 501:
            buttons = 5
            time_per_button = 1.0
        elif stats_total < 601:
            buttons = 6
            time_per_button = 0.8
        elif stats_total < 721:
            buttons = 7
            time_per_button = 0.6
        else:  # 721+
            buttons = 8
            time_per_button = 0.5
        
        # Generate random button sequence
        button_sequence = [random.choice(CatchService.ARROW_KEYS) for _ in range(buttons)]
        
        return ButtonSequence(
            buttons=button_sequence,
            time_per_button=time_per_button,
            total_buttons=buttons
        )
    
    @staticmethod
    async def get_random_pokemon(
        region: str,
        habitat: str,
        difficulty: DifficultyLevel
    ) -> Optional[CatchChallenge]:
        """
        Get a random Pokemon from specified region and habitat
        Difficulty determines which Pokemon are available based on stats
        Generate QTE challenge based on Pokemon's actual stats
        
        Region and habitat can be "any" to search across all options
        """
        try:
            # Query Pokemon with matching region and habitat
            query = supabase.table('pokemon').select('*')
            
            # Apply filters only if not "any"
            if region and region.lower() not in ['any', '']:
                query = query.eq('region', region.lower())
            
            if habitat and habitat.lower() not in ['any', '']:
                query = query.eq('habitat', habitat.lower())
            
            # Apply difficulty-based stats filtering
            # Difficulty determines which Pokemon can appear based on their stats
            if difficulty == DifficultyLevel.WEAK:
                # Weak: 180-300 total stats
                query = query.gte('stats_total', 180).lte('stats_total', 300)
            elif difficulty == DifficultyLevel.EASY:
                # Easy: 301-400 total stats
                query = query.gte('stats_total', 301).lte('stats_total', 400)
            elif difficulty == DifficultyLevel.MEDIUM:
                # Medium: 401-500 total stats
                query = query.gte('stats_total', 401).lte('stats_total', 500)
            elif difficulty == DifficultyLevel.HARD:
                # Hard: 501-600 total stats
                query = query.gte('stats_total', 501).lte('stats_total', 600)
            elif difficulty == DifficultyLevel.LEGENDARY:
                # Legendary: 601-720 total stats
                query = query.gte('stats_total', 601).lte('stats_total', 720)
            elif difficulty == DifficultyLevel.MYTHICAL:
                # Mythical: 721+ total stats
                query = query.gte('stats_total', 721)
            
            response = query.execute()
            
            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No Pokemon found for region '{region}', habitat '{habitat}', and difficulty '{difficulty}'"
                )
            
            # Select random Pokemon from results
            pokemon = random.choice(response.data)
            
            # Generate QTE sequence based on Pokemon's actual stats (no modifiers)
            sequence = CatchService.calculate_qte_difficulty(
                pokemon['stats_total'],
                DifficultyLevel.MEDIUM  # Always use base difficulty for QTE calculation
            )
            
            # Prepare sprite URL
            sprite = pokemon['sprite_official'] or pokemon['sprite_default']
            
            return CatchChallenge(
                pokemon_id=pokemon['id'],
                pokemon_name=pokemon['name'],
                pokemon_sprite=sprite,
                stats_total=pokemon['stats_total'],
                sequence=sequence,
                difficulty=difficulty
            )
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error getting random Pokemon: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get random Pokemon"
            )
    
    @staticmethod
    async def record_catch_attempt(
        trainer_id: str,
        attempt: CatchAttemptResult
    ) -> CatchResult:
        """
        Record catch attempt and handle success/failure
        """
        try:
            # Calculate accuracy
            accuracy = (attempt.buttons_correct / attempt.total_buttons) * 100
            
            # Get Pokemon name
            pokemon_response = supabase.table('pokemon').select('name').eq('id', attempt.pokemon_id).execute()
            if not pokemon_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Pokemon with ID {attempt.pokemon_id} not found"
                )
            
            pokemon_name = pokemon_response.data[0]['name'].capitalize()
            
            # Handle success
            if attempt.success:
                # Check if already captured
                existing = supabase.table('captured_pokemon').select('id').eq(
                    'trainer_id', trainer_id
                ).eq('pokemon_id', attempt.pokemon_id).execute()
                
                if existing.data:
                    message = f"You already caught {pokemon_name}! But nice catch anyway!"
                    reward_message = ""
                else:
                    # Capture the Pokemon
                    capture_data = {
                        'trainer_id': trainer_id,
                        'pokemon_id': attempt.pokemon_id,
                        'nickname': None
                    }
                    supabase.table('captured_pokemon').insert(capture_data).execute()
                    
                    message = f"Congratulations! You caught {pokemon_name}!"
                    reward_message = ""
                    
                    # Perfect catch bonus
                    if attempt.perfect:
                        reward_message = "✨ PERFECT CATCH! All buttons hit with excellent timing!"
                
                return CatchResult(
                    success=True,
                    message=message,
                    pokemon_name=pokemon_name,
                    accuracy=accuracy,
                    perfect=attempt.perfect,
                    reward_message=reward_message
                )
            else:
                # Failed catch
                message = f"{pokemon_name} broke free! Try again!"
                
                return CatchResult(
                    success=False,
                    message=message,
                    pokemon_name=pokemon_name,
                    accuracy=accuracy,
                    perfect=False,
                    reward_message=""
                )
                
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error recording catch attempt: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to record catch attempt"
            )
    
    @staticmethod
    def get_available_regions() -> list:
        """Get list of available regions"""
        return [
            'kanto', 'johto', 'hoenn', 'sinnoh', 'unova',
            'kalos', 'alola', 'galar', 'paldea'
        ]
    
    @staticmethod
    def get_available_habitats() -> list:
        """Get list of available habitats from database"""
        try:
            response = supabase.table('pokemon').select('habitat').not_.is_('habitat', 'null').execute()
            
            habitats = set()
            for row in response.data:
                if row['habitat']:
                    habitats.add(row['habitat'])
            
            return sorted(list(habitats))
        except Exception as e:
            print(f"Error fetching habitats: {e}")
            # Return common habitats as fallback
            return [
                'grassland', 'forest', 'waters-edge', 'sea', 'cave',
                'mountain', 'rough-terrain', 'urban', 'rare'
            ]