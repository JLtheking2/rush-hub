import { css, styled } from '@css';

/**
 * Card geometry. 63.5 x 88.9mm is the standard trading-card size, so a cut sheet
 * fits commercial sleeves. Three columns (190.5mm) and three rows (266.7mm) on
 * A4 leave ~9.75mm side and ~15.15mm top/bottom margins — inside the unprintable
 * area of every consumer printer.
 */
const cardWidth = '63.5mm';
const cardHeight = '88.9mm';

/**
 * Applied by the print page only. The app chrome is semantic (`AppBar` renders
 * <header>, the footer uses component="footer", MainContainer is `as="main"`),
 * so print can hide it without any layout components needing to opt in.
 */
export const printGlobalStyles = css`
  @page {
    size: A4 portrait;
    margin: 0;
  }

  @media print {
    header,
    footer {
      display: none !important;
    }

    main {
      padding: 0 !important;
      max-width: none !important;
    }

    /* The Background wrapper's gradient and min-height would otherwise force a
       trailing blank page. */
    #__next > div {
      background: none !important;
      min-height: 0 !important;
    }
  }
`;

export const PrintToolbar = styled('div')`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.spacing(5)};

  @media print {
    display: none;
  }
`;

export const Sheet = styled('div')`
  width: 210mm;
  height: 297mm;
  display: grid;
  grid-template-columns: repeat(3, ${cardWidth});
  grid-template-rows: repeat(3, ${cardHeight});
  justify-content: center;
  align-content: center;
  background-color: #fff;
  /* Keep the artwork's colours instead of letting the browser strip them. */
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;

  /* Screen-only preview affordances. */
  margin: 0 auto ${({ theme }) => theme.spacing(6)};
  box-shadow: ${({ theme }) => theme.shadows[8]};

  @media print {
    margin: 0;
    box-shadow: none;
    break-after: page;

    &:last-of-type {
      break-after: auto;
    }
  }
`;

/**
 * The hairline is an `outline`, not a `border`: an outline takes no layout space,
 * so cards stay flush and each seam's two lines land on the same physical line —
 * one cut per seam.
 */
export const CardCell = styled('div')`
  width: ${cardWidth};
  height: ${cardHeight};
  overflow: hidden;
  outline: 0.25mm solid #9a9a9a;
  outline-offset: -0.125mm;
`;

/**
 * `object-fit: fill` is deliberate. The source art is 745x1040 (0.7164) against a
 * 0.7143 target — a 0.3% difference that is invisible, whereas `contain` would
 * introduce white slivers and break the flush-cut geometry.
 */
export const CardPrintImage = styled('img')`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: fill;
`;
