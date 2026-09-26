import { FC } from 'react';
import { SEO } from '@layout';
import { Box, Link, Typography } from '@mui/material';
import NextLink from 'next/link';
import Routes from '@routes';
import { siteDescription } from 'src/constants';
import withBasePath from '@utils/withBasePath';
import {
  HomeNavButton,
  HomeNavGrid,
  HomeNavThumbnail,
  PaperBox,
} from './styles';

const Home: FC = () => (
  <>
    <SEO fullTitle="Rush Hub" description={siteDescription} />
    <Box gap={4} display="flex" flexDirection="column">
      <PaperBox>
        <HomeNavGrid>
          <NextLink href={Routes.Creator} passHref>
            <HomeNavButton>
              <HomeNavThumbnail
                src={withBasePath('/assets/home/creator.webp')}
                alt=""
              />
              <Typography variant="h4" component="span">
                Card Creator
              </Typography>
            </HomeNavButton>
          </NextLink>
          <NextLink href={Routes.Sets} passHref>
            <HomeNavButton>
              <HomeNavThumbnail
                src={withBasePath('/assets/home/sets.webp')}
                alt=""
              />
              <Typography variant="h4" component="span">
                Browse Completed Sets
              </Typography>
            </HomeNavButton>
          </NextLink>
        </HomeNavGrid>
      </PaperBox>
      <PaperBox>
        <Typography textAlign="center">
          Rush Hub is a card maker for Yu-Gi-Oh! Rush Duel style cards — all
          nine templates, from Normal monsters to Spells and Traps. Design a
          card, export it as a 421 × 614 px PNG, and publish finished cards into
          sets that can be browsed in full resolution and printed on A4 sheets.
          It is a non-commercial fan project made as a hobby.
        </Typography>
        <Typography textAlign="center">
          Rush Duel card frames are by{' '}
          <Link href="https://ygopro.org/yugioh-card-maker" target="_blank">
            AlixSep, via the Neo New Card Maker
          </Link>
          . Rush Hub descends from{' '}
          <Link
            href="https://github.com/karl/pokecardmaker.net"
            target="_blank"
          >
            pokecardmaker.net
          </Link>{' '}
          by way of{' '}
          <Link href="https://github.com/JLtheking2/pokeoh-hub" target="_blank">
            pokeoh-hub
          </Link>
          . Yu-Gi-Oh! and Rush Duel belong to Konami. Source at{' '}
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
