import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  Box,
  Typography,
  LinearProgress,
  IconButton,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

// ========================================
// ANIMATIONS
// ========================================

const pulseAnimation = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
`;

const successFlash = keyframes`
  0% { background-color: rgba(76, 175, 80, 0); }
  50% { background-color: rgba(76, 175, 80, 0.3); }
  100% { background-color: rgba(76, 175, 80, 0); }
`;

const errorFlash = keyframes`
  0% { background-color: rgba(244, 67, 54, 0); }
  50% { background-color: rgba(244, 67, 54, 0.3); }
  100% { background-color: rgba(244, 67, 54, 0); }
`;

// ========================================
// STYLED COMPONENTS
// ========================================

// Habitat-specific background configurations
const HABITAT_BACKGROUNDS: { [key: string]: { color: string; gradient: string } } = {
  'grassland': {
    color: '#1a3a1a',
    gradient: 'linear-gradient(135deg, #1a4d1a 0%, #2d7a2d 100%)', // Bright green
  },
  'forest': {
    color: '#0d2a0d',
    gradient: 'linear-gradient(135deg, #0d3a0d 0%, #1a5a1a 100%)', // Deep forest green
  },
  'cave': {
    color: '#1a1a2e',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%)', // Dark blue
  },
  'mountain': {
    color: '#3a3a3a',
    gradient: 'linear-gradient(135deg, #4a4a4a 0%, #5a5a5a 100%)', // Light gray
  },
  'rare': {
    color: '#3a1a4a',
    gradient: 'linear-gradient(135deg, #4a1a5a 0%, #6a2a7a 100%)', // Vivid purple
  },
  'rough-terrain': {
    color: '#4a3a2a',
    gradient: 'linear-gradient(135deg, #5a4a3a 0%, #7a6a5a 100%)', // Brown/tan
  },
  'sea': {
    color: '#1a2a4a',
    gradient: 'linear-gradient(135deg, #1a3a5a 0%, #2a4a7a 100%)', // Ocean blue
  },
  'urban': {
    color: '#2a2a2a',
    gradient: 'linear-gradient(135deg, #3a3a3a 0%, #4a4a4a 100%)', // Dark gray
  },
  'waters-edge': {
    color: '#1a3a3a',
    gradient: 'linear-gradient(135deg, #2a4a4a 0%, #3a5a5a 100%)', // Teal
  },
};

const GameContainer = styled(Box, {
  shouldForwardProp: (prop) => !['feedbackState'].includes(prop as string),
})<{ feedbackState: 'none' | 'correct' | 'wrong' }>(({ feedbackState }) => ({
  backgroundColor: '#1a1a2e',
  padding: '2rem',
  borderRadius: '8px',
  border: '4px solid #000',
  minHeight: '600px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'relative',
  transition: 'background 0.5s ease',
  animation: feedbackState === 'correct' ? `${successFlash} 0.3s ease-out` :
             feedbackState === 'wrong' ? `${errorFlash} 0.3s ease-out, ${shakeAnimation} 0.3s ease-out` : 'none',
}));

const TitleText = styled(Typography)({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '1.2rem',
  color: '#FFD700',
  marginBottom: '2rem',
  textTransform: 'capitalize',
  textAlign: 'center',
});

const PokemonSprite = styled('img')({
  width: '150px',
  height: '150px',
  imageRendering: 'pixelated',
  marginBottom: '1rem',
  filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))',
});

// Upcoming buttons (dimmed/smaller)
const UpcomingButtonsContainer = styled(Box)({
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '1.5rem',
  opacity: 0.5,
});

const UpcomingButton = styled(Box)({
  width: '45px',
  height: '45px',
  backgroundColor: '#444',
  border: '2px solid #666',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.8rem',
  color: '#888',
});

// Current button (big, centered, pulsing)
const CurrentButtonContainer = styled(Box, {
  shouldForwardProp: (prop) => !['isPulsing'].includes(prop as string),
})<{ isPulsing: boolean }>(({ isPulsing }) => ({
  marginBottom: '1.5rem',
  animation: isPulsing ? `${pulseAnimation} 0.8s infinite` : 'none',
}));

const CurrentButton = styled(Box)({
  width: '120px',
  height: '120px',
  backgroundColor: '#4CAF50',
  border: '4px solid #66BB6A',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '5rem',
  color: '#fff',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
});

const InstructionText = styled(Typography)({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '1.1rem',
  color: '#fff',
  marginBottom: '2rem',
  textAlign: 'center',
});

// Timer section
const TimerSection = styled(Box)({
  width: '100%',
  marginBottom: '1rem',
});

const ProgressLabel = styled(Typography)({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '0.85rem',
  color: '#FFD700',
  marginBottom: '0.8rem',
  textAlign: 'center',
});

const TimerBar = styled(LinearProgress)({
  width: '100%',
  height: '24px',
  borderRadius: 0,
  border: '3px solid #000',
  backgroundColor: '#333',
  '& .MuiLinearProgress-bar': {
    borderRadius: 0,
    transition: 'transform 0.1s linear',
  },
});

const StatsText = styled(Typography)({
  fontFamily: '"Roboto Mono", monospace',
  fontSize: '0.85rem',
  color: '#FFD700',
  marginTop: '1rem',
  textAlign: 'center',
});

const ResultText = styled(Typography, {
  shouldForwardProp: (prop) => !['isSuccess'].includes(prop as string),
})<{ isSuccess: boolean }>(({ isSuccess }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '1.8rem',
  color: isSuccess ? '#4CAF50' : '#F44336',
  textAlign: 'center',
  marginTop: '2rem',
}));

// ========================================
// COMPONENT
// ========================================

interface QTEMinigameProps {
  open: boolean;
  onClose: () => void;
  pokemonName: string;
  pokemonSprite: string;
  sequence: string[];
  timePerButton: number;
  habitat?: string; // Optional habitat for dynamic background
  onComplete: (result: {
    success: boolean;
    buttonsCorrect: number;
    totalButtons: number;
    timeTaken: number;
    perfect: boolean;
  }) => void;
}

const ARROW_ICONS: { [key: string]: React.ReactElement } = {
  up: <KeyboardArrowUpIcon />,
  down: <KeyboardArrowDownIcon />,
  left: <KeyboardArrowLeftIcon />,
  right: <KeyboardArrowRightIcon />,
};

const ARROW_NAMES: { [key: string]: string } = {
  up: 'UP',
  down: 'DOWN',
  left: 'LEFT',
  right: 'RIGHT',
};

const KEY_MAP: { [key: string]: string } = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export const QTEMinigame: React.FC<QTEMinigameProps> = ({
  open,
  onClose,
  pokemonName,
  pokemonSprite,
  sequence,
  timePerButton,
  habitat,
  onComplete,
}) => {
  // Game state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(100);
  const [buttonsCorrect, setButtonsCorrect] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'success' | 'failure'>('playing');
  const [feedbackState, setFeedbackState] = useState<'none' | 'correct' | 'wrong'>('none');
  const [buttonTimes, setButtonTimes] = useState<number[]>([]);
  
  // Countdown state
  const [countdown, setCountdown] = useState(3);
  const [showCountdown, setShowCountdown] = useState(true);
  
  const startTimeRef = useRef<number>(Date.now());
  const buttonStartTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);

  // Get background style based on habitat
  const getHabitatBackground = () => {
    if (!habitat || habitat === 'any') return {};
    const habitatBg = HABITAT_BACKGROUNDS[habitat.toLowerCase()];
    if (!habitatBg) return {};
    return { background: habitatBg.gradient };
  };

  // Reset game when opened
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setTimeLeft(100);
      setButtonsCorrect(0);
      setGameState('playing');
      setFeedbackState('none');
      setButtonTimes([]);
      setCountdown(3);
      setShowCountdown(true);
      startTimeRef.current = Date.now();
      buttonStartTimeRef.current = Date.now();
    }
  }, [open]);

  // Countdown logic (3, 2, 1)
  useEffect(() => {
    if (!open || !showCountdown) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished, start game
      setShowCountdown(false);
      startTimeRef.current = Date.now();
      buttonStartTimeRef.current = Date.now();
    }
  }, [open, showCountdown, countdown]);

  // Timer logic for current button
  useEffect(() => {
    if (!open || gameState !== 'playing' || showCountdown) return;

    const interval = 10; // Update every 10ms for smooth animation
    const decrementAmount = (100 / (timePerButton * 1000)) * interval;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - decrementAmount;
        if (newTime <= 0) {
          // Time out - wrong button
          handleWrongButton();
          return 100;
        }
        return newTime;
      });
    }, interval);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [open, gameState, currentIndex, timePerButton, showCountdown]);

  const handleCorrectButton = useCallback(() => {
    const buttonTime = Date.now() - buttonStartTimeRef.current;
    setButtonTimes((prev) => [...prev, buttonTime]);
    
    setButtonsCorrect((prev) => prev + 1);
    setFeedbackState('correct');
    
    setTimeout(() => setFeedbackState('none'), 300);

    if (currentIndex + 1 >= sequence.length) {
      // Game complete - success!
      const totalTime = (Date.now() - startTimeRef.current) / 1000;
      const allTimes = [...buttonTimes, buttonTime];
      
      // Check for perfect - all buttons pressed quickly (within 60% of time limit)
      const perfectThreshold = timePerButton * 0.6 * 1000; // Convert to ms
      const perfect = allTimes.every(time => time <= perfectThreshold);
      
      setGameState('success');
      setTimeout(() => {
        onComplete({
          success: true,
          buttonsCorrect: sequence.length,
          totalButtons: sequence.length,
          timeTaken: totalTime,
          perfect,
        });
      }, 1000);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(100);
      buttonStartTimeRef.current = Date.now();
    }
  }, [currentIndex, sequence.length, onComplete, timePerButton, buttonTimes]);

  const handleWrongButton = useCallback(() => {
    setFeedbackState('wrong');
    
    setTimeout(() => setFeedbackState('none'), 300);
    
    // Game over - failure
    const totalTime = (Date.now() - startTimeRef.current) / 1000;
    setGameState('failure');
    
    setTimeout(() => {
      onComplete({
        success: false,
        buttonsCorrect,
        totalButtons: sequence.length,
        timeTaken: totalTime,
        perfect: false,
      });
    }, 1000);
  }, [buttonsCorrect, sequence.length, onComplete]);

  // Keyboard event handler
  useEffect(() => {
    if (!open || gameState !== 'playing' || showCountdown) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      const key = KEY_MAP[event.key];
      if (!key) return;

      event.preventDefault();

      if (key === sequence[currentIndex]) {
        handleCorrectButton();
      } else {
        handleWrongButton();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [open, gameState, currentIndex, sequence, handleCorrectButton, handleWrongButton, showCountdown]);

  const getTimerColor = () => {
    if (timeLeft > 60) return 'success';
    if (timeLeft > 30) return 'warning';
    return 'error';
  };

  const currentButton = sequence[currentIndex];
  const upcomingButtons = sequence.slice(currentIndex + 1, currentIndex + 3); // Show next 1-2 buttons

  return (
    <Dialog
      open={open}
      onClose={gameState !== 'playing' ? onClose : undefined}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#0f0f1e',
          border: '4px solid #000',
        },
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: '#fff',
          zIndex: 10,
        }}
        disabled={gameState === 'playing' && !showCountdown}
      >
        <CloseIcon />
      </IconButton>

      <GameContainer feedbackState={feedbackState} sx={getHabitatBackground()}>
        <TitleText>
          CATCHING {pokemonName.toUpperCase()}!
        </TitleText>

        <PokemonSprite src={pokemonSprite} alt={pokemonName} />

        {/* COUNTDOWN: 3, 2, 1 */}
        {showCountdown && countdown > 0 && (
          <Box sx={{ textAlign: 'center', my: 4 }}>
            <Typography
              sx={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '6rem',
                color: '#FFD700',
                textShadow: '4px 4px 0px rgba(0, 0, 0, 0.5)',
              }}
            >
              {countdown}
            </Typography>
          </Box>
        )}

        {/* GAME: Show after countdown */}
        {!showCountdown && gameState === 'playing' && (
          <>
            {/* Upcoming buttons preview (1-2 dimmed buttons) */}
            {upcomingButtons.length > 0 && (
              <UpcomingButtonsContainer>
                {upcomingButtons.map((button, idx) => (
                  <UpcomingButton key={idx}>
                    {ARROW_ICONS[button]}
                  </UpcomingButton>
                ))}
              </UpcomingButtonsContainer>
            )}

            {/* Current button (BIG, pulsing) */}
            <CurrentButtonContainer isPulsing={feedbackState === 'none'}>
              <CurrentButton>
                {ARROW_ICONS[currentButton]}
              </CurrentButton>
            </CurrentButtonContainer>

            {/* Instruction */}
            <InstructionText>
              Press {ARROW_NAMES[currentButton]}!
            </InstructionText>

            {/* Timer section */}
            <TimerSection>
              <ProgressLabel>
                ⚡ Button {currentIndex + 1} of {sequence.length} ⚡
              </ProgressLabel>
              <TimerBar 
                variant="determinate" 
                value={timeLeft} 
                color={getTimerColor()} 
              />
            </TimerSection>

            {/* Stats */}
            <StatsText>
              Accuracy: {((buttonsCorrect / (currentIndex + 1)) * 100).toFixed(0)}%
            </StatsText>
          </>
        )}

        {/* SUCCESS STATE */}
        {gameState === 'success' && (
          <ResultText isSuccess={true}>
            SUCCESS!
          </ResultText>
        )}

        {/* FAILURE STATE */}
        {gameState === 'failure' && (
          <ResultText isSuccess={false}>
            FAILED!
          </ResultText>
        )}
      </GameContainer>
    </Dialog>
  );
};