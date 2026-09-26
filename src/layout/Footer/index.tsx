import { GitHub as GitHubIcon } from '@mui/icons-material';
import { Box, IconButton, Link, Paper, Typography } from '@mui/material';
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
    <Typography
      variant="caption"
      align="center"
      sx={{ flexBasis: '100%', px: 2, pb: [0, undefined, 1] }}
    >
      Rush Duel frames by AlixSep · layout reference:{' '}
      <Link href="https://ygopro.org/yugioh-card-maker" target="_blank">
        Neo New Card Maker
      </Link>{' '}
      · based on{' '}
      <Link href="https://github.com/karl/pokecardmaker.net" target="_blank">
        pokecardmaker.net
      </Link>{' '}
      via{' '}
      <Link href="https://github.com/JLtheking2/pokeoh-hub" target="_blank">
        pokeoh-hub
      </Link>
    </Typography>
  </Paper>
);

export default Footer;
