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
import { register, clearError } from '../../features/auth/authSlice';
import PixelCard from '../common/PixelCard';
import PixelButton from '../common/PixelButton';
import PixelTextField from '../common/PixelTextField';
import PokeballLoading from '../common/PokeballLoading';
import { animations } from '../../styles/animations';

const RegisterContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FFF3E0',
  backgroundImage: `
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(0, 0, 0, 0.02) 10px,
      rgba(0, 0, 0, 0.02) 20px
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

const RegisterBox = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '500px',
  animation: `${animations.fadeIn} 0.5s ease-out`,
}));

const Title = styled(Typography)(({ theme }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '1.5rem',
  textAlign: 'center',
  marginBottom: theme.spacing(1),
  color: theme.palette.secondary.main,
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

const PasswordRequirements = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(59, 76, 202, 0.05)',
  border: '2px solid',
  borderColor: theme.palette.secondary.main,
  padding: theme.spacing(2),
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const RequirementText = styled(Typography)(({ theme }) => ({
  fontFamily: '"Roboto Mono", monospace',
  fontSize: '0.7rem',
  color: theme.palette.text.secondary,
  lineHeight: 1.8,
}));

const StarDecoration = styled(Box)(({ theme }) => ({
  position: 'absolute',
  fontSize: '2rem',
  opacity: 0.15,
  pointerEvents: 'none',
  animation: `${animations.blink} 3s infinite`,
}));

const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    trainer_id: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

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
    
    // Clear password error when user types
    if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    // Validate password length
    if (formData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    dispatch(register({
      trainer_id: formData.trainer_id,
      password: formData.password,
    }));
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (isLoading) {
    return (
      <RegisterContainer>
        <PokeballLoading message="Creating Trainer Profile..." />
      </RegisterContainer>
    );
  }

  return (
    <RegisterContainer>
      {/* Decorative Stars */}
      <StarDecoration sx={{ top: '5%', left: '10%' }}>★</StarDecoration>
      <StarDecoration sx={{ top: '20%', right: '15%', animationDelay: '1s' }}>★</StarDecoration>
      <StarDecoration sx={{ bottom: '10%', left: '20%', animationDelay: '2s' }}>★</StarDecoration>
      <StarDecoration sx={{ bottom: '25%', right: '10%', animationDelay: '1.5s' }}>★</StarDecoration>

      <RegisterBox>
        <Title>New Trainer</Title>
        <Subtitle>Register to begin your journey</Subtitle>

        <PixelCard showLight showIndicators>
          <Form onSubmit={handleSubmit}>
            {(error || passwordError) && (
              <Alert 
                severity="error"
                sx={{ 
                  borderRadius: 0, 
                  border: '3px solid currentColor',
                  fontFamily: '"Roboto Mono", monospace',
                }}
              >
                {error || passwordError}
              </Alert>
            )}

            <PixelTextField
              fullWidth
              label="Trainer ID"
              name="trainer_id"
              value={formData.trainer_id}
              onChange={handleChange}
              required
              helperText="Choose a unique Trainer ID (min. 3 characters)"
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

            <PixelTextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleToggleConfirmPassword}
                      edge="end"
                      size="small"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <PasswordRequirements>
              <RequirementText>
                ▸ Trainer ID: min. 3 characters<br />
                ▸ Password: min. 6 characters<br />
                ▸ Passwords must match
              </RequirementText>
            </PasswordRequirements>

            <PixelButton
              type="submit"
              fullWidth
              disabled={isLoading}
              pixelColor="#3B4CCA"
            >
              {isLoading ? 'Registering...' : 'Register'}
            </PixelButton>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: '"Roboto Mono", monospace',
                  fontSize: '0.75rem',
                }}
              >
                Already have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: 'secondary.main',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Login here
                </Link>
              </Typography>
            </Box>
          </Form>
        </PixelCard>
      </RegisterBox>
    </RegisterContainer>
  );
};

export default Register;