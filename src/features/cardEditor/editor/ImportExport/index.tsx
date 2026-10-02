import { Box } from '@mui/system';
import { useRouter } from 'next/router';
import Routes from '@routes';
import { FC, useCallback, useState } from 'react';
import ExportButton from './atoms/ExportButton';
import ImportButton from './atoms/ImportButton';
import LoadDirectoryButton from './atoms/LoadDirectoryButton';
import LocalCardNav from './atoms/LocalCardNav';
import NewButton from './atoms/NewButton';
import SaveAsButton from './atoms/SaveAsButton';
import SetCardNav from './atoms/SetCardNav';

const ImportExport: FC = () => {
  const router = useRouter();
  const [fileHandle, setFileHandleState] =
    useState<FileSystemFileHandle | null>(null);
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);

  // Load, Save As, New and local navigation all leave any Set Browser card
  // behind, so drop its `?set=&card=` deep link (and with it the set arrows).
  const { set, card } = router.query;
  const setFileHandle = useCallback(
    (h: FileSystemFileHandle | null) => {
      setFileHandleState(h);
      if (set || card) {
        router.replace({ pathname: Routes.Creator }, undefined, {
          shallow: true,
        });
      }
    },
    [router, set, card],
  );

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      {fileHandle && directoryHandle ? (
        <LocalCardNav
          fileHandle={fileHandle}
          directoryHandle={directoryHandle}
          setFileHandle={setFileHandle}
        />
      ) : (
        <SetCardNav />
      )}
      <LoadDirectoryButton
        directoryHandle={directoryHandle}
        setDirectoryHandle={setDirectoryHandle}
      />
      <Box display="flex" flexDirection="row" gap={1}>
        <ImportButton
          setFileHandle={setFileHandle}
          directoryHandle={directoryHandle}
          setDirectoryHandle={setDirectoryHandle}
        />
        <ExportButton
          fileHandle={fileHandle}
          setFileHandle={setFileHandle}
          directoryHandle={directoryHandle}
          setDirectoryHandle={setDirectoryHandle}
        />
      </Box>
      <Box display="flex" flexDirection="row" gap={1}>
        <NewButton setFileHandle={setFileHandle} />
        <SaveAsButton
          setFileHandle={setFileHandle}
          directoryHandle={directoryHandle}
          setDirectoryHandle={setDirectoryHandle}
        />
      </Box>
    </Box>
  );
};

export default ImportExport;
