/**
 * Left-column info group inside PokemonDetailModal: types, physical, abilities.
 */

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

import { TypeChip } from '../../common';
import type { PokemonDetail } from '../../../services/pokemonService';
import { formatHeightMeters, formatWeightKilograms } from '../../../utils';

const Section = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor: 'rgba(0, 0, 0, 0.02)',
  border: '2px solid #000',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '0.875rem',
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
}));

const InfoText = styled(Typography)(({ theme }) => ({
  fontFamily: '"Roboto Mono", monospace',
  fontSize: '0.875rem',
  marginBottom: theme.spacing(1),
}));

interface PokemonInfoSectionProps {
  pokemon: PokemonDetail;
}

const PokemonInfoSection: React.FC<PokemonInfoSectionProps> = ({ pokemon }) => (
  <>
    <Section>
      <SectionTitle>Types</SectionTitle>
      <Box>
        {pokemon.types.map((type) => (
          <TypeChip
            key={type}
            type={type}
            sx={{ mr: 1, mb: 1, fontSize: '0.8rem' }}
          />
        ))}
      </Box>
    </Section>

    <Section>
      <SectionTitle>Physical</SectionTitle>
      <InfoText>
        <strong>Height:</strong> {formatHeightMeters(pokemon.height)}
      </InfoText>
      <InfoText>
        <strong>Weight:</strong> {formatWeightKilograms(pokemon.weight)}
      </InfoText>
      {pokemon.base_experience && (
        <InfoText>
          <strong>Base XP:</strong> {pokemon.base_experience}
        </InfoText>
      )}
    </Section>

    <Section>
      <SectionTitle>Abilities</SectionTitle>
      {pokemon.abilities.map((ability) => (
        <InfoText
          key={ability.name}
          sx={{ textTransform: 'capitalize' }}
        >
          • {ability.name.replace('-', ' ')}
          {ability.is_hidden && ' (Hidden)'}
        </InfoText>
      ))}
    </Section>
  </>
);

export default PokemonInfoSection;
