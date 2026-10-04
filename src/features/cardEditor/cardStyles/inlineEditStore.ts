import create from 'zustand';

/** Card regions that link to a control in the form */
export type CardField =
  | 'name'
  | 'attribute'
  | 'template'
  | 'stIcon'
  | 'art'
  | 'level'
  | 'atk'
  | 'def'
  | 'typeLine'
  | 'effect'
  | 'serial'
  | 'setId';

interface InlineEditStore {
  /** The text region currently being typed into on the card */
  editing: CardField | null;
  start: (field: CardField) => void;
  /** Only clears if `field` is still the one being edited */
  stop: (field: CardField) => void;
}

export const useInlineEditStore = create<InlineEditStore>(set => ({
  editing: null,
  start: field => set({ editing: field }),
  stop: field =>
    set(state => (state.editing === field ? { editing: null } : state)),
}));
