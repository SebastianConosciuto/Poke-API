"""
Experience and leveling service.

XP rewards per difficulty come from app.core.difficulty (single source of truth).
Level math lives here.
"""

from typing import Any, Dict, Tuple

from fastapi import HTTPException, status

from app.core.constants import DEFAULT_TOTAL_POKEMON, Table
from app.core.difficulty import get_tier
from app.core.logging import get_logger
from app.database import supabase

logger = get_logger("XP")

# Defaults used if a difficulty key isn't recognised. Match prior behaviour.
DEFAULT_XP_SUCCESS = 30
DEFAULT_XP_FAIL = 15

# Level-up curve: XP needed to reach the next level = BASE_XP + LEVEL * XP_PER_LEVEL
BASE_XP = 100
XP_PER_LEVEL = 20

# Defensive ceiling so the leveling loop can never run away.
MAX_LEVEL_LOOP = 1000


class ExperienceService:
    """Trainer XP, level-ups, and aggregated trainer stats."""

    # ------------------------------------------------------------------
    # XP lookups & math
    # ------------------------------------------------------------------

    @staticmethod
    def get_xp_for_difficulty(difficulty: str, success: bool) -> int:
        """XP reward for catching a Pokemon at the given difficulty/outcome."""
        tier = get_tier(difficulty)
        if tier:
            return tier.xp_success if success else tier.xp_failure

        logger.warning("Unknown difficulty '%s', using default XP", difficulty)
        return DEFAULT_XP_SUCCESS if success else DEFAULT_XP_FAIL

    @staticmethod
    def calculate_xp_for_level(level: int) -> int:
        """XP required to advance from `level` to `level + 1`."""
        return BASE_XP + (XP_PER_LEVEL * level)

    @staticmethod
    def calculate_level_from_xp(total_xp: int) -> Tuple[int, int]:
        """Convert a total XP value to (level, xp_progress_in_current_level)."""
        level = 1
        remaining = total_xp
        while level <= MAX_LEVEL_LOOP:
            needed = ExperienceService.calculate_xp_for_level(level)
            if remaining < needed:
                break
            remaining -= needed
            level += 1
        return level, remaining

    # ------------------------------------------------------------------
    # Mutations
    # ------------------------------------------------------------------

    @staticmethod
    async def award_experience(trainer_id: str, xp_amount: int) -> Dict[str, Any]:
        """Add XP to a trainer and return a summary including any level-ups."""
        try:
            trainer = ExperienceService._fetch_trainer(trainer_id)
            old_level = trainer.get("level", 1)
            old_xp = trainer.get("experience", 0)

            new_total_xp = old_xp + xp_amount
            new_level, xp_in_level = ExperienceService.calculate_level_from_xp(
                new_total_xp
            )

            logger.info(
                "Awarding %s XP to %s (was L%s/%s -> L%s/%s)",
                xp_amount, trainer_id, old_level, old_xp, new_level, new_total_xp,
            )

            ExperienceService._update_trainer_xp(
                trainer_id, level=new_level, experience=new_total_xp
            )

            xp_to_next = ExperienceService.calculate_xp_for_level(new_level)
            leveled_up = new_level > old_level

            return {
                "xp_awarded": xp_amount,
                "total_experience": new_total_xp,
                "old_level": old_level,
                "new_level": new_level,
                "leveled_up": leveled_up,
                "levels_gained": new_level - old_level,
                "experience_in_level": xp_in_level,
                "experience_to_next_level": xp_to_next - xp_in_level,
                "level_up_messages": [
                    f"Level Up! You reached level {lvl}!"
                    for lvl in range(old_level + 1, new_level + 1)
                ] if leveled_up else [],
            }

        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("Failed to award experience: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to award experience: {exc}",
            )

    @staticmethod
    def _fetch_trainer(trainer_id: str) -> Dict[str, Any]:
        """Get the trainer row or raise 404."""
        response = (
            supabase.table(Table.TRAINERS)
            .select("trainer_id, level, experience")
            .eq("trainer_id", trainer_id)
            .execute()
        )
        if not response.data:
            logger.error("Trainer not found: %s", trainer_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trainer not found",
            )
        return response.data[0]

    @staticmethod
    def _update_trainer_xp(trainer_id: str, *, level: int, experience: int) -> None:
        """
        Update the trainer's level and XP. Verifies the row actually changed —
        Supabase RLS has silently swallowed writes here before (see CLAUDE.md).
        """
        update_response = (
            supabase.table(Table.TRAINERS)
            .update({"level": level, "experience": experience})
            .eq("trainer_id", trainer_id)
            .execute()
        )

        if update_response.data:
            return

        logger.warning("Trainer update returned no data; verifying directly")
        verify = (
            supabase.table(Table.TRAINERS)
            .select("level, experience")
            .eq("trainer_id", trainer_id)
            .execute()
        )
        actual_xp = verify.data[0].get("experience", 0) if verify.data else None
        if actual_xp != experience:
            logger.error(
                "DB not updated! Expected XP=%s, got %s — possible RLS issue",
                experience, actual_xp,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update experience - possible RLS policy issue",
            )

    # ------------------------------------------------------------------
    # Aggregated stats
    # ------------------------------------------------------------------

    @staticmethod
    async def get_trainer_stats(trainer_id: str) -> Dict[str, Any]:
        """All numbers shown on the trainer dashboard."""
        try:
            trainer = ExperienceService._fetch_trainer(trainer_id)
            level = trainer.get("level", 1)
            total_xp = trainer.get("experience", 0)

            _, xp_in_level = ExperienceService.calculate_level_from_xp(total_xp)
            xp_to_next = ExperienceService.calculate_xp_for_level(level)

            captured_response = (
                supabase.table(Table.CAPTURED_POKEMON)
                .select("pokemon_id", count="exact")
                .eq("trainer_id", trainer_id)
                .execute()
            )
            pokemon_captured = captured_response.count or 0

            total_response = (
                supabase.table(Table.POKEMON)
                .select("id", count="exact")
                .execute()
            )
            total_pokemon = total_response.count or DEFAULT_TOTAL_POKEMON

            pokedex_completion = (
                (pokemon_captured / total_pokemon * 100) if total_pokemon > 0 else 0
            )

            return {
                "trainer_id": trainer_id,
                "level": level,
                "experience": total_xp,
                "experience_in_level": xp_in_level,
                "experience_to_next_level": xp_to_next - xp_in_level,
                "pokemon_captured": pokemon_captured,
                "pokedex_completion": round(pokedex_completion, 2),
                "total_pokemon": total_pokemon,
            }

        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("Failed to get trainer stats: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get trainer stats: {exc}",
            )
