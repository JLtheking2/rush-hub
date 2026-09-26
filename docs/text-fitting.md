# Text fitting

Read this when text on the card overflows, looks squashed, or differs between preview and export. Code: `cardStyles/components/atoms/FitText`, `cardStyles/utils/measureText.ts`, `src/hooks/useFontsReady.ts`.

## Two modes

`FitText` takes a `mode`:

- **`line`** (name, type line, level, ATK/DEF, serial, Set ID): one line (`white-space: nowrap`). If the natural width exceeds the box, the inner `span` gets `transform: scaleX(width / natural)` — **capped at 1**, so short text is never stretched. `transform-origin` matches the alignment (`left`/`center`/`right` `center`) so the squashed text stays anchored.
- **`block`** (effect text): wrapped, `text-align: justify` with `text-align-last: left` (so every paragraph's last line stays left-aligned, like the reference), `white-space: pre-line` (so `\n` in the card data is a paragraph break). The font shrinks from its max size in **0.25-unit steps** (minimum 6) until the text fits the box height.

Effect text is rendered exactly as typed — no auto-bolding of `[REQUIREMENT]` / `[EFFECT]`.

## Fit in a hidden measurer, not on screen

All measuring happens at **native scale** (16 px font → 1 unit = 1 px) in one hidden, off-screen `div` (`measureText.ts`: `measureWidth` for lines, `fitsHeight` for blocks). Consequences:

- The fit does not depend on the preview's width, so the preview and the 421 × 614 export use **identical** fitted sizes and scales. The export clone just inherits the styles; nothing re-fits on the clone.
- `FitText` stores `{ size, scale }` in state, set from a `useIsomorphicLayoutEffect` (from `react-use`; plain `useLayoutEffect` warns during SSR). Its deps include the text, size, family, weight, style, mode and box size.
- The type-line brackets reuse `measureWidth` to place the closing `]` (see [`renderer.md`](renderer.md)).

## Waiting for fonts

Measuring with a fallback font gives wrong sizes, so `FitText` does nothing until `useFontsReady()` is true, then re-runs.

- `useFontsReady` requests **every registered face explicitly** (`document.fonts.load(spec)` per entry in `fontLoadSpecs`, derived from `fonts.ts`), then awaits `document.fonts.ready`. `fonts.ready` alone can resolve *before* a lazily-loaded face has started loading.
- The promise is module-level (one load shared by all instances).
- `makeCanvas` also awaits `document.fonts.ready` before cloning, so export never snapshots fallback glyphs.
- If you add a font, add it to the `fonts` array in `src/utils/fonts.ts` — that feeds both `@font-face` and `fontLoadSpecs`.

## Stroked numerals

Level, ATK and DEF use `-webkit-text-stroke` with `paint-order: stroke fill`. The stroke width is written in `em` **relative to the element's own fitted font size** (`stroke.width / fit.size`). `html-to-image` renders this correctly in the exported PNG (checked).

## Tuning

- Max sizes and `dy` nudges live in `cardStyles/layout.ts`, not in `FitText`.
- Text sits slightly high/low relative to the reference because canvas `top` is the top of the first line box while DOM uses line-height 1; `dy` corrects for it per element.
- Long inputs to check after any change: a very long name (must squash, not wrap), a very long effect (must shrink, not overflow), `?` and 5-digit ATK/DEF.
