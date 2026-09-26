import { css } from '@css';
import withBasePath from './withBasePath';

const fontsPath = withBasePath('/fonts');

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
  format: 'ttf' | 'otf';
  weight?: number;
  style?: 'normal' | 'italic';
}

const fonts: FontFace[] = [
  {
    fontName: Font.MatrixSmallCaps,
    fileName: 'MatrixRegularSmallCaps',
    format: 'ttf',
  },
  { fontName: Font.MatrixBook, fileName: 'MatrixBook', format: 'ttf' },
  {
    fontName: Font.StoneSerifSmallCaps,
    fileName: 'StoneSerifSmallCapsBold',
    format: 'ttf',
  },
  { fontName: Font.StoneSerif, fileName: 'StoneSerif', format: 'otf' },
  {
    fontName: Font.EurostileCandy,
    fileName: 'EurostileCandyRegular',
    format: 'ttf',
    weight: 400,
  },
  {
    fontName: Font.EurostileCandy,
    fileName: 'EurostileCandyBold',
    format: 'ttf',
    weight: 700,
  },
];

/** `font-family` values per card role, each with its Google Fonts fallback */
export const fontStacks = {
  name: `'${Font.MatrixSmallCaps}', 'Spectral SC', serif`,
  effect: `'${Font.MatrixBook}', Spectral, serif`,
  typeLine: `'${Font.StoneSerifSmallCaps}', 'Spectral SC', serif`,
  stoneSerif: `'${Font.StoneSerif}', Amiri, serif`,
  numerals: `'${Font.EurostileCandy}', 'Crimson Text', serif`,
};

export const fontFaces = css`
  ${fonts.map(
    font => css`
      @font-face {
        font-family: '${font.fontName}';
        src: url('${fontsPath}/${font.fileName}.${font.format}')
          format('${font.format === 'otf' ? 'opentype' : 'truetype'}');
        font-weight: ${font.weight ?? 400};
        font-style: ${font.style ?? 'normal'};
        font-display: swap;
      }
    `,
  )}
`;
