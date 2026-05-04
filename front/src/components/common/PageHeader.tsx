/**
 * PageHeader — the red 8-bit header bar with a title and right-side actions.
 *
 * Used at the top of Pokedex, Dashboard, and CatchPokemon. Each was
 * reimplementing the same styled <Box>/<Title> pair.
 */

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

import { animations } from '../../styles/animations';

const HeaderContainer = styled(Box)(({ theme }) => ({
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

const TitleText = styled(Typography)(({ theme }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '1.5rem',
  color: '#fff',
  textShadow: '3px 3px 0px rgba(0, 0, 0, 0.3)',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1rem',
  },
}));

interface PageHeaderProps {
  title: React.ReactNode;
  /** Optional content rendered to the left of the title (e.g. an icon). */
  leftAdornment?: React.ReactNode;
  /** Action buttons / controls rendered on the right. */
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  leftAdornment,
  actions,
}) => (
  <HeaderContainer>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {leftAdornment}
      <TitleText>{title}</TitleText>
    </Box>
    {actions && <Box sx={{ display: 'flex', gap: 2 }}>{actions}</Box>}
  </HeaderContainer>
);

export default PageHeader;
