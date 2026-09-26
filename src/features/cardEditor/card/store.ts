import create from 'zustand';
import {
  defaultCard,
  defaultTemplate,
  getDefaultCard,
  switchTemplate,
} from './defaults';
import { parseRushCard } from './validate';
import { RushCard, Template } from './types';

export const serializeCard = (card: RushCard): string =>
  JSON.stringify(card, null, 2);

export type ApplyResult = { ok: true } | { ok: false; error: string };

interface RushCardStore {
  card: RushCard;
  /** Serialised card at the last load/save, for the unsaved-changes check */
  savedJson: string;
  setCard: (partial: Partial<RushCard>) => void;
  /** Switches template, carrying over shared fields (counts as an edit) */
  setTemplate: (template: Template) => void;
  markSaved: () => void;
  /** Resets to the template's default card, optionally keeping some fields */
  resetCard: (keep?: Partial<RushCard>) => void;
  /**
   * Replaces the card with validated JSON. On failure the card is left
   * untouched and the reason is returned.
   */
  applyCardJson: (text: string) => ApplyResult;
}

export const useRushCardStore = create<RushCardStore>(set => ({
  card: defaultCard,
  savedJson: serializeCard(defaultCard),
  setCard: partial => set(state => ({ card: { ...state.card, ...partial } })),
  setTemplate: template =>
    set(state => ({ card: switchTemplate(state.card, template) })),
  markSaved: () => set(state => ({ savedJson: serializeCard(state.card) })),
  resetCard: keep => {
    const card = {
      ...getDefaultCard(keep?.template ?? defaultTemplate),
      ...keep,
    };
    set({ card, savedJson: serializeCard(card) });
  },
  applyCardJson: text => {
    const result = parseRushCard(text);
    if (!result.ok) return result;
    set({ card: result.card, savedJson: serializeCard(result.card) });
    return { ok: true };
  },
}));

export const useIsCardDirty = (): boolean =>
  useRushCardStore(
    state =>
      // Compare against the saved serialisation
      serializeCard(state.card) !== state.savedJson,
  );
