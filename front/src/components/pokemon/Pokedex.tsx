/**
 * Pokedex — page-level component.
 *
 * Now responsible only for: data orchestration (filters/list/types/regions/
 * habitats), navigation, modal state. The filter UI, the grid UI, and the
 * infinite scroll observer all live in dedicated modules.
 */

import { Alert, Container } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  PageContainer,
  PageHeader,
  PixelButton,
} from '../common';
import { logout } from '../../features/auth/authSlice';
import {
  clearFilters,
  fetchHabitats,
  fetchMorePokemon,
  fetchPokemonList,
  fetchRegions,
  fetchTypes,
  setCapturedFilter,
  setDifficultyFilter,
  setHabitatFilter,
  setRegionFilter,
  setSortBy,
  setSortOrder,
  setTypeFilter,
} from '../../features/pokemon/pokemonSlice';
import { useInfiniteScroll } from '../../hooks';
import type { PokemonBasic, PokemonListParams } from '../../services/pokemonService';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import PokedexFilters from './pokedex/PokedexFilters';
import PokedexGrid from './pokedex/PokedexGrid';
import PokemonDetailModal from './PokemonDetailModal';

const MAX_TYPE_FILTERS = 2;
const PAGE_SIZE = 20;

interface PokedexFilterState {
  types: string[];
  region: string | null;
  habitat: string | null;
  difficulty: string | null;
  sortBy: 'id' | 'name' | 'height' | 'weight' | 'stats_total';
  sortOrder: 'asc' | 'desc';
  capturedOnly: boolean;
}

/** Build the query params object that fetchPokemonList expects. */
const buildListParams = (
  filters: PokedexFilterState,
  page: number,
  pageSize: number,
): PokemonListParams => ({
  page,
  page_size: pageSize,
  types: filters.types.join(',') || undefined,
  region: filters.region || undefined,
  habitat: filters.habitat || undefined,
  difficulty: filters.difficulty || undefined,
  sort_by: filters.sortBy,
  sort_order: filters.sortOrder,
  captured_only: filters.capturedOnly,
});

const Pokedex: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    list,
    availableTypes,
    availableRegions,
    availableHabitats,
    filters,
    pagination,
    isLoading,
    isLoadingMore,
    error,
  } = useAppSelector((state) => state.pokemon);

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ----- Initial filter option fetches --------------------------------
  useEffect(() => {
    dispatch(fetchTypes());
    dispatch(fetchRegions());
    dispatch(fetchHabitats());
  }, [dispatch]);

  // ----- Pokemon list re-fetch when filters change --------------------
  useEffect(() => {
    dispatch(fetchPokemonList(buildListParams(filters, 1, PAGE_SIZE)));
  }, [dispatch, filters]);

  // ----- Infinite scroll ---------------------------------------------
  const handleLoadMore = useCallback(() => {
    dispatch(
      fetchMorePokemon(
        buildListParams(filters, pagination.currentPage + 1, pagination.pageSize),
      ),
    );
  }, [dispatch, filters, pagination.currentPage, pagination.pageSize]);

  const observerRef = useInfiniteScroll<HTMLDivElement>({
    hasMore: pagination.hasMore,
    isLoading: isLoading || isLoadingMore,
    onLoadMore: handleLoadMore,
  });

  // ----- Filter handlers ----------------------------------------------
  const handleTypeToggle = (type: string) => {
    const next = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : selectedTypes.length < MAX_TYPE_FILTERS
        ? [...selectedTypes, type]
        : selectedTypes;
    setSelectedTypes(next);
    dispatch(setTypeFilter(next));
  };

  const handleTypeRemove = (type: string) => {
    const next = selectedTypes.filter((t) => t !== type);
    setSelectedTypes(next);
    dispatch(setTypeFilter(next));
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    dispatch(clearFilters());
  };

  // ----- Navigation / modal -------------------------------------------
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleViewDetails = (pokemon: PokemonBasic) => {
    setSelectedPokemonId(pokemon.id);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPokemonId(null);
  };

  // ----- Render -------------------------------------------------------
  if (error) {
    return (
      <PageContainer>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mt: 4 }}>
            {error}
          </Alert>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Container maxWidth="lg">
        <PageHeader
          title="Pokédex"
          actions={
            <>
              <PixelButton onClick={() => navigate('/dashboard')} size="small">
                Dashboard
              </PixelButton>
              <PixelButton onClick={handleLogout} pixelColor="#666" size="small">
                Logout
              </PixelButton>
            </>
          }
        />

        <PokedexFilters
          filters={filters}
          selectedTypes={selectedTypes}
          availableTypes={availableTypes}
          availableRegions={availableRegions}
          availableHabitats={availableHabitats}
          totalCount={pagination.total}
          visibleCount={list.length}
          onCapturedChange={(checked) => dispatch(setCapturedFilter(checked))}
          onRegionChange={(region) => dispatch(setRegionFilter(region))}
          onHabitatChange={(habitat) => dispatch(setHabitatFilter(habitat))}
          onDifficultyChange={(difficulty) => dispatch(setDifficultyFilter(difficulty))}
          onTypeToggle={handleTypeToggle}
          onTypeRemove={handleTypeRemove}
          onSortByChange={(value) => dispatch(setSortBy(value as any))}
          onSortOrderChange={(order) => dispatch(setSortOrder(order))}
          onClearFilters={handleClearFilters}
        />

        <PokedexGrid
          pokemon={list}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={pagination.hasMore}
          capturedOnly={filters.capturedOnly}
          observerRef={observerRef}
          onViewDetails={handleViewDetails}
        />
      </Container>

      <PokemonDetailModal
        pokemonId={selectedPokemonId}
        open={modalOpen}
        onClose={handleCloseModal}
      />
    </PageContainer>
  );
};

export default Pokedex;
