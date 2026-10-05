import { Area } from 'react-easy-crop';

export const templateIds = [
  'normal',
  'effect',
  'ritual',
  'fusion',
  'synchro',
  'xyz',
  'token',
  'spell',
  'trap',
] as const;
export type Template = typeof templateIds[number];

export const attributeIds = [
  'dark',
  'divine',
  'earth',
  'fire',
  'light',
  'water',
  'wind',
  'none',
] as const;
export type Attribute = typeof attributeIds[number];

export const deckIds = ['main', 'extra'] as const;
export type Deck = typeof deckIds[number];

export const spellTrapIconIds = [
  'none',
  'continuous',
  'counter',
  'equip',
  'field',
  'quickPlay',
  'ritual',
] as const;
export type SpellTrapIcon = typeof spellTrapIconIds[number];

export type CropArea = Area;

export interface CardImage {
  /** Base64 data URL (or remote URL) of the art */
  src: string;
  crop?: CropArea;
}

export const schemaVersion = 1;

export interface RushCard {
  schemaVersion: typeof schemaVersion;
  template: Template;
  name: string;
  /** Monsters only; Spell/Trap force the SPELL/TRAP icon */
  attribute: Attribute;
  /** `extra` adds the rainbow border and a white, outlined name */
  deck: Deck;
  /** Xyz is labelled "Rank" in the form, same badge slot */
  level: number;
  /** e.g. "Dragon/Effect"; free text */
  typeLine: string;
  /** Spell/Trap only */
  icon: SpellTrapIcon;
  /** "\n" = paragraph break; rendered as typed */
  effect: string;
  /** Strings so "?" works */
  atk: string;
  def: string;
  setId: string;
  serial: string;
  /** Copies of this card in its set (print sheets); never rendered */
  quantity: number;
  image: CardImage | null;
}
