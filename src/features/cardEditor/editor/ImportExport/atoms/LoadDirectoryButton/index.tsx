import { Folder } from '@mui/icons-material';
import { Button } from '@mui/material';
import { FC, useCallback } from 'react';
import { requestDirectoryHandle } from '../../utils';

interface Props {
  directoryHandle: FileSystemDirectoryHandle | null;
  setDirectoryHandle: (h: FileSystemDirectoryHandle) => void;
}

const supportsFileSystemAccess =
  typeof window !== 'undefined' && 'showDirectoryPicker' in window;

const LoadDirectoryButton: FC<Props> = ({
  directoryHandle,
  setDirectoryHandle,
}) => {
  const handleClick = useCallback(async () => {
    try {
      const handle = await requestDirectoryHandle();
      setDirectoryHandle(handle);
    } catch {
      // User cancelled the picker — do nothing
    }
  }, [setDirectoryHandle]);

  if (!supportsFileSystemAccess) return null;

  return (
    <Button
      fullWidth
      variant="outlined"
      startIcon={<Folder />}
      onClick={handleClick}
    >
      {directoryHandle ? (
        <>
          Loaded Directory:&nbsp;<b>{directoryHandle.name}</b>
        </>
      ) : (
        'Load Directory'
      )}
    </Button>
  );
};

export default LoadDirectoryButton;
