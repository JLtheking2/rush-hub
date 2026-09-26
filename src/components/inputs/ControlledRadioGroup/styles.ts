import { styled } from '@css';
import { RadioGroup } from '@mui/material';

export const StyledRadioGroup = styled(RadioGroup)`
  border: 1px solid ${({ theme }) => theme.custom.inputBorderColor};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  padding: ${({ theme }) => theme.spacing(1.5, 3)};
`;
