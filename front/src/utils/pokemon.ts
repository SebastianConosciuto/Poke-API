/**
 * Pokemon-specific helpers used by multiple components.
 */

import type { PokemonDetail } from '../services/pokemonService';

const PLACEHOLDER_SPRITE = '/placeholder-pokemon.png';

/** Pick the best sprite from a PokemonDetail, with a placeholder fallback. */
export const getDetailSpriteUrl = (pokemon: PokemonDetail): string =>
  pokemon.sprites?.other?.['official-artwork']?.front_default ||
  pokemon.sprites?.front_default ||
  PLACEHOLDER_SPRITE;

/** Sprite for a basic Pokemon list item with a placeholder fallback. */
export const getBasicSpriteUrl = (sprite: string | null): string =>
  sprite || PLACEHOLDER_SPRITE;

/**
 * Color-code a stat value on a 0-255 scale. Used by the detail modal stat bars.
 */
export const getStatColor = (value: number): string => {
  if (value >= 120) return '#4CAF50';
  if (value >= 80) return '#8BC34A';
  if (value >= 50) return '#FFC107';
  if (value >= 30) return '#FF9800';
  return '#FF5722';
};

/** XP progress as a 0–100 percentage. */
export const calculateXpProgress = (
  experienceInLevel: number,
  experienceToNextLevel: number,
): number => {
  const total = experienceInLevel + experienceToNextLevel;
  return total > 0 ? (experienceInLevel / total) * 100 : 0;
};
