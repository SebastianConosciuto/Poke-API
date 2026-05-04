"""
Catching service — Pokemon catching minigame logic.

Difficulty rules and helpers live in app.core.* — this service only
orchestrates database access and reward calculation.
"""

import random
from typing import List, Optional

from fastapi import HTTPException, status

from app.core.constants import ARROW_KEYS, REGIONS, Table, is_any
from app.core.difficulty import (
    DIFFICULTY_TIERS,
    difficulty_keys_in_order,
    filter_keys_by_stats,
    get_tier,
)
from app.core.logging import get_logger
from app.core.pokemon_utils import format_pokemon_name, get_sprite_url, parse_sprites
from app.database import supabase
from app.models.catch import (
    ButtonSequence,
    CatchAttemptResult,
    CatchChallenge,
    CatchResult,
    DifficultyLevel,
)
from app.services.experience_service import ExperienceService

logger = get_logger("CATCH")


class CatchService:
    """Service for the Pokemon catching minigame."""

    # ------------------------------------------------------------------
    # QTE generation
    # ------------------------------------------------------------------

    @staticmethod
    def calculate_qte_difficulty(
        stats_total: int,
        difficulty: DifficultyLevel,
    ) -> ButtonSequence:
        """Build a random QTE button sequence sized for the given tier."""
        # Prefer the tier the caller asked for; fall back to the one that
        # matches the Pokemon's stats so we never error out on bad input.
        tier = get_tier(difficulty.value) or DIFFICULTY_TIERS[2]  # medium fallback
        sequence = [random.choice(ARROW_KEYS) for _ in range(tier.buttons)]
        return ButtonSequence(
            buttons=sequence,
            time_per_button=tier.time_per_button,
            total_buttons=tier.buttons,
        )

    # ------------------------------------------------------------------
    # Random Pokemon for a challenge
    # ------------------------------------------------------------------

    @staticmethod
    async def get_random_pokemon(
        region: Optional[str],
        habitat: Optional[str],
        difficulty: DifficultyLevel,
    ) -> CatchChallenge:
        """Pick a random Pokemon matching the filters and build a QTE for it."""
        try:
            query = supabase.table(Table.POKEMON).select(
                "id, name, sprites, stats_total"
            )

            if not is_any(region):
                query = query.eq("region", region.lower())
            if not is_any(habitat):
                query = query.eq("habitat", habitat.lower())

            tier = get_tier(difficulty.value) or DIFFICULTY_TIERS[2]
            query = query.gte("stats_total", tier.min_stats).lte(
                "stats_total", tier.max_stats
            )

            response = query.execute()

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No Pokemon found matching the selected criteria",
                )

            pokemon = random.choice(response.data)
            sprites = parse_sprites(pokemon.get("sprites"))
            sprite_url = get_sprite_url(sprites, pokemon["id"])
            sequence = CatchService.calculate_qte_difficulty(
                pokemon["stats_total"], difficulty
            )

            return CatchChallenge(
                pokemon_id=pokemon["id"],
                pokemon_name=format_pokemon_name(pokemon["name"]),
                pokemon_sprite=sprite_url,
                stats_total=pokemon["stats_total"],
                sequence=sequence,
                difficulty=difficulty,
            )

        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("Error getting random Pokemon: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get random Pokemon",
            )

    # ------------------------------------------------------------------
    # Recording an attempt
    # ------------------------------------------------------------------

    @staticmethod
    async def record_catch_attempt(
        trainer_id: str,
        attempt: CatchAttemptResult,
    ) -> CatchResult:
        """Persist a catch attempt and award XP based on outcome + difficulty."""
        try:
            accuracy = (attempt.buttons_correct / attempt.total_buttons) * 100

            pokemon_response = (
                supabase.table(Table.POKEMON)
                .select("name")
                .eq("id", attempt.pokemon_id)
                .execute()
            )
            if not pokemon_response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Pokemon with ID {attempt.pokemon_id} not found",
                )

            pokemon_name = format_pokemon_name(pokemon_response.data[0]["name"])
            difficulty = attempt.difficulty or "medium"
            xp_amount = ExperienceService.get_xp_for_difficulty(
                difficulty, attempt.success
            )

            logger.info(
                "Difficulty: %s, Success: %s, XP: %s",
                difficulty,
                attempt.success,
                xp_amount,
            )

            xp_result = await ExperienceService.award_experience(trainer_id, xp_amount)

            if attempt.success:
                return await CatchService._build_success_result(
                    trainer_id=trainer_id,
                    attempt=attempt,
                    pokemon_name=pokemon_name,
                    accuracy=accuracy,
                    xp_amount=xp_amount,
                    xp_result=xp_result,
                )

            return CatchService._build_failure_result(
                attempt=attempt,
                pokemon_name=pokemon_name,
                accuracy=accuracy,
                xp_amount=xp_amount,
                xp_result=xp_result,
            )

        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("Error recording catch attempt: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to record catch attempt",
            )

    # ------------------------------------------------------------------
    # Result builders
    # ------------------------------------------------------------------

    @staticmethod
    async def _build_success_result(
        trainer_id: str,
        attempt: CatchAttemptResult,
        pokemon_name: str,
        accuracy: float,
        xp_amount: int,
        xp_result: dict,
    ) -> CatchResult:
        existing = (
            supabase.table(Table.CAPTURED_POKEMON)
            .select("id")
            .eq("trainer_id", trainer_id)
            .eq("pokemon_id", attempt.pokemon_id)
            .execute()
        )

        if existing.data:
            message = f"You already caught {pokemon_name}! But nice catch anyway!"
        else:
            supabase.table(Table.CAPTURED_POKEMON).insert(
                {
                    "trainer_id": trainer_id,
                    "pokemon_id": attempt.pokemon_id,
                    "nickname": None,
                }
            ).execute()
            message = f"Congratulations! You caught {pokemon_name}!"

        reward_message = f"+{xp_amount} XP"
        if attempt.perfect and not existing.data:
            reward_message = f"✨ PERFECT CATCH! {reward_message}"
        reward_message = CatchService._append_levelup(reward_message, xp_result)

        return CatchResult(
            success=True,
            message=message,
            pokemon_name=pokemon_name,
            accuracy=accuracy,
            perfect=attempt.perfect,
            reward_message=reward_message,
            xp_awarded=xp_result["xp_awarded"],
            new_level=xp_result["new_level"],
            leveled_up=xp_result["leveled_up"],
        )

    @staticmethod
    def _build_failure_result(
        attempt: CatchAttemptResult,
        pokemon_name: str,
        accuracy: float,
        xp_amount: int,
        xp_result: dict,
    ) -> CatchResult:
        message = f"{pokemon_name} broke free! Try again!"
        reward_message = CatchService._append_levelup(
            f"+{xp_amount} XP for trying", xp_result
        )

        return CatchResult(
            success=False,
            message=message,
            pokemon_name=pokemon_name,
            accuracy=accuracy,
            perfect=False,
            reward_message=reward_message,
            xp_awarded=xp_result["xp_awarded"],
            new_level=xp_result["new_level"],
            leveled_up=xp_result["leveled_up"],
        )

    @staticmethod
    def _append_levelup(message: str, xp_result: dict) -> str:
        """Tack a level-up summary onto a reward message if any levels were gained."""
        if xp_result.get("leveled_up"):
            return f"{message} | {' | '.join(xp_result['level_up_messages'])}"
        return message

    # ------------------------------------------------------------------
    # Filter option lookups
    # ------------------------------------------------------------------

    @staticmethod
    def get_available_regions() -> List[str]:
        """Return the canonical ordered list of regions."""
        return list(REGIONS)

    @staticmethod
    async def get_available_habitats(region: Optional[str] = None) -> List[str]:
        """Distinct habitats, optionally restricted to a region."""
        try:
            query = supabase.table(Table.POKEMON).select("habitat")
            if not is_any(region):
                query = query.eq("region", region.lower())

            response = query.execute()
            habitats = {row["habitat"] for row in response.data if row.get("habitat")}
            return sorted(habitats)

        except Exception as exc:
            logger.error("Error getting habitats: %s", exc)
            return []

    @staticmethod
    async def get_available_difficulties(
        region: Optional[str] = None,
        habitat: Optional[str] = None,
    ) -> List[str]:
        """Difficulty keys with at least one Pokemon in the region/habitat."""
        try:
            query = supabase.table(Table.POKEMON).select("stats_total")
            if not is_any(region):
                query = query.eq("region", region.lower())
            if not is_any(habitat):
                query = query.eq("habitat", habitat.lower())

            response = query.execute()
            if not response.data:
                return ["medium"]  # Sensible default if filters yield nothing.

            stats_totals = (
                row.get("stats_total", 0) for row in response.data if row.get("stats_total")
            )
            return filter_keys_by_stats(stats_totals)

        except Exception as exc:
            logger.error("Error getting difficulties: %s", exc)
            return difficulty_keys_in_order()
