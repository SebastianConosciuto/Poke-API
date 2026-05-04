/**
 * useCountdown — ticks `seconds` down to zero once a second.
 *
 * Used by the QTE minigame for the "3, 2, 1, GO" intro.
 */

import { useEffect, useState } from 'react';

interface UseCountdownOptions {
  /** Initial seconds value. */
  from: number;
  /** Whether the countdown should be running. */
  active: boolean;
  /** Called when the countdown reaches zero. */
  onComplete?: () => void;
}

export const useCountdown = ({ from, active, onComplete }: UseCountdownOptions) => {
  const [count, setCount] = useState(from);

  // Reset whenever the parent flips us back on.
  useEffect(() => {
    if (active) setCount(from);
  }, [active, from]);

  useEffect(() => {
    if (!active) return;
    if (count <= 0) {
      onComplete?.();
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [active, count, onComplete]);

  return count;
};
