import {
  cardId,
  cardImgAspect,
  useCardStylesStore,
} from '@cardEditor/cardStyles';
import { FC, memo, useState } from 'react';
import { useDebounce, useMeasure } from 'react-use';
import shallow from 'zustand/shallow';
import { CardContainer, CardContent } from './styles';

const CardDisplay: FC = () => {
  const { emphemeralUnit, setEmphemeralUnit } = useCardStylesStore(
    store => ({
      emphemeralUnit: store.emphemeralUnit,
      setEmphemeralUnit: store.setEmphemeralUnit,
    }),
    shallow,
  );
  const [squareRef, { width }] = useMeasure<HTMLDivElement>();
  const [height, setHeight] = useState<number>(0);

  useDebounce(
    () => {
      setEmphemeralUnit(width);
      setHeight(width * cardImgAspect);
    },
    250,
    [width],
  );

  return (
    <CardContainer
      id={cardId}
      $fontSize={emphemeralUnit}
      $height={height}
      ref={squareRef}
    >
      {/* Phase 4 renders the Rush layers here */}
      <CardContent />
    </CardContainer>
  );
};

export default memo(CardDisplay);
