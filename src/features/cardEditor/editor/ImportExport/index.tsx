import { Box } from '@mui/system';
import { Dispatch, FC, SetStateAction } from 'react';
import ExportButton from './atoms/ExportButton';
import ImportButton from './atoms/ImportButton';
import LoadDirectoryButton from './atoms/LoadDirectoryButton';
import NewButton from './atoms/NewButton';
import SaveAsButton from './atoms/SaveAsButton';

interface ImportExportProps {
  fileHandle: FileSystemFileHandle | null;
  setFileHandle: Dispatch<SetStateAction<FileSystemFileHandle | null>>;
  directoryHandle: FileSystemDirectoryHandle | null;
  setDirectoryHandle: Dispatch<
    SetStateAction<FileSystemDirectoryHandle | null>
  >;
}

const ImportExport: FC<ImportExportProps> = ({
  fileHandle,
  setFileHandle,
  directoryHandle,
  setDirectoryHandle,
}) => {
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
