import { FC } from 'react';
import CardOptionsForm from '@cardEditor/editor/CardOptionsForm';
import CardDisplay from '@cardEditor/cardStyles/components/CardDisplay';
import { SEO } from '@layout';
import CardDownloader from '@cardEditor/editor/CardDownloader';
import { siteDescription } from 'src/constants';
import SetCardLoader from './atoms/SetCardLoader';
import { CardWrapper, Wrapper } from './styles';

const Creator: FC = () => (
  <>
    <SEO title="Creator" description={siteDescription} />
    <SetCardLoader />
    <Wrapper>
      <CardOptionsForm />
      <CardWrapper>
        <CardDisplay />
        <CardDownloader />
      </CardWrapper>
    </Wrapper>
  </>
);

export default Creator;
