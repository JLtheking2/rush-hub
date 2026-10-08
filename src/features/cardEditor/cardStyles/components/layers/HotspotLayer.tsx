import { useRushCardStore } from '@cardEditor/card/store';
import { templates } from '@cardEditor/card/templates';
import { parseStatPair } from '@cardEditor/editor/CardFieldsForm/fields/StatInput/step';
import { revealField } from '@cardEditor/editor/fieldTargets';
import { useMediaQuery, useTheme } from '@mui/material';
import { FC } from 'react';
import { CardField, useInlineEditStore } from '../../inlineEditStore';
import * as layout from '../../layout';
import CardBox from '../atoms/CardBox';
import { useTypeLineGeometry } from '.';

/** Text regions edited on the card itself */
const textFields: ReadonlySet<CardField> = new Set<CardField>([
  'name',
  'level',
  'atk',
  'def',
  'typeLine',
  'effect',
  'serial',
  'setId',
]);

/** FitText offsets its box by `dy`; hotspots must sit on the drawn text */
const textRect = (spec: layout.TextSpec, height?: number): layout.Rect => [
  spec.at[0],
  spec.at[1] + (spec.dy ?? 0),
  spec.at[2],
  height ?? spec.at[3],
];

interface HotspotProps {
  field: CardField;
  at: layout.Rect;
  label: string;
}

const Hotspot: FC<HotspotProps> = ({ field, at, label }) => {
  const theme = useTheme();
  // Below md the card sits above the form: scrolling would hide the card
  const wide = useMediaQuery(theme.breakpoints.up('md'));
  const editing = useInlineEditStore(state => state.editing === field);
  if (editing) return null;

  const isText = textFields.has(field);
  const onClick = () => {
    if (isText) {
      useInlineEditStore.getState().start(field);
      if (wide) revealField(field, { focus: false });
    } else {
      revealField(field, { focus: true });
    }
  };

  const onContextMenu =
    field === 'art'
      ? (e: { preventDefault: () => void }) => {
          e.preventDefault();
          // Same button as the form's; clicked synchronously to keep the
          // right-click's user activation for the clipboard read
          document.querySelector<HTMLElement>('#imgUpload-paste')?.click();
          revealField('art', { focus: false });
        }
      : field === 'atk' || field === 'def'
      ? async (e: { preventDefault: () => void }) => {
          e.preventDefault();
          try {
            const pair = parseStatPair(await navigator.clipboard.readText());
            if (!pair) return;
            // A lone value only sets the clicked field
            useRushCardStore
              .getState()
              .setCard(pair.def === undefined ? { [field]: pair.atk } : pair);
          } catch {
            // clipboard unavailable or permission denied
          }
        }
      : undefined;

  return (
    <CardBox
      at={at}
      data-card-ui=""
      data-cursor={isText ? 'text' : 'pointer'}
      title={label}
      onClick={onClick}
      onContextMenu={onContextMenu}
    />
  );
};

/**
 * Transparent click targets over the card that link to the form. Drawn last
 * (later = on top), and excluded from PNG export via `data-card-ui`.
 */
export const HotspotLayer: FC = () => {
  const { isMonster, hasLevel, hasAtkDef, spellTrap } = useRushCardStore(
    state => templates[state.card.template],
  );
  const { spec, showIcon, textWidth } = useTypeLineGeometry();
  const typeLineRect = textRect(spec, 22);

  return (
    <>
      <Hotspot
        field="art"
        at={layout.art}
        label="Click: edit image · Right-click: paste image"
      />
      {isMonster && (
        <Hotspot field="attribute" at={layout.attribute} label="Attribute" />
      )}
      {spellTrap && (
        <Hotspot field="template" at={layout.attribute} label="Template" />
      )}
      {hasLevel && (
        <Hotspot field="level" at={layout.levelBadge} label="Level" />
      )}
      <Hotspot field="name" at={textRect(layout.name)} label="Name" />
      <Hotspot field="typeLine" at={typeLineRect} label="Type line" />
      {hasAtkDef && (
        <>
          <Hotspot
            field="atk"
            at={textRect(layout.atk)}
            label="ATK · Click: edit · Right-click: paste ATK/DEF"
          />
          <Hotspot
            field="def"
            at={textRect(layout.def)}
            label="DEF · Click: edit · Right-click: paste ATK/DEF"
          />
        </>
      )}
      <Hotspot field="effect" at={textRect(layout.effect)} label="Effect" />
      <Hotspot field="serial" at={textRect(layout.serial)} label="Set name" />
      <Hotspot field="setId" at={textRect(layout.setId)} label="Set ID" />
      {spellTrap && showIcon && (
        <Hotspot
          field="stIcon"
          at={[
            textWidth + 40,
            layout.backrowIcon.top,
            layout.backrowIcon.size,
            layout.backrowIcon.size,
          ]}
          label="Property icon"
        />
      )}
    </>
  );
};
