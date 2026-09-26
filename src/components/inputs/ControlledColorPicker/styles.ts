import { styled } from '@css';
import { FormControl } from '@mui/material';

export const StyledFormControl = styled(FormControl)`
  > div,
  [data-testid='colorpicker-input'] {
    width: 100%;
  }

  button > div {
    border: 1px solid ${({ theme }) => theme.custom.inputBorderColor};
  }
`;
