/** Clamped at 0; blank/non-numeric values (e.g. "?") are treated as 0. */
export const stepValue = (value: string, delta: number): string => {
  const parsed = parseInt(value, 10);
  const base = Number.isNaN(parsed) ? 0 : parsed;
  return String(Math.max(0, base + delta));
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
