import { useIsCardDirty, useRushCardStore } from '@cardEditor/card';
import { FolderOpen } from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { FC, useCallback, useRef, useState } from 'react';
import {
  adoptDirectoryFor,
  checkWithinWorkingDirectory,
  ensureDirectoryHandle,
  findSiblingFileHandle,
  getParentDirectoryHandle,
  requestDirectoryHandle,
} from '../../utils';
import MissingJsonPairDialog from '../MissingJsonPairDialog';
import OutsideWorkingDirectoryDialog from '../OutsideWorkingDirectoryDialog';
import UnsavedChangesDialog from '../UnsavedChangesDialog';

interface Props {
  setFileHandle: (h: FileSystemFileHandle | null) => void;
  directoryHandle: FileSystemDirectoryHandle | null;
  setDirectoryHandle: (h: FileSystemDirectoryHandle) => void;
}

const supportsFileSystemAccess =
  typeof window !== 'undefined' && 'showOpenFilePicker' in window;

const ImportButton: FC<Props> = ({
  setFileHandle,
  directoryHandle,
  setDirectoryHandle,
}) => {
  const applyCardJson = useRushCardStore(state => state.applyCardJson);
  const isDirty = useIsCardDirty();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invalidError, setInvalidError] = useState<string | null>(null);
  const [outsideDialogOpen, setOutsideDialogOpen] = useState(false);
  const [missingJsonDialogOpen, setMissingJsonDialogOpen] = useState(false);
  const [missingJsonFileName, setMissingJsonFileName] = useState('');

  const applyCard = useCallback(
    (text: string) => {
      const result = applyCardJson(text);
      if (!result.ok) setInvalidError(result.error);
    },
    [applyCardJson],
  );

  const doImport = useCallback(async () => {
    if (supportsFileSystemAccess) {
      try {
        let dirHandle = await ensureDirectoryHandle(
          directoryHandle,
          setDirectoryHandle,
        );
        const [handle] = await window.showOpenFilePicker({
          types: [
            {
              description: 'Card files',
              accept: {
                'application/json': ['.json'],
                'image/png': ['.png'],
              },
            },
          ],
          startIn: dirHandle,
        });

        const within = await checkWithinWorkingDirectory(dirHandle, handle);
        if (!within) {
          const newDir = await adoptDirectoryFor(handle);
          if (!newDir) {
            setOutsideDialogOpen(true);
            return;
          }
          setDirectoryHandle(newDir);
          dirHandle = newDir;
        }

        if (/\.png$/i.test(handle.name)) {
          const baseName = handle.name.replace(/\.png$/i, '');
          const parentHandle = await getParentDirectoryHandle(
            dirHandle,
            handle,
          );
          const jsonHandle = await findSiblingFileHandle(
            parentHandle,
            baseName,
            'json',
          );
          if (!jsonHandle) {
            setMissingJsonFileName(handle.name);
            setMissingJsonDialogOpen(true);
            return;
          }
          setFileHandle(jsonHandle);
          const file = await jsonHandle.getFile();
          applyCard(await file.text());
          return;
        }

        setFileHandle(handle);
        const file = await handle.getFile();
        applyCard(await file.text());
      } catch {
        // User cancelled a picker — do nothing
      }
      return;
    }

    // Fallback: hidden file input
    inputRef.current?.click();
  }, [applyCard, setFileHandle, directoryHandle, setDirectoryHandle]);

  const handleImport = useCallback(() => {
    if (isDirty) {
      setDialogOpen(true);
    } else {
      doImport();
    }
  }, [isDirty, doImport]);

  const handleDialogConfirm = useCallback(() => {
    setDialogOpen(false);
    doImport();
  }, [doImport]);

  const handleRetry = useCallback(() => {
    setOutsideDialogOpen(false);
    doImport();
  }, [doImport]);

  const handleChangeDirectory = useCallback(async () => {
    setOutsideDialogOpen(false);
    try {
      const handle = await requestDirectoryHandle();
      setDirectoryHandle(handle);
    } catch {
      // User cancelled the picker — do nothing
    }
  }, [setDirectoryHandle]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          applyCard(reader.result as string);
        } catch (err) {
          console.error(err);
        }
        if (inputRef.current) inputRef.current.value = '';
      };
      reader.readAsText(file);
    },
    [applyCard],
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Button
        fullWidth
        variant="outlined"
        startIcon={<FolderOpen />}
        onClick={handleImport}
      >
        Load
      </Button>
      <UnsavedChangesDialog
        open={dialogOpen}
        actionLabel="LOAD"
        onConfirm={handleDialogConfirm}
        onCancel={() => setDialogOpen(false)}
      />
      <Dialog
        open={invalidError !== null}
        onClose={() => setInvalidError(null)}
        PaperProps={{
          sx: {
            backgroundImage: 'none',
            backgroundColor: 'background.default',
          },
        }}
      >
        <DialogTitle>Card not loaded</DialogTitle>
        <DialogContent>
          <DialogContentText>
            That file couldn&apos;t be loaded as a rush-hub card. {invalidError}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvalidError(null)}>OK</Button>
        </DialogActions>
      </Dialog>
      <OutsideWorkingDirectoryDialog
        open={outsideDialogOpen}
        onChangeDirectory={handleChangeDirectory}
        onRetry={handleRetry}
      />
      <MissingJsonPairDialog
        open={missingJsonDialogOpen}
        fileName={missingJsonFileName}
        onClose={() => setMissingJsonDialogOpen(false)}
      />
    </>
  );
};

export default ImportButton;
