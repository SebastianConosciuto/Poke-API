"""
Experience and leveling service
UPDATED: Difficulty-based XP rewards
"""

from typing import Dict, Any
from app.database import supabase
from fastapi import HTTPException, status


class ExperienceService:
    """Service for handling trainer experience and leveling"""
    
    # XP rewards based on difficulty
    # Higher difficulty = More XP reward
    XP_REWARDS = {
        "weak": {"success": 10, "fail": 5},
        "easy": {"success": 20, "fail": 10},
        "medium": {"success": 30, "fail": 15},
        "hard": {"success": 40, "fail": 20},
        "legendary": {"success": 50, "fail": 25},
        "mythical": {"success": 60, "fail": 30},
    }
    
    # Default XP (fallback if difficulty not found)
    DEFAULT_XP_SUCCESS = 30
    DEFAULT_XP_FAIL = 15
    
    # Level formula: 100 + (20 * level)
    BASE_XP = 100
    XP_PER_LEVEL = 20
    
    @staticmethod
    def get_xp_for_difficulty(difficulty: str, success: bool) -> int:
        """
        Get XP reward based on difficulty and success/failure
        
        Args:
            difficulty: The difficulty level (weak, easy, medium, hard, legendary, mythical)
            success: Whether the catch was successful
            
        Returns:
            XP amount to award
        """
        difficulty_lower = difficulty.lower()
        
        if difficulty_lower in ExperienceService.XP_REWARDS:
            rewards = ExperienceService.XP_REWARDS[difficulty_lower]
            return rewards["success"] if success else rewards["fail"]
        
        # Fallback to default values
        print(f"[XP] Warning: Unknown difficulty '{difficulty}', using default XP")
        return ExperienceService.DEFAULT_XP_SUCCESS if success else ExperienceService.DEFAULT_XP_FAIL
    
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
            print(f"[XP] Fetching trainer data for: {trainer_id}")
            response = supabase.table("trainers").select(
                "trainer_id, level, experience"
            ).eq("trainer_id", trainer_id).execute()
            
            if not response.data:
                print(f"[XP] ERROR: Trainer not found: {trainer_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Trainer not found"
                )
            
            trainer = response.data[0]
            old_level = trainer.get("level", 1)
            old_xp = trainer.get("experience", 0)
            
            print(f"[XP] Current stats - Level: {old_level}, XP: {old_xp}")
            
            # Calculate new experience
            new_total_xp = old_xp + xp_amount
            new_level, xp_in_level = ExperienceService.calculate_level_from_xp(new_total_xp)
            
            print(f"[XP] Awarding {xp_amount} XP -> New total: {new_total_xp}, New level: {new_level}")
            
            # Update trainer in database
            update_data = {
                "level": new_level,
                "experience": new_total_xp
            }
            print(f"[XP] Updating database with: {update_data}")
            
            update_response = supabase.table("trainers").update(
                update_data
            ).eq("trainer_id", trainer_id).execute()
            
            # Verify the update succeeded
            if not update_response.data:
                print(f"[XP] WARNING: Update returned no data!")
                print(f"[XP] Response: {update_response}")
                # Try to verify the data
                verify_response = supabase.table("trainers").select(
                    "level, experience"
                ).eq("trainer_id", trainer_id).execute()
                
                if verify_response.data:
                    actual_xp = verify_response.data[0].get("experience", 0)
                    if actual_xp != new_total_xp:
                        print(f"[XP] ERROR: Database not updated! Expected {new_total_xp}, got {actual_xp}")
                        print(f"[XP] This is likely a Row Level Security (RLS) issue!")
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to update experience - possible RLS policy issue"
                        )
            else:
                print(f"[XP] Update successful! Response: {update_response.data}")
            
            # Calculate XP needed for next level
            xp_to_next = ExperienceService.calculate_xp_for_level(new_level)
            
            # Check if leveled up
            leveled_up = new_level > old_level
            levels_gained = new_level - old_level
            
            if leveled_up:
                print(f"[XP] LEVEL UP! {old_level} -> {new_level}")
            
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
            print(f"[XP] EXCEPTION: {str(e)}")
            import traceback
            traceback.print_exc()
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