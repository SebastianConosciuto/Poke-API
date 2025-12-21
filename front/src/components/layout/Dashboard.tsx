import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Container } from '@mui/material';
import { Icon } from '@iconify/react';
import { styled } from '@mui/material/styles';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../features/auth/authSlice';
import PixelCard from '../common/PixelCard';
import PixelButton from '../common/PixelButton';
import { animations } from '../../styles/animations';

// Pokémon quotes from games and series
const POKEMON_QUOTES = [
  {
    quote: "A Pokémon Trainer must have vision, strategy, and compassion for their Pokémon.",
    author: "Professor Oak"
  },
  {
    quote: "The most important thing is the bond between Pokémon and Trainer.",
    author: "Lance"
  },
  {
    quote: "Strong Pokémon. Weak Pokémon. That is only the selfish perception of people.",
    author: "Karen"
  },
  {
    quote: "Technology is incredible! You can store Pokémon in a PC!",
    author: "Bill"
  },
  {
    quote: "Do you know what's so special about Pokémon? You can always rely on them.",
    author: "Professor Elm"
  },
  {
    quote: "Pokémon battles are about bringing out the best in each other!",
    author: "Korrina"
  },
  {
    quote: "When you have a dream, you've got to grab it and never let go.",
    author: "Professor Kukui"
  },
  {
    quote: "The bond you share with your Pokémon is marvelous!",
    author: "Cynthia"
  },
  {
    quote: "Pokemon are living beings! They think, they feel, they laugh, they cry!",
    author: "Mewtwo"
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Select a random quote on component mount
  const randomQuote = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * POKEMON_QUOTES.length);
    return POKEMON_QUOTES[randomIndex];
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

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
            <PixelButton pixelColor="#FF9800" startIcon={<Icon icon="game-icons:swords-emblem" width="16" height="16" />}>
              My Team
            </PixelButton>
            <PixelButton pixelColor="#9C27B0" startIcon={<Icon icon="game-icons:targeting" width="16" height="16" />}>
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

          <InfoText>
            ▸ Pokémon Caught: 0<br />
            ▸ Pokédex Completion: 0%<br />
            ▸ Team Size: 0/6<br />
            ▸ Trainer Level: 1
          </InfoText>

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