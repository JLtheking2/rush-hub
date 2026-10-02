import { FC } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

interface Props {
  label: string;
  position: string;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * Previous / next arrows under the card preview, for stepping through a set —
 * either a published Set Browser set or the folder a local card was loaded
 * from. Purely presentational; the caller decides what "next" means.
 */
const CardNav: FC<Props> = ({
  label,
  position,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}) => (
  <Box display="flex" alignItems="center" justifyContent="space-between">
    <IconButton
      onClick={onPrevious}
      disabled={!hasPrevious}
      aria-label="Previous card"
    >
      <ChevronLeftIcon fontSize="large" />
    </IconButton>
    <Box textAlign="center" minWidth={0}>
      <Typography variant="subtitle2" noWrap>
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {position}
      </Typography>
    </Box>
    <IconButton onClick={onNext} disabled={!hasNext} aria-label="Next card">
      <ChevronRightIcon fontSize="large" />
    </IconButton>
  </Box>
);

export default CardNav;
