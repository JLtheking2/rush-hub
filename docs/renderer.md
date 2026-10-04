# Renderer and geometry

Read this when changing how the card preview / export looks: positions, fonts, per-template styling, or calibrating against a reference render. For how text is fitted into its boxes see [`text-fitting.md`](text-fitting.md).

## Model: DOM + `em`

The card is DOM, not canvas. `CardDisplay` (`src/features/cardEditor/cardStyles/components/CardDisplay/`) measures its own width (`useMeasure`), debounces 250 ms, and stores it as the **ephemeral unit** (`useCardStylesStore.emphemeralUnit` — the misspelling is the store's real name). That becomes the `font-size` of `CardContainer`, and height = width × `cardImgAspect` (614/421). Every child is positioned in `em`, so the card scales with the preview.

- `cardStyles/constants.ts`: `cardImgWidth = 421`, `cardImgHeight = 614`, `baseEmphemeralUnit = 16`.
- `cardStyles/units.ts`: `u(n) = n / 16 em`. A "unit" is one pixel of the native 421 × 614 canvas.
- **Export** (`makeCanvas`, see [`save-load.md`](save-load.md)) clones `#card` at exactly 421 × 614 px with `font-size = 16px`, so layout must depend only on `em`.
- `atoms/CardBox` places a child at `at={[left, top, w, h]}` (421-space units → em).
- **Gotcha:** never put a positioning `em` (left/top/width/height) on an element that also sets its own `font-size` — the `em` then refers to that font size. `FitText` therefore nests a sized inner `div` inside a `CardBox`, and divides stroke widths by the font size for the same reason.
- **Never use `next/image` inside the card** — use `atoms/DisplayImg`; `next/image` breaks PNG export.

## Layers (`components/layers/index.tsx`)

Rendered bottom to top by `CardDisplay`:

`ArtLayer` → `FrameLayer` → `AttributeLayer` → `LevelLayer` → `NameLayer` → `TypeLineLayer` → `EffectLayer` → `StatsLayer` → `FooterLayer` → `RainbowBorderLayer` → `HotspotLayer`

`RainbowBorderLayer` draws only when `card.deck === 'extra'`: a full-card overlay (`foil/rainbow.png`, NCM's Rainbow Rare `cardFoil`, reused as-is) whose outer 12 px band is a pastel vertical rainbow at ~60% alpha, transparent inside. Like NCM, it is drawn last, over everything, with a normal blend.

The **frame is drawn over the art**; the art window is a hole in the frame PNG. With no crop saved, the art uses `object-fit: cover`; with a crop it goes through `CroppedImg`. The attribute icon covers the "MADE BY ALIXSEP" credit circle in the frame's top-right corner — that credit is intentional and must stay visible (see [`decisions.md`](decisions.md)).

## Interactive preview (`layers/HotspotLayer.tsx`)

The preview is linked to the form. `HotspotLayer` draws transparent `CardBox` click targets (each `data-card-ui`) over the card, placed from `layout.ts` rects (text boxes include their `dy`). It is drawn last so the small targets sit above the art target.

- **Text** (name, type line, effect, ATK/DEF, level, set name, set ID): a click puts that region into inline editing (`cardStyles/inlineEditStore.ts`, one `editing: CardField | null`). `FitText` then swaps its text for an `<input>`/`<textarea>` with the same typography (`editing`, `onTextChange`, `onDone`); typing writes straight into the card store, so the form field follows. Enter / blur finishes (effect: Ctrl+Enter), Esc restores the value from when editing began (`layers/useInlineField.ts`). ATK/DEF/Level editors also step with ↑/↓ and the wheel while focused (`useStepper`, sharing `StatInput/step.ts`; Level is ±1, capped at 12).
- **Attribute / Property icon**: scroll to the form field and open its dropdown. **Spell/Trap badge**: scrolls to the template picker. **Art**: scrolls to the Image section; **right-click** clicks `#imgUpload-paste` (the form's clipboard button) synchronously so the clipboard read keeps its user activation.
- `editor/fieldTargets.ts` maps each `CardField` to its accordion and element, and `revealField` expands a collapsed accordion, scrolls, flashes and (optionally) focuses it. Below the `md` breakpoint (card above the form) text clicks edit on the card without scrolling.
- Hotspot hover styles live in `CardDisplay/styles.ts`; `makeCanvas` filters `data-card-ui` nodes out of the PNG export. Editing state is not part of the saved card.

## Geometry (`cardStyles/layout.ts`)

`layout.ts` is **the only file to tune** positions in. Values are `[left, top, width, height]` in 421 × 614 space; `dy` is a vertical nudge converting NCM canvas baselines into DOM line boxes (measured against the reference, see Calibration).

| Element | Box | Font / notes |
|---|---|---|
| Art | 22, 61, 376, 380 | Crop aspect 376:380 (`artAspect`) |
| Attribute | 345, 22, 54, 54 | Monsters: chosen attribute, or Void for `none`. Spell/Trap: forced SPELL/TRAP icon |
| Level badge | 24, 370, 63, 68 | Normal star, or Xyz star. None on Spell/Trap |
| Level number | 32, 392, 45, 32 | Eurostile 28 px bold, centred, white fill, 3 px stroke (`#dc3523` Normal star, `#000` Xyz), `dy` 5 |
| Name | 28, 4, 310, 48 | Matrix Regular Small Caps 46 px, one line, squashed, `dy` 9. White on Xyz. Extra deck: white with a 3 px black stroke (`extraNameStroke`) on every template |
| Type line (monster) | 36, 443, 350, 30 | Stone Serif Small Caps 16 px, `dy` 0.5 |
| Type line (Spell/Trap) | 38, 443, 330, 20 | Same font, `dy` 0.5 |
| Brackets | left 30, top 445.5, 5 × 15 | Closing `]` placed from the measured text width |
| Spell/Trap icon | top 443, 20 × 20 | After the text, inside the brackets |
| Effect | 30, 466, 360, 103 | Matrix Book 18 px, justified, shrinks to fit, `dy` 1. Normal template: Amiri italic, `dy` 5 |
| ATK / DEF | 146, 411, 75, 30 / 276, 411, 75, 30 | Eurostile 19.25 px bold, right-aligned, white, 3 px black stroke, `dy` 4.5 |
| Serial | 23, 577, 133, 16 | Stone Serif 12 px, white, `dy` 2 |
| Set ID | 264, 576, 131, 16 | Stone Serif 12 px, white, right-aligned, `dy` 2 |

Rush cards have no copyright line, no rarity and no art foil; the only foil-like treatment is the Extra deck's rainbow border.

### Type-line brackets

`TypeLineLayer` measures the text width (`measureWidth`, clamped to the box width so `]` follows *squashed* text) and derives:

- Monster: `]` at `floor(37 + textWidth)`.
- Spell/Trap: icon at `textWidth + 40`; `]` at `textWidth + (icon ? 20 : 0) + 42`.
- **Xyz uses white brackets and a white type line** (it sits on the black strip); every other template black.

## Per-template flags (`card/templates.ts`)

`templates` is a plain lookup table (nine templates × one style — not a merge tree). Each `TemplateInfo` carries: `frame`, `swatch` (picker chip colour, sampled from the frame at 200,56), `isMonster`, `hasLevel`, `hasAtkDef`, `star` (`normal` | `xyz` | null), `levelStroke`, `levelLabel` (`Level`, or `Rank` for Xyz), `nameColor` (white on Xyz), `effectFont` (`stoneSerifItalic` for Normal), `spellTrap` (forces the SPELL/TRAP attribute icon) and `defaults`. **The form and the renderer both read these flags** — add a template by adding a row plus a frame PNG in `public/assets/rush/frames/`. Spell/Trap property icons: Continuous fits both; Counter is Trap-only; Equip / Field / Quick-Play / Ritual are Spell-only (`isIconValidFor`).

## Assets (`public/assets/rush/`)

`frames/<template>.png` (421 × 614), `attributes/{Dark,Divine,Earth,Fire,Light,Water,Wind,Void,Spell,Trap}.png`, `stars/{normal,xyz}.png`, `icons/{Continuous,Counter,Equip,Field,Quick-play,Ritual}.png` + the four bracket PNGs, `foil/rainbow.png` (421 × 614 Extra-deck border overlay, from NCM). Frames are AlixSep's Rush frames used as-is. Every URL goes through `withBasePath`.

## Fonts (`src/utils/fonts.ts`)

`Font` enum + `fonts: FontFace[]` are emitted as `@font-face` (`fontFaces`, via `_document.page.tsx`); `fontStacks` gives the `font-family` per role, each with a Google fallback:

| Role | Family | File in `public/fonts/` | Fallback |
|---|---|---|---|
| Name | Matrix Regular Small Caps | `MatrixRegularSmallCaps.ttf` | Spectral SC |
| Effect | Matrix Book | `MatrixBook.ttf` | Spectral |
| Type line | Stone Serif Small Caps | `StoneSerifSmallCapsBold.ttf` | Spectral SC |
| Set ID, serial | Stone Serif | `StoneSerif.otf` | Amiri |
| Normal flavour | Amiri Italic | `AmiriItalic.ttf` (OFL) | Amiri |
| ATK/DEF, level | Eurostile Candy (400 + 700) | `EurostileCandy{Regular,Bold}.ttf` | Crimson Text |

The reference site asks for "Stone Serif Italic", which it doesn't ship, so it really renders Amiri italic — hence the self-hosted `AmiriItalic.ttf`. It is self-hosted (not Google) because a cross-origin stylesheet **cannot be embedded by `html-to-image`**, so the export silently fell back to a generic serif. The commercial fonts are shipped deliberately; see [`decisions.md`](decisions.md).

## Calibration

Positions were measured against renders of the Neo New Card Maker (NCM, ygopro.org) reference — geometry is ours, code is not copied. Reference material is **not in the repo**; it lives in `C:\Users\jlthe\Desktop\yugioh-rush-port\` (`reference-renders/*.rush.png` at 421 × 614, `tools/capture-refs.js` to regenerate them from the live site — it drives the form with Playwright and takes optional template names).

`npm run compare:ref -- <referenceDir> [--url ..] [--out <dir>] [--only Normal,Xyz]` (dev server running) builds the nine sample cards from `scripts/sampleCards.js` (`referenceSamples()`, Set ID `RD/ABC-EN001`), exports each, and reports the percentage of differing pixels plus a 50 % overlay. Current numbers: Normal 1.19, Effect 1.40, Ritual 1.42, Fusion 1.46, Synchro 1.70, Xyz 1.48, Token 0.65, Spell 0.64, Trap 1.13 %.

**Deliberate departures from the reference:** NCM centres the type line and ATK/DEF on its own label boxes, which sit slightly off the frame's real features. We centre the type line in the frame's type strip (rows 441–465; text centre ≈ 452.5, brackets 445.5–460.5) and the ATK/DEF digits in the grey bar (rows 410–439). This is why the monster diffs are ~0.5 % higher than a pixel-perfect match — the remaining difference is those two strips. Don't "fix" it back without checking zoomed crops.

Measured DOM-vs-canvas `dy` offsets are already baked into `layout.ts`; re-measure only if a font file changes.

## Verifying visually

`npm run verify -- creator --wait "text=Save As" --screenshot <winpath>` with the dev server running; the card preview appears ~1 s after `Save As` (the height starts at 0 and fills after the debounce). Anchor on the `Save As` button's bounding box to clip the card. Always look at the screenshot before interpreting DOM values.
