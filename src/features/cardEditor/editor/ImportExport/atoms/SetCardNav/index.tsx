import { FC, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Routes from '@routes';
import firstQueryValue from '@utils/firstQueryValue';
import sets from '@utils/sets';
import CardNav from '../CardNav';

/**
 * Previous / next through a published set while the creator is open as
 * `?set=<SetId>&card=<slug>` (the Set Browser's "Edit in Creator" link).
 * Only changes the query — SetCardLoader does the loading and the
 * unsaved-changes guard.
 */
const SetCardNav: FC = () => {
  const router = useRouter();
  const setId = firstQueryValue(router.query.set);
  const cardSlug = firstQueryValue(router.query.card);

  // setsData is already in set-number order; skip cards that can't be loaded
  const cards = useMemo(
    () => sets.find(set => set.id === setId)?.cards.filter(c => !!c.json) ?? [],
    [setId],
  );
  const index = cards.findIndex(c => c.id === cardSlug);

  const goTo = useCallback(
    (target: number) => {
      const card = cards[target];
      if (!setId || !card) return;
      router.push(
        { pathname: Routes.Creator, query: { set: setId, card: card.id } },
        undefined,
        { shallow: true },
      );
    },
    [cards, router, setId],
  );

  if (index === -1) return null;
  const current = cards[index];

  return (
    <CardNav
      label={`${current.number} · ${current.name}`}
      position={`${setId} · ${index + 1} / ${cards.length}`}
      hasPrevious={index > 0}
      hasNext={index < cards.length - 1}
      onPrevious={() => goTo(index - 1)}
      onNext={() => goTo(index + 1)}
    />
  );
};

export default SetCardNav;
