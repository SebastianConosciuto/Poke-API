import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { animations } from '../../styles/animations';

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(3),
  minHeight: '200px',
}));

const PokeballIcon = styled(Box)(({ theme }) => ({
  width: '80px',
  height: '80px',
  position: 'relative',
  animation: `${animations.shake} 1s infinite ease-in-out`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '50%',
    backgroundColor: theme.palette.error.main,
    border: '4px solid #000',
    borderBottom: '2px solid #000',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '50%',
    backgroundColor: '#fff',
    border: '4px solid #000',
    borderTop: '2px solid #000',
  },
}));

const PokeballCenter = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '24px',
  height: '24px',
  backgroundColor: '#fff',
  border: '4px solid #000',
  borderRadius: '50%',
  zIndex: 2,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '12px',
    height: '12px',
    backgroundColor: '#000',
    borderRadius: '50%',
  },
}));

const LoadingText = styled(Typography)(({ theme }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '0.75rem',
  color: theme.palette.text.primary,
  animation: `${animations.blink} 1.5s infinite`,
}));

interface PokeballLoadingProps {
  message?: string;
}

const PokeballLoading: React.FC<PokeballLoadingProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <LoadingContainer>
      <Box position="relative">
        <PokeballIcon>
          <PokeballCenter />
        </PokeballIcon>
      </Box>
      <LoadingText>{message}</LoadingText>
    </LoadingContainer>
  );
};

export default PokeballLoading;