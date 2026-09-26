import { FC } from 'react';
import { Typography } from '@mui/material';
import { SetCard } from '@utils/setsData';
import { CardGridWrapper, GridButton, Thumbnail } from '../../styles';

interface Props {
  cards: SetCard[];
  onSelect: (index: number) => void;
}

const CardGrid: FC<Props> = ({ cards, onSelect }) => (
  <CardGridWrapper>
    {cards.map((card, index) => (
      <li key={card.id}>
        <GridButton type="button" onClick={() => onSelect(index)}>
          <Thumbnail src={card.thumb} alt={card.name} loading="lazy" />
          <Typography variant="caption" textAlign="center">
            {card.number} · {card.name}
          </Typography>
        </GridButton>
      </li>
    ))}
  </CardGridWrapper>
);

export default CardGrid;
