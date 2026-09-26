import { serializeCard, useRushCardStore } from '@cardEditor/card';
import { cardId } from '@cardEditor/cardStyles';
import { AssignmentTurnedIn, SaveAs } from '@mui/icons-material';
import { Button } from '@mui/material';
import { FC, useCallback, useState } from 'react';
import { getSuggestedCardFileName } from '../../../utils/getSuggestedCardFileName';
import { makeCardPngBlob } from '../../../CardDownloader/utils';
import {
  checkWithinWorkingDirectory,
  discardStrayHandle,
  ensureDirectoryHandle,
  getParentDirectoryHandle,
  requestDirectoryHandle,
  writeCardJson,
  writeCardPngToHandle,
} from '../../utils';
import OutsideWorkingDirectoryDialog from '../OutsideWorkingDirectoryDialog';

interface Props {
  setFileHandle: (h: FileSystemFileHandle | null) => void;
  directoryHandle: FileSystemDirectoryHandle | null;
  setDirectoryHandle: (h: FileSystemDirectoryHandle) => void;
}

const SaveAsButton: FC<Props> = ({
  setFileHandle,
  directoryHandle,
  setDirectoryHandle,
}) => {
  const { card, markSaved } = useRushCardStore();
  const suggestedCardNumber = card.setId;
  const [Icon, setIcon] = useState(<SaveAs />);
  const [outsideDialogOpen, setOutsideDialogOpen] = useState(false);

  const flashSuccess = useCallback(() => {
    setIcon(<AssignmentTurnedIn />);
    const timeout = setTimeout(() => setIcon(<SaveAs />), 2000);
    return () => clearTimeout(timeout);
  }, []);

  const handleSaveAs = useCallback(async () => {
    const json = serializeCard(card);

    if ('showSaveFilePicker' in window) {
      try {
        const dirHandle = await ensureDirectoryHandle(
          directoryHandle,
          setDirectoryHandle,
        );
        const pngHandle = await window.showSaveFilePicker({
          suggestedName: getSuggestedCardFileName(
            card.name,
            suggestedCardNumber,
            'png',
          ),
          types: [
            { description: 'PNG Image', accept: { 'image/png': ['.png'] } },
          ],
          startIn: dirHandle,
        });
        const within = await checkWithinWorkingDirectory(dirHandle, pngHandle);
        if (!within) {
          await discardStrayHandle(pngHandle);
          setOutsideDialogOpen(true);
          return;
        }

        // Derive the base name from the actual saved handle — the user may
        // have renamed it in the OS dialog.
        const baseName = pngHandle.name.replace(/\.png$/i, '');
        const parentHandle = await getParentDirectoryHandle(
          dirHandle,
          pngHandle,
        );

        await writeCardPngToHandle(pngHandle);

        const jsonHandle = await writeCardJson(parentHandle, baseName, json);
        setFileHandle(jsonHandle);
        markSaved();
        flashSuccess();
      } catch {
        // User cancelled a picker — do nothing
      }
      return;
    }

    const pngBlob = await makeCardPngBlob(cardId);
    if (pngBlob) {
      const pngUrl = URL.createObjectURL(pngBlob);
      const pngLink = document.createElement('a');
      pngLink.href = pngUrl;
      pngLink.download = getSuggestedCardFileName(
        card.name,
        suggestedCardNumber,
        'png',
      );
      pngLink.click();
      URL.revokeObjectURL(pngUrl);
    }

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getSuggestedCardFileName(
      card.name,
      suggestedCardNumber,
      'json',
    );
    a.click();
    URL.revokeObjectURL(url);
    markSaved();
    flashSuccess();
  }, [
    card,
    setFileHandle,
    directoryHandle,
    setDirectoryHandle,
    markSaved,
    flashSuccess,
    suggestedCardNumber,
  ]);

  const handleRetry = useCallback(() => {
    setOutsideDialogOpen(false);
    handleSaveAs();
  }, [handleSaveAs]);

  const handleChangeDirectory = useCallback(async () => {
    setOutsideDialogOpen(false);
    try {
      const handle = await requestDirectoryHandle();
      setDirectoryHandle(handle);
    } catch {
      // User cancelled the picker — do nothing
    }
  }, [setDirectoryHandle]);

  return (
    <>
      <Button
        fullWidth
        variant="outlined"
        startIcon={Icon}
        onClick={handleSaveAs}
      >
        Save As
      </Button>
      <OutsideWorkingDirectoryDialog
        open={outsideDialogOpen}
        onChangeDirectory={handleChangeDirectory}
        onRetry={handleRetry}
      />
    </>
  );
};

export default SaveAsButton;
