import { cropperWidth } from '@cardEditor/editor/ImagesForm/constants';
import { styled } from '@css';

export const Wrapper = styled('div')<{ $aspect: number }>`
  position: relative;
  background: ${({ theme }) => theme.palette.background.default};
  width: 100%;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  max-width: ${cropperWidth}px;
  margin: 0 auto;
  aspect-ratio: ${({ $aspect }) => $aspect};

  [data-testid='container'] {
    border-radius: ${({ theme }) => theme.shape.borderRadius}px;
    z-index: 1;
  }
`;

export const Overlay = styled('div')<{ $zIndex: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: ${({ $zIndex }) => $zIndex};
  opacity: 0.5;
  pointer-events: none;
`;
