# rush-hub

A web tool for making custom **Yu-Gi-Oh! Rush Duel** style cards, with a Set Browser and printable card sheets. Live at <https://jltheking2.github.io/rush-hub/>.

> **Status:** early port. The repo is a stripped shell (blank 421:614 card, save/load, image upload) with the Rush frames, icons and fonts in place. The Rush card renderer and editor form are being built — see [`PLAN.md`](PLAN.md) for the roadmap and current status.

## Features (target)

- Rush Duel templates: Normal, Effect, Ritual, Fusion, Synchro, Xyz, Token, Spell, Trap
- Native 421 × 614 px PNG export (59 × 86 mm card ratio)
- Save / load cards as `.json` + `.png` pairs (File System Access API)
- `/sets` Set Browser and `/sets/print` 3×3-per-A4 print sheets

## Development

```bash
npm ci
npm run dev          # http://localhost:3000
npm run typecheck
npm run lint
npm run build        # static export into out/
npm run create:sets  # promote cards/sets/ into public/sets/ and regenerate src/utils/setsData.ts
npm run verify -- creator   # headless screenshot (dev server must be running)
npm run render:cards -- <folder-or-json...>   # batch re-render saved cards (dev server must be running)
```

`start-dev.bat` / `stop-dev.bat` start and stop the dev server on Windows.

## Deploy

Pushes to `master` run `.github/workflows/deploy.yml`, which typechecks, lints, builds the static export and publishes it to GitHub Pages under the `/rush-hub` base path.

## Credits

- Descends from [pokecardmaker.net](https://github.com/karl/pokecardmaker.net) via [pokeoh-hub](https://github.com/JLtheking2/pokeoh-hub).
- Rush Duel card frames by **AlixSep**, via the Neo New Card Maker at ygopro.org. The "MADE BY ALIXSEP" credit on the frames is intentionally left intact.
- Card fonts: Matrix, ITC Stone Serif and Eurostile Candy (shipped in `public/fonts/`), with Google Fonts fallbacks (Spectral, Spectral SC, Amiri, Crimson Text).
- Layout measurements were taken with reference to the Neo New Card Maker; no code from it is used.

## Legal

This is a non-commercial fan project. Yu-Gi-Oh! and Rush Duel are trademarks of Konami; card frames are fan art by AlixSep; card fonts are commercial fonts used for non-commercial purposes. If you are a rights holder and want something removed, open an issue at <https://github.com/JLtheking2/rush-hub/issues> and it will be taken down promptly.
