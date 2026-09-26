import {
  getAutoTypeLine,
  spellTrapIcons,
  templates,
} from '@cardEditor/card/templates';
import { SpellTrapIcon } from '@cardEditor/card/types';
import { useRushCardStore } from '@cardEditor/card/store';
import ControlledSelector from '@components/inputs/ControlledSelector';
import { SelectorListItemIcon } from '@components/SelectorListItemIcon';
import { SelectorMenuItem } from '@components/SelectorMenuItem';
import { ListItemText, SelectChangeEvent } from '@mui/material';
import withBasePath from '@utils/withBasePath';
import { FC, useCallback } from 'react';

const SpellTrapIconSelector: FC = () => {
  const icon = useRushCardStore(state => state.card.icon);
  const spellTrap = useRushCardStore(
    state => templates[state.card.template].spellTrap,
  );
  const setCard = useRushCardStore(state => state.setCard);

  const handleChange = useCallback(
    (event: SelectChangeEvent) => {
      const next = event.target.value as SpellTrapIcon;
      const { card } = useRushCardStore.getState();
      // Only rewrite the type line if the user hasn't edited it
      const untouched =
        card.typeLine === getAutoTypeLine(card.template, card.icon);
      setCard({
        icon: next,
        ...(untouched && { typeLine: getAutoTypeLine(card.template, next) }),
      });
    },
    [setCard],
  );

  if (!spellTrap) return null;

  return (
    <ControlledSelector
      value={icon}
      displayName="Property Icon"
      slug="stIcon"
      onChange={handleChange}
    >
      {spellTrapIcons
        .filter(i => i.appliesTo.includes(spellTrap))
        .map(i => (
          <SelectorMenuItem value={i.id} key={i.id}>
            <SelectorListItemIcon>
              {i.icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={withBasePath(i.icon)} width={22} height={22} alt="" />
              )}
            </SelectorListItemIcon>
            <ListItemText primary={i.label} />
          </SelectorMenuItem>
        ))}
    </ControlledSelector>
  );
};

export default SpellTrapIconSelector;
