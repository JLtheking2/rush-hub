import { useRushCardStore } from '@cardEditor/card/store';
import { templates } from '@cardEditor/card/templates';
import AccordionForm from '@components/AccordionForm';
import NumberInput from '@components/inputs/NumberInput';
import TextAreaInput from '@components/inputs/TextAreaInput';
import TextInput from '@components/inputs/TextInput';
import { Box } from '@mui/system';
import { FC } from 'react';
import ImagesForm from '../ImagesForm';
import AttributeSelector from './fields/AttributeSelector';
import DeckToggle from './fields/DeckToggle';
import EffectSymbols from './fields/EffectSymbols';
import SpellTrapIconSelector from './fields/SpellTrapIconSelector';
import StatInput from './fields/StatInput';
import TemplatePicker from './fields/TemplatePicker';
import YugipediaLookup from './fields/YugipediaLookup';

const CardFieldsForm: FC = () => {
  const card = useRushCardStore(state => state.card);
  const setCard = useRushCardStore(state => state.setCard);
  const info = templates[card.template];

  return (
    <>
      <AccordionForm slug="cardForm" header="Card">
        <TextInput
          label="Name"
          slug="cardName"
          value={card.name}
          onChange={name => setCard({ name })}
        />
        <YugipediaLookup />
        <TemplatePicker />
        {info.isMonster && <AttributeSelector />}
        <DeckToggle />
      </AccordionForm>
      <ImagesForm />
      <AccordionForm slug="statsForm" header="Stats">
        {info.hasLevel && (
          <NumberInput
            label={info.levelLabel}
            slug="level"
            min={0}
            max={12}
            value={card.level}
            onChange={level => setCard({ level: level === '' ? 0 : level })}
          />
        )}
        {info.hasAtkDef && (
          <Box display="flex" gap={2}>
            <StatInput
              label="ATK"
              slug="atk"
              value={card.atk}
              onChange={atk => setCard({ atk })}
            />
            <StatInput
              label="DEF"
              slug="def"
              value={card.def}
              onChange={def => setCard({ def })}
              showHelp
            />
          </Box>
        )}
        <TextInput
          label="Type Line"
          slug="typeLine"
          value={card.typeLine}
          onChange={typeLine => setCard({ typeLine })}
        />
        <SpellTrapIconSelector />
      </AccordionForm>
      <AccordionForm slug="textForm" header="Text">
        <TextAreaInput
          label="Effect"
          slug="effect"
          minRows={4}
          helperText="A new line starts a new paragraph"
          value={card.effect}
          onChange={effect => setCard({ effect })}
        />
        <EffectSymbols />
      </AccordionForm>
      <AccordionForm slug="infoForm" header="Info">
        <TextInput
          label="Set Name"
          slug="serial"
          value={card.serial}
          onChange={serial => setCard({ serial })}
        />
        <TextInput
          label="Set ID"
          slug="setId"
          value={card.setId}
          onChange={setId => setCard({ setId })}
        />
      </AccordionForm>
    </>
  );
};

export default CardFieldsForm;
