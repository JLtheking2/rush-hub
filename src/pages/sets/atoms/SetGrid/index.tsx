import { FC } from 'react';
import { Typography } from '@mui/material';
import { CardSet } from '@utils/setsData';
import { CoverImage, GridButton, SetGridWrapper } from '../../styles';

interface Props {
  sets: CardSet[];
  onSelect: (setId: string) => void;
}

const SetGrid: FC<Props> = ({ sets, onSelect }) => (
  <SetGridWrapper>
    {sets.map(set => (
      <li key={set.id}>
        <GridButton type="button" onClick={() => onSelect(set.id)}>
          {!!set.cover && <CoverImage src={set.cover} alt="" loading="lazy" />}
          <div>
            <Typography variant="h4" component="span" display="block">
              {set.displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {set.cards.length} cards
            </Typography>
          </div>
        </GridButton>
      </li>
    ))}
  </SetGridWrapper>
);

export default SetGrid;
