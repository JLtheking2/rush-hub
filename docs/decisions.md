# Decisions, scope and licensing

These are the **user's** decisions from the port (2026-09-26). Don't re-open them; if one needs to change, ask the user first and update this file.

## Decision log

| Topic | Decision |
|---|---|
| Scope | Rush style only. Templates: **Normal, Effect, Ritual, Fusion, Synchro, Xyz, Token, Spell, Trap**. All Pokémon/pokeoh support dropped. |
| Card size | **59 × 86 mm** (Yu-Gi-Oh!), not 63 × 88 mm. Preview aspect 421:614. |
| Frame art | AlixSep's Rush frames **as-is**, with the "MADE BY ALIXSEP" credit and bar mark left intact. AlixSep is credited in the README and site footer. |
| Fonts | The **real fonts** (Matrix, ITC Stone Serif, Eurostile Candy) are shipped, as a non-commercial project. Google fallbacks stay in every stack. |
| Code | We write our own. The Neo New Card Maker (NCM) bundle was only a behaviour and measurement reference. |
| Renderer | **DOM + `em` units** (the ephemeral-unit pattern), not canvas. |
| Export | **Native 421 × 614 px** only. |
| Rarity | **Not supported.** No rarity field, art foils, or silver/gold names. **Exception (2026-09-29):** a per-card **Main / Extra** toggle (all templates). Extra applies NCM's Rainbow Rare treatment minus the art wash: the full-card rainbow border overlay and a white name, outlined in black so it reads on light frames. |
| Rush extras | **None.** No LEGEND, no MAXIMUM, no auto-bold `[REQUIREMENT]`/`[EFFECT]`, no Spell/Trap property text. |
| Language | **English only.** |
| Repo | `JLtheking2/rush-hub`, public, fresh history (not a GitHub fork). |
| Workflow | Single contributor, pushes straight to `master`. No PR workflow, PR CI or branch protection. The deploy workflow runs typecheck + lint itself. |
| Set Browser + Print | Kept and adapted to Rush cards and 59 × 86 mm. |
| Publishing | Agents commit locally but **never `git push`** or trigger deploys; the user publishes. |
| Rounded corners | **Deferred.** Corners stay square in preview, Set Browser and print (real cards are ~2.5 mm). |

## Out of scope (don't build)

- Rarity (art foils, silver/gold names), beyond the Extra-deck rainbow border above
- LEGEND badge, MAXIMUM monsters, auto-bold effect labels, Spell/Trap property text
- Non-English text and JP layout
- Higher-than-native export resolutions
- PR workflow, PR CI, branch protection
- The other NCM templates and styles (Link, Pendulum, Dark Synchro, Unity, Skill, Rainbow, Anime, standard style)
- Parse-notes shorthand and Yugipedia lookups (pokeoh-hub features, not carried over)

## Licensing notes

1. **The NCM code has no licence.** Treat it as all rights reserved. Don't copy it; the measured geometry in [`renderer.md`](renderer.md) is our own notes. **One deliberate exception:** NCM's `foil/Rainbow.png` is reused as-is as `public/assets/rush/foil/rainbow.png` (user decision 2026-09-29, personal non-commercial project).
2. **The frames are fan art by AlixSep.** Use them as-is, never strip or crop the credit, credit AlixSep in the README and footer, and keep the takedown-contact line in the README.
3. **The fonts are commercial.** Shipping them was a deliberate, user-accepted risk: being non-commercial doesn't by itself grant a redistribution licence.
4. Yu-Gi-Oh! and Rush Duel trade dress belongs to Konami — the same category of risk as pokeoh-hub's Pokémon trade dress.

## Lineage

pokecardmaker.net → pokeoh-hub → rush-hub. The stack (Next.js 12, React 17, Zustand, MUI v5, React Hook Form, `html-to-image`, `react-easy-crop`), the Save/Load system and the Set Browser/print pages descend from pokeoh-hub; everything Rush-specific was written new.
