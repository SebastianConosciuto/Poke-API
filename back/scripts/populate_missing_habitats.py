#!/usr/bin/env python3
"""
Fill in missing pokemon.habitat values by inferring from each Pokemon's primary type.

Why this script exists
======================
PokeAPI's /pokemon-species endpoint exposes a `habitat` field, but it was only
populated for Generation I-II Pokemon. Most Gen III+ entries have `habitat: null`,
which is why the live diagnostic showed only 386 of 1000 Pokemon with a habitat.

Confirmed against the source API:
    https://pokeapi.co/api/v2/pokemon-species/<id>/   ->  "habitat": null
                                                          for most Gen 3+

Fix
===
For Pokemon where habitat is NULL we infer one from the Pokemon's primary type
using the canon-aligned mapping below. The mapping was chosen to keep the
habitat distribution recognisable (Water -> sea, Bug -> forest, etc.) and
balanced across the existing habitat keys used by the QTE backgrounds.

Run from the back/ directory:
    python -m scripts.populate_missing_habitats           # dry run
    python -m scripts.populate_missing_habitats --apply   # actually write

Idempotent — only updates rows where habitat is currently NULL.
"""

from __future__ import annotations

import argparse
import os
import sys
from collections import Counter
from typing import Dict, List, Optional

# Allow running both as `python -m scripts.populate_missing_habitats`
# and as a plain script.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.constants import MAX_POKEMON_QUERY_ROWS, Table  # noqa: E402
from app.database import supabase  # noqa: E402


# -------------------------------------------------------------------------- #
# Type -> habitat inference
# -------------------------------------------------------------------------- #

# Maps each Pokemon type to one of the existing habitat keys used by the
# QTE minigame's HABITAT_BACKGROUNDS. Picked to be canon-faithful:
#
#   * Water/Ice tend to live near water -> sea
#   * Bug / Grass / Poison favour vegetation -> forest / grassland
#   * Rock / Ground / Fighting are wilderness -> rough-terrain / cave / mountain
#   * Fire / Flying tend to be high-altitude -> mountain
#   * Psychic / Electric / Steel are the modern types -> urban
#   * Dragon / Fairy / Ghost are uncommon -> rare
#   * Dark prefers shadow -> cave
#   * Normal is the default -> grassland
TYPE_TO_HABITAT: Dict[str, str] = {
    "water":     "sea",
    "ice":       "mountain",
    "bug":       "forest",
    "grass":     "grassland",
    "rock":      "rough-terrain",
    "ground":    "cave",
    "fairy":     "rare",
    "dragon":    "rare",
    "ghost":     "rare",
    "fire":      "mountain",
    "flying":    "mountain",
    "psychic":   "urban",
    "electric":  "urban",
    "steel":     "urban",
    "fighting":  "rough-terrain",
    "dark":      "cave",
    "poison":    "forest",
    "normal":    "grassland",
}

# Final fallback if a Pokemon's type isn't in the map (shouldn't happen — the
# table above covers every Gen 1-9 type — but defensive).
DEFAULT_HABITAT = "grassland"


def infer_habitat(types: List[str]) -> str:
    """Pick a habitat by scanning the Pokemon's types in order."""
    if not types:
        return DEFAULT_HABITAT
    for t in types:
        habitat = TYPE_TO_HABITAT.get(t.lower())
        if habitat:
            return habitat
    return DEFAULT_HABITAT


# -------------------------------------------------------------------------- #
# DB operations
# -------------------------------------------------------------------------- #

def fetch_pokemon_missing_habitat() -> List[dict]:
    """Pull every pokemon row that has no habitat populated."""
    response = (
        supabase.table(Table.POKEMON)
        .select("id, name, types, habitat")
        .range(0, MAX_POKEMON_QUERY_ROWS - 1)
        .execute()
    )
    rows = response.data or []
    return [r for r in rows if not r.get("habitat")]


def apply_updates(updates: List[dict]) -> int:
    """Write inferred habitats back to Supabase. Returns success count."""
    success = 0
    for u in updates:
        try:
            supabase.table(Table.POKEMON).update(
                {"habitat": u["habitat"]}
            ).eq("id", u["id"]).execute()
            success += 1
        except Exception as exc:
            print(f"  [FAIL] id={u['id']} ({u['name']}): {exc}")
    return success


# -------------------------------------------------------------------------- #
# Entry point
# -------------------------------------------------------------------------- #

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually write to the database (default is dry-run).",
    )
    args = parser.parse_args()

    print("Habitat backfill — connecting to:", os.environ.get("SUPABASE_URL", "<not set>"))

    missing = fetch_pokemon_missing_habitat()
    print(f"Found {len(missing)} Pokemon with no habitat.")

    if not missing:
        print("Nothing to do.")
        return

    updates = []
    for row in missing:
        types = row.get("types") or []
        habitat = infer_habitat(types)
        updates.append({
            "id": row["id"],
            "name": row["name"],
            "habitat": habitat,
            "types": types,
        })

    # Distribution preview
    dist = Counter(u["habitat"] for u in updates)
    print("\nInferred habitat distribution:")
    for habitat, count in sorted(dist.items(), key=lambda x: -x[1]):
        print(f"  {habitat:>14s}: {count}")

    print("\nSample (first 10):")
    for u in updates[:10]:
        print(f"  #{u['id']:>4d} {u['name']:>20s}  types={u['types']}  -> {u['habitat']}")

    if not args.apply:
        print(
            f"\nDry run complete. Re-run with --apply to write {len(updates)} updates."
        )
        return

    print(f"\nApplying {len(updates)} updates...")
    success = apply_updates(updates)
    print(f"Done. {success}/{len(updates)} rows updated.")


if __name__ == "__main__":
    main()
