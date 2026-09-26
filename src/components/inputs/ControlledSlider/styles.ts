import { styled } from '@css';

export const Wrapper = styled('div')`
  border: 1px solid ${({ theme }) => theme.custom.inputBorderColor};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  padding: ${({ theme }) => theme.spacing(2, 3, 0, 3)};
`;
