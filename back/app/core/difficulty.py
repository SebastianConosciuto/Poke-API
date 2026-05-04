"""
Difficulty tier definitions and lookups.

This module is the single source of truth for the catching difficulty tiers.
It collapses the previously-duplicated tables in catch_service.py and
pokemon_service.py into one place. CLAUDE.md flags these numbers as
"design spec — do not change without asking", so they live in exactly one file.

Stats Ranges:
    180-300 (Weak):      3 buttons, 1.5s per button — 10 XP success / 5 fail
    301-400 (Easy):      4 buttons, 1.2s per button — 20 XP success / 10 fail
    401-500 (Medium):    5 buttons, 1.0s per button — 30 XP success / 15 fail
    501-600 (Hard):      6 buttons, 0.8s per button — 40 XP success / 20 fail
    601-720 (Legendary): 7 buttons, 0.6s per button — 50 XP success / 25 fail
    721+    (Mythical):  8 buttons, 0.5s per button — 60 XP success / 30 fail
"""

from dataclasses import dataclass
from typing import Iterable, List, Optional


@dataclass(frozen=True)
class DifficultyTier:
    """All numbers describing one difficulty tier."""

    key: str             # The string used in the API ("weak", "easy", ...)
    min_stats: int       # Lower bound on Pokemon.stats_total (inclusive)
    max_stats: int       # Upper bound on Pokemon.stats_total (inclusive)
    buttons: int         # Number of QTE buttons to press
    time_per_button: float  # Seconds allowed per button
    xp_success: int      # XP rewarded on a successful catch
    xp_failure: int      # XP rewarded on a failed catch (consolation)


# Ordered from easiest to hardest. Order matters — `get_difficulty_for_stats`
# walks the list in order and returns the first matching tier.
DIFFICULTY_TIERS: List[DifficultyTier] = [
    DifficultyTier("weak",      180, 300, 3, 1.5, 10, 5),
    DifficultyTier("easy",      301, 400, 4, 1.2, 20, 10),
    DifficultyTier("medium",    401, 500, 5, 1.0, 30, 15),
    DifficultyTier("hard",      501, 600, 6, 0.8, 40, 20),
    DifficultyTier("legendary", 601, 720, 7, 0.6, 50, 25),
    DifficultyTier("mythical",  721, 9999, 8, 0.5, 60, 30),
]


# ----------------------------------------------------------------------
# Lookups
# ----------------------------------------------------------------------

# Quick-lookup dict for O(1) access by key.
_TIER_BY_KEY = {tier.key: tier for tier in DIFFICULTY_TIERS}


def get_tier(key: str) -> Optional[DifficultyTier]:
    """Return the DifficultyTier with the given key, or None if unknown."""
    return _TIER_BY_KEY.get(key.lower()) if key else None


def get_difficulty_for_stats(stats_total: int) -> DifficultyTier:
    """
    Return the DifficultyTier whose stat range contains stats_total.

    Defaults to the highest tier (mythical) if stats fall above all ranges
    — this matches the previous behaviour of the if-else chain.
    """
    for tier in DIFFICULTY_TIERS:
        if tier.min_stats <= stats_total <= tier.max_stats:
            return tier
    return DIFFICULTY_TIERS[-1]


def difficulty_keys_in_order() -> List[str]:
    """All tier keys, easiest to hardest."""
    return [tier.key for tier in DIFFICULTY_TIERS]


def filter_keys_by_stats(stats_totals: Iterable[int]) -> List[str]:
    """
    Given an iterable of stats_total values, return the difficulty keys
    that have at least one Pokemon — preserving easiest-to-hardest order.
    """
    found = {get_difficulty_for_stats(stats).key for stats in stats_totals}
    return [tier.key for tier in DIFFICULTY_TIERS if tier.key in found]
