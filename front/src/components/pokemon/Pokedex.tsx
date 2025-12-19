import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { styled } from '@mui/material/styles';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchTypes,
  fetchPokemonList,
  fetchMorePokemon,
  setTypeFilter,
  setSortBy,
  setSortOrder,
  setCapturedFilter,
  clearFilters,
} from '../../features/pokemon/pokemonSlice';
import { logout } from '../../features/auth/authSlice';
import PokemonCard from './PokemonCard';
import PokemonDetailModal from './PokemonDetailModal';
import PixelButton from '../common/PixelButton';
import PixelCard from '../common/PixelCard';
import type { PokemonBasic } from '../../services/pokemonService';
import { animations } from '../../styles/animations';

const PokedexContainer = styled(Box)({
  minHeight: '100vh',
  backgroundColor: '#E3F2FD',
  backgroundImage: `
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 40px,
      rgba(0, 0, 0, 0.02) 40px,
      rgba(0, 0, 0, 0.02) 80px
    )
  `,
});

const Header = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  border: '4px solid #000',
  boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.25)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
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

const Pokedex: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    list,
    availableTypes,
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

  // Fetch types on mount
  useEffect(() => {
    dispatch(fetchTypes());
  }, [dispatch]);

  // Fetch initial Pokemon list
  useEffect(() => {
    dispatch(
      fetchPokemonList({
        page: 1,
        page_size: 20,
        types: filters.types.join(',') || undefined,
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
                    selectedTypes.includes(type) ? '#4CAF50' : '#999'
                  }
                  disabled={
                    !selectedTypes.includes(type) && selectedTypes.length >= 2
                  }
                  sx={{ 
                    textTransform: 'capitalize',
                    fontSize: '0.7rem',
                    padding: '6px 10px',
                    minWidth: 'auto',
                  }}
                >
                  {type}
                </PixelButton>
              ))}
            </Box>

            {/* Selected Types */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {selectedTypes.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  onDelete={() => handleRemoveType(type)}
                  color={selectedTypes.includes(type) ? 'primary' : 'default'}
                  sx={{
                    fontFamily: '"Roboto Mono", monospace',
                    fontSize: '0.75rem',
                    textTransform: 'capitalize',
                    borderRadius: 0,
                    border: '2px solid #000',
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Sort Controls */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '0 1 30%' } }}>
              <StyledFormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy || ''}
                  onChange={handleSortChange}
                  label="Sort By"
                >
                  <MenuItem value="id">ID</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="height">Height</MenuItem>
                  <MenuItem value="weight">Weight</MenuItem>
                  <MenuItem value="stats_total">Total Stats</MenuItem>
                </Select>
              </StyledFormControl>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '0 1 30%' } }}>
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