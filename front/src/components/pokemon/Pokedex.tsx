import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
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
  clearFilters,
  clearError,
} from '../../features/pokemon/pokemonSlice';
import { logout } from '../../features/auth/authSlice';
import PokemonCard from './PokemonCard';
import PixelButton from '../common/PixelButton';
import PixelCard from '../common/PixelCard';
import type { PokemonBasic } from '../../services/pokemonService';
import { animations } from '../../styles/animations';

const PokedexContainer = styled(Box)(({ theme }) => ({
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
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [pagination.hasMore, isLoading, isLoadingMore]);

  const handleLoadMore = useCallback(() => {
    if (pagination.hasMore && !isLoadingMore) {
      dispatch(
        fetchMorePokemon({
          page: pagination.currentPage + 1,
          page_size: pagination.pageSize,
          types: filters.types.join(',') || undefined,
          sort_by: filters.sortBy,
          sort_order: filters.sortOrder,
        })
      );
    }
  }, [dispatch, pagination, filters, isLoadingMore]);

  const handleTypeToggle = (type: string) => {
    let newTypes: string[];
    if (selectedTypes.includes(type)) {
      newTypes = selectedTypes.filter((t) => t !== type);
    } else {
      if (selectedTypes.length >= 2) {
        // Replace the first type if already 2 selected
        newTypes = [selectedTypes[1], type];
      } else {
        newTypes = [...selectedTypes, type];
      }
    }
    setSelectedTypes(newTypes);
    dispatch(setTypeFilter(newTypes));
  };

  const handleSortChange = (event: any) => {
    const value = event.target.value;
    dispatch(setSortBy(value || 'id'));
  };

  const handleSortOrderChange = (order: 'asc' | 'desc') => {
    dispatch(setSortOrder(order));
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    dispatch(clearFilters());
  };

  const handleViewDetails = (pokemon: PokemonBasic) => {
    navigate(`/pokemon/${pokemon.id}`);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <PokedexContainer>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Header>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={handleBackToDashboard}
              sx={{
                color: '#fff',
                border: '2px solid #fff',
                borderRadius: 0,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <Icon icon="game-icons:return-arrow" width="24" height="24" />
            </IconButton>
            <Title>Pokédex</Title>
          </Box>
          <PixelButton onClick={handleLogout} pixelColor="#666" size="small">
            Logout
          </PixelButton>
        </Header>

        {/* Filters */}
        <FilterCard>
          <FilterTitle>Filters & Sorting</FilterTitle>

          {error && (
            <Alert
              severity="error"
              onClose={() => dispatch(clearError())}
              sx={{ mb: 2, borderRadius: 0, border: '2px solid currentColor' }}
            >
              {error}
            </Alert>
          )}

          {/* Type Filters */}
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontFamily: '"Roboto Mono", monospace',
                fontSize: '0.875rem',
                mb: 1,
                fontWeight: 'bold',
              }}
            >
              Types (Max 2):
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {availableTypes.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  onClick={() => handleTypeToggle(type)}
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
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <PixelButton
                fullWidth
                size="small"
                onClick={handleClearFilters}
                pixelColor="#FF5252"
              >
                Clear Filters
              </PixelButton>
            </Grid>
          </Grid>

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
        ) : (
          <>
            <Grid container spacing={3}>
              {list.map((pokemon) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={pokemon.id}>
                  <PokemonCard
                    pokemon={pokemon}
                    onViewDetails={handleViewDetails}
                  />
                </Grid>
              ))}
            </Grid>

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
    </PokedexContainer>
  );
};

export default Pokedex;