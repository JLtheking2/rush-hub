import { Forward as ForwardIcon } from '@mui/icons-material';
import { SEO } from '@layout';
import { Button, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { FC } from 'react';
import { siteDescription } from 'src/constants';
import NextLink from 'next/link';
import Routes from '@routes';

const NotFoundPage: FC = () => (
  <>
    <SEO title="Page not found" description={siteDescription} />
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={4}
      width="fit-content"
      margin="0 auto"
    >
      <Typography variant="h1" component="h2">
        Oh no! Page not found!
      </Typography>
      <NextLink href={Routes.Creator} passHref>
        <Button variant="contained" fullWidth endIcon={<ForwardIcon />}>
          Get Started Now
        </Button>
      </NextLink>
    </Box>
  </>
);

export default NotFoundPage;
