import { styled } from '@css';

export const Grid = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: ${({ theme }) => theme.spacing(1)};

  .MuiToggleButton-root {
    display: flex;
    justify-content: flex-start;
    gap: ${({ theme }) => theme.spacing(1)};
    text-transform: none;
  }
`;

export const Swatch = styled('span')<{ $color: string }>`
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  // Visible on both the near-black (Xyz) and pale (Synchro) frames
  box-shadow: 0 0 0 1px ${({ theme }) => theme.palette.divider};
`;
