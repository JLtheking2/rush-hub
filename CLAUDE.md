# CLAUDE.md

Guidance for Claude Code in this repository.

## Project

rush-hub is a Yu-Gi-Oh! **Rush Duel** card maker, derived from pokeoh-hub (itself a fork of pokecardmaker.net). Rush style only; English only; no rarity. Nine templates: Normal, Effect, Ritual, Fusion, Synchro, Xyz, Token, Spell, Trap. Cards are 421 × 614 px (59 × 86 mm). Live at <https://jltheking2.github.io/rush-hub/>.

The scope decisions (what was deliberately left out, licensing risk, deferred rounded corners) are in [`docs/decisions.md`](docs/decisions.md) — **don't re-open them without asking the user.**

## Feature docs

This file holds only the always-relevant core. Feature-deep detail lives in `docs/` and is read **on demand**. Keep that split when updating docs: cross-cutting architecture/rules/environment changes go here; feature-deep changes go in the matching `docs/*.md`.

**Keep `README.md` in sync too.** `CLAUDE.md` is the agent-facing front door, `README.md` the human-facing one. On any substantial change — a new page, feature, npm script, changed setup/deploy step, or new `docs/*.md` — update `README.md` in the same change.

- **[`docs/renderer.md`](docs/renderer.md)** — card geometry (`layout.ts`), layers, per-template flags, fonts, assets, and calibrating against the reference renders (`compare:ref`).
- **[`docs/text-fitting.md`](docs/text-fitting.md)** — `FitText` / measurer: shrink, squash, justify, waiting for fonts; read when text overflows or preview and export differ.
- **[`docs/save-load.md`](docs/save-load.md)** — the `RushCard` schema, validation, Save/Load/Save As/New, PNG export, `render:cards`.
- **[`docs/set-browser.md`](docs/set-browser.md)** — `cards/sets/` → `public/sets/` → `setsData.ts` pipeline, `/sets`, the creator deep link, `/sets/print`.
- **[`docs/decisions.md`](docs/decisions.md)** — the user's design decisions, out-of-scope list, licensing notes.

## Environment (Windows + PowerShell)

- Use `Grep`/`Glob`/`Read` for search and reading, and pick one tool per question. Delayed or batched tool output is normal, not a failure — don't re-fire calls. Don't queue big speculative batches (one error cancels the rest).
- Avoid Bash for filesystem work; Unix mounts are unreliable. Use Bash (not PowerShell 5.1) for background processes and `curl`. `start-dev.bat` / `stop-dev.bat` start/stop the dev server outside Claude.
- Bash gotcha: `NEXT_PUBLIC_BASE_PATH=/rush-hub npm run build` gets MSYS-path-mangled; prefix `MSYS2_ENV_CONV_EXCL=NEXT_PUBLIC_BASE_PATH` or use PowerShell. CI (Linux) is unaffected.
- Node scripts are native Windows processes: never pass `/tmp/...` paths; use `os.tmpdir()`.
- **Headless verification:** `playwright` is a devDependency (Chromium is installed globally). Run `npm run verify -- creator [--wait "text=Save As"] [--screenshot <winpath>]` with the dev server running. HTTP 200 doesn't mean the route rendered — always wait on a real element, and **look at the screenshot** before interpreting anything (a blank image is a harness failure). The card preview appears ~1 s after `Save As` does. MUI checkboxes: click the hidden `<input>` via `page.evaluate`. The creator has two `input[type=file]`: target the art one by `#imgUpload-input`.
- Stale `.next` cache (`ENOENT .next/server/pages/...`), or a dev server misbehaving after `npm run build`: stop node, delete `.next`, restart.

## Commands

```bash
npm run dev | build | lint | lint:fix | typecheck
npm run create:sets   # cards/sets/ -> public/sets/ + regenerate src/utils/setsData.ts (generated, never hand-edit)
npm run verify -- creator
npm run render:cards -- <folder-or-json...>   # re-render the .png next to card .json; fails on invalid cards / non-421x614 output
npm run compare:ref -- <referenceDir>         # visual diff of the 9 sample cards vs reference renders (dev server running)
```

After every code change run `npm run typecheck` and `npm run lint` and fix **all** errors before calling a step done.

## Git

**Commit locally when asked, but never `git push`** (or trigger deploys). The user pushes and publishes. Single contributor; pushes straight to `master`, no PR workflow.

## Tech stack

Next.js 12 + React 17 + TypeScript, Zustand, MUI v5 + Emotion, React Hook Form, `html-to-image` (PNG export), `react-easy-crop`.

## Architecture

- `src/features/cardEditor/card/` — `RushCard` type (schema v1) + enum id arrays, `templates.ts` (per-template flags/frame/defaults, attribute and Spell/Trap icon tables — the form and renderer read these), `defaults.ts` (`getDefaultCard`, `switchTemplate`), `validate.ts` (`parseRushCard`), and `useRushCardStore`. Data files import siblings directly, never through the `index.ts` barrel.
- `src/features/cardEditor/cardStyles/` — `constants.ts` (421×614, `baseEmphemeralUnit`), the ephemeral-unit store (`emphemeralUnit` is misspelled in the store's real API), `layout.ts` (all 421-space geometry; the only file to tune positions in), `units.ts`, and `components/CardDisplay` with `components/layers/` and `atoms/{CardBox,FitText,DisplayImg}`.
- `src/features/cardEditor/editor/` — the form: `ImportExport` (Save/Load, rendered under the card preview), `CardDownloader` (only `utils.ts` PNG export + the `#temp` styles; there is no Download button), `CardFieldsForm` (input ids are `#<slug>-input`), `ImagesForm` (art upload + crop at 376:380), `CardOptionsForm` (the fields form; Image sits between Card and Stats).
- `src/pages/` — `creator` (also `?set=<SetId>&card=<slug>` via `SetCardLoader`), `sets` (Set Browser), `sets/print`, home.
- `src/utils/fonts.ts` — the card fonts and per-role `fontStacks`; `src/hooks/useFontsReady.ts`.
- Assets: `public/assets/rush/{frames,attributes,stars,icons}`, `public/fonts/`, `public/assets/home/` (home thumbnails), `public/sets/` (published cards).

The **ephemeral unit** pattern: the card container's pixel width drives its font-size so all nested `em` values scale with the preview. Export clones `#card` at 421×614 px with `font-size = baseEmphemeralUnit`, so layout must depend only on `em`.

## Rules

- **Never use `next/image` inside `CardDisplay`** — use `atoms/DisplayImg`. `next/image` breaks PNG export.
- **Never put a positioning `em` on an element that also sets its own font-size.**
- **Fully static export** (`next build` → `postbuild: next export` → `out/`): no `src/pages/api/`, no `getServerSideProps`. Keep `images: { unoptimized: true }` and `pageExtensions: ['page.tsx']` in `next.config.js`. Pages are `*.page.tsx`.
- **Every `/assets/...` or `/fonts/...` URL must go through `withBasePath`** (`src/utils/withBasePath.ts`) or it 404s on GitHub Pages (base path `/rush-hub`).
- Keep the "MADE BY ALIXSEP" credit on the frames and the AlixSep credit in the README and footer intact.
- Deploy: pushes to `master` run typecheck + lint + build, then publish to Pages.
