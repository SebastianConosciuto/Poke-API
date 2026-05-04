/**
 * Static "How to Play" card.
 *
 * The body lists each tier with its XP rewards — pulled from DIFFICULTY_TIERS
 * so the numbers can never drift from the rest of the app.
 */

import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

import { PixelCard } from '../../common';
import { DIFFICULTY_TIERS } from '../../../constants';
import { capitalize } from '../../../utils';
import { animations } from '../../../styles/animations';

const SectionCard = styled(PixelCard)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  animation: `${animations.fadeIn} 0.7s ease-out`,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '1rem',
  color: theme.palette.secondary.main,
  marginBottom: theme.spacing(3),
}));

const InfoText = styled(Typography)(({ theme }) => ({
  fontFamily: '"Roboto Mono", monospace',
  fontSize: '1rem',
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(3),
  lineHeight: 1.8,
}));

const CatchInstructions: React.FC = () => (
  <SectionCard>
    <SectionTitle>How to Play</SectionTitle>

    <InfoText component="div">
      <strong>1. Select Location:</strong> Choose region and habitat (or "Any")<br />
      <strong>2. Choose Difficulty:</strong> Only available difficulties shown<br />
      {DIFFICULTY_TIERS.map((tier) => (
        <span key={tier.key}>
          • {capitalize(tier.shortLabel)}: {tier.min}-
          {tier.max === 9999 ? '∞' : tier.max} stats
          <br />
        </span>
      ))}
      <strong>3. Start Catch:</strong> Random Pokemon appears<br />
      <strong>4. Countdown:</strong> 3... 2... 1... Get ready!<br />
      <strong>5. QTE Challenge:</strong> Press arrow keys as they appear<br />
      <strong>6. Success:</strong> Add Pokemon to your Pokedex and gain XP!
    </InfoText>

    <Box
      sx={{
        mt: 2,
        p: 2,
        backgroundColor: 'rgba(59, 76, 202, 0.05)',
        border: '2px solid',
        borderColor: 'secondary.main',
      }}
    >
      <Typography
        component="div"
        sx={{
          fontFamily: '"Roboto Mono", monospace',
          fontSize: '0.85rem',
          color: 'text.secondary',
        }}
      >
        💡 <strong>Smart Filters:</strong> Options update based on available
        Pokemon<br />
        ⚡ <strong>XP Rewards:</strong> Higher difficulty = More XP!<br />
        {DIFFICULTY_TIERS.map((tier, i) => (
          <span key={tier.key}>
            &nbsp;&nbsp;• {capitalize(tier.shortLabel)}: {tier.xpSuccess} XP
            {i < DIFFICULTY_TIERS.length - 1 ? ' |' : ''}
            {(i + 1) % 3 === 0 ? <br /> : ' '}
          </span>
        ))}
        🌍 <strong>Tip:</strong> Select "Any" to search everywhere!
      </Typography>
    </Box>
  </SectionCard>
);

export default CatchInstructions;
