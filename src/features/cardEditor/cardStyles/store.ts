import create from 'zustand';
import { baseEmphemeralUnit, cardImgWidth } from './constants';

export interface CardStylesStore {
  emphemeralUnit: number;
  setEmphemeralUnit: (cardWidth: number) => void;
}

export const useCardStylesStore = create<CardStylesStore>(set => ({
  emphemeralUnit: baseEmphemeralUnit,
  setEmphemeralUnit: cardWidth =>
    set({ emphemeralUnit: cardWidth / (cardImgWidth / baseEmphemeralUnit) }),
}));
