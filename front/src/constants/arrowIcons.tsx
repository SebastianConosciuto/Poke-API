/**
 * Arrow icon factory — kept in a .tsx file so .ts modules elsewhere can
 * import data without pulling in JSX.
 */

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import type React from 'react';

import type { ArrowKey } from './arrows';

export const ARROW_ICONS: Record<ArrowKey, React.ReactElement> = {
  up: <KeyboardArrowUpIcon />,
  down: <KeyboardArrowDownIcon />,
  left: <KeyboardArrowLeftIcon />,
  right: <KeyboardArrowRightIcon />,
};
