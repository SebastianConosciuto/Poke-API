/**
 * Render helper for one difficulty <MenuItem> in the catch difficulty Select.
 *
 * NOTE: This is a render FUNCTION, not a component. MUI's Select walks its
 * direct children at runtime to read each MenuItem's `value` prop. Wrapping
 * MenuItem in another component breaks that introspection - Select then sees
 * zero available values, logs the "out-of-range value ... available values
 * are ''" warning, and the controlled/uncontrolled invariant breaks.
 *
 * By exporting a plain render function instead of a component, the MenuItem
 * stays a direct child of <Select> so introspection works.
 */

import { Box, MenuItem, Typography } from '@mui/material';
import React from 'react';

import { formatQteDescription, type DifficultyTier } from '../../../constants';

export const renderDifficultyMenuItem = (tier: DifficultyTier): React.ReactElement => (
  <MenuItem key={tier.key} value={tier.key}>
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
