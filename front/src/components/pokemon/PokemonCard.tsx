import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import PixelCard from '../common/PixelCard';
import PixelButton from '../common/PixelButton';
import type { PokemonBasic } from '../../services/pokemonService';

const CardContainer = styled(PixelCard)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  
  '&:hover': {
    transform: 'translate(-2px, -2px)',
    boxShadow: '10px 10px 0px rgba(0, 0, 0, 0.25)',
  },
}));

const PokemonImage = styled('img')(({ theme }) => ({
  width: '120px',
  height: '120px',
  margin: '0 auto',
  display: 'block',
  imageRendering: 'pixelated',
  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
}));

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

const TypeChip = styled(Chip)<{ pokemonType: string }>(({ theme, pokemonType }) => {
  // Pokemon type colors
  const typeColors: Record<string, { bg: string; text: string }> = {
    normal: { bg: '#A8A878', text: '#000' },
    fire: { bg: '#F08030', text: '#fff' },
    water: { bg: '#6890F0', text: '#fff' },
    electric: { bg: '#F8D030', text: '#000' },
    grass: { bg: '#78C850', text: '#000' },
    ice: { bg: '#98D8D8', text: '#000' },
    fighting: { bg: '#C03028', text: '#fff' },
    poison: { bg: '#A040A0', text: '#fff' },
    ground: { bg: '#E0C068', text: '#000' },
    flying: { bg: '#A890F0', text: '#000' },
    psychic: { bg: '#F85888', text: '#fff' },
    bug: { bg: '#A8B820', text: '#000' },
    rock: { bg: '#B8A038', text: '#fff' },
    ghost: { bg: '#705898', text: '#fff' },
    dragon: { bg: '#7038F8', text: '#fff' },
    dark: { bg: '#705848', text: '#fff' },
    steel: { bg: '#B8B8D0', text: '#000' },
    fairy: { bg: '#EE99AC', text: '#000' },
  };

  const colors = typeColors[pokemonType] || { bg: '#68A090', text: '#fff' };

  return {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '0.55rem',
    backgroundColor: colors.bg,
    color: colors.text,
    border: '2px solid #000',
    borderRadius: 0,
    textTransform: 'uppercase',
    padding: theme.spacing(1, 1.5),
    height: 'auto',
  };
});

const StatsText = styled(Typography)(({ theme }) => ({
  fontFamily: '"Roboto Mono", monospace',
  fontSize: '0.7rem',
  color: theme.palette.text.secondary,
  textAlign: 'center',
  marginTop: theme.spacing(1),
}));

interface PokemonCardProps {
  pokemon: PokemonBasic;
  onViewDetails: (pokemon: PokemonBasic) => void;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, onViewDetails }) => {
  return (
    <CardContainer showLight showIndicators>
      <Box sx={{ flexGrow: 1 }}>
        <PokemonId>#{pokemon.id.toString().padStart(3, '0')}</PokemonId>
        
        <PokemonImage
          src={pokemon.sprite || '/placeholder-pokemon.png'}
          alt={pokemon.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-pokemon.png';
          }}
        />
        
        <PokemonName>{pokemon.name}</PokemonName>
        
        <TypesContainer>
          {pokemon.types.map((type) => (
            <TypeChip
              key={type}
              label={type}
              pokemonType={type}
              size="small"
            />
          ))}
        </TypesContainer>
        
        <StatsText>
          H: {(pokemon.height / 10).toFixed(1)}m | W: {(pokemon.weight / 10).toFixed(1)}kg
        </StatsText>
        
        <StatsText sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Stats: {pokemon.stats_total}
        </StatsText>
      </Box>
      
      <Box sx={{ mt: 2 }}>
        <PixelButton
          fullWidth
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(pokemon);
          }}
          size="small"
        >
          Details
        </PixelButton>
      </Box>
    </CardContainer>
  );
};

export default PokemonCard;