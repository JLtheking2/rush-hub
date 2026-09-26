import { Area, Point, Size } from 'react-easy-crop';

export interface ImgCropperProps {
  slug: string;
  src: string;
  initialCroppedArea?: Area;
  onChange: (croppedArea: Area) => void;
  overlayImgSrc?: string;
  overlayImgZIndex?: number;
  allowPrecisionControls?: boolean;
  aspect?: number;
  cropSize?: Size;
  defaultCrop?: Point;
  defaultZoom?: number;
}
