"""
Diagnostic tests for Bug #2: difficulty/QTE mismatch.

The user picks a difficulty, the backend should return a QTE whose buttons
and time-per-button match what's advertised in the difficulty list. We test:

  * The DifficultyTier table itself (single source of truth)
  * calculate_qte_difficulty for each tier
  * That a Pokemon selected by stats matches the requested tier
  * That get_difficulty_for_stats classifies edge cases correctly
"""

from __future__ import annotations

from typing import List

import pytest

from app.core.difficulty import (
    DIFFICULTY_TIERS,
    DifficultyTier,
    filter_keys_by_stats,
    get_difficulty_for_stats,
    get_tier,
)
from app.models.catch import DifficultyLevel
from app.services.catch_service import CatchService


# Pinned canonical tier table — duplicated here intentionally so a test fails
# if anyone tweaks the canonical table without also updating both.
#
# Ranges were rebalanced in May 2026 against the actual BST distribution
# of the populated pokemon table; see app/core/difficulty.py for rationale.
EXPECTED_TIERS: List[tuple] = [
    # (key, min, max, buttons, time, xp_success, xp_fail)
    ("weak",      0,   310, 3, 1.5, 10, 5),
    ("easy",      311, 385, 4, 1.2, 20, 10),
    ("medium",    386, 460, 5, 1.0, 30, 15),
    ("hard",      461, 525, 6, 0.8, 40, 20),
    ("legendary", 526, 595, 7, 0.6, 50, 25),
    ("mythical",  596, 9999, 8, 0.5, 60, 30),
]


# ---------------------------------------------------------------------- #
# Tier table
# ---------------------------------------------------------------------- #

class TestDifficultyTierTable:
    def test_tiers_match_design_spec(self):
        """Single source of truth must match the documented table."""
        assert len(DIFFICULTY_TIERS) == len(EXPECTED_TIERS)

        for tier, expected in zip(DIFFICULTY_TIERS, EXPECTED_TIERS):
            (key, mn, mx, buttons, time, xp_s, xp_f) = expected
            assert tier.key == key
            assert tier.min_stats == mn
            assert tier.max_stats == mx
            assert tier.buttons == buttons
            assert tier.time_per_button == pytest.approx(time)
            assert tier.xp_success == xp_s
            assert tier.xp_failure == xp_f

    def test_tiers_are_contiguous(self):
        """Adjacent tiers must abut so no stats value falls between two tiers."""
        for prev, nxt in zip(DIFFICULTY_TIERS, DIFFICULTY_TIERS[1:]):
            assert prev.max_stats + 1 == nxt.min_stats, (
                f"Gap between {prev.key} (max={prev.max_stats}) "
                f"and {nxt.key} (min={nxt.min_stats})"
            )


# ---------------------------------------------------------------------- #
# get_tier — lookup by key
# ---------------------------------------------------------------------- #

class TestGetTier:
    @pytest.mark.parametrize("key", [t[0] for t in EXPECTED_TIERS])
    def test_returns_tier_for_known_key(self, key):
        tier = get_tier(key)
        assert tier is not None
        assert tier.key == key

    def test_case_insensitive(self):
        assert get_tier("HARD") is not None
        assert get_tier("HARD").key == "hard"

    def test_returns_none_for_unknown_key(self):
        assert get_tier("ultra-mythical") is None

    def test_returns_none_for_empty_string(self):
        assert get_tier("") is None


# ---------------------------------------------------------------------- #
# get_difficulty_for_stats — classification
# ---------------------------------------------------------------------- #

class TestGetDifficultyForStats:
    @pytest.mark.parametrize(
        "stats,expected_key",
        [
            (0,    "weak"),       # absolute floor
            (175,  "weak"),       # the formerly-mythical-misclassified outlier
            (310,  "weak"),       # weak upper edge
            (311,  "easy"),       # easy lower edge
            (385,  "easy"),       # easy upper edge
            (386,  "medium"),
            (460,  "medium"),
            (461,  "hard"),
            (525,  "hard"),
            (526,  "legendary"),
            (595,  "legendary"),
            (596,  "mythical"),
            (720,  "mythical"),
            (9999, "mythical"),
        ],
    )
    def test_correct_tier_for_stats(self, stats, expected_key):
        assert get_difficulty_for_stats(stats).key == expected_key

    def test_below_lowest_clamps_to_weakest(self):
        """
        Regression test: a Pokemon with stats below all ranges (e.g. the
        stats=175 entry the diagnostic surfaced) used to fall through to
        mythical. It must now clamp to the weakest tier.
        """
        # `weak` now starts at 0 so this branch is mostly defensive — but
        # the contract is documented so we pin it.
        assert get_difficulty_for_stats(-1).key == "weak"


# ---------------------------------------------------------------------- #
# filter_keys_by_stats — used by /catch/difficulties
# ---------------------------------------------------------------------- #

class TestFilterKeysByStats:
    def test_collects_unique_keys_in_order(self):
        stats_totals = [250, 450, 250, 800, 350]
        result = filter_keys_by_stats(stats_totals)
        assert result == ["weak", "easy", "medium", "mythical"]

    def test_empty_input_returns_empty(self):
        assert filter_keys_by_stats([]) == []


# ---------------------------------------------------------------------- #
# calculate_qte_difficulty — frontend-displayed numbers
# ---------------------------------------------------------------------- #

class TestCalculateQTEDifficulty:
    @pytest.mark.parametrize(
        "level,expected_buttons,expected_time",
        [
            (DifficultyLevel.WEAK,      3, 1.5),
            (DifficultyLevel.EASY,      4, 1.2),
            (DifficultyLevel.MEDIUM,    5, 1.0),
            (DifficultyLevel.HARD,      6, 0.8),
            (DifficultyLevel.LEGENDARY, 7, 0.6),
            (DifficultyLevel.MYTHICAL,  8, 0.5),
        ],
    )
    def test_qte_matches_tier(self, level, expected_buttons, expected_time):
        """The buttons & time the backend returns must match the tier the user picked."""
        seq = CatchService.calculate_qte_difficulty(stats_total=400, difficulty=level)
        assert seq.total_buttons == expected_buttons
        assert len(seq.buttons) == expected_buttons
        assert seq.time_per_button == pytest.approx(expected_time)

    def test_buttons_are_only_arrow_keys(self):
        from app.core.constants import ARROW_KEYS
        seq = CatchService.calculate_qte_difficulty(400, DifficultyLevel.HARD)
        assert all(b in ARROW_KEYS for b in seq.buttons)

    def test_qte_independent_of_actual_stats(self):
        """
        The QTE difficulty is derived from the *requested tier*, not from the
        Pokemon's stats. This is the contract the frontend relies on.
        """
        weak_qte = CatchService.calculate_qte_difficulty(
            stats_total=900, difficulty=DifficultyLevel.WEAK
        )
        # Even though stats=900 looks mythical, asking for WEAK should give 3 buttons.
        assert weak_qte.total_buttons == 3

    def test_get_random_pokemon_uses_correct_stats_range(self, fake_supabase):
        """
        Verify the random-Pokemon query restricts stats_total to the requested
        difficulty's range — otherwise the displayed difficulty wouldn't match
        the chosen Pokemon.
        """
        captured = {}
        from .conftest import FakeQuery, FakeResponse

        def respond(query: FakeQuery) -> FakeResponse:
            captured["calls"] = list(query.calls)
            return FakeResponse(
                data=[{
                    "id": 1, "name": "bulbasaur", "stats_total": 318,
                    "sprites": {"front_default": "https://x/1.png"},
                }]
            )

        fake_supabase.set_response("pokemon", respond)

        import asyncio
        asyncio.run(CatchService.get_random_pokemon(
            region="any", habitat="any", difficulty=DifficultyLevel.EASY
        ))

        gte = [args for m, args, _ in captured["calls"] if m == "gte"]
        lte = [args for m, args, _ in captured["calls"] if m == "lte"]
        # easy = 311-385 in the rebalanced ladder
        assert ("stats_total", 311) in gte
        assert ("stats_total", 385) in lte
