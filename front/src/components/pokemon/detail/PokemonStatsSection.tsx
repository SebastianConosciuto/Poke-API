/**
 * Stats sub-section of the PokemonDetailModal — shows the six base stats
 * with color-coded progress bars and a total below.
 */

import { Box, LinearProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

import type { PokemonStat } from '../../../services/pokemonService';
import { getStatColor } from '../../../utils';

const StatBar = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
}));

const StatLabel = styled(Typography)(({ theme }) => ({
  fontFamily: '"Roboto Mono", monospace',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  textTransform: 'capitalize',
  marginBottom: theme.spacing(0.5),
}));

const StyledLinearProgress = styled(LinearProgress)({
  height: 12,
  borderRadius: 0,
  border: '2px solid #000',
  backgroundColor: '#E0E0E0',
});

interface PokemonStatsSectionProps {
  stats: PokemonStat[];
  total: number;
}

const PokemonStatsSection: React.FC<PokemonStatsSectionProps> = ({ stats, total }) => (
  <>
    {stats.map((stat) => {
      const color = getStatColor(stat.base_stat);
      return (
        <StatBar key={stat.name}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <StatLabel>{stat.name.replace('-', ' ')}</StatLabel>
            <Typography
              sx={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '0.7rem',
                color,
                fontWeight: 'bold',
              }}
            >
              {stat.base_stat}
            </Typography>
          </Box>
          <StyledLinearProgress
            variant="determinate"
            value={(stat.base_stat / 255) * 100}
            sx={{
              '& .MuiLinearProgress-bar': { backgroundColor: color },
            }}
          />
        </StatBar>
      );
    })}
    <Box
      sx={{
        mt: 2,
        pt: 2,
        borderTop: '2px solid #000',
        textAlign: 'center',
      }}
    >
      <Typography
        sx={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '0.875rem',
          color: 'primary.main',
        }}
      >
        Total: {total}
      </Typography>
    </Box>
  </>
);

export default PokemonStatsSection;
