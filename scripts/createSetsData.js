const fs = require('fs');
const path = require('path');

const SETS_SOURCE_FOLDER = './cards/sets';
const SETS_PUBLIC_FOLDER = './public/sets';
const WRITE_PATH = './src/utils/setsData.ts';

const COVER_FILENAME = 'cover.png';
/** Card .png and .json live side by side here, so it works as a creator working directory */
const CARDS_DIRNAME = 'cards';
const THUMB_DIRNAME = 'thumb';

const THUMB_WIDTH = 320;
const COVER_WIDTH = 400;
const WEBP_QUALITY = 82;

/**
 * Pretty names for set folders. Folders without an entry fall back to their
 * folder name.
 */
const SET_DISPLAY_NAMES = {
  PKO1: 'Volume 1',
};

/**
 * `P6 - Fiend's Hand.png` -> number `P6`, name `Fiend's Hand`
 */
const CARD_FILENAME_REGEX = /^(\S*\d+) - (.+)\.png$/;

// sharp is a native module. If it failed to install we still want the site to
// build - fall back to using the full-size image as its own thumbnail.
let sharp;
try {
  // eslint-disable-next-line global-require
  sharp = require('sharp');
} catch {
  console.warn(
    'createSetsData: `sharp` is unavailable - thumbnails will be full-size copies.',
  );
}

/**
 * Turns a card name into an ASCII, URL-safe filename stem. Source filenames
 * contain spaces and typographic apostrophes (`P6 - Fiend’s Hand.png`) that are
 * awkward in URLs. The real name is read back out of the card's own `.json` in
 * phase B, so nothing is lost by slugging the filename.
 * @param {string} number
 * @param {string} name
 * @returns {string}
 */
const toSlug = (number, name) =>
  `${number} ${name}`
    .normalize('NFKD')
    // Strip combining accents, then any non-ASCII leftovers (’ -> nothing)
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .toLowerCase();

/**
 * Orders `K1, K2, ... K12, P1, ... P44` - by letter prefix, then numerically.
 * A plain string sort would place `K10` before `K2`.
 */
const compareCardNumbers = (a, b) => {
  const split = value => {
    const match = value.match(/^(\D*)(\d+)$/);
    return match ? [match[1], Number(match[2])] : [value, 0];
  };
  const [aPrefix, aNumber] = split(a.number);
  const [bPrefix, bNumber] = split(b.number);
  return aPrefix.localeCompare(bPrefix) || aNumber - bNumber;
};

/**
 * True when `source` is newer than `destination`, or `destination` is missing.
 * Lets repeat runs skip the ~62MB of copying.
 */
const isStale = async (source, destination) => {
  try {
    const [sourceStat, destinationStat] = await Promise.all([
      fs.promises.stat(source),
      fs.promises.stat(destination),
    ]);
    return sourceStat.mtimeMs > destinationStat.mtimeMs;
  } catch {
    return true;
  }
};

/**
 * Writes a downscaled webp. Without `sharp` this is a no-op - phase B then
 * falls back to pointing at the full-size image, so the page still works.
 * @param {string} source
 * @param {string} destination
 * @param {number} width
 */
const writeResizedWebp = async (source, destination, width) => {
  if (!sharp) return;
  await sharp(source)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(destination);
};

/** @returns {Promise<boolean>} */
const exists = async filePath =>
  fs.promises.access(filePath).then(
    () => true,
    () => false,
  );

/**
 * Removes files in `directory` whose name isn't in `keep`.
 * @param {string} directory
 * @param {Set<string>} keep
 */
const pruneDirectory = async (directory, keep) => {
  let entries;
  try {
    entries = await fs.promises.readdir(directory);
  } catch {
    return;
  }
  await Promise.all(
    entries
      .filter(entry => !keep.has(entry))
      .map(async entry => {
        console.info(`  pruning stale ${path.join(directory, entry)}`);
        await fs.promises.rm(path.join(directory, entry), {
          force: true,
          recursive: true,
        });
      }),
  );
};

/**
 * Phase A - promote one staged set into `public/sets/<setId>/cards`.
 *
 * `cards/sets` is a local staging area; `public/sets` is the tracked source of
 * truth. Only called for sets that actually have source PNGs, so on a fresh
 * clone (where staging is empty) there is nothing to import and the
 * already-tracked `public/sets` contents must be left completely alone.
 *
 * This phase only ever *copies files*. Everything derived from them - the
 * thumbnails, the display names, `setsData.ts` - is phase B's job, so that a
 * card edited in place in `public/sets` self-heals just like a promoted one.
 *
 * @param {string} setId
 * @param {string[]} pngFiles
 */
const importSet = async (setId, pngFiles) => {
  const sourceDir = path.join(SETS_SOURCE_FOLDER, setId);
  const publicDir = path.join(SETS_PUBLIC_FOLDER, setId);
  const cardsDir = path.join(publicDir, CARDS_DIRNAME);

  await fs.promises.mkdir(cardsDir, { recursive: true });

  const cards = [];

  pngFiles.forEach(file => {
    const match = file.match(CARD_FILENAME_REGEX);
    if (!match) {
      console.warn(
        `  skipping "${file}" - expected "<Number> - <Name>.png" format`,
      );
      return;
    }
    const [, number, name] = match;
    cards.push({ slug: toSlug(number, name), file });
  });

  let copied = 0;
  // eslint-disable-next-line no-restricted-syntax
  for (const card of cards) {
    // The .png and the .json land side by side, exactly as a creator Save
    // writes them - which is what lets `public/sets/<setId>/cards` be used as a
    // working directory directly. Both are copied verbatim, never
    // re-serialised, so a promoted file is byte-identical to the staged one.
    const pngSource = path.join(sourceDir, card.file);
    const jsonSource = pngSource.replace(/\.png$/i, '.json');
    const png = path.join(cardsDir, `${card.slug}.png`);
    const json = path.join(cardsDir, `${card.slug}.json`);

    // `isStale` only copies when *staging* is newer, so a card edited in place
    // in public/sets is never clobbered by an older staged copy.
    // eslint-disable-next-line no-await-in-loop
    if (await isStale(pngSource, png)) {
      // eslint-disable-next-line no-await-in-loop
      await fs.promises.copyFile(pngSource, png);
      copied += 1;
    }

    // eslint-disable-next-line no-await-in-loop
    if (!(await exists(jsonSource))) {
      console.warn(
        `  no .json alongside "${card.file}" - card will not be editable in the creator`,
      );
      // eslint-disable-next-line no-continue
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    if (await isStale(jsonSource, json)) {
      // eslint-disable-next-line no-await-in-loop
      await fs.promises.copyFile(jsonSource, json);
      copied += 1;
    }
  }

  // Cover art is hand-supplied (not regenerable), and is kept in git via a
  // negation rule in .gitignore.
  const coverSource = path.join(sourceDir, COVER_FILENAME);
  const coverDestination = path.join(publicDir, 'cover.webp');
  if (await exists(coverSource)) {
    if (await isStale(coverSource, coverDestination)) {
      await writeResizedWebp(coverSource, coverDestination, COVER_WIDTH);
    }
  } else {
    console.warn(`  no ${COVER_FILENAME} found for set "${setId}"`);
  }

  // One keep-set covering both halves of every card.
  const keep = new Set();
  cards.forEach(card => {
    keep.add(`${card.slug}.png`);
    keep.add(`${card.slug}.json`);
  });
  await pruneDirectory(cardsDir, keep);

  console.info(
    `  ${setId}: ${cards.length} cards (${copied} file(s) copied/updated)`,
  );
};

/**
 * Last-resort number/name when a card has no `.json` next to its image. The
 * slug is lossy (`p6-fiends-hand` can't give back `Fiend's Hand`), which is
 * exactly why the card data is the authority everywhere else.
 * @param {string} slug
 */
const fallbackCardInfo = slug => {
  const [number, ...rest] = slug.split('-');
  return {
    number: number.toUpperCase(),
    name: rest.join(' ') || slug,
  };
};

/**
 * Phase B - derive everything from the tracked files in
 * `public/sets/<setId>/cards`: refresh stale thumbnails, read each card's real
 * number and name out of its `.json`, and write `src/utils/setsData.ts`.
 *
 * Always runs, including on a fresh clone where staging is empty and phase A
 * did nothing. Because the card `.json` - not the filename - is what names a
 * card, a card saved in place from the creator is picked up here with no trip
 * back through staging.
 *
 * @returns {Promise<object[]>}
 */
const readPublicSets = async () => {
  let entries;
  try {
    entries = await fs.promises.readdir(SETS_PUBLIC_FOLDER, {
      withFileTypes: true,
    });
  } catch {
    return [];
  }

  const setDirs = entries.filter(entry => entry.isDirectory());
  const sets = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const entry of setDirs) {
    const setId = entry.name;
    const base = `/sets/${setId}`;
    const publicDir = path.join(SETS_PUBLIC_FOLDER, setId);
    const cardsDir = path.join(publicDir, CARDS_DIRNAME);
    const thumbDir = path.join(publicDir, THUMB_DIRNAME);

    let cardFiles;
    try {
      // eslint-disable-next-line no-await-in-loop
      cardFiles = await fs.promises.readdir(cardsDir);
    } catch {
      console.warn(`  no ${CARDS_DIRNAME}/ in public/sets/${setId} - skipping`);
      // eslint-disable-next-line no-continue
      continue;
    }

    const slugs = cardFiles
      .filter(file => file.toLowerCase().endsWith('.png'))
      .map(file => file.replace(/\.png$/i, ''));

    if (slugs.length) {
      // eslint-disable-next-line no-await-in-loop
      await fs.promises.mkdir(thumbDir, { recursive: true });
    }

    const cards = [];
    let rendered = 0;

    // Sequential: sharp already parallelises internally, and 56 concurrent
    // decodes of 1MB PNGs is a needless memory spike.
    // eslint-disable-next-line no-restricted-syntax
    for (const slug of slugs) {
      const png = path.join(cardsDir, `${slug}.png`);
      const jsonPath = path.join(cardsDir, `${slug}.json`);
      const thumb = path.join(thumbDir, `${slug}.webp`);

      // Regenerated whenever the image is newer, so an in-place creator Save
      // updates the grid thumbnail on the next run.
      // eslint-disable-next-line no-await-in-loop
      if (await isStale(png, thumb)) {
        // eslint-disable-next-line no-await-in-loop
        await writeResizedWebp(png, thumb, THUMB_WIDTH);
        rendered += 1;
      }

      let info;
      try {
        // eslint-disable-next-line no-await-in-loop
        const card = JSON.parse(await fs.promises.readFile(jsonPath, 'utf8'));
        info = { number: card.cardNumber, name: card.name };
      } catch {
        info = undefined;
      }
      if (!info?.number || !info?.name) {
        if (info) {
          console.warn(`  "${slug}.json" has no name/cardNumber - using slug`);
        }
        info = fallbackCardInfo(slug);
      }

      const full = `${base}/${CARDS_DIRNAME}/${slug}.png`;
      // Without sharp there are no thumbs; degrade to the full image rather
      // than emitting a path that 404s.
      // eslint-disable-next-line no-await-in-loop
      const hasThumb = await exists(thumb);
      // Null when the card has no data next to it - the Set Browser hides its
      // "Edit in Creator" button in that case.
      // eslint-disable-next-line no-await-in-loop
      const hasJson = await exists(jsonPath);

      cards.push({
        id: slug,
        number: info.number,
        name: info.name,
        thumb: hasThumb ? `${base}/${THUMB_DIRNAME}/${slug}.webp` : full,
        full,
        json: hasJson ? `${base}/${CARDS_DIRNAME}/${slug}.json` : null,
      });
    }

    cards.sort(compareCardNumbers);

    // eslint-disable-next-line no-await-in-loop
    await pruneDirectory(thumbDir, new Set(slugs.map(slug => `${slug}.webp`)));

    if (rendered) {
      console.info(`  ${setId}: ${rendered} thumbnail(s) re-rendered`);
    }

    // eslint-disable-next-line no-await-in-loop
    const hasCover = await exists(path.join(publicDir, 'cover.webp'));

    sets.push({
      id: setId,
      displayName: SET_DISPLAY_NAMES[setId] ?? setId,
      cover: hasCover ? `${base}/cover.webp` : null,
      cards,
    });
  }

  return sets.sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true }),
  );
};

/**
 * Serialises to TS source matching the repo's prettier config (single quotes,
 * unquoted keys, trailing commas), so the generated file passes `npm run lint`.
 * @param {unknown} value
 * @param {number} depth
 * @returns {string}
 */
const serialize = (value, depth = 0) => {
  const pad = '  '.repeat(depth + 1);
  const closePad = '  '.repeat(depth);

  if (value === null) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (typeof value === 'string')
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    const items = value.map(item => `${pad}${serialize(item, depth + 1)},\n`);
    return `[\n${items.join('')}${closePad}]`;
  }

  const entries = Object.entries(value).map(
    ([key, item]) => `${pad}${key}: ${serialize(item, depth + 1)},\n`,
  );
  return `{\n${entries.join('')}${closePad}}`;
};

const writeSetsData = async sets => {
  const contents = `// Generated by \`./scripts/createSetsData.js\`

export interface SetCard {
  id: string;
  number: string;
  name: string;
  thumb: string;
  full: string;
  /** Saved card data, or null when this card was promoted without a .json */
  json: string | null;
}

export interface CardSet {
  id: string;
  displayName: string;
  cover: string | null;
  cards: SetCard[];
}

const sets: CardSet[] = ${serialize(sets)};

export default sets;
`;
  await fs.promises.writeFile(WRITE_PATH, contents);
};

(async () => {
  let setDirs = [];
  try {
    const entries = await fs.promises.readdir(SETS_SOURCE_FOLDER, {
      withFileTypes: true,
    });
    setDirs = entries.filter(entry => entry.isDirectory()).map(e => e.name);
  } catch {
    console.warn(`createSetsData: ${SETS_SOURCE_FOLDER} not found`);
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const setId of setDirs) {
    // eslint-disable-next-line no-await-in-loop
    const files = await fs.promises.readdir(
      path.join(SETS_SOURCE_FOLDER, setId),
    );
    const pngFiles = files.filter(
      file => file.endsWith('.png') && file !== COVER_FILENAME,
    );

    if (!pngFiles.length) {
      console.info(
        `  ${setId}: no source images - leaving public/sets/${setId} untouched`,
      );
      // eslint-disable-next-line no-continue
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    await importSet(setId, pngFiles);
  }

  const sets = await readPublicSets();
  await writeSetsData(sets);
  console.info(
    `Sets data created (${sets.length} set(s), ${sets.reduce(
      (total, set) => total + set.cards.length,
      0,
    )} cards)`,
  );
})();
