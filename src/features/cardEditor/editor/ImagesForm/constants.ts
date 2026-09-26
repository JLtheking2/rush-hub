import { cardImgHeight, cardImgWidth } from '../../cardStyles/constants';

// Form width minus all paddings
export const cropperWidth = 354;
export const cropperHeight = (cropperWidth / cardImgWidth) * cardImgHeight;
