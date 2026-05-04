/**
 * Difficulty tier definitions.
 *
 * Single source of truth on the frontend — mirrors back/app/core/difficulty.py.
 * Keep numbers identical to the backend.
 *
 * Stat ranges were rebalanced in May 2026 against the actual BST distribution
 * of the populated `pokemon` table — see app/core/difficulty.py for rationale.
 * Buttons / time / XP per tier are unchanged from the original spec.
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
  /** Human-readable range, e.g. '0-310 (Weak)'. */
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
    label: '≤ 310 (Weak)',
    shortLabel: 'Weak',
    min: 0, max: 310,
    buttons: 3, timePerButton: 1.5,
    xpSuccess: 10, xpFailure: 5,
    color: '#8BC34A',
  },
  {
    key: 'easy',
    label: '311-385 (Easy)',
    shortLabel: 'Easy',
    min: 311, max: 385,
    buttons: 4, timePerButton: 1.2,
    xpSuccess: 20, xpFailure: 10,
    color: '#4CAF50',
  },
  {
    key: 'medium',
    label: '386-460 (Medium)',
    shortLabel: 'Medium',
    min: 386, max: 460,
    buttons: 5, timePerButton: 1.0,
    xpSuccess: 30, xpFailure: 15,
    color: '#FF9800',
  },
  {
    key: 'hard',
    label: '461-525 (Hard)',
    shortLabel: 'Hard',
    min: 461, max: 525,
    buttons: 6, timePerButton: 0.8,
    xpSuccess: 40, xpFailure: 20,
    color: '#F44336',
  },
  {
    key: 'legendary',
    label: '526-595 (Legendary)',
    shortLabel: 'Legendary',
    min: 526, max: 595,
    buttons: 7, timePerButton: 0.6,
    xpSuccess: 50, xpFailure: 25,
    color: '#9C27B0',
  },
  {
    key: 'mythical',
    label: '596+ (Mythical)',
    shortLabel: 'Mythical',
    min: 596, max: 9999,
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
