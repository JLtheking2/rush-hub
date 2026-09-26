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
  actionLabel: 'LOAD' | 'NEW';
  onConfirm: () => void;
  onCancel: () => void;
}

const UnsavedChangesDialog: FC<Props> = ({
  open,
  actionLabel,
  onConfirm,
  onCancel,
}) => (
  <Dialog
    open={open}
    onClose={onCancel}
    PaperProps={{
      sx: {
        backgroundImage: 'none',
        backgroundColor: 'background.default',
      },
    }}
  >
    <DialogTitle>Unsaved changes</DialogTitle>
    <DialogContent>
      <DialogContentText>
        You have unsaved changes that will be lost. Continue?
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Cancel</Button>
      <Button onClick={onConfirm}>{actionLabel}</Button>
    </DialogActions>
  </Dialog>
);

export default UnsavedChangesDialog;
