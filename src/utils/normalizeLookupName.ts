/**
 * Folds typographic punctuation in a card name down to its ASCII equivalent.
 *
 * Yugipedia page titles are ASCII-only — `Fiend's Hand` is a real page, while
 * `Fiend’s Hand` (U+2019) is not. Card names on this site routinely contain
 * curly quotes and dashes, so any name used as a *lookup* key must be folded
 * first. The card's own name is left untouched — it still renders as typed.
 */
const normalizeLookupName = (name: string): string =>
  name
    .trim()
    // Single quotes / primes / acute accent used as an apostrophe
    .replace(/[‘’‚‛′´`]/g, "'")
    // Double quotes / double primes
    .replace(/[“”„‟″]/g, '"')
    // Hyphens and dashes of every width
    .replace(/[‐‑‒–—―−]/g, '-')
    // Ellipsis
    .replace(/…/g, '...');

export default normalizeLookupName;
