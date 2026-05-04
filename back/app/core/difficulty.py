"""
Difficulty tier definitions and lookups.

Single source of truth for the catching difficulty tiers. Same shape as
the original design spec, but the stat ranges have been **rebalanced**
based on the actual BST distribution of the populated `pokemon` table.

Why we rebalanced (May 2026):
    The original ranges (weak 180-300 / easy 301-400 / medium 401-500 /
    hard 501-600 / legendary 601-720 / mythical 721+) produced a grossly
    uneven distribution against the live data:
        weak       169   easy 223   medium 355
        hard       252   legendary 0     mythical 1
    "medium" had >35% of the population while "legendary" was empty.
    The new ranges target ~150-250 Pokemon per tier and capture the long
    tail of low-stat Pokemon that previously fell through the floor.

Buttons / time / XP per tier are UNCHANGED from the original spec.
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
#
# Design rationale for the new cutoffs (real Pokemon BST landmarks in parens):
#   weak       <=310  - basics, babies (Caterpie 195, Magikarp 200, Charmander 309)
#   easy       311-385 - early evolutions (Charmeleon 405 just above)
#   medium     386-460 - mid-tier and weak fully-evolved (Raichu 485 just above)
#   hard       461-525 - most fully-evolved Pokemon (Charizard 534 just above)
#   legendary  526-595 - strong Pokemon, sub-legendaries (Salamence 600 just above)
#   mythical   596+   - pseudo-legendaries and box legendaries (Tyranitar 600,
#                       Garchomp 600, Mewtwo 680, Arceus 720)
DIFFICULTY_TIERS: List[DifficultyTier] = [
    DifficultyTier("weak",      0,   310, 3, 1.5, 10, 5),
    DifficultyTier("easy",      311, 385, 4, 1.2, 20, 10),
    DifficultyTier("medium",    386, 460, 5, 1.0, 30, 15),
    DifficultyTier("hard",      461, 525, 6, 0.8, 40, 20),
    DifficultyTier("legendary", 526, 595, 7, 0.6, 50, 25),
    DifficultyTier("mythical",  596, 9999, 8, 0.5, 60, 30),
]


# ----------------------------------------------------------------------
# Lookups
# ----------------------------------------------------------------------

# Quick-lookup dict for O(1) access by key.
_TIER_BY_KEY = {tier.key: tier for tier in DIFFICULTY_TIERS}


def get_tier(key: str) -> Optional[DifficultyTier]:
    """Return the DifficultyTier with the given key, or None if unknown."""
    return _TIER_BY_KEY.get(key.lower()) if key else None


def get_difficulty_for_stats(stats_total):
    """
    Return the DifficultyTier whose stat range contains stats_total.

    Out-of-range behaviour:
      * Below the lowest tier (now stats < 0, which is impossible in
        practice): returns the WEAKEST tier. This was previously a
        fall-through to the *highest* tier - that bug caused a Pokemon
        with stats_total=175 to be classified as mythical.
      * Above the highest tier: returns the highest (mythical) tier.
    """
    for tier in DIFFICULTY_TIERS:
        if tier.min_stats <= stats_total <= tier.max_stats:
            return tier
    if stats_total < DIFFICULTY_TIERS[0].min_stats:
        return DIFFICULTY_TIERS[0]
    return DIFFICULTY_TIERS[-1]


def difficulty_keys_in_order():
    """All tier keys, easiest to hardest."""
    return [tier.key for tier in DIFFICULTY_TIERS]


def filter_keys_by_stats(stats_totals):
    """
    Given an iterable of stats_total values, return the difficulty keys
    that have at least one Pokemon - preserving easiest-to-hardest order.
    """
    found = {get_difficulty_for_stats(stats).key for stats in stats_totals}
    return [tier.key for tier in DIFFICULTY_TIERS if tier.key in found]
