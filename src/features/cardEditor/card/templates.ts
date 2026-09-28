import {
  Attribute,
  SpellTrapIcon,
  Template,
  attributeIds,
  spellTrapIconIds,
  templateIds,
} from './types';

export interface TemplateInfo {
  id: Template;
  label: string;
  /** Frame colour for the picker chip (sampled from the frame at 200,56) */
  swatch: string;
  /** Root-relative; wrap in `withBasePath` when used */
  frame: string;
  isMonster: boolean;
  hasLevel: boolean;
  hasAtkDef: boolean;
  star: 'normal' | 'xyz' | null;
  levelStroke: '#dc3523' | '#000' | null;
  levelLabel: 'Level' | 'Rank';
  nameColor: '#000' | '#fff';
  effectFont: 'matrixBook' | 'stoneSerifItalic';
  /** Forces the SPELL/TRAP attribute icon */
  spellTrap: 'spell' | 'trap' | null;
  defaults: {
    typeLine: string;
    level: number;
    atk: string;
    def: string;
  };
}

const monster = (
  id: Template,
  label: string,
  swatch: string,
  typeLine: string,
  overrides: Partial<TemplateInfo> = {},
  level = 4,
  stats = '0',
): TemplateInfo => ({
  id,
  label,
  swatch,
  frame: `/assets/rush/frames/${id}.png`,
  isMonster: true,
  hasLevel: true,
  hasAtkDef: true,
  star: 'normal',
  levelStroke: '#dc3523',
  levelLabel: 'Level',
  nameColor: '#000',
  effectFont: 'matrixBook',
  spellTrap: null,
  defaults: { typeLine, level, atk: stats, def: stats },
  ...overrides,
});

const backrow = (
  id: 'spell' | 'trap',
  label: string,
  swatch: string,
  typeLine: string,
): TemplateInfo => ({
  id,
  label,
  swatch,
  frame: `/assets/rush/frames/${id}.png`,
  isMonster: false,
  hasLevel: false,
  hasAtkDef: false,
  star: null,
  levelStroke: null,
  levelLabel: 'Level',
  nameColor: '#000',
  effectFont: 'matrixBook',
  spellTrap: id,
  defaults: { typeLine, level: 0, atk: '', def: '' },
});

/** Picker order */
export const templates: Record<Template, TemplateInfo> = {
  normal: monster('normal', 'Normal', '#C08C3F', 'Dragon', {
    effectFont: 'stoneSerifItalic',
  }),
  effect: monster('effect', 'Effect', '#B85A2F', 'Dragon/Effect'),
  ritual: monster('ritual', 'Ritual', '#4671AE', 'Dragon/Ritual/Effect'),
  fusion: monster('fusion', 'Fusion', '#844195', 'Dragon/Fusion/Effect'),
  synchro: monster('synchro', 'Synchro', '#DED7D3', 'Dragon/Synchro/Effect'),
  xyz: monster('xyz', 'Xyz', '#000000', 'Dragon/Xyz/Effect', {
    star: 'xyz',
    levelStroke: '#000',
    levelLabel: 'Rank',
    nameColor: '#fff',
  }),
  token: monster('token', 'Token', '#806F6C', 'Dragon', {}, 1),
  spell: backrow('spell', 'Spell', '#00A3A1', 'Spell'),
  trap: backrow('trap', 'Trap', '#E5579B', 'Trap'),
};

export const templateList: TemplateInfo[] = templateIds.map(
  id => templates[id],
);

const attributeLabels: Record<Attribute, string> = {
  dark: 'Dark',
  divine: 'Divine',
  earth: 'Earth',
  fire: 'Fire',
  light: 'Light',
  water: 'Water',
  wind: 'Wind',
  none: 'None',
};

export interface AttributeInfo {
  id: Attribute;
  label: string;
  /** Root-relative; `none` shows the Void icon */
  icon: string;
}

export const attributes: AttributeInfo[] = attributeIds.map(id => ({
  id,
  label: attributeLabels[id],
  icon: `/assets/rush/attributes/${
    id === 'none' ? 'Void' : attributeLabels[id]
  }.png`,
}));

export interface SpellTrapIconInfo {
  id: SpellTrapIcon;
  label: string;
  /** Root-relative; null for `none` */
  icon: string | null;
  appliesTo: ('spell' | 'trap')[];
}

const iconInfo: Record<
  SpellTrapIcon,
  { label: string; file: string | null; appliesTo: ('spell' | 'trap')[] }
> = {
  none: { label: 'None', file: null, appliesTo: ['spell', 'trap'] },
  continuous: {
    label: 'Continuous',
    file: 'Continuous',
    appliesTo: ['spell', 'trap'],
  },
  counter: { label: 'Counter', file: 'Counter', appliesTo: ['trap'] },
  equip: { label: 'Equip', file: 'Equip', appliesTo: ['spell', 'trap'] },
  field: { label: 'Field', file: 'Field', appliesTo: ['spell'] },
  quickPlay: { label: 'Quick-Play', file: 'Quick-play', appliesTo: ['spell'] },
  ritual: { label: 'Ritual', file: 'Ritual', appliesTo: ['spell'] },
};

export const spellTrapIcons: SpellTrapIconInfo[] = spellTrapIconIds.map(id => ({
  id,
  label: iconInfo[id].label,
  icon: iconInfo[id].file && `/assets/rush/icons/${iconInfo[id].file}.png`,
  appliesTo: iconInfo[id].appliesTo,
}));

/** Root-relative; wrap in `withBasePath` when used */
export const starIcons: Record<'normal' | 'xyz', string> = {
  normal: '/assets/rush/stars/normal.png',
  xyz: '/assets/rush/stars/xyz.png',
};

/** Forced attribute icon for Spell/Trap cards */
export const spellTrapAttributeIcons: Record<'spell' | 'trap', string> = {
  spell: '/assets/rush/attributes/Spell.png',
  trap: '/assets/rush/attributes/Trap.png',
};

export const bracketIcons = {
  left: '/assets/rush/icons/leftbracket.png',
  right: '/assets/rush/icons/rightbracket.png',
  leftWhite: '/assets/rush/icons/leftbracketwhite.png',
  rightWhite: '/assets/rush/icons/rightbracketwhite.png',
};

/** Full-card overlay for Extra cards (NCM's Rainbow Rare border) */
export const rainbowBorder = '/assets/rush/foil/rainbow.png';

/**
 * The type line a template autofills: monsters use their default; Spell/Trap
 * append the property icon's name ("Trap / Continuous").
 */
export const getAutoTypeLine = (
  template: Template,
  icon: SpellTrapIcon,
): string => {
  const { defaults, spellTrap } = templates[template];
  if (!spellTrap || icon === 'none') return defaults.typeLine;
  return `${defaults.typeLine} / ${iconInfo[icon].label}`;
};

export const isIconValidFor = (
  icon: SpellTrapIcon,
  template: Template,
): boolean => {
  const { spellTrap } = templates[template];
  if (!spellTrap) return icon === 'none';
  return iconInfo[icon].appliesTo.includes(spellTrap);
};
