import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { Button, FormControl, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { FC, useCallback, useMemo, useState } from 'react';
import { parseYugipediaCard } from '@cardEditor/card/fromYugipedia';
import { useRushCardStore } from '@cardEditor/card/store';
import Label from '@components/inputs/Label';
import Routes from '@routes';
import fetchYugipediaWikitext from '@utils/fetchYugipediaWikitext';
import toTitleCase from '@utils/toTitleCase';

const YugipediaLookup: FC = () => {
  const name = useRushCardStore(state => state.card.name);
  const setCard = useRushCardStore(state => state.setCard);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedName = useMemo(() => name?.trim() || '', [name]);
  const titledName = useMemo(() => toTitleCase(trimmedName), [trimmedName]);
  const href = useMemo(() => Routes.Yugipedia.Card(titledName), [titledName]);

  // Yugipedia titles are title-cased, so fix the Name field before any lookup
  const applyTitleCase = useCallback(() => {
    if (titledName !== name) setCard({ name: titledName });
  }, [titledName, name, setCard]);

  const handleAutofill = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    applyTitleCase();
    try {
      // Covers every content field; name, set info and art are untouched
      setCard(parseYugipediaCard(await fetchYugipediaWikitext(titledName)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not fetch card');
    } finally {
      setIsLoading(false);
    }
  }, [titledName, applyTitleCase, setCard]);

  const buttonSx = (theme: {
    custom: { inputBorderColor: string };
  }): Record<string, unknown> => ({
    borderColor: theme.custom.inputBorderColor,
    textTransform: 'none',
    flexGrow: 1,
    flexBasis: 0,
  });

  return (
    <FormControl>
      <Label slug="yugipediaLookup">Yugipedia</Label>
      <Box display="flex" gap={0.5}>
        <Button
          sx={buttonSx}
          variant="outlined"
          color="inherit"
          endIcon={<OpenInNewIcon />}
          disabled={!trimmedName}
          href={href}
          onClick={applyTitleCase}
          target="_blank"
          rel="noopener noreferrer"
        >
          Yugipedia
        </Button>
        <Button
          sx={buttonSx}
          variant="outlined"
          color="inherit"
          onClick={handleAutofill}
          disabled={!trimmedName || isLoading}
        >
          {isLoading ? 'Fetching…' : 'Autofill'}
        </Button>
      </Box>
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </FormControl>
  );
};

export default YugipediaLookup;
