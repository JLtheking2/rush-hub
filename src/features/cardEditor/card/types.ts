import { Area } from 'react-easy-crop';

export type Template =
  | 'normal'
  | 'effect'
  | 'ritual'
  | 'fusion'
  | 'synchro'
  | 'xyz'
  | 'token'
  | 'spell'
  | 'trap';

export type Attribute =
  | 'dark'
  | 'divine'
  | 'earth'
  | 'fire'
  | 'light'
  | 'water'
  | 'wind'
  | 'none';

export type SpellTrapIcon =
  | 'none'
  | 'continuous'
  | 'counter'
  | 'equip'
  | 'field'
  | 'quickPlay'
  | 'ritual';

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
  image: CardImage | null;
}
