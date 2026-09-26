import create from 'zustand';
import { defaultCard } from './defaults';
import { RushCard, schemaVersion } from './types';

export const serializeCard = (card: RushCard): string =>
  JSON.stringify(card, null, 2);

interface RushCardStore {
  card: RushCard;
  /** Serialised card at the last load/save, for the unsaved-changes check */
  savedJson: string;
  setCard: (partial: Partial<RushCard>) => void;
  markSaved: () => void;
  /** Resets to the default card, optionally keeping some fields */
  resetCard: (keep?: Partial<RushCard>) => void;
  /**
   * Replaces the card with parsed JSON. Returns false (leaving the card
   * untouched) if the text isn't a schema-v1 card. Phase 2 adds real
   * validation.
   */
  applyCardJson: (text: string) => boolean;
}

export const useRushCardStore = create<RushCardStore>(set => ({
  card: defaultCard,
  savedJson: serializeCard(defaultCard),
  setCard: partial => set(state => ({ card: { ...state.card, ...partial } })),
  markSaved: () => set(state => ({ savedJson: serializeCard(state.card) })),
  resetCard: keep => {
    const card = { ...defaultCard, ...keep };
    set({ card, savedJson: serializeCard(card) });
  },
  applyCardJson: text => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return false;
    }
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as { schemaVersion?: unknown }).schemaVersion !== schemaVersion
    ) {
      return false;
    }
    const card: RushCard = { ...defaultCard, ...(parsed as Partial<RushCard>) };
    set({ card, savedJson: serializeCard(card) });
    return true;
  },
}));

export const useIsCardDirty = (): boolean =>
  useRushCardStore(
    state =>
      // Compare against the saved serialisation
      serializeCard(state.card) !== state.savedJson,
  );
