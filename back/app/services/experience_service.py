"""
Experience and leveling service
"""

from typing import Dict, Any
from app.database import supabase
from fastapi import HTTPException, status


class ExperienceService:
    """Service for handling trainer experience and leveling"""
    
    # XP rewards
    XP_CATCH_SUCCESS = 30
    XP_CATCH_FAIL = 15
    
    # Level formula: 100 + (20 * level)
    BASE_XP = 100
    XP_PER_LEVEL = 20
    
    @staticmethod
    def calculate_xp_for_level(level: int) -> int:
        """Calculate XP required to reach the next level"""
        return ExperienceService.BASE_XP + (ExperienceService.XP_PER_LEVEL * level)
    
    @staticmethod
    def calculate_level_from_xp(total_xp: int) -> tuple[int, int]:
        """
        Calculate level and remaining XP from total XP
        Returns: (level, xp_in_current_level)
        """
        level = 1
        remaining_xp = total_xp
        
        while True:
            xp_needed = ExperienceService.calculate_xp_for_level(level)
            if remaining_xp < xp_needed:
                break
            remaining_xp -= xp_needed
            level += 1
            
            # Safety check to prevent infinite loops
            if level > 1000:
                break
        
        return level, remaining_xp
    
    @staticmethod
    async def award_experience(trainer_id: str, xp_amount: int) -> Dict[str, Any]:
        """
        Award experience to a trainer and handle level-ups
        Returns info about level-ups and new stats
        """
        try:
            # Get current trainer data
            response = supabase.table("trainers").select(
                "trainer_id, level, experience"
            ).eq("trainer_id", trainer_id).execute()
            
            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Trainer not found"
                )
            
            trainer = response.data[0]
            old_level = trainer.get("level", 1)
            old_xp = trainer.get("experience", 0)
            
            # Calculate new experience
            new_total_xp = old_xp + xp_amount
            new_level, xp_in_level = ExperienceService.calculate_level_from_xp(new_total_xp)
            
            # Update trainer in database
            update_response = supabase.table("trainers").update({
                "level": new_level,
                "experience": new_total_xp
            }).eq("trainer_id", trainer_id).execute()
            
            # Calculate XP needed for next level
            xp_to_next = ExperienceService.calculate_xp_for_level(new_level)
            
            # Check if leveled up
            leveled_up = new_level > old_level
            levels_gained = new_level - old_level
            
            return {
                "xp_awarded": xp_amount,
                "total_experience": new_total_xp,
                "old_level": old_level,
                "new_level": new_level,
                "leveled_up": leveled_up,
                "levels_gained": levels_gained,
                "experience_in_level": xp_in_level,
                "experience_to_next_level": xp_to_next - xp_in_level,
                "level_up_messages": [
                    f"Level Up! You reached level {level}!"
                    for level in range(old_level + 1, new_level + 1)
                ] if leveled_up else []
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to award experience: {str(e)}"
            )
    
    @staticmethod
    async def get_trainer_stats(trainer_id: str) -> Dict[str, Any]:
        """Get comprehensive trainer statistics"""
        try:
            # Get trainer data
            trainer_response = supabase.table("trainers").select(
                "trainer_id, level, experience"
            ).eq("trainer_id", trainer_id).execute()
            
            if not trainer_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Trainer not found"
                )
            
            trainer = trainer_response.data[0]
            level = trainer.get("level", 1)
            total_xp = trainer.get("experience", 0)
            
            # Calculate XP in current level
            _, xp_in_level = ExperienceService.calculate_level_from_xp(total_xp)
            xp_to_next = ExperienceService.calculate_xp_for_level(level)
            
            # Get captured Pokemon count
            captured_response = supabase.table("captured_pokemon").select(
                "pokemon_id", count="exact"
            ).eq("trainer_id", trainer_id).execute()
            
            pokemon_captured = captured_response.count or 0
            
            # Get total Pokemon count
            total_response = supabase.table("pokemon").select(
                "id", count="exact"
            ).execute()
            
            total_pokemon = total_response.count or 1025
            
            # Calculate Pokedex completion percentage
            pokedex_completion = (pokemon_captured / total_pokemon * 100) if total_pokemon > 0 else 0
            
            return {
                "trainer_id": trainer_id,
                "level": level,
                "experience": total_xp,
                "experience_in_level": xp_in_level,
                "experience_to_next_level": xp_to_next - xp_in_level,
                "pokemon_captured": pokemon_captured,
                "pokedex_completion": round(pokedex_completion, 2),
                "total_pokemon": total_pokemon
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get trainer stats: {str(e)}"
            )