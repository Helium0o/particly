// Launches the packaged desktop app and checks that it boots, renders particles,
// responds to menu commands and can export a Roblox model.
// Usage: node tools/smoke-test.cjs   (needs `playwright-core`; run after electron-builder)
const { _electron } = require('playwright-core');
const fs = require('node:fs');
const path = require('node:path');

const release = path.join(__dirname, '..', 'release');
const candidates = {
  win32: ['win-unpacked/Particly.exe'],
  darwin: ['mac-arm64/Particly.app/Contents/MacOS/Particly', 'mac/Particly.app/Contents/MacOS/Particly'],
  linux: ['linux-unpacked/particly'],
}[process.platform] || [];
const exe = candidates.map((p) => path.join(release, p)).find((p) => fs.existsSync(p));

function fail(msg) {
  console.error('SMOKE TEST FAILED: ' + msg);
  process.exit(1);
}

(async () => {
  if (!exe) fail('packaged app not found in ' + release);
  console.log('Launching', exe);
  // Software WebGL keeps the check deterministic on GPU-less CI machines.
  const args = ['--use-angle=swiftshader'];
  if (process.platform === 'linux') args.push('--no-sandbox');
  const app = await _electron.launch({ executablePath: exe, args, timeout: 60000 });
  const win = await app.firstWindow();
  const errors = [];
  win.on('pageerror', (e) => errors.push(e.message));

  await win.waitForFunction(() => typeof App !== 'undefined' && App.effect, null, { timeout: 30000 });
  await win.waitForTimeout(2500);
  const info = await win.evaluate(() => ({
    desktop: !!window.particlyDesktop,
    presets: PRESET_EFFECTS.length,
    effect: App.effect.name,
    webgl: !!App.view,
    particles: App.view ? App.view.sim.count() : 0,
    rbxmx: Export.rbxmx(App.effect).includes('class="ParticleEmitter"'),
  }));
  console.log(JSON.stringify(info));

  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.send('menu', 'random'));
  await win.waitForTimeout(500);
  const after = await win.evaluate(() => App.effect.name);
  console.log('After "Random Effect" menu:', after);

  fs.mkdirSync(release, { recursive: true });
  await win.screenshot({ path: path.join(release, `smoke-${process.platform}.png`) });
  await app.close();

  if (!info.desktop) fail('desktop bridge missing');
  if (info.presets < 50) fail('presets missing');
  if (!info.webgl) fail('WebGL preview did not start');
  if (info.particles <= 0) fail('no particles simulated');
  if (!info.rbxmx) fail('rbxmx export broken');
  if (after === info.effect) fail('menu command had no effect');
  if (errors.length) fail('page errors: ' + errors.join(' | '));
  console.log('Smoke test passed.');
})().catch((e) => fail(e.stack || String(e)));
