import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import PixelCard from '../common/PixelCard';
import PixelButton from '../common/PixelButton';
import type { PokemonBasic } from '../../services/pokemonService';

const CardContainer = styled(PixelCard)(({ theme }) => ({
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
}));

const CaptureIndicator = styled(Box)(({ theme }) => ({
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
  const typeColors: { [key: string]: string } = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC',
  };

  return {
    backgroundColor: typeColors[pokemonType] || '#777',
    color: '#fff',
    fontFamily: '"Roboto Mono", monospace',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    border: '2px solid #000',
    borderRadius: 0,
    '& .MuiChip-label': {
      padding: '0 8px',
    },
  };
});

const StatsText = styled(Typography)(({ theme }) => ({
  fontFamily: '"Roboto Mono", monospace',
  fontSize: '0.75rem',
  textAlign: 'center',
  marginBottom: theme.spacing(0.5),
}));

interface PokemonCardProps {
  pokemon: PokemonBasic;
  onViewDetails: (pokemon: PokemonBasic) => void;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, onViewDetails }) => {
  return (
    <CardContainer showLight showIndicators>
      {/* Capture Indicator - Show pokeball if captured */}
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