/**
 * sampleCards.js
 *
 * The nine sample cards used for the reference renders (one per template). Shared by
 * `compareReference.js` (which needs the exact reference-render data) and
 * `createSampleSet.js` (which numbers them RD/SMP-EN001..009).
 *
 * Keys are emitted in canonical RushCard order, so
 * `JSON.stringify(card, null, 2)` matches the creator's own `serializeCard`.
 */

'use strict';

const E1 =
  '[REQUIREMENT] Send the top card of your Deck to the GY.\n[EFFECT] This card gains 500 ATK until the end of this turn.';

const card = fields => ({
  schemaVersion: 1,
  template: fields.template,
  name: fields.name,
  attribute: fields.attribute,
  deck: 'main',
  level: fields.level,
  typeLine: fields.typeLine,
  icon: fields.icon ?? 'none',
  effect: fields.effect,
  atk: fields.atk ?? '',
  def: fields.def ?? '',
  setId: 'RD/ABC-EN001',
  serial: '0123456789',
  image: null,
});

const monster = (template, label, attribute, level, typeLine, effect, stats) =>
  card({
    template,
    name: `Sample ${label}`,
    attribute,
    level,
    typeLine,
    effect,
    atk: stats[0],
    def: stats[1],
  });

const backrow = (template, label, typeLine, icon, effect) =>
  card({
    template,
    name: `Sample ${label}`,
    attribute: 'none',
    level: 0,
    typeLine,
    icon,
    effect,
  });

/** Template order = numbering order for the sample set. */
const buildSamples = () => ({
  Normal: monster(
    'normal',
    'Normal',
    'dark',
    7,
    'Dragon',
    'A legendary dragon of flavor text. This italic vanilla text describes the monster.',
    ['2500', '2000'],
  ),
  Effect: monster('effect', 'Effect', 'dark', 7, 'Dragon/Effect', E1, [
    '2500',
    '2000',
  ]),
  Ritual: monster('ritual', 'Ritual', 'light', 7, 'Dragon/Ritual/Effect', E1, [
    '2500',
    '2000',
  ]),
  Fusion: monster('fusion', 'Fusion', 'fire', 7, 'Dragon/Fusion/Effect', E1, [
    '2500',
    '2000',
  ]),
  Synchro: monster(
    'synchro',
    'Synchro',
    'wind',
    7,
    'Dragon/Synchro/Effect',
    E1,
    ['2500', '2000'],
  ),
  Xyz: monster('xyz', 'Xyz', 'water', 4, 'Dragon/Xyz/Effect', E1, [
    '2500',
    '2000',
  ]),
  Token: monster(
    'token',
    'Token',
    'earth',
    1,
    'Dragon',
    'This card can be used as any Token.',
    ['0', '0'],
  ),
  Spell: backrow(
    'spell',
    'Spell',
    'Spell / Equip',
    'equip',
    '[REQUIREMENT] Pay 500 LP.\n[EFFECT] Draw 1 card.',
  ),
  Trap: backrow(
    'trap',
    'Trap',
    'Trap',
    'none',
    '[REQUIREMENT] When your opponent attacks.\n[EFFECT] Negate the attack.',
  ),
});

/** Exactly the data the reference renders were captured with (Set ID RD/ABC-EN001). */
const referenceSamples = () => buildSamples();

/** The same cards numbered RD/SMP-EN001..009 in template order. */
const sampleSetCards = () =>
  Object.fromEntries(
    Object.entries(buildSamples()).map(([name, sample], index) => [
      name,
      {
        ...sample,
        setId: `RD/SMP-EN${String(index + 1).padStart(3, '0')}`,
      },
    ]),
  );

module.exports = { referenceSamples, sampleSetCards };
