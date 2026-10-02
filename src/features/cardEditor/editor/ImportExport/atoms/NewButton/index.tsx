import { useIsCardDirty, useRushCardStore } from '@cardEditor/card';
import { NoteAdd } from '@mui/icons-material';
import { Button } from '@mui/material';
import sets from '@utils/sets';
import { FC, useCallback, useState } from 'react';
import { NewSource, incrementCardNumber, listFolderCards } from '../../utils';
import UnsavedChangesDialog from '../UnsavedChangesDialog';

interface Props {
  setFileHandle: (h: FileSystemFileHandle | null) => void;
  newSource: NewSource | null;
}

// The highest Set ID in the current set, or undefined when there's no set
// (or it holds no numbered cards). Read fresh on every New, so an unsaved
// new card doesn't count and pressing New twice gives the same Set ID.
const findLastSetId = async (
  source: NewSource | null,
): Promise<string | undefined> => {
  if (source?.kind === 'folder') {
    const cards = await listFolderCards(source.parent);
    // Sorted by Set ID, with cards lacking one at the end
    return cards.filter(c => c.card.setId).pop()?.card.setId;
  }
  if (source?.kind === 'set') {
    return sets
      .find(set => set.id === source.setId)
      ?.cards.filter(c => c.number)
      .pop()?.number;
  }
  return undefined;
};

const NewButton: FC<Props> = ({ setFileHandle, newSource }) => {
  const { card, resetCard } = useRushCardStore();
  const isDirty = useIsCardDirty();
  const [dialogOpen, setDialogOpen] = useState(false);

  const doNew = useCallback(async () => {
    let lastSetId: string | undefined;
    try {
      lastSetId = await findLastSetId(newSource);
    } catch (e) {
      // e.g. folder permission revoked — fall back to the card on screen
      console.warn('Failed to read the set for the next Set ID:', e);
    }
    resetCard({
      // Preserve what stays constant across a print run
      template: card.template,
      setId: incrementCardNumber(lastSetId ?? card.setId) ?? '',
      serial: card.serial,
    });
    setFileHandle(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('cardName-input')?.focus({ preventScroll: true });
  }, [card, resetCard, setFileHandle, newSource]);

  const handleClick = useCallback(() => {
    if (isDirty) {
      setDialogOpen(true);
    } else {
      doNew();
    }
  }, [isDirty, doNew]);

  return (
    <>
      <Button
        fullWidth
        variant="outlined"
        startIcon={<NoteAdd />}
        onClick={handleClick}
      >
        New
      </Button>
      <UnsavedChangesDialog
        open={dialogOpen}
        actionLabel="NEW"
        onConfirm={() => {
          setDialogOpen(false);
          doNew();
        }}
        onCancel={() => setDialogOpen(false)}
      />
    </>
  );
};

export default NewButton;
