"""
Tests for the habitat-inference fallback used by populate_missing_habitats.py.

These pin the type -> habitat mapping so the script's behaviour is documented
and a typo in the table fails CI rather than silently miscategorising hundreds
of Pokemon in the live DB.
"""

from __future__ import annotations

import pytest

from scripts.populate_missing_habitats import (
    DEFAULT_HABITAT,
    TYPE_TO_HABITAT,
    infer_habitat,
)


# ---------------------------------------------------------------------- #
# Mapping shape
# ---------------------------------------------------------------------- #

class TestTypeToHabitatMap:
    def test_covers_all_18_pokemon_types(self):
        """Every Gen 1-9 type must have an inference target."""
        canonical_types = {
            "normal", "fire", "water", "electric", "grass", "ice",
            "fighting", "poison", "ground", "flying", "psychic",
            "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy",
        }
        missing = canonical_types - TYPE_TO_HABITAT.keys()
        assert not missing, f"Types missing from inference map: {sorted(missing)}"

    def test_only_uses_known_habitat_keys(self):
        """Every value in the map must match a habitat the QTE backgrounds know."""
        # Mirrors front/src/constants/backgrounds.ts HABITAT_BACKGROUNDS keys.
        known_habitats = {
            "grassland", "forest", "cave", "mountain", "rare",
            "rough-terrain", "sea", "urban", "waters-edge",
        }
        for tname, hname in TYPE_TO_HABITAT.items():
            assert hname in known_habitats, (
                f"Type '{tname}' maps to unknown habitat '{hname}'"
            )

    def test_default_habitat_is_known(self):
        known = {
            "grassland", "forest", "cave", "mountain", "rare",
            "rough-terrain", "sea", "urban", "waters-edge",
        }
        assert DEFAULT_HABITAT in known


# ---------------------------------------------------------------------- #
# infer_habitat — the actual selection logic
# ---------------------------------------------------------------------- #

class TestInferHabitat:
    @pytest.mark.parametrize(
        "types,expected",
        [
            (["water"], "sea"),
            (["bug", "flying"], "forest"),       # primary type wins
            (["rock", "ground"], "rough-terrain"),
            (["fire"], "mountain"),
            (["psychic"], "urban"),
            (["normal"], "grassland"),
            (["dragon"], "rare"),
            (["dark"], "cave"),
        ],
    )
    def test_returns_inferred_habitat(self, types, expected):
        assert infer_habitat(types) == expected

    def test_empty_types_uses_default(self):
        assert infer_habitat([]) == DEFAULT_HABITAT

    def test_unknown_type_falls_through_to_secondary(self):
        """If primary type isn't mapped, scan the rest before defaulting."""
        # 'unknown' isn't in our map — should fall through to 'fire' -> mountain.
        assert infer_habitat(["unknown", "fire"]) == "mountain"

    def test_all_unknown_uses_default(self):
        assert infer_habitat(["???", "shadow"]) == DEFAULT_HABITAT

    def test_case_insensitive_lookup(self):
        """Real DB might have mixed casing; the lookup should be tolerant."""
        assert infer_habitat(["FIRE"]) == "mountain"
        assert infer_habitat(["Water"]) == "sea"
