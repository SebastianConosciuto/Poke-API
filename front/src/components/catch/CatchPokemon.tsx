import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Container, FormControl, InputLabel, Select, MenuItem, Alert, Snackbar } from '@mui/material';
import { Icon } from '@iconify/react';
import { styled } from '@mui/material/styles';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchCatchOptions,
  startCatchAttempt,
  completeCatchAttempt,
  clearChallenge,
  clearResult,
} from '../../features/catch/catchSlice';
import { fetchPokemonList } from '../../features/pokemon/pokemonSlice';
import PixelCard from '../common/PixelCard';
import PixelButton from '../common/PixelButton';
import { animations } from '../../styles/animations';
import { QTEMinigame } from './QTEMinigame';

const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  backgroundColor: '#E8F5E9',
  backgroundImage: `
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
  padding: theme.spacing(4),
  transition: 'background-color 0.5s ease, background-image 0.5s ease',
}));

// Region-specific background configurations
const REGION_BACKGROUNDS: { [key: string]: { color: string; gradient: string } } = {
  kanto: {
    color: '#E8F5E9', // Light green
    gradient: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
  },
  johto: {
    color: '#FFF3E0', // Light orange
    gradient: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
  },
  hoenn: {
    color: '#E3F2FD', // Light blue
    gradient: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
  },
  sinnoh: {
    color: '#F3E5F5', // Light purple
    gradient: 'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)',
  },
  unova: {
    color: '#FFF8E1', // Light yellow
    gradient: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
  },
  kalos: {
    color: '#FCE4EC', // Light pink
    gradient: 'linear-gradient(135deg, #FCE4EC 0%, #F8BBD0 100%)',
  },
  alola: {
    color: '#E0F2F1', // Light teal
    gradient: 'linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)',
  },
  galar: {
    color: '#EFEBE9', // Light brown
    gradient: 'linear-gradient(135deg, #EFEBE9 0%, #D7CCC8 100%)',
  },
  paldea: {
    color: '#FFF9C4', // Light gold/yellow
    gradient: 'linear-gradient(135deg, #FFF9C4 0%, #FFF59D 100%)',
  },
};

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

const Title = styled(Typography)(({ theme }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '1.5rem',
  color: '#fff',
  textShadow: '3px 3px 0px rgba(0, 0, 0, 0.3)',
}));

const SectionCard = styled(PixelCard)(({ theme }) => ({
  animation: `${animations.fadeIn} 0.7s ease-out`,
  marginBottom: theme.spacing(4),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '1.2rem',
  color: theme.palette.primary.main,
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

const CatchPokemon: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { regions, habitats, currentChallenge, lastResult, isLoading, isLoadingOptions } = 
    useAppSelector((state) => state.catch);

  const [region, setRegion] = useState('any');
  const [habitat, setHabitat] = useState('any');
  const [difficulty, setDifficulty] = useState<'weak' | 'easy' | 'medium' | 'hard' | 'legendary' | 'mythical'>('medium');
  
  const [showGame, setShowGame] = useState(false);
  
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'info' 
  });

  // Fetch options on mount
  useEffect(() => {
    if (regions.length === 0) {
      dispatch(fetchCatchOptions());
    }
  }, [dispatch, regions.length]);

  // Handle catch result
  useEffect(() => {
    if (lastResult) {
      let message = lastResult.message;
      if (lastResult.perfect && lastResult.reward_message) {
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
    // Start the catch attempt (region and habitat can be "any")
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
    if (!region || region === '' || region === 'any') return {};
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
            ▸ Difficulty filters Pokemon by total stats (strength)<br />
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
                disabled={isLoadingOptions}
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
            </StyledFormControl>

            {/* Difficulty Selection */}
            <StyledFormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'weak' | 'easy' | 'medium' | 'hard' | 'legendary' | 'mythical')}
                label="Difficulty"
              >
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
              </Select>
            </StyledFormControl>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <PixelButton
              onClick={handleStartCatch}
              disabled={!region || !habitat || isLoading}
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
            <strong>2. Choose Difficulty:</strong> Filters Pokemon by strength<br />
            • Weak: 180-300 stats - Easier QTE<br />
            • Easy: 301-400 stats - Easier QTE<br />
            • Medium: 401-500 stats - Moderate QTE<br />
            • Hard: 501-600 stats - Challenging QTE<br />
            • Legendary: 601-720 stats - Very Hard QTE<br />
            • Mythical: 721+ stats - Extreme QTE<br />
            <strong>3. Start Catch:</strong> Random Pokemon appears<br />
            <strong>4. Countdown:</strong> 3... 2... 1... Get ready!<br />
            <strong>5. QTE Challenge:</strong> Press arrow keys as they appear<br />
            <strong>6. Success:</strong> Add Pokemon to your Pokedex!
          </InfoText>

          <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(59, 76, 202, 0.05)', border: '2px solid', borderColor: 'secondary.main' }}>
            <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.85rem', color: 'text.secondary' }}>
              💡 <strong>QTE Difficulty:</strong> Based on Pokemon stats<br />
              • 180-300 stats: 3 buttons, 1.5s each<br />
              • 301-400 stats: 4 buttons, 1.2s each<br />
              • 401-500 stats: 5 buttons, 1.0s each<br />
              • 501-600 stats: 6 buttons, 0.8s each<br />
              • 601-720 stats: 7 buttons, 0.6s each<br />
              • 721+ stats: 8 buttons, 0.5s each<br />
              <br />
              ⚡ <strong>Perfect Catch:</strong> Press all buttons within 60% of time limit for bonus!<br />
              <br />
              🌍 <strong>Tip:</strong> Select "Any Region" or "Any Habitat" to search everywhere!
            </Typography>
          </Box>
        </SectionCard>
      </Container>

      {/* QTE Minigame (with integrated countdown) */}
      {currentChallenge && (
        <QTEMinigame
          open={showGame}
          onClose={handleGameClose}
          pokemonName={currentChallenge.pokemon_name}
          pokemonSprite={currentChallenge.pokemon_sprite}
          sequence={currentChallenge.sequence.buttons}
          timePerButton={currentChallenge.sequence.time_per_button}
          habitat={habitat}
          onComplete={handleGameComplete}
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            fontFamily: '"Roboto Mono", monospace',
            fontSize: '0.85rem',
            border: '2px solid #000',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default CatchPokemon;