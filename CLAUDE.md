# CLAUDE.md

Guidance for Claude Code in this repository.

## Start here

**Read [`PLAN.md`](PLAN.md) first.** It is the port plan, decision log (§0 — don't re-open), current status (§B), phased checklist (§6) and session handover. Keep it up to date as you work. `docs/` holds feature-deep notes (written in Phase 7); this file holds only the always-relevant core.

## Project

rush-hub is a Yu-Gi-Oh! **Rush Duel** card maker, derived from pokeoh-hub (itself a fork of pokecardmaker.net). Rush style only; English only; no rarity. Keep `README.md` in sync with any substantial change (new page, feature, script, setup or deploy step, doc).

## Environment (Windows + PowerShell)

- Use `Grep`/`Glob`/`Read` for search and reading. Don't fan one query across several tools. Delayed or batched tool output is normal, not a failure — don't re-fire calls.
- Avoid Bash for filesystem work; Unix mounts are unreliable. Use Bash (not PowerShell 5.1) for background processes and `curl`. `start-dev.bat` / `stop-dev.bat` start/stop the dev server outside Claude.
- Node scripts are native Windows processes: never pass `/tmp/...` paths; use `os.tmpdir()`.
- **Headless verification:** `playwright` is a devDependency. Run `npm run verify -- creator [--wait "text=DOWNLOAD"] [--screenshot <winpath>]` with the dev server running. HTTP 200 doesn't mean the route rendered — always wait on a real element and **look at the screenshot** before interpreting anything (a blank image is a harness failure). MUI checkboxes: click the hidden `<input>` via `page.evaluate`. Anchor on the `DOWNLOAD` button's bounding box to locate the card preview.
- Stale `.next` cache (`ENOENT .next/server/pages/...`): stop node, delete `.next`, restart.

## Commands

```bash
npm run dev | build | lint | lint:fix | typecheck
npm run create:sets   # cards/sets/ -> public/sets/ + regenerate src/utils/setsData.ts (generated, never hand-edit)
npm run verify -- creator
npm run render:cards -- <folder-or-json...>
npm run compare:ref -- <referenceDir>   # visual diff of the 9 sample cards vs reference renders (dev server running)
```

After every code change run `npm run typecheck` and `npm run lint` and fix **all** errors before calling a step done.

## Tech stack

Next.js 12 + React 17 + TypeScript, Zustand, MUI v5 + Emotion, React Hook Form, `html-to-image` (PNG export), `react-easy-crop`.

## Architecture

- `src/features/cardEditor/card/` — `RushCard` type (schema v1) + enum id arrays, `templates.ts` (per-template flags/frame/defaults, attribute and Spell/Trap icon tables — the form and renderer read these), `defaults.ts` (`getDefaultCard`, `switchTemplate`), `validate.ts` (`parseRushCard`), and `useRushCardStore` (card, save state, `setTemplate`, `applyCardJson` → `{ ok } | { ok:false, error }`). Data files import siblings directly, never via the `index.ts` barrel.
- `src/features/cardEditor/cardStyles/` — `constants.ts` (421×614 canvas, `baseEmphemeralUnit`), the ephemeral-unit store, `layout.ts` (all 421-space geometry; the only file to tune against references), `units.ts` (`u(n)` → em), and `components/CardDisplay` (the card preview; export clones `#card`) with `components/layers/` (one component per card layer) and `atoms/{CardBox,FitText}`. **Never put a positioning `em` on an element that also sets its own font-size** — `FitText` nests a sized inner div inside a `CardBox`. Text is fitted at native px in a hidden measurer (`utils/measureText.ts`) after `useFontsReady`, so fits are identical in preview and export.
- `src/features/cardEditor/editor/` — the form: `ImportExport` (save/load/save-as/new, File System Access API), `CardDownloader` (PNG export via `html-to-image`), `CardFieldsForm` (template picker + all card fields; shows/hides fields from the `templates.ts` flags; input ids are `#<slug>-input`), `ImagesForm` (art upload + crop at the 376:380 art-window aspect, `artAspect`), `CardOptionsForm` (assembles them).
- `src/pages/` — `creator` (also `?set=<SetId>&card=<slug>` deep link via `SetCardLoader`), `sets` (Set Browser), `sets/print`.

The **ephemeral unit** pattern: the card container's pixel width drives its font-size so all nested `em` values scale with the preview. Export clones `#card` at 421×614 px with `font-size = baseEmphemeralUnit`, so layout must depend only on `em`.

## Rules

- **Never use `next/image` inside `CardDisplay`** — use `atoms/DisplayImg`. `next/image` breaks PNG export.
- **Fully static export** (`next build` → `postbuild: next export` → `out/`): no `src/pages/api/`, no `getServerSideProps`. Keep `images: { unoptimized: true }` and `pageExtensions: ['page.tsx']` in `next.config.js`. Pages are `*.page.tsx`.
- **Every `/assets/...` or `/fonts/...` URL must go through `withBasePath`** (`src/utils/withBasePath.ts`) or it 404s on GitHub Pages (base path `/rush-hub`).
- Deploy: pushes to `master` run typecheck + lint + build, then publish to Pages. Single contributor; no PR workflow.
