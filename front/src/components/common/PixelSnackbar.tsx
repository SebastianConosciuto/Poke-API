/**
 * PixelSnackbar — themed Snackbar with pixel-border Alert. Pairs with useSnackbar.
 */

import { Alert, Snackbar } from '@mui/material';
import type { SnackbarProps } from '@mui/material';
import React from 'react';

import type { SnackbarSeverity } from '../../hooks/useSnackbar';

interface PixelSnackbarProps extends Omit<SnackbarProps, 'children'> {
  message: string;
  severity: SnackbarSeverity;
  onClose: () => void;
  /** Auto-hide delay in ms; defaults to 4000. */
  autoHide?: number;
}

const PixelSnackbar: React.FC<PixelSnackbarProps> = ({
  message,
  severity,
  onClose,
  autoHide = 4000,
  ...props
}) => (
  <Snackbar
    autoHideDuration={autoHide}
    onClose={onClose}
    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    {...props}
  >
    <Alert
      onClose={onClose}
      severity={severity}
      sx={{
        fontFamily: '"Roboto Mono", monospace',
        border: '3px solid currentColor',
        borderRadius: 0,
      }}
    >
      {message}
    </Alert>
  </Snackbar>
);

export default PixelSnackbar;
