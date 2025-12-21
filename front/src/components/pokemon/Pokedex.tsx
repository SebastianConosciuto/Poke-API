import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { styled } from '@mui/material/styles';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchPokemonList,
  fetchMorePokemon,
  fetchTypes,
  fetchRegions,
  fetchHabitats,
  setTypeFilter,
  setSortBy,
  setSortOrder,
  setCapturedFilter,
  setRegionFilter,
  setHabitatFilter,
  setDifficultyFilter,
  clearFilters,
} from '../../features/pokemon/pokemonSlice';
import { logout } from '../../features/auth/authSlice';
import type { PokemonBasic } from '../../services/pokemonService';
import PixelCard from '../common/PixelCard';
import PixelButton from '../common/PixelButton';
import PokemonCard from './PokemonCard';
import PokemonDetailModal from './PokemonDetailModal';
import { animations } from '../../styles/animations';

const PokedexContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  backgroundColor: '#E8F5E9',
  backgroundImage: `
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 20px,
      rgba(0, 0, 0, 0.02) 20px,
      rgba(0, 0, 0, 0.02) 40px
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 20px,
      rgba(0, 0, 0, 0.02) 20px,
      rgba(0, 0, 0, 0.02) 40px
    )
  `,
  padding: theme.spacing(4),
}));

const Header = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  border: '4px solid #000',
  boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.25)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  animation: `${animations.slideIn} 0.5s ease-out`,
}));

const Title = styled(Typography)(({ theme }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '1.5rem',
  color: '#fff',
  textShadow: '3px 3px 0px rgba(0, 0, 0, 0.3)',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1rem',
  },
}));

const FilterCard = styled(PixelCard)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  animation: `${animations.fadeIn} 0.5s ease-out`,
}));

const FilterTitle = styled(Typography)(({ theme }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '0.875rem',
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    fontFamily: '"Roboto Mono", monospace',
    borderRadius: 0,
    border: '3px solid #000',
    '& fieldset': {
      border: 'none',
    },
  },
  '& .MuiInputLabel-root': {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '0.7rem',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -12px) scale(0.75)',
    },
  },
  '& .MuiSelect-select': {
    fontFamily: '"Roboto Mono", monospace',
    fontSize: '0.875rem',
  },
  '& .MuiMenuItem-root': {
    fontFamily: '"Roboto Mono", monospace',
    fontSize: '0.8rem',
  },
}));

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
  '&.Mui-checked': {
    color: theme.palette.primary.main,
  },
}));

const CapturedLabel = styled(FormControlLabel)(({ theme }) => ({
  '& .MuiFormControlLabel-label': {
    fontFamily: '"Roboto Mono", monospace',
    fontSize: '0.875rem',
  },
}));

const LoadingContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '400px',
});

// Difficulty ranges matching the catch minigame
const DIFFICULTY_RANGES = [
  { value: 'weak', label: '180-300 (Weak)', min: 180, max: 300 },
  { value: 'easy', label: '301-400 (Easy)', min: 301, max: 400 },
  { value: 'medium', label: '401-500 (Medium)', min: 401, max: 500 },
  { value: 'hard', label: '501-600 (Hard)', min: 501, max: 600 },
  { value: 'legendary', label: '601-720 (Legendary)', min: 601, max: 720 },
  { value: 'mythical', label: '721+ (Mythical)', min: 721, max: 9999 },
];

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
  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch types, regions, and habitats on mount
  useEffect(() => {
    dispatch(fetchTypes());
    dispatch(fetchRegions());
    dispatch(fetchHabitats());
  }, [dispatch]);

  // Fetch initial Pokemon list
  useEffect(() => {
    dispatch(
      fetchPokemonList({
        page: 1,
        page_size: 20,
        types: filters.types.join(',') || undefined,
        region: filters.region || undefined,
        habitat: filters.habitat || undefined,
        difficulty: filters.difficulty || undefined,
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder,
        captured_only: filters.capturedOnly,
      })
    );
  }, [dispatch, filters]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          pagination.hasMore &&
          !isLoading &&
          !isLoadingMore
        ) {
          dispatch(
            fetchMorePokemon({
              page: pagination.currentPage + 1,
              page_size: pagination.pageSize,
              types: filters.types.join(',') || undefined,
              region: filters.region || undefined,
              habitat: filters.habitat || undefined,
              difficulty: filters.difficulty || undefined,
              sort_by: filters.sortBy,
              sort_order: filters.sortOrder,
              captured_only: filters.capturedOnly,
            })
          );
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [
    dispatch,
    pagination.hasMore,
    pagination.currentPage,
    pagination.pageSize,
    filters,
    isLoading,
    isLoadingMore,
  ]);

  const handleTypeSelect = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : selectedTypes.length < 2
      ? [...selectedTypes, type]
      : selectedTypes;

    setSelectedTypes(newTypes);
    dispatch(setTypeFilter(newTypes));
  };

  const handleRemoveType = (type: string) => {
    const newTypes = selectedTypes.filter((t) => t !== type);
    setSelectedTypes(newTypes);
    dispatch(setTypeFilter(newTypes));
  };

  const handleRegionChange = (event: any) => {
    dispatch(setRegionFilter(event.target.value));
  };

  const handleHabitatChange = (event: any) => {
    dispatch(setHabitatFilter(event.target.value));
  };

  const handleDifficultyChange = (event: any) => {
    dispatch(setDifficultyFilter(event.target.value));
  };

  const handleSortChange = (event: any) => {
    dispatch(setSortBy(event.target.value));
  };

  const handleSortOrderChange = (order: 'asc' | 'desc') => {
    dispatch(setSortOrder(order));
  };

  const handleCapturedFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setCapturedFilter(event.target.checked));
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    dispatch(clearFilters());
  };

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

  if (error) {
    return (
      <PokedexContainer>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mt: 4 }}>
            {error}
          </Alert>
        </Container>
      </PokedexContainer>
    );
  }

  return (
    <PokedexContainer>
      <Container maxWidth="lg">
        <Header>
          <Title>Pokédex</Title>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <PixelButton onClick={() => navigate('/dashboard')} size="small">
              Dashboard
            </PixelButton>
            <PixelButton onClick={handleLogout} pixelColor="#666" size="small">
              Logout
            </PixelButton>
          </Box>
        </Header>

        {/* Filters */}
        <FilterCard>
          <FilterTitle>Filters & Sorting</FilterTitle>

          {/* Captured Filter */}
          <Box sx={{ mb: 3 }}>
            <CapturedLabel
              control={
                <StyledCheckbox
                  checked={filters.capturedOnly}
                  onChange={handleCapturedFilterChange}
                />
              }
              label="Show only captured Pokémon"
            />
          </Box>

          {/* Region, Habitat, Difficulty Filters */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            {/* Region Filter */}
            <Box sx={{ flex: '1 1 calc(33.333% - 16px)', minWidth: '200px' }}>
              <StyledFormControl fullWidth size="small">
                <InputLabel>Region</InputLabel>
                <Select
                  value={filters.region || ''}
                  onChange={handleRegionChange}
                  label="Region"
                >
                  <MenuItem value="">
                    <em>All Regions</em>
                  </MenuItem>
                  {availableRegions.map((region) => (
                    <MenuItem key={region} value={region}>
                      {region.charAt(0).toUpperCase() + region.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </StyledFormControl>
            </Box>

            {/* Habitat Filter */}
            <Box sx={{ flex: '1 1 calc(33.333% - 16px)', minWidth: '200px' }}>
              <StyledFormControl fullWidth size="small">
                <InputLabel>Habitat</InputLabel>
                <Select
                  value={filters.habitat || ''}
                  onChange={handleHabitatChange}
                  label="Habitat"
                >
                  <MenuItem value="">
                    <em>All Habitats</em>
                  </MenuItem>
                  {availableHabitats.map((habitat) => (
                    <MenuItem key={habitat} value={habitat}>
                      {habitat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </MenuItem>
                  ))}
                </Select>
              </StyledFormControl>
            </Box>

            {/* Difficulty Filter */}
            <Box sx={{ flex: '1 1 calc(33.333% - 16px)', minWidth: '200px' }}>
              <StyledFormControl fullWidth size="small">
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={filters.difficulty || ''}
                  onChange={handleDifficultyChange}
                  label="Difficulty"
                >
                  <MenuItem value="">
                    <em>All Difficulties</em>
                  </MenuItem>
                  {DIFFICULTY_RANGES.map((diff) => (
                    <MenuItem key={diff.value} value={diff.value}>
                      {diff.label}
                    </MenuItem>
                  ))}
                </Select>
              </StyledFormControl>
            </Box>
          </Box>

          {/* Type Filter */}
          <Box sx={{ mb: 3 }}>
            <FilterTitle sx={{ fontSize: '0.75rem' }}>
              Filter by Type (Max 2)
            </FilterTitle>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
              {availableTypes.map((type) => (
                <PixelButton
                  key={type}
                  size="small"
                  onClick={() => handleTypeSelect(type)}
                  pixelColor={
                    selectedTypes.includes(type)
                      ? '#4CAF50'
                      : '#999'
                  }
                  disabled={
                    !selectedTypes.includes(type) && selectedTypes.length >= 2
                  }
                >
                  {type}
                </PixelButton>
              ))}
            </Box>
            {selectedTypes.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {selectedTypes.map((type) => (
                  <Box
                    key={type}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1.5,
                      py: 0.5,
                      backgroundColor: 'primary.main',
                      color: '#fff',
                      fontFamily: '"Roboto Mono", monospace',
                      fontSize: '0.75rem',
                      border: '2px solid #000',
                    }}
                  >
                    {type}
                    <Box
                      component="span"
                      onClick={() => handleRemoveType(type)}
                      sx={{
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        ml: 0.5,
                        '&:hover': { color: '#FF5252' },
                      }}
                    >
                      ×
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Sort Controls */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              alignItems: 'flex-end',
            }}
          >
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 35%' } }}>
              <StyledFormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  onChange={handleSortChange}
                  label="Sort By"
                >
                  <MenuItem value="id">ID</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="stats_total">Total Stats</MenuItem>
                </Select>
              </StyledFormControl>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', md: '0 1 35%' } }}>
              <FilterTitle sx={{ fontSize: '0.65rem', mb: 0.5 }}>
                Order
              </FilterTitle>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <PixelButton
                  size="small"
                  onClick={() => handleSortOrderChange('asc')}
                  pixelColor={filters.sortOrder === 'asc' ? '#4CAF50' : '#999'}
                >
                  Asc
                </PixelButton>
                <PixelButton
                  size="small"
                  onClick={() => handleSortOrderChange('desc')}
                  pixelColor={filters.sortOrder === 'desc' ? '#4CAF50' : '#999'}
                >
                  Desc
                </PixelButton>
              </Box>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', md: '0 1 30%' } }}>
              <PixelButton
                fullWidth
                size="small"
                onClick={handleClearFilters}
                pixelColor="#FF5252"
              >
                Clear Filters
              </PixelButton>
            </Box>
          </Box>

          {/* Stats */}
          <Box sx={{ mt: 2, p: 1, backgroundColor: 'rgba(0,0,0,0.05)' }}>
            <Typography
              sx={{
                fontFamily: '"Roboto Mono", monospace',
                fontSize: '0.75rem',
                textAlign: 'center',
              }}
            >
              Showing {list.length} of {pagination.total} Pokémon
              {filters.capturedOnly && ' (Captured only)'}
              {filters.region && ` • ${filters.region.charAt(0).toUpperCase() + filters.region.slice(1)}`}
              {filters.habitat && ` • ${filters.habitat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`}
              {filters.difficulty && ` • ${DIFFICULTY_RANGES.find(d => d.value === filters.difficulty)?.label}`}
            </Typography>
          </Box>
        </FilterCard>

        {/* Pokemon Grid */}
        {isLoading && list.length === 0 ? (
          <LoadingContainer>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={60} sx={{ color: 'primary.main' }} />
              <Typography
                sx={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: '0.75rem',
                  mt: 2,
                }}
              >
                Loading Pokémon...
              </Typography>
            </Box>
          </LoadingContainer>
        ) : list.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Icon 
              icon="game-icons:pokecog" 
              width={80} 
              height={80}
              style={{ color: '#ccc', marginBottom: '16px' }}
            />
            <Typography
              sx={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '0.875rem',
                color: 'text.secondary',
                mb: 2,
              }}
            >
              {filters.capturedOnly 
                ? 'No Captured Pokémon Yet!'
                : 'No Pokémon Found'}
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Roboto Mono", monospace',
                fontSize: '0.875rem',
                color: 'text.secondary',
              }}
            >
              {filters.capturedOnly 
                ? 'Start capturing Pokémon to build your collection!'
                : 'Try adjusting your filters'}
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 3,
              }}
            >
              {list.map((pokemon) => (
                <PokemonCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </Box>

            {/* Infinite Scroll Trigger */}
            <Box ref={observerTarget} sx={{ height: '50px', mt: 4 }}>
              {isLoadingMore && (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={40} />
                </Box>
              )}
            </Box>

            {!pagination.hasMore && list.length > 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography
                  sx={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                  }}
                >
                  You've seen all Pokémon!
                </Typography>
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Pokemon Detail Modal */}
      <PokemonDetailModal
        pokemonId={selectedPokemonId}
        open={modalOpen}
        onClose={handleCloseModal}
      />
    </PokedexContainer>
  );
};

export default Pokedex;