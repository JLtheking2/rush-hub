import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { FC } from 'react';
import { PolicySectionProps } from './types';

const PolicySection: FC<PolicySectionProps> = ({
  title,
  children,
  ...props
}) => (
  <Box
    component="section"
    display="flex"
    flexDirection="column"
    gap={2}
    {...props}
  >
    {title && <Typography variant="h3">{title}</Typography>}
    {children}
  </Box>
);

export default PolicySection;
