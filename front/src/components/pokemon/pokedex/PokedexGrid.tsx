/**
 * PokedexGrid — responsive grid of PokemonCard tiles plus loading / empty
 * states and the IntersectionObserver sentinel for infinite scrolling.
 */

import { Box, CircularProgress, Typography } from '@mui/material';
import { Icon } from '@iconify/react';
import React from 'react';

import PokemonCard from '../PokemonCard';
import type { PokemonBasic } from '../../../services/pokemonService';

interface PokedexGridProps {
  pokemon: PokemonBasic[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  capturedOnly: boolean;
  observerRef: React.MutableRefObject<HTMLDivElement | null>;
  onViewDetails: (pokemon: PokemonBasic) => void;
}

const PokedexGrid: React.FC<PokedexGridProps> = ({
  pokemon,
  isLoading,
  isLoadingMore,
  hasMore,
  capturedOnly,
  observerRef,
  onViewDetails,
}) => {
  // Initial loading state
  if (isLoading && pokemon.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box>
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
      </Box>
    );
  }

  // Empty state
  if (pokemon.length === 0) {
    return (
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
          {capturedOnly ? 'No Captured Pokémon Yet!' : 'No Pokémon Found'}
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Roboto Mono", monospace',
            fontSize: '0.875rem',
            color: 'text.secondary',
          }}
        >
          {capturedOnly
            ? 'Start capturing Pokémon to build your collection!'
            : 'Try adjusting your filters'}
        </Typography>
      </Box>
    );
  }

  // Populated state
  return (
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
        {pokemon.map((p) => (
          <PokemonCard key={p.id} pokemon={p} onViewDetails={onViewDetails} />
        ))}
      </Box>

      {/* Infinite scroll sentinel */}
      <Box ref={observerRef} sx={{ height: '50px', mt: 4 }}>
        {isLoadingMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={40} />
          </Box>
        )}
      </Box>

      {!hasMore && pokemon.length > 0 && (
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
  );
};

export default PokedexGrid;
