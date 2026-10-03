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
  deck: 'main'|'extra';     // all templates; default 'main'. Extra = rainbow border + white outlined name
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

`getDefaultCard(template)` builds a card in canonical key order from `templates[t].defaults`. Default template is `effect`. `switchTemplate(card, next)` keeps name, deck, effect, Set ID, serial and art always; attribute / level / ATK / DEF only monster → monster (reset when entering or leaving Spell/Trap); the type line only if the user edited it (otherwise it follows the new template's auto type line, `getAutoTypeLine`: `Spell` / `Trap`, plus ` / <icon name>` when a property icon is set, e.g. `Trap / Continuous`; changing the icon updates an unedited type line the same way); the Spell/Trap icon only if valid for the new template. `setTemplate` doesn't touch `savedJson`, so a switch counts as an unsaved edit.

### Validation (`validate.ts`)

`parseRushCard(text)` → `{ ok: true, card } | { ok: false, error }`. It rejects: non-JSON ("The file isn't valid JSON."), non-objects and a missing `schemaVersion` ("This isn't a rush-hub card." — pokeoh-hub JSON lands here), other versions, unknown/missing `template`, and wrong-typed fields (naming the field, e.g. `Invalid "level": expected a whole number from 0 to 12.`). Missing fields take the template's defaults; unknown keys are dropped. There is **no migration** from pokeoh-hub JSON. `applyCardJson` returns `{ ok: true } | { ok: false; error }` and leaves the card untouched on failure; `ImportButton` and `SetCardLoader` show the error in a "Card not loaded" dialog.

## Yugipedia autofill (`editor/CardFieldsForm/fields/YugipediaLookup/`)

The Autofill button fetches the card's **main (Master Rules) page** wikitext (never the `(Rush Duel)` page — user decision) via `utils/fetchWikiCardText.ts` (`fetchYugipediaWikitext`), and `card/fromWiki.ts` (`parseYugipediaCard`) maps `CardTable2` params onto template, attribute, level/rank, ATK/DEF, type line, Spell/Trap icon and effect. Name, set info and art are left alone. It runs in the browser: never add MediaWiki's `origin=*` to Yugipedia (duplicate CORS header). Yugipedia intermittently returns `internal_api_error_*`; the fetch retries those up to 4 times. Master Rules text isn't converted to the Rush `[REQUIREMENT]/[EFFECT]` format.

**Fandom fallback.** If Yugipedia fails for any reason (not found, unreachable, still erroring after retries), the same title is fetched from `yugioh.fandom.com` (`fetchFandomWikitext`, which **does** need `origin=*`) and parsed by `parseFandomCard`. Fandom's `CardTable2` uses `type`/`type2`/`type3`… instead of `types`, `lore` instead of `text`, and Rush-only pages add `requirement`, which is joined as `[REQUIREMENT] …\n[EFFECT] …`. Old Fandom Normal monsters list only the race (no `type2 = Normal`, unlike Yugipedia), so `withImpliedNormal` appends `Normal` when no card-kind type (Effect, Fusion, …) is present; this also selects the Normal template. A caption under the buttons says when Fandom was used. Fandom is missing some cards (e.g. Monster Monk).

**Not the official Konami DB.** `db.yugioh-card.com` sends no CORS headers and sits behind Incapsula bot protection, so a static site can't read it without a server-side proxy (checked 2026-10).

## Save / Load (`editor/ImportExport/`)

Buttons: Load Directory, Load, Save, Save As, New. Uses the **File System Access API** (Chromium):

- **Working directory** (`showDirectoryPicker`, read/write) is required first; Load/Save ask for it if missing. Picked files must be inside it, otherwise `OutsideWorkingDirectoryDialog` offers to change directory or retry.
- A card is a **pair** `<name>.png` + `<name>.json` written side by side. The JSON is authoritative and re-loadable; the PNG is a render of it. Loading a `.png` finds its sibling `.json` case-insensitively (`findSiblingFileHandle`); none → `MissingJsonPairDialog`.
- `writeCardPng` never throws (a timeout or declined permission must not block the JSON write); `writeCardJson` deliberately does.
- Browsers without the API fall back to a hidden `<input type="file">` for Load. (Note the creator page has **two** file inputs: this fallback, and `#imgUpload-input` for art — target by id in scripts.)
- Load/New with unsaved changes opens `UnsavedChangesDialog`.
- **New's Set ID** is the next free one in the current set: `incrementCardNumber` (`utils.ts`) applied to the highest Set ID in the set, not the card on screen. The set is `ImportExport`'s `newSource`: the folder of the last opened/saved file (re-read with `listFolderCards` on every New), or the published set of a `?set=&card=` deep link. It survives New, so pressing New twice gives the same ID until that card is saved. Load Directory sets it to the loaded folder itself, so New works before any card is opened; opening a card then narrows it to that card's folder. With no set, an empty one, or a read failure, New falls back to incrementing the card on screen. New keeps the template and serial, and a new Set ID starting with `E` (the Extra Deck convention, e.g. `E-017`) sets the deck to Extra; anything else gives Main.
- Suggested filenames: `getSuggestedCardFileName(name, setId, ext)` → `<Set ID> - <Name>.<ext>`, illegal characters (`\ / : * ? " < > |`, so `RD/SMP-EN001` → `RD-SMP-EN001`) turned into `-`; fallback `Rush Hub`.
- `Save` with no file handle behaves like Save As. Cards opened via `?set=&card=` have no handle, so the first Save is a Save As — the user edits a copy, never the served asset.

- **Prev/next arrows** (`atoms/CardNav`, shown above the buttons). With a file handle open (after Load, Save or Save As), `atoms/LocalCardNav` steps through the valid card `.json` files in **that file's folder**, ordered by Set ID (`listFolderCards` / `compareFolderCards` in `utils.ts`: trailing number compared numerically, cards without a Set ID last, filename as tiebreak). The folder is re-read on every step so newly saved cards appear; stepping asks first if there are unsaved changes, and moves the file handle so Save writes the card being shown. New clears the handle, which hides the arrows. With no handle, `atoms/SetCardNav` shows the Set Browser arrows instead (see [`set-browser.md`](set-browser.md)).

`ImportExport` holds the `fileHandle` / `directoryHandle` state. Its `setFileHandle` wrapper also removes a `?set=&card=` deep link, so after Load, Save As or New the creator no longer shows a Set Browser card.

## PNG export (`editor/CardDownloader/utils.ts`)

`makeCanvas(cardId, w = 421, h = 614)`: awaits `document.fonts.ready`, clones `#card` into the hidden `#temp` div, forces width/height and `font-size = baseEmphemeralUnit`, calls `html-to-image`'s `toCanvas` with a transparent background, and removes the clone in `finally`. Two safety nets: broken images are replaced by a 1×1 transparent PNG (otherwise `html-to-image` hangs on an empty `src`), and a 15 s timeout rejects a stalled export. **The exported PNG has a transparent art window** when no art is set. Export is always native 421 × 614 — no other resolutions. Save filename is `<Set ID> - <Name>.png`.

## Batch rendering (`npm run render:cards`)

`npm run render:cards -- <folder-or-json...> [--url http://localhost:3000] [--dry-run] [--timeout ms] [--headed]` (dev server running) loads each card JSON into the creator in headless Chromium and rewrites the `.png` next to it. It races "preview shows the name + Set ID" against the "Card not loaded" dialog, so an invalid or foreign JSON **fails in ~4 s** with the dialog's text instead of hanging; each output's PNG header is read and must be **exactly 421 × 614** or the run fails. Rendering calls `window.rushhubExportPng()` (set by the creator page, same `makeCanvas` pipeline as Save) — there is no Download button. It waits 2 s after page load for hydration (the file input's `change` handler isn't attached earlier).

## Gotchas

- MUI inputs have ids `#<slug>-input`: `cardName level typeLine attribute stIcon effect atk def setId serial`; template chips are `[data-template=<id>]`; the Main/Extra toggle is `#deck-input button[value=main|extra]`.
- Data files (`templates.ts`, `defaults.ts`) import siblings directly, never through the `card/index.ts` barrel.
- Lint: the airbnb config forbids `for…of` and the global `isFinite`.
