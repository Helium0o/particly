// UI smoke test: loads the app (index.html, or dist/Particly.html with --dist), runs through
// presets, behaviours, the export dialog (incl. colour shop) and the NFS Neon tab with a
// generated stand-in picture. Fails on any page error.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { openApp } = require('./lib/browser.cjs');

(async () => {
  const target = process.argv.includes('--dist') ? 'dist/Particly.html' : 'index.html';
  const { browser, page, errors } = await openApp(target);
  const fail = [];
  const check = (ok, msg) => { console.log((ok ? '  ok   ' : '  FAIL ') + msg); if (!ok) fail.push(msg); };

  const n = await page.evaluate(() => PRESET_EFFECTS.length);
  check(n >= 270, `${n} presets load`);
  for (const name of ['Nitro Boost (Blue)', 'Neon Police Lights', 'Speed Flames', 'Skid Marks', 'Start Countdown (3-2-1-GO)', 'Pixel Fire']) {
    const ok = await page.evaluate((nm) => { const p = PRESET_EFFECTS.find((x) => x.name === nm); if (p) loadEffect(p); return !!p; }, name);
    await page.waitForTimeout(300);
    check(ok, `preset "${name}" loads and renders`);
  }
  await page.selectOption('#effectCard .behaviour select', 'impact');
  check(await page.evaluate(() => App.effect.trigger.mode === 'impact' && document.querySelector('#effectCard').innerText.includes('Crash at')), 'behaviour editor switches to "Play on crash"');

  await page.click('text=Export to Roblox');
  await page.click('#modalHost button:text-is("Colour shop")');
  const dl = page.waitForEvent('download');
  await page.click('text=Download colour shop');
  const xml = fs.readFileSync(await (await dl).path(), 'utf8');
  check(xml.includes('ColourShopServer') && xml.includes('ColourShopClient'), 'colour shop .rbxmx downloads');
  await page.keyboard.press('Escape');

  // NFS Neon tab with a generated stand-in picture (no game art in the repo)
  const png = path.join(os.tmpdir(), 'CARNEONGLOW_TEST_GREEN.png');
  const data = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#3aff6a'; g.fillRect(20, 20, 216, 12); g.fillRect(20, 96, 216, 12); return c.toDataURL('image/png'); });
  fs.writeFileSync(png, Buffer.from(data.split(',')[1], 'base64'));
  await page.click('#leftTabs button[data-tab=nfs]');
  const before = await page.evaluate(() => NeonPack.items.length);
  await page.setInputFiles('#nfsFile', png);
  await page.waitForFunction((b) => NeonPack.items.length > b, before);
  await page.click('.nfs-tile:has-text("Test Green")');
  await page.waitForTimeout(500);
  check(await page.evaluate(() => App.effect.underglow.enabled && App.effect.underglow.design === 'image'), 'NFS Neon tab puts a picture under the car');
  check(await page.evaluate(() => Export.rbxmx(App.effect).includes('class="Frame"')), 'picture exports as LED strips until uploaded');
  await page.evaluate(() => NeonPack.remove('CARNEONGLOW_TEST_GREEN')); // leave your real pack as it was

  check(!errors.length, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  process.exit(fail.length ? 1 : 0);
})();
