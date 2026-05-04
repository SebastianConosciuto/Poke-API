"""
Pokemon service — queries Pokemon data from Supabase.

The `pokemon` table is pre-populated from PokeAPI by populate_pokemon.py;
this service never touches PokeAPI at request time.
"""

from typing import List, Optional, Set

from fastapi import HTTPException, status

from app.core.constants import (
    DEFAULT_PAGE_SIZE,
    FALLBACK_TYPES,
    MAX_PAGE_SIZE,
    MAX_POKEMON_QUERY_ROWS,
    Table,
)
from app.core.difficulty import get_tier
from app.core.logging import get_logger
from app.core.pokemon_utils import (
    format_pokemon_name,
    parse_abilities,
    parse_sprites,
)
from app.database import supabase
from app.models.pokemon import (
    PokemonBasic,
    PokemonDetail,
    PokemonListResponse,
    PokemonStat,
)

logger = get_logger("POKEMON")


class PokemonService:
    """Read/write operations against the `pokemon` and `captured_pokemon` tables."""

    # ------------------------------------------------------------------
    # Filter option lookups
    # ------------------------------------------------------------------

    @staticmethod
    def get_available_types() -> List[str]:
        """All distinct Pokemon types in the database, with a hardcoded fallback."""
        try:
            response = (
                supabase.table(Table.POKEMON)
                .select("types")
                .range(0, MAX_POKEMON_QUERY_ROWS - 1)
                .execute()
            )
            types_set: Set[str] = set()
            for row in (response.data or []):
                types_set.update(row.get("types") or [])
            return sorted(types_set) if types_set else list(FALLBACK_TYPES)
        except Exception as exc:
            logger.error("Error fetching types: %s", exc)
            return list(FALLBACK_TYPES)

    @staticmethod
    def get_available_regions() -> List[str]:
        """All distinct non-null regions present in the database."""
        return PokemonService._distinct_column("region")

    @staticmethod
    def get_available_habitats() -> List[str]:
        """All distinct non-null habitats present in the database."""
        return PokemonService._distinct_column("habitat")

    @staticmethod
    def _distinct_column(column: str) -> List[str]:
        """
        SELECT DISTINCT <column> across the pokemon table.

        We deliberately do NOT use `.not_.is_(column, "null")` here. That
        postgrest filter has been observed to silently return [] in some
        Supabase environments (RLS / column-level grants). Instead we pull
        the column down and filter in Python — the column has at most ~10
        distinct values so the cost is negligible.

        We also explicitly raise the row limit; the default 1000 rows isn't
        enough for the 1025-row pokemon table.
        """
        try:
            response = (
                supabase.table(Table.POKEMON)
                .select(column)
                .range(0, MAX_POKEMON_QUERY_ROWS - 1)
                .execute()
            )
        except Exception as exc:
            logger.error("Error fetching %s: %s", column, exc)
            return []

        values = {row[column] for row in (response.data or []) if row.get(column)}
        if not values:
            logger.warning(
                "No distinct values found for pokemon.%s — table may be empty "
                "or the column may not be populated. Run populate_region_habitat.py.",
                column,
            )
        return sorted(values)

    # ------------------------------------------------------------------
    # Paginated list
    # ------------------------------------------------------------------

    @staticmethod
    async def get_pokemon_list(
        page: int = 1,
        page_size: int = DEFAULT_PAGE_SIZE,
        types: Optional[List[str]] = None,
        region: Optional[str] = None,
        habitat: Optional[str] = None,
        difficulty: Optional[str] = None,
        sort_by: str = "id",
        sort_order: str = "asc",
        trainer_id: Optional[str] = None,
        captured_only: bool = False,
    ) -> PokemonListResponse:
        """Paginated, filtered Pokemon list with `is_captured` flag per Pokemon."""
        try:
            page_size = min(page_size, MAX_PAGE_SIZE)
            offset = (page - 1) * page_size

            query = supabase.table(Table.POKEMON).select(
                "id, name, types, sprite_official, sprite_default, "
                "height, weight, stats_total",
                count="exact",
            )

            if types:
                for pokemon_type in types:
                    query = query.contains("types", [pokemon_type])
            if region:
                query = query.eq("region", region.lower())
            if habitat:
                query = query.eq("habitat", habitat.lower())

            tier = get_tier(difficulty) if difficulty else None
            if tier:
                query = query.gte("stats_total", tier.min_stats)
                # Mythical's max is 9999 sentinel — only apply upper bound when finite.
                if tier.max_stats < 9999:
                    query = query.lte("stats_total", tier.max_stats)

            captured_ids = await PokemonService._get_captured_ids(trainer_id)

            if captured_only:
                if not captured_ids:
                    return PokemonListResponse(
                        pokemon=[],
                        total=0,
                        page=page,
                        page_size=page_size,
                        has_more=False,
                        total_pages=0,
                    )
                query = query.in_("id", list(captured_ids))

            query = query.order(sort_by, desc=(sort_order != "asc"))
            query = query.range(offset, offset + page_size - 1)

            response = query.execute()
            total = response.count or 0
            pokemon_list = [
                PokemonBasic(
                    id=row["id"],
                    name=row["name"],
                    types=row["types"],
                    sprite=row["sprite_official"] or row["sprite_default"],
                    height=row["height"],
                    weight=row["weight"],
                    stats_total=row["stats_total"],
                    is_captured=row["id"] in captured_ids,
                )
                for row in (response.data or [])
            ]

            total_pages = (total + page_size - 1) // page_size if total > 0 else 0
            return PokemonListResponse(
                pokemon=pokemon_list,
                total=total,
                page=page,
                page_size=page_size,
                has_more=page < total_pages,
                total_pages=total_pages,
            )

        except Exception as exc:
            logger.error("Error fetching Pokemon list: %s", exc)
            raise

    @staticmethod
    async def _get_captured_ids(trainer_id: Optional[str]) -> Set[int]:
        """Return the set of pokemon_id values captured by trainer_id."""
        if not trainer_id:
            return set()
        response = (
            supabase.table(Table.CAPTURED_POKEMON)
            .select("pokemon_id")
            .eq("trainer_id", trainer_id)
            .execute()
        )
        return {row["pokemon_id"] for row in (response.data or [])}

    # ------------------------------------------------------------------
    # Single Pokemon detail
    # ------------------------------------------------------------------

    @staticmethod
    async def fetch_pokemon_detail(
        pokemon_id: int,
        trainer_id: Optional[str] = None,
    ) -> Optional[PokemonDetail]:
        """Detailed Pokemon info, with capture/nickname info for the current trainer."""
        try:
            response = (
                supabase.table(Table.POKEMON).select("*").eq("id", pokemon_id).execute()
            )
            if not response.data:
                return None

            row = response.data[0]
            is_captured, nickname = await PokemonService._get_capture_info(
                trainer_id, pokemon_id
            )

            return PokemonDetail(
                id=row["id"],
                name=row["name"],
                types=row["types"],
                sprites=parse_sprites(row.get("sprites")),
                height=row["height"],
                weight=row["weight"],
                stats=PokemonService._build_stats(row),
                stats_total=row["stats_total"],
                abilities=parse_abilities(row.get("abilities")),
                base_experience=row.get("base_experience"),
                is_captured=is_captured,
                nickname=nickname,
                description=row.get("description"),
            )

        except Exception as exc:
            logger.error("Error fetching Pokemon %s: %s", pokemon_id, exc)
            return None

    @staticmethod
    def _build_stats(row: dict) -> List[PokemonStat]:
        """Map flat stats_* columns to a list of PokemonStat objects."""
        return [
            PokemonStat(name="hp", base_stat=row["stats_hp"]),
            PokemonStat(name="attack", base_stat=row["stats_attack"]),
            PokemonStat(name="defense", base_stat=row["stats_defense"]),
            PokemonStat(name="special-attack", base_stat=row["stats_special_attack"]),
            PokemonStat(name="special-defense", base_stat=row["stats_special_defense"]),
            PokemonStat(name="speed", base_stat=row["stats_speed"]),
        ]

    @staticmethod
    async def _get_capture_info(
        trainer_id: Optional[str],
        pokemon_id: int,
    ) -> tuple[bool, Optional[str]]:
        """Return (is_captured, nickname) for trainer_id's row in captured_pokemon."""
        if not trainer_id:
            return False, None
        response = (
            supabase.table(Table.CAPTURED_POKEMON)
            .select("nickname")
            .eq("trainer_id", trainer_id)
            .eq("pokemon_id", pokemon_id)
            .execute()
        )
        if not response.data:
            return False, None
        return True, response.data[0].get("nickname")

    # ------------------------------------------------------------------
    # Capture / release
    # ------------------------------------------------------------------

    @staticmethod
    async def capture_pokemon(
        trainer_id: str,
        pokemon_id: int,
        nickname: Optional[str] = None,
    ) -> dict:
        """Add a row to captured_pokemon. 400 if already captured, 404 if no Pokemon."""
        pokemon_name = await PokemonService._require_pokemon_name(pokemon_id)

        existing = (
            supabase.table(Table.CAPTURED_POKEMON)
            .select("id")
            .eq("trainer_id", trainer_id)
            .eq("pokemon_id", pokemon_id)
            .execute()
        )
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You have already captured {format_pokemon_name(pokemon_name)}!",
            )

        supabase.table(Table.CAPTURED_POKEMON).insert(
            {"trainer_id": trainer_id, "pokemon_id": pokemon_id, "nickname": nickname}
        ).execute()

        return {
            "message": f"Successfully captured {format_pokemon_name(pokemon_name)}!",
            "pokemon_id": pokemon_id,
            "pokemon_name": pokemon_name,
        }

    @staticmethod
    async def release_pokemon(trainer_id: str, pokemon_id: int) -> dict:
        """Remove a row from captured_pokemon. 404 if Pokemon was never caught."""
        existing = (
            supabase.table(Table.CAPTURED_POKEMON)
            .select("id")
            .eq("trainer_id", trainer_id)
            .eq("pokemon_id", pokemon_id)
            .execute()
        )
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pokemon not found in your collection",
            )

        pokemon_name = (
            await PokemonService._lookup_pokemon_name(pokemon_id)
        ) or "Pokemon"

        supabase.table(Table.CAPTURED_POKEMON).delete().eq(
            "trainer_id", trainer_id
        ).eq("pokemon_id", pokemon_id).execute()

        return {
            "message": f"Released {format_pokemon_name(pokemon_name)}!",
            "pokemon_id": pokemon_id,
            "pokemon_name": pokemon_name,
        }

    @staticmethod
    async def _require_pokemon_name(pokemon_id: int) -> str:
        """Look up a Pokemon's name; raise 404 if it doesn't exist."""
        name = await PokemonService._lookup_pokemon_name(pokemon_id)
        if not name:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pokemon with ID {pokemon_id} not found",
            )
        return name

    @staticmethod
    async def _lookup_pokemon_name(pokemon_id: int):
        response = (
            supabase.table(Table.POKEMON)
            .select("name")
            .eq("id", pokemon_id)
            .execute()
        )
        return response.data[0]["name"] if response.data else None
