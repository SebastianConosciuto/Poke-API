import React from 'react';
import { Button } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPixelButton = styled(Button)<{ pixelColor?: string }>(({ theme, pixelColor }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '0.75rem',
  padding: '12px 24px',
  backgroundColor: pixelColor || theme.palette.primary.main,
  color: '#fff',
  border: '4px solid #000',
  borderRadius: 0,
  boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)',
  textTransform: 'uppercase',
  transition: 'all 0.1s ease',
  position: 'relative',
  overflow: 'hidden',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
    transition: 'left 0.5s',
  },
  
  '&:hover': {
    backgroundColor: pixelColor ? `${pixelColor}dd` : theme.palette.primary.dark,
    boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)',
    transform: 'translate(2px, 2px)',
    
    '&::before': {
      left: '100%',
    },
  },
  
  '&:active': {
    boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.3)',
    transform: 'translate(4px, 4px)',
  },
  
  '&:disabled': {
    backgroundColor: '#999',
    color: '#666',
    cursor: 'not-allowed',
    boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.2)',
  },
}));

interface PixelButtonProps extends ButtonProps {
  pixelColor?: string;
}

const PixelButton: React.FC<PixelButtonProps> = ({ 
  children, 
  pixelColor,
  ...props 
}) => {
  return (
    <StyledPixelButton pixelColor={pixelColor} {...props}>
      {children}
    </StyledPixelButton>
  );
};

export default PixelButton;