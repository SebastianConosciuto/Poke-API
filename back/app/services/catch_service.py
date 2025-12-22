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
        Generate QTE challenge based on Pokemon stats
        """
        try:
            # Build query based on filters
            query = supabase.table('pokemon').select('*')
            
            # Apply filters
            if region and region.lower() not in ['any', '']:
                query = query.eq('region', region.lower())
        
            if habitat and habitat.lower() not in ['any', '']:
                query = query.eq('habitat', habitat.lower())
            
            # Apply stat-based difficulty filter
            if difficulty == DifficultyLevel.WEAK:
                query = query.gte('stats_total', 180).lte('stats_total', 300)
            elif difficulty == DifficultyLevel.EASY:
                query = query.gte('stats_total', 301).lte('stats_total', 400)
            elif difficulty == DifficultyLevel.MEDIUM:
                query = query.gte('stats_total', 401).lte('stats_total', 500)
            elif difficulty == DifficultyLevel.HARD:
                query = query.gte('stats_total', 501).lte('stats_total', 600)
            elif difficulty == DifficultyLevel.LEGENDARY:
                query = query.gte('stats_total', 601).lte('stats_total', 720)
            elif difficulty == DifficultyLevel.MYTHICAL:
                query = query.gte('stats_total', 721)
            
            response = query.execute()
            
            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No Pokemon found in {region} {habitat} with {difficulty} difficulty"
                )
            
            # Select random Pokemon from results
            pokemon = random.choice(response.data)
            
            # Generate QTE sequence based on stats
            sequence = CatchService.calculate_qte_difficulty(pokemon['stats_total'], difficulty)
            
            # Get sprite (prefer official, fallback to default)
            sprite = pokemon.get('sprite_official') or pokemon.get('sprite_default')
            
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
        NOW INCLUDES: XP rewards for both success and failure
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
                
                # Award XP for successful catch
                xp_result = await ExperienceService.award_experience(
                    trainer_id, 
                    ExperienceService.XP_CATCH_SUCCESS
                )
                
                if existing.data:
                    message = f"You already caught {pokemon_name}! But nice catch anyway!"
                    reward_message = f"+{ExperienceService.XP_CATCH_SUCCESS} XP"
                else:
                    # Capture the Pokemon
                    capture_data = {
                        'trainer_id': trainer_id,
                        'pokemon_id': attempt.pokemon_id,
                        'nickname': None
                    }
                    supabase.table('captured_pokemon').insert(capture_data).execute()
                    
                    message = f"Congratulations! You caught {pokemon_name}!"
                    reward_message = f"+{ExperienceService.XP_CATCH_SUCCESS} XP"
                    
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
                # Failed catch - still award consolation XP
                xp_result = await ExperienceService.award_experience(
                    trainer_id, 
                    ExperienceService.XP_CATCH_FAIL
                )
                
                message = f"{pokemon_name} broke free! Try again!"
                reward_message = f"+{ExperienceService.XP_CATCH_FAIL} XP for trying"
                
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
        """
        Get list of available habitats from database
        If region is provided, only return habitats that exist in that region
        """
        try:
            query = supabase.table('pokemon').select('habitat').not_.is_('habitat', 'null')
            
            if region:
                query = query.eq('region', region.lower())
            
            response = query.execute()
            
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
    
    @staticmethod
    async def get_available_difficulties(
        region: Optional[str] = None,
        habitat: Optional[str] = None
    ) -> list:
        """
        Get list of available difficulty levels based on what Pokemon exist
        Filters by region and/or habitat if provided
        """
        try:
            query = supabase.table('pokemon').select('stats_total')
            
            if region:
                query = query.eq('region', region.lower())
            
            if habitat:
                query = query.eq('habitat', habitat.lower())
            
            response = query.execute()
            
            if not response.data:
                return []
            
            # Get all stat totals
            stat_totals = [row['stats_total'] for row in response.data]
            
            # Determine which difficulties are available
            available = []
            
            # Check each difficulty range
            if any(180 <= s <= 300 for s in stat_totals):
                available.append('weak')
            if any(301 <= s <= 400 for s in stat_totals):
                available.append('easy')
            if any(401 <= s <= 500 for s in stat_totals):
                available.append('medium')
            if any(501 <= s <= 600 for s in stat_totals):
                available.append('hard')
            if any(601 <= s <= 720 for s in stat_totals):
                available.append('legendary')
            if any(s >= 721 for s in stat_totals):
                available.append('mythical')
            
            return available
            
        except Exception as e:
            print(f"Error fetching difficulties: {e}")
            # Return all difficulties as fallback
            return ['weak', 'easy', 'medium', 'hard', 'legendary', 'mythical']


