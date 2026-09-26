import { styled } from '@css';

/**
 * Responsive auto-fill grids. `minmax(0, 1fr)` keeps the columns from being
 * widened by their content.
 */
export const SetGridWrapper = styled('ul')`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: ${({ theme }) => theme.spacing(5)};
  padding: 0;
  margin: 0;
  list-style: none;
`;

export const CardGridWrapper = styled('ul')`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: ${({ theme }) => theme.spacing(4)};
  padding: 0;
  margin: 0;
  list-style: none;
`;

export const GridButton = styled('button')`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
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
 * Fixes each tile's box before the image loads, so the grid doesn't reflow as
 * 56 lazily-loaded thumbnails stream in.
 */
export const Thumbnail = styled('img')`
  display: block;
  width: 100%;
  aspect-ratio: 745 / 1040;
  object-fit: contain;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  box-shadow: ${({ theme }) => theme.shadows[3]};
  background-color: rgba(0, 0, 0, 0.2);
`;

export const CoverImage = styled('img')`
  display: block;
  width: 100%;
  aspect-ratio: 624 / 1247;
  object-fit: contain;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45));
`;

export const ViewerImage = styled('img')`
  display: block;
  /* min-width:0 lets this shrink inside the flex row instead of pushing the
     arrow buttons off the sides. */
  min-width: 0;
  max-width: 100%;
  max-height: 78vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows[8]};
`;
