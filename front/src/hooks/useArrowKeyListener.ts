/**
 * useArrowKeyListener — invokes `onArrowKey` when the user presses an
 * arrow key, using the canonical KEY_MAP. Suppresses the default browser
 * scroll behaviour (so arrow keys never scroll the page during a QTE).
 */

import { useEffect } from 'react';

import { KEY_MAP, type ArrowKey } from '../constants';

interface UseArrowKeyListenerOptions {
  active: boolean;
  onArrowKey: (key: ArrowKey) => void;
}

export const useArrowKeyListener = ({
  active,
  onArrowKey,
}: UseArrowKeyListenerOptions): void => {
  useEffect(() => {
    if (!active) return undefined;

    const handler = (event: KeyboardEvent) => {
      const key = KEY_MAP[event.key];
      if (!key) return;
      event.preventDefault();
      onArrowKey(key);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, onArrowKey]);
};
