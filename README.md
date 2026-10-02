# rush-hub

A web tool for making custom **Yu-Gi-Oh! Rush Duel** style cards, with a Set Browser and printable card sheets. Live at <https://jltheking2.github.io/rush-hub/>.

## Features

- **Card creator** (`/creator`) with all nine Rush Duel templates: Normal, Effect, Ritual, Fusion, Synchro, Xyz, Token, Spell, Trap
- Editor form: template picker, name, attribute, Main/Extra deck toggle (Extra adds a rainbow border and a white outlined name), effect text, level/rank, ATK/DEF, type line (auto-filled for Spell/Trap from the property icon), Spell/Trap property icon, set ID, set name, and art upload / web search with a 376:380 crop
- **Yugipedia lookup** under Name: a link to the card's page, and **Autofill** to fill template, attribute, level, ATK/DEF, type line, icon and text from its Master Rules entry
- Native **421 × 614 px** PNG export (the 59 × 86 mm card ratio)
- Save / load cards as `.json` + `.png` pairs in a working directory (File System Access API, Chromium), with ‹ › arrows to step through the loaded card's folder in Set ID order (or through a published set when the card was opened from the Set Browser)
- **Set Browser** (`/sets`): published sets, a card grid, a full-size viewer and an "Edit in Creator" deep link
- **Print sheets** (`/sets/print?set=<SetId>`): 3×3 cards per A4 page at 59 × 86 mm, with cut marks. Custom sheets: `/sets/print?cards=<SetId>/<cardId>*<copies>,...` (see [`docs/set-browser.md`](docs/set-browser.md))

Not supported, by design: rarity/art foils (beyond the Extra-deck rainbow border), LEGEND/MAXIMUM, non-English text. See [`docs/decisions.md`](docs/decisions.md).

## Development

```bash
npm ci
npm run dev          # http://localhost:3000
npm run typecheck
npm run lint
npm run build        # static export into out/
npm run create:sets  # publish: promote cards/sets/ into public/sets/ and regenerate src/utils/setsData.ts (manual only; dev/build never publish)
npm run verify -- creator   # headless screenshot (dev server must be running)
npm run render:cards -- <folder-or-json...>   # batch re-render saved cards, checked to be 421x614 (dev server must be running)
npm run compare:ref -- <referenceDir>           # export the 9 sample cards and diff them against reference renders (dev server must be running)
```

`start-dev.bat` / `stop-dev.bat` start and stop the dev server on Windows. `start-dev.bat` also opens a loading page (`scripts/dev-loading.html`) that waits while `next dev` compiles the main pages, then redirects to <http://localhost:3000>.

## Docs

Feature-level notes for contributors (and coding agents) live in [`docs/`](docs/):

- [`renderer.md`](docs/renderer.md) — card geometry, layers, templates, fonts, calibration against reference renders
- [`text-fitting.md`](docs/text-fitting.md) — how text is shrunk, squashed and justified to fit
- [`save-load.md`](docs/save-load.md) — the card JSON schema, Save/Load, PNG export, batch rendering
- [`set-browser.md`](docs/set-browser.md) — the sets pipeline, Set Browser and print sheets
- [`decisions.md`](docs/decisions.md) — scope decisions and licensing notes

[`CLAUDE.md`](CLAUDE.md) is the agent-facing entry point.

## Deploy

Pushes to `master` run `.github/workflows/deploy.yml`, which typechecks, lints, builds the static export and publishes it to GitHub Pages under the `/rush-hub` base path. Pages must be set to deploy from **GitHub Actions** (`gh api -X POST repos/JLtheking2/rush-hub/pages -f build_type=workflow`, or `-X PUT` if Pages already exists). No secrets are needed.

## Credits

- Descends from [pokecardmaker.net](https://github.com/karl/pokecardmaker.net) via [pokeoh-hub](https://github.com/JLtheking2/pokeoh-hub).
- Rush Duel card frames by **AlixSep**, via the Neo New Card Maker at ygopro.org. The "MADE BY ALIXSEP" credit on the frames is intentionally left intact.
- Card fonts: Matrix, ITC Stone Serif and Eurostile Candy (shipped in `public/fonts/`), plus Amiri Italic (SIL OFL, self-hosted for the Normal-card flavour text), with Google Fonts fallbacks (Spectral, Spectral SC, Amiri, Crimson Text).
- Layout measurements were taken with reference to the Neo New Card Maker; no code from it is used.

## Legal

This is a non-commercial fan project. Yu-Gi-Oh! and Rush Duel are trademarks of Konami; card frames are fan art by AlixSep; card fonts are commercial fonts used for non-commercial purposes. If you are a rights holder and want something removed, open an issue at <https://github.com/JLtheking2/rush-hub/issues> and it will be taken down promptly.
