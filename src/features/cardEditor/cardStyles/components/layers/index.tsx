import { CardImage } from '@cardEditor/card/types';
import {
  attributes,
  bracketIcons,
  rainbowBorder,
  spellTrapAttributeIcons,
  spellTrapIcons,
  starIcons,
  templates,
} from '@cardEditor/card/templates';
import { useRushCardStore } from '@cardEditor/card/store';
import CroppedImg from '@components/CroppedImg';
import useFontsReady from '@hooks/useFontsReady';
import withBasePath from '@utils/withBasePath';
import { FC, useMemo } from 'react';
import * as layout from '../../layout';
import { measureWidth } from '../../utils/measureText';
import CardBox from '../atoms/CardBox';
import DisplayImg from '../atoms/DisplayImg';
import FitText from '../atoms/FitText';

const useTemplate = () =>
  useRushCardStore(state => templates[state.card.template]);

export const ArtLayer: FC = () => {
  const image = useRushCardStore(state => state.card.image);
  if (!image) return null;
  return (
    <CardBox at={layout.art}>
      <ArtImage image={image} />
    </CardBox>
  );
};

const ArtImage: FC<{ image: CardImage }> = ({ image }) =>
  image.crop && image.crop.width > 0 ? (
    <CroppedImg src={image.src} croppedArea={image.crop} />
  ) : (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  );

export const FrameLayer: FC = () => {
  const { frame } = useTemplate();
  return <DisplayImg src={withBasePath(frame)} />;
};

export const AttributeLayer: FC = () => {
  const { spellTrap } = useTemplate();
  const attribute = useRushCardStore(state => state.card.attribute);
  const src = spellTrap
    ? spellTrapAttributeIcons[spellTrap]
    : attributes.find(a => a.id === attribute)?.icon;
  if (!src) return null;
  return (
    <CardBox at={layout.attribute}>
      <DisplayImg src={withBasePath(src)} />
    </CardBox>
  );
};

export const LevelLayer: FC = () => {
  const { hasLevel, star, levelStroke } = useTemplate();
  const level = useRushCardStore(state => state.card.level);
  if (!hasLevel || !star || !levelStroke) return null;
  return (
    <>
      <CardBox at={layout.levelBadge}>
        <DisplayImg src={withBasePath(starIcons[star])} />
      </CardBox>
      <FitText
        mode="line"
        align="center"
        text={String(level)}
        color="#fff"
        stroke={{ width: layout.levelStrokeWidth, color: levelStroke }}
        size={layout.levelNumber.size}
        weight={layout.levelNumber.weight}
        family={layout.levelNumber.family}
        at={layout.levelNumber.at}
        dy={layout.levelNumber.dy}
      />
    </>
  );
};

export const NameLayer: FC = () => {
  const { nameColor } = useTemplate();
  const { name, deck } = useRushCardStore(state => state.card);
  const extra = deck === 'extra';
  return (
    <FitText
      mode="line"
      text={name}
      color={extra ? '#fff' : nameColor}
      stroke={extra ? layout.extraNameStroke : undefined}
      size={layout.name.size}
      family={layout.name.family}
      at={layout.name.at}
      dy={layout.name.dy}
    />
  );
};

const typeFont = { family: layout.monsterTypeLine.family };

export const TypeLineLayer: FC = () => {
  const { spellTrap, nameColor } = useTemplate();
  const white = nameColor === '#fff'; // Xyz: the type line sits on black
  const { typeLine, icon } = useRushCardStore(state => state.card);
  const fontsReady = useFontsReady();
  const spec = spellTrap ? layout.backrowTypeLine : layout.monsterTypeLine;
  const iconSrc = spellTrapIcons.find(i => i.id === icon)?.icon;
  const showIcon = !!spellTrap && !!iconSrc;

  // FitText squashes overlong text into the box, so the closing bracket follows the squashed width
  const textWidth = useMemo(
    () =>
      fontsReady
        ? Math.min(measureWidth(typeLine, typeFont, spec.size), spec.at[2])
        : 0,
    [fontsReady, typeLine, spec.size, spec.at],
  );

  const bracket = spellTrap ? layout.backrowBracket : layout.monsterBracket;
  let closeLeft: number;
  if (!spellTrap) closeLeft = Math.floor(37 + textWidth);
  else closeLeft = textWidth + (showIcon ? layout.backrowIcon.size : 0) + 42;

  return (
    <>
      <CardBox at={[bracket.left, bracket.top, bracket.w, bracket.h]}>
        <DisplayImg
          src={withBasePath(white ? bracketIcons.leftWhite : bracketIcons.left)}
        />
      </CardBox>
      <FitText
        mode="line"
        text={typeLine}
        color={nameColor}
        size={spec.size}
        family={spec.family}
        at={spec.at}
        dy={spec.dy}
      />
      {showIcon && iconSrc && (
        <CardBox
          at={[
            textWidth + 40,
            layout.backrowIcon.top,
            layout.backrowIcon.size,
            layout.backrowIcon.size,
          ]}
        >
          <DisplayImg src={withBasePath(iconSrc)} />
        </CardBox>
      )}
      <CardBox at={[closeLeft, bracket.top, bracket.w, bracket.h]}>
        <DisplayImg
          src={withBasePath(
            white ? bracketIcons.rightWhite : bracketIcons.right,
          )}
        />
      </CardBox>
    </>
  );
};

export const EffectLayer: FC = () => {
  const { effectFont } = useTemplate();
  const effect = useRushCardStore(state => state.card.effect);
  const italic = effectFont === 'stoneSerifItalic';
  return (
    <FitText
      mode="block"
      text={effect}
      size={layout.effect.size}
      at={layout.effect.at}
      dy={italic ? layout.flavorDy : layout.effect.dy}
      family={italic ? layout.flavorFamily : layout.effect.family}
      fontStyle={italic ? 'italic' : 'normal'}
    />
  );
};

export const StatsLayer: FC = () => {
  const { hasAtkDef } = useTemplate();
  const { atk, def } = useRushCardStore(state => state.card);
  if (!hasAtkDef) return null;
  return (
    <>
      {[
        { spec: layout.atk, text: atk },
        { spec: layout.def, text: def },
      ].map(({ spec, text }) => (
        <FitText
          key={spec.at[0]}
          mode="line"
          align="right"
          text={text}
          color="#fff"
          stroke={layout.statStroke}
          size={spec.size}
          weight={spec.weight}
          family={spec.family}
          at={spec.at}
          dy={spec.dy}
        />
      ))}
    </>
  );
};

export const FooterLayer: FC = () => {
  const { serial, setId } = useRushCardStore(state => state.card);
  return (
    <>
      <FitText
        mode="line"
        text={serial}
        color="#fff"
        size={layout.serial.size}
        family={layout.serial.family}
        at={layout.serial.at}
        dy={layout.serial.dy}
      />
      <FitText
        mode="line"
        align="right"
        text={setId}
        color="#fff"
        size={layout.setId.size}
        family={layout.setId.family}
        at={layout.setId.at}
        dy={layout.setId.dy}
      />
    </>
  );
};

/** Drawn over everything: tints the outer edge of the frame */
export const RainbowBorderLayer: FC = () => {
  const deck = useRushCardStore(state => state.card.deck);
  if (deck !== 'extra') return null;
  return <DisplayImg src={withBasePath(rainbowBorder)} />;
};
