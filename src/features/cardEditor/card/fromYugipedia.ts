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

/**
 * Maps a Yugipedia card page's wikitext onto RushCard fields. Only the
 * card-content fields are returned; the caller keeps name/set/art.
 */
export const parseYugipediaCard = (
  wikitext: string,
): Pick<
  RushCard,
  | 'template'
  | 'attribute'
  | 'level'
  | 'typeLine'
  | 'icon'
  | 'effect'
  | 'atk'
  | 'def'
> => {
  const p = parseParams(wikitext);
  const cardType = (p.card_type ?? '').trim().toLowerCase();
  // `text` already begins with the materials/summoning line on Yugipedia
  const effect = stripWikiMarkup(p.text ?? '');

  if (cardType === 'spell' || cardType === 'trap') {
    const property = stripWikiMarkup(p.property ?? '').toLowerCase();
    const mapped = iconByProperty[property] ?? 'none';
    const icon = isIconValidFor(mapped, cardType) ? mapped : 'none';
    return {
      template: cardType,
      attribute: 'none',
      level: 0,
      typeLine: getAutoTypeLine(cardType, icon),
      icon,
      effect: stripWikiMarkup(p.text ?? ''),
      atk: '',
      def: '',
    };
  }

  const typeParts = stripWikiMarkup(p.types ?? '')
    .split('/')
    .map(s => s.trim())
    .filter(Boolean);
  const template = monsterTemplate(typeParts.map(s => s.toLowerCase()));
  const attr = (p.attribute ?? '').trim().toLowerCase();
  const level = parseInt(p.level ?? p.rank ?? '', 10);

  return {
    template,
    attribute: (attributeIds as readonly string[]).includes(attr)
      ? (attr as Attribute)
      : 'none',
    level: Number.isNaN(level) ? 0 : Math.min(12, Math.max(0, level)),
    typeLine: typeParts.join('/'),
    icon: 'none',
    effect,
    atk: (p.atk ?? '').trim(),
    def: (p.def ?? '').trim(),
  };
};
