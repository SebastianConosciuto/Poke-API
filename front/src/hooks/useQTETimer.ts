/**
 * useQTETimer — ticks a 0–100 progress bar down to zero over `secondsPerButton`.
 *
 * Calls `onTimeout` once when the bar empties. The internal `tick` value is
 * driven by setInterval(10ms) so the animation looks smooth.
 *
 * `resetKey` is used to restart the timer when the player advances to the
 * next button — usually pass `currentIndex` from the parent component.
 */

import { useEffect, useRef, useState } from 'react';

interface UseQTETimerOptions {
  active: boolean;
  secondsPerButton: number;
  resetKey: unknown;
  onTimeout: () => void;
}

const TICK_INTERVAL_MS = 10;
const FULL = 100;

export const useQTETimer = ({
  active,
  secondsPerButton,
  resetKey,
  onTimeout,
}: UseQTETimerOptions) => {
  const [timeLeft, setTimeLeft] = useState(FULL);
  // Use refs so the interval body doesn't re-create on every prop change.
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    setTimeLeft(FULL);
  }, [resetKey]);

  useEffect(() => {
    if (!active) return undefined;

    const decrementPerTick = (FULL / (secondsPerButton * 1000)) * TICK_INTERVAL_MS;

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - decrementPerTick;
        if (next <= 0) {
          onTimeoutRef.current();
          return FULL; // Reset for the caller to react cleanly.
        }
        return next;
      });
    }, TICK_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [active, secondsPerButton, resetKey]);

  return timeLeft;
};
