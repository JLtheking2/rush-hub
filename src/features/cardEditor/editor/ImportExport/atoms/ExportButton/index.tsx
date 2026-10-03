import { serializeCard, useRushCardStore } from '@cardEditor/card';
import { cardId } from '@cardEditor/cardStyles';
import { AssignmentTurnedIn, Save } from '@mui/icons-material';
import { Button } from '@mui/material';
import { FC, useCallback, useState } from 'react';
import { getSuggestedCardFileName } from '../../../utils/getSuggestedCardFileName';
import { makeCardPngBlob } from '../../../CardDownloader/utils';
import {
  adoptDirectoryFor,
  checkWithinWorkingDirectory,
  discardStrayHandle,
  ensureDirectoryHandle,
  getParentDirectoryHandle,
  requestDirectoryHandle,
  writeCardJson,
  writeCardPng,
  writeCardPngToHandle,
} from '../../utils';
import OutsideWorkingDirectoryDialog from '../OutsideWorkingDirectoryDialog';

interface Props {
  fileHandle: FileSystemFileHandle | null;
  setFileHandle: (h: FileSystemFileHandle | null) => void;
  directoryHandle: FileSystemDirectoryHandle | null;
  setDirectoryHandle: (h: FileSystemDirectoryHandle) => void;
}

const supportsFileSystemAccess =
  typeof window !== 'undefined' && 'showSaveFilePicker' in window;

const ExportButton: FC<Props> = ({
  fileHandle,
  setFileHandle,
  directoryHandle,
  setDirectoryHandle,
}) => {
  const { card, markSaved } = useRushCardStore();
  const suggestedCardNumber = card.setId;
  const [Icon, setIcon] = useState(<Save />);
  const [outsideDialogOpen, setOutsideDialogOpen] = useState(false);

  const flashSuccess = useCallback(() => {
    setIcon(<AssignmentTurnedIn />);
    const timeout = setTimeout(() => setIcon(<Save />), 2000);
    return () => clearTimeout(timeout);
  }, []);

  const doExport = useCallback(async () => {
    const json = serializeCard(card);

    if (supportsFileSystemAccess) {
      try {
        let dirHandle = await ensureDirectoryHandle(
          directoryHandle,
          setDirectoryHandle,
        );

        // Re-saving to a known .json: write the paired PNG first, then the
        // JSON, silently — no picker.
        if (fileHandle) {
          const baseName = fileHandle.name.replace(/\.json$/i, '');
          const parentHandle = await getParentDirectoryHandle(
            dirHandle,
            fileHandle,
          );
          await writeCardPng(parentHandle, baseName);
          const writable = await fileHandle.createWritable();
          await writable.write(json);
          await writable.close();
          markSaved();
          flashSuccess();
          return;
        }

        // First-ever save — identical to Save As: pick the .png location,
        // write it, then derive and write the .json alongside it.
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
          let newDir: FileSystemDirectoryHandle | null = null;
          try {
            newDir = await adoptDirectoryFor(pngHandle);
          } catch {
            // User cancelled the folder picker
            await discardStrayHandle(pngHandle);
            return;
          }
          if (!newDir) {
            await discardStrayHandle(pngHandle);
            setOutsideDialogOpen(true);
            return;
          }
          setDirectoryHandle(newDir);
          dirHandle = newDir;
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

    // Fallback: blob downloads
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
    fileHandle,
    setFileHandle,
    directoryHandle,
    setDirectoryHandle,
    markSaved,
    flashSuccess,
    suggestedCardNumber,
  ]);

  const handleRetry = useCallback(() => {
    setOutsideDialogOpen(false);
    doExport();
  }, [doExport]);

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
      <Button fullWidth variant="outlined" startIcon={Icon} onClick={doExport}>
        Save
      </Button>
      <OutsideWorkingDirectoryDialog
        open={outsideDialogOpen}
        onChangeDirectory={handleChangeDirectory}
        onRetry={handleRetry}
      />
    </>
  );
};

export default ExportButton;
