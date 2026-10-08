/** Clamped at 0; blank/non-numeric values (e.g. "?") are treated as 0. */
export const stepValue = (value: string, delta: number): string => {
  const parsed = parseInt(value, 10);
  const base = Number.isNaN(parsed) ? 0 : parsed;
  return String(Math.max(0, base + delta));
};

const statToken = (token: string): string | null => {
  if (token === '?') return token;
  if (!/^\d[\d,]*$/.test(token)) return null;
  return String(parseInt(token.replace(/,/g, ''), 10));
};

/**
 * Parses pasted ATK/DEF text: "2650/2800", a Sheets row "2650<TAB>2800", or a
 * lone value. Returns null when the text isn't stats at all.
 */
export const parseStatPair = (
  text: string,
): { atk: string; def?: string } | null => {
  const tokens = text.trim().split(/\s*\/\s*|\s+/);
  if (tokens.length > 2) return null;
  const values = tokens.map(statToken);
  if (values.some(v => v === null)) return null;
  const [atk, def] = values as string[];
  return def === undefined ? { atk } : { atk, def };
};

/** Modifier step sizes: Ctrl for finer, Shift for coarser. Apply to every
 * way of stepping (buttons, arrow keys, wheel), not just the wheel. */
export const CTRL_STEP = 50;
export const SHIFT_STEP = 1000;

/** Shift wins if both modifiers are held. */
export const stepFor = (
  e: { shiftKey: boolean; ctrlKey: boolean },
  step: number,
): number => (e.shiftKey ? SHIFT_STEP : e.ctrlKey ? CTRL_STEP : step);
