/**
 * compareReference.js
 *
 * Visual diff of our renderer against the reference renders of the live
 * ygopro.org card maker (Rush style, one PNG per template, 421 × 614).
 *
 * Builds the 9 sample cards from PLAN.md §2, loads each into the running
 * /creator page (hidden JSON file input), exports it through the real Download
 * button, then writes per template into the output dir:
 *   <T>.ours.png     our export
 *   <T>.overlay.png  50 % blend of ours and the reference
 *   <T>.diff.png     absolute-difference heat map
 * and prints the share of pixels that differ noticeably.
 *
 * Usage (dev server running):
 *   npm run compare:ref -- <referenceDir> [--url <url>] [--out <dir>] [--only Normal,Xyz]
 *
 * <referenceDir> holds Normal.rush.png … Trap.rush.png (not in the repo).
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const args = process.argv.slice(2);
let referenceDir = null;
let baseUrl = 'http://localhost:3000';
let outDir = path.join(os.tmpdir(), 'rush-compare');
let only = null;

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--url') baseUrl = args[(i += 1)];
  else if (arg === '--out') outDir = path.resolve(args[(i += 1)]);
  else if (arg === '--only') only = args[(i += 1)].toLowerCase().split(',');
  else if (arg.startsWith('--')) {
    console.error(`Unknown option: ${arg}`);
    process.exit(1);
  } else referenceDir = path.resolve(arg);
}

if (!referenceDir || !fs.existsSync(referenceDir)) {
  console.error(
    'Usage: npm run compare:ref -- <referenceDir> [--url <url>] [--out <dir>] [--only Normal,Xyz]',
  );
  process.exit(1);
}

const E1 =
  '[REQUIREMENT] Send the top card of your Deck to the GY.\n[EFFECT] This card gains 500 ATK until the end of this turn.';

const base = {
  schemaVersion: 1,
  icon: 'none',
  setId: 'RD/ABC-EN001',
  serial: '0123456789',
  image: null,
};
const monster = (template, label, attribute, level, typeLine, effect, stats) => ({
  ...base,
  template,
  name: `Sample ${label}`,
  attribute,
  level,
  typeLine,
  effect,
  atk: stats[0],
  def: stats[1],
});

const samples = {
  Normal: monster(
    'normal',
    'Normal',
    'dark',
    7,
    'Dragon',
    'A legendary dragon of flavor text. This italic vanilla text describes the monster.',
    ['2500', '2000'],
  ),
  Effect: monster('effect', 'Effect', 'dark', 7, 'Dragon/Effect', E1, ['2500', '2000']),
  Ritual: monster('ritual', 'Ritual', 'light', 7, 'Dragon/Ritual/Effect', E1, ['2500', '2000']),
  Fusion: monster('fusion', 'Fusion', 'fire', 7, 'Dragon/Fusion/Effect', E1, ['2500', '2000']),
  Synchro: monster('synchro', 'Synchro', 'wind', 7, 'Dragon/Synchro/Effect', E1, ['2500', '2000']),
  Xyz: monster('xyz', 'Xyz', 'water', 4, 'Dragon/Xyz/Effect', E1, ['2500', '2000']),
  Token: monster('token', 'Token', 'earth', 1, 'Dragon', 'This card can be used as any Token.', ['0', '0']),
  Spell: {
    ...base,
    template: 'spell',
    name: 'Sample Spell',
    attribute: 'none',
    level: 0,
    typeLine: 'Spell Card',
    icon: 'equip',
    effect: '[REQUIREMENT] Pay 500 LP.\n[EFFECT] Draw 1 card.',
    atk: '',
    def: '',
  },
  Trap: {
    ...base,
    template: 'trap',
    name: 'Sample Trap',
    attribute: 'none',
    level: 0,
    typeLine: 'Trap Card',
    effect: '[REQUIREMENT] When your opponent attacks.\n[EFFECT] Negate the attack.',
    atk: '',
    def: '',
  },
};

const INTERCEPTOR = `
  (() => {
    if (window.__rushhubInterceptorInstalled) return;
    window.__rushhubInterceptorInstalled = true;
    window.__rushhubLastPng = null;
    document.addEventListener('click', event => {
      const a = event.target && event.target.closest ? event.target.closest('a[download]') : null;
      if (!a || !a.href.startsWith('data:image/png')) return;
      event.preventDefault();
      event.stopPropagation();
      window.__rushhubLastPng = a.href;
    }, true);
  })();
`;

const timeout = 60000;

async function exportCard(page, file, card) {
  await page
    .locator('input[type="file"][accept*=".json"]')
    .first()
    .setInputFiles(file, { timeout });
  await page.waitForFunction(
    name => {
      const node = document.getElementById('card');
      return !!node && (node.textContent || '').includes(name);
    },
    card.name,
    { timeout },
  );
  await page.evaluate(() => document.fonts.ready);
  // debounce (250 ms) + text-fit layout effects
  await page.waitForTimeout(800);
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
  await page.evaluate(() => {
    const el = document.querySelector('input[type="file"][accept*=".json"]');
    if (el) el.value = '';
  });
  return Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
}

const raw = async (sharp, input) => {
  const { data, info } = await sharp(input)
    .flatten({ background: '#ffffff' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
};

async function compare(sharp, name, ours, refFile) {
  const a = await raw(sharp, ours);
  const b = await raw(sharp, refFile);
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(
      `size mismatch: ours ${a.width}x${a.height}, reference ${b.width}x${b.height}`,
    );
  }
  const overlay = Buffer.alloc(a.data.length);
  const diff = Buffer.alloc(a.data.length);
  let bad = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    let max = 0;
    for (let c = 0; c < 3; c += 1) {
      overlay[i + c] = (a.data[i + c] + b.data[i + c]) >> 1;
      const d = Math.abs(a.data[i + c] - b.data[i + c]);
      diff[i + c] = Math.min(255, d * 2);
      if (d > max) max = d;
    }
    overlay[i + 3] = 255;
    diff[i + 3] = 255;
    if (max > 48) bad += 1;
  }
  const opts = { raw: { width: a.width, height: a.height, channels: 4 } };
  await sharp(overlay, opts).png().toFile(path.join(outDir, `${name}.overlay.png`));
  await sharp(diff, opts).png().toFile(path.join(outDir, `${name}.diff.png`));
  return (bad / (a.width * a.height)) * 100;
}

async function main() {
  const { chromium } = require('playwright');
  // eslint-disable-next-line global-require
  const sharp = require('sharp');

  fs.mkdirSync(outDir, { recursive: true });
  const jsonDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rush-samples-'));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1200 },
    deviceScaleFactor: 1,
  });
  await context.addInitScript(INTERCEPTOR);
  const page = await context.newPage();
  const failures = [];

  try {
    await page.goto(`${baseUrl.replace(/\/$/, '')}/creator`, {
      timeout,
      waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('text=DOWNLOAD', { timeout });
    await page.evaluate(INTERCEPTOR);
    // let hydration finish so the file input's change handler is attached
    await page.waitForTimeout(2000);

    for (const [name, card] of Object.entries(samples)) {
      if (only && !only.includes(name.toLowerCase())) continue;
      try {
        const file = path.join(jsonDir, `${name}.json`);
        fs.writeFileSync(file, JSON.stringify(card, null, 2));
        const png = await exportCard(page, file, card);
        const oursFile = path.join(outDir, `${name}.ours.png`);
        fs.writeFileSync(oursFile, png);
        const meta = await sharp(png).metadata();
        if (meta.width !== 421 || meta.height !== 614) {
          throw new Error(`export is ${meta.width}x${meta.height}, not 421x614`);
        }
        const pct = await compare(
          sharp,
          name,
          png,
          path.join(referenceDir, `${name}.rush.png`),
        );
        console.log(`  ${name.padEnd(8)} ${pct.toFixed(2)}% pixels differ`);
      } catch (e) {
        failures.push(name);
        console.error(`  x ${name}: ${e.message.split('\n')[0]}`);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`\n  output: ${outDir}`);
  if (failures.length) process.exit(1);
}

main().catch(err => {
  console.error('\n  x compareReference failed:', err.message);
  process.exit(1);
});
