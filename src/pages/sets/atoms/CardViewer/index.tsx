import { FC, MouseEvent, useCallback, useEffect } from 'react';
import { Box, Dialog, IconButton, Typography } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { SetCard } from '@utils/setsData';
import { ViewerImage } from '../../styles';

interface Props {
  cards: SetCard[];
  index: number | null;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

const CardViewer: FC<Props> = ({ cards, index, onNavigate, onClose }) => {
  const open = index !== null;
  const card = open ? cards[index] : undefined;

  const hasPrevious = open && index > 0;
  const hasNext = open && index < cards.length - 1;

  const goPrevious = useCallback(() => {
    if (index !== null && index > 0) onNavigate(index - 1);
  }, [index, onNavigate]);

  const goNext = useCallback(() => {
    if (index !== null && index < cards.length - 1) onNavigate(index + 1);
  }, [index, cards.length, onNavigate]);

  // Clicking the empty space around the card dismisses the viewer, so anything
  // interactive (the arrows) and the card itself must swallow their own clicks.
  const stopPropagation = useCallback((event: MouseEvent) => {
    event.stopPropagation();
  }, []);

  const handlePreviousClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      goPrevious();
    },
    [goPrevious],
  );

  const handleNextClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      goNext();
    },
    [goNext],
  );

  // A disabled MUI IconButton has `pointer-events: none`, which would let the
  // click fall through to the dismiss surface behind it.
  const navButtonSx = { '&.Mui-disabled': { pointerEvents: 'auto' } };

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') goPrevious();
      if (event.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, goPrevious, goNext]);

  // The full-size PNGs are ~1MB each, so warm the neighbours to keep arrow
  // navigation from flashing an empty frame.
  useEffect(() => {
    if (index === null) return;
    [index - 1, index + 1]
      .filter(i => i >= 0 && i < cards.length)
      .forEach(i => {
        const image = new Image();
        image.src = cards[i].full;
      });
  }, [index, cards]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(0, 0, 0, 0.92)',
          color: 'common.white',
        },
      }}
    >
      {!!card && (
        <Box
          height="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={2}
          p={[2, 4]}
          onClick={onClose}
        >
          <IconButton
            onClick={onClose}
            aria-label="Close"
            color="inherit"
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
          >
            <CloseIcon />
          </IconButton>

          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={[1, 3]}
            width="100%"
            minHeight={0}
          >
            <IconButton
              onClick={handlePreviousClick}
              disabled={!hasPrevious}
              aria-label="Previous card"
              size="large"
              color="inherit"
              sx={{
                display: ['none', 'inline-flex'],
                flexShrink: 0,
                ...navButtonSx,
              }}
            >
              <ChevronLeftIcon fontSize="large" />
            </IconButton>

            <ViewerImage
              src={card.full}
              alt={card.name}
              onClick={stopPropagation}
            />

            <IconButton
              onClick={handleNextClick}
              disabled={!hasNext}
              aria-label="Next card"
              size="large"
              color="inherit"
              sx={{
                display: ['none', 'inline-flex'],
                flexShrink: 0,
                ...navButtonSx,
              }}
            >
              <ChevronRightIcon fontSize="large" />
            </IconButton>
          </Box>

          <Typography variant="subtitle1" textAlign="center">
            {card.number} · {card.name}
            {card.quantity > 1 && ` ×${card.quantity}`}
          </Typography>

          {/* On narrow screens there is no room beside the card */}
          <Box display={['flex', 'none']} gap={6} flexShrink={0}>
            <IconButton
              onClick={handlePreviousClick}
              disabled={!hasPrevious}
              aria-label="Previous card"
              size="large"
              color="inherit"
              sx={navButtonSx}
            >
              <ChevronLeftIcon fontSize="large" />
            </IconButton>
            <IconButton
              onClick={handleNextClick}
              disabled={!hasNext}
              aria-label="Next card"
              size="large"
              color="inherit"
              sx={navButtonSx}
            >
              <ChevronRightIcon fontSize="large" />
            </IconButton>
          </Box>
        </Box>
      )}
    </Dialog>
  );
};

export default CardViewer;
