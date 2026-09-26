import { css } from '@css';
import withBasePath from './withBasePath';

const fontsPath = withBasePath('/fonts');

// Phase 3 adds the Yu-Gi-Oh! card fonts (Matrix, ITC Stone Serif, Eurostile Candy)
export enum Font {
  MatrixSmallCaps = 'Matrix Regular Small Caps',
  MatrixBook = 'Matrix Book',
  StoneSerifSmallCaps = 'Stone Serif Small Caps',
  StoneSerif = 'Stone Serif',
  EurostileCandy = 'Eurostile Candy',
}

interface FontFace {
  fontName: Font;
  fileName: string;
  /** When true, only the .ttf src is emitted (no .woff2 / .woff files available) */
  ttfOnly?: boolean;
}

const fonts: FontFace[] = [];

export const fontFaces = css`
  ${fonts.map(font =>
    font.ttfOnly
      ? css`
          @font-face {
            font-family: '${font.fontName}';
            src: url('${fontsPath}/${font.fileName}.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
        `
      : css`
          @font-face {
            font-family: '${font.fontName}';
            src: url('${fontsPath}/${font.fileName}.woff2') format('woff2'),
              url('${fontsPath}/${font.fileName}.woff') format('woff'),
              url('${fontsPath}/${font.fileName}.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
        `,
  )}
`;
