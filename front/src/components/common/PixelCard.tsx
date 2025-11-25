import React from 'react';
import { Card, CardContent, Box } from '@mui/material';
import type { CardProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import { animations } from '../../styles/animations';

const StyledPixelCard = styled(Card)(({ theme }) => ({
  borderRadius: 0,
  border: '4px solid #000',
  boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.25)',
  backgroundColor: '#fff',
  position: 'relative',
  overflow: 'visible',
  animation: `${animations.fadeIn} 0.3s ease-out`,
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-4px',
    left: '-4px',
    right: '-4px',
    height: '24px',
    backgroundColor: theme.palette.primary.main,
    border: '4px solid #000',
    borderBottom: 'none',
    zIndex: 1,
  },
}));

const PokedexLight = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '4px',
  left: '12px',
  width: '12px',
  height: '12px',
  backgroundColor: '#00E5FF',
  border: '2px solid #000',
  borderRadius: '50%',
  zIndex: 2,
  boxShadow: '0 0 8px rgba(0, 229, 255, 0.8)',
  animation: `${animations.blink} 2s infinite`,
}));

const CardIndicators = styled(Box)({
  position: 'absolute',
  top: '6px',
  right: '12px',
  display: 'flex',
  gap: '8px',
  zIndex: 2,
});

const Indicator = styled(Box)<{ color?: string }>(({ color = '#FFCC00' }) => ({
  width: '8px',
  height: '8px',
  backgroundColor: color,
  border: '2px solid #000',
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  '&:last-child': {
    paddingBottom: theme.spacing(2),
  },
}));

interface PixelCardProps extends CardProps {
  showLight?: boolean;
  showIndicators?: boolean;
}

const PixelCard: React.FC<PixelCardProps> = ({ 
  children,
  showLight = true,
  showIndicators = true,
  ...props 
}) => {
  return (
    <StyledPixelCard {...props}>
      {showLight && <PokedexLight />}
      {showIndicators && (
        <CardIndicators>
          <Indicator color="#FF5252" />
          <Indicator color="#FFCC00" />
          <Indicator color="#69F0AE" />
        </CardIndicators>
      )}
      <StyledCardContent>
        {children}
      </StyledCardContent>
    </StyledPixelCard>
  );
};

export default PixelCard;