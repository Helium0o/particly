// Writes every preset's Luau exports (Command Bar, ModuleScript, container scripts) plus the colour
// shop and neon-picture exports to tests/.gen/ for the Luau compile + simulation tests.
const fs = require('fs');
const path = require('path');
const { openApp } = require('./lib/browser.cjs');

(async () => {
  const { browser, page, errors } = await openApp();
  const files = await page.evaluate(() => {
    const o = {};
    const safe = (n) => n.replace(/[^A-Za-z0-9]+/g, '_');
    PRESET_EFFECTS.forEach((p) => {
      const s = safe(p.name);
      o[`cmd/${s}.luau`] = Export.commandBar(p);
      o[`mod/${s}.luau`] = Export.moduleScript(p);
      Behaviour.containerScripts(p).forEach((sc) => { o[`cs/${s}__${sc.name}.luau`] = sc.source; });
      if (p.trigger.mode === 'character') o[`cs/${s}__Character.luau`] = Behaviour.characterSource(p);
      if (p.underglow.enabled && p.underglow.anim !== 'none') o[`cs/${s}__NeonFx.luau`] = Neon.fxSource(p.underglow);
    });
    o['extra/Shop_Install.luau'] = Export.shopCommandBar();
    o['cs/Shop_Server.luau'] = Shop.serverSource();
    o['cs/Shop_Client.luau'] = Shop.clientSource();
    // Neon pictures (NFS Neon tab): a generated stand-in picture, no game art needed
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#3aff6a'; g.fillRect(20, 20, 216, 12); g.fillRect(20, 96, 216, 12);
    const data = c.toDataURL('image/png');
    ['CARNEONGLOW_BRAZIL_FLAG', 'CARNEONGLOW_COP_YELLOW', 'CARNEONGLOW_GOLD_EGG'].forEach((id, i) => {
      for (const assetId of ['', 'rbxassetid://99' + i]) {
        const key = 'neon_' + id;
        const E = Model.normalizeEffect({ name: 'NFS Neon ' + id, partSize: [6, 0.2, 12], trigger: { ...NEON_TOGGLE, shop: 'neon' }, textures: { [key]: { name: id, data } },
          underglow: { enabled: true, design: 'image', image: key, color: [0.7, 1, 0.5], imageId: assetId, anim: i === 1 ? 'pulse' : 'none' }, layers: [haze('#a0ff80')] });
        const n = 'NFS_' + id + (assetId ? '_up' : '');
        o[`extra/${n}.luau`] = Export.commandBar(E);
        o[`mod/${n}.luau`] = Export.moduleScript(E);
      }
    });
    return o;
  });
  const out = path.join(__dirname, '.gen');
  fs.rmSync(out, { recursive: true, force: true });
  for (const [k, v] of Object.entries(files)) {
    fs.mkdirSync(path.join(out, path.dirname(k)), { recursive: true });
    fs.writeFileSync(path.join(out, k), v);
  }
  console.log(`${Object.keys(files).length} Luau files written to tests/.gen`);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  await browser.close();
})();
