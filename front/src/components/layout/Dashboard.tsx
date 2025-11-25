import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Container } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../features/auth/authSlice';
import PixelCard from '../common/PixelCard';
import PixelButton from '../common/PixelButton';
import { animations } from '../../styles/animations';

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

const TrainerIdBox = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(220, 10, 45, 0.1)',
  border: '3px solid',
  borderColor: theme.palette.primary.main,
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const TrainerIdText = styled(Typography)(({ theme }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '0.875rem',
  color: theme.palette.primary.main,
  textAlign: 'center',
}));

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <DashboardContainer>
      <Container maxWidth="lg">
        <Header>
          <Title>Pokédex Dashboard</Title>
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
            Welcome, Trainer!
          </Typography>

          <InfoText>
            You have successfully logged into your Pokédex system. Your journey begins now!
          </InfoText>

          <TrainerIdBox>
            <TrainerIdText>
              Trainer ID: {user?.trainer_id}
            </TrainerIdText>
          </TrainerIdBox>

          <InfoText>
            ▸ This is your personal Pokédex dashboard<br />
            ▸ Track your Pokémon collection<br />
            ▸ Manage your team<br />
            ▸ Explore the Pokémon world
          </InfoText>

          <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <PixelButton pixelColor="#4CAF50">
              View Pokédex
            </PixelButton>
            <PixelButton pixelColor="#FF9800">
              My Team
            </PixelButton>
            <PixelButton pixelColor="#9C27B0">
              Catch Pokémon
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
              "A Pokémon Trainer must have vision, strategy, and compassion for their Pokémon."
              <br />- Professor Oak
            </Typography>
          </Box>
        </PixelCard>
      </Container>
    </DashboardContainer>
  );
};

export default Dashboard;