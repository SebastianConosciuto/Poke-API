/**
 * CatchPokemon — landing page for the catching minigame.
 *
 * Picks region/habitat/difficulty, kicks off a catch attempt via the catch
 * slice, and renders the QTE minigame as a modal once the backend returns
 * a challenge. Repeated UI bits live in catchPokemon/* sub-components.
 */

import {
  Box,
  Container,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { styled } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  PageContainer,
  PageHeader,
  PixelButton,
  PixelCard,
  PixelSelect,
  PixelSnackbar,
} from '../common';
import {
  ANY_FILTER_VALUE,
  DIFFICULTY_TIERS,
  REGION_BACKGROUNDS,
  PIXEL_GRID_OVERLAY,
  isAnyFilter,
  type DifficultyKey,
} from '../../constants';
import {
  clearChallenge,
  clearResult,
  completeCatchAttempt,
  fetchCatchOptions,
  fetchDifficulties,
  fetchHabitats,
  startCatchAttempt,
} from '../../features/catch/catchSlice';
import { fetchPokemonList } from '../../features/pokemon/pokemonSlice';
import { useSnackbar, USER_STATS_REFRESH_EVENT } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { capitalize, formatHyphenated } from '../../utils';
import { animations } from '../../styles/animations';
import CatchInstructions from './catchPokemon/CatchInstructions';
import DifficultyMenuItem from './catchPokemon/DifficultyMenuItem';
import { QTEMinigame } from './QTEMinigame';

// ----- Styled bits ---------------------------------------------------

const SectionCard = styled(PixelCard)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  animation: `${animations.fadeIn} 0.7s ease-out`,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '1rem',
  color: theme.palette.secondary.main,
  marginBottom: theme.spacing(3),
}));

const InfoText = styled(Typography)(({ theme }) => ({
  fontFamily: '"Roboto Mono", monospace',
  fontSize: '1rem',
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(3),
  lineHeight: 1.8,
}));

const HelperText = styled(Typography)({
  fontSize: '0.75rem',
  color: 'text.secondary',
  fontFamily: '"Roboto Mono", monospace',
  marginTop: '8px',
});

// ----- Helpers -------------------------------------------------------

const getRegionBackground = (region: string) => {
  if (isAnyFilter(region)) return {};
  const regionBg = REGION_BACKGROUNDS[region.toLowerCase()];
  if (!regionBg) return {};
  return {
    background: regionBg.gradient,
    backgroundImage: `${regionBg.gradient}, ${PIXEL_GRID_OVERLAY}`,
  };
};

// ----- Component -----------------------------------------------------

const CatchPokemon: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    regions,
    habitats,
    difficulties,
    currentChallenge,
    lastResult,
    isLoading,
    isLoadingOptions,
    isLoadingHabitats,
    isLoadingDifficulties,
  } = useAppSelector((state) => state.catch);

  const [region, setRegion] = useState<string>(ANY_FILTER_VALUE);
  const [habitat, setHabitat] = useState<string>(ANY_FILTER_VALUE);
  const [difficulty, setDifficulty] = useState<DifficultyKey>('medium');
  const [showGame, setShowGame] = useState(false);

  const { snackbar, show: showSnackbar, close: closeSnackbar } = useSnackbar();

  // ----- Initial fetches ---------------------------------------------
  useEffect(() => {
    if (regions.length === 0) dispatch(fetchCatchOptions());
  }, [dispatch, regions.length]);

  // ----- Re-fetch habitats when region changes -----------------------
  useEffect(() => {
    dispatch(fetchHabitats(isAnyFilter(region) ? undefined : region));
    setHabitat(ANY_FILTER_VALUE);
  }, [region, dispatch]);

  // ----- Re-fetch difficulties when filters change -------------------
  useEffect(() => {
    dispatch(
      fetchDifficulties({
        region: isAnyFilter(region) ? undefined : region,
        habitat: isAnyFilter(habitat) ? undefined : habitat,
      }),
    );
  }, [region, habitat, dispatch]);

  // ----- Handle catch result -----------------------------------------
  useEffect(() => {
    if (!lastResult) return;

    const message = lastResult.reward_message
      ? `${lastResult.message} ${lastResult.reward_message}`
      : lastResult.message;
    showSnackbar(message, lastResult.success ? 'success' : 'error');

    // Tell any mounted Dashboard / useUserStats consumers to refetch so the
    // new XP/level shows up immediately. Both success and failure award XP.
    window.dispatchEvent(new Event(USER_STATS_REFRESH_EVENT));

    if (lastResult.success) {
      // Refresh the Pokedex list so the new capture appears.
      setTimeout(() => {
        dispatch(fetchPokemonList({ page: 1, page_size: 20 }));
      }, 1000);
    }

    dispatch(clearResult());
  }, [lastResult, dispatch, showSnackbar]);

  // ----- Catch lifecycle ---------------------------------------------
  const handleStartCatch = async () => {
    const result = await dispatch(
      startCatchAttempt({ region, habitat, difficulty }),
    );
    if (startCatchAttempt.fulfilled.match(result)) {
      setShowGame(true);
    }
  };

  const handleGameComplete = (result: {
    success: boolean;
    buttonsCorrect: number;
    totalButtons: number;
    timeTaken: number;
    perfect: boolean;
  }) => {
    if (!currentChallenge) return;
    dispatch(
      completeCatchAttempt({
        pokemon_id: currentChallenge.pokemon_id,
        success: result.success,
        buttons_correct: result.buttonsCorrect,
        total_buttons: result.totalButtons,
        time_taken: result.timeTaken,
        perfect: result.perfect,
        difficulty: currentChallenge.difficulty,
      }),
    );
    setShowGame(false);
    dispatch(clearChallenge());
  };

  const handleGameClose = () => {
    setShowGame(false);
    dispatch(clearChallenge());
  };

  // ----- Render -------------------------------------------------------
  const startDisabled =
    !region || !habitat || isLoading || difficulties.length === 0;

  return (
    <PageContainer bgColor="#E8F5E9" sx={getRegionBackground(region)}>
      <Container maxWidth="lg">
        <PageHeader
          title="Catch Pokemon"
          leftAdornment={
            <Icon
              icon="game-icons:perspective-dice-six"
              width="32"
              height="32"
              style={{ color: '#fff' }}
            />
          }
          actions={
            <PixelButton
              onClick={() => navigate('/dashboard')}
              pixelColor="#666"
              size="small"
            >
              Back
            </PixelButton>
          }
        />

        <SectionCard>
          <SectionTitle>Select Hunting Ground</SectionTitle>

          <InfoText as="div">
            ▸ Choose a region and habitat to find wild Pokemon<br />
            ▸ Select "Any" to search across all regions/habitats<br />
            ▸ Available options update based on your selection<br />
            ▸ Stronger Pokemon = more buttons & less time in QTE
          </InfoText>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 4 }}>
            <PixelSelect>
              <InputLabel>Region</InputLabel>
              <Select
                value={region}
                onChange={(e) => setRegion(e.target.value as string)}
                label="Region"
                disabled={isLoadingOptions}
              >
                <MenuItem value={ANY_FILTER_VALUE}><em>Any Region</em></MenuItem>
                {regions.map((r) => (
                  <MenuItem key={r} value={r}>{capitalize(r)}</MenuItem>
                ))}
              </Select>
            </PixelSelect>

            <PixelSelect>
              <InputLabel>Habitat</InputLabel>
              <Select
                value={habitat}
                onChange={(e) => setHabitat(e.target.value as string)}
                label="Habitat"
                disabled={
                  isLoadingHabitats ||
                  !region ||
                  (region === ANY_FILTER_VALUE && habitats.length === 0)
                }
              >
                <MenuItem value={ANY_FILTER_VALUE}><em>Any Habitat</em></MenuItem>
                {habitats.map((h) => (
                  <MenuItem key={h} value={h}>{formatHyphenated(h)}</MenuItem>
                ))}
              </Select>
              {isLoadingHabitats && <HelperText>Loading available habitats...</HelperText>}
            </PixelSelect>

            <PixelSelect>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyKey)}
                label="Difficulty"
                disabled={isLoadingDifficulties}
              >
                {DIFFICULTY_TIERS.filter((tier) =>
                  difficulties.includes(tier.key),
                ).map((tier) => (
                  <DifficultyMenuItem key={tier.key} tier={tier} />
                ))}
              </Select>
              {isLoadingDifficulties && (
                <HelperText>Loading available difficulties...</HelperText>
              )}
              {!isLoadingDifficulties &&
                difficulties.length === 0 &&
                (region !== ANY_FILTER_VALUE || habitat !== ANY_FILTER_VALUE) && (
                  <HelperText sx={{ color: 'error.main' }}>
                    No Pokemon available for this combination
                  </HelperText>
                )}
            </PixelSelect>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <PixelButton
              onClick={handleStartCatch}
              disabled={startDisabled}
              pixelColor="#4CAF50"
              fullWidth
              startIcon={
                <Icon
                  icon="game-icons:perspective-dice-six"
                  width="16"
                  height="16"
                />
              }
            >
              {isLoading ? 'Searching...' : 'Start Catch!'}
            </PixelButton>
            <PixelButton
              onClick={() => navigate('/dashboard')}
              pixelColor="#666"
            >
              Cancel
            </PixelButton>
          </Box>
        </SectionCard>

        <CatchInstructions />

        {showGame && currentChallenge && (
          <QTEMinigame
            open={showGame}
            onClose={handleGameClose}
            pokemonName={currentChallenge.pokemon_name}
            pokemonSprite={currentChallenge.pokemon_sprite}
            sequence={currentChallenge.sequence.buttons}
            timePerButton={currentChallenge.sequence.time_per_button}
            onComplete={handleGameComplete}
          />
        )}

        <PixelSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={closeSnackbar}
        />
      </Container>
    </PageContainer>
  );
};

export default CatchPokemon;
