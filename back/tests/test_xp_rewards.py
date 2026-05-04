"""
Diagnostic tests for Bug #3: XP rewards not appearing in dashboard.

We trace the flow: catch_service.record_catch_attempt -> award_experience ->
trainer table update. Then we trace the read flow: get_trainer_stats reads
the same data. The bugs we look for:

  * Trainer table update silently failing (RLS-style)
  * XP award response shape mismatched with what frontend expects
  * Stats endpoint returning stale/wrong values after an update
"""

from __future__ import annotations

from typing import Any, Dict, List

import pytest

from app.models.catch import CatchAttemptResult
from app.services.catch_service import CatchService
from app.services.experience_service import ExperienceService

from .conftest import FakeQuery, FakeResponse, FakeSupabase


# ---------------------------------------------------------------------- #
# Stateful fake — simulates a trainers table that actually persists writes.
# ---------------------------------------------------------------------- #

class StatefulTrainerStore:
    """
    Pretends to be the `trainers` table so reads-after-writes return updated
    values. Required for the catch flow integration tests below.
    """

    def __init__(self, initial: Dict[str, Dict[str, Any]]):
        self.rows = {tid: dict(row) for tid, row in initial.items()}
        self.update_calls: List[Dict[str, Any]] = []

    def __call__(self, query: FakeQuery) -> FakeResponse:
        method_names = [m for m, _, _ in query.calls]

        # Find the .eq("trainer_id", X) condition
        trainer_id = None
        for method, args, _ in query.calls:
            if method == "eq" and args and args[0] == "trainer_id":
                trainer_id = args[1]

        # Update path
        if "update" in method_names:
            update_data = next(args[0] for m, args, _ in query.calls if m == "update")
            self.update_calls.append({"trainer_id": trainer_id, "data": update_data})
            if trainer_id and trainer_id in self.rows:
                self.rows[trainer_id].update(update_data)
                return FakeResponse(data=[self.rows[trainer_id]])
            return FakeResponse(data=[])

        # Select path
        if trainer_id and trainer_id in self.rows:
            return FakeResponse(data=[dict(self.rows[trainer_id])])
        return FakeResponse(data=[])


# ---------------------------------------------------------------------- #
# XP table lookup
# ---------------------------------------------------------------------- #

class TestXPForDifficulty:
    @pytest.mark.parametrize(
        "difficulty,success,expected",
        [
            ("weak", True, 10),
            ("weak", False, 5),
            ("easy", True, 20),
            ("easy", False, 10),
            ("medium", True, 30),
            ("medium", False, 15),
            ("hard", True, 40),
            ("hard", False, 20),
            ("legendary", True, 50),
            ("legendary", False, 25),
            ("mythical", True, 60),
            ("mythical", False, 30),
        ],
    )
    def test_xp_matches_design_spec(self, difficulty, success, expected):
        assert ExperienceService.get_xp_for_difficulty(difficulty, success) == expected

    def test_unknown_difficulty_falls_back_to_default(self):
        assert ExperienceService.get_xp_for_difficulty("???", True) == 30
        assert ExperienceService.get_xp_for_difficulty("???", False) == 15

    def test_difficulty_is_case_insensitive(self):
        assert ExperienceService.get_xp_for_difficulty("HARD", True) == 40


# ---------------------------------------------------------------------- #
# Level / XP math
# ---------------------------------------------------------------------- #

class TestLevelMath:
    def test_calculate_xp_for_level(self):
        # Formula: 100 + (20 * level)
        assert ExperienceService.calculate_xp_for_level(1) == 120
        assert ExperienceService.calculate_xp_for_level(5) == 200

    def test_level_from_xp_starting(self):
        # 0 XP => level 1, 0 progress
        assert ExperienceService.calculate_level_from_xp(0) == (1, 0)

    def test_level_from_xp_partial(self):
        # 50 XP at level 1 (need 120 to advance) => level 1, 50 progress
        assert ExperienceService.calculate_level_from_xp(50) == (1, 50)

    def test_level_from_xp_advances(self):
        # 120 XP advances to level 2 with 0 progress
        assert ExperienceService.calculate_level_from_xp(120) == (2, 0)

    def test_level_from_xp_double_advance(self):
        # 120 + 140 = 260 XP advances to level 3 with 0 progress
        assert ExperienceService.calculate_level_from_xp(260) == (3, 0)


# ---------------------------------------------------------------------- #
# award_experience — the actual write
# ---------------------------------------------------------------------- #

class TestAwardExperience:
    @pytest.mark.asyncio
    async def test_persists_xp_to_trainer_row(self, fake_supabase: FakeSupabase):
        store = StatefulTrainerStore(
            {"trainer-A": {"trainer_id": "trainer-A", "level": 1, "experience": 0}}
        )
        fake_supabase.set_response("trainers", store)

        result = await ExperienceService.award_experience("trainer-A", 30)

        # Row should reflect the new XP
        assert store.rows["trainer-A"]["experience"] == 30
        assert store.rows["trainer-A"]["level"] == 1
        # Result envelope reflects the same numbers
        assert result["xp_awarded"] == 30
        assert result["total_experience"] == 30
        assert result["leveled_up"] is False

    @pytest.mark.asyncio
    async def test_levels_up_when_threshold_crossed(self, fake_supabase: FakeSupabase):
        store = StatefulTrainerStore(
            {"trainer-A": {"trainer_id": "trainer-A", "level": 1, "experience": 100}}
        )
        fake_supabase.set_response("trainers", store)

        # Need 120 XP to hit level 2; 100 + 30 = 130 => level 2 with 10 over
        result = await ExperienceService.award_experience("trainer-A", 30)

        assert result["leveled_up"] is True
        assert result["new_level"] == 2
        assert store.rows["trainer-A"]["level"] == 2

    @pytest.mark.asyncio
    async def test_raises_500_when_update_silently_fails(self, fake_supabase: FakeSupabase):
        """
        If the update returns no data and verification shows the value didn't
        change (RLS scenario), award_experience must raise — silent failure
        was the bug source CLAUDE.md warns about.
        """
        from fastapi import HTTPException

        # Custom responder: returns initial data on select, but update returns
        # empty data AND the post-update verify still shows the OLD value.
        rows = {"trainer-A": {"trainer_id": "trainer-A", "level": 1, "experience": 50}}

        def respond(query: FakeQuery) -> FakeResponse:
            method_names = [m for m, _, _ in query.calls]
            if "update" in method_names:
                # Simulate RLS silently swallowing the write.
                return FakeResponse(data=[])
            return FakeResponse(data=[dict(rows["trainer-A"])])

        fake_supabase.set_response("trainers", respond)

        with pytest.raises(HTTPException) as exc_info:
            await ExperienceService.award_experience("trainer-A", 30)

        assert exc_info.value.status_code == 500
        assert "RLS" in exc_info.value.detail or "experience" in exc_info.value.detail


# ---------------------------------------------------------------------- #
# Full catch attempt flow — XP must end up on the trainer
# ---------------------------------------------------------------------- #

class TestCatchAttemptAwardsXP:
    @pytest.mark.asyncio
    async def test_successful_catch_increases_xp(self, fake_supabase: FakeSupabase):
        # The flow touches three tables. Wire them up:
        fake_supabase.set_response("pokemon", [{"name": "pikachu"}])
        # captured_pokemon: empty so this counts as a fresh capture
        fake_supabase.set_response("captured_pokemon", FakeResponse(data=[]))
        trainer_store = StatefulTrainerStore(
            {"trainer-1": {"trainer_id": "trainer-1", "level": 1, "experience": 0}}
        )
        fake_supabase.set_response("trainers", trainer_store)

        result = await CatchService.record_catch_attempt(
            trainer_id="trainer-1",
            attempt=CatchAttemptResult(
                pokemon_id=25,
                success=True,
                buttons_correct=5,
                total_buttons=5,
                time_taken=4.0,
                perfect=False,
                difficulty="medium",
            ),
        )

        # Trainer should now have 30 XP (medium success = 30)
        assert trainer_store.rows["trainer-1"]["experience"] == 30
        # And the response surfaces that
        assert result.xp_awarded == 30
        assert result.success is True

    @pytest.mark.asyncio
    async def test_failed_catch_still_awards_consolation_xp(self, fake_supabase: FakeSupabase):
        fake_supabase.set_response("pokemon", [{"name": "pikachu"}])
        trainer_store = StatefulTrainerStore(
            {"trainer-1": {"trainer_id": "trainer-1", "level": 1, "experience": 0}}
        )
        fake_supabase.set_response("trainers", trainer_store)

        result = await CatchService.record_catch_attempt(
            trainer_id="trainer-1",
            attempt=CatchAttemptResult(
                pokemon_id=25,
                success=False,
                buttons_correct=2,
                total_buttons=5,
                time_taken=4.0,
                perfect=False,
                difficulty="medium",
            ),
        )

        # Failure still awards half (15 XP)
        assert trainer_store.rows["trainer-1"]["experience"] == 15
        assert result.success is False
        assert result.xp_awarded == 15


# ---------------------------------------------------------------------- #
# Trainer stats endpoint — what the dashboard reads back
# ---------------------------------------------------------------------- #

class TestGetTrainerStats:
    @pytest.mark.asyncio
    async def test_returns_xp_after_award(self, fake_supabase: FakeSupabase):
        """End-to-end: catch -> award -> stats should reflect the new XP."""
        # Trainer storage
        trainer_store = StatefulTrainerStore(
            {"trainer-1": {"trainer_id": "trainer-1", "level": 1, "experience": 0}}
        )
        fake_supabase.set_response("trainers", trainer_store)
        # captured_pokemon table: 3 captures so far
        fake_supabase.set_response(
            "captured_pokemon",
            FakeResponse(
                data=[{"pokemon_id": 1}, {"pokemon_id": 2}, {"pokemon_id": 3}],
                count=3,
            ),
        )
        # pokemon table: 1025 total
        fake_supabase.set_response(
            "pokemon",
            FakeResponse(data=[{"id": 1}], count=1025),
        )

        # Award 50 XP
        await ExperienceService.award_experience("trainer-1", 50)
        # Then read the stats back
        stats = await ExperienceService.get_trainer_stats("trainer-1")

        assert stats["experience"] == 50
        assert stats["pokemon_captured"] == 3
        assert stats["total_pokemon"] == 1025

    @pytest.mark.asyncio
    async def test_pokedex_completion_percentage(self, fake_supabase: FakeSupabase):
        trainer_store = StatefulTrainerStore(
            {"t": {"trainer_id": "t", "level": 1, "experience": 0}}
        )
        fake_supabase.set_response("trainers", trainer_store)
        fake_supabase.set_response(
            "captured_pokemon",
            FakeResponse(data=[{"pokemon_id": 1}, {"pokemon_id": 2}], count=2),
        )
        fake_supabase.set_response("pokemon", FakeResponse(data=[], count=200))

        stats = await ExperienceService.get_trainer_stats("t")

        assert stats["pokedex_completion"] == 1.0  # 2/200 = 1%
