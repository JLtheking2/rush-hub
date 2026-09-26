import { Box } from '@mui/system';
import { FC, useState } from 'react';
import ExportButton from './atoms/ExportButton';
import ImportButton from './atoms/ImportButton';
import LoadDirectoryButton from './atoms/LoadDirectoryButton';
import NewButton from './atoms/NewButton';
import SaveAsButton from './atoms/SaveAsButton';

const ImportExport: FC = () => {
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(
    null,
  );
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);

  return (
    <Box display="flex" flexDirection="column" gap={1}>
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
