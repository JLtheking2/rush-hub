import { styled } from '@css';
import { Paper } from '@mui/material';
import { Container } from '@mui/system';

// General layout

export const Background = styled('div')`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${({ theme }) => theme.custom.backgroundGradient};
`;

export const MainContainer = styled(Container)`
  padding: ${({ theme }) => theme.spacing(5, 3)};
  flex-grow: 1;
`;

// Homepage

export const PaperBox = styled(Paper)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spacing(4)};
  gap: ${({ theme }) => theme.spacing(4)};
`;

/**
 * The two landing-page destinations. Deliberately never stacks — the tiles stay
 * side by side at every width. `minmax(0, 1fr)` keeps the columns from being
 * widened by their content, so they simply shrink on narrow screens.
 */
export const HomeNavGrid = styled('div')`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing(4)};
  width: 100%;
`;

export const HomeNavButton = styled('a')`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  color: inherit;
  text-decoration: none;
  text-align: center;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  transition: transform 150ms ease, filter 150ms ease;

  &:hover,
  &:focus-visible {
    transform: translateY(-4px);
    filter: brightness(1.08);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.primary.main};
    outline-offset: 4px;
  }
`;

/**
 * Fixes both tiles to the same box despite the two source images having
 * different aspect ratios, so the grid doesn't reflow as they load.
 */
export const HomeNavThumbnail = styled('img')`
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: contain;
  /* drop-shadow follows the image, not the (letterboxed) box */
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35));
`;
