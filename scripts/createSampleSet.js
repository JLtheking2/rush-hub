/**
 * createSampleSet.js
 *
 * Builds the tracked "Sample Set" (nine cards, RD/SMP-EN001..009) so /sets and
 * /sets/print aren't empty. Needs the dev server running.
 *
 *   npm run create:sample-set [-- --url http://localhost:3000]
 *
 * 1. writes the nine card .json files into cards/sets/SAMPLE/
 * 2. renders the matching .png files through the real creator (renderCards.js)
 * 3. uses the Sample Effect render as cover.png
 * 4. promotes the set into public/sets/SAMPLE and regenerates setsData.ts
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { sampleSetCards } = require('./sampleCards');

const SET_DIR = path.join('cards', 'sets', 'SAMPLE');
const COVER_TEMPLATE = 'Effect';

// Must stay in step with sanitizeFileNamePart / getSuggestedCardBaseName in
// src/features/cardEditor/editor/utils/getSuggestedCardFileName.ts, so these
// files are named exactly as a creator Save would name them.
const sanitize = part =>
  part
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-\s]+|[-\s]+$/g, '');

const passthrough = [];
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--url') passthrough.push('--url', args[(i += 1)]);
  else {
    console.error(`Unknown option: ${args[i]}`);
    process.exit(1);
  }
}

const run = (script, extra = []) => {
  const result = spawnSync(
    process.execPath,
    [path.join('scripts', script), ...extra],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) {
    console.error(`\n  x ${script} failed`);
    process.exit(result.status || 1);
  }
};

fs.mkdirSync(SET_DIR, { recursive: true });

const files = {};
Object.entries(sampleSetCards()).forEach(([template, card]) => {
  const base = `${sanitize(card.setId)} - ${sanitize(card.name)}`;
  files[template] = path.join(SET_DIR, base);
  fs.writeFileSync(`${files[template]}.json`, JSON.stringify(card, null, 2));
});
console.log(`Wrote ${Object.keys(files).length} card files to ${SET_DIR}`);

run('renderCards.js', [SET_DIR, ...passthrough]);

fs.copyFileSync(
  `${files[COVER_TEMPLATE]}.png`,
  path.join(SET_DIR, 'cover.png'),
);

run('createSetsData.js');
