import { fontStacks } from '@utils/fonts';

/** [left, top, width, height] in 421 × 614 units */
export type Rect = [number, number, number, number];

export interface TextSpec {
  at: Rect;
  size: number;
  family: string;
  weight?: number;
  /** Vertical nudge (units) to convert canvas-baseline tops into DOM line boxes */
  dy?: number;
}

export const art: Rect = [22, 61, 376, 380];
export const attribute: Rect = [345, 22, 54, 54];
export const levelBadge: Rect = [24, 370, 63, 68];

export const name: TextSpec = {
  at: [28, 4, 310, 48],
  size: 46,
  family: fontStacks.name,
  dy: 9,
};

export const levelNumber: TextSpec = {
  at: [32, 392, 45, 32],
  size: 28,
  family: fontStacks.numerals,
  weight: 700,
  dy: 5,
};
export const levelStrokeWidth = 3;

export const atk: TextSpec = {
  at: [146, 411, 75, 30],
  size: 19.25,
  family: fontStacks.numerals,
  weight: 700,
  // Centres the digits on the grey bar (rows 410–439), not the NCM label boxes
  dy: 4.5,
};
export const def: TextSpec = { ...atk, at: [276, 411, 75, 30] };
export const statStroke = { width: 3, color: '#000' };

export const monsterTypeLine: TextSpec = {
  at: [36, 443, 350, 30],
  size: 16,
  family: fontStacks.typeLine,
  // Centres the capitals on the bracket images (rows 447–461)
  dy: 2,
};
export const backrowTypeLine: TextSpec = {
  at: [38, 443, 330, 20],
  size: 16,
  family: fontStacks.typeLine,
  dy: 2,
};
/** Bracket images (left, top, width, height) */
export const monsterBracket = { left: 30, top: 447, w: 5, h: 15 };
export const backrowBracket = { left: 30, top: 447, w: 5, h: 15 };
export const backrowIcon = { top: 443, size: 20 };

export const effect: TextSpec = {
  at: [30, 466, 360, 103],
  size: 18,
  family: fontStacks.effect,
  dy: 1,
};

export const serial: TextSpec = {
  at: [23, 577, 133, 16],
  size: 12,
  family: fontStacks.stoneSerif,
  dy: 2,
};
export const setId: TextSpec = {
  at: [264, 576, 131, 16],
  size: 12,
  family: fontStacks.stoneSerif,
  dy: 2,
};

/** Normal-template flavour text (italic) */
export const flavorFamily = fontStacks.flavor;
/** Amiri sits higher in its line box than Matrix Book */
export const flavorDy = 5;
