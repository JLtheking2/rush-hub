/**
 * renderCards.js
 *
 * Batch re-renders the `.png` next to each saved card `.json`, using the exact
 * same rendering pipeline as the website (React tree + MUI + fonts +
 * html-to-image), by driving the real /creator page headlessly.
 *
 * Why a browser: a saved PNG is only ever produced by `makeCanvas` in
 * `CardDownloader/utils.ts`, which clones the live card DOM node. Re-implementing
 * that in Node is not viable, so we reuse the page itself.
 *
 * Two hook points make the page scriptable without any source changes:
 *   1. Load  — `ImportButton` always renders a hidden `<input type="file">` as its
 *              non-FSA fallback. `setInputFiles` on it runs the normal
 *              `applyCardJson` path (`parseRushCard` validation), bypassing the
 *              file picker and dirty-state dialog. A file that fails validation
 *              opens the "Card not loaded" dialog, which we detect and report
 *              instead of waiting for a timeout.
 *   2. Render — the creator page exposes `window.rushhubExportPng()`, which runs
 *              the same `makeCanvas` pipeline as Save and returns a PNG data URL.
 *              Every render is checked to be exactly 421 × 614 px.
 *
 * Usage:
 *   node scripts/renderCards.js <path...> [options]
 *   npm run render:cards -- <path...> [options]
 *
 * Arguments:
 *   <path...>   One or more paths, each either a folder (renders every *.json in
 *               it, non-recursive, skipping *.json.bak) or a single .json file.
 *               Folders and files can be mixed in one invocation.
 *
 * Options:
 *   --url <url>      Base URL of a running dev server. Default http://localhost:3000
 *   --dry-run        Render and report sizes, but write nothing.
 *   --timeout <ms>   Per-card render timeout. Default 60000.
 *   --headed         Run the browser headed (debugging).
 *
 * Prerequisites:
 *   - Dev server already running (start-dev.bat in the repo root).
 *   - Chromium installed: npx playwright install chromium
 *
 * Exit codes:
 *   0  every card rendered
 *   1  bad arguments, unreachable server, or at least one card failed
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_URL = 'http://localhost:3000';
const CARD_ID = 'card';
const EXPECTED_WIDTH = 421;
const EXPECTED_HEIGHT = 614;

// --- Argument parsing (no external deps) ---

const args = process.argv.slice(2);
const inputPaths = [];
let baseUrl = DEFAULT_URL;
let dryRun = false;
let headed = false;
let timeout = 60000;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--url') {
    baseUrl = args[++i];
  } else if (arg === '--dry-run') {
    dryRun = true;
  } else if (arg === '--headed') {
    headed = true;
  } else if (arg === '--timeout') {
    timeout = parseInt(args[++i], 10);
  } else if (arg === '--help' || arg === '-h') {
    printUsage();
    process.exit(0);
  } else if (arg.startsWith('--')) {
    fail(`Unknown option: ${arg}`);
  } else {
    inputPaths.push(arg);
  }
}

function printUsage() {
  console.log(
    [
      '',
      'Usage: npm run render:cards -- <path...> [--url <url>] [--dry-run] [--timeout <ms>] [--headed]',
      '',
      '  <path...>  One or more folders and/or .json card files.',
      '',
      'Examples:',
      '  npm run render:cards -- cards/sets/SAMPLE',
      '  npm run render:cards -- "public/sets/SAMPLE/cards/rd-smp-en001-sample-normal.json"',
      '  npm run render:cards -- public/sets/SAMPLE/cards --dry-run',
      '',
    ].join('\n'),
  );
}

function fail(message) {
  console.error(`\n  x ${message}`);
  process.exit(1);
}

if (inputPaths.length === 0) {
  console.error('\n  x No paths given.');
  printUsage();
  process.exit(1);
}

// --- Resolve the card list ---

// Natural sort so "P2" comes before "P10".
const naturalCompare = (a, b) =>
  path
    .basename(a)
    .localeCompare(path.basename(b), undefined, {
      numeric: true,
      sensitivity: 'base',
    });

function resolveCardFiles(paths) {
  const files = [];
  const seen = new Set();

  const add = file => {
    const abs = path.resolve(file);
    const key = abs.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    files.push(abs);
  };

  for (const input of paths) {
    const abs = path.resolve(input);
    if (!fs.existsSync(abs)) fail(`Path does not exist: ${input}`);

    if (fs.statSync(abs).isDirectory()) {
      const found = fs
        .readdirSync(abs)
        .filter(name => /\.json$/i.test(name)) // .json.bak does not match
        .map(name => path.join(abs, name))
        .sort(naturalCompare);
      if (found.length === 0) {
        fail(`No .json card files found in folder: ${input}`);
      }
      found.forEach(add);
    } else {
      if (!/\.json$/i.test(abs)) {
        fail(`Not a .json card file: ${input}`);
      }
      add(abs);
    }
  }

  return files;
}

const cardFiles = resolveCardFiles(inputPaths);

// --- Main ---

async function renderCard(page, file) {
  const raw = fs.readFileSync(file, 'utf8');
  const card = JSON.parse(raw);
  const expectedName = typeof card.name === 'string' ? card.name.trim() : '';
  const expectedSetId = typeof card.setId === 'string' ? card.setId.trim() : '';

  // Load the card through the hidden fallback file input.
  const input = page.locator('input[type="file"][accept*=".json"]').first();
  await input.setInputFiles(file, { timeout });

  // Race "the preview shows this card" against "the invalid-card dialog opened".
  // Name and set ID both have to be present, so a stale previous card can't
  // satisfy the check. A card with neither falls back to a fixed settle.
  const dialog = page.getByText('Card not loaded');
  if (expectedName || expectedSetId) {
    const updated = page
      .waitForFunction(
        ({ cardId, name, setId }) => {
          const node = document.getElementById(cardId);
          if (!node) return false;
          const text = (node.textContent || '').replace(/\s+/g, ' ');
          return (
            (!name || text.includes(name.replace(/\s+/g, ' '))) &&
            (!setId || text.includes(setId))
          );
        },
        { cardId: CARD_ID, name: expectedName, setId: expectedSetId },
        { timeout },
      )
      .then(() => 'loaded');
    const rejected = dialog
      .waitFor({ state: 'visible', timeout })
      .then(() => 'rejected');
    const outcome = await Promise.race([updated, rejected]);
    // Whichever promise lost keeps running until its timeout; swallow it.
    updated.catch(() => {});
    rejected.catch(() => {});

    if (outcome === 'rejected') {
      const message = (
        await page.locator('[role="dialog"]').last().innerText()
      ).replace(/\s+/g, ' ');
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden', timeout });
      throw new Error(`invalid card: ${message}`);
    }
  } else {
    await page.waitForTimeout(500);
  }

  await page.evaluate(() => document.fonts.ready);
  // Debounce (250 ms) + text-fit layout effects + image decode.
  await page.waitForTimeout(800);

  const dataUrl = await page.evaluate(() => window.rushhubExportPng());
  if (!dataUrl) throw new Error('export produced no image');
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const buffer = Buffer.from(base64, 'base64');

  // PNG IHDR: width at byte 16, height at byte 20 (big-endian).
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width !== EXPECTED_WIDTH || height !== EXPECTED_HEIGHT) {
    throw new Error(
      `export is ${width}x${height}, expected ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}`,
    );
  }

  // Reset the input so re-selecting the same file later still fires `change`.
  await page.evaluate(() => {
    const el = document.querySelector('input[type="file"][accept*=".json"]');
    if (el) el.value = '';
  });

  return buffer;
}

async function main() {
  const { chromium } = require('playwright');

  const url = `${baseUrl.replace(/\/$/, '')}/creator`;

  console.log(`\nrenderCards: ${cardFiles.length} card(s)`);
  console.log(`  page: ${url}`);
  if (dryRun) console.log('  DRY RUN — no files will be written');
  console.log('');

  const browser = await chromium.launch({ headless: !headed });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1200 },
    deviceScaleFactor: 1,
  });
    const page = await context.newPage();

  let succeeded = 0;
  const failures = [];

  try {
    try {
      await page.goto(url, { timeout, waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=Save As', { timeout });
    } catch (e) {
      throw new Error(
        `Could not load ${url} — is the dev server running? Start it with start-dev.bat.\n     (${e.message})`,
      );
    }

    // Let hydration finish so the file input's change handler is attached.
    await page.waitForTimeout(2000);

    for (const file of cardFiles) {
      const label = path.basename(file);
      try {
        const buffer = await renderCard(page, file);
        const outPath = file.replace(/\.json$/i, '.png');
        if (!dryRun) fs.writeFileSync(outPath, buffer);
        succeeded += 1;
        console.log(
          `  ${dryRun ? '~' : 'v'} ${label} → ${path.basename(outPath)} (${Math.round(
            buffer.length / 1024,
          )} KB)`,
        );
      } catch (e) {
        failures.push(label);
        console.error(`  x ${label}: ${e.message.split('\n')[0]}`);
      }
    }
  } finally {
    await browser.close();
  }

  console.log('');
  console.log(`  ${succeeded}/${cardFiles.length} rendered${dryRun ? ' (dry run)' : ''}`);
  if (failures.length > 0) {
    console.error(`  failed: ${failures.join(', ')}`);
    process.exit(1);
  }
  console.log('');
}

main().catch(err => {
  console.error('\n  x renderCards failed:', err.message);
  process.exit(1);
});
