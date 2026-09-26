import { css, styled } from '@css';
import { FormControl } from '@mui/material';

export const StyledFormControl = styled(FormControl)<{ $noBorder?: boolean }>`
  flex-direction: row-reverse;
  align-items: center;
  justify-content: flex-end;

  ${({ $noBorder, theme }) =>
    !$noBorder &&
    css`
      border: 1px solid ${theme.custom.inputBorderColor};
      border-radius: ${theme.shape.borderRadius}px;
    `}
`;
