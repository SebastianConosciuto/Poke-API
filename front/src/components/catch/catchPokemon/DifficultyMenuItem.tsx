/**
 * Single difficulty <MenuItem> for the catch difficulty Select.
 *
 * Replaces six near-identical hand-written MenuItem blocks in CatchPokemon.tsx
 * — they only differed in tier metadata, which now lives in DIFFICULTY_TIERS.
 */

import { Box, MenuItem, Typography } from '@mui/material';
import type { MenuItemProps } from '@mui/material';
import React from 'react';

import { formatQteDescription, type DifficultyTier } from '../../../constants';

interface DifficultyMenuItemProps extends MenuItemProps {
  tier: DifficultyTier;
}

const DifficultyMenuItem: React.FC<DifficultyMenuItemProps> = ({ tier, ...props }) => (
  <MenuItem {...props} value={tier.key}>
    <Box>
      <Typography
        sx={{
          fontFamily: '"Roboto Mono", monospace',
          fontWeight: 'bold',
          color: tier.color,
        }}
      >
        {tier.label}
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Roboto Mono", monospace',
          fontSize: '0.75rem',
          color: '#666',
        }}
      >
        {formatQteDescription(tier)}
      </Typography>
    </Box>
  </MenuItem>
);

export default DifficultyMenuItem;
