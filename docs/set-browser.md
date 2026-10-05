# Set Browser and print sheets

Read this when working on `/sets`, `/sets/print`, the `cards/sets/` → `public/sets/` pipeline, or the `?set=&card=` creator deep link.

## Pipeline

```
cards/sets/<SetId>/*.png + *.json + cover.png   ← local staging (gitignored, except cover.png)
        │  npm run create:sets   (manual only - prestart / prebuild run phase B alone via --no-import)
        ▼
public/sets/<SetId>/cards/<slug>.png + <slug>.json   ← TRACKED source of truth
public/sets/<SetId>/thumb/<slug>.webp                 ← 320 px wide, regenerated when stale
public/sets/<SetId>/cover.webp                        ← 400 px wide, from cover.png
        ▼
src/utils/setsData.ts   ← GENERATED; never hand-edit. Read via src/utils/sets.ts
```

`scripts/createSetsData.js` has two phases:

- **A — promote:** for each staging folder that has PNGs, copy `.png` + `.json` verbatim into `public/sets/<SetId>/cards/` (only when the staged file is newer, so a card edited in place in `public/sets` is never clobbered), build `cover.webp`, and prune files no longer staged. A staging folder with **no** PNGs is left alone, so a fresh clone (empty staging) keeps the tracked `public/sets` untouched.
- **B — derive:** for every folder in `public/sets`, refresh stale thumbnails, read each card's `.json` for its number and name, and write `setsData.ts`.

**Publishing is manual.** Only an explicit `npm run create:sets` runs phase A. The `prestart` (so `npm run dev` / `start-dev.bat`) and `prebuild` hooks call the script with `--no-import`, which skips phase A — starting the dev server or building never publishes work-in-progress staging.

Rules:

- Any `.png` in staging other than the set-level `cover.png` is a card, **including in subfolders** (`PRS-02/Main/…`) — subfolders only organise staging; the published set is flat. Its **slug** is the whole basename (the subfolder is not part of it), ASCII-folded and lower-cased with hyphen runs collapsed (`001 - Smile World` → `001-smile-world`); duplicate slugs, also across subfolders, are skipped with a warning.
- The grid **number is `setId`** and the **name is `name`**, both read from the `.json` — the filename is only an identifier. A card with no `.json` gets number `''` and name = slug, and no "Edit in Creator" button (`json: null`). An empty Set ID is fine; a missing name falls back to the slug with a warning.
- **`quantity`** (copies of the card in the set) is read from the `.json` — an integer ≥ 1, else 1 (so cards saved before the field existed count once; no `.json` = 1). It is shown as ` ×N` after the name in the grid and viewer when > 1, and the set header adds `· N copies` when the total differs from the card count.
- Sort: number prefix, then the number numerically (so `EN10` after `EN2`), then name.
- Set display names come from `SET_DISPLAY_NAMES` at the top of the script (default: the folder name). Add an entry for a new set.
- `.gitignore` keeps `cards/sets/**/*.png` and `*.json` (any depth, so subfolders like `PRS-02/Main/` are covered) out of git but negates the set-level `cover.png`. `cards/sets/<Set>/cover.png` is hand-supplied and must be tracked. Don't remove those rules.
- The card `.png` + `.json` side by side means **`public/sets/<SetId>/cards/` is itself a valid creator working directory**: open it with Load Directory, edit, Save in place, then re-run `npm run create:sets` — the thumbnail and grid entry refresh.
- Re-runs are idempotent. Without `sharp` the script degrades to full-size images as thumbnails.

## `/sets` page (`src/pages/sets/`)

`index.page.tsx` → `SetGrid` (set covers) → `CardGrid` (thumbnails at 421:614, name + Set ID caption) → `CardViewer` (full-size, prev/next arrows, "Edit in Creator"). `?set=<SetId>` selects a set. Styles in `styles.ts`. Corners stay square (rounded corners are deferred — see [`decisions.md`](decisions.md)). Verified: no horizontal scroll at 400 px.

## Deep link to the creator

"Edit in Creator" opens `/creator?set=<SetId>&card=<slug>` in a new tab. `pages/creator/atoms/SetCardLoader` resolves the two **lookup keys** through `setsData` (never a raw path/URL), fetches the card's `json`, and calls `applyCardJson`; failures show "Card not loaded". It guards against re-applying on later renders (the query stays in the URL so the link is shareable) and asks before replacing unsaved work on in-tab navigation. No file handle is set, so the first Save acts as Save As.

While the deep link is active, `ImportExport/atoms/SetCardNav` shows ‹ › arrows under the preview. They step through the set's cards that have a `json`, in `setsData` order (set number), by `router.push`ing a shallow `?set=&card=`; `SetCardLoader` then loads the card. If the user cancels the unsaved-changes prompt, the loader `router.replace`s back to the previous card so the URL and arrows match the editor. Load, Save As and New remove the query, and from then on the local-folder arrows take over (see [`save-load.md`](save-load.md)).

## `/sets/print?set=<SetId>` (`print.page.tsx`, `printStyles.ts`)

- `?set=` sheets repeat each card **`quantity` times** (the toolbar count and sheet count follow the expanded list). Custom `?cards=` sheets ignore `quantity` — their `*<copies>` is explicit.
- Sheets of **9 cards, 3 × 3 on A4 portrait**; cells are **59 × 86 mm** (Yu-Gi-Oh! size). 177 × 258 mm leaves 16.5 mm side and 19.5 mm top/bottom margins, inside every consumer printer's unprintable area.
- Each cell is the card's full PNG with `object-fit: fill` (421:614 = 0.6857 vs 0.6860 — invisible, whereas `contain` would leave white slivers). Cut marks are a 0.25 mm `outline` on each cell (an outline takes no layout space, so seams line up and each cut is one line).
- `@page { size: A4 portrait; margin: 0 }`; header/footer are hidden in print; a `break-after: page` per sheet, none after the last, and the background wrapper's gradient/min-height is neutralised so there's no trailing blank page. `-webkit-print-color-adjust: exact` keeps the colours.
- A native 421 px image at 59 mm prints at ≈ 181 DPI — slightly soft. That follows from the native-export decision.
- **Custom sheets (bespoke print requests):** `?cards=<SetId>/<cardId>*<copies>,...` replaces the set's card list (copies defaults to 1; `?set=` is not needed). Example, 8 × Parasite Paracide + 1 × Pot the Trick on one page: `/sets/print?cards=PRS0/001-parasite-paracide*8,PRS1/072-pot-the-trick`. `<cardId>` is the card's `id` in `setsData.ts` (`<number>-<slug>`, e.g. `072-pot-the-trick`). Unknown entries are skipped silently; the sheet count follows the total. Cards are numbered by set, so a code like `PKO1-072` means set `PRS1`, card `072` (assumed — the codes aren't stored in the card data). For a bespoke request, build this URL and open it (dev server on 3000, or 3001 if 3000 is taken; no `/rush-hub` prefix in dev) — no code change needed.
- Verified: cells measure 59 × 86 mm at 96 dpi (222.98 × 325.03 px), an A4 PDF of a 9-card sheet is one page. An unknown `?set=` shows "Set not found".
