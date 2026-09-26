/**
 * Text is measured at native scale (font-size 16px, so 1 unit = 1px) in a
 * hidden element. Results don't depend on the preview width, and the export
 * clone inherits the fitted values.
 */
export interface MeasureFont {
  family: string;
  weight?: number;
  style?: 'normal' | 'italic';
}

let measurer: HTMLDivElement | null = null;

const getMeasurer = (font: MeasureFont, size: number): HTMLDivElement => {
  if (!measurer) {
    measurer = document.createElement('div');
    measurer.setAttribute('aria-hidden', 'true');
    Object.assign(measurer.style, {
      position: 'absolute',
      visibility: 'hidden',
      left: '-9999px',
      top: '0',
      lineHeight: '1',
      padding: '0',
      border: '0',
    });
    document.body.appendChild(measurer);
  }
  Object.assign(measurer.style, {
    fontFamily: font.family,
    fontWeight: String(font.weight ?? 400),
    fontStyle: font.style ?? 'normal',
    fontSize: `${size}px`,
  });
  return measurer;
};

/** Natural (unsquashed) single-line width in units */
export const measureWidth = (
  text: string,
  font: MeasureFont,
  size: number,
): number => {
  const el = getMeasurer(font, size);
  Object.assign(el.style, {
    whiteSpace: 'nowrap',
    width: 'auto',
    display: 'inline-block',
    textAlign: 'left',
  });
  el.textContent = text;
  return el.getBoundingClientRect().width;
};

/** Whether wrapped, justified text fits inside width × height (units) */
export const fitsHeight = (
  text: string,
  font: MeasureFont,
  size: number,
  width: number,
  height: number,
): boolean => {
  const el = getMeasurer(font, size);
  Object.assign(el.style, {
    whiteSpace: 'pre-line',
    display: 'block',
    width: `${width}px`,
    textAlign: 'justify',
  });
  el.textContent = text;
  return el.scrollHeight <= height;
};
