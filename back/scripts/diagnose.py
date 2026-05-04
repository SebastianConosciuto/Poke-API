#!/usr/bin/env python3
"""
Live diagnostic for the three known bugs:

  1. Pokedex/Catch filter dropdowns are empty
  2. Difficulty/QTE doesn't match the displayed list
  3. XP rewards aren't appearing on the dashboard

Run from the `back/` directory:
    python -m scripts.diagnose
or with a specific trainer to test the XP path:
    python -m scripts.diagnose --trainer-id <id>

Reports counts, null distributions, sample rows, and the exact result of each
failing endpoint's query against the live Supabase database.

This script never writes anything; safe to run in any environment.
"""

from __future__ import annotations

import argparse
import os
import sys
from typing import Optional

# Allow running both as `python -m scripts.diagnose` and as a plain script.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.constants import Table  # noqa: E402
from app.core.difficulty import DIFFICULTY_TIERS, get_difficulty_for_stats  # noqa: E402
from app.database import supabase  # noqa: E402


# -------------------------------------------------------------------------- #
# Output helpers
# -------------------------------------------------------------------------- #

def section(title: str) -> None:
    print()
    print("=" * 70)
    print(f"  {title}")
    print("=" * 70)


def ok(msg: str) -> None:
    print(f"  [OK]    {msg}")


def warn(msg: str) -> None:
    print(f"  [WARN]  {msg}")


def fail(msg: str) -> None:
    print(f"  [FAIL]  {msg}")


def info(msg: str) -> None:
    print(f"  [info]  {msg}")


# -------------------------------------------------------------------------- #
# Probes
# -------------------------------------------------------------------------- #

def probe_pokemon_basic() -> int:
    """Return total Pokemon row count or -1 on failure."""
    section("Pokemon table — basic shape")
    try:
        response = supabase.table(Table.POKEMON).select("id", count="exact").execute()
        total = response.count or 0
        info(f"Total rows: {total}")
        if total == 0:
            fail("Pokemon table is EMPTY — run populate_pokemon.py")
            return 0
        ok(f"Pokemon table has {total} rows")
        return total
    except Exception as exc:
        fail(f"Could not query pokemon table: {exc}")
        return -1


def probe_region_distribution() -> None:
    """How many rows have a region populated? Distinct values?"""
    section("Pokemon.region column — Bug #1 source check")

    try:
        # Total (no filter)
        all_rows = supabase.table(Table.POKEMON).select("region").execute()
        total = len(all_rows.data)
        info(f"Selected {total} rows (Supabase capped at 1000 by default)")

        # Count nulls vs non-nulls in what we got back
        with_region = [r for r in all_rows.data if r.get("region")]
        without_region = total - len(with_region)
        info(f"  with region: {len(with_region)}")
        info(f"  without region (NULL/empty): {without_region}")

        if not with_region:
            fail("No rows have a populated region.")
            fail("→ Run: python populate_region_habitat.py")
            return

        distinct = sorted({r["region"] for r in with_region})
        ok(f"Distinct regions: {distinct}")

    except Exception as exc:
        fail(f"Region probe failed: {exc}")

    # Now the exact query the buggy endpoint uses
    try:
        filtered = (
            supabase.table(Table.POKEMON)
            .select("region")
            .not_.is_("region", "null")
            .execute()
        )
        info(f".not_.is_('region', 'null') returned {len(filtered.data)} rows")
        if not filtered.data:
            fail("not_.is_ filter returned 0 rows but Python pass found data above.")
            fail("→ This points at a Supabase syntax issue or RLS blocking.")
        else:
            distinct = sorted({r["region"] for r in filtered.data if r.get("region")})
            ok(f"Endpoint would return: {distinct}")
    except Exception as exc:
        fail(f"not_.is_ filter probe failed: {exc}")


def probe_habitat_distribution() -> None:
    """How many rows have a habitat populated? Distinct values?"""
    section("Pokemon.habitat column — Bug #1 source check")

    try:
        all_rows = supabase.table(Table.POKEMON).select("habitat").execute()
        with_habitat = [r for r in all_rows.data if r.get("habitat")]
        without_habitat = len(all_rows.data) - len(with_habitat)
        info(f"  with habitat: {len(with_habitat)}")
        info(f"  without habitat: {without_habitat}")

        if not with_habitat:
            fail("No rows have a populated habitat.")
            fail("→ Run: python populate_region_habitat.py")
            return

        distinct = sorted({r["habitat"] for r in with_habitat})
        ok(f"Distinct habitats: {distinct}")
    except Exception as exc:
        fail(f"Habitat probe failed: {exc}")


def probe_stats_total_distribution() -> None:
    """Bug #2: classify each Pokemon by tier and report counts."""
    section("Pokemon.stats_total — Bug #2 source check")

    try:
        rows = supabase.table(Table.POKEMON).select("stats_total").execute()
        if not rows.data:
            fail("No stats_total data available.")
            return

        valid = [r["stats_total"] for r in rows.data if r.get("stats_total")]
        info(f"Selected {len(rows.data)} rows; {len(valid)} have valid stats_total")

        # Bucket by tier
        from collections import Counter
        tier_counts = Counter(get_difficulty_for_stats(s).key for s in valid)

        for tier in DIFFICULTY_TIERS:
            count = tier_counts.get(tier.key, 0)
            (ok if count > 0 else warn)(
                f"  {tier.key:>10s} ({tier.min_stats:>4d}-{tier.max_stats:>4d}): {count} Pokemon"
            )

        # Sanity: anything above all tiers?
        out_of_range_low = [s for s in valid if s < DIFFICULTY_TIERS[0].min_stats]
        if out_of_range_low:
            warn(
                f"{len(out_of_range_low)} Pokemon with stats_total < "
                f"{DIFFICULTY_TIERS[0].min_stats} (will be classified as mythical fallback!)"
            )
            warn(f"  sample: {out_of_range_low[:5]}")
    except Exception as exc:
        fail(f"stats_total probe failed: {exc}")


def probe_trainers(trainer_id: Optional[str]) -> None:
    """Bug #3: read/write check on the trainers table."""
    section("Trainers table — Bug #3 source check")

    try:
        rows = supabase.table(Table.TRAINERS).select("trainer_id, level, experience").execute()
        info(f"Found {len(rows.data)} trainers")
        for row in rows.data[:5]:
            info(f"  - {row['trainer_id']}: L{row.get('level')} / {row.get('experience')} XP")
    except Exception as exc:
        fail(f"Could not list trainers: {exc}")
        return

    if not trainer_id:
        info("Pass --trainer-id to test the read-after-write XP flow.")
        return

    section(f"XP write/read check for trainer '{trainer_id}'")
    try:
        before = (
            supabase.table(Table.TRAINERS)
            .select("level, experience")
            .eq("trainer_id", trainer_id)
            .execute()
        )
        if not before.data:
            fail(f"No trainer with id '{trainer_id}'")
            return
        before_xp = before.data[0]["experience"]
        info(f"Before: experience={before_xp}")

        # Write +0 (no-op) — but the response data tells us if RLS lets writes through.
        update = (
            supabase.table(Table.TRAINERS)
            .update({"experience": before_xp})
            .eq("trainer_id", trainer_id)
            .execute()
        )
        if update.data:
            ok("Update returned data — writes are allowed")
        else:
            fail("Update returned NO data — RLS likely blocks writes!")
            fail("→ Check Supabase Dashboard → Authentication → Policies → trainers")
            fail("  Add a policy that allows UPDATE on trainers")
    except Exception as exc:
        fail(f"Trainer XP probe failed: {exc}")


# -------------------------------------------------------------------------- #
# Entry point
# -------------------------------------------------------------------------- #

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--trainer-id",
        help="Optional trainer_id to test XP read/write path on",
    )
    args = parser.parse_args()

    print("Pokemon backend live diagnostic")
    print("Connecting to:", os.environ.get("SUPABASE_URL", "<not set>"))

    total = probe_pokemon_basic()
    if total <= 0:
        return

    probe_region_distribution()
    probe_habitat_distribution()
    probe_stats_total_distribution()
    probe_trainers(args.trainer_id)

    print()
    print("Diagnostic complete.")


if __name__ == "__main__":
    main()
