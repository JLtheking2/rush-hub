/**
 * verify-page.js
 *
 * Reusable headless-browser verification helper for rush-hub.
 * Uses the project's playwright devDependency so no temp-dir install is needed.
 *
 * Usage:
 *   node scripts/verify-page.js [path-or-url] [options]
 *   npm run verify -- [path-or-url] [options]
 *
 * Arguments:
 *   path-or-url   Route path (e.g. creator or /creator) or full URL.
 *                 Bare paths/names are resolved against http://localhost:3000.
 *                 Leading slash is optional — "creator" and "/creator" are equivalent.
 *                 Defaults to /creator.
 *
 *                 Windows / Git Bash note: Git Bash converts leading-slash args
 *                 like /creator to Windows paths (C:/Program Files/Git/creator).
 *                 To avoid this, pass the route WITHOUT the leading slash:
 *                   npm run verify -- creator
 *
 * Options:
 *   --wait <selector>     CSS or text selector to waitForSelector on before
 *                         screenshotting. Defaults to "text=DOWNLOAD".
 *                         Pass "" to skip the wait.
 *   --screenshot <file>   Output path for the PNG. Defaults to
 *                         <os.tmpdir()>/rush-hub-verify.png.
 *   --full-page           Capture a full-page (scrollable) screenshot.
 *   --timeout <ms>        Max ms to wait for selector. Default: 30000.
 *
 * Prerequisites:
 *   - Dev server must already be running (use start-dev.bat in the repo root).
 *   - Chromium browser must be installed:
 *     npx playwright install chromium
 *
 * Exit codes:
 *   0  Success — screenshot written, selector found (or --wait "").
 *   1  Failure — navigation error, selector timeout, or unexpected exception.
 *
 * IMPORTANT: screenshot path always uses os.tmpdir() by default — never a Unix
 * /tmp path, since Node runs as a native Windows process on this machine.
 */

'use strict';

const os = require('os');
const path = require('path');

// --- Argument parsing (no external deps) ---

const args = process.argv.slice(2);
const BASE_URL = 'http://localhost:3000';

let targetArg = 'creator';
let waitSelector = 'text=DOWNLOAD';
let screenshotFile = path.join(os.tmpdir(), 'rush-hub-verify.png');
let fullPage = false;
let timeout = 30000;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--wait') {
    waitSelector = args[++i] ?? '';
  } else if (arg === '--screenshot') {
    screenshotFile = args[++i];
  } else if (arg === '--full-page') {
    fullPage = true;
  } else if (arg === '--timeout') {
    timeout = parseInt(args[++i], 10);
  } else if (!arg.startsWith('--')) {
    targetArg = arg;
  }
}

// Resolve to a full URL.
// On Windows + Git Bash, a leading-slash arg like /creator gets MSYS-converted to
// C:/Program Files/Git/creator. Detect this: if the arg looks like a Windows
// absolute path that is NOT a real URL, strip everything up to the last path
// segment that follows a Unix-style root (heuristic: after "Git/").
function resolveUrl(raw) {
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;

  // Detect MSYS/Git Bash path conversion: absolute Windows path like
  // C:\Program Files\Git\creator or C:/Program Files/Git/creator
  const msysMatch = raw.replace(/\\/g, '/').match(/^[A-Za-z]:\/.*?\/Git\/(.+)$/);
  if (msysMatch) {
    return `${BASE_URL}/${msysMatch[1]}`;
  }

  // Normal case: bare route ("creator", "/creator", "some/deep/route")
  const route = raw.startsWith('/') ? raw : `/${raw}`;
  return `${BASE_URL}${route}`;
}

const url = resolveUrl(targetArg);

// --- Main ---

async function main() {
  const { chromium } = require('playwright');

  console.log(`\nverify-page: navigating to ${url}`);
  if (waitSelector) console.log(`  waiting for selector: "${waitSelector}"`);
  console.log(`  screenshot → ${screenshotFile}`);
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const response = await page.goto(url, { timeout, waitUntil: 'domcontentloaded' });
    const status = response ? response.status() : '(no response)';
    console.log(`  HTTP status: ${status}`);

    if (waitSelector) {
      console.log(`  waiting for "${waitSelector}" (timeout: ${timeout}ms)…`);
      await page.waitForSelector(waitSelector, { timeout });
      console.log(`  ✓ selector found`);
    }

    await page.screenshot({ path: screenshotFile, fullPage });
    console.log(`  ✓ screenshot saved to: ${screenshotFile}`);
    console.log('');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('\n  ✗ verify-page failed:', err.message);
  process.exit(1);
});
