import { useRushCardStore } from '@cardEditor/card/store';
import { templates } from '@cardEditor/card/templates';
import AccordionForm from '@components/AccordionForm';
import NumberInput from '@components/inputs/NumberInput';
import TextAreaInput from '@components/inputs/TextAreaInput';
import TextInput from '@components/inputs/TextInput';
import { Casino as RandomIcon } from '@mui/icons-material';
import { IconButton, InputAdornment } from '@mui/material';
import { Box } from '@mui/system';
import { FC } from 'react';
import AttributeSelector from './fields/AttributeSelector';
import SpellTrapIconSelector from './fields/SpellTrapIconSelector';
import TemplatePicker from './fields/TemplatePicker';

const randomSerial = () =>
  Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');

const CardFieldsForm: FC = () => {
  const card = useRushCardStore(state => state.card);
  const setCard = useRushCardStore(state => state.setCard);
  const info = templates[card.template];

  return (
    <>
      <AccordionForm slug="cardForm" header="Card">
        <TemplatePicker />
        <TextInput
          label="Name"
          slug="cardName"
          value={card.name}
          onChange={name => setCard({ name })}
        />
        {info.isMonster && <AttributeSelector />}
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
      </AccordionForm>
      <AccordionForm slug="infoForm" header="Stats & Info">
        {info.hasAtkDef && (
          <Box display="flex" gap={2}>
            <TextInput
              label="ATK"
              slug="atk"
              value={card.atk}
              onChange={atk => setCard({ atk })}
            />
            <TextInput
              label="DEF"
              slug="def"
              value={card.def}
              onChange={def => setCard({ def })}
            />
          </Box>
        )}
        <TextInput
          label="Set ID"
          slug="setId"
          value={card.setId}
          onChange={setId => setCard({ setId })}
        />
        <TextInput
          label="Serial"
          slug="serial"
          value={card.serial}
          onChange={serial => setCard({ serial })}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                aria-label="Randomise serial"
                onClick={() => setCard({ serial: randomSerial() })}
                edge="end"
              >
                <RandomIcon />
              </IconButton>
            </InputAdornment>
          }
        />
      </AccordionForm>
    </>
  );
};

export default CardFieldsForm;
