import useFontsReady from '@hooks/useFontsReady';
import { FC, useState } from 'react';
import { useIsomorphicLayoutEffect } from 'react-use';
import { Rect } from '../../../layout';
import { fitsHeight, measureWidth } from '../../../utils/measureText';
import { u } from '../../../units';
import CardBox from '../CardBox';

const MIN_SIZE = 6;
const STEP = 0.25;

export interface FitTextProps {
  at: Rect;
  text: string;
  /** Maximum font size in units */
  size: number;
  family: string;
  weight?: number;
  fontStyle?: 'normal' | 'italic';
  color?: string;
  align?: 'left' | 'right' | 'center';
  /**
   * `line`: single line, squashed horizontally to fit the width.
   * `block`: wrapped + justified, font shrinks until the height fits.
   */
  mode: 'line' | 'block';
  /** Vertical nudge in units (canvas-baseline → DOM line box) */
  dy?: number;
  stroke?: { width: number; color: string };
}

const origins = { left: 'left', right: 'right', center: 'center' } as const;

const FitText: FC<FitTextProps> = ({
  at,
  text,
  size,
  family,
  weight,
  fontStyle,
  color = '#000',
  align = 'left',
  mode,
  dy = 0,
  stroke,
}) => {
  const fontsReady = useFontsReady();
  const [fit, setFit] = useState<{ size: number; scale: number }>({
    size,
    scale: 1,
  });
  const [, , width, height] = at;

  useIsomorphicLayoutEffect(() => {
    if (!fontsReady) return;
    const font = { family, weight, style: fontStyle };
    if (mode === 'line') {
      const natural = measureWidth(text, font, size);
      setFit({ size, scale: Math.min(1, width / Math.max(natural, 1)) });
      return;
    }
    let s = size;
    while (s > MIN_SIZE && !fitsHeight(text, font, s, width, height)) {
      s -= STEP;
    }
    setFit({ size: s, scale: 1 });
  }, [fontsReady, text, size, family, weight, fontStyle, mode, width, height]);

  const strokeStyle = stroke
    ? {
        // em here is relative to this element's own font-size
        WebkitTextStroke: `${stroke.width / fit.size}em ${stroke.color}`,
        paintOrder: 'stroke fill' as const,
      }
    : undefined;

  return (
    <CardBox at={[at[0], at[1] + dy, width, height]}>
      <div
        style={{
          width: '100%',
          height: '100%',
          fontFamily: family,
          fontWeight: weight ?? 400,
          fontStyle: fontStyle ?? 'normal',
          fontSize: u(fit.size),
          lineHeight: 1,
          color,
          textAlign: align,
          ...strokeStyle,
          ...(mode === 'line'
            ? { whiteSpace: 'nowrap' }
            : {
                whiteSpace: 'pre-line',
                textAlign: 'justify',
                textAlignLast: 'left',
              }),
        }}
      >
        {mode === 'line' ? (
          <span
            style={{
              display: 'inline-block',
              transform: `scaleX(${fit.scale})`,
              transformOrigin: `${origins[align]} center`,
            }}
          >
            {text}
          </span>
        ) : (
          text
        )}
      </div>
    </CardBox>
  );
};

export default FitText;
