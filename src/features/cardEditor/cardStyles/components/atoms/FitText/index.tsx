import useFontsReady from '@hooks/useFontsReady';
import {
  CSSProperties,
  FC,
  KeyboardEvent,
  MutableRefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
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
  /** Swaps the text for an input/textarea with the same typography */
  editing?: boolean;
  onTextChange?: (text: string) => void;
  /** Enter / blur finish (`cancel` false); Esc cancels. Block mode: Ctrl+Enter finishes. */
  onDone?: (cancel: boolean) => void;
  onEditorKeyDown?: (e: KeyboardEvent<EditorEl>) => void;
  /** Wheel over the focused editor; FitText stops the page from scrolling */
  onEditorWheel?: (e: WheelEvent) => void;
  inputMode?: 'numeric' | 'text';
}

const origins = { left: 'left', right: 'right', center: 'center' } as const;

type EditorEl = HTMLInputElement | HTMLTextAreaElement;

interface EditorFieldProps {
  multiline: boolean;
  editorRef: MutableRefObject<EditorEl | null>;
  value: string;
  inputMode: 'numeric' | 'text';
  align: 'left' | 'right' | 'center';
  onChange: (value: string) => void;
  onBlur: () => void;
  onKeyDown: (e: KeyboardEvent<EditorEl>) => void;
}

/** Inherits the typography of the FitText box it replaces the text of */
const EditorField: FC<EditorFieldProps> = ({
  multiline,
  editorRef,
  value,
  inputMode,
  align,
  onChange,
  onBlur,
  onKeyDown,
}) => {
  const style: CSSProperties = {
    display: 'block',
    boxSizing: 'border-box',
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
    border: 0,
    outline: 0,
    background: 'transparent',
    font: 'inherit',
    lineHeight: 'inherit',
    color: 'inherit',
    WebkitTextStroke: 'inherit',
    paintOrder: 'inherit',
    cursor: 'text',
    textAlign: multiline ? 'justify' : align,
    ...(multiline && {
      textAlignLast: 'left',
      resize: 'none',
      overflow: 'hidden',
    }),
  };
  const common = {
    value,
    inputMode,
    style,
    spellCheck: false,
    onBlur,
    onKeyDown,
  } as const;

  return multiline ? (
    <textarea
      {...common}
      ref={el => {
        // eslint-disable-next-line no-param-reassign
        editorRef.current = el;
      }}
      onChange={e => onChange(e.currentTarget.value)}
    />
  ) : (
    <input
      {...common}
      type="text"
      ref={el => {
        // eslint-disable-next-line no-param-reassign
        editorRef.current = el;
      }}
      onChange={e => onChange(e.currentTarget.value)}
    />
  );
};

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
  editing = false,
  onTextChange,
  onDone,
  onEditorKeyDown,
  onEditorWheel,
  inputMode = 'text',
}) => {
  const fontsReady = useFontsReady();
  const editorRef = useRef<EditorEl | null>(null);
  const latestWheel = useRef(onEditorWheel);
  latestWheel.current = onEditorWheel;

  useEffect(() => {
    const editor = editorRef.current;
    if (!editing || !editor) return undefined;
    editor.focus({ preventScroll: true });
    const end = editor.value.length;
    editor.setSelectionRange(end, end);

    // Native + non-passive so the page doesn't scroll (or Ctrl+wheel zoom)
    const handleWheel = (e: WheelEvent) => {
      if (!latestWheel.current) return;
      e.preventDefault();
      latestWheel.current(e);
    };
    const target: HTMLElement = editor;
    target.addEventListener('wheel', handleWheel, { passive: false });
    return () => target.removeEventListener('wheel', handleWheel);
  }, [editing]);

  const handleKeyDown = (e: KeyboardEvent<EditorEl>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onDone?.(true);
    } else if (e.key === 'Enter' && (mode === 'line' || e.ctrlKey)) {
      e.preventDefault();
      onDone?.(false);
    } else {
      onEditorKeyDown?.(e);
    }
  };
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
    <CardBox
      at={[at[0], at[1] + dy, width, height]}
      style={editing ? { zIndex: 2 } : undefined}
    >
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
        {editing ? (
          <EditorField
            multiline={mode === 'block'}
            editorRef={editorRef}
            value={text}
            inputMode={inputMode}
            align={align}
            onChange={v => onTextChange?.(v)}
            onBlur={() => onDone?.(false)}
            onKeyDown={handleKeyDown}
          />
        ) : mode === 'line' ? (
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
