import { useIsCardDirty, useRushCardStore } from '@cardEditor/card';
import { FC, useCallback, useEffect, useState } from 'react';
import {
  FolderCard,
  getParentDirectoryHandle,
  listFolderCards,
} from '../../utils';
import CardNav from '../CardNav';
import UnsavedChangesDialog from '../UnsavedChangesDialog';

interface Props {
  fileHandle: FileSystemFileHandle;
  directoryHandle: FileSystemDirectoryHandle;
  setFileHandle: (h: FileSystemFileHandle | null) => void;
}

interface FolderPosition {
  cards: FolderCard[];
  index: number;
}

const findPosition = async (
  directoryHandle: FileSystemDirectoryHandle,
  fileHandle: FileSystemFileHandle,
): Promise<FolderPosition | null> => {
  const parent = await getParentDirectoryHandle(directoryHandle, fileHandle);
  const cards = await listFolderCards(parent);
  const matches = await Promise.all(
    cards.map(c => c.handle.isSameEntry(fileHandle)),
  );
  const index = matches.indexOf(true);
  return index === -1 ? null : { cards, index };
};

/**
 * Previous / next through the card .json files in the folder the open card
 * was loaded from (or saved to), ordered by Set ID. The folder is re-read on
 * every step so cards saved in the meantime are picked up.
 */
const LocalCardNav: FC<Props> = ({
  fileHandle,
  directoryHandle,
  setFileHandle,
}) => {
  const card = useRushCardStore(state => state.card);
  const applyCardJson = useRushCardStore(state => state.applyCardJson);
  const isDirty = useIsCardDirty();
  const [position, setPosition] = useState<FolderPosition | null>(null);
  const [pendingStep, setPendingStep] = useState<-1 | 1 | null>(null);

  useEffect(() => {
    let cancelled = false;
    findPosition(directoryHandle, fileHandle)
      .then(result => {
        if (!cancelled) setPosition(result);
      })
      .catch(() => {
        if (!cancelled) setPosition(null);
      });
    return () => {
      cancelled = true;
    };
  }, [directoryHandle, fileHandle]);

  const step = useCallback(
    async (delta: -1 | 1) => {
      try {
        const fresh = await findPosition(directoryHandle, fileHandle);
        setPosition(fresh);
        const target = fresh?.cards[fresh.index + delta];
        if (!target) return;
        // Re-read: the listing may be a moment old
        const text = await (await target.handle.getFile()).text();
        if (applyCardJson(text).ok) setFileHandle(target.handle);
      } catch (e) {
        console.warn('Failed to step to the neighbouring card:', e);
      }
    },
    [directoryHandle, fileHandle, applyCardJson, setFileHandle],
  );

  const requestStep = useCallback(
    (delta: -1 | 1) => {
      if (isDirty) setPendingStep(delta);
      else step(delta);
    },
    [isDirty, step],
  );

  if (!position) return null;

  return (
    <>
      <CardNav
        label={[card.setId, card.name].filter(Boolean).join(' · ')}
        position={`${position.index + 1} / ${position.cards.length}`}
        hasPrevious={position.index > 0}
        hasNext={position.index < position.cards.length - 1}
        onPrevious={() => requestStep(-1)}
        onNext={() => requestStep(1)}
      />
      <UnsavedChangesDialog
        open={pendingStep !== null}
        actionLabel="LOAD"
        onConfirm={() => {
          if (pendingStep !== null) step(pendingStep);
          setPendingStep(null);
        }}
        onCancel={() => setPendingStep(null)}
      />
    </>
  );
};

export default LocalCardNav;
