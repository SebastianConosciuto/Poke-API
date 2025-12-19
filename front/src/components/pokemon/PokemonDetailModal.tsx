import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Chip,
  LinearProgress,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchPokemonDetail,
  clearCurrentPokemon,
  capturePokemon,
  releasePokemon,
} from '../../features/pokemon/pokemonSlice';
import PixelButton from '../common/PixelButton';
import { animations } from '../../styles/animations';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 0,
    border: '4px solid #000',
    boxShadow: '12px 12px 0px rgba(0, 0, 0, 0.3)',
    maxWidth: '800px',
    width: '100%',
    backgroundColor: '#fff',
  },
}));

const Header = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  padding: theme.spacing(2),
  border: '4px solid #000',
  borderTop: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const Title = styled(Typography)(({ theme }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '1.2rem',
  color: '#fff',
  textShadow: '2px 2px 0px rgba(0, 0, 0, 0.3)',
  textTransform: 'capitalize',
}));

const CloseButton = styled(IconButton)({
  color: '#fff',
  border: '2px solid #fff',
  borderRadius: 0,
  padding: '6px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

const Content = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  animation: `${animations.fadeIn} 0.3s ease-out`,
}));

const PokemonImage = styled('img')({
  width: '200px',
  height: '200px',
  margin: '0 auto',
  display: 'block',
  imageRendering: 'pixelated',
  filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2))',
});

const Section = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor: 'rgba(0, 0, 0, 0.02)',
  border: '2px solid #000',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '0.875rem',
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
}));

const StatBar = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
}));

const StatLabel = styled(Typography)(({ theme }) => ({
  fontFamily: '"Roboto Mono", monospace',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  textTransform: 'capitalize',
  marginBottom: theme.spacing(0.5),
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 12,
  borderRadius: 0,
  border: '2px solid #000',
  backgroundColor: '#E0E0E0',
  '& .MuiLinearProgress-bar': {
    backgroundColor: theme.palette.primary.main,
  },
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
    fontSize: '0.8rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    border: '2px solid #000',
    borderRadius: 0,
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  };
});

const InfoText = styled(Typography)(({ theme }) => ({
  fontFamily: '"Roboto Mono", monospace',
  fontSize: '0.875rem',
  marginBottom: theme.spacing(1),
}));

const LoadingContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '300px',
  gap: '16px',
});

const CaptureIndicator = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  backgroundColor: '#4CAF50',
  color: '#fff',
  padding: theme.spacing(1, 2),
  border: '2px solid #000',
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '0.75rem',
}));

interface PokemonDetailModalProps {
  pokemonId: number | null;
  open: boolean;
  onClose: () => void;
}

const PokemonDetailModal: React.FC<PokemonDetailModalProps> = ({
  pokemonId,
  open,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { currentPokemon, isLoadingDetail, error } = useAppSelector(
    (state) => state.pokemon
  );

  useEffect(() => {
    if (open && pokemonId) {
      dispatch(fetchPokemonDetail(pokemonId));
    }
  }, [open, pokemonId, dispatch]);

  const handleClose = () => {
    dispatch(clearCurrentPokemon());
    onClose();
  };

  const handleCapture = () => {
    if (currentPokemon) {
      if (currentPokemon.is_captured) {
        dispatch(releasePokemon(currentPokemon.id));
      } else {
        dispatch(capturePokemon(currentPokemon.id));
      }
    }
  };

  const getStatColor = (value: number): string => {
    if (value >= 120) return '#4CAF50';
    if (value >= 80) return '#8BC34A';
    if (value >= 50) return '#FFC107';
    if (value >= 30) return '#FF9800';
    return '#FF5722';
  };

  return (
    <StyledDialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      {isLoadingDetail || !currentPokemon ? (
        <Content>
          <LoadingContainer>
            <CircularProgress size={60} />
            <Typography
              sx={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '0.75rem',
              }}
            >
              Loading Pokemon...
            </Typography>
          </LoadingContainer>
        </Content>
      ) : (
        <>
          <Header>
            <Title>
              #{currentPokemon.id.toString().padStart(3, '0')} {currentPokemon.name}
            </Title>
            <CloseButton onClick={handleClose} size="small">
              <Icon icon="mdi:close" width={24} />
            </CloseButton>
          </Header>

          <Content>
            {/* Capture Status */}
            {currentPokemon.is_captured && (
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <CaptureIndicator>
                  <Icon icon="game-icons:pokecog" width={16} height={16} />
                  <span>CAPTURED</span>
                </CaptureIndicator>
              </Box>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {/* Left Column - Image and Basic Info */}
              <Box sx={{ flex: { xs: '1 1 100%', md: '0 1 40%' } }}>
                <Box sx={{ textAlign: 'center' }}>
                  <PokemonImage
                    src={
                      currentPokemon.sprites?.other?.['official-artwork']
                        ?.front_default ||
                      currentPokemon.sprites?.front_default ||
                      '/placeholder-pokemon.png'
                    }
                    alt={currentPokemon.name}
                  />
                </Box>

                <Section>
                  <SectionTitle>Types</SectionTitle>
                  <Box>
                    {currentPokemon.types.map((type) => (
                      <TypeChip
                        key={type}
                        label={type}
                        pokemonType={type}
                        size="small"
                      />
                    ))}
                  </Box>
                </Section>

                <Section>
                  <SectionTitle>Physical</SectionTitle>
                  <InfoText>
                    <strong>Height:</strong> {(currentPokemon.height / 10).toFixed(1)}m
                  </InfoText>
                  <InfoText>
                    <strong>Weight:</strong> {(currentPokemon.weight / 10).toFixed(1)}kg
                  </InfoText>
                  {currentPokemon.base_experience && (
                    <InfoText>
                      <strong>Base XP:</strong> {currentPokemon.base_experience}
                    </InfoText>
                  )}
                </Section>

                <Section>
                  <SectionTitle>Abilities</SectionTitle>
                  {currentPokemon.abilities.map((ability) => (
                    <InfoText key={ability.name} sx={{ textTransform: 'capitalize' }}>
                      • {ability.name.replace('-', ' ')}
                      {ability.is_hidden && ' (Hidden)'}
                    </InfoText>
                  ))}
                </Section>
              </Box>

              {/* Right Column - Stats */}
              <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 55%' } }}>
                <Section>
                  <SectionTitle>Base Stats</SectionTitle>
                  {currentPokemon.stats.map((stat) => (
                    <StatBar key={stat.name}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <StatLabel>{stat.name.replace('-', ' ')}</StatLabel>
                        <Typography
                          sx={{
                            fontFamily: '"Press Start 2P", monospace',
                            fontSize: '0.7rem',
                            color: getStatColor(stat.base_stat),
                            fontWeight: 'bold',
                          }}
                        >
                          {stat.base_stat}
                        </Typography>
                      </Box>
                      <StyledLinearProgress
                        variant="determinate"
                        value={(stat.base_stat / 255) * 100}
                        sx={{
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getStatColor(stat.base_stat),
                          },
                        }}
                      />
                    </StatBar>
                  ))}
                  <Box
                    sx={{
                      mt: 2,
                      pt: 2,
                      borderTop: '2px solid #000',
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: '"Press Start 2P", monospace',
                        fontSize: '0.875rem',
                        color: 'primary.main',
                      }}
                    >
                      Total: {currentPokemon.stats_total}
                    </Typography>
                  </Box>
                </Section>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <PixelButton
                    fullWidth
                    onClick={handleCapture}
                    pixelColor={currentPokemon.is_captured ? '#FF5252' : '#4CAF50'}
                  >
                    {currentPokemon.is_captured ? 'Release' : 'Capture'}
                  </PixelButton>
                  <PixelButton fullWidth onClick={handleClose} pixelColor="#666">
                    Close
                  </PixelButton>
                </Box>
              </Box>
            </Box>
          </Content>
        </>
      )}
    </StyledDialog>
  );
};

export default PokemonDetailModal;