import { GitHub as GitHubIcon } from '@mui/icons-material';
import { Box, IconButton, Paper, Typography } from '@mui/material';
import Routes from '@routes';
import { FC } from 'react';
import FooterDivider from './components/FooterDivider';

const Footer: FC = () => (
  <Paper
    component="footer"
    sx={{
      p: [8, undefined, 1],
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: [2, undefined, 0],
      flexWrap: 'wrap',
      borderRadius: 0,
      flexDirection: ['column', undefined, 'row'],
    }}
  >
    <Typography variant="h6" align="center">
      © {new Date().getFullYear()} JLtheking2
    </Typography>
    <Box ml={2.5} mr={1} py={1} display={['none', undefined, 'block']}>
      <FooterDivider />
    </Box>
    <IconButton color="inherit" target="_blank" href={Routes.GitHub.Home}>
      <GitHubIcon />
    </IconButton>
    {process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production' && (
      <>
        <Box mx={2.5} py={1} display={['none', undefined, 'block']}>
          <FooterDivider />
        </Box>
        <Typography
          variant="h6"
          align="center"
          fontWeight="bold"
          textTransform="uppercase"
        >
          {process.env.NEXT_PUBLIC_ENVIRONMENT}
        </Typography>
      </>
    )}
  </Paper>
);

export default Footer;
