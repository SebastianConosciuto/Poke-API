import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Alert, CircularProgress } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../features/auth/authSlice';
import PixelButton from '../common/PixelButton';
import PixelCard from '../common/PixelCard';
import { authService } from '../../services/authService';
import type { UserStats } from '../../services/authService';

// Animations
const slideIn = keyframes`
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const animations = {
  slideIn,
  fadeIn,
};

// Pokemon quotes for inspiration
const POKEMON_QUOTES = [
  {
    quote: "Do you have what it takes to be a Pokemon Master?",
    author: "Professor Oak"
  },
  {
    quote: "The important thing is not how long you live. It's what you accomplish with your life.",
    author: "Grovyle"
  },
  {
    quote: "We do have a lot in common. The same earth, the same air, the same sky.",
    author: "Mewtwo"
  },
  {
    quote: "There's no sense in going out of your way just to get somebody to like you.",
    author: "Ash Ketchum"
  },
  {
    quote: "Knowing what's right doesn't mean much unless you do what's right.",
    author: "N"
  },
  {
    quote: "Even if we can't understand each other, that's not a reason to reject each other.",
    author: "Ash Ketchum"
  }
];

const DashboardContainer = styled(Box)(({ theme }) => ({
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

const Title = styled(Typography)(({ theme }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '1.5rem',
  color: '#fff',
  textShadow: '3px 3px 0px rgba(0, 0, 0, 0.3)',
}));

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

const ProgressFill = styled(Box)<{ width: number }>(({ width }) => ({
  height: '100%',
  width: `${width}%`,
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Select a random quote on component mount
  const randomQuote = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * POKEMON_QUOTES.length);
    return POKEMON_QUOTES[randomIndex];
  }, []);

  // Fetch user stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const userStats = await authService.getStats();
        setStats(userStats);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Calculate XP progress percentage
  const xpProgress = stats 
    ? (stats.experience_in_level / (stats.experience_in_level + stats.experience_to_next_level)) * 100
    : 0;

  return (
    <DashboardContainer>
      <Container maxWidth="lg">
        <Header>
          <Title>Pokedash</Title>
          <PixelButton 
            onClick={handleLogout}
            pixelColor="#666"
            size="small"
          >
            Logout
          </PixelButton>
        </Header>

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

          <InfoText>
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
              <InfoText>
                <StatLabel>▸ Pokémon Captured:</StatLabel>
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
                  <ProgressFill width={xpProgress} />
                  <ProgressText>
                    {stats.experience_in_level} / {stats.experience_in_level + stats.experience_to_next_level} XP
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
    </DashboardContainer>
  );
};

export default Dashboard;