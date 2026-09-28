import { getAutoTypeLine, isIconValidFor, templates } from './templates';
import { RushCard, Template, schemaVersion } from './types';

export const defaultTemplate: Template = 'effect';

/** Builds keys in a fixed order so the serialised dirty check stays stable */
export const getDefaultCard = (template: Template): RushCard => {
  const { defaults } = templates[template];
  return {
    schemaVersion,
    template,
    name: '',
    attribute: 'none',
    deck: 'main',
    level: defaults.level,
    typeLine: defaults.typeLine,
    icon: 'none',
    effect: '',
    atk: defaults.atk,
    def: defaults.def,
    setId: '',
    serial: '',
    image: null,
  };
};

export const defaultCard: RushCard = getDefaultCard(defaultTemplate);

/**
 * Switches template, keeping what carries over: name, deck, effect, set ID,
 * serial and art always; attribute/level/ATK/DEF between monsters; the type line if
 * the user edited it; the Spell/Trap icon if it's valid for the new template.
 */
export const switchTemplate = (card: RushCard, next: Template): RushCard => {
  const prev = templates[card.template];
  const target = templates[next];
  const fresh = getDefaultCard(next);
  const keepMonsterFields = prev.isMonster && target.isMonster;
  const icon = isIconValidFor(card.icon, next) ? card.icon : 'none';

  return {
    ...fresh,
    name: card.name,
    deck: card.deck,
    effect: card.effect,
    setId: card.setId,
    serial: card.serial,
    image: card.image,
    ...(keepMonsterFields && {
      attribute: card.attribute,
      level: card.level,
      atk: card.atk,
      def: card.def,
    }),
    typeLine:
      card.typeLine === getAutoTypeLine(card.template, card.icon)
        ? getAutoTypeLine(next, icon)
        : card.typeLine,
    icon,
  };
};
