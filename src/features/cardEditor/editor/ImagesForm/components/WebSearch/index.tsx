import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { Button, FormControl } from '@mui/material';
import { Box } from '@mui/system';
import { FC, useMemo } from 'react';
import { useRushCardStore } from '@cardEditor/card/store';
import Label from '@components/inputs/Label';
import Routes from '@routes';

const WebSearch: FC = () => {
  const name = useRushCardStore(state => state.card.name);

  const trimmedName = useMemo(() => name?.trim() || '', [name]);

  const deviantArtHref = useMemo(
    () => Routes.DeviantArt.Search(`${trimmedName} nhociory`),
    [trimmedName],
  );

  const yugipediaHref = useMemo(
    () => Routes.Yugipedia.CardArtworks(trimmedName),
    [trimmedName],
  );

  return (
    <FormControl>
      <Label slug="webSearch">Web Search</Label>
      <Box display="flex" gap={0.5}>
        <Button
          sx={theme => ({
            borderColor: theme.custom.inputBorderColor,
            textTransform: 'none',
            flexGrow: 1,
            flexBasis: 0,
          })}
          variant="outlined"
          color="inherit"
          startIcon={<OpenInNewIcon />}
          disabled={!trimmedName}
          href={deviantArtHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          DeviantArt
        </Button>
        <Button
          sx={theme => ({
            borderColor: theme.custom.inputBorderColor,
            textTransform: 'none',
            flexGrow: 1,
            flexBasis: 0,
          })}
          variant="outlined"
          color="inherit"
          startIcon={<OpenInNewIcon />}
          disabled={!trimmedName}
          href={yugipediaHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          Yugipedia
        </Button>
      </Box>
    </FormControl>
  );
};

export default WebSearch;
