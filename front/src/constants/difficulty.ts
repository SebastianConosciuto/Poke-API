/**
 * Difficulty tier definitions.
 *
 * Single source of truth on the frontend — mirrors back/app/core/difficulty.py.
 * Keep numbers identical to the backend; CLAUDE.md flags these as design spec.
 */

export type DifficultyKey =
  | 'weak'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'legendary'
  | 'mythical';

export interface DifficultyTier {
  key: DifficultyKey;
  /** Human-readable range, e.g. '180-300 (Weak)'. */
  label: string;
  /** Short label e.g. 'Weak' for compact contexts. */
  shortLabel: string;
  /** Inclusive lower bound on stats_total. */
  min: number;
  /** Inclusive upper bound on stats_total. 9999 = no upper bound. */
  max: number;
  /** Number of QTE buttons. */
  buttons: number;
  /** Seconds allowed per QTE button. */
  timePerButton: number;
  /** XP awarded on a successful catch. */
  xpSuccess: number;
  /** XP awarded on a failed catch (consolation). */
  xpFailure: number;
  /** Color used in difficulty selectors and chips. */
  color: string;
}

export const DIFFICULTY_TIERS: DifficultyTier[] = [
  {
    key: 'weak',
    label: '180-300 (Weak)',
    shortLabel: 'Weak',
    min: 180, max: 300,
    buttons: 3, timePerButton: 1.5,
    xpSuccess: 10, xpFailure: 5,
    color: '#8BC34A',
  },
  {
    key: 'easy',
    label: '301-400 (Easy)',
    shortLabel: 'Easy',
    min: 301, max: 400,
    buttons: 4, timePerButton: 1.2,
    xpSuccess: 20, xpFailure: 10,
    color: '#4CAF50',
  },
  {
    key: 'medium',
    label: '401-500 (Medium)',
    shortLabel: 'Medium',
    min: 401, max: 500,
    buttons: 5, timePerButton: 1.0,
    xpSuccess: 30, xpFailure: 15,
    color: '#FF9800',
  },
  {
    key: 'hard',
    label: '501-600 (Hard)',
    shortLabel: 'Hard',
    min: 501, max: 600,
    buttons: 6, timePerButton: 0.8,
    xpSuccess: 40, xpFailure: 20,
    color: '#F44336',
  },
  {
    key: 'legendary',
    label: '601-720 (Legendary)',
    shortLabel: 'Legendary',
    min: 601, max: 720,
    buttons: 7, timePerButton: 0.6,
    xpSuccess: 50, xpFailure: 25,
    color: '#9C27B0',
  },
  {
    key: 'mythical',
    label: '721+ (Mythical)',
    shortLabel: 'Mythical',
    min: 721, max: 9999,
    buttons: 8, timePerButton: 0.5,
    xpSuccess: 60, xpFailure: 30,
    color: '#FF1744',
  },
];

/** O(1) lookup by key. */
const TIER_BY_KEY: Record<DifficultyKey, DifficultyTier> = DIFFICULTY_TIERS.reduce(
  (acc, tier) => {
    acc[tier.key] = tier;
    return acc;
  },
  {} as Record<DifficultyKey, DifficultyTier>,
);

export const getDifficultyTier = (key: string | null | undefined): DifficultyTier | undefined =>
  key ? TIER_BY_KEY[key.toLowerCase() as DifficultyKey] : undefined;

/** Render the QTE description, e.g. "3 buttons, 1.5s per button". */
export const formatQteDescription = (tier: DifficultyTier): string =>
  `${tier.buttons} buttons, ${tier.timePerButton}s per button`;
