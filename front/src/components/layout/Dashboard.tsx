/**
 * Dashboard — landing page after login.
 *
 * Stat fetching, refresh-on-focus, and refresh-on-route-change live in
 * `useUserStats`. Quotes data lives in `constants/quotes`. Layout uses
 * the shared PageContainer / PageHeader.
 */

import { Alert, Box, CircularProgress, Container, Typography } from '@mui/material';
import { Icon } from '@iconify/react';
import { styled } from '@mui/material/styles';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  PageContainer,
  PageHeader,
  PixelButton,
  PixelCard,
} from '../common';
import { getRandomQuote } from '../../constants';
import { logout } from '../../features/auth/authSlice';
import { useUserStats } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { animations } from '../../styles/animations';
import { calculateXpProgress } from '../../utils';

// ----- Styled bits ---------------------------------------------------

const WelcomeCard = styled(PixelCard)(({ theme }) => ({
  animation: `${animations.fadeIn} 0.7s ease-out`,
  marginBottom: theme.spacing(4),
}));

const InfoText = styled(Typography)(({ theme }) => ({
  fontFamily: '"Roboto Mono", monospace',
  fontSize: '1rem',
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(2),
  lineHeight: 1.8,
}));

const StatLabel = styled('span')({
  color: '#666',
  marginRight: '8px',
});

const StatValue = styled('span')({
  color: '#000',
  fontWeight: 'bold',
});

const ProgressBar = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '24px',
  backgroundColor: '#E0E0E0',
  border: '3px solid #000',
  marginTop: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
}));

const ProgressFill = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'progress',
})<{ progress: number }>(({ progress }) => ({
  height: '100%',
  width: `${progress}%`,
  backgroundColor: '#4CAF50',
  transition: 'width 0.5s ease-out',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `repeating-linear-gradient(
      90deg,
      transparent,
      transparent 4px,
      rgba(255, 255, 255, 0.2) 4px,
      rgba(255, 255, 255, 0.2) 8px
    )`,
  },
}));

const ProgressText = styled(Typography)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '0.7rem',
  color: '#000',
  textShadow: '1px 1px 0px rgba(255, 255, 255, 0.5)',
  zIndex: 1,
});

// ----- Component -----------------------------------------------------

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const { stats, loading, error } = useUserStats();
  const randomQuote = useMemo(getRandomQuote, []);

  const xpProgress = stats
    ? calculateXpProgress(stats.experience_in_level, stats.experience_to_next_level)
    : 0;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <PageContainer>
      <Container maxWidth="lg">
        <PageHeader
          title="Pokedash"
          actions={
            <PixelButton onClick={handleLogout} pixelColor="#666" size="small">
              Logout
            </PixelButton>
          }
        />

        <WelcomeCard>
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '1.2rem',
              color: 'primary.main',
              marginBottom: 3,
            }}
          >
            Welcome, {user?.trainer_id}!
          </Typography>

          <InfoText as="div">
            ▸ This is your personal Pokédex dashboard<br />
            ▸ Track your Pokémon collection<br />
            ▸ Manage your team<br />
            ▸ Explore the Pokémon world
          </InfoText>

          <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <PixelButton
              pixelColor="#4CAF50"
              startIcon={<Icon icon="game-icons:perspective-dice-six" width="16" height="16" />}
              onClick={() => navigate('/pokedex')}
            >
              View Pokedex
            </PixelButton>
            <PixelButton
              pixelColor="#9C27B0"
              startIcon={<Icon icon="game-icons:targeting" width="16" height="16" />}
              onClick={() => navigate('/catch')}
            >
              Catch Pokemon
            </PixelButton>
          </Box>
        </WelcomeCard>

        <PixelCard sx={{ animation: `${animations.fadeIn} 1s ease-out` }}>
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '1rem',
              color: 'secondary.main',
              marginBottom: 2,
            }}
          >
            Quick Stats
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : stats ? (
            <>
              <InfoText as="div">
                <StatLabel as="span">▸ Pokémon Captured:</StatLabel>
                <StatValue>{stats.pokemon_captured}</StatValue>
                <br />
                <StatLabel>▸ Pokédex Completion:</StatLabel>
                <StatValue>{stats.pokedex_completion.toFixed(2)}%</StatValue>
                <br />
                <StatLabel>▸ Trainer Level:</StatLabel>
                <StatValue>{stats.level}</StatValue>
              </InfoText>

              <Box sx={{ mt: 3 }}>
                <Typography
                  sx={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: '0.7rem',
                    color: 'text.secondary',
                    marginBottom: 1,
                  }}
                >
                  Experience Progress
                </Typography>
                <ProgressBar>
                  <ProgressFill progress={xpProgress} />
                  <ProgressText>
                    {stats.experience_in_level} /{' '}
                    {stats.experience_in_level + stats.experience_to_next_level} XP
                  </ProgressText>
                </ProgressBar>
                <Typography
                  sx={{
                    fontFamily: '"Roboto Mono", monospace',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    mt: 1,
                  }}
                >
                  {stats.experience_to_next_level} XP until level {stats.level + 1}
                </Typography>
              </Box>
            </>
          ) : null}

          <Box
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: 'rgba(59, 76, 202, 0.05)',
              border: '2px solid',
              borderColor: 'secondary.main',
            }}
          >
            <Typography
              component="div"
              sx={{
                fontFamily: '"Roboto Mono", monospace',
                fontSize: '0.8rem',
                color: 'text.secondary',
                textAlign: 'center',
              }}
            >
              "{randomQuote.quote}"
              <br />- {randomQuote.author}
            </Typography>
          </Box>
        </PixelCard>
      </Container>
    </PageContainer>
  );
};

export default Dashboard;
