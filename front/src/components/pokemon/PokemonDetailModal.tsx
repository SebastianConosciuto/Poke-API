/**
 * PokemonDetailModal — full-screen-ish dialog showing one Pokemon's details.
 *
 * The body has been split into two sub-components (PokemonInfoSection and
 * PokemonStatsSection) to keep this file focused on the dialog shell.
 */

import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import React, { useEffect } from 'react';

import { PixelButton } from '../common';
import {
  clearCurrentPokemon,
  fetchPokemonDetail,
} from '../../features/pokemon/pokemonSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { animations } from '../../styles/animations';
import { getDetailSpriteUrl, padPokemonId } from '../../utils';
import PokemonInfoSection from './detail/PokemonInfoSection';
import PokemonStatsSection from './detail/PokemonStatsSection';

// ----- Styled bits ---------------------------------------------------

const StyledDialog = styled(Dialog)({
  '& .MuiDialog-paper': {
    borderRadius: 0,
    border: '4px solid #000',
    boxShadow: '12px 12px 0px rgba(0, 0, 0, 0.3)',
    maxWidth: '800px',
    width: '100%',
    backgroundColor: '#fff',
  },
});

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

const Title = styled(Typography)({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '1.2rem',
  color: '#fff',
  textShadow: '2px 2px 0px rgba(0, 0, 0, 0.3)',
  textTransform: 'capitalize',
});

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

// ----- Component -----------------------------------------------------

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
  const { currentPokemon, isLoadingDetail } = useAppSelector(
    (state) => state.pokemon,
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
              #{padPokemonId(currentPokemon.id)} {currentPokemon.name}
            </Title>
            <CloseButton onClick={handleClose} size="small">
              <Icon icon="mdi:close" width={24} />
            </CloseButton>
          </Header>

          <Content>
            {currentPokemon.is_captured && (
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <CaptureIndicator>
                  <Icon icon="game-icons:pokecog" width={16} height={16} />
                  <span>CAPTURED</span>
                </CaptureIndicator>
              </Box>
            )}

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {/* Left column: image + info */}
              <Box sx={{ flex: { xs: '1 1 100%', md: '0 1 40%' } }}>
                <Box sx={{ textAlign: 'center' }}>
                  <PokemonImage
                    src={getDetailSpriteUrl(currentPokemon)}
                    alt={currentPokemon.name}
                  />
                </Box>
                <PokemonInfoSection pokemon={currentPokemon} />
              </Box>

              {/* Right column: description + stats */}
              <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 55%' } }}>
                {currentPokemon.description && (
                  <Section>
                    <SectionTitle>Pokédex Entry</SectionTitle>
                    <InfoText sx={{ fontStyle: 'italic', lineHeight: 1.6 }}>
                      "{currentPokemon.description}"
                    </InfoText>
                  </Section>
                )}
                <Section>
                  <SectionTitle>Base Stats</SectionTitle>
                  <PokemonStatsSection
                    stats={currentPokemon.stats}
                    total={currentPokemon.stats_total}
                  />
                </Section>

                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
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
