import {
  CardField,
  useInlineEditStore,
} from '@cardEditor/cardStyles/inlineEditStore';
import {
  stepFor,
  stepValue,
} from '@cardEditor/editor/CardFieldsForm/fields/StatInput/step';
import { KeyboardEvent, useCallback, useEffect, useRef } from 'react';

/**
 * Wires one card text region to inline editing: whether it is being edited,
 * live updates into the store, and Esc restoring the value from before.
 */
export const useInlineField = (
  field: CardField,
  value: string,
  set: (value: string) => void,
) => {
  const editing = useInlineEditStore(state => state.editing === field);
  const latest = useRef({ value, set });
  latest.current = { value, set };
  const original = useRef(value);

  useEffect(() => {
    if (editing) original.current = latest.current.value;
  }, [editing]);

  const onDone = useCallback(
    (cancel: boolean) => {
      const { editing: current, stop } = useInlineEditStore.getState();
      // Esc unmounts the editor, whose blur would otherwise finish a second time
      if (current !== field) return;
      if (cancel) latest.current.set(original.current);
      stop(field);
    },
    [field],
  );

  return { editing, onTextChange: set, onDone };
};

interface StepperOptions {
  step: number;
  /** Ctrl / Shift change the step (ATK/DEF); off for Level */
  modifiers: boolean;
  max?: number;
}

/** ↑/↓ keys and wheel stepping for a numeric editor, like `StatInput` */
export const useStepper = (
  value: string,
  set: (value: string) => void,
  { step, modifiers, max }: StepperOptions,
) => {
  const latest = useRef({ value, set });
  latest.current = { value, set };

  const apply = useCallback(
    (sign: 1 | -1, e: { shiftKey: boolean; ctrlKey: boolean }) => {
      const amount = modifiers ? stepFor(e, step) : step;
      const next = stepValue(latest.current.value, sign * amount);
      latest.current.set(
        max === undefined ? next : String(Math.min(max, +next)),
      );
    },
    [step, modifiers, max],
  );

  const onEditorKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      apply(e.key === 'ArrowUp' ? 1 : -1, e);
    },
    [apply],
  );

  const onEditorWheel = useCallback(
    (e: WheelEvent) => {
      // Shift+wheel arrives as deltaX
      const raw = e.deltaY || e.deltaX;
      if (raw === 0) return;
      apply(raw < 0 ? 1 : -1, e);
    },
    [apply],
  );

  return { onEditorKeyDown, onEditorWheel };
};
