import { useIsCardDirty, useRushCardStore } from '@cardEditor/card';
import { NoteAdd } from '@mui/icons-material';
import { Button } from '@mui/material';
import { FC, useCallback, useState } from 'react';
import UnsavedChangesDialog from '../UnsavedChangesDialog';

interface Props {
  setFileHandle: (h: FileSystemFileHandle | null) => void;
}

const incrementCardNumber = (value?: string): string | undefined => {
  if (value === undefined || value === '') return value;

  const match = value.match(/^(.*?)(\d+)$/);
  if (!match) return value; // no trailing digits — pass through unchanged

  const [, prefix, digits] = match;
  // Preserve zero-padding width (e.g. "007" -> "008"), unless the increment overflows it (e.g. "099" -> "100")
  const incremented = String(Number(digits) + 1).padStart(digits.length, '0');
  return prefix + incremented;
};

const NewButton: FC<Props> = ({ setFileHandle }) => {
  const { card, resetCard } = useRushCardStore();
  const isDirty = useIsCardDirty();
  const [dialogOpen, setDialogOpen] = useState(false);

  const doNew = useCallback(() => {
    resetCard({
      // Preserve what stays constant across a print run
      template: card.template,
      setId: incrementCardNumber(card.setId) ?? '',
      serial: card.serial,
    });
    setFileHandle(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('cardName-input')?.focus({ preventScroll: true });
  }, [card, resetCard, setFileHandle]);

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
