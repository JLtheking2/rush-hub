import { FC, useEffect } from 'react';
import CardOptionsForm from '@cardEditor/editor/CardOptionsForm';
import CardDisplay from '@cardEditor/cardStyles/components/CardDisplay';
import { cardId } from '@cardEditor/cardStyles/constants';
import ImportExport from '@cardEditor/editor/ImportExport';
import { makeCanvas } from '@cardEditor/editor/CardDownloader/utils';
import { TempDiv } from '@cardEditor/editor/CardDownloader/styles';
import { SEO } from '@layout';
import { siteDescription } from 'src/constants';
import { CardWrapper, Wrapper } from './styles';

declare global {
  interface Window {
    rushhubExportPng?: () => Promise<string | undefined>;
  }
}

const Creator: FC = () => {
  // Hook for headless scripts (render:cards, compare:ref): the PNG data URL of
  // the current card, produced by the same pipeline as Save.
  useEffect(() => {
    window.rushhubExportPng = async () =>
      (await makeCanvas(cardId))?.toDataURL('image/png', 1);
    return () => {
      delete window.rushhubExportPng;
    };
  }, []);

  return (
    <>
      <SEO title="Creator" description={siteDescription} />
      <Wrapper>
        <CardOptionsForm />
        <CardWrapper>
          <CardDisplay />
          <TempDiv id="temp" />
          <ImportExport />
        </CardWrapper>
      </Wrapper>
    </>
  );
};

export default Creator;
