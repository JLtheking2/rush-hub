import ThemeToggle from '@components/ThemeToggle';
import { Box, Hidden, Link, Toolbar, Typography } from '@mui/material';
import Routes from '@routes';
import withBasePath from '@utils/withBasePath';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { FC } from 'react';
import DesktopHeader from './DesktopHeader';
import { DefaultAppBar, InvisibleHeading } from './styles';

const Header: FC = () => {
  const { pathname } = useRouter();

  return (
    <>
      {(pathname === Routes.Home || pathname === Routes.Creator) && (
        <InvisibleHeading>Rush Hub</InvisibleHeading>
      )}
      <DefaultAppBar position="relative" color="primary">
        <Toolbar>
          <NextLink href={Routes.Home} passHref>
            <Box
              component={Link}
              color="white"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                textDecoration: 'none',
                alignSelf: 'stretch',
              }}
            >
              <Typography variant="h1" color="white">
                Rush Hub
              </Typography>
              <Box
                component="img"
                src={withBasePath('/favicon/android-chrome-192x192.png')}
                alt=""
                sx={{
                  height: '100%',
                  width: 'auto',
                  imageRendering: 'pixelated',
                }}
              />
            </Box>
          </NextLink>
          <ThemeToggle />
          <Hidden smDown>
            <DesktopHeader />
          </Hidden>
        </Toolbar>
      </DefaultAppBar>
      {/* <Hidden mdUp>
      <MobileHeader />
    </Hidden> */}
    </>
  );
};

export default Header;
