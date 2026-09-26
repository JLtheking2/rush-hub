import ControlledSlider from '@components/inputs/ControlledSlider';
import NumberInput from '@components/inputs/NumberInput';
import { Box } from '@mui/system';
import Image from 'next/image';
import { FC, useCallback, useState } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { useBoolean } from 'react-use';
import { Transform as PrecisionCropIcon } from '@mui/icons-material';
import { Button, Typography } from '@mui/material';
import { Overlay, Wrapper } from './styles';
import { ImgCropperProps } from './types';

const ImgCropper: FC<ImgCropperProps> = ({
  slug,
  src,
  initialCroppedArea,
  overlayImgSrc,
  overlayImgZIndex = 0,
  allowPrecisionControls,
  aspect,
  cropSize,
  defaultCrop,
  defaultZoom,
  onChange,
}) => {
  const [crop, setCrop] = useState<Point>(defaultCrop ?? { x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(defaultZoom ?? 1);
  const [zoomSpeed, setZoomSpeed] = useState<number>(0.1);
  const [precisionControlsActive, togglePrecisionControls] = useBoolean(false);

  const handleCropAreaChange = useCallback(
    (area: Area) => {
      if (precisionControlsActive) {
        onChange(area);
      }
    },
    [precisionControlsActive, onChange],
  );

  return (
    <>
      <Wrapper
        sx={precisionControlsActive ? { pointerEvents: 'none' } : undefined}
      >
        <Cropper
          image={src}
          crop={crop}
          initialCroppedAreaPercentages={initialCroppedArea}
          zoom={zoom}
          cropSize={cropSize}
          maxZoom={100}
          minZoom={0.1}
          restrictPosition={false}
          zoomSpeed={zoomSpeed}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onChange}
          onCropAreaChange={handleCropAreaChange}
        />
        {overlayImgSrc && (
          <Overlay $zIndex={overlayImgZIndex}>
            <Image src={overlayImgSrc} alt="" layout="fill" />
          </Overlay>
        )}
      </Wrapper>
      <Box width="100%" display="flex" flexDirection="column" gap={1} p={1}>
        <ControlledSlider
          label="Scroll Zoom Sensitivity"
          slug={`${slug}CropperZoomSpeed`}
          value={zoomSpeed}
          min={0.01}
          max={0.1}
          step={0.01}
          onChange={setZoomSpeed}
          onChangeCommitted={setZoomSpeed}
        />
        {allowPrecisionControls && (
          <Button
            fullWidth
            onClick={togglePrecisionControls}
            variant={precisionControlsActive ? 'contained' : 'outlined'}
            startIcon={<PrecisionCropIcon />}
          >
            Advanced Crop
          </Button>
        )}
        {precisionControlsActive && (
          <>
            <Typography variant="caption" sx={{ pl: 1, mt: -1 }}>
              While advanced crop is active, you can&apos;t drag the cropper
              above
            </Typography>
            <NumberInput
              value={crop.x}
              label="X-Coordinate"
              slug={`${slug}CropperX`}
              skipDebounce
              onChange={value => setCrop(prev => ({ ...prev, x: +value }))}
            />
            <NumberInput
              value={crop.y}
              label="Y-Coordinate"
              slug={`${slug}CropperY`}
              skipDebounce
              onChange={value => setCrop(prev => ({ ...prev, y: +value }))}
            />
            <NumberInput
              value={zoom}
              step={0.01}
              min={0.1}
              label="Zoom level"
              slug={`${slug}CropperZoom`}
              skipDebounce
              onChange={value => setZoom(+value)}
            />
          </>
        )}
      </Box>
    </>
  );
};

export default ImgCropper;
