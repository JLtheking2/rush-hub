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

  // Custom sheet: ?cards=<SetId>/<cardId>*<copies>,... (copies defaults to 1).
  const customCards = useMemo<SetCard[] | undefined>(() => {
    const raw = Array.isArray(router.query.cards)
      ? router.query.cards[0]
      : router.query.cards;
    if (!raw) return undefined;
    const list: SetCard[] = [];
    raw.split(',').forEach(entry => {
      const [ref, copies = '1'] = entry.split('*');
      const [setId, cardId] = ref.split('/');
      const card = sets
        .find(set => set.id === setId)
        ?.cards.find(c => c.id === cardId);
      if (!card) return;
      for (let i = 0; i < Number(copies); i += 1) list.push(card);
    });
    return list;
  }, [router.query.cards]);

  // A set prints each card as many times as its quantity.
  const printCards = useMemo<SetCard[] | undefined>(
    () =>
      customCards ??
      selectedSet?.cards.flatMap(card =>
        Array.from({ length: card.quantity }, () => card),
      ),
    [customCards, selectedSet],
  );

  const sheets = useMemo<SetCard[][]>(() => {
    const source = printCards;
    if (!source) return [];
    const chunks: SetCard[][] = [];
    for (let i = 0; i < source.length; i += cardsPerSheet) {
      chunks.push(source.slice(i, i + cardsPerSheet));
    }
    return chunks;
  }, [printCards]);

  // router.query is empty until the router is ready on a statically exported
  // page, so an unknown set can only be reported once it is.
  if (!router.isReady) return null;

  if (!selectedSet && !customCards?.length) {
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
          href={{
            pathname: Routes.Sets,
            query: selectedSet ? { set: selectedSet.id } : {},
          }}
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
          {customCards ? 'Custom sheet' : selectedSet?.displayName} ·{' '}
          {printCards?.length ?? 0} cards · {sheets.length}{' '}
          {sheets.length === 1 ? 'sheet' : 'sheets'}
        </Typography>
      </PrintToolbar>
      {sheets.map((sheetCards, sheetIndex) => (
        // eslint-disable-next-line react/no-array-index-key
        <Sheet key={sheetIndex}>
          {sheetCards.map((card, cardIndex) => (
            // eslint-disable-next-line react/no-array-index-key
            <CardCell key={`${card.id}-${cardIndex}`}>
              <CardPrintImage src={card.full} alt={card.name} />
            </CardCell>
          ))}
        </Sheet>
      ))}
    </>
  );
};

export default Print;
