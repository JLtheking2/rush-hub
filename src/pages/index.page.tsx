import { FC } from 'react';
import { SEO } from '@layout';
import { Box, Link, Typography } from '@mui/material';
import NextLink from 'next/link';
import Routes from '@routes';
import { siteDescription } from 'src/constants';
import { HomeNavButton, HomeNavGrid, PaperBox } from './styles';

const Home: FC = () => (
  <>
    <SEO fullTitle="Rush Hub" description={siteDescription} />
    <Box gap={4} display="flex" flexDirection="column">
      <PaperBox>
        <HomeNavGrid>
          <NextLink href={Routes.Creator} passHref>
            <HomeNavButton>
              <Typography variant="h4" component="span">
                Card Creator
              </Typography>
            </HomeNavButton>
          </NextLink>
          <NextLink href={Routes.Sets} passHref>
            <HomeNavButton>
              <Typography variant="h4" component="span">
                Browse Completed Sets
              </Typography>
            </HomeNavButton>
          </NextLink>
        </HomeNavGrid>
      </PaperBox>
      <PaperBox>
        <Typography textAlign="center">
          Rush Hub is a card maker for Yu-Gi-Oh! Rush Duel style cards, built as
          a hobby project for personal use.
        </Typography>
        <Typography textAlign="center">
          It descends from pokecardmaker.net via pokeoh-hub. Rush frames by
          AlixSep. Source at{' '}
          <Link href={Routes.GitHub.Home} target="_blank">
            github.com/JLtheking2/rush-hub
          </Link>
          .
        </Typography>
      </PaperBox>
    </Box>
  </>
);

export default Home;
