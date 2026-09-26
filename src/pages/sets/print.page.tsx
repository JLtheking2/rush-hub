import { FC, useMemo } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Box, Button, Link, Typography } from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { GlobalStyles } from '@css';
import { SEO } from '@layout';
import Routes from '@routes';
import sets, { SetCard } from '@utils/sets';
import {
  CardCell,
  CardPrintImage,
  PrintToolbar,
  Sheet,
  printGlobalStyles,
} from './printStyles';

const description =
  'Printable 3x3 sheets of a Rush Hub card set, sized for A4 paper.';

const cardsPerSheet = 9;

const Print: FC = () => {
  const router = useRouter();

  const selectedSet = useMemo(() => {
    const querySetId = Array.isArray(router.query.set)
      ? router.query.set[0]
      : router.query.set;
    return sets.find(set => set.id === querySetId);
  }, [router.query.set]);

  const sheets = useMemo<SetCard[][]>(() => {
    if (!selectedSet) return [];
    const chunks: SetCard[][] = [];
    for (let i = 0; i < selectedSet.cards.length; i += cardsPerSheet) {
      chunks.push(selectedSet.cards.slice(i, i + cardsPerSheet));
    }
    return chunks;
  }, [selectedSet]);

  // router.query is empty until the router is ready on a statically exported
  // page, so an unknown set can only be reported once it is.
  if (!router.isReady) return null;

  if (!selectedSet) {
    return (
      <>
        <SEO title="Print sheets" description={description} />
        <Box display="flex" flexDirection="column" gap={3}>
          <Typography variant="h2">Set not found</Typography>
          <NextLink href={Routes.Sets} passHref>
            <Link>Back to all sets</Link>
          </NextLink>
        </Box>
      </>
    );
  }

  return (
    <>
      <SEO title="Print sheets" description={description} />
      <GlobalStyles styles={printGlobalStyles} />
      <PrintToolbar>
        <NextLink
          href={{ pathname: Routes.Sets, query: { set: selectedSet.id } }}
          passHref
        >
          <Button
            component="a"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            // The theme absolutely-positions startIcon into a left gutter, so a
            // non-fullWidth button must pad its label clear of it.
            sx={{ pl: 10 }}
          >
            Back to set
          </Button>
        </NextLink>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={() => window.print()}
          sx={{ pl: 10 }}
        >
          Print
        </Button>
        <Typography variant="caption" color="text.secondary">
          {selectedSet.displayName} · {selectedSet.cards.length} cards ·{' '}
          {sheets.length} {sheets.length === 1 ? 'sheet' : 'sheets'}
        </Typography>
      </PrintToolbar>
      {sheets.map(sheetCards => (
        <Sheet key={sheetCards[0].id}>
          {sheetCards.map(card => (
            <CardCell key={card.id}>
              <CardPrintImage src={card.full} alt={card.name} />
            </CardCell>
          ))}
        </Sheet>
      ))}
    </>
  );
};

export default Print;
