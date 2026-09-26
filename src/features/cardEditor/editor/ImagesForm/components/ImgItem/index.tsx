import { CardImage, CropArea } from '@cardEditor/card';
import { useRushCardStore } from '@cardEditor/card/store';
import { cardImgHeight, cardImgWidth } from '@cardEditor/cardStyles/constants';
import ImgCropper from '@components/ImgCropper';
import { Crop as CropIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Button, Paper } from '@mui/material';
import { Box } from '@mui/system';
import { FC, memo, useCallback, useEffect, useState } from 'react';
import { useBoolean, useThrottle } from 'react-use';
import { cropperHeight, cropperWidth } from '../../constants';
import { SrcLabel } from './styles';

export interface ImgItemProps {
  img: CardImage;
  name: string;
}

// Phase 5 swaps this for the 376:380 art-window aspect
const ImgItem: FC<ImgItemProps> = ({ img, name }) => {
  const setCard = useRushCardStore(state => state.setCard);
  const [cropActive, toggleCropActive] = useBoolean(false);
  const [crop, setCrop] = useState<CropArea | undefined>(img.crop);
  const throttledCrop = useThrottle(crop, 500);

  const handleDelete = useCallback(() => setCard({ image: null }), [setCard]);

  useEffect(() => {
    if (!throttledCrop) return;
    setCard({ image: { src: img.src, crop: throttledCrop } });
    // Would result in infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [throttledCrop]);

  return (
    <Paper sx={{ mt: 2 }}>
      <Box p={1}>
        <SrcLabel>{name}</SrcLabel>
      </Box>
      <Box display="flex" gap={1} px={1} pb={1}>
        <Button
          fullWidth
          onClick={toggleCropActive}
          variant={cropActive ? 'contained' : 'outlined'}
          startIcon={<CropIcon />}
        >
          Crop
        </Button>
        <Button
          fullWidth
          onClick={handleDelete}
          variant="outlined"
          startIcon={<DeleteIcon />}
        >
          Delete
        </Button>
      </Box>
      {cropActive && (
        <Box>
          <ImgCropper
            slug="art"
            src={img.src}
            initialCroppedArea={img.crop}
            onChange={setCrop}
            allowPrecisionControls
            cropSize={{ width: cropperWidth, height: cropperHeight }}
            aspect={cardImgWidth / cardImgHeight}
          />
        </Box>
      )}
    </Paper>
  );
};

export default memo(ImgItem);
