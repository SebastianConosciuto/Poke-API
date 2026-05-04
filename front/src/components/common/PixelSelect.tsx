/**
 * PixelSelect — themed FormControl used by Pokedex and CatchPokemon filters.
 *
 * Combines the previous StyledFormControl variants from both pages — same
 * 8-bit appearance regardless of which page renders it.
 */

import { FormControl } from '@mui/material';
import type { FormControlProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

const StyledFormControl = styled(FormControl)({
  '& .MuiOutlinedInput-root': {
    fontFamily: '"Roboto Mono", monospace',
    borderRadius: 0,
    border: '3px solid #000',
    '& fieldset': {
      border: 'none',
    },
  },
  '& .MuiInputLabel-root': {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '0.7rem',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -12px) scale(0.75)',
    },
  },
  '& .MuiSelect-select': {
    fontFamily: '"Roboto Mono", monospace',
    fontSize: '0.875rem',
  },
  '& .MuiMenuItem-root': {
    fontFamily: '"Roboto Mono", monospace',
    fontSize: '0.8rem',
  },
});

const PixelSelect: React.FC<FormControlProps> = (props) => (
  <StyledFormControl fullWidth size="small" {...props} />
);

export default PixelSelect;
