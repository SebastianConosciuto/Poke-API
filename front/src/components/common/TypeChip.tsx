/**
 * TypeChip — color-coded Pokemon type badge.
 *
 * Replaces two near-identical TypeChip styled components that lived inside
 * PokemonCard.tsx and PokemonDetailModal.tsx.
 */

import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

import { getTypeColor } from '../../constants';

interface StyledTypeChipProps {
  pokemonType: string;
}

const StyledTypeChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'pokemonType',
})<StyledTypeChipProps>(({ pokemonType }) => ({
  backgroundColor: getTypeColor(pokemonType),
  color: '#fff',
  fontFamily: '"Roboto Mono", monospace',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  border: '2px solid #000',
  borderRadius: 0,
  '& .MuiChip-label': {
    padding: '0 8px',
  },
}));

interface TypeChipProps extends Omit<ChipProps, 'label'> {
  type: string;
}

const TypeChip: React.FC<TypeChipProps> = ({ type, ...props }) => (
  <StyledTypeChip pokemonType={type} label={type} size="small" {...props} />
);

export default TypeChip;
