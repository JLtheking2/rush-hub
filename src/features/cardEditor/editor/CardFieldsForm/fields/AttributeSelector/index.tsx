import { attributes } from '@cardEditor/card/templates';
import { Attribute } from '@cardEditor/card/types';
import { useRushCardStore } from '@cardEditor/card/store';
import ControlledSelector from '@components/inputs/ControlledSelector';
import { SelectorListItemIcon } from '@components/SelectorListItemIcon';
import { SelectorMenuItem } from '@components/SelectorMenuItem';
import { ListItemText, SelectChangeEvent } from '@mui/material';
import withBasePath from '@utils/withBasePath';
import { FC, useCallback } from 'react';

const AttributeSelector: FC = () => {
  const attribute = useRushCardStore(state => state.card.attribute);
  const setCard = useRushCardStore(state => state.setCard);

  const handleChange = useCallback(
    (event: SelectChangeEvent) =>
      setCard({ attribute: event.target.value as Attribute }),
    [setCard],
  );

  return (
    <ControlledSelector
      value={attribute}
      displayName="Attribute"
      slug="attribute"
      onChange={handleChange}
    >
      {attributes.map(a => (
        <SelectorMenuItem value={a.id} key={a.id}>
          <SelectorListItemIcon>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={withBasePath(a.icon)} width={26} height={26} alt="" />
          </SelectorListItemIcon>
          <ListItemText primary={a.label} />
        </SelectorMenuItem>
      ))}
    </ControlledSelector>
  );
};

export default AttributeSelector;
