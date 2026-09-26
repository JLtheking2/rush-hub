# Card model, save/load and export

Read this when working on the `RushCard` schema, validation, the Save/Load/Save-As/New buttons, PNG export, or batch rendering.

## The card (`src/features/cardEditor/card/`)

`RushCard` (`types.ts`), **schema version 1**:

```ts
{
  schemaVersion: 1;
  template: 'normal'|'effect'|'ritual'|'fusion'|'synchro'|'xyz'|'token'|'spell'|'trap';
  name: string;
  attribute: 'dark'|'divine'|'earth'|'fire'|'light'|'water'|'wind'|'none'; // monsters only
  level: number;            // 0–12; Xyz shows it as "Rank"
  typeLine: string;         // free text, e.g. "Dragon/Effect"
  icon: 'none'|'continuous'|'counter'|'equip'|'field'|'quickPlay'|'ritual'; // Spell/Trap only
  effect: string;           // "\n" = paragraph break
  atk: string; def: string; // strings so "?" works
  setId: string; serial: string;
  image: { src: string; crop?: { x, y, width, height } } | null;
}
```

`image.src` is a **base64 data URL** (≈ 2 MB per card JSON). That is why staged set copies under `cards/sets/` are gitignored (see [`set-browser.md`](set-browser.md)).

State is one Zustand store, `useRushCardStore` (`store.ts`): `card`, `savedJson` (serialisation at last load/save, for the dirty check), `setCard`, `setTemplate`, `markSaved`, `resetCard(keep?)`, `applyCardJson(text)`. `useIsCardDirty()` compares `serializeCard(card)` to `savedJson`. `serializeCard` is `JSON.stringify(card, null, 2)`; key order comes from `getDefaultCard`, so it is stable — files written by scripts must use the same key order (`scripts/sampleCards.js` does).

### Defaults and switching template (`defaults.ts`)

`getDefaultCard(template)` builds a card in canonical key order from `templates[t].defaults`. Default template is `effect`. `switchTemplate(card, next)` keeps name, effect, Set ID, serial and art always; attribute / level / ATK / DEF only monster → monster (reset when entering or leaving Spell/Trap); the type line only if the user edited it (otherwise it follows the new template's auto type line, `getAutoTypeLine`: `Spell` / `Trap`, plus ` / <icon name>` when a property icon is set, e.g. `Trap / Continuous`; changing the icon updates an unedited type line the same way); the Spell/Trap icon only if valid for the new template. `setTemplate` doesn't touch `savedJson`, so a switch counts as an unsaved edit.

### Validation (`validate.ts`)

`parseRushCard(text)` → `{ ok: true, card } | { ok: false, error }`. It rejects: non-JSON ("The file isn't valid JSON."), non-objects and a missing `schemaVersion` ("This isn't a rush-hub card." — pokeoh-hub JSON lands here), other versions, unknown/missing `template`, and wrong-typed fields (naming the field, e.g. `Invalid "level": expected a whole number from 0 to 12.`). Missing fields take the template's defaults; unknown keys are dropped. There is **no migration** from pokeoh-hub JSON. `applyCardJson` returns `{ ok: true } | { ok: false; error }` and leaves the card untouched on failure; `ImportButton` and `SetCardLoader` show the error in a "Card not loaded" dialog.

## Yugipedia autofill (`editor/CardFieldsForm/fields/YugipediaLookup/`)

The Autofill button fetches the card's **main (Master Rules) page** wikitext (never the `(Rush Duel)` page — user decision) via `utils/fetchYugipediaWikitext.ts`, and `card/fromYugipedia.ts` (`parseYugipediaCard`) maps `CardTable2` params onto template, attribute, level/rank, ATK/DEF, type line, Spell/Trap icon and effect. Name, set info and art are left alone. It runs in the browser: never add MediaWiki's `origin=*` (duplicate CORS header). Yugipedia intermittently returns `internal_api_error_*`; the fetch retries those up to 4 times. Master Rules text isn't converted to the Rush `[REQUIREMENT]/[EFFECT]` format.

## Save / Load (`editor/ImportExport/`)

Buttons: Load Directory, Load, Save, Save As, New. Uses the **File System Access API** (Chromium):

- **Working directory** (`showDirectoryPicker`, read/write) is required first; Load/Save ask for it if missing. Picked files must be inside it, otherwise `OutsideWorkingDirectoryDialog` offers to change directory or retry.
- A card is a **pair** `<name>.png` + `<name>.json` written side by side. The JSON is authoritative and re-loadable; the PNG is a render of it. Loading a `.png` finds its sibling `.json` case-insensitively (`findSiblingFileHandle`); none → `MissingJsonPairDialog`.
- `writeCardPng` never throws (a timeout or declined permission must not block the JSON write); `writeCardJson` deliberately does.
- Browsers without the API fall back to a hidden `<input type="file">` for Load. (Note the creator page has **two** file inputs: this fallback, and `#imgUpload-input` for art — target by id in scripts.)
- Load/New with unsaved changes opens `UnsavedChangesDialog`.
- Suggested filenames: `getSuggestedCardFileName(name, setId, ext)` → `<Set ID> - <Name>.<ext>`, illegal characters (`\ / : * ? " < > |`, so `RD/SMP-EN001` → `RD-SMP-EN001`) turned into `-`; fallback `Rush Hub`.
- `Save` with no file handle behaves like Save As. Cards opened via `?set=&card=` have no handle, so the first Save is a Save As — the user edits a copy, never the served asset.

`CardOptionsForm` holds the `fileHandle` / `directoryHandle` state and passes it to `ImportExport`.

## PNG export (`editor/CardDownloader/utils.ts`)

`makeCanvas(cardId, w = 421, h = 614)`: awaits `document.fonts.ready`, clones `#card` into the hidden `#temp` div, forces width/height and `font-size = baseEmphemeralUnit`, calls `html-to-image`'s `toCanvas` with a transparent background, and removes the clone in `finally`. Two safety nets: broken images are replaced by a 1×1 transparent PNG (otherwise `html-to-image` hangs on an empty `src`), and a 15 s timeout rejects a stalled export. **The exported PNG has a transparent art window** when no art is set. Export is always native 421 × 614 — no other resolutions. Save filename is `<Set ID> - <Name>.png`.

## Batch rendering (`npm run render:cards`)

`npm run render:cards -- <folder-or-json...> [--url http://localhost:3000] [--dry-run] [--timeout ms] [--headed]` (dev server running) loads each card JSON into the creator in headless Chromium and rewrites the `.png` next to it. It races "preview shows the name + Set ID" against the "Card not loaded" dialog, so an invalid or foreign JSON **fails in ~4 s** with the dialog's text instead of hanging; each output's PNG header is read and must be **exactly 421 × 614** or the run fails. Rendering calls `window.rushhubExportPng()` (set by the creator page, same `makeCanvas` pipeline as Save) — there is no Download button. It waits 2 s after page load for hydration (the file input's `change` handler isn't attached earlier).

## Gotchas

- MUI inputs have ids `#<slug>-input`: `cardName level typeLine attribute stIcon effect atk def setId serial`; template chips are `[data-template=<id>]`.
- Data files (`templates.ts`, `defaults.ts`) import siblings directly, never through the `card/index.ts` barrel.
- Lint: the airbnb config forbids `for…of` and the global `isFinite`.
