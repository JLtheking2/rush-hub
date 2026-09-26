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
  fileName: string;
  onClose: () => void;
}

const MissingJsonPairDialog: FC<Props> = ({ open, fileName, onClose }) => (
  <Dialog
    open={open}
    onClose={onClose}
    PaperProps={{
      sx: {
        backgroundImage: 'none',
        backgroundColor: 'background.default',
      },
    }}
  >
    <DialogTitle>No matching card file found</DialogTitle>
    <DialogContent>
      <DialogContentText>
        No matching .json file was found next to <strong>{fileName}</strong>. To
        load a card, the .json file created alongside the PNG must be present in
        the same folder.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>OK</Button>
    </DialogActions>
  </Dialog>
);

export default MissingJsonPairDialog;
