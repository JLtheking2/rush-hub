import { getDefaultCard } from './defaults';
import {
  Attribute,
  CardImage,
  Deck,
  RushCard,
  SpellTrapIcon,
  Template,
  attributeIds,
  deckIds,
  schemaVersion,
  spellTrapIconIds,
  templateIds,
} from './types';

export type ParseResult =
  | { ok: true; card: RushCard }
  | { ok: false; error: string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isOneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === 'string' && (list as readonly string[]).includes(v);

const cropKeys = ['x', 'y', 'width', 'height'] as const;

const parseImage = (v: unknown): CardImage | null | undefined => {
  if (v === null) return null;
  if (!isRecord(v) || typeof v.src !== 'string') return undefined;
  const image: CardImage = { src: v.src };
  if (v.crop !== undefined) {
    const { crop } = v;
    if (
      !isRecord(crop) ||
      !cropKeys.every(
        k => typeof crop[k] === 'number' && Number.isFinite(crop[k]),
      )
    ) {
      return undefined;
    }
    image.crop = {
      x: crop.x as number,
      y: crop.y as number,
      width: crop.width as number,
      height: crop.height as number,
    };
  }
  return image;
};

/**
 * Parses and validates card JSON text. Missing fields take the template's
 * defaults, present-but-wrong fields are rejected (naming the field), and
 * unknown keys are dropped.
 */
export const parseRushCard = (text: string): ParseResult => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "The file isn't valid JSON." };
  }
  if (!isRecord(parsed)) {
    return { ok: false, error: "This isn't a rush-hub card." };
  }
  if (parsed.schemaVersion === undefined) {
    return { ok: false, error: "This isn't a rush-hub card." };
  }
  if (parsed.schemaVersion !== schemaVersion) {
    return {
      ok: false,
      error: `Unsupported schema version ${String(parsed.schemaVersion)}.`,
    };
  }
  if (!isOneOf<Template>(templateIds, parsed.template)) {
    return {
      ok: false,
      error:
        'Missing or unknown "template" (expected one of: ' +
        `${templateIds.join(', ')}).`,
    };
  }

  const card = getDefaultCard(parsed.template);
  const bad = (field: string, why: string): ParseResult => ({
    ok: false,
    error: `Invalid "${field}": ${why}.`,
  });

  const stringFields = [
    'name',
    'typeLine',
    'effect',
    'atk',
    'def',
    'setId',
    'serial',
  ] as const;
  const input: Record<string, unknown> = parsed;
  const badField = stringFields.find(
    field => input[field] !== undefined && typeof input[field] !== 'string',
  );
  if (badField) return bad(badField, 'expected text');
  stringFields.forEach(field => {
    const v = input[field];
    if (typeof v === 'string') card[field] = v;
  });

  if (parsed.attribute !== undefined) {
    if (!isOneOf<Attribute>(attributeIds, parsed.attribute)) {
      return bad('attribute', `expected one of ${attributeIds.join(', ')}`);
    }
    card.attribute = parsed.attribute;
  }
  if (parsed.deck !== undefined) {
    if (!isOneOf<Deck>(deckIds, parsed.deck)) {
      return bad('deck', `expected one of ${deckIds.join(', ')}`);
    }
    card.deck = parsed.deck;
  }
  if (parsed.icon !== undefined) {
    if (!isOneOf<SpellTrapIcon>(spellTrapIconIds, parsed.icon)) {
      return bad('icon', `expected one of ${spellTrapIconIds.join(', ')}`);
    }
    card.icon = parsed.icon;
  }
  if (parsed.level !== undefined) {
    const { level } = parsed;
    if (
      typeof level !== 'number' ||
      !Number.isInteger(level) ||
      level < 0 ||
      level > 12
    ) {
      return bad('level', 'expected a whole number from 0 to 12');
    }
    card.level = level;
  }
  if (parsed.image !== undefined) {
    const image = parseImage(parsed.image);
    if (image === undefined) {
      return bad('image', 'expected null or { src, crop? }');
    }
    card.image = image;
  }

  return { ok: true, card };
};
