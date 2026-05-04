/**
 * Pure string-formatting helpers.
 *
 * These were inlined across many components — capitalize, hyphen-aware
 * title-casing, padded ID strings, etc. Centralizing avoids drift.
 */

/** 'pikachu' -> 'Pikachu'. Empty input stays empty. */
export const capitalize = (value: string): string =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : '';

/** 'rough-terrain' -> 'Rough Terrain'. Splits on '-' and title-cases each word. */
export const formatHyphenated = (value: string): string =>
  value
    .split('-')
    .map(capitalize)
    .join(' ');

/** Zero-pad a Pokemon ID for display: 25 -> '025'. */
export const padPokemonId = (id: number, width = 3): string =>
  id.toString().padStart(width, '0');

/** Pokemon API returns height/weight in decimeters / hectograms. */
export const formatHeightMeters = (height: number): string =>
  `${(height / 10).toFixed(1)}m`;

export const formatWeightKilograms = (weight: number): string =>
  `${(weight / 10).toFixed(1)}kg`;
