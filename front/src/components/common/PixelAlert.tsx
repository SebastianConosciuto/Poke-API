/**
 * PixelAlert — themed Alert with the 8-bit pixel border applied.
 *
 * Replaces the inline `sx={{ borderRadius: 0, border: '3px solid currentColor', ...}}`
 * that was being repeated in Login, Register, and Pokedex.
 */

import { Alert } from '@mui/material';
import type { AlertProps } from '@mui/material';
import React from 'react';

const PixelAlert: React.FC<AlertProps> = ({ sx, children, ...props }) => (
  <Alert
    {...props}
    sx={{
      borderRadius: 0,
      border: '3px solid currentColor',
      fontFamily: '"Roboto Mono", monospace',
      ...sx,
    }}
  >
    {children}
  </Alert>
);

export default PixelAlert;
