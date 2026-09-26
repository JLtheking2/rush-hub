import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Backdrop,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useIsCardDirty, useRushCardStore } from '@cardEditor/card';
import UnsavedChangesDialog from '@cardEditor/editor/ImportExport/atoms/UnsavedChangesDialog';
import sets from '@utils/sets';

/** `?set=PRS1&card=001-smile-world` -> the single value, whichever shape Next gives us */
const firstValue = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/**
 * Loads a published Set Browser card into the creator when /creator is opened
 * as `?set=<SetId>&card=<slug>` — the target of the "Edit in Creator" button in
 * the /sets card viewer.
 *
 * The query carries two *lookup keys*, never a path: the URL to fetch is
 * resolved from `setsData`, so no arbitrary URL can be requested.
 *
 * No `fileHandle` is set, so the first Save in this tab behaves like Save As —
 * the user is editing a copy, not the served asset.
 */
const SetCardLoader: FC = () => {
  const router = useRouter();
  const applyCardJson = useRushCardStore(state => state.applyCardJson);
  const isDirty = useIsCardDirty();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<{
    url: string;
    label: string;
  } | null>(null);

  // The query params are deliberately left in the URL so the link stays
  // shareable, so guard against re-applying (and clobbering the user's edits)
  // on any later render or shallow route change.
  const handledRef = useRef<string | null>(null);

  // The card can already read as dirty on a freshly mounted page (the form
  // writes back to the store as it initialises), so the unsaved-changes guard
  // only applies from the second pass onwards — by then an edit is really the
  // user's, not initialisation noise.
  const initialPassRef = useRef(true);

  const load = useCallback(
    async (url: string, label: string) => {
      setLoading(true);
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = applyCardJson(await response.text());
        if (!result.ok) {
          setErrorMessage(
            `"${label}" isn't a valid card file: ${result.error}`,
          );
        }
      } catch {
        setErrorMessage(`Could not load "${label}" from the set.`);
      } finally {
        setLoading(false);
      }
    },
    [applyCardJson],
  );

  useEffect(() => {
    // Under `next export` the query is empty until the router is ready
    if (!router.isReady) return;

    const isInitialPass = initialPassRef.current;
    initialPassRef.current = false;

    const setId = firstValue(router.query.set);
    const cardId = firstValue(router.query.card);
    if (!setId || !cardId) return;

    const key = `${setId}|${cardId}`;
    if (handledRef.current === key) return;
    handledRef.current = key;

    const card = sets
      .find(set => set.id === setId)
      ?.cards.find(c => c.id === cardId);
    if (!card?.json) {
      setErrorMessage(`No card "${cardId}" in set "${setId}".`);
      return;
    }

    // Never silently discard work. Only reachable via an in-tab navigation —
    // the Edit in Creator link opens a fresh tab, which lands on the initial
    // pass and loads straight away.
    if (isDirty && !isInitialPass) {
      setPending({ url: card.json, label: card.name });
      return;
    }
    load(card.json, card.name);
  }, [router.isReady, router.query.set, router.query.card, isDirty, load]);

  const confirmPending = useCallback(() => {
    if (pending) load(pending.url, pending.label);
    setPending(null);
  }, [pending, load]);

  return (
    <>
      <Backdrop open={loading} sx={{ zIndex: theme => theme.zIndex.modal + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <UnsavedChangesDialog
        open={pending !== null}
        actionLabel="LOAD"
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
      <Dialog
        open={errorMessage !== null}
        onClose={() => setErrorMessage(null)}
        PaperProps={{
          sx: {
            backgroundImage: 'none',
            backgroundColor: 'background.default',
          },
        }}
      >
        <DialogTitle>Card not loaded</DialogTitle>
        <DialogContent>
          <DialogContentText>{errorMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorMessage(null)}>OK</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SetCardLoader;
