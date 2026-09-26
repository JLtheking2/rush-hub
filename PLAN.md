# rush-hub — Rush Duel Card Maker: Plan, Checklist & Session Handover

> **This file is the single source of truth for the rush-hub port *and* the context handover between sessions.**
> A fresh agent should be able to read only this file and carry on. Read §A (how to use this file) and §B (current
> status) first.

---

## A. How to use and maintain this file (instructions for every agent)

**At the start of a session:**
1. Read this whole file. Don't re-litigate anything in §0 (Decision log). Those are the user's decisions.
2. Look at §B (Current status) to find the next action, then work from the first unticked box in §6.
3. If the repo exists, work in `D:\GitRepos\rush-hub` and read its `CLAUDE.md` too. The pokeoh-hub `CLAUDE.md` rules in §C still apply until rush-hub has its own.

**While working, keep this file up to date as you go. Don't batch it up for the end:**
- **Tick checkboxes** in §6 (`- [x]`) as soon as a step is truly done and verified (typecheck + lint pass, and a screenshot has been checked where visual).
- **Edit the plan when reality diverges.** If a path, number, approach or estimate in this file turns out wrong, fix it in place, then add a line to §F (Findings) saying what changed and why. A future agent must never follow stale instructions.
- **Record findings in §F.** Record anything non-obvious you learned: gotchas, measured coordinate corrections, library quirks, commands that worked or didn't. Date each entry.
- **Add new decisions to §0** only when the *user* makes them. If you need a decision, ask the user; don't guess and write it down as decided.
- **Add sub-steps** under the relevant phase when a step turns out to need several steps. Don't let work happen that isn't on the checklist.

**At the end of a session, or before context runs low:**
1. Update §B: phase, last completed step, **exact next action**, any blockers or open questions for the user.
2. Append a dated entry to §G (Session log) with what you did, what you verified and what's left half-done.
3. If the repo exists, commit the plan file along with the code (see "File location" below). **Commit locally only. Never `git push`**: the user publishes all changes themselves.

**File location:**
- Until the rush-hub repo exists: `C:\Users\jlthe\Desktop\yugioh-rush-port\PLAN.md` is canonical.
- **Phase 1 moves it:** copy it to `D:\GitRepos\rush-hub\PLAN.md` and commit it. From then on **the repo copy is canonical**. Replace the Desktop copy with a one-line stub pointing at the repo path. The Desktop folder stays as the reference-material store (§2). Don't commit `site/cardmaker.js` or `reference-renders/` into the repo.
- Once the port is complete (all of §6 ticked), fold anything long-lived into rush-hub's `CLAUDE.md`/`docs/`, and either delete `PLAN.md` or trim it to a short history. Ask the user which.

---

## B. Current status  ← update this every session

| | |
|---|---|
| **Phase** | Phases 1–5 ✅ → **Phase 6 next** |
| **Repo** | `D:\GitRepos\rush-hub` → `JLtheking2/rush-hub` (canonical copy of this file lives here) |
| **Last completed** | Phase 5: editor form (`editor/CardFieldsForm`), 376:380 art crop, Trap reference recaptured. typecheck + lint clean, verified in headless Chromium (2026-09-26). Committed locally, **not pushed** |
| **Next action** | Phase 6: PNG export filename check, `render:cards` on the new schema, `createSetsData.js` (`name`/`setId`), `/sets` grid + viewer at 421:614, `/sets/print` at 59×86 mm, and a sample set of the 9 §2 cards |
| **Blockers / questions for user** | None. Favicon/logo now uses the same icon set as pokeoh-hub (see §F, 2026-09-26). |

---

## C. Environment and working context (read before running commands)

**Machine:** Windows 11. The shell tools are **PowerShell 5.1** (primary) and **Git Bash** (the Bash tool). The user is `JLtheking2` on GitHub (git author `JLtheking2`).

**Rules carried over from pokeoh-hub's `CLAUDE.md` (all still apply):**
- Use the **Grep/Glob/Read** tools for searching and reading files. Don't fan one query across several tools. The environment isn't flaky: delayed output is normal, so don't re-fire calls.
- **Avoid Bash for filesystem work** (the `/mnt/d` and `/d` mounts are unreliable; `/d/GitRepos/...` has mostly worked in Bash, but prefer the dedicated tools). Use **Bash for background processes** (`npm run dev &`) and `curl`. PowerShell 5.1 has no `&&`, no `&` backgrounding, and can't `Start-Process npm`.
- Node scripts are native Windows processes, so **never pass `/tmp/...` paths** to them. Use `os.tmpdir()` or a Windows path.
- **After every code change run `npm run typecheck` and `npm run lint`, and fix *all* errors** before calling a step done. Surface any fix that would widen the scope to the user.
- **Keep `README.md` in sync** with any substantial change: a new page, feature, script, setup or deploy step, or new doc. (This is also a saved user preference.)
- **`CLAUDE.md` holds only the always-relevant core. Feature-deep detail goes in `docs/*.md`**, read on demand.
- **Never use `next/image` inside the card display.** Use the `DisplayImg` atom (`cardStyles/components/atoms/DisplayImg`), because `next/image` breaks PNG export.
- **The site is a fully static export**: `npm run build` → `postbuild: next export` → `out/`. So no API routes and no `getServerSideProps`. Keep `images: { unoptimized: true }` and `pageExtensions: ['page.tsx']` in `next.config.js`. Pages are `*.page.tsx`.
- **Headless verification:** `playwright` is a project devDependency (v1.60.0), and Chromium is installed at `%LOCALAPPDATA%\ms-playwright\chromium-1223`. Use `npm run verify -- /creator [--wait "text=…"] [--screenshot <winpath>]` with the dev server running. **HTTP 200 doesn't mean the route rendered.** Always `waitForSelector` on a real element, and **look at the screenshot before trusting DOM values** (a blank image means the harness failed). MUI checkboxes: click the hidden input with `page.evaluate(() => document.getElementById('x-input')?.click())`. Card preview locator: anchor on the `DOWNLOAD` button's bounding box.
- **Stale `.next` cache** (`ENOENT .next/server/pages/creator.js`): stop node, delete `.next`, restart dev.
- `start-dev.bat` / `stop-dev.bat` in the repo root start and stop the dev server outside Claude.

**GitHub:** `gh` is authenticated as **JLtheking2** (keyring, HTTPS) with scopes `repo, workflow, gist, read:org`. That's enough to create the repo, push workflows and enable Pages through `gh api`.

**Commit attribution:** end commit messages with the co-author line your harness gives you. The user pushes straight to `master` (no PRs).

**Don't push (from 2026-09-26):** agents commit locally but **never run `git push`** (or trigger deploys). The user pushes and publishes. Deploy checks (`gh run …`) are the user's job unless they ask.

**Claude memory:** pokeoh-hub memory lives at `C:\Users\jlthe\.claude\projects\D--GitRepos-pokeoh-hub\memory\`. rush-hub will get its own memory dir (`…\D--GitRepos-rush-hub\memory\`). Carry over the "keep README in sync" feedback memory in Phase 7.

---

## 0. Decision log (user decisions, 2026-09-26; don't re-open)

| Topic | Decision |
|---|---|
| Scope | Rush style only. Templates: **Normal, Effect, Ritual, Fusion, Synchro, Xyz, Token, Spell, Trap**. Drop all Pokémon/pokeoh support. Build the new template from scratch. |
| Card size | **59 × 86 mm** (Yu-Gi-Oh!), not 63 × 88 mm |
| Frame art | Use **AlixSep's Rush frames as-is**, with the "MADE BY ALIXSEP" credit and bar mark left intact. Credit AlixSep in the README and site footer. |
| Fonts | Ship the **real fonts** (Matrix, ITC Stone Serif, Eurostile Candy) as a non-commercial project. Keep the Google fallbacks in every stack. |
| Porting approach | **Write our own code.** The NCM bundle is only a behaviour and measurement reference (see §1). |
| Renderer | **DOM + `em` units** (the existing ephemeral-unit pattern), not canvas. |
| Export size | **Native 421 × 614 px** only. |
| Rarity | **Not supported.** No rarity field, foil overlays or silver/gold names. |
| Rush extras | **None.** No LEGEND, no MAXIMUM, no auto-bold `[REQUIREMENT]`/`[EFFECT]`, no Spell/Trap property text. |
| Language | **English only.** |
| Repo | **`JLtheking2/rush-hub`**, public, a **fresh repo with new history** (not a GitHub fork). |
| Workflow | **Single contributor, pushes straight to `master`.** No PR workflow, no PR CI and no branch protection. The deploy workflow runs the typecheck and lint gates itself. |
| Set Browser + Print | **Keep both**, adapted to Rush cards and 59 × 86 mm. |
| Publishing | Agents commit locally but **never push**; the user pushes and publishes (2026-09-26). |

---

## 1. Research findings: ygopro.org/yugioh-card-maker

| Item | Finding |
|---|---|
| **Engine** | "Neo New Card Maker" (NCM). React 16 with `create-react-class`, bundled by almond/AMD into one **unminified** 200 KB file (`site/cardmaker.js`). |
| **Renderer** | One `<canvas>` of **421 × 614 px**. Each card part is a small component with a style table keyed by variant (`Normal` / `Anime` / `Rush`). |
| **Rush frames** | Full-card PNG overlays (421×614). The art window, ATK/DEF bar, "RUSH DUEL" footer and bottom black bar are baked into the image. The frame draws **over** the art. |
| **Aspect ratio** | 421/614 = 0.6857 and 59/86 = 0.6860. **The native canvas already matches the Yu-Gi-Oh ratio.** |
| **Text engine** | (1) **auto-shrink**: drop the font by 0.25 px until the text fits the box height; (2) **horizontal squash**: `nowrap` lines (name, type line) get `scaleX(avail/actual)`, capped at 1; (3) **justify**: every line except a paragraph's last; `\n` = new paragraph; words split on spaces. |
| **Save/export** | Autosaves to `localStorage["ccms"]` (a `beforeunload` handler overwrites that key, which matters when scripting the site), exports JSON, exports PNG through `canvas.toDataURL`. |

**Where to look in `site/cardmaker.js`** (line numbers into the downloaded file, for reference reading only):

| Module | Line |
|---|---|
| `draw/Text` (fit, squash, justify, stroke) | 591 |
| `CardName` (name styles) | 954 |
| `Attributes` / `Attribute` (Rush → `.rush.png`, falls back to Void) | 1046 / 1145 |
| `Border` (frame path, `.rush.png` suffix) | 1211 |
| `Image` (art box per variant) | 1257 |
| `Stars` / `Level` (`renderRush`: badge + stroked number) | 1340 / 1503 |
| `Icons` / `Type` (brackets, icon placement, width measuring) | 1567 / 1582 |
| `Effect` (RushMonster / RushBackrow / RushVanilla) | 1910 |
| `Atk` / `Def` | 2044 / 2122 |
| `Serial` / `Id` (set ID) | 2436 / 2723 |
| Layouts Normal → Trap (per-template composition, `isRush` branches) | 2848–4000 |
| `Card` (canvas 421×614) / `CardMaker` (form, state shape, fonts) | 4217 / 4294 |

### Licensing notes
1. **The NCM code has no license.** Treat it as all rights reserved. **Don't copy it. Write our own TypeScript** and use the bundle only to learn which boxes exist, where they sit and how text fits. The measured numbers in §3 are our notes.
2. **The frames are fan art by AlixSep.** Decided: use them as-is, never strip or crop the credit, credit AlixSep in the README and footer, and add a takedown-contact line to the README.
3. **The fonts are commercial.** Decided: ship them. Being non-commercial doesn't by itself grant a redistribution licence; the user accepted that risk.
4. The Yu-Gi-Oh! trade dress belongs to Konami. This is the same category of risk as pokeoh-hub's Pokémon trade dress.

---

## 2. Reference-material folder (`C:\Users\jlthe\Desktop\yugioh-rush-port\`)

```
yugioh-rush-port/
├── PLAN.md                          ← this file (canonical until Phase 1 moves it into the repo)
├── tools/capture-refs.js            ← Playwright script that regenerated reference-renders/ from the live site
├── reference-renders/               ← PNG output of the live site, Rush style, one per template (421×614)
│   ├── {Normal,Effect,Ritual,Fusion,Synchro,Xyz,Token,Spell,Trap}.rush.png
│   └── _full-page-ui.png            ← screenshot of their editor UI
└── site/                            ← raw download from ygopro.org/yugioh-card-maker (download-log.txt = HTTP codes)
    ├── index.html, cardmaker.js     ← page + unminified app bundle (REFERENCE ONLY, never commit)
    ├── css/Style.css, Default-Theme.css
    ├── css/fonts/                   ← the 6 card fonts (see §3a)
    └── res/tcg/ygo/
        ├── border/   <T>.rush.png (use these) + <T>.png (standard style, unused) for the 9 templates  (421×614)
        ├── attribute/ Dark Divine Earth Fire Light Water Wind Spell Trap Void Rainbow .rush.png   (54×54)
        ├── star/      Normal.rush.png, Xyz.rush.png (used), Rainbow.rush.png (unused)             (63×68)
        ├── icon/      Continuous Counter Equip Field Quick-play Ritual (used), Splice (unused)    (24×24)
        ├── text/      leftbracket, rightbracket, leftbracketwhite, rightbracketwhite .png         (20×63)
        └── foil/      unused (rarity not supported)
```

**`tools/capture-refs.js`** drives the live site's form with Playwright: it selects Template, sets Style Variant = Rush, then fills the fields and saves `canvas.toDataURL()` per template. It loads playwright from `D:/GitRepos/pokeoh-hub/node_modules/playwright`, so change that path to rush-hub's once pokeoh-hub isn't around. Run it with `node tools/capture-refs.js`. **Sample data used in the renders**, which our visual-diff test must reproduce exactly:

| Template | Name | Attr | Lv | Type line | ATK/DEF | Effect |
|---|---|---|---|---|---|---|
| Normal | Sample Normal | Dark | 7 | Dragon | 2500/2000 | `A legendary dragon of flavor text. This italic vanilla text describes the monster.` |
| Effect | Sample Effect | Dark | 7 | Dragon/Effect | 2500/2000 | E1 |
| Ritual | Sample Ritual | Light | 7 | Dragon/Ritual/Effect | 2500/2000 | E1 |
| Fusion | Sample Fusion | Fire | 7 | Dragon/Fusion/Effect | 2500/2000 | E1 |
| Synchro | Sample Synchro | Wind | 7 | Dragon/Synchro/Effect | 2500/2000 | E1 |
| Xyz | Sample Xyz | Water | 4 | Dragon/Xyz/Effect | 2500/2000 | E1 |
| Token | Sample Token | Earth | 1 | Dragon | 0/0 | `This card can be used as any Token.` |
| Spell | Sample Spell | (Spell) | – | Spell Card, icon Equip | – | `[REQUIREMENT] Pay 500 LP.` ⏎ `[EFFECT] Draw 1 card.` |
| Trap | Sample Trap | (Trap) | – | Trap Card, no icon | – | `[REQUIREMENT] When your opponent attacks.` ⏎ `[EFFECT] Negate the attack.` |

E1 = `[REQUIREMENT] Send the top card of your Deck to the GY.` ⏎ `[EFFECT] This card gains 500 ATK until the end of this turn.`
Every card has Set ID `RD/ABC-EN001`, serial `0123456789`, and no art (white art box).

---

## 3. Rush layout geometry (our measurement notes)

All values are in the **421 × 614** coordinate space (1 unit = card width / 421). Use them as starting positions and fine-tune against `reference-renders/`.
**Record every correction in §F and update this table.**

| Element | Box (left, top, w, h) | Font / notes |
|---|---|---|
| Frame | 0, 0, 421, 614 | `frames/<template>.png`, drawn **on top of** the art |
| Card art | 22, 61, 376, 380 | Drawn behind the frame. Crop aspect 376:380. |
| Name | 28, 4, 310, 48 | Matrix SC 46 px, nowrap and squashed. Black; **white on Xyz**. |
| Attribute | 345, 22, 54, 54 | Monsters: the chosen attribute, or **Void** when none. Spell/Trap: the SPELL/TRAP icon, forced. This covers the frame's circle credit. |
| Level badge | 24, 370, 63, 68 | Star badge (Normal star; Xyz star for Xyz). No badge on Spell/Trap. |
| Level number | 32, 392, 45, – | Eurostile 28 px, weight 600, centred, white fill, 3 px stroke (#dc3523 on the Normal star, #000 on the Xyz star) |
| Type line (monster) | 36, 443, 350, 30 | Stone Serif SC 16 px, `dy` +2 so the capitals centre on the brackets. `[` bracket image at left 30 (5×15, top 447). `]` at `37 + measuredTextWidth`. |
| Type line (Spell/Trap) | 38, 443, 330, 20 | Same font and brackets. Optional 20×20 property icon at `left = textWidth + 20`, top 443. `]` at `textWidth(+iconWidth) + 42`. |
| Effect text | 30, 466, 360, 103 | Matrix Book 18 px, justified, auto-shrink. **Normal template: Stone Serif italic.** |
| ATK | 146, 411, 75, – | Eurostile 19.25 px, weight 600, right-aligned, white with a 3 px #000 stroke, `dy` +4.5 so the digits centre on the grey bar (rows 410–439). Monsters only. |
| DEF | 276, 411, 75, – | Same as ATK |
| Serial (bottom-left) | 23, 577, 133, – | Stone Serif 12 px, white |
| Set ID (bottom-right) | 264, 576, 131, – | Stone Serif 12 px, white, right-aligned |
| Copyright | – | Rush cards have none |

Canvas text `top` in NCM is the **top of the first line box**, and each line is drawn at `top + n × fontSize` on the baseline. When moving to DOM, expect to shift text down by roughly one line-height minus the descent, and calibrate against the renders.
Effect text is rendered **as typed**, with no automatic bolding (decided).

### 3a. Font map

| Role | Family name (as NCM uses it) | File in `site/css/fonts/` | Fallback stack |
|---|---|---|---|
| Name | Matrix Regular Small Caps | `Matrix Regular Small Caps.ttf` | Spectral SC, serif |
| Effect text | Matrix Book | `Yu-Gi-Oh! Matrix Book.ttf` | Spectral, serif |
| Type line | Stone Serif Small Caps | `Yu-Gi-Oh_ITC_Stone_Serif_Small_Caps_Bold.ttf` | Spectral SC, serif |
| Set ID, Serial | Stone Serif | `StoneSerif.otf` | Amiri, serif |
| Normal flavour (italic) | NCM asks for "Stone Serif Italic", which it does not ship, so it renders as **Amiri italic** | `AmiriItalic.ttf` (OFL, self-hosted; see §F) | Amiri, serif |
| ATK/DEF, level number | Eurostile Candy W01 (Regular + Bold) | `Eurostile Candy W01 Regular.ttf`, `… Bold.ttf` | Crimson Text, serif |

Rename the files to web-safe names when copying (no spaces or `!`). pokeoh-hub loads fonts through the `Font` enum and a `fonts: FontFace[]` list in `src/utils/fonts.ts`, emitted as `GlobalStyles` in `src/pages/_document.page.tsx`. Entries support `ttfOnly: true` for fonts with no woff/woff2 files. Extend it for `.otf`, or convert the fonts to woff2.

---

## 4. Architecture

### 4.1 The source repo (pokeoh-hub) and what happens to each part

The tech stack stays: Next.js 12, React 17, TypeScript, Zustand, MUI v5 + Emotion, React Hook Form, `html-to-image`, `react-easy-crop`. The path aliases in use are `@cardEditor/*`, `@utils/*`, `@css`, `@components/*`; check `tsconfig.json`.

**⚠️ Trap: `src/features/cardEditor/cardOptions/components/` mixes pokeoh-specific form blocks with generic plumbing you must KEEP.** Don't delete `cardOptions/` wholesale. Move the keepers out first (e.g. to `src/features/cardEditor/editor/`), then delete the rest.

| Path (in pokeoh-hub) | Fate |
|---|---|
| `cardOptions/components/atoms/ImportExport/**` (Load Directory / Load / Save / Save As / New + dialogs, `utils.ts`) | **KEEP**. Rewire to the `RushCard` schema. See pokeoh `docs/save-load.md` (read it before deleting it). |
| `cardOptions/components/atoms/CardDownloader/**` (`utils.ts` = `makeCanvas`/`makeCardPngBlob`; `components/ShareButton`) | **KEEP** |
| `cardOptions/components/blocks/ImagesForm/**` (image list, upload, online search, crop) | **KEEP and simplify** to a single art image |
| `cardOptions/components/CardOptionsForm/` | **REWRITE** as the Rush form. It holds `fileHandle`/`directoryHandle` state and renders `ImportExport` twice, so keep that wiring. |
| `cardOptions/components/blocks/{BasicsForm,CardInfoForm,DexStatsForm,FooterBarForm,MovesForm,ParseNotesForm,DebugForm}`, `atoms/{CustomIconSelector,DamageModifierButton,IconPickerButton,NewFeatureHelpText,TextFormattingTooltip}` | DELETE (after the new form exists, so you have a reference while writing it) |
| `cardOptions/{badgeIcon,baseSet,rarity,rarityIcon,rotationIcon,setIcon,spiritSubtype,subtype,supertype,traits,type,variation,zone,data.ts,defaults.ts,hooks,store.ts,types.ts,utils}` | DELETE (replaced by `RushCard` + store) |
| `cardEditor/cardLogic/**`, `cardEditor/parseNotes/**`, `cardEditor/cardDebug/**` | DELETE |
| `cardStyles/constants.ts` | **KEEP and modify**: `cardImgWidth = 421`, `cardImgHeight = 614` (was 747×1038). `baseEmphemeralUnit` (16) is the font-size used on export. Re-derive it so that 1em = 1 unit of 421-space, **or** keep 16 and express positions as `units/16 em`. Pick one and document it. |
| `cardStyles/components/CardDisplay/{index.tsx,styles.ts}` | **REWRITE**. Keep the mechanism: `useMeasure` → debounced `setEmphemeralUnit(width)` → `$fontSize` on `CardContainer`, height = width × (614/421), `id={cardId}` (export clones `#card`). Replace all pokeoh children with Rush layers. Note the misspelled `emphemeralUnit` / `setEmphemeralUnit` names in the store. |
| `cardStyles/components/atoms/DisplayImg`, `atoms/PlacementBlock` | **KEEP** (DisplayImg is required for export) |
| `cardStyles/components/{blocks/*,fields/*}`, other atoms | DELETE |
| `cardStyles/{store.ts,hooks,defaults.ts,types.ts,utils}` | Shrink to what the Rush display needs (ephemeral unit, maybe the frame path) |
| `src/components/{ImgCropper,CroppedImg,inputs/*,AccordionForm,ThemeToggle,Favicon,SelectorMenuItem,…}` | KEEP |
| `src/pages/creator/**` (incl. `atoms/SetCardLoader` = the `?set=&card=` deep link) | KEEP, adapt |
| `src/pages/sets/{index.page.tsx,print.page.tsx,printStyles.ts,styles.ts,atoms/{SetGrid,CardGrid,CardViewer}}` | KEEP, adapt to 421:614 and 59×86 mm |
| `src/pages/index.page.tsx` (home), `src/layout/{Header,Footer,SEO}` | KEEP, rewrite the copy for rush-hub. Footer gets the AlixSep credit. |
| `src/utils/{withBasePath,sets,setsData(generated),theme,findById,isPresent,normalizeLookupName,fonts}.ts` | KEEP. `fonts.ts` is rewritten for the YGO fonts. |
| `src/utils/cardImgPaths.ts`, `src/utils/fetchYugipediaFlavorText.ts` | DELETE |
| `scripts/{createSetsData.js,renderCards.js,verify-page.js}` | KEEP, adapt. `renderCards.js` drives a running dev server (`--url`, default `http://localhost:3000`). |
| `scripts/{createCardImgPathArray.js,organizeFiles.js}` | DELETE (pokeoh-only) |
| `package.json` scripts | `create:data` currently = `createCardImgPathArray && create:sets`, and `prestart`/`prebuild` call it. Change `create:data` to just run `create:sets` (or drop it and point `prestart`/`prebuild` at `create:sets`). Rename the package `"pokeoh"` → `"rush-hub"`. |
| `public/assets/cards/**` (124 MB), `public/assets/{icons,symbols,images}` pokeoh content, `public/sets/**` (176 MB), `cards/**` | DELETE (keep `public/assets/fallbackCard.png` if it's still referenced, otherwise replace it with a Rush placeholder) |
| `public/fonts/*` (Frutiger, Futura, Gill Sans, Beleren, MPlantin, Pokémon symbols…) | DELETE, and replace with the 6 YGO fonts |
| `docs/*.md` (9 pokeoh feature docs) | DELETE after reading `save-load.md` and `set-browser.md`, which describe systems we keep. Write rush-hub versions in Phase 7. |
| `.claude/skills/generate-flavor`, `.claude/settings.local.json` | DELETE the skill. Keep settings only if they're generic. |
| `.github/workflows/deploy.yml`, `next.config.js`, `start-dev.bat`, `stop-dev.bat`, ESLint/TS config | KEEP (see §5 for deploy edits) |

### 4.2 Card model: flat, English-only, no rarity
Nine templates × one style is a **lookup table**, not a merge tree.

```ts
type Template = 'normal'|'effect'|'ritual'|'fusion'|'synchro'|'xyz'|'token'|'spell'|'trap';
type Attribute = 'dark'|'divine'|'earth'|'fire'|'light'|'water'|'wind'|'none';
type SpellTrapIcon = 'none'|'continuous'|'counter'|'equip'|'field'|'quickPlay'|'ritual';

interface RushCard {
  schemaVersion: 1;
  template: Template;
  name: string;
  attribute: Attribute;          // monsters only; Spell/Trap force the SPELL/TRAP icon
  level: number;                 // Xyz → labelled "Rank", same badge slot
  typeLine: string;              // e.g. "Dragon/Effect"; free text
  icon: SpellTrapIcon;           // Spell/Trap only
  effect: string;                // "\n" = paragraph break; rendered as typed
  atk: string; def: string;      // strings so "?" works
  setId: string; serial: string;
  image: { src: string; crop: CropArea } | null;   // src is a base64 data URL, as in pokeoh (≈2 MB/card JSON)
}
```

A `templates.ts` table maps each template to: frame file, `isMonster`, `hasAtkDef`, `hasLevel`, star (`normal`/`xyz`),
level stroke colour, name colour (white for Xyz), and effect font (italic Stone Serif for Normal). The form reads these
flags to show or hide fields. Spell and Trap: `isMonster=false`, no level, no ATK/DEF.

### 4.3 Renderer: DOM + `em` units
- **Scaling:** the container's font-size is the ephemeral unit, and every position is in `em` so the card scales with the preview. Export clones `#card` at 421×614 px with `font-size = baseEmphemeralUnit` (see `CardDownloader/utils.ts#makeCanvas`), so the layout must depend only on `em`.
- **Positioning helper:** `<Box at={[l, t, w, h]}>` converts 421-space units to `em`.
- **`FitText`** (our implementation): auto-shrink the font in a `useLayoutEffect` loop until `scrollHeight ≤ box height` (effect box); squash `nowrap` lines with `transform: scaleX(avail/actual)` and `transform-origin` matched to the alignment (name, type line); native `text-align: justify` with `text-align-last: left`; `white-space: pre-line` for `\n` paragraphs. **Re-run the fit after fonts load** (`document.fonts.ready`) and on export clones.
- **Stroked numerals** (ATK/DEF/level): `paint-order: stroke fill` + `-webkit-text-stroke`. Check how `html-to-image` renders them.
- **Type-line brackets:** measure the rendered text width (a ref's `getBoundingClientRect` in em-space), then place the `]` image and the Spell/Trap icon from it.

### 4.4 Save/Load
Reuse the pokeoh `ImportExport` system as it is (working directory via `showDirectoryPicker`, paired `<name>.png` + `<name>.json` written side by side, `findSiblingFileHandle`, unsaved-changes dialog, Save As, New), with the new `RushCard` schema v1 and **no migration from pokeoh JSON**. A loaded file with a missing or foreign `schemaVersion` should show an error, not crash.

### 4.5 59 × 86 mm size, export, Set Browser, Print
- **Preview:** aspect **421:614**.
- **Export:** PNG at exactly **421 × 614 px** (`cardImgWidth/Height` constants). Filename from the card name.
- **Set Browser (`/sets`):** pipeline `cards/sets/<SetId>/` (local staging; only `cover.png` is tracked) → `npm run create:sets` promotes it into `public/sets/<SetId>/{cards/<slug>.png + <slug>.json, thumb/<slug>.webp, cover.webp}` (tracked) and regenerates `src/utils/setsData.ts` (generated, never hand-edit). The `.gitignore` rules at the bottom of pokeoh's `.gitignore` produce this and must be kept. Adapt `createSetsData.js` to read the display name from `name` and the number from `setId` in the `RushCard` JSON. Thumbnails and the grid use 421:614. The `?set=&card=` deep link (`SetCardLoader`) loads a `RushCard`.
- **Print (`/sets/print?set=<SetId>`):** cells are **59 × 86 mm**. 3×3 = 177 × 258 mm fits A4 (210 × 297) with 16.5 / 19.5 mm margins. Keep the cut marks. A native 421 px image at 59 mm prints at ≈ 181 DPI (slightly soft), which follows from the native-export decision.
- **Rounded corners:** ~2.5 mm on real cards, shown as a guide in preview/print only. Exports stay square.

---

## 5. GitHub repo + CI/CD

### Repo creation: fresh `rush-hub`, new history
pokeoh-hub's git pack is **~778 MB** (card-art history), so start clean:
1. `git clone --depth 1 https://github.com/JLtheking2/pokeoh-hub.git D:\GitRepos\rush-hub`, delete `D:\GitRepos\rush-hub\.git`, then `git init -b master`.
2. Strip the pokeoh assets and code **before the first commit**, so none of the ~300 MB enters history.
3. Credits in the README: pokecardmaker.net → pokeoh-hub → rush-hub; Rush frames by AlixSep; layout reference Neo New Card Maker (ygopro.org); takedown contact line.
4. `gh repo create JLtheking2/rush-hub --public --source . --remote origin --push`

### Deploy workflow (the only workflow)
- Start from pokeoh-hub's `.github/workflows/deploy.yml`. It triggers on `push: [master]` + `workflow_dispatch`, has `permissions: contents: read, pages: write, id-token: write`, uses concurrency group `pages`, Node 22 with the npm cache, a `.next/cache` cache, `npm ci` with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`, `npm run build` with env `NEXT_PUBLIC_BASE_PATH`, `NEXT_PUBLIC_ENVIRONMENT=production`, `NEXT_TELEMETRY_DISABLED=1`, `touch out/.nojekyll`, then configure-pages / upload-pages-artifact (`path: out`) / deploy-pages.
- Changes:
  - `NEXT_PUBLIC_BASE_PATH: /rush-hub`
  - Add **`npm run typecheck`** and **`npm run lint`** steps before `npm run build`. A failing check stops the deploy.
  - Drop the `fetch-depth` / "300 MB of card art" comment, since it no longer applies.
- `next.config.js` reads `NEXT_PUBLIC_BASE_PATH` into `basePath` and `assetPrefix`. Runtime asset URLs go through `src/utils/withBasePath.ts`, so **every `/assets/...` or `/fonts/...` URL in new code must use `withBasePath`**, or it will 404 on Pages.
- Enable Pages from Actions: `gh api -X POST repos/JLtheking2/rush-hub/pages -f build_type=workflow`. If Pages already exists, use `-X PUT` on the same endpoint.
- No secrets are needed.
- Live URL: **https://jltheking2.github.io/rush-hub/**. Check deploys with `gh run list --repo JLtheking2/rush-hub` / `gh run watch`.

---

## 6. Phased checklist

### Phase 0: Research and decisions ✅
- [x] Research NCM, download assets and fonts, capture reference renders (2026-09-26)
- [x] All design decisions made (§0)

### Phase 1: Repo bootstrap (≈ 0.5 day)
- [x] Shallow-clone pokeoh-hub → `D:\GitRepos\rush-hub`, delete `.git`, `git init -b master`
- [x] **Copy this PLAN.md into the repo root**, and replace the Desktop copy with a stub pointer (see §A)
- [x] Move the keepers out of `cardOptions/components/` (ImportExport, CardDownloader, ImagesForm) per §4.1
- [x] Delete everything marked DELETE in §4.1: code, assets, fonts, sets, scripts, docs, skill
- [x] Rename the package, site title, SEO and favicon to rush-hub, and fix the `create:data`/`prestart`/`prebuild` scripts
- [x] Get to a **building empty shell**: `/creator` renders a blank 421:614 card, `/sets` renders empty, and typecheck, lint and `npm run build` all pass
- [x] Rewrite `CLAUDE.md` to a minimal rush-hub core, pointing to `PLAN.md` as the handover doc, so no future agent follows pokeoh instructions
- [x] First commit → `gh repo create JLtheking2/rush-hub --public --source . --remote origin --push`
- [x] `deploy.yml`: base path `/rush-hub` + typecheck/lint gates. Enable Pages from Actions.
- [x] Confirm the deploy succeeded and `https://jltheking2.github.io/rush-hub/creator` loads (screenshot check)

### Phase 2: Card model and state (≈ 1 day)
- [x] `RushCard` type, `templates.ts` table, attribute and Spell/Trap icon enums
- [x] One Zustand store `useRushCardStore` in place of the options/logic/styles triple
- [x] Default card per template (switching template keeps the shared fields and resets the irrelevant ones)
- [x] Rewire ImportExport (save/load/save-as/new/load-directory) to `RushCard` schema v1, and reject foreign JSON cleanly

### Phase 3: Assets (≈ 0.5 day)
- [x] 9 frames (`border/<T>.rush.png`) → `public/assets/rush/frames/<template>.png`
- [x] Attribute icons (7 attributes + Void + Spell + Trap) → `public/assets/rush/attributes/`
- [x] Star badges (Normal, Xyz) → `public/assets/rush/stars/`
- [x] Spell/Trap property icons (6) and brackets (4) → `public/assets/rush/icons/`
- [x] 6 fonts → `public/fonts/` (web-safe names), `utils/fonts.ts` entries with Google fallbacks (§3a)
- [x] Wait on `document.fonts.ready` before export (`makeCanvas`) and before fit measurement (`useFontsReady` hook exists; **Phase 4's `FitText` must use it**, nothing measures yet)
- [x] Credits: AlixSep and upstream projects in the README + site footer

### Phase 4: Renderer, `CardDisplay` rewrite (≈ 2–3 days)
- [x] Container at 421:614 with the ephemeral unit, and `cardImgWidth/Height = 421/614`
- [x] `<Box at={[l,t,w,h]}>` helper (421-space → em)
- [x] Layers: Art (cropped) → Frame → Attribute → Level badge + number → Name → Type line with brackets and icon → Effect → ATK/DEF → Serial / Set ID
- [x] `FitText`: auto-shrink, `scaleX` squash, justify, `\n` paragraphs, re-fit after fonts load
- [x] Stroked numerals (ATK/DEF/level), checked in both the preview and the exported PNG
- [x] Name colour: white on Xyz, black otherwise
- [x] Spell/Trap: no level or ATK/DEF, forced SPELL/TRAP attribute, icon after the text inside the brackets
- [x] Normal: italic flavour font
- [x] Xyz: Xyz star with a black stroke, and the form label reads "Rank" (renderer half done: the badge uses the Xyz star; the label comes from `templates[t].levelLabel` in Phase 5)
- [x] **Visual-diff script** (`scripts/compareReference.js`): build each §2 sample card in the creator, export it, and overlay it at 50 % on the matching `reference-renders/*.png` (path passed as an argument, since the renders aren't in the repo). Aim for ±2 px, and log the corrections in §F and §3. **Done: `npm run compare:ref -- <referenceDir>`; all templates are 0.6–1.3 % differing pixels (Trap excepted, see §F).**

### Phase 5: Editor form (≈ 1 day)
- [x] Template picker (9, with frame-colour swatches)
- [x] Name, Attribute (icon menu), Level/Rank (label from `templates[t].levelLabel`), Type line (free text), Spell/Trap icon
- [x] Effect textarea (plain, `\n` = new paragraph)
- [x] ATK/DEF, Set ID, Serial (with a randomise button)
- [x] Image upload/search + crop at the 376:380 aspect (the art layer assumes the saved crop has the window's aspect; `ImgItem` still uses 421:614)
- [x] Show/hide fields from the template flags
- [x] Recapture `reference-renders/Trap.rush.png` with the frame loaded (pink border); `compare:ref` Trap now 1.21 %

### Phase 6: Export, sets, print (≈ 1 day)
- [ ] PNG export at exactly 421 × 614, filename from the card name
- [ ] `render:cards` batch renderer on the new renderer and schema
- [ ] `createSetsData.js`: read `name`/`setId` from the `RushCard` JSON, thumbnails at 421:614
- [ ] `/sets` grid and full-size viewer at 421:614; the deep link loads a `RushCard`
- [ ] `/sets/print`: 59 × 86 mm cells, 3×3 on A4, cut marks
- [ ] A sample set built from the 9 §2 sample cards, so the Set Browser and print page aren't empty on first deploy

### Phase 7: Docs and polish (≈ 0.5 day)
- [ ] Full rush-hub `CLAUDE.md` (core only) + `docs/` for: renderer & geometry, text fitting, save/load schema, set browser & print
- [ ] README: purpose, credits and takedown contact, scripts, deploy
- [ ] Home page rewrite
- [ ] Claude memory for rush-hub (carry over "keep README in sync")
- [ ] Ask the user whether to delete `PLAN.md` or trim it to a history, per §A

**Rough total: 6–8 working days.** Most of the risk is in Phase 4 (getting the text fitting to match the reference renders).

### Out of scope (decided; don't build)
- Rarity (foils, silver/gold names)
- LEGEND badge, MAXIMUM monsters, auto-bold effect labels, Spell/Trap property text
- Non-English text and JP layout
- Higher-than-native export resolutions
- PR workflow, PR CI, branch protection
- The other NCM templates and styles (Link, Pendulum, Dark Synchro, Unity, Skill, Rainbow, Anime, standard style)
- Parse-notes shorthand and Yugipedia lookups (pokeoh features, not carried over)

---

## F. Findings log  ← append non-obvious discoveries here (newest last, dated)

- **2026-09-26:** The NCM Rush frames have "MADE BY ALIXSEP" in the top-right circle and a small "ALIXSEP" mark at the left end of the ATK/DEF bar. The attribute icon (54×54 at 345,22) covers the circle credit; NCM shows the Void icon when no attribute is set.
- **2026-09-26:** Rush style has star badges only for Normal, Xyz and Rainbow. Negative, Yellow and Galaxy `.rush.png` return 404.
- **2026-09-26:** Scripting the live site: seeding `localStorage["ccms"]` and reloading doesn't work, because the `beforeunload` handler rewrites it with the current state. Drive the form controls instead (`label:has-text(...) select|input|textarea`).
- **2026-09-26:** pokeoh-hub's export (`CardDownloader/utils.ts#makeCanvas`) clones `#card` into a hidden `#temp` div at fixed `cardImgWidth × cardImgHeight` px with `font-size = baseEmphemeralUnit`, so native export is only a constants change. It also swaps failed images for a transparent pixel and has a 15 s timeout.
- **2026-09-26:** pokeoh card JSON embeds the art as a base64 data URL (~2 MB per card). That's why staging copies under `cards/sets/` are gitignored and only `public/sets/` is tracked.

- **2026-09-26 (Phase 1):** Cloned from the local pokeoh-hub checkout (`git clone --depth 1 file:///D:/GitRepos/pokeoh-hub`) instead of the GitHub URL in §5 — same tip, no network pull; then deleted `.git` and re-inited.
- **2026-09-26 (Phase 1):** The §4.1 KEEP set did **not** compile on its own. ImportExport/CardDownloader/ImagesForm/SetCardLoader all used the old `cardOptions` store + hooks, and files in neither list pulled deleted code in via barrels: `cardStyles/index.ts` (→ `getCardImagePath` → `cardImgPaths`), `cardEditor/types.ts`, `src/routes.ts` (`MoveBackground`/`NameSymbol` types, `Assets.*` helpers), `components/ImgCropper/styles.ts`. Resolution: pulled a **minimal** `RushCard` type + `useRushCardStore` forward from Phase 2 (`src/features/cardEditor/card/`), rewired the keepers to it, trimmed `cardStyles/index.ts` to `constants` + `store`, and reduced `routes.ts` `Assets` to `{ Root }`. Phase 2 still owns `templates.ts`, per-template defaults, and real JSON validation (`applyCardJson` currently only checks `schemaVersion === 1`).
- **2026-09-26 (Phase 1):** Keepers now live in `src/features/cardEditor/editor/{ImportExport,CardDownloader,ImagesForm,CardOptionsForm,utils}`. `DeprecatedAttributesDialog` deleted (no migration, §4.4); `ImportButton` shows a "not a valid rush-hub card" dialog on bad JSON. Save/Save As/download filenames use `getSuggestedCardFileName(name, setId, ext)` (fallback "Rush Hub").
- **2026-09-26 (Phase 1):** `ImagesForm` was simplified to a **single art image** (`card.image`) now — upload, crop, delete, web search. The drag-drop layer list, background colour picker, tooltip and default-crop settings were deleted. The cropper aspect is still the whole-card 421:614; **Phase 5 must switch it to the 376:380 art window.** The `ImgCropper` `overlayImgSrc` prop is currently unused (Phase 5 can pass the frame).
- **2026-09-26 (Phase 1):** `utils/findById.ts` and `hooks/{useIdentifyState,useBase64Image}.ts` were deleted too (they depended on the deleted `IdentifierInfo` / had no remaining users). `utils/fonts.ts` keeps its structure, with a `Font` enum of the 5 YGO family names and an empty `fonts` list; Phase 3 fills it. Home page and 404 are text-only (screenshots/psyduck deleted); `HomeNavThumbnail` in `pages/styles.ts` is now unused.
- **2026-09-26 (Phase 1):** `CardDisplay` renders a plain white 421:614 container (no layers yet). The height state starts at 0 and fills in after the 250 ms `useDebounce`, so a screenshot taken the instant `text=DOWNLOAD` appears shows no card — wait ~1 s. Verified card 570×831 px in a 1280 viewport and Download → exactly 421×614 PNG.
- **2026-09-26 (Phase 1):** Favicon set (`public/favicon/*`) was regenerated as a placeholder red-"R" monogram with `sharp` (same filenames `Favicon` references; `.ico` is a PNG-in-ICO). Replace it whenever a real logo exists. **→ Superseded: replaced with pokeoh-hub's favicon, see the last entry below.**
- **2026-09-26 (Phase 1):** Windows/Git Bash gotcha: `NEXT_PUBLIC_BASE_PATH=/rush-hub npm run build` from Bash gets MSYS-path-mangled to `C:/Program Files/Git/rush-hub`. Prefix with `MSYS2_ENV_CONV_EXCL=NEXT_PUBLIC_BASE_PATH` (or use PowerShell). CI (Linux) is unaffected.
- **2026-09-26 (Phase 1):** `scripts/createSetsData.js` copes with a missing `cards/sets` (logs a line, emits an empty `setsData.ts`). `verify-page.js` / `renderCards.js` now wait on `text=DOWNLOAD` (the old `text=Card Type` no longer exists).

- **2026-09-26 (post-Phase 1):** Favicon set replaced with pokeoh-hub's: the 9 image files in `public/favicon/` (`android-chrome-{48x48,192x192,512x512}.png`, `apple-touch-icon.png`, `favicon-{16x16,32x32}.png`, `favicon.ico`, `mstile-150x150.png`, `safari-pinned-tab.svg`) are byte-identical copies. `manifest.json` / `site.webmanifest` were deliberately **not** copied, so they keep the "Rush Hub" name; `browserconfig.xml` and the theme colour `#d35337` already matched. The header logo (`Header/index.tsx`) uses `android-chrome-192x192.png`, so it changed too. This supersedes the placeholder "R" monogram entry above.

- **2026-09-26 (Phase 2):** `templates.ts` exposes `templates` (Record), `templateList`, `attributes`, `spellTrapIcons`, `isIconValidFor`. Asset paths it references (must be created in Phase 3, wrapped in `withBasePath` by consumers): `/assets/rush/frames/<template>.png`, `/assets/rush/attributes/{Dark,Divine,Earth,Fire,Light,Water,Wind,Void}.png` (`none` → Void; Spell/Trap icons are chosen by the renderer from `spellTrap`), `/assets/rush/icons/{Continuous,Counter,Equip,Field,Quick-play,Ritual}.png`.
- **2026-09-26 (Phase 2):** `switchTemplate` rules: name/effect/setId/serial/image always kept; attribute/level/ATK/DEF kept only monster→monster (reset when entering/leaving Spell/Trap); type line follows the new template unless the user edited it; Spell/Trap icon kept only if valid for the new template (Counter = Trap only; Equip/Field/Quick-Play/Ritual = Spell only; Continuous = both).
- **2026-09-26 (Phase 2):** `parseRushCard` rejects non-JSON, non-objects, missing `schemaVersion` (pokeoh JSON lands here), other versions, unknown `template`, and wrong-typed fields (naming the field; `level` must be an integer 0–12). Missing fields take the template's defaults; unknown keys are dropped; output key order is canonical. **`applyCardJson` now returns `{ ok: true } | { ok: false; error }`** (was boolean); ImportButton and SetCardLoader show the reason. `setTemplate` doesn't touch `savedJson`, so switching counts as an unsaved edit. Lint gotcha: airbnb config forbids `for…of` and global `isFinite`.

- **2026-09-26 (Phase 3):** Asset map: `border/<T>.rush.png` → `frames/<lowercase>.png`; `attribute/<A>.rush.png` → `attributes/<A>.png` (Dark…Wind, Void, Spell, Trap); `star/{Normal,Xyz}.rush.png` → `stars/{normal,xyz}.png`; `icon/*` and `text/*bracket*.png` → `icons/` with original names (Quick-play keeps its hyphen). Rainbow/Splice/foil art was skipped. `templates.ts` gained `starIcons`, `spellTrapAttributeIcons`, `bracketIcons` (root-relative; wrap in `withBasePath`).
- **2026-09-26 (Phase 3):** Fonts are shipped as-is (30–64 KB, no woff2) as `public/fonts/{MatrixRegularSmallCaps,MatrixBook,StoneSerifSmallCapsBold,EurostileCandyRegular,EurostileCandyBold}.ttf` + `StoneSerif.otf`. `FontFace` in `utils/fonts.ts` now takes `format: 'ttf'|'otf'` + optional `weight`/`style` (the old `ttfOnly` flag is gone); Eurostile registers 400 and 700 under one family. `fontStacks` exports the per-role `font-family` strings with their Google fallbacks; `_document.page.tsx` loads Spectral, Spectral SC, Amiri and Crimson Text from Google.
- **2026-09-26 (Phase 3):** `makeCanvas` now awaits `document.fonts.ready` before cloning. `src/hooks/useFontsReady.ts` is ready for Phase 4's `FitText` to re-measure on font load. Footer got a credit caption (AlixSep, Neo New Card Maker, pokecardmaker.net via pokeoh-hub) that wraps cleanly at 400 px.
- **2026-09-26:** User rule: agents commit locally but never push (see §A, §C, §0).

- **2026-09-26 (Phase 4):** Renderer decisions: `baseEmphemeralUnit` stays 16 and positions are `u(n) = n/16 em`; all text is fitted at native px in a hidden measurer (`cardStyles/utils/measureText.ts`) so preview and export share one fit (no re-fit on export clones; supersedes the §4.3 note). `geometry` lives in `cardStyles/layout.ts`; the layers are in `components/layers/index.tsx` (one file, not one per layer).
- **2026-09-26 (Phase 4):** Gotcha: never set a positioning `em` (left/top/width/height) on the same element that sets its own `font-size` — the em then refers to that font size. `FitText` nests an inner sized div in a `CardBox`; stroke widths on the inner element are divided by the font size for the same reason.
- **2026-09-26 (Phase 4):** Measured DOM vs canvas offsets (`dy`, units): name +9, level number +5, ATK/DEF +3 (and left −1), effect +1, serial/set ID +2, Normal flavour (Amiri italic) +5. Type line and Spell/Trap geometry needed no correction. **→ Superseded for the type line and ATK/DEF, see the 2026-09-26 alignment entry below (now `dy` +2 and +4.5).**
- **2026-09-26 (Phase 4):** Type-line details (from NCM, corrected): Spell/Trap property icon at `left = textWidth + 40`, `]` at `textWidth + 20 (icon) + 42` (or `+ 42` with no icon); monster `]` at `floor(37 + textWidth)`. We clamp `textWidth` to the box width so `]` follows squashed text (NCM lets it run off the card). **Xyz uses a white type line and white brackets** (it sits on the black strip); other templates black.
- **2026-09-26 (Phase 4) — superseded by the Phase 5 entry below (Trap ref recaptured):** The reference `Trap.rush.png` was captured with **no frame** (transparent background), so its whole-image diff is ~40 % and not meaningful; Trap text positions match by eye. The Spell reference validates the shared backrow geometry (0.7 %). Regenerate the Trap ref if a real diff is ever needed.
- **2026-09-26 (Phase 4):** Fonts: NCM's "Stone Serif Italic" is not shipped, so the reference falls back to Amiri italic. Google's Amiri stylesheet is cross-origin and **cannot be embedded by html-to-image**, so the export fell back to a generic serif; `AmiriItalic.ttf` is now self-hosted (registered as "Amiri Italic"). `useFontsReady` now calls `document.fonts.load()` per registered face (fonts load lazily, so `fonts.ready` alone resolved too early). Stroked numerals (`-webkit-text-stroke` + `paint-order`) render correctly in the exported PNG.
- **2026-09-26 (Phase 4):** `ImgItem` still crops at 421:614 — Phase 5 must switch to 376:380. With no saved crop the art layer uses `object-fit: cover`.

- **2026-09-26 (Phase 5):** **Supersedes the Phase 4 Trap entry:** `reference-renders/Trap.rush.png` was recaptured (old copy kept as `Trap.rush.old.png`) and now has the pink frame; Trap diff is 1.21 %, in line with the rest (all nine 0.58–1.26 %). `tools/capture-refs.js` now loads playwright from rush-hub, takes optional template names (`node tools/capture-refs.js Trap`), and waits until the frame border pixel (5,300) is opaque instead of a fixed sleep, failing loudly otherwise. The first run hit a transient `UNKNOWN` error opening the output file for write to the Desktop folder; a plain retry worked.
- **2026-09-26 (Phase 5):** Picker swatches are sampled from each frame at (200, 56) (name-bar interior): normal #C08C3F, effect #B85A2F, ritual #4671AE, fusion #844195, synchro #DED7D3, xyz #000000, token #806F6C, spell #00A3A1, trap #E5579B (`TemplateInfo.swatch`). Points on the effect box or outer border are washed out or near-black.
- **2026-09-26 (Phase 5):** Form lives in `editor/CardFieldsForm/` (`TemplatePicker`, `AttributeSelector`, `SpellTrapIconSelector` + accordions Card / Text / Stats & Info). Input ids are `#<slug>-input`: `cardName level typeLine attribute stIcon effect atk def setId serial`, template chips are `[data-template=<id>]`. `ControlledSelector.value` widened to `number | string`; `InputProps` gained `helperText`. Spell shows None/Continuous/Equip/Field/Quick-Play/Ritual; Trap shows None/Continuous/Counter.
- **2026-09-26 (Phase 5):** Crop aspect now comes from `layout.art` (`artAspect` in `ImagesForm/constants.ts`); `ImgCropper`'s wrapper takes the `aspect` prop instead of a hardcoded 421:614. A non-376:380 image at zoom 1 is letterboxed inside the art window (white bands) until the user zooms/crops. That is the cropper's normal contain-fit start, not distortion.
- **2026-09-26 (Phase 5):** Gotcha for scripts: the page has two `input[type=file]` (first is ImportExport's JSON-load fallback, second is `#imgUpload-input` for art). Target by id. `FitText` now uses react-use's `useIsomorphicLayoutEffect`, removing the dev-server "useLayoutEffect does nothing on the server" warning.

## G. Session log  ← append one entry per session (newest last)

- **2026-09-26 (session 1, in pokeoh-hub):** Researched ygopro.org's card maker (NCM). Downloaded Rush frames, attributes, stars, icons, brackets, foils and fonts to `site/` (54/57 fetched; 3 expected 404s). Captured 9 reference renders with `tools/capture-refs.js`. Mapped pokeoh-hub keep/delete targets (§4.1). User made every design decision (§0). No code or repo changes yet. **Next:** Phase 1.
- **2026-09-26 (session 2, Phase 1):** Bootstrapped `D:\GitRepos\rush-hub` from a shallow local clone (fresh history), moved this file into the repo (Desktop copy is now a stub), moved the keepers into `cardEditor/editor/`, added the minimal `RushCard` model/store, rewired ImportExport/CardDownloader/ImagesForm/SetCardLoader, shrank cardStyles, deleted all pokeoh code/assets/fonts/docs/skill (~300 MB), rebranded (Rush Hub, placeholder favicon), rewrote README + CLAUDE.md, updated `deploy.yml` (base path `/rush-hub`, typecheck + lint gates). Verified: `npm run typecheck`, `npm run lint`, `npm run build` (with base path) all clean; `/creator` and `/sets` screenshots viewed; export PNG is 421×614. Then committed, created public `JLtheking2/rush-hub`, enabled Pages via `gh api`, and the first deploy run went green; the live `/creator` (https://jltheking2.github.io/rush-hub/creator) was screenshotted with no 4xx responses. Nothing half-done.
- **2026-09-26 (session 3, favicon):** Swapped the placeholder favicon set for pokeoh-hub's (image files only; hashes verified identical). Updated §B and §F. No code changes. Not pushed, so the live site still shows the old icon until the next deploy.
- **2026-09-26 (session 4, Phase 2):** Finished the card model: enum id arrays, `templates.ts` flags table, `getDefaultCard`/`switchTemplate`, `parseRushCard` validation, store `setTemplate` + new `applyCardJson` result type; rewired ImportButton and SetCardLoader to show the failure reason. Verified: typecheck + lint clean; a Node smoke test of defaults/switching/validation passed; in the running app (file-input fallback) a pokeoh-style JSON shows "Card not loaded — This isn't a rush-hub card." and a valid card loads with no dialog (the dialog screenshot was caught mid-fade, DOM text confirmed). No form UI yet (Phase 5). Nothing half-done.
- **2026-09-26 (session 5, Phase 3):** Added the no-push rule to PLAN.md. Copied 31 assets and 6 fonts into `public/`, wired `fonts.ts` (+ Google fallbacks), added `useFontsReady` and the export fonts wait, asset path helpers in `templates.ts`, footer + README credits. Verified: typecheck + lint clean; headless Chromium: every asset URL 200, all 6 font faces `loaded`, footer credit screenshot checked at 400 px. Not re-checked after the `makeCanvas` change: the Download PNG size (still expected 421×614). Committed locally, not pushed. **Next:** Phase 4.
- **2026-09-26 (session 6, Phase 4):** Built the renderer: `units`, `layout`, `CardBox`, `FitText`, `measureText`, the nine layers, and `scripts/compareReference.js` (`npm run compare:ref`). Tuned offsets against the reference renders (0.6–1.3 % pixels differ, Trap reference is frameless). Self-hosted Amiri Italic, fixed `useFontsReady`. Verified: typecheck + lint clean; exports are 421×614; overlays viewed; preview at 1280 px and 420 px viewports matches; long name squashes, long effect shrinks, art crop works. README + CLAUDE.md updated. Committed locally, not pushed. **Next:** Phase 5.
- **2026-09-26 (session 7, Phase 5):** Recaptured the Trap reference (pink frame) with a hardened `capture-refs.js`. Added `swatch` to the template table and built the editor form (`CardFieldsForm`: template picker, name, attribute, level/rank, type line, Spell/Trap icon, effect, ATK/DEF, set ID, serial + randomise), wired into `CardOptionsForm`; switched the art cropper to 376:380; swapped `FitText` to `useIsomorphicLayoutEffect`. Verified: typecheck + lint clean; headless Chromium: all nine templates show/hide the right fields (Xyz label "Rank", Spell/Trap icon lists filtered), typing/`\n`/"?"/randomise update the card, cropper box aspect 0.9895 = 376:380, export is the expected `<setId> - <name>.png`, JSON load repopulates every input, 400 px template grid wraps to 3 columns, no page errors; `compare:ref` 0.58–1.26 % for all nine incl. Trap (overlay viewed). Committed locally, not pushed. **Next:** Phase 6.
- **2026-09-26 (alignment fix):** User reported the type line sitting too high in its `[ ]` and ATK/DEF too high in the grey bar. Measured on the Effect export (421-space rows): bracket images 447–461 (centre 454) vs our type-line text centre ≈452 (NCM's own text centre is 453, and our DOM baseline landed a further ~1 unit higher with no `dy`); grey bar rows 410–439 (centre 424.5) vs ATK/DEF fill 417–429 (centre 423), which had been tuned to match NCM pixel-for-pixel — NCM centres digits on the baked-in ATK/DEF label boxes (414–433), not on the bar. So this was calibration inherited from the reference, not a font or loading bug. Fix in `layout.ts`: type line `dy: 2` (both monster and backrow), ATK/DEF `dy: 3 → 4.5`; verified by zoomed crops (type line centred in brackets, digits centred in the bar; ATK/DEF fill now rows 419–431). This is a **deliberate departure from the reference**, so `compare:ref` rose to 0.71–1.82 % (Normal 1.25, Effect 1.51, Ritual 1.54, Fusion 1.58, Synchro 1.82, Xyz 1.60, Token 0.71, Spell 0.72, Trap 1.22); the remaining monster difference is those two strips.
- **2026-09-26 (type-line follow-up):** User asked to raise the whole type line (text + brackets) to sit centred in the frame's type strip. Probed the frames (effect/spell/xyz, x=200 and 380): the strip runs from the dark top line at row 441 to the bottom bevel at 464–465, centre ≈453. Brackets (447–461) and capitals (449–459) were centred on 454, and small caps are visually bottom-heavy, so the whole line moved up 1.5 units: brackets `top` 447 → 445.5 (`monsterBracket`/`backrowBracket`), type-line `dy` 2 → 0.5 (both specs), giving a line centre of ≈452.5. The Spell/Trap property icon (`backrowIcon`, rows 443–463, centre 453) was already centred and is unchanged. Verified with zoomed crops of Effect/Spell/Xyz. `compare:ref` went *down* again (Normal 1.19, Effect 1.40, Ritual 1.42, Fusion 1.46, Synchro 1.70, Xyz 1.48, Token 0.65, Spell 0.64, Trap 1.13 %) since NCM's own text centre is 453.
