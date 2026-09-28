import { useRushCardStore } from '@cardEditor/card/store';
import { Deck } from '@cardEditor/card/types';
import Label from '@components/inputs/Label';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { FC, MouseEvent, useCallback } from 'react';

const DeckToggle: FC = () => {
  const deck = useRushCardStore(state => state.card.deck);
  const setCard = useRushCardStore(state => state.setCard);

  // null = the selected button was clicked again; keep one side selected
  const handleChange = useCallback(
    (_: MouseEvent<HTMLElement>, next: Deck | null) => {
      if (next) setCard({ deck: next });
    },
    [setCard],
  );

  return (
    <div>
      <Label slug="deck">Deck</Label>
      <ToggleButtonGroup
        id="deck-input"
        aria-label="Deck"
        value={deck}
        exclusive
        fullWidth
        size="small"
        onChange={handleChange}
      >
        <ToggleButton value="main" sx={{ textTransform: 'none' }}>
          Main
        </ToggleButton>
        <ToggleButton value="extra" sx={{ textTransform: 'none' }}>
          Extra
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
};

export default DeckToggle;
