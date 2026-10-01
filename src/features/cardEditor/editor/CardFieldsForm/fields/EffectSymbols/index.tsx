import { useRushCardStore } from '@cardEditor/card/store';
import { Button } from '@mui/material';
import { Box } from '@mui/system';
import { FC } from 'react';

const symbols = [
  '●',
  '①',
  '②',
  '③',
  '④',
  '⑤',
  '⑥',
  '⑦',
  '⑧',
  '⑨',
  '⑩',
  '★',
  '☆',
  '・',
  '「',
  '」',
  '―',
  '×',
];

const EffectSymbols: FC = () => {
  const setCard = useRushCardStore(state => state.setCard);

  const insert = (symbol: string) => {
    const el = document.getElementById(
      'effect-input',
    ) as HTMLTextAreaElement | null;

    // execCommand goes through the browser's editing pipeline, so the
    // insertion lands on the native undo stack (Ctrl+Z) and fires a real
    // input event. Assigning .value from script would wipe that stack.
    if (el) {
      el.focus();
      if (document.execCommand('insertText', false, symbol)) return;
    }

    // Fallback: no undo support, but nothing is lost.
    const effect = el?.value ?? useRushCardStore.getState().card.effect;
    const start = el?.selectionStart ?? effect.length;
    const end = el?.selectionEnd ?? effect.length;
    setCard({ effect: effect.slice(0, start) + symbol + effect.slice(end) });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + symbol.length, start + symbol.length);
    });
  };

  return (
    <Box display="flex" flexWrap="wrap" gap={0.5}>
      {symbols.map(symbol => (
        <Button
          key={symbol}
          size="small"
          variant="outlined"
          title={`Insert ${symbol}`}
          sx={{ minWidth: 36, px: 1 }}
          onMouseDown={e => e.preventDefault()}
          onClick={() => insert(symbol)}
        >
          {symbol}
        </Button>
      ))}
    </Box>
  );
};

export default EffectSymbols;
