import { Share as ShareIcon } from '@mui/icons-material';
import { FC, useCallback, useState } from 'react';
import useIsMobile from '@hooks/useIsMobile';
import { useRushCardStore } from '@cardEditor/card';
import { makeCanvas } from '../../utils';
import LoadingButton from '../../atoms/LoadingButton';
import { ShareButtonProps } from './types';

const ShareButton: FC<ShareButtonProps> = ({ cardId, ...props }) => {
  const { isMobile } = useIsMobile();
  const name = useRushCardStore(state => state.card.name);
  const [isLoading, setLoading] = useState<boolean>(false);

  const handleShare = useCallback(async () => {
    setLoading(true);
    try {
      const canvas = await makeCanvas(cardId);
      if (!canvas) return;

      canvas.toBlob(blob => {
        if (!blob) return;
        const file = new File([blob], `${name || 'Rush Hub'}.png`, {
          type: 'image/png',
        });

        const shareData: ShareData = {
          title: 'Rush Hub',
          files: [file],
          text: `Check out this custom ${
            name ? `'${name}'` : 'Rush Duel'
          } card that I made!`,
        };
        if (!navigator.share) return;
        if (!!navigator.canShare && !navigator.canShare(shareData)) return;
        navigator.share(shareData).catch(e => {
          console.error(e, shareData);
        });
      });
    } finally {
      setLoading(false);
    }
  }, [cardId, name, setLoading]);

  if (
    !isMobile ||
    typeof navigator === 'undefined' ||
    (typeof navigator !== 'undefined' && !navigator.share)
  )
    return null;

  return (
    <LoadingButton
      {...props}
      fullWidth
      variant="contained"
      onClick={handleShare}
      isLoading={isLoading}
      startIcon={<ShareIcon />}
    >
      Share
    </LoadingButton>
  );
};

export default ShareButton;
