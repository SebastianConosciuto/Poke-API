/**
 * QTEMinigame — the timed arrow-key challenge for catching a Pokemon.
 *
 * Game state lives in this file. Reusable behaviour (countdown, per-button
 * timer, keyboard listener) lives in dedicated hooks. Constants such as
 * arrow icons / labels and habitat backgrounds come from `../../constants`.
 */

import { Box, Dialog, IconButton, LinearProgress, Typography } from '@mui/material';
import { keyframes, styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  ARROW_ICONS,
  ARROW_NAMES,
  HABITAT_BACKGROUNDS,
  type ArrowKey,
} from '../../constants';
import {
  useArrowKeyListener,
  useCountdown,
  useQTETimer,
} from '../../hooks';

// ----- Animations ----------------------------------------------------

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

// ----- Styled bits ---------------------------------------------------

type FeedbackState = 'none' | 'correct' | 'wrong';

const GameContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'feedbackState',
})<{ feedbackState: FeedbackState }>(({ feedbackState }) => ({
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
  animation:
    feedbackState === 'correct'
      ? `${successFlash} 0.3s ease-out`
      : feedbackState === 'wrong'
        ? `${errorFlash} 0.3s ease-out, ${shakeAnimation} 0.3s ease-out`
        : 'none',
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

const CurrentButtonContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isPulsing',
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
  shouldForwardProp: (prop) => prop !== 'isSuccess',
})<{ isSuccess: boolean }>(({ isSuccess }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '1.8rem',
  color: isSuccess ? '#4CAF50' : '#F44336',
  textAlign: 'center',
  marginTop: '2rem',
}));

const Countdown = styled(Typography)({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '6rem',
  color: '#FFD700',
  textShadow: '4px 4px 0px rgba(0, 0, 0, 0.5)',
});

// ----- Helpers -------------------------------------------------------

const FEEDBACK_FLASH_MS = 300;
const RESULT_DELAY_MS = 1000;
const PERFECT_THRESHOLD_RATIO = 0.6;

const getTimerColor = (timeLeft: number): 'success' | 'warning' | 'error' => {
  if (timeLeft > 60) return 'success';
  if (timeLeft > 30) return 'warning';
  return 'error';
};

const getHabitatBackground = (habitat?: string) => {
  if (!habitat || habitat === 'any') return {};
  const habitatBg = HABITAT_BACKGROUNDS[habitat.toLowerCase()];
  return habitatBg ? { background: habitatBg.gradient } : {};
};

// ----- Component -----------------------------------------------------

interface QTEResult {
  success: boolean;
  buttonsCorrect: number;
  totalButtons: number;
  timeTaken: number;
  perfect: boolean;
}

interface QTEMinigameProps {
  open: boolean;
  onClose: () => void;
  pokemonName: string;
  pokemonSprite: string;
  sequence: string[];
  timePerButton: number;
  habitat?: string;
  onComplete: (result: QTEResult) => void;
}

type GameState = 'playing' | 'success' | 'failure';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [buttonsCorrect, setButtonsCorrect] = useState(0);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('none');
  const [buttonTimes, setButtonTimes] = useState<number[]>([]);

  const startTimeRef = useRef<number>(Date.now());
  const buttonStartTimeRef = useRef<number>(Date.now());

  // ----- Reset whenever the dialog opens ------------------------------
  useEffect(() => {
    if (!open) return;
    setCurrentIndex(0);
    setButtonsCorrect(0);
    setGameState('playing');
    setFeedbackState('none');
    setButtonTimes([]);
    startTimeRef.current = Date.now();
    buttonStartTimeRef.current = Date.now();
  }, [open]);

  // ----- 3-2-1 countdown ----------------------------------------------
  const handleCountdownComplete = useCallback(() => {
    startTimeRef.current = Date.now();
    buttonStartTimeRef.current = Date.now();
  }, []);

  const countdown = useCountdown({
    from: 3,
    active: open,
    onComplete: handleCountdownComplete,
  });
  const showCountdown = countdown > 0;

  // ----- Per-button timer --------------------------------------------
  const finishWithFailure = useCallback(() => {
    setFeedbackState('wrong');
    setTimeout(() => setFeedbackState('none'), FEEDBACK_FLASH_MS);

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
    }, RESULT_DELAY_MS);
  }, [buttonsCorrect, sequence.length, onComplete]);

  const timeLeft = useQTETimer({
    active: open && gameState === 'playing' && !showCountdown,
    secondsPerButton: timePerButton,
    resetKey: currentIndex,
    onTimeout: finishWithFailure,
  });

  // ----- Correct-key handler ------------------------------------------
  const handleCorrectButton = useCallback(() => {
    const buttonTime = Date.now() - buttonStartTimeRef.current;
    const allTimes = [...buttonTimes, buttonTime];
    setButtonTimes(allTimes);
    setButtonsCorrect((n) => n + 1);
    setFeedbackState('correct');
    setTimeout(() => setFeedbackState('none'), FEEDBACK_FLASH_MS);

    if (currentIndex + 1 >= sequence.length) {
      const totalTime = (Date.now() - startTimeRef.current) / 1000;
      const perfectThresholdMs = timePerButton * PERFECT_THRESHOLD_RATIO * 1000;
      const perfect = allTimes.every((t) => t <= perfectThresholdMs);

      setGameState('success');
      setTimeout(() => {
        onComplete({
          success: true,
          buttonsCorrect: sequence.length,
          totalButtons: sequence.length,
          timeTaken: totalTime,
          perfect,
        });
      }, RESULT_DELAY_MS);
    } else {
      setCurrentIndex((idx) => idx + 1);
      buttonStartTimeRef.current = Date.now();
    }
  }, [buttonTimes, currentIndex, sequence.length, timePerButton, onComplete]);

  // ----- Keyboard handler --------------------------------------------
  const handleArrowKey = useCallback(
    (key: ArrowKey) => {
      if (key === sequence[currentIndex]) {
        handleCorrectButton();
      } else {
        finishWithFailure();
      }
    },
    [currentIndex, finishWithFailure, handleCorrectButton, sequence],
  );

  useArrowKeyListener({
    active: open && gameState === 'playing' && !showCountdown,
    onArrowKey: handleArrowKey,
  });

  // ----- Render -------------------------------------------------------
  const currentButton = sequence[currentIndex];
  const upcomingButtons = sequence.slice(currentIndex + 1, currentIndex + 3);

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

      <GameContainer feedbackState={feedbackState} sx={getHabitatBackground(habitat)}>
        <TitleText>CATCHING {pokemonName.toUpperCase()}!</TitleText>

        <PokemonSprite src={pokemonSprite} alt={pokemonName} />

        {showCountdown && (
          <Box sx={{ textAlign: 'center', my: 4 }}>
            <Countdown>{countdown}</Countdown>
          </Box>
        )}

        {!showCountdown && gameState === 'playing' && (
          <>
            {upcomingButtons.length > 0 && (
              <UpcomingButtonsContainer>
                {upcomingButtons.map((button, idx) => (
                  <UpcomingButton key={idx}>
                    {ARROW_ICONS[button as ArrowKey]}
                  </UpcomingButton>
                ))}
              </UpcomingButtonsContainer>
            )}

            <CurrentButtonContainer isPulsing={feedbackState === 'none'}>
              <CurrentButton>
                {ARROW_ICONS[currentButton as ArrowKey]}
              </CurrentButton>
            </CurrentButtonContainer>

            <InstructionText>
              Press {ARROW_NAMES[currentButton as ArrowKey]}!
            </InstructionText>

            <TimerSection>
              <ProgressLabel>
                ⚡ Button {currentIndex + 1} of {sequence.length} ⚡
              </ProgressLabel>
              <TimerBar
                variant="determinate"
                value={timeLeft}
                color={getTimerColor(timeLeft)}
              />
            </TimerSection>

            <StatsText>
              Accuracy: {((buttonsCorrect / (currentIndex + 1)) * 100).toFixed(0)}%
            </StatsText>
          </>
        )}

        {gameState === 'success' && <ResultText isSuccess>SUCCESS!</ResultText>}
        {gameState === 'failure' && <ResultText isSuccess={false}>FAILED!</ResultText>}
      </GameContainer>
    </Dialog>
  );
};

export default QTEMinigame;
