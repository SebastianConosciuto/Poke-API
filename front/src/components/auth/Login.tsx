import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, PersonOutline } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login, clearError } from '../../features/auth/authSlice';
import PixelCard from '../common/PixelCard';
import PixelButton from '../common/PixelButton';
import PixelTextField from '../common/PixelTextField';
import PokeballLoading from '../common/PokeballLoading';
import { animations } from '../../styles/animations';

const LoginContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#E3F2FD',
  backgroundImage: `
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.03) 2px,
      rgba(0, 0, 0, 0.03) 4px
    )
  `,
  padding: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    animation: `${animations.scanLine} 3s linear infinite`,
  },
}));

const LoginBox = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '450px',
  animation: `${animations.fadeIn} 0.5s ease-out`,
}));

const Title = styled(Typography)(({ theme }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '1.5rem',
  textAlign: 'center',
  marginBottom: theme.spacing(1),
  color: theme.palette.primary.main,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  textShadow: '3px 3px 0px rgba(0, 0, 0, 0.2)',
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  fontFamily: '"Roboto Mono", monospace',
  fontSize: '0.875rem',
  textAlign: 'center',
  marginBottom: theme.spacing(4),
  color: theme.palette.text.secondary,
}));

const Form = styled('form')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2.5),
}));

const PokeballDecoration = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: '150px',
  height: '150px',
  opacity: 0.1,
  pointerEvents: 'none',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '50%',
    backgroundColor: theme.palette.error.main,
    border: '8px solid #000',
    borderBottom: '4px solid #000',
  },
  
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '50%',
    backgroundColor: '#fff',
    border: '8px solid #000',
    borderTop: '4px solid #000',
  },
}));

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    trainer_id: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(login(formData));
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  if (isLoading) {
    return (
      <LoginContainer>
        <PokeballLoading message="Authenticating..." />
      </LoginContainer>
    );
  }

  return (
    <LoginContainer>
      {/* Decorative Pokéballs */}
      <PokeballDecoration sx={{ top: '10%', left: '5%' }} />
      <PokeballDecoration sx={{ bottom: '15%', right: '8%' }} />

      <LoginBox>
        <Title>Trainer Login</Title>
        <Subtitle>Enter your credentials to continue</Subtitle>

        <PixelCard>
          <Form onSubmit={handleSubmit}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  borderRadius: 0, 
                  border: '3px solid currentColor',
                  fontFamily: '"Roboto Mono", monospace',
                }}
              >
                {error}
              </Alert>
            )}

            <PixelTextField
              fullWidth
              label="Trainer ID"
              name="trainer_id"
              value={formData.trainer_id}
              onChange={handleChange}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutline />
                  </InputAdornment>
                ),
              }}
            />

            <PixelTextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePassword}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <PixelButton
              type="submit"
              fullWidth
              disabled={isLoading}
              sx={{ mt: 1 }}
            >
              {isLoading ? 'Loading...' : 'Login'}
            </PixelButton>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: '"Roboto Mono", monospace',
                  fontSize: '0.75rem',
                }}
              >
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Register here
                </Link>
              </Typography>
            </Box>
          </Form>
        </PixelCard>
      </LoginBox>
    </LoginContainer>
  );
};

export default Login;