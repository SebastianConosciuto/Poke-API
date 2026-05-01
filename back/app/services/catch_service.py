"""
Catching service - Handles Pokemon catching minigame logic
UPDATED: Uses difficulty-based XP rewards
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
from app.services.experience_service import ExperienceService


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
        else:
            buttons = 8
            time_per_button = 0.5
        
        # Generate random button sequence
        sequence = [random.choice(CatchService.ARROW_KEYS) for _ in range(buttons)]
        
        return ButtonSequence(
            buttons=sequence,
            time_per_button=time_per_button,
            total_buttons=buttons
        )
    
    @staticmethod
    async def get_random_pokemon(
        region: Optional[str],
        habitat: Optional[str],
        difficulty: DifficultyLevel
    ) -> CatchChallenge:
        """Get a random Pokemon matching the filters with QTE challenge"""
        try:
            # Build query
            query = supabase.table('pokemon').select('id, name, sprites, stats_total')
            
            # Apply filters
            if region and region.lower() != 'any':
                query = query.eq('region', region.lower())
            
            if habitat and habitat.lower() != 'any':
                query = query.eq('habitat', habitat.lower())
            
            # Apply difficulty filter based on stats
            difficulty_ranges = {
                DifficultyLevel.WEAK: (180, 300),
                DifficultyLevel.EASY: (301, 400),
                DifficultyLevel.MEDIUM: (401, 500),
                DifficultyLevel.HARD: (501, 600),
                DifficultyLevel.LEGENDARY: (601, 720),
                DifficultyLevel.MYTHICAL: (721, 9999),
            }
            
            min_stats, max_stats = difficulty_ranges.get(difficulty, (401, 500))
            query = query.gte('stats_total', min_stats).lte('stats_total', max_stats)
            
            response = query.execute()
            
            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No Pokemon found matching the selected criteria"
                )
            
            # Select random Pokemon from results
            pokemon = random.choice(response.data)
            
            # Parse sprites
            sprites = pokemon.get('sprites', {})
            if isinstance(sprites, str):
                import json
                sprites = json.loads(sprites)
            
            # Get sprite URL
            sprite_url = (
                sprites.get('front_default') or 
                sprites.get('other', {}).get('official-artwork', {}).get('front_default') or
                f"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{pokemon['id']}.png"
            )
            
            # Calculate QTE sequence
            sequence = CatchService.calculate_qte_difficulty(pokemon['stats_total'], difficulty)
            
            return CatchChallenge(
                pokemon_id=pokemon['id'],
                pokemon_name=pokemon['name'].capitalize(),
                pokemon_sprite=sprite_url,
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
        UPDATED: XP rewards based on difficulty level
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
            
            # Get difficulty from attempt (default to medium if not provided)
            difficulty = attempt.difficulty or "medium"
            
            # Get XP amount based on difficulty and success
            xp_amount = ExperienceService.get_xp_for_difficulty(difficulty, attempt.success)
            
            print(f"[CATCH] Difficulty: {difficulty}, Success: {attempt.success}, XP: {xp_amount}")
            
            # Handle success
            if attempt.success:
                # Check if already captured
                existing = supabase.table('captured_pokemon').select('id').eq(
                    'trainer_id', trainer_id
                ).eq('pokemon_id', attempt.pokemon_id).execute()
                
                # Award XP for successful catch
                xp_result = await ExperienceService.award_experience(trainer_id, xp_amount)
                
                if existing.data:
                    message = f"You already caught {pokemon_name}! But nice catch anyway!"
                    reward_message = f"+{xp_amount} XP"
                else:
                    # Capture the Pokemon
                    capture_data = {
                        'trainer_id': trainer_id,
                        'pokemon_id': attempt.pokemon_id,
                        'nickname': None
                    }
                    supabase.table('captured_pokemon').insert(capture_data).execute()
                    
                    message = f"Congratulations! You caught {pokemon_name}!"
                    reward_message = f"+{xp_amount} XP"
                    
                    # Perfect catch bonus message
                    if attempt.perfect:
                        reward_message = f"✨ PERFECT CATCH! {reward_message}"
                
                # Add level up messages
                if xp_result["leveled_up"]:
                    level_up_msg = " | ".join(xp_result["level_up_messages"])
                    reward_message = f"{reward_message} | {level_up_msg}"
                
                return CatchResult(
                    success=True,
                    message=message,
                    pokemon_name=pokemon_name,
                    accuracy=accuracy,
                    perfect=attempt.perfect,
                    reward_message=reward_message,
                    xp_awarded=xp_result["xp_awarded"],
                    new_level=xp_result["new_level"],
                    leveled_up=xp_result["leveled_up"]
                )
            else:
                # Failed catch - still award consolation XP (half amount)
                xp_result = await ExperienceService.award_experience(trainer_id, xp_amount)
                
                message = f"{pokemon_name} broke free! Try again!"
                reward_message = f"+{xp_amount} XP for trying"
                
                # Add level up messages if applicable
                if xp_result["leveled_up"]:
                    level_up_msg = " | ".join(xp_result["level_up_messages"])
                    reward_message = f"{reward_message} | {level_up_msg}"
                
                return CatchResult(
                    success=False,
                    message=message,
                    pokemon_name=pokemon_name,
                    accuracy=accuracy,
                    perfect=False,
                    reward_message=reward_message,
                    xp_awarded=xp_result["xp_awarded"],
                    new_level=xp_result["new_level"],
                    leveled_up=xp_result["leveled_up"]
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
    async def get_available_habitats(region: Optional[str] = None) -> list:
        """Get list of available habitats, optionally filtered by region"""
        try:
            query = supabase.table('pokemon').select('habitat')
            
            if region and region.lower() != 'any':
                query = query.eq('region', region.lower())
            
            response = query.execute()
            
            # Extract unique habitats
            habitats = set()
            for p in response.data:
                if p.get('habitat'):
                    habitats.add(p['habitat'])
            
            return sorted(list(habitats))
            
        except Exception as e:
            print(f"Error getting habitats: {e}")
            return []
    
    @staticmethod
    async def get_available_difficulties(
        region: Optional[str] = None,
        habitat: Optional[str] = None
    ) -> list:
        """Get list of available difficulty levels based on Pokemon in region/habitat"""
        try:
            query = supabase.table('pokemon').select('stats_total')
            
            if region and region.lower() != 'any':
                query = query.eq('region', region.lower())
            
            if habitat and habitat.lower() != 'any':
                query = query.eq('habitat', habitat.lower())
            
            response = query.execute()
            
            if not response.data:
                return ['medium']  # Default fallback
            
            # Determine which difficulties have Pokemon available
            difficulties = set()
            for p in response.data:
                stats = p.get('stats_total', 0)
                if stats < 301:
                    difficulties.add('weak')
                elif stats < 401:
                    difficulties.add('easy')
                elif stats < 501:
                    difficulties.add('medium')
                elif stats < 601:
                    difficulties.add('hard')
                elif stats < 721:
                    difficulties.add('legendary')
                else:
                    difficulties.add('mythical')
            
            # Return in order
            order = ['weak', 'easy', 'medium', 'hard', 'legendary', 'mythical']
            return [d for d in order if d in difficulties]
            
        except Exception as e:
            print(f"Error getting difficulties: {e}")
            return ['weak', 'easy', 'medium', 'hard', 'legendary', 'mythical']