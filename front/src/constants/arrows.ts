/**
 * Arrow key constants used by the QTE minigame.
 *
 * The four directions and the keyboard mapping. Icons are exported as a
 * factory in `arrowIcons.tsx` (separate file because this one is plain TS).
 */

export type ArrowKey = 'up' | 'down' | 'left' | 'right';

export const ARROW_KEYS: ArrowKey[] = ['up', 'down', 'left', 'right'];

/** Map browser KeyboardEvent.key values to our internal ArrowKey strings. */
export const KEY_MAP: Record<string, ArrowKey> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/** Display names used inside instructions, e.g. 'Press UP!'. */
export const ARROW_NAMES: Record<ArrowKey, string> = {
  up: 'UP',
  down: 'DOWN',
  left: 'LEFT',
  right: 'RIGHT',
};
