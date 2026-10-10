/**
 * sortSet.js
 *
 * Re-sorts a staged card folder, renumbers every card's Set ID to match, renames
 * the .json/.png pairs, re-renders the changed PNGs and un-publishes the set.
 *
 * Order:
 *   1. Monsters, then Spells, then Traps.
 *   2. Monsters: Normal/Effect (interchangeable), then Ritual, Fusion, Synchro,
 *      Xyz, Token - each group by ascending Level.
 *   3. Spells/Traps: by Property Icon order (none, Continuous, Counter, Equip,
 *      Field, Quick-Play, Ritual).
 *   Ties keep their current Set ID order (then name), so re-runs are stable.
 *
 * The Set ID pattern is inferred from the folder's existing IDs (`M-001`,
 * `E-001`, `001`): the shared prefix and at least 3 digits. Numbers run 1..N.
 *
 * Usage:
 *   npm run sort:set -- <folder> [options]
 *
 * Options:
 *   --apply        Write the changes. Without it, only the proposed order is
 *                  printed and nothing is touched.
 *   --render-all   Re-render every card, not only the ones whose ID changed.
 *   --url <url>    Dev server for the render step. Default http://localhost:3000
 *
 * With --apply, if the set is published (`public/sets/<SetId>/`), it is deleted
 * and `setsData.ts` regenerated without it. Republishing stays the manual
 * `npm run create:sets`.
 *
 * Prerequisite for the render step: the dev server running (start-dev.bat).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SETS_SOURCE_FOLDER = path.resolve('./cards/sets');
const SETS_PUBLIC_FOLDER = path.resolve('./public/sets');
const TMP_DIRNAME = '_sorting_tmp';
const RENDER_CHUNK = 40;
const MIN_DIGITS = 3;

// Mirrors `spellTrapIconIds` in src/features/cardEditor/card/types.ts
const ICON_ORDER = [
  'none',
  'continuous',
  'counter',
  'equip',
  'field',
  'quickPlay',
  'ritual',
];
const ICON_LABELS = {
  none: 'No icon',
  continuous: 'Continuous',
  counter: 'Counter',
  equip: 'Equip',
  field: 'Field',
  quickPlay: 'Quick-Play',
  ritual: 'Ritual',
};

// Monster templates in order; Normal and Effect share the first group.
const MONSTER_GROUPS = [
  { templates: ['normal', 'effect'], label: 'Normal/Effect' },
  { templates: ['ritual'], label: 'Ritual' },
  { templates: ['fusion'], label: 'Fusion' },
  { templates: ['synchro'], label: 'Synchro' },
  { templates: ['xyz'], label: 'Xyz' },
  { templates: ['token'], label: 'Token' },
];

// --- Arguments ---

const args = process.argv.slice(2);
let folderArg = null;
let apply = false;
let renderAll = false;
let baseUrl = 'http://localhost:3000';

const fail = message => {
  console.error(`\n  x ${message}\n`);
  process.exit(1);
};

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--apply') apply = true;
  else if (arg === '--render-all') renderAll = true;
  else if (arg === '--url') {
    i += 1;
    baseUrl = args[i];
  } else if (arg.startsWith('--')) fail(`Unknown option: ${arg}`);
  else if (folderArg) fail('Only one folder can be given.');
  else folderArg = arg;
}

if (!folderArg) {
  fail('Usage: npm run sort:set -- <folder> [--apply] [--render-all] [--url <url>]');
}

const folder = path.resolve(folderArg);
if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
  fail(`Not a folder: ${folderArg}`);
}
const relativeToSets = path.relative(SETS_SOURCE_FOLDER, folder);
if (relativeToSets.startsWith('..') || path.isAbsolute(relativeToSets)) {
  fail(`The folder must be inside cards/sets/: ${folderArg}`);
}
const setId = relativeToSets.split(path.sep)[0];
if (!setId) fail('Give a set folder or a subfolder of one, not cards/sets itself.');

// --- Read ---

const splitId = id => {
  const match = /^(\D*)(\d+)$/.exec(id);
  return match ? { prefix: match[1], number: Number(match[2]), digits: match[2].length } : null;
};

const readCards = () => {
  const files = fs.readdirSync(folder).filter(name => /\.json$/i.test(name));
  if (!files.length) fail(`No .json card files in ${folderArg}`);

  return files.map(file => {
    let card;
    try {
      card = JSON.parse(fs.readFileSync(path.join(folder, file), 'utf8'));
    } catch (e) {
      return fail(`${file}: not valid JSON (${e.message})`);
    }
    const base = file.replace(/\.json$/i, '');
    const parsed = splitId(typeof card.setId === 'string' ? card.setId : '');
    if (!parsed) fail(`${file}: Set ID "${card.setId}" doesn't look like <prefix><number>`);
    if (!fs.existsSync(path.join(folder, `${base}.png`))) {
      console.warn(`  ! ${base}.png is missing - it will be rendered`);
    }
    return {
      base,
      template: card.template,
      level: Number.isFinite(card.level) ? card.level : 0,
      icon: card.icon,
      name: typeof card.name === 'string' ? card.name : base,
      oldId: card.setId,
      parsed,
    };
  });
};

// --- Sort ---

const monsterGroupIndex = template =>
  MONSTER_GROUPS.findIndex(group => group.templates.includes(template));

const category = card => {
  if (card.template === 'spell') return 1;
  if (card.template === 'trap') return 2;
  return 0;
};

const sectionIndex = card => {
  if (category(card)) return Math.max(ICON_ORDER.indexOf(card.icon), 0);
  const index = monsterGroupIndex(card.template);
  return index === -1 ? MONSTER_GROUPS.length : index;
};

const sectionLabel = card => {
  if (card.template === 'spell') return `Spell: ${ICON_LABELS[card.icon] ?? card.icon}`;
  if (card.template === 'trap') return `Trap: ${ICON_LABELS[card.icon] ?? card.icon}`;
  const group = MONSTER_GROUPS[monsterGroupIndex(card.template)];
  return group ? group.label : `Monster (${card.template})`;
};

const compare = (a, b) =>
  category(a) - category(b) ||
  sectionIndex(a) - sectionIndex(b) ||
  (category(a) ? 0 : a.level - b.level) ||
  a.parsed.number - b.parsed.number ||
  a.name.localeCompare(b.name);

const cards = readCards();
const prefixes = new Set(cards.map(card => card.parsed.prefix));
if (prefixes.size > 1) {
  fail(`Set IDs mix prefixes (${[...prefixes].map(p => `"${p}"`).join(', ')}) - can't infer a pattern.`);
}
const [prefix] = [...prefixes];
const digits = Math.max(MIN_DIGITS, ...cards.map(card => card.parsed.digits));

cards.sort(compare);
cards.forEach((card, index) => {
  card.newId = `${prefix}${String(index + 1).padStart(digits, '0')}`;
  // Drop the old "<id> - " lead; keep the rest of the filename as typed.
  const rest = card.base.startsWith(`${card.oldId} - `)
    ? card.base.slice(card.oldId.length + 3)
    : card.name;
  card.newBase = `${card.newId} - ${rest}`;
  card.changed = card.newId !== card.oldId || card.newBase !== card.base;
});

// --- Report ---

const changed = cards.filter(card => card.changed);
console.log(`\nsortSet: ${cards.length} card(s) in ${path.relative(process.cwd(), folder)}\n`);
let lastSection = null;
cards.forEach(card => {
  const section = sectionLabel(card);
  if (section !== lastSection) {
    console.log(`\n${section}`);
    lastSection = section;
  }
  const levelNote = category(card) ? '' : ` L${card.level}`;
  console.log(
    `  ${card.changed ? '*' : ' '} ${card.newId}  ${card.name}${levelNote}${
      card.newId === card.oldId ? '' : `  [${card.oldId}]`
    }`,
  );
});
console.log(`\n  ${changed.length} of ${cards.length} card(s) change${apply ? '' : ' (preview - re-run with --apply)'}\n`);

if (!apply) process.exit(0);

// --- Apply: renumber + rename ---

const tmpDir = path.join(folder, TMP_DIRNAME);
if (fs.existsSync(tmpDir)) {
  fail(`${TMP_DIRNAME}/ already exists - a previous run was interrupted. Check it, restore any files from it, delete it and re-run.`);
}

const finalNames = new Set();
cards.forEach(card => {
  const key = card.newBase.toLowerCase();
  if (finalNames.has(key)) fail(`Two cards would be named "${card.newBase}"`);
  finalNames.add(key);
});

const SET_ID_LINE = /("setId":\s*")[^"]*(")/;
if (changed.length) {
  fs.mkdirSync(tmpDir);
  changed.forEach(card => {
    const jsonText = fs.readFileSync(path.join(folder, `${card.base}.json`), 'utf8');
    if (!SET_ID_LINE.test(jsonText)) fail(`${card.base}.json has no "setId" field`);
    // A raw-text edit keeps the formatting and the embedded art byte-identical.
    fs.writeFileSync(
      path.join(tmpDir, `${card.newBase}.json`),
      jsonText.replace(SET_ID_LINE, `$1${card.newId}$2`),
    );
    const png = path.join(folder, `${card.base}.png`);
    if (fs.existsSync(png)) fs.copyFileSync(png, path.join(tmpDir, `${card.newBase}.png`));
  });
  changed.forEach(card => {
    fs.rmSync(path.join(folder, `${card.base}.json`), { force: true });
    fs.rmSync(path.join(folder, `${card.base}.png`), { force: true });
  });
  fs.readdirSync(tmpDir).forEach(file => {
    fs.renameSync(path.join(tmpDir, file), path.join(folder, file));
  });
  fs.rmdirSync(tmpDir);
  console.log(`  renumbered and renamed ${changed.length} card(s)`);
}

// --- Apply: un-publish ---

const publicDir = path.join(SETS_PUBLIC_FOLDER, setId);
if (fs.existsSync(publicDir)) {
  fs.rmSync(publicDir, { recursive: true, force: true });
  console.log(`  un-published: deleted public/sets/${setId}/`);
  const result = spawnSync(
    process.execPath,
    [path.resolve('scripts/createSetsData.js'), '--no-import'],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) fail('createSetsData.js failed - run `npm run create:sets` manually.');
  console.log('  Note: if this set was tracked in git, the deletion now shows in `git status`.');
} else {
  console.log(`  ${setId} is not published - nothing to un-publish`);
}

// --- Apply: re-render ---

const toRender = cards
  .filter(
    card =>
      renderAll ||
      card.changed ||
      !fs.existsSync(path.join(folder, `${card.newBase}.png`)),
  )
  .map(card => path.join(folder, `${card.newBase}.json`));

if (!toRender.length) {
  console.log('  nothing to render\n');
  process.exit(0);
}

console.log(`\n  rendering ${toRender.length} card(s) via render:cards ...`);
for (let i = 0; i < toRender.length; i += RENDER_CHUNK) {
  const result = spawnSync(
    process.execPath,
    [path.resolve('scripts/renderCards.js'), ...toRender.slice(i, i + RENDER_CHUNK), '--url', baseUrl],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) {
    fail(
      `Rendering failed. The renumbering is done; fix the cause (dev server running?) and run:\n    npm run render:cards -- ${path.relative(process.cwd(), folder)}`,
    );
  }
}
console.log('  done\n');
