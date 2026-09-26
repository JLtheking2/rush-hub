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
 *              non-FSA fallback. `setInputFiles` on it runs the normal applyCard
 *              path (isCardInterface → migrateLegacyCard → stripStaleAttributes →
 *              setStateValues), bypassing the file picker and dirty-state dialog.
 *   2. Render — the Download button runs `makeCanvas(...)` then dispatches a
 *              synthetic `<a download href="data:image/png;...">` click. We install
 *              a capture-phase click listener that intercepts that anchor, cancels
 *              the navigation, and stashes the data URL on window for us to read.
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
      '  npm run render:cards -- cards/sets/PKO1',
      '  npm run render:cards -- "cards/sets/PKO1/P7 - Firegrass.json"',
      '  npm run render:cards -- cards/sets/PKO1/*.json',
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

// --- In-page helpers (stringified, run inside the browser) ---

// Capture-phase interceptor for the synthetic `<a download>` click that
// DownloadButton dispatches. Cancels it and stashes the data URL on window.
const INSTALL_INTERCEPTOR = `
  (() => {
    if (window.__rushhubInterceptorInstalled) return;
    window.__rushhubInterceptorInstalled = true;
    window.__rushhubLastPng = null;
    document.addEventListener(
      'click',
      event => {
        const anchor =
          event.target && event.target.closest
            ? event.target.closest('a[download]')
            : null;
        if (!anchor || !anchor.href.startsWith('data:image/png')) return;
        event.preventDefault();
        event.stopPropagation();
        window.__rushhubLastPng = anchor.href;
      },
      true,
    );
  })();
`;

// --- Main ---

async function renderCard(page, file) {
  const raw = fs.readFileSync(file, 'utf8');
  const card = JSON.parse(raw);
  const expectedName = typeof card.name === 'string' ? card.name.trim() : '';

  // Load the card through the hidden fallback file input.
  const input = page.locator('input[type="file"][accept*=".json"]').first();
  await input.setInputFiles(file, { timeout });

  // Wait for the store to hydrate and the preview to reflect this card. The
  // card name is the cheapest reliable signal; when a card has no name at all
  // we fall back to a fixed settle.
  if (expectedName) {
    await page.waitForFunction(
      ({ cardId, name }) => {
        const node = document.getElementById(cardId);
        if (!node) return false;
        const text = (node.textContent || '').replace(/\s+/g, ' ');
        return text.includes(name.replace(/\s+/g, ' '));
      },
      { cardId: CARD_ID, name: expectedName },
      { timeout },
    );
  } else {
    await page.waitForTimeout(500);
  }

  await page.evaluate(() => document.fonts.ready);
  // Let images decode and any layout measuring (e.g. flavor-text line counts) settle.
  await page.waitForTimeout(400);

  await page.evaluate(() => {
    window.__rushhubLastPng = null;
  });

  await page
    .locator('button:visible', { hasText: 'Download' })
    .first()
    .click({ timeout });

  await page.waitForFunction(() => !!window.__rushhubLastPng, undefined, {
    timeout,
  });

  const dataUrl = await page.evaluate(() => window.__rushhubLastPng);
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const buffer = Buffer.from(base64, 'base64');

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
  await context.addInitScript(INSTALL_INTERCEPTOR);
  const page = await context.newPage();

  let succeeded = 0;
  const failures = [];

  try {
    try {
      await page.goto(url, { timeout, waitUntil: 'domcontentloaded' });
      await page.waitForSelector('text=DOWNLOAD', { timeout });
    } catch (e) {
      throw new Error(
        `Could not load ${url} — is the dev server running? Start it with start-dev.bat.\n     (${e.message})`,
      );
    }

    // Belt and braces: addInitScript covers navigations, this covers the
    // already-loaded document.
    await page.evaluate(INSTALL_INTERCEPTOR);

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
