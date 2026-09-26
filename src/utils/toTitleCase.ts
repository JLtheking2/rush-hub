/**
 * Small words Yugipedia keeps lowercase in page titles (unless they open the name).
 */
const SMALL_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'by',
  'for',
  'from',
  'in',
  'into',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
]);

/**
 * Capitalizes the first letter of each word in a card name, the way Yugipedia
 * titles are written (`dark magician of chaos` → `Dark Magician of Chaos`).
 *
 * Only first letters change — the rest of each word is left alone so names
 * like `LV` or `CyberStorm` survive. A letter after a hyphen is capitalized too.
 */
const toTitleCase = (name: string): string => {
  let isFirstWord = true;
  return name.replace(/\S+/g, word => {
    const first = isFirstWord;
    isFirstWord = false;
    if (!first && SMALL_WORDS.has(word.toLowerCase()))
      return word.toLowerCase();
    return word
      .replace(/^./, c => c.toUpperCase())
      .replace(/-(.)/g, (_, c: string) => `-${c.toUpperCase()}`);
  });
};

export default toTitleCase;
