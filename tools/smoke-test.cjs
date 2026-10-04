// Launches the packaged desktop app and checks that it boots, renders particles,
// responds to commands and can export a Roblox model.
// Usage: node tools/smoke-test.cjs   (needs `playwright-core`; run after electron-builder)
//
// The app is started as a normal process with a DevTools port, and the check
// connects to its window over CDP (no hooks into Electron's main process).
const { chromium } = require('playwright-core');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const PORT = 9339;
const release = path.join(__dirname, '..', 'release');
const candidates = {
  win32: ['win-unpacked/Particly.exe'],
  darwin: ['mac-arm64/Particly.app/Contents/MacOS/Particly', 'mac/Particly.app/Contents/MacOS/Particly'],
  linux: ['linux-unpacked/particly'],
}[process.platform] || [];
const exe = candidates.map((p) => path.join(release, p)).find((p) => fs.existsSync(p));

let child = null;
let appLog = '';
function fail(msg) {
  console.error('SMOKE TEST FAILED: ' + msg);
  if (appLog) console.error('--- app output ---\n' + appLog.slice(-4000));
  if (child) child.kill();
  process.exit(1);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  if (!exe) fail('packaged app not found in ' + release);
  console.log('Launching', exe);
  // Software WebGL keeps the check deterministic on GPU-less CI machines.
  const args = ['--use-angle=swiftshader', `--remote-debugging-port=${PORT}`];
  if (process.platform === 'linux') args.push('--no-sandbox');
  child = spawn(exe, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', (d) => { appLog += d; });
  child.stderr.on('data', (d) => { appLog += d; });
  child.on('exit', (code) => { appLog += `\n[app exited with code ${code}]`; });

  let browser = null;
  for (let i = 0; i < 60 && !browser; i++) {
    await sleep(1000);
    try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`, { timeout: 5000 }); } catch { /* not up yet */ }
  }
  if (!browser) fail('could not connect to the app window');

  let page = null;
  for (let i = 0; i < 30 && !page; i++) {
    page = browser.contexts().flatMap((c) => c.pages()).find((p) => p.url().endsWith('index.html'));
    if (!page) await sleep(1000);
  }
  if (!page) fail('app window did not open');
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.waitForFunction(() => typeof App !== 'undefined' && App.effect, null, { timeout: 30000 });
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => ({
    desktop: !!window.particlyDesktop,
    platform: window.particlyDesktop && window.particlyDesktop.platform,
    presets: PRESET_EFFECTS.length,
    effect: App.effect.name,
    webgl: !!App.view,
    particles: App.view ? App.view.sim.count() : 0,
    rbxmx: Export.rbxmx(App.effect).includes('class="ParticleEmitter"'),
  }));
  console.log(JSON.stringify(info));

  await page.click('#btnRandom');
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => App.effect.name);
  console.log('After "Random":', after);

  fs.mkdirSync(release, { recursive: true });
  await page.screenshot({ path: path.join(release, `smoke-${process.platform}.png`) });
  // Closing the only window quits the app; force-kill only if it hangs.
  const exited = new Promise((r) => child.once('exit', r));
  await page.evaluate(() => window.close()).catch(() => {});
  await Promise.race([exited, sleep(10000)]);
  await browser.close().catch(() => {});
  if (child.exitCode === null) child.kill();

  if (!info.desktop) fail('desktop bridge missing');
  if (info.presets < 50) fail('presets missing');
  if (!info.webgl) fail('WebGL preview did not start');
  if (info.particles <= 0) fail('no particles simulated');
  if (!info.rbxmx) fail('rbxmx export broken');
  if (after === info.effect) fail('Random button had no effect');
  if (errors.length) fail('page errors: ' + errors.join(' | '));
  console.log('Smoke test passed.');
  process.exit(0);
})().catch((e) => fail(e.stack || String(e)));
