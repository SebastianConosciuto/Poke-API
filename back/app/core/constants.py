"""
Shared constants used across services and routers.

Single source of truth for values that appear in multiple places —
arrow keys, regions, fallback type list, table names, sort fields, etc.
"""

# ----------------------------------------------------------------------
# QTE input
# ----------------------------------------------------------------------

# Only these four arrow keys are valid in the catch minigame (see CLAUDE.md).
ARROW_KEYS = ["up", "down", "left", "right"]


# ----------------------------------------------------------------------
# Pokemon regions
# ----------------------------------------------------------------------

# Hardcoded list returned by the catch router — kept here so it doesn't
# diverge from anything else that needs the canonical region list.
REGIONS = [
    "kanto",
    "johto",
    "hoenn",
    "sinnoh",
    "unova",
    "kalos",
    "alola",
    "galar",
    "paldea",
]


# ----------------------------------------------------------------------
# Pokemon types
# ----------------------------------------------------------------------

# Used as a fallback if querying the database for types fails.
FALLBACK_TYPES = [
    "normal", "fire", "water", "electric", "grass", "ice",
    "fighting", "poison", "ground", "flying", "psychic",
    "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy",
]


# ----------------------------------------------------------------------
# Database tables
# ----------------------------------------------------------------------

class Table:
    """Centralized table names so a rename touches one place."""

    TRAINERS = "trainers"
    POKEMON = "pokemon"
    CAPTURED_POKEMON = "captured_pokemon"


# ----------------------------------------------------------------------
# Pokemon list query
# ----------------------------------------------------------------------

# Valid `sort_by` values for the Pokemon list endpoint.
VALID_POKEMON_SORT_FIELDS = ["id", "name", "height", "weight", "stats_total"]

# Pagination defaults for the Pokemon list endpoint.
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 50

# Maximum number of types that can be selected for filtering at once.
MAX_TYPE_FILTERS = 2

# Total number of Pokemon assumed when the database count is unavailable.
DEFAULT_TOTAL_POKEMON = 1025

# Maximum number of rows to pull when computing distinct columns. Supabase's
# default is 1000 rows, which would silently truncate the 1025-row pokemon
# table. We raise it explicitly so SELECT DISTINCT-style queries are correct.
MAX_POKEMON_QUERY_ROWS = 1100


# ----------------------------------------------------------------------
# Sentinel values for "no filter"
# ----------------------------------------------------------------------

ANY_FILTER_VALUE = "any"


def is_any(value):
    """Return True if value is missing or the literal 'any' (case-insensitive)."""
    if not value:
        return True
    return value.lower() == ANY_FILTER_VALUE
