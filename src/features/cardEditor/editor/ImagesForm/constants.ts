import { art } from '../../cardStyles/layout';

// The art window (376 × 380 units); the crop must share its aspect so the
// saved crop fills the window without distortion
export const artAspect = art[2] / art[3];

// Form width minus all paddings
export const cropperWidth = 354;
export const cropperHeight = cropperWidth / artAspect;
