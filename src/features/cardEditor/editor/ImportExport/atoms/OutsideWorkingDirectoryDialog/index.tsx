import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { FC } from 'react';

interface Props {
  open: boolean;
  onChangeDirectory: () => void;
  onRetry: () => void;
}

const OutsideWorkingDirectoryDialog: FC<Props> = ({
  open,
  onChangeDirectory,
  onRetry,
}) => (
  <Dialog
    open={open}
    onClose={onRetry}
    PaperProps={{
      sx: {
        backgroundImage: 'none',
        backgroundColor: 'background.default',
      },
    }}
  >
    <DialogTitle>Outside working directory</DialogTitle>
    <DialogContent>
      <DialogContentText>
        The file you selected is not inside the loaded working directory. Choose
        a different working directory, or try again and pick a file inside it.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onChangeDirectory}>Change working directory</Button>
      <Button onClick={onRetry}>Retry</Button>
    </DialogActions>
  </Dialog>
);

export default OutsideWorkingDirectoryDialog;
