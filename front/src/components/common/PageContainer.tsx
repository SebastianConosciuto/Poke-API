/**
 * PageContainer — full-height layout container with optional pixel-grid overlay.
 *
 * Replaces the duplicate styled "container with grid background" used in
 * Pokedex.tsx, Dashboard.tsx, and CatchPokemon.tsx.
 */

import { Box } from '@mui/material';
import type { BoxProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

import { PIXEL_GRID_OVERLAY } from '../../constants';

interface StyledProps {
  bgColor: string;
  showGrid: boolean;
}

const StyledPageContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'bgColor' && prop !== 'showGrid',
})<StyledProps>(({ theme, bgColor, showGrid }) => ({
  minHeight: '100vh',
  backgroundColor: bgColor,
  backgroundImage: showGrid ? PIXEL_GRID_OVERLAY : undefined,
  padding: theme.spacing(4),
  transition: 'background 0.5s ease',
}));

interface PageContainerProps extends Omit<BoxProps, 'bgcolor'> {
  /** Background color. Defaults to the soft green used by Pokedex/Dashboard. */
  bgColor?: string;
  /** Show the pixel grid overlay. Defaults to true. */
  showGrid?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({
  bgColor = '#E8F5E9',
  showGrid = true,
  children,
  ...props
}) => (
  <StyledPageContainer bgColor={bgColor} showGrid={showGrid} {...props}>
    {children}
  </StyledPageContainer>
);

export default PageContainer;
