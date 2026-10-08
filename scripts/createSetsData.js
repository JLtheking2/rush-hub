const fs = require('fs');
const path = require('path');

const SETS_SOURCE_FOLDER = './cards/sets';
const SETS_PUBLIC_FOLDER = './public/sets';
const WRITE_PATH = './src/utils/setsData.ts';

const COVER_FILENAME = 'cover.png';
const CARDS_DIRNAME = 'cards';
const THUMB_DIRNAME = 'thumb';
/** Per-set `{ [slug]: { number, name, quantity } }`, so the card .json (and its base64 art) isn't published */
const MANIFEST_FILENAME = 'manifest.json';

/**
 * `--no-import` skips phase A, so `cards/sets` staging is never published. The
 * prestart/prebuild hooks pass it; only a manual `npm run create:sets` promotes.
 */
const SKIP_IMPORT = process.argv.includes('--no-import');

const THUMB_WIDTH = 320;
const COVER_WIDTH = 400;
const WEBP_QUALITY = 82;

/**
 * Pretty names for set folders. Folders without an entry fall back to their
 * folder name.
 */
const SET_DISPLAY_NAMES = {};

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
 * Turns a card filename stem (`RD-SMP-EN001 - Sample Normal`) into an ASCII,
 * URL-safe slug (`rd-smp-en001-sample-normal`). Saved filenames contain spaces
 * and possibly typographic characters that are awkward in URLs. The real name
 * and Set ID are taken from the card's own `.json` (stored in the manifest), so
 * nothing is lost by slugging the filename.
 * @param {string} stem
 * @returns {string}
 */
const toSlug = stem =>
  stem
    .normalize('NFKD')
    // Strip combining accents, then any non-ASCII leftovers (’ -> nothing)
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .toLowerCase();

/**
 * Orders Set IDs like `RD/SMP-EN001, RD/SMP-EN002, ... EN010` - by non-numeric
 * prefix, then numerically (a plain string sort would place `10` before `2`),
 * then by name so equal or empty numbers stay deterministic.
 */
const compareCards = (a, b) => {
  const split = value => {
    const match = value.match(/^(\D*)(\d+)$/);
    return match ? [match[1], Number(match[2])] : [value, 0];
  };
  const [aPrefix, aNumber] = split(a.number);
  const [bPrefix, bNumber] = split(b.number);
  return (
    aPrefix.localeCompare(bPrefix) ||
    aNumber - bNumber ||
    a.name.localeCompare(b.name)
  );
};

/**
 * True when `source` is newer than `destination`, or `destination` is missing.
 * Lets repeat runs skip re-copying unchanged files.
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

/**
 * The bits of a card .json the Set Browser needs. Null when the file is
 * missing, unreadable or has no name.
 * @param {string} jsonPath
 * @returns {Promise<{ number: string, name: string, quantity: number } | null>}
 */
const readCardInfo = async jsonPath => {
  try {
    const card = JSON.parse(await fs.promises.readFile(jsonPath, 'utf8'));
    if (!card.name || typeof card.name !== 'string') return null;
    return {
      number: typeof card.setId === 'string' ? card.setId : '',
      name: card.name,
      // Cards saved before the field existed count as one copy
      quantity:
        Number.isInteger(card.quantity) && card.quantity >= 1
          ? card.quantity
          : 1,
    };
  } catch {
    return null;
  }
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
 * Every file under `directory`, as paths relative to it, so a set can organise
 * its staging into subfolders (`PRS-02/Main/M-001 - Name.png`).
 * @param {string} directory
 * @param {string} [prefix]
 * @returns {Promise<string[]>}
 */
const listFilesRecursive = async (directory, prefix = '') => {
  const entries = await fs.promises.readdir(path.join(directory, prefix), {
    withFileTypes: true,
  });
  const nested = await Promise.all(
    entries.map(entry => {
      const relative = path.join(prefix, entry.name);
      return entry.isDirectory()
        ? listFilesRecursive(directory, relative)
        : [relative];
    }),
  );
  return nested.flat();
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
 * @param {string[]} pngFiles paths relative to the set's staging folder
 */
const importSet = async (setId, pngFiles) => {
  const sourceDir = path.join(SETS_SOURCE_FOLDER, setId);
  const publicDir = path.join(SETS_PUBLIC_FOLDER, setId);
  const cardsDir = path.join(publicDir, CARDS_DIRNAME);

  await fs.promises.mkdir(cardsDir, { recursive: true });

  const cards = [];
  const seenSlugs = new Map();

  pngFiles.forEach(file => {
    // Subfolders only organise staging - the published set stays flat, so the
    // slug comes from the filename alone.
    const slug = toSlug(path.basename(file).replace(/\.png$/i, ''));
    if (!slug) {
      console.warn(`  skipping "${file}" - filename has no usable characters`);
      return;
    }
    if (seenSlugs.has(slug)) {
      console.warn(
        `  skipping "${file}" - same slug "${slug}" as "${seenSlugs.get(
          slug,
        )}"`,
      );
      return;
    }
    seenSlugs.set(slug, file);
    cards.push({ slug, file });
  });

  let copied = 0;
  const manifest = {};
  // eslint-disable-next-line no-restricted-syntax
  for (const card of cards) {
    // Only the .png is published. The card's .json carries the whole base64
    // art, so just its number, name and quantity are kept (in manifest.json).
    const pngSource = path.join(sourceDir, card.file);
    const jsonSource = pngSource.replace(/\.png$/i, '.json');
    const png = path.join(cardsDir, `${card.slug}.png`);

    // `isStale` only copies when *staging* is newer, so a card re-rendered
    // in public/sets is never clobbered by an older staged copy.
    // eslint-disable-next-line no-await-in-loop
    if (await isStale(pngSource, png)) {
      // eslint-disable-next-line no-await-in-loop
      await fs.promises.copyFile(pngSource, png);
      copied += 1;
    }

    // eslint-disable-next-line no-await-in-loop
    const info = await readCardInfo(jsonSource);
    if (info) {
      manifest[card.slug] = info;
    } else {
      console.warn(
        `  no usable .json alongside "${card.file}" - number and name fall back to the slug`,
      );
    }
  }

  await fs.promises.writeFile(
    path.join(publicDir, MANIFEST_FILENAME),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

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

  // Anything else (including .json left by older runs) is pruned.
  await pruneDirectory(
    cardsDir,
    new Set(cards.map(card => `${card.slug}.png`)),
  );

  console.info(
    `  ${setId}: ${cards.length} cards (${copied} file(s) copied/updated)`,
  );
};

/**
 * Last-resort number/name when a card has no manifest entry. The slug is lossy
 * (it can't give back the Set ID or the original punctuation), which is
 * exactly why the card data is the authority everywhere else.
 * @param {string} slug
 */
const fallbackCardInfo = slug => ({ number: '', name: slug, quantity: 1 });

/**
 * Phase B - derive everything from the tracked files in
 * `public/sets/<setId>`: refresh stale thumbnails, read each card's real
 * number, name and quantity out of the set's `manifest.json`, and write
 * `src/utils/setsData.ts`.
 *
 * Always runs, including on a fresh clone (and in CI) where staging is empty
 * and phase A did nothing.
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

    let manifest = {};
    try {
      const manifestText =
        // eslint-disable-next-line no-await-in-loop
        await fs.promises.readFile(
          path.join(publicDir, MANIFEST_FILENAME),
          'utf8',
        );
      manifest = JSON.parse(manifestText);
    } catch {
      console.warn(
        `  no readable ${MANIFEST_FILENAME} in public/sets/${setId}`,
      );
    }

    const cards = [];
    let rendered = 0;

    // Sequential: sharp already parallelises internally, and a whole set of
    // concurrent PNG decodes is a needless memory spike.
    // eslint-disable-next-line no-restricted-syntax
    for (const slug of slugs) {
      const png = path.join(cardsDir, `${slug}.png`);
      const thumb = path.join(thumbDir, `${slug}.webp`);

      // Regenerated whenever the image is newer than its thumbnail.
      // eslint-disable-next-line no-await-in-loop
      if (await isStale(png, thumb)) {
        // eslint-disable-next-line no-await-in-loop
        await writeResizedWebp(png, thumb, THUMB_WIDTH);
        rendered += 1;
      }

      // An empty Set ID is fine; a missing name is not.
      let info = manifest[slug];
      if (!info?.name || typeof info.name !== 'string') {
        console.warn(`  "${slug}" has no name in the manifest - using slug`);
        info = fallbackCardInfo(slug);
      }

      const full = `${base}/${CARDS_DIRNAME}/${slug}.png`;
      // Without sharp there are no thumbs; degrade to the full image rather
      // than emitting a path that 404s.
      // eslint-disable-next-line no-await-in-loop
      const hasThumb = await exists(thumb);

      cards.push({
        id: slug,
        number: info.number,
        name: info.name,
        quantity: info.quantity,
        thumb: hasThumb ? `${base}/${THUMB_DIRNAME}/${slug}.webp` : full,
        full,
      });
    }

    cards.sort(compareCards);

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
 * or double quotes when the string has more apostrophes than double quotes,
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
  if (typeof value === 'string') {
    const escaped = value.replace(/\\/g, '\\\\');
    const singles = (value.match(/'/g) || []).length;
    const doubles = (value.match(/"/g) || []).length;
    return singles > doubles
      ? `"${escaped.replace(/"/g, '\\"')}"`
      : `'${escaped.replace(/'/g, "\\'")}'`;
  }

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
  /** Copies in the set; print sheets repeat the card this many times */
  quantity: number;
  thumb: string;
  full: string;
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
  if (SKIP_IMPORT && setDirs.length) {
    console.info(
      `  --no-import: not publishing ${SETS_SOURCE_FOLDER} (run \`npm run create:sets\` to publish)`,
    );
    setDirs = [];
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const setId of setDirs) {
    // eslint-disable-next-line no-await-in-loop
    const files = await listFilesRecursive(
      path.join(SETS_SOURCE_FOLDER, setId),
    );
    const pngFiles = files.filter(
      file => /\.png$/i.test(file) && file !== COVER_FILENAME,
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
