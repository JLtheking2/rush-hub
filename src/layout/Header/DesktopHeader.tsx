import { Forward as ForwardIcon } from '@mui/icons-material';
import { Button, Link } from '@mui/material';
import Routes from '@routes';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { FC, useMemo } from 'react';
import { NavItems } from './styles';

interface Cta {
  href: string;
  label: string;
}

const defaultCta: Cta = { href: Routes.Creator, label: 'Get started now' };

/**
 * The header CTA always points at the *other* main page, so /creator and /sets
 * cross-link to each other. Every other page falls back to the creator.
 */
const ctasByPathname: Record<string, Cta> = {
  [Routes.Creator]: { href: Routes.Sets, label: 'Browse completed sets' },
  [Routes.Sets]: { href: Routes.Creator, label: 'Card creator' },
};

const DesktopHeader: FC = () => {
  const { pathname } = useRouter();

  const { href, label } = useMemo<Cta>(
    () => ctasByPathname[pathname] ?? defaultCta,
    [pathname],
  );

  return (
    <NavItems>
      <NextLink href={href} passHref>
        <Button component={Link} color="inherit" endIcon={<ForwardIcon />}>
          {label}
        </Button>
      </NextLink>
    </NavItems>
  );
};

export default DesktopHeader;
