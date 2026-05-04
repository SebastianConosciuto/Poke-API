/**
 * useSnackbar — the trivial open/close/severity state used by Snackbar UIs.
 *
 * Removes the boilerplate `{ open, message, severity }` state object that was
 * being recreated inline in CatchPokemon.
 */

import { useCallback, useState } from 'react';

export type SnackbarSeverity = 'success' | 'error' | 'info' | 'warning';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
}

const INITIAL: SnackbarState = {
  open: false,
  message: '',
  severity: 'success',
};

export const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState<SnackbarState>(INITIAL);

  const show = useCallback((message: string, severity: SnackbarSeverity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const close = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return { snackbar, show, close };
};
