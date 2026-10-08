import { Box } from '@mui/system';
import { FC, useCallback, useEffect, useState } from 'react';
import ExportButton from './atoms/ExportButton';
import ImportButton from './atoms/ImportButton';
import LoadDirectoryButton from './atoms/LoadDirectoryButton';
import LocalCardNav from './atoms/LocalCardNav';
import NewButton from './atoms/NewButton';
import SaveAsButton from './atoms/SaveAsButton';
import { NewSource, getParentDirectoryHandle } from './utils';

const ImportExport: FC = () => {
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(
    null,
  );
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);

  // The set New numbers from. Unlike the file handle it survives New, so
  // pressing New repeatedly keeps offering the same next free Set ID.
  const [newSource, setNewSource] = useState<NewSource | null>(null);

  useEffect(() => {
    if (!fileHandle || !directoryHandle) return undefined;
    let cancelled = false;
    getParentDirectoryHandle(directoryHandle, fileHandle)
      .then(parent => {
        if (!cancelled) setNewSource({ kind: 'folder', parent });
      })
      .catch(e => console.warn('Failed to resolve the card folder:', e));
    return () => {
      cancelled = true;
    };
  }, [fileHandle, directoryHandle]);

  // A new working directory means a different set: New numbers from it
  // straight away, until opening a card narrows it to that card's folder
  const changeDirectory = useCallback((h: FileSystemDirectoryHandle) => {
    setDirectoryHandle(h);
    setNewSource({ kind: 'folder', parent: h });
  }, []);

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      {fileHandle && directoryHandle && (
        <LocalCardNav
          fileHandle={fileHandle}
          directoryHandle={directoryHandle}
          setFileHandle={setFileHandle}
        />
      )}
      <LoadDirectoryButton
        directoryHandle={directoryHandle}
        setDirectoryHandle={changeDirectory}
      />
      <Box display="flex" flexDirection="row" gap={1}>
        <ImportButton
          setFileHandle={setFileHandle}
          directoryHandle={directoryHandle}
          setDirectoryHandle={changeDirectory}
        />
        <ExportButton
          fileHandle={fileHandle}
          setFileHandle={setFileHandle}
          directoryHandle={directoryHandle}
          setDirectoryHandle={changeDirectory}
        />
      </Box>
      <Box display="flex" flexDirection="row" gap={1}>
        <NewButton setFileHandle={setFileHandle} newSource={newSource} />
        <SaveAsButton
          setFileHandle={setFileHandle}
          directoryHandle={directoryHandle}
          setDirectoryHandle={changeDirectory}
        />
      </Box>
    </Box>
  );
};

export default ImportExport;
