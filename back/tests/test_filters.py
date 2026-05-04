"""
Diagnostic tests for Bug #1: Pokedex/Catch filter dropdowns are empty.

We exercise PokemonService.get_available_regions / get_available_habitats
and CatchService.get_available_habitats with various data shapes to find
where things break.
"""

from __future__ import annotations

import pytest

from app.services.catch_service import CatchService
from app.services.pokemon_service import PokemonService

from .conftest import FakeQuery, FakeResponse, FakeSupabase


def _calls_for_method(query: FakeQuery, method: str) -> list:
    """Return the (args, kwargs) tuples for a given method on a query."""
    return [(args, kwargs) for m, args, kwargs in query.calls if m == method]


# ---------------------------------------------------------------------- #
# Pokemon /regions endpoint
# ---------------------------------------------------------------------- #

class TestGetAvailableRegions:
    def test_returns_distinct_regions_when_data_present(self, fake_supabase: FakeSupabase):
        fake_supabase.set_response(
            "pokemon",
            [
                {"region": "kanto"},
                {"region": "kanto"},
                {"region": "johto"},
                {"region": "hoenn"},
            ],
        )

        result = PokemonService.get_available_regions()

        assert result == ["hoenn", "johto", "kanto"]

    def test_returns_empty_list_when_no_data(self, fake_supabase: FakeSupabase):
        fake_supabase.set_response("pokemon", [])

        assert PokemonService.get_available_regions() == []

    def test_skips_null_region_values(self, fake_supabase: FakeSupabase):
        fake_supabase.set_response(
            "pokemon",
            [
                {"region": "kanto"},
                {"region": None},
                {"region": ""},
                {"region": "johto"},
            ],
        )

        assert PokemonService.get_available_regions() == ["johto", "kanto"]

    def test_query_uses_explicit_row_range(self, fake_supabase: FakeSupabase):
        """
        We deliberately raise the row range above Supabase's 1000-row default
        and filter nulls in Python (since postgrest's not_.is_ has been
        observed to silently swallow rows in some Supabase configurations).
        """
        fake_supabase.set_response("pokemon", [{"region": "kanto"}])

        PokemonService.get_available_regions()

        query = fake_supabase.queries["pokemon"][-1]
        select_calls = _calls_for_method(query, "select")
        assert select_calls and select_calls[0][0] == ("region",)
        range_calls = _calls_for_method(query, "range")
        assert range_calls, "Expected an explicit .range() call"
        start, end = range_calls[0][0]
        assert end >= 1024, f"Expected end >= 1024 (Pokemon table size), got {end}"

    def test_returns_empty_when_supabase_raises(self, fake_supabase: FakeSupabase):
        def raise_response(_: FakeQuery) -> FakeResponse:
            raise RuntimeError("DB down")

        fake_supabase.set_response("pokemon", raise_response)

        assert PokemonService.get_available_regions() == []


# ---------------------------------------------------------------------- #
# Pokemon /habitats endpoint
# ---------------------------------------------------------------------- #

class TestGetAvailableHabitats:
    def test_returns_distinct_habitats(self, fake_supabase: FakeSupabase):
        fake_supabase.set_response(
            "pokemon",
            [
                {"habitat": "grassland"},
                {"habitat": "forest"},
                {"habitat": "grassland"},
                {"habitat": "cave"},
            ],
        )

        assert PokemonService.get_available_habitats() == ["cave", "forest", "grassland"]

    def test_returns_empty_when_table_empty(self, fake_supabase: FakeSupabase):
        fake_supabase.set_response("pokemon", [])
        assert PokemonService.get_available_habitats() == []


# ---------------------------------------------------------------------- #
# Pokemon /types endpoint
# ---------------------------------------------------------------------- #

class TestGetAvailableTypes:
    def test_returns_unique_types_from_arrays(self, fake_supabase: FakeSupabase):
        fake_supabase.set_response(
            "pokemon",
            [
                {"types": ["grass", "poison"]},
                {"types": ["fire"]},
                {"types": ["grass"]},
            ],
        )

        assert PokemonService.get_available_types() == ["fire", "grass", "poison"]

    def test_returns_fallback_when_no_data(self, fake_supabase: FakeSupabase):
        """Empty table should fall back to the hardcoded type list, not [].

        The frontend renders type-filter chips from this list — an empty
        response would mean no type chips at all, which is what users were
        reporting in the Pokedex filter UI.
        """
        fake_supabase.set_response("pokemon", [])

        result = PokemonService.get_available_types()
        assert "fire" in result and "water" in result and len(result) >= 18

    def test_handles_rows_with_missing_types_field(self, fake_supabase: FakeSupabase):
        """Defensive: rows missing 'types' shouldn't crash the lookup."""
        fake_supabase.set_response(
            "pokemon",
            [
                {"types": ["grass"]},
                {"types": None},
                {},  # field absent entirely
                {"types": ["fire"]},
            ],
        )

        result = PokemonService.get_available_types()
        assert "grass" in result and "fire" in result


# ---------------------------------------------------------------------- #
# Catch /habitats endpoint
# ---------------------------------------------------------------------- #

class TestCatchGetAvailableHabitats:
    @pytest.mark.asyncio
    async def test_returns_unique_sorted_habitats(self, fake_supabase: FakeSupabase):
        fake_supabase.set_response(
            "pokemon",
            [
                {"habitat": "grassland"},
                {"habitat": "cave"},
                {"habitat": "grassland"},
                {"habitat": None},
            ],
        )

        result = await CatchService.get_available_habitats(region="any")

        assert result == ["cave", "grassland"]

    @pytest.mark.asyncio
    async def test_filters_by_region(self, fake_supabase: FakeSupabase):
        captured = {}

        def respond(query: FakeQuery) -> FakeResponse:
            captured["calls"] = list(query.calls)
            return FakeResponse(data=[{"habitat": "grassland"}])

        fake_supabase.set_response("pokemon", respond)

        await CatchService.get_available_habitats(region="kanto")

        eq_calls = [args for m, args, _ in captured["calls"] if m == "eq"]
        assert ("region", "kanto") in eq_calls

    @pytest.mark.asyncio
    async def test_any_region_skips_filter(self, fake_supabase: FakeSupabase):
        captured = {}

        def respond(query: FakeQuery) -> FakeResponse:
            captured["calls"] = list(query.calls)
            return FakeResponse(data=[{"habitat": "grassland"}])

        fake_supabase.set_response("pokemon", respond)

        await CatchService.get_available_habitats(region="any")

        eq_calls = [args for m, args, _ in captured["calls"] if m == "eq"]
        assert not any(a[0] == "region" for a in eq_calls)


# ---------------------------------------------------------------------- #
# Catch /difficulties endpoint
# ---------------------------------------------------------------------- #

class TestCatchGetAvailableDifficulties:
    @pytest.mark.asyncio
    async def test_returns_tier_keys_in_order(self, fake_supabase: FakeSupabase):
        fake_supabase.set_response(
            "pokemon",
            [
                {"stats_total": 250},  # weak
                {"stats_total": 450},  # medium
                {"stats_total": 800},  # mythical
            ],
        )

        result = await CatchService.get_available_difficulties()

        assert result == ["weak", "medium", "mythical"]

    @pytest.mark.asyncio
    async def test_returns_medium_default_if_no_data(self, fake_supabase: FakeSupabase):
        fake_supabase.set_response("pokemon", [])
        assert await CatchService.get_available_difficulties() == ["medium"]

    @pytest.mark.asyncio
    async def test_skips_rows_with_none_stats(self, fake_supabase: FakeSupabase):
        fake_supabase.set_response(
            "pokemon",
            [
                {"stats_total": 350},
                {"stats_total": None},
                {"stats_total": 0},
            ],
        )

        result = await CatchService.get_available_difficulties()
        assert "easy" in result
