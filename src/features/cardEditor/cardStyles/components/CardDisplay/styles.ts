import { styled } from '@css';

export const CardContainer = styled('div')<{
  $fontSize: number;
  $height: number;
}>`
  position: relative;
  z-index: 1;
  font-size: ${({ $fontSize }) => `${$fontSize}px`};
  height: ${({ $height }) => `${$height}px`};
  overflow: hidden;
  background: #fff;
`;

export const CardContent = styled('div')`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 10;

  /* Click targets linking the card to the form (see layers/HotspotLayer) */
  [data-card-ui] {
    cursor: pointer;
    border-radius: 2px;
  }
  [data-card-ui][data-cursor='text'] {
    cursor: text;
  }
  [data-card-ui]:hover {
    outline: 1px dashed rgba(25, 118, 210, 0.9);
    background: rgba(25, 118, 210, 0.08);
  }
`;
