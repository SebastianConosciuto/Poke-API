/**
 * Background gradients for habitats and regions.
 *
 * - HABITAT_BACKGROUNDS: used by the QTE minigame to theme the playing field.
 * - REGION_BACKGROUNDS: used by the catch page to theme the entire view.
 */

export interface GradientBackground {
  color: string;
  gradient: string;
}

export const HABITAT_BACKGROUNDS: Record<string, GradientBackground> = {
  grassland: {
    color: '#1a3a1a',
    gradient: 'linear-gradient(135deg, #1a4d1a 0%, #2d7a2d 100%)',
  },
  forest: {
    color: '#0d2a0d',
    gradient: 'linear-gradient(135deg, #0d3a0d 0%, #1a5a1a 100%)',
  },
  cave: {
    color: '#1a1a2e',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%)',
  },
  mountain: {
    color: '#3a3a3a',
    gradient: 'linear-gradient(135deg, #4a4a4a 0%, #5a5a5a 100%)',
  },
  rare: {
    color: '#3a1a4a',
    gradient: 'linear-gradient(135deg, #4a1a5a 0%, #6a2a7a 100%)',
  },
  'rough-terrain': {
    color: '#4a3a2a',
    gradient: 'linear-gradient(135deg, #5a4a3a 0%, #7a6a5a 100%)',
  },
  sea: {
    color: '#1a2a4a',
    gradient: 'linear-gradient(135deg, #1a3a5a 0%, #2a4a7a 100%)',
  },
  urban: {
    color: '#2a2a2a',
    gradient: 'linear-gradient(135deg, #3a3a3a 0%, #4a4a4a 100%)',
  },
  'waters-edge': {
    color: '#1a3a3a',
    gradient: 'linear-gradient(135deg, #2a4a4a 0%, #3a5a5a 100%)',
  },
};

export const REGION_BACKGROUNDS: Record<string, { gradient: string }> = {
  kanto: { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  johto: { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  hoenn: { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  sinnoh: { gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  unova: { gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  kalos: { gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  alola: { gradient: 'linear-gradient(135deg, #ffa751 0%, #ffe259 100%)' },
  galar: { gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  paldea: { gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
};

/** Pixel grid overlay used in several backgrounds. */
export const PIXEL_GRID_OVERLAY = `
  repeating-linear-gradient(
    90deg,
    transparent,
    transparent 20px,
    rgba(0, 0, 0, 0.02) 20px,
    rgba(0, 0, 0, 0.02) 40px
  ),
  repeating-linear-gradient(
    0deg,
    transparent,
    transparent 20px,
    rgba(0, 0, 0, 0.02) 20px,
    rgba(0, 0, 0, 0.02) 40px
  )
`;

export const ANY_FILTER_VALUE = 'any';

export const isAnyFilter = (value: string | null | undefined): boolean =>
  !value || value.toLowerCase() === ANY_FILTER_VALUE;
