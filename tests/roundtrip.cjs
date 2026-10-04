// Round trip: every preset exported to .rbxmx / Command Bar / ModuleScript / JSON / share link and
// imported again must come back the same (layers, behaviour, neon). Also checks XML well-formedness.
const { openApp } = require('./lib/browser.cjs');
(async () => {
  const { browser, page, errors } = await openApp();
  const res = await page.evaluate(async () => {
    const out = [];
    const close = (a, b) => Math.abs(a - b) < 2e-3;
    const cmpLayer = (A, B, tag) => {
      const diffs = [];
      for (const p of PROPS) {
        const a = A[p.key], b = B[p.key];
        if (p.type === 'texture') { if (TextureStore.exportTexture(A) !== b) diffs.push(p.key + ' ' + TextureStore.exportTexture(A) + ' vs ' + b); continue; }
        if (p.type === 'colorseq') { if (a.length !== b.length || a.some((k, i) => !close(k.t, b[i].t) || k.c.some((c, j) => Math.abs(c - b[i].c[j]) > (tag === 'lua' ? 0.003 : 2e-3)))) diffs.push(p.key); continue; }
        if (p.type === 'numseq') { if (a.length !== b.length || a.some((k, i) => !close(k.t, b[i].t) || !close(k.v, b[i].v) || !close(k.e, b[i].e))) diffs.push(p.key + JSON.stringify([a, b])); continue; }
        if (Array.isArray(a)) { if (a.some((v, i) => !close(v, b[i]))) diffs.push(p.key + JSON.stringify([a, b])); continue; }
        if (typeof a === 'number') { if (!close(a, b)) diffs.push(p.key + ` ${a} vs ${b}`); continue; }
        if (a !== b) diffs.push(p.key + ` ${a} vs ${b}`);
      }
      if (A.Name !== B.Name) diffs.push('Name');
      if (!!A.point !== !!B.point) diffs.push('point');
      if (A.mode !== B.mode) diffs.push('mode ' + A.mode + ' ' + B.mode);
      if (A.mode === 'burst' && (A.emitCount !== B.emitCount || !close(A.emitDelay, B.emitDelay))) diffs.push('burst');
      return diffs;
    };
    for (const P of PRESET_EFFECTS) {
      const tests = {
        rbxmx: () => Import.fromRbxmx(Export.rbxmx(P)),
        lua: () => Import.fromLuau(Export.commandBar(P)),
        module: () => Import.fromLuau(Export.moduleScript(P)),
        json: () => Import.fromJson(Export.json(P)),
        share: async () => Import.fromShare(await Export.shareLink(P)),
      };
      for (const [name, fn] of Object.entries(tests)) {
        try {
          const [E] = await fn();
          if (E.layers.length !== P.layers.length) { out.push(`${P.name} ${name}: layer count ${E.layers.length}`); continue; }
          if (name !== 'json' && name !== 'share' && name !== 'module' && E.name !== P.name) out.push(`${P.name} ${name}: name ${E.name}`);
          if (name !== 'json' && name !== 'share' && E.name !== P.name) out.push(`${P.name} ${name}: name ${E.name}`);
          if (name !== 'json' && name !== 'share' && E.partSize.some((v, i) => Math.abs(v - P.partSize[i]) > 1e-3)) out.push(`${P.name} ${name}: partSize`);
          if (Export.hasBurst(P) && name !== 'json' && name !== 'module' && Math.abs(E.burstLoop - P.burstLoop) > 1e-3) out.push(`${P.name} ${name}: burstLoop ${E.burstLoop}`);
          if (name !== 'module' && JSON.stringify(E.underglow) !== JSON.stringify(P.underglow)) out.push(`${P.name} ${name}: underglow ${JSON.stringify(E.underglow)}`);
          if (name !== 'module' && JSON.stringify(E.trigger) !== JSON.stringify(P.trigger)) out.push(`${P.name} ${name}: trigger ${JSON.stringify(E.trigger)} vs ${JSON.stringify(P.trigger)}`);
          if (name !== 'module') P.layers.forEach((L, i) => { if (L.Enabled !== E.layers[i].Enabled) out.push(`${P.name} ${name} [${L.Name}]: Enabled ${L.Enabled} vs ${E.layers[i].Enabled}`); });
          P.layers.forEach((L, i) => { const d = cmpLayer(L, E.layers[i], name); if (d.length) out.push(`${P.name} ${name} [${L.Name}]: ${d.join(', ')}`); });
        } catch (e) { out.push(`${P.name} ${name}: ERROR ${e.message}`); }
      }
      // xml well-formed
      const doc = new DOMParser().parseFromString(Export.rbxmx(P), 'application/xml');
      if (doc.getElementsByTagName('parsererror').length) out.push(P.name + ' rbxmx not well-formed');
      const doc2 = new DOMParser().parseFromString(Export.moduleRbxmx(P), 'application/xml');
      if (doc2.getElementsByTagName('parsererror').length) out.push(P.name + ' module rbxmx not well-formed');
    }
    const pack = new DOMParser().parseFromString(Export.rbxmxPack(PRESET_EFFECTS), 'application/xml');
    if (pack.getElementsByTagName('parsererror').length) out.push('pack not well-formed');
    out.push('pack effects: ' + Import.fromRbxmx(Export.rbxmxPack(PRESET_EFFECTS)).length + ' / ' + PRESET_EFFECTS.length);
    // third-party luau
    const snippet = `
local p: ParticleEmitter = Instance.new("ParticleEmitter")
p.Name = "Cool"
p.Texture = "rbxassetid://123456"
p.Color = ColorSequence.new(Color3.fromRGB(255, 0, 0), Color3.new(0, 0, 1))
p.Size = NumberSequence.new({NumberSequenceKeypoint.new(0, 1, 0.5), NumberSequenceKeypoint.new(1, 0)})
p.Transparency = NumberSequence.new(0.5)
p.Lifetime = NumberRange.new(1, 2)
p.Rate = 25 * 2
p.SpreadAngle = Vector2.new(30, 30)
p.Acceleration = Vector3.new(0, -workspace.Gravity, 0)
p.EmissionDirection = Enum.NormalId.Front
p.LightEmission = 1
p.Parent = workspace.Part
if p.Rate > 10 then
  p.Speed = NumberRange.new(5)
elseif true then
end
local other = Instance.new("ParticleEmitter", workspace)
other.Rate = 3
other.Enabled = false
other:SetAttribute("EmitCount", 12)
`;
    const [S] = Import.fromLuau(snippet);
    out.push('snippet: ' + JSON.stringify(S.layers.map((l) => [l.Name, l.Texture, l.Rate, l.Lifetime, l.SpreadAngle, l.EmissionDirection, l.Speed, l.Size, l.Color[0].c, l.mode, l.emitCount, l.Transparency[0].v, l.Acceleration])));
    const tableStyle = `local props = { Rate = 5, Lifetime = NumberRange.new(2,3), Color = ColorSequence.new({ColorSequenceKeypoint.new(0, Color3.fromHex("#ff8800")), ColorSequenceKeypoint.new(1, Color3.fromHSV(0.5, 1, 1))}) }
for k, v in pairs(props) do emitter[k] = v end`;
    const [T2] = Import.fromLuau(tableStyle);
    out.push('table: ' + JSON.stringify(T2.layers.map((l) => [l.Rate, l.Lifetime, l.Color])));
    return out;
  });
  // Generated shape textures stay unexported in JSON / share files (the preview key is kept instead)
  const problems = res.filter((l) => !/ (json|share) \[[^\]]*\]: Texture rbxasset:\/\/\S* vs $/.test(l) && !/^(snippet|table|pack effects): /.test(l));
  console.log(res.filter((l) => /^pack effects/.test(l)).join('\n'));
  console.log(problems.length ? problems.join('\n') : 'all presets round-trip cleanly');
  if (errors.length) console.error(errors.join('\n'));
  process.exitCode = problems.length || errors.length ? 1 : 0;
  await browser.close();
})();
