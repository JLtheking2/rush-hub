import { getAutoTypeLine, isIconValidFor } from './templates';
import {
  Attribute,
  RushCard,
  SpellTrapIcon,
  Template,
  attributeIds,
} from './types';

/** Reads the `| key = value` params of the `{{CardTable2 ...}}` template */
const parseParams = (wikitext: string): Record<string, string> => {
  const start = wikitext.indexOf('{{CardTable2');
  if (start === -1) throw new Error('Not a card page');

  const params: Record<string, string> = {};
  let key: string | null = null;
  wikitext
    .slice(start)
    .split('\n')
    .slice(1)
    .some(line => {
      if (line.startsWith('}}')) return true;
      const match = line.match(/^\|\s*([\w]+)\s*=\s?(.*)$/);
      if (match) {
        const [, k, value] = match;
        key = k;
        params[k] = value;
      } else if (key) {
        params[key] += `\n${line}`;
      }
      return false;
    });
  return params;
};

const stripWikiMarkup = (text: string): string =>
  text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\[\[[^|\]]*\|([^\]]*)\]\]/g, '$1')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/'{2,3}/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .trim();

const iconByProperty: Record<string, SpellTrapIcon> = {
  continuous: 'continuous',
  counter: 'counter',
  equip: 'equip',
  field: 'field',
  'quick-play': 'quickPlay',
  ritual: 'ritual',
};

const monsterTemplate = (types: string[]): Template => {
  const found = (['ritual', 'fusion', 'synchro', 'xyz', 'token'] as const).find(
    t => types.includes(t),
  );
  if (found) return found;
  return types.includes('normal') ? 'normal' : 'effect';
};

const cardKindTypes = [
  'effect',
  'normal',
  'ritual',
  'fusion',
  'synchro',
  'xyz',
  'link',
  'token',
];

/** Old Fandom pages omit `Normal`; Yugipedia has added it to every Normal monster */
const withImpliedNormal = (types: string[]): string[] =>
  types.some(t => cardKindTypes.includes(t.toLowerCase()))
    ? types
    : [...types, 'Normal'];

export type WikiCardFields = Pick<
  RushCard,
  | 'template'
  | 'attribute'
  | 'level'
  | 'typeLine'
  | 'icon'
  | 'effect'
  | 'atk'
  | 'def'
>;

/** Both wikis' `CardTable2` params, already mapped onto common names */
interface WikiCardParams {
  cardType: string;
  property: string;
  types: string[];
  attribute: string;
  level: string;
  atk: string;
  def: string;
  effect: string;
}

const buildCard = (p: WikiCardParams): WikiCardFields => {
  const cardType = p.cardType.trim().toLowerCase();

  if (cardType === 'spell' || cardType === 'trap') {
    const property = stripWikiMarkup(p.property).toLowerCase();
    const mapped = iconByProperty[property] ?? 'none';
    const icon = isIconValidFor(mapped, cardType) ? mapped : 'none';
    return {
      template: cardType,
      attribute: 'none',
      level: 0,
      typeLine: getAutoTypeLine(cardType, icon),
      icon,
      effect: p.effect,
      atk: '',
      def: '',
    };
  }

  const template = monsterTemplate(p.types.map(s => s.toLowerCase()));
  const attr = p.attribute.trim().toLowerCase();
  const level = parseInt(p.level, 10);

  return {
    template,
    attribute: (attributeIds as readonly string[]).includes(attr)
      ? (attr as Attribute)
      : 'none',
    level: Number.isNaN(level) ? 0 : Math.min(12, Math.max(0, level)),
    typeLine: p.types.join('/'),
    icon: 'none',
    effect: p.effect,
    atk: p.atk.trim(),
    def: p.def.trim(),
  };
};

/**
 * Maps a Yugipedia card page's wikitext onto RushCard fields. Only the
 * card-content fields are returned; the caller keeps name/set/art.
 */
export const parseYugipediaCard = (wikitext: string): WikiCardFields => {
  const p = parseParams(wikitext);
  return buildCard({
    cardType: p.card_type ?? '',
    property: p.property ?? '',
    types: stripWikiMarkup(p.types ?? '')
      .split('/')
      .map(s => s.trim())
      .filter(Boolean),
    attribute: p.attribute ?? '',
    level: p.level ?? p.rank ?? '',
    atk: p.atk ?? '',
    def: p.def ?? '',
    // `text` already begins with the materials/summoning line on Yugipedia
    effect: stripWikiMarkup(p.text ?? ''),
  });
};

/**
 * Same as `parseYugipediaCard` for a Yu-Gi-Oh! Fandom page: types are split
 * over `type`/`type2`/…, text is `lore`, and Rush-only pages add `requirement`.
 */
export const parseFandomCard = (wikitext: string): WikiCardFields => {
  const p = parseParams(wikitext);
  const lore = stripWikiMarkup(p.lore ?? '');
  const requirement = stripWikiMarkup(p.requirement ?? '');
  const cardType = (p.card_type ?? '').trim().toLowerCase();
  const types = [p.type, p.type2, p.type3, p.type4]
    .map(t => stripWikiMarkup(t ?? ''))
    .filter(Boolean);
  return buildCard({
    cardType: p.card_type ?? '',
    property: p.property ?? '',
    types:
      cardType === 'spell' || cardType === 'trap'
        ? types
        : withImpliedNormal(types),
    attribute: p.attribute ?? '',
    level: p.level ?? p.rank ?? '',
    atk: p.atk ?? '',
    def: p.def ?? '',
    effect:
      requirement && requirement.toLowerCase() !== 'none'
        ? `[REQUIREMENT] ${requirement}\n[EFFECT] ${lore}`
        : lore,
  });
};
