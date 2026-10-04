// Shared Playwright helper for the browser tests.
// Uses the `playwright` package if installed (npm i --no-save playwright && npx playwright install chromium),
// otherwise `playwright-core` with your installed Chrome / Edge (set PW_CHANNEL=msedge for Edge).
const path = require('path');
const { pathToFileURL } = require('url');

function chromium() {
  try { return { lib: require('playwright').chromium, opts: {} }; } catch {}
  try { return { lib: require('playwright-core').chromium, opts: { channel: process.env.PW_CHANNEL || 'chrome' } }; } catch {}
  console.error('Playwright not found. Run: npm i --no-save playwright && npx playwright install chromium');
  process.exit(2);
}

const ROOT = path.resolve(__dirname, '..', '..');
const fileUrl = (rel) => pathToFileURL(path.join(ROOT, rel)).href;

/** Opens Particly (index.html or dist/Particly.html) and collects page errors. */
async function openApp(rel = 'index.html', viewport = { width: 1500, height: 950 }) {
  const { lib, opts } = chromium();
  const browser = await lib.launch({ ...opts, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(fileUrl(rel));
  await page.waitForFunction(() => typeof App !== 'undefined' && App.effect, null, { timeout: 20000 });
  return { browser, page, errors };
}

module.exports = { openApp, ROOT, fileUrl };
