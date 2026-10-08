import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Box, Button, Typography } from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { SEO } from '@layout';
import Routes from '@routes';
import sets from '@utils/sets';
import CardGrid from './atoms/CardGrid';
import CardViewer from './atoms/CardViewer';
import SetGrid from './atoms/SetGrid';

const description =
  'Browse every Rush Hub card set and view each card in full resolution.';

const Sets: FC = () => {
  const router = useRouter();
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const selectedSet = useMemo(
    () => sets.find(set => set.id === selectedSetId),
    [selectedSetId],
  );

  const totalCopies = useMemo(
    () => selectedSet?.cards.reduce((sum, card) => sum + card.quantity, 0) ?? 0,
    [selectedSet],
  );

  // Keep the selection in the URL so a set view is linkable and the browser
  // back button works. A dynamic /sets/[id] route would need getStaticPaths,
  // which doesn't fit this project's `next export` build.
  useEffect(() => {
    if (!router.isReady) return;
    const querySetId = Array.isArray(router.query.set)
      ? router.query.set[0]
      : router.query.set;
    const nextId = sets.some(set => set.id === querySetId)
      ? (querySetId as string)
      : null;
    setSelectedSetId(nextId);
    if (nextId === null) setViewerIndex(null);
  }, [router.isReady, router.query.set]);

  const selectSet = useCallback(
    (setId: string | null) => {
      router.push(
        setId ? { pathname: '/sets', query: { set: setId } } : '/sets',
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  return (
    <>
      <SEO title="Sets" description={description} />
      <Box display="flex" flexDirection="column" gap={4}>
        {!selectedSet ? (
          <>
            <Typography variant="h2">Sets</Typography>
            <SetGrid sets={sets} onSelect={selectSet} />
          </>
        ) : (
          <>
            <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => selectSet(null)}
                // The theme absolutely-positions startIcon into a left gutter,
                // so a non-fullWidth button must pad its label clear of it.
                sx={{ pl: 10 }}
              >
                All sets
              </Button>
              <Typography variant="h2">{selectedSet.displayName}</Typography>
              <NextLink
                href={{
                  pathname: Routes.SetsPrint,
                  query: { set: selectedSet.id },
                }}
                passHref
              >
                <Button
                  component="a"
                  target="_blank"
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  sx={{ pl: 10 }}
                >
                  Print sheets
                </Button>
              </NextLink>
              <Typography variant="caption" color="text.secondary">
                {selectedSet.cards.length} cards
                {totalCopies !== selectedSet.cards.length &&
                  ` · ${totalCopies} copies`}
              </Typography>
            </Box>
            <CardGrid cards={selectedSet.cards} onSelect={setViewerIndex} />
            <CardViewer
              cards={selectedSet.cards}
              index={viewerIndex}
              onNavigate={setViewerIndex}
              onClose={() => setViewerIndex(null)}
            />
          </>
        )}
      </Box>
    </>
  );
};

export default Sets;
