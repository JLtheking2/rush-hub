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
`;
