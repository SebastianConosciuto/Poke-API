import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchCatchOptions,
  fetchHabitats,
  fetchDifficulties,
  startCatchAttempt,
  completeCatchAttempt,
  clearChallenge,
  clearResult,
} from '../../features/catch/catchSlice';
import { fetchPokemonList } from '../../features/pokemon/pokemonSlice';
import PixelButton from '../common/PixelButton';
import PixelCard from '../common/PixelCard';
import { QTEMinigame } from './QTEMinigame';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
`;

const animations = { fadeIn, slideIn };

// Styled components
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  backgroundColor: '#E8F5E9',
  padding: theme.spacing(4),
  transition: 'background 0.5s ease',
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

const Title = styled(Typography)({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '1.5rem',
  color: '#fff',
  textShadow: '3px 3px 0px rgba(0, 0, 0, 0.3)',
});

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

const StyledFormControl = styled(FormControl)({
  '& .MuiInputLabel-root': {
    fontFamily: '"Roboto Mono", monospace',
    fontSize: '0.9rem',
  },
  '& .MuiSelect-select': {
    fontFamily: '"Roboto Mono", monospace',
    fontSize: '0.9rem',
  },
  '& .MuiMenuItem-root': {
    fontFamily: '"Roboto Mono", monospace',
    fontSize: '0.8rem',
  },
});

// Region background gradients
const REGION_BACKGROUNDS: Record<string, { gradient: string }> = {
  kanto: { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  johto: { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  hoenn: { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  sinnoh: { gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  unova: { gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  kalos: { gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  alola: { gradient: 'linear-gradient(135deg, #ffa751 0%, #ffe259 100%)' },
  galar: { gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  paldea: { gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
};

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

  const [region, setRegion] = useState('any');
  const [habitat, setHabitat] = useState('any');
  const [difficulty, setDifficulty] = useState<'weak' | 'easy' | 'medium' | 'hard' | 'legendary' | 'mythical'>('medium');
  
  const [showGame, setShowGame] = useState(false);
  
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'info' 
  });

  // Fetch initial regions on mount
  useEffect(() => {
    if (regions.length === 0) {
      dispatch(fetchCatchOptions());
    }
  }, [dispatch, regions.length]);

  // Fetch habitats when region changes
  useEffect(() => {
    if (region && region !== 'any') {
      dispatch(fetchHabitats(region));
      setHabitat('any'); // Reset habitat selection
    } else if (region === 'any') {
      dispatch(fetchHabitats(undefined));
    }
  }, [region, dispatch]);

  // Fetch difficulties when region or habitat changes
  useEffect(() => {
    const regionFilter = region !== 'any' ? region : undefined;
    const habitatFilter = habitat !== 'any' ? habitat : undefined;
    
    if (regionFilter || habitatFilter) {
      dispatch(fetchDifficulties({ region: regionFilter, habitat: habitatFilter }));
    } else {
      // Fetch all difficulties if no filters
      dispatch(fetchDifficulties({}));
    }
  }, [region, habitat, dispatch]);

  // Handle catch result
  useEffect(() => {
    if (lastResult) {
      let message = lastResult.message;
      
      // Add XP info to message
      if (lastResult.reward_message) {
        message += ` ${lastResult.reward_message}`;
      }
      
      showSnackbar(message, lastResult.success ? 'success' : 'error');
      
      // Refresh Pokemon list if successful catch
      if (lastResult.success) {
        setTimeout(() => {
          dispatch(fetchPokemonList({
            page: 1,
            page_size: 20,
          }));
        }, 1000);
      }
      
      dispatch(clearResult());
    }
  }, [lastResult, dispatch]);

  const handleStartCatch = async () => {
    // Start the catch attempt
    const result = await dispatch(startCatchAttempt({ region, habitat, difficulty }));
    
    if (startCatchAttempt.fulfilled.match(result)) {
      // Show game (countdown is integrated inside QTEMinigame)
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

    dispatch(completeCatchAttempt({
      pokemon_id: currentChallenge.pokemon_id,
      success: result.success,
      buttons_correct: result.buttonsCorrect,
      total_buttons: result.totalButtons,
      time_taken: result.timeTaken,
      perfect: result.perfect,
    }));

    setShowGame(false);
    dispatch(clearChallenge());
  };

  const handleGameClose = () => {
    setShowGame(false);
    dispatch(clearChallenge());
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Get background style based on selected region
  const getRegionBackground = () => {
    if (!region || region === 'any') return {};
    const regionBg = REGION_BACKGROUNDS[region.toLowerCase()];
    if (!regionBg) return {};
    
    return {
      background: regionBg.gradient,
      backgroundImage: `
        ${regionBg.gradient},
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
    };
  };

  return (
    <PageContainer sx={getRegionBackground()}>
      <Container maxWidth="lg">
        <Header>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Icon 
              icon="game-icons:perspective-dice-six" 
              width="32" 
              height="32"
              style={{ color: '#fff' }}
            />
            <Title>Catch Pokemon</Title>
          </Box>
          <PixelButton 
            onClick={() => navigate('/dashboard')}
            pixelColor="#666"
            size="small"
          >
            Back
          </PixelButton>
        </Header>

        <SectionCard>
          <SectionTitle>Select Hunting Ground</SectionTitle>
          
          <InfoText>
            ▸ Choose a region and habitat to find wild Pokemon<br />
            ▸ Select "Any" to search across all regions/habitats<br />
            ▸ Available options update based on your selection<br />
            ▸ Stronger Pokemon = more buttons & less time in QTE
          </InfoText>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 4 }}>
            {/* Region Selection */}
            <StyledFormControl fullWidth>
              <InputLabel>Region</InputLabel>
              <Select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                label="Region"
                disabled={isLoadingOptions}
              >
                <MenuItem value="any">
                  <em>Any Region</em>
                </MenuItem>
                {regions.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </StyledFormControl>

            {/* Habitat Selection */}
            <StyledFormControl fullWidth>
              <InputLabel>Habitat</InputLabel>
              <Select
                value={habitat}
                onChange={(e) => setHabitat(e.target.value)}
                label="Habitat"
                disabled={isLoadingHabitats || (!region || region === 'any' && habitats.length === 0)}
              >
                <MenuItem value="any">
                  <em>Any Habitat</em>
                </MenuItem>
                {habitats.map((h) => (
                  <MenuItem key={h} value={h}>
                    {h.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </MenuItem>
                ))}
              </Select>
              {isLoadingHabitats && (
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 1, fontFamily: '"Roboto Mono", monospace' }}>
                  Loading available habitats...
                </Typography>
              )}
            </StyledFormControl>

            {/* Difficulty Selection */}
            <StyledFormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                label="Difficulty"
                disabled={isLoadingDifficulties}
              >
                {/* Only show difficulties that are available */}
                {difficulties.includes('weak') && (
                  <MenuItem value="weak">
                    <Box>
                      <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 'bold', color: '#8BC34A' }}>
                        180-300 (Weak)
                      </Typography>
                      <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.75rem', color: '#666' }}>
                        3 buttons, 1.5s per button
                      </Typography>
                    </Box>
                  </MenuItem>
                )}
                {difficulties.includes('easy') && (
                  <MenuItem value="easy">
                    <Box>
                      <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 'bold', color: '#4CAF50' }}>
                        301-400 (Easy)
                      </Typography>
                      <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.75rem', color: '#666' }}>
                        4 buttons, 1.2s per button
                      </Typography>
                    </Box>
                  </MenuItem>
                )}
                {difficulties.includes('medium') && (
                  <MenuItem value="medium">
                    <Box>
                      <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 'bold', color: '#FF9800' }}>
                        401-500 (Medium)
                      </Typography>
                      <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.75rem', color: '#666' }}>
                        5 buttons, 1.0s per button
                      </Typography>
                    </Box>
                  </MenuItem>
                )}
                {difficulties.includes('hard') && (
                  <MenuItem value="hard">
                    <Box>
                      <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 'bold', color: '#F44336' }}>
                        501-600 (Hard)
                      </Typography>
                      <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.75rem', color: '#666' }}>
                        6 buttons, 0.8s per button
                      </Typography>
                    </Box>
                  </MenuItem>
                )}
                {difficulties.includes('legendary') && (
                  <MenuItem value="legendary">
                    <Box>
                      <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 'bold', color: '#9C27B0' }}>
                        601-720 (Legendary)
                      </Typography>
                      <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.75rem', color: '#666' }}>
                        7 buttons, 0.6s per button
                      </Typography>
                    </Box>
                  </MenuItem>
                )}
                {difficulties.includes('mythical') && (
                  <MenuItem value="mythical">
                    <Box>
                      <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 'bold', color: '#FF1744' }}>
                        721+ (Mythical)
                      </Typography>
                      <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.75rem', color: '#666' }}>
                        8 buttons, 0.5s per button
                      </Typography>
                    </Box>
                  </MenuItem>
                )}
              </Select>
              {isLoadingDifficulties && (
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 1, fontFamily: '"Roboto Mono", monospace' }}>
                  Loading available difficulties...
                </Typography>
              )}
              {!isLoadingDifficulties && difficulties.length === 0 && (region !== 'any' || habitat !== 'any') && (
                <Typography sx={{ fontSize: '0.75rem', color: 'error.main', mt: 1, fontFamily: '"Roboto Mono", monospace' }}>
                  No Pokemon available for this combination
                </Typography>
              )}
            </StyledFormControl>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <PixelButton
              onClick={handleStartCatch}
              disabled={!region || !habitat || isLoading || difficulties.length === 0}
              pixelColor="#4CAF50"
              fullWidth
              startIcon={<Icon icon="game-icons:perspective-dice-six" width="16" height="16" />}
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

        {/* Instructions Card */}
        <SectionCard>
          <SectionTitle>How to Play</SectionTitle>
          
          <InfoText>
            <strong>1. Select Location:</strong> Choose region and habitat (or "Any")<br />
            <strong>2. Choose Difficulty:</strong> Only available difficulties shown<br />
            • Weak: 180-300 stats - Easier QTE<br />
            • Easy: 301-400 stats - Easier QTE<br />
            • Medium: 401-500 stats - Moderate QTE<br />
            • Hard: 501-600 stats - Challenging QTE<br />
            • Legendary: 601-720 stats - Very Hard QTE<br />
            • Mythical: 721+ stats - Extreme QTE<br />
            <strong>3. Start Catch:</strong> Random Pokemon appears<br />
            <strong>4. Countdown:</strong> 3... 2... 1... Get ready!<br />
            <strong>5. QTE Challenge:</strong> Press arrow keys as they appear<br />
            <strong>6. Success:</strong> Add Pokemon to your Pokedex and gain XP!
          </InfoText>

          <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(59, 76, 202, 0.05)', border: '2px solid', borderColor: 'secondary.main' }}>
            <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.85rem', color: 'text.secondary' }}>
              💡 <strong>Smart Filters:</strong> Options update based on available Pokemon<br />
              ⚡ <strong>XP Rewards:</strong> 30 XP for success, 15 XP for trying!<br />
              🌍 <strong>Tip:</strong> Select "Any" to search everywhere!
            </Typography>
          </Box>
        </SectionCard>

        {/* QTE Minigame Modal */}
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

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{
              fontFamily: '"Roboto Mono", monospace',
              border: '3px solid currentColor',
              borderRadius: 0,
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </PageContainer>
  );
};

export default CatchPokemon;