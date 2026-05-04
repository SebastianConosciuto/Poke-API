/**
 * PokemonCard — grid tile for a single Pokemon.
 *
 * Pure presentation: takes a PokemonBasic and a click handler. All shared
 * helpers (sprite fallback, ID formatting, type chip) come from common modules.
 */

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import React from 'react';

import {
  PixelButton,
  PixelCard,
  TypeChip,
} from '../common';
import {
  formatHeightMeters,
  formatWeightKilograms,
  getBasicSpriteUrl,
  padPokemonId,
} from '../../utils';
import type { PokemonBasic } from '../../services/pokemonService';

// ----- Styled bits ---------------------------------------------------

const CardContainer = styled(PixelCard)({
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  '&:hover': {
    transform: 'translate(-2px, -2px)',
    boxShadow: '10px 10px 0px rgba(0, 0, 0, 0.25)',
  },
});

const CaptureIndicator = styled(Box)({
  position: 'absolute',
  top: '8px',
  right: '8px',
  zIndex: 10,
  backgroundColor: '#fff',
  border: '2px solid #000',
  borderRadius: '50%',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.2)',
});

const PokemonImage = styled('img')({
  width: '120px',
  height: '120px',
  margin: '0 auto',
  display: 'block',
  imageRendering: 'pixelated',
  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
});

const PokemonId = styled(Typography)(({ theme }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '0.7rem',
  color: theme.palette.text.secondary,
  textAlign: 'center',
  marginBottom: theme.spacing(1),
}));

const PokemonName = styled(Typography)(({ theme }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '0.875rem',
  color: theme.palette.primary.main,
  textAlign: 'center',
  textTransform: 'capitalize',
  marginBottom: theme.spacing(2),
}));

const TypesContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
  flexWrap: 'wrap',
}));

const StatsText = styled(Typography)(({ theme }) => ({
  fontFamily: '"Roboto Mono", monospace',
  fontSize: '0.75rem',
  textAlign: 'center',
  marginBottom: theme.spacing(0.5),
}));

// ----- Component -----------------------------------------------------

interface PokemonCardProps {
  pokemon: PokemonBasic;
  onViewDetails: (pokemon: PokemonBasic) => void;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, onViewDetails }) => {
  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails(pokemon);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/placeholder-pokemon.png';
  };

  return (
    <CardContainer showLight showIndicators>
      {pokemon.is_captured && (
        <CaptureIndicator>
          <Icon
            icon="game-icons:pokecog"
            width={20}
            height={20}
            style={{ color: '#EF5350' }}
          />
        </CaptureIndicator>
      )}

      <Box sx={{ flexGrow: 1 }}>
        <PokemonId>#{padPokemonId(pokemon.id)}</PokemonId>

        <PokemonImage
          src={getBasicSpriteUrl(pokemon.sprite)}
          alt={pokemon.name}
          loading="lazy"
          onError={handleImageError}
        />

        <PokemonName>{pokemon.name}</PokemonName>

        <TypesContainer>
          {pokemon.types.map((type) => (
            <TypeChip key={type} type={type} />
          ))}
        </TypesContainer>

        <StatsText>
          H: {formatHeightMeters(pokemon.height)} | W:{' '}
          {formatWeightKilograms(pokemon.weight)}
        </StatsText>

        <StatsText sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Stats: {pokemon.stats_total}
        </StatsText>
      </Box>

      <Box sx={{ mt: 2 }}>
        <PixelButton fullWidth onClick={handleDetailsClick} size="small">
          Details
        </PixelButton>
      </Box>
    </CardContainer>
  );
};

export default PokemonCard;
