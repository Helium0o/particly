'use strict';
/* Particly application: state, panels, dialogs, import/export flows. */

const $ = (id) => document.getElementById(id);
const el = U.el;

const LS = { current: 'particly.current.v1', library: 'particly.library.v1', ui: 'particly.ui.v1' };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch {
      U.toast('Browser storage is full — export your library to free space.', 'err');
      return false;
    }
  },
};

const PRESET_EFFECTS = PRESETS.map((p, i) => Model.normalizeEffect({ ...p, id: 'preset_' + i }));

const App = {
  effect: null,
  selId: null,
  undo: [],
  redo: [],
  snap: '',
  view: null,
  thumbView: null,
  library: [], // [{effect, thumb, saved}]
  presetThumbs: {},
  presetCat: 'All',
  openSections: { Appearance: true, Emission: true, Motion: true, Shape: false, Flipbook: false },
  selTexKey: null,
};

/* ============================== state & history ============================== */

function current() {
  const E = App.effect;
  return E.layers.find((l) => l.id === App.selId) || E.layers[0];
}

function registerTextures(effect) {
  for (const [k, t] of Object.entries(effect.textures || {})) TextureStore.addUser(k, t.name, t.data);
}

let saveTimer = 0;
function autosave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => store.set(LS.current, App.effect), 400);
}

/** Record an undo step if anything changed since the last commit. */
function commit() {
  const s = JSON.stringify(App.effect);
  if (s === App.snap) return;
  App.undo.push(App.snap);
  if (App.undo.length > 150) App.undo.shift();
  App.snap = s;
  App.redo = [];
  updateUndoButtons();
  renderLayers();
  autosave();
}

function updateUndoButtons() {
  $('btnUndo').disabled = !App.undo.length;
  $('btnRedo').disabled = !App.redo.length;
}

function restore(snap) {
  App.effect = JSON.parse(snap);
  App.snap = snap;
  registerTextures(App.effect);
  if (!App.effect.layers.some((l) => l.id === App.selId)) App.selId = App.effect.layers[0].id;
  refreshAll();
  autosave();
}
function undo() {
  if (!App.undo.length) return;
  App.redo.push(App.snap);
  restore(App.undo.pop());
  updateUndoButtons();
}
function redo() {
  if (!App.redo.length) return;
  App.undo.push(App.snap);
  restore(App.redo.pop());
  updateUndoButtons();
}

/** Replace the current effect (undoable). */
function loadEffect(effect, { fresh = true } = {}) {
  effect = Model.normalizeEffect(U.clone(effect));
  if (fresh) { effect.id = U.uid(); effect.layers.forEach((l) => { l.id = U.uid(); }); }
  registerTextures(effect);
  App.effect = effect;
  App.selId = effect.layers[0].id;
  if (App.snap) commit(); else { App.snap = JSON.stringify(effect); updateUndoButtons(); }
  refreshAll();
  if (App.view) {
    // Simulate a little to frame the camera, then restart bursts so they play in view.
    App.view.reset();
    App.view.setEffect(App.effect);
    // Vehicle boosts preview best "driving": switch Drive on for them (and off again for others)
    const drive = App.effect.trigger.mode === 'vehicle';
    if (drive !== App.view.settings.drive) {
      App.view.settings.drive = drive;
      App.view.settings.move = false;
      if ($('vDrive')) { $('vDrive').checked = drive; $('vMove').checked = false; }
    }
    App.view.warm(U.clamp(Math.max(...App.effect.layers.map((l) => l.Lifetime[1])) * 0.8, 0.9, 3));
    App.view.frame();
    if (App.effect.layers.some((l) => l.mode === 'burst')) App.view.reset();
  }
  autosave();
}

function refreshAll() {
  $('effectName').value = App.effect.name;
  App.view && App.view.setEffect(App.effect);
  renderEffectCard();
  renderLayers();
  renderProps();
  renderTextureTab();
}

/* ============================== texture thumbnails ============================== */

const texThumbCache = {};
function texThumb(key) {
  if (TextureStore.isUser(key)) return TextureStore._user[key].data;
  if (!texThumbCache[key]) {
    const src = TextureStore.source(key);
    if (!src) return '';
    texThumbCache[key] = TextureStore.render(key, 64).toDataURL();
  }
  return texThumbCache[key];
}

/* ============================== right panel: effect ============================== */

function renderEffectCard() {
  const E = App.effect;
  const hasBurst = E.layers.some((l) => l.mode === 'burst');
  const tool = (label, title, fn) => el('button', { class: 'btn small', title, onclick: () => { fn(); commit(); refreshAll(); } }, label);
  $('effectCard').replaceChildren(
    el('div', { class: 'card-head' }, el('h3', null, 'Effect'), el('small', { class: 'hint', style: { margin: 0 } }, `${E.layers.length} emitter${E.layers.length > 1 ? 's' : ''}`)),
    el('div', { class: 'sbody', style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
      el('div', { class: 'prop' }, el('label', { title: 'Size of the invisible Part that holds the emitters. Particles spawn inside/on it.' }, 'Part size'),
        Editors.multiField({ get: () => E.partSize, set: (v) => { E.partSize = v.map((x) => U.clamp(x, 0.05, 2048)); }, commit, labels: ['X', 'Y', 'Z'], step: 0.5, min: 0.05 })),
      hasBurst ? el('div', { class: 'prop' }, el('label', { title: 'How often burst layers replay in the preview (and in Roblox for "Always on" and character effects).' }, 'Burst replay (s)'),
        Editors.numberField({ get: () => E.burstLoop, set: (v) => { E.burstLoop = Math.max(0.1, v); }, commit, min: 0.2, max: 10, step: 0.1 })) : null,
      el('div', { class: 'prop' }, el('label', { title: 'Scale sizes, speeds, accelerations and the part together' }, 'Scale'),
        el('div', { class: 'row gap wrap' }, tool('½×', 'Half size', () => scaleEffect(0.5)), tool('0.8×', '', () => scaleEffect(0.8)), tool('1.25×', '', () => scaleEffect(1.25)), tool('2×', 'Double size', () => scaleEffect(2)))),
      el('div', { class: 'prop' }, el('label', { title: 'Rotate every colour around the colour wheel' }, 'Hue shift'),
        el('div', { class: 'row gap wrap' }, tool('−60°', '', () => hueShift(-60)), tool('−20°', '', () => hueShift(-20)), tool('+20°', '', () => hueShift(20)), tool('+60°', '', () => hueShift(60)), tool('Grey', 'Desaturate', () => saturate(0)))),
      el('div', { class: 'prop' }, el('label', { title: 'Make the whole effect play slower or faster (keeps the same look). Roblox TimeScale only goes down to slow motion, this works both ways.' }, 'Timing'),
        el('div', { class: 'row gap wrap' }, tool('Slower', '1.5× longer', () => timeStretch(1.5)), tool('Faster', '1.5× quicker', () => timeStretch(1 / 1.5)))),
      behaviourEditor(E),
    ),
  );
}

/** "In Roblox": what the exported effect does by itself in a game. */
function behaviourEditor(E) {
  const T = E.trigger;
  const box = el('div', { class: 'behaviour' });
  const set = (k, v) => { T[k] = v; commit(); renderEffectCard(); };
  const field = (label, title, input) => el('div', { class: 'prop' }, el('label', { title }, label), input);
  const num = (k, min, max, step) => Editors.numberField({ get: () => T[k], set: (v) => { T[k] = U.clamp(v, min, max); }, commit, min, max, step });
  const select = (k, items, labels) => {
    const s = el('select', null, items.map((i) => el('option', { value: i }, labels ? labels[i] : i)));
    s.value = T[k];
    s.addEventListener('change', () => set(k, s.value));
    return s;
  };
  const extra = [];
  if (T.mode === 'vehicle') {
    extra.push(field('Boost key', 'Keyboard key the driver holds. A matching gamepad button and an on-screen mobile button are added automatically. Effects on the same key boost together (twin exhausts).', select('key', BOOST_KEYS)));
    const bt = el('input', { type: 'text', value: T.buttonText, maxlength: 12 });
    bt.addEventListener('change', () => set('buttonText', bt.value.trim() || 'BOOST'));
    extra.push(field('Mobile button', 'Label of the on-screen button for touch devices', bt));
    extra.push(field('Max boost (s)', '0 = boost as long as the key is held', num('maxSeconds', 0, 30, 0.5)));
    extra.push(el('div', { class: 'hint', style: { margin: 0 } }, 'Tip: tick "Drive" in the preview bar to see it streaming behind a moving car. Exhausts emit from the part\'s Back face (+Z).'));
  }
  if (T.mode === 'touch' || T.mode === 'prompt') {
    if (T.mode === 'prompt') {
      const t = el('input', { type: 'text', value: T.actionText });
      t.addEventListener('change', () => set('actionText', t.value || 'Activate'));
      extra.push(field('Prompt text', 'Text shown on the ProximityPrompt', t));
    }
    extra.push(field('Play for (s)', 'How long continuous layers stay on each time', num('duration', 0.1, 30, 0.1)));
    extra.push(field('Cooldown (s)', 'Wait before it can trigger again', num('cooldown', 0, 30, 0.1)));
  }
  if (T.mode === 'character') extra.push(field('Attach to', 'Body part the effect follows (HumanoidRootPart works for R6 and R15)', select('attachTo', ATTACH_POINTS)));
  box.append(
    el('div', { class: 'prop' }, el('label', { title: 'What the effect does by itself in your game. The export includes the scripts for it.' }, 'In Roblox'),
      select('mode', Object.keys(BEHAVIOURS), Object.fromEntries(Object.entries(BEHAVIOURS).map(([k, v]) => [k, v.label])))),
    el('div', { class: 'hint', style: { margin: 0 } }, BEHAVIOURS[T.mode].help),
    ...extra,
  );
  return box;
}

function scaleEffect(f) {
  const E = App.effect;
  E.partSize = E.partSize.map((v) => U.clamp(v * f, 0.05, 2048));
  for (const L of E.layers) {
    L.Size.forEach((k) => { k.v = U.clamp(k.v * f, 0, 100); k.e *= f; });
    L.Speed = L.Speed.map((v) => v * f);
    L.Acceleration = L.Acceleration.map((v) => v * f);
    L.ZOffset *= f;
  }
}
function hueShift(deg) {
  for (const L of App.effect.layers) L.Color.forEach((k) => { const h = U.rgbToHsv(k.c); h[0] += deg / 360; k.c = U.hsvToRgb(h); });
}
function saturate(s) {
  for (const L of App.effect.layers) L.Color.forEach((k) => { const h = U.rgbToHsv(k.c); h[1] *= s; k.c = U.hsvToRgb(h); });
}
function timeStretch(f) {
  const E = App.effect;
  E.burstLoop *= f;
  for (const L of E.layers) {
    L.Lifetime = L.Lifetime.map((v) => U.clamp(v * f, 0, 20));
    L.Speed = L.Speed.map((v) => v / f);
    L.Acceleration = L.Acceleration.map((v) => v / (f * f));
    L.RotSpeed = L.RotSpeed.map((v) => v / f);
    L.Rate /= f;
    L.Drag /= f;
    L.emitDelay *= f;
    L.FlipbookFramerate = L.FlipbookFramerate.map((v) => v / f);
  }
}

/* ============================== right panel: layers ============================== */

function layerSwatch(L) {
  const key = TextureStore.previewKey(L);
  const grad = `linear-gradient(135deg, ${L.Color.map((k) => `${U.rgbToHex(k.c)} ${k.t * 100}%`).join(', ')})`;
  return el('div', { class: 'swatch', style: { backgroundImage: `url(${texThumb(key)}), ${grad}`, backgroundSize: '80%, cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' } });
}

function renderLayers() {
  const E = App.effect;
  const list = $('layerList');
  list.replaceChildren(...E.layers.map((L, i) => {
    const row = el('div', { class: 'layer' + (L.id === current().id ? ' selected' : '') + (L.hidden ? ' off' : ''), onclick: () => { App.selId = L.id; renderLayers(); renderProps(); } },
      layerSwatch(L),
      el('span', { class: 'lname', title: L.Name }, L.Name),
      el('span', { class: 'lmode' + (L.mode === 'burst' ? ' burst' : ''), title: L.mode === 'burst' ? `Burst of ${L.emitCount}` : `${U.fmt(L.Rate)} per second` }, L.mode === 'burst' ? `✸ ${L.emitCount}` : `${U.fmt(L.Rate)}/s`),
      el('button', { class: 'lb', title: L.hidden ? 'Show layer' : 'Hide layer (hidden layers are not exported)', onclick: (e) => { e.stopPropagation(); L.hidden = !L.hidden; commit(); } }, L.hidden ? '◌' : '◉'),
      el('button', { class: 'lb', title: 'Move up', disabled: i === 0, onclick: (e) => { e.stopPropagation(); moveLayer(i, -1); } }, '↑'),
      el('button', { class: 'lb', title: 'Move down', disabled: i === E.layers.length - 1, onclick: (e) => { e.stopPropagation(); moveLayer(i, 1); } }, '↓'),
      el('button', { class: 'lb', title: 'Duplicate', onclick: (e) => { e.stopPropagation(); duplicateLayer(L); } }, '⧉'),
      el('button', { class: 'lb del', title: 'Delete layer', disabled: E.layers.length <= 1, onclick: (e) => { e.stopPropagation(); deleteLayer(L); } }, '✕'),
    );
    return row;
  }));
}

function addLayer(src) {
  const E = App.effect;
  if (E.layers.length >= 32) return U.toast('32 layers max', 'warn');
  const L = Model.normalizeLayer({ ...(src ? U.clone(src) : { Name: 'Emitter ' + (E.layers.length + 1) }), id: U.uid() });
  E.layers.push(L);
  App.selId = L.id;
  commit();
  renderEffectCard();
  renderProps();
}
function duplicateLayer(L) {
  const E = App.effect;
  const copy = { ...U.clone(L), id: U.uid(), Name: L.Name + ' copy' };
  E.layers.splice(E.layers.indexOf(L) + 1, 0, copy);
  App.selId = copy.id;
  commit();
  renderEffectCard();
  renderProps();
}
function deleteLayer(L) {
  const E = App.effect;
  if (E.layers.length <= 1) return;
  const i = E.layers.indexOf(L);
  E.layers.splice(i, 1);
  App.selId = E.layers[Math.max(0, i - 1)].id;
  commit();
  renderEffectCard();
  renderProps();
}
function moveLayer(i, d) {
  const E = App.effect, j = i + d;
  if (j < 0 || j >= E.layers.length) return;
  [E.layers[i], E.layers[j]] = [E.layers[j], E.layers[i]];
  commit();
}

function buildAddFromPreset() {
  const s = $('addFromPreset');
  for (const cat of PRESET_CATEGORIES) {
    const g = el('optgroup', { label: cat });
    PRESET_EFFECTS.forEach((p, pi) => {
      if (p.category !== cat) return;
      p.layers.forEach((L, li) => g.append(el('option', { value: `${pi}:${li}` }, `${p.name} › ${L.Name}`)));
    });
    s.append(g);
  }
  s.addEventListener('change', () => {
    if (!s.value) return;
    const [pi, li] = s.value.split(':').map(Number);
    addLayer(PRESET_EFFECTS[pi].layers[li]);
    s.value = '';
    U.toast(`Added layer "${current().Name}"`);
  });
}

/* ============================== right panel: properties ============================== */

function renderProps() {
  const L = current();
  const host = $('props');
  const head = el('div', { class: 'panel-card layer-head' });
  const nameIn = el('input', { type: 'text', value: L.Name, title: 'ParticleEmitter name' });
  nameIn.addEventListener('input', () => { L.Name = nameIn.value || 'ParticleEmitter'; });
  nameIn.addEventListener('change', commit);
  const burstBox = el('div', { class: 'sbody', style: { padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' } });
  const drawBurst = () => {
    if (L.mode !== 'burst') {
      burstBox.replaceChildren(el('div', { class: 'hint', style: { margin: 0 } }, 'Emits continuously at Rate particles/second.'));
      return;
    }
    burstBox.replaceChildren(
      el('div', { class: 'prop' }, el('label', { title: 'Particles emitted per burst (exported as the EmitCount attribute).' }, 'Emit count'),
        Editors.numberField({ get: () => L.emitCount, set: (v) => { L.emitCount = Math.max(0, Math.round(v)); }, commit, min: 1, max: 300, step: 1 })),
      el('div', { class: 'prop' }, el('label', { title: 'Delay after the burst starts (EmitDelay attribute) — use it to sequence layers.' }, 'Emit delay (s)'),
        Editors.numberField({ get: () => L.emitDelay, set: (v) => { L.emitDelay = Math.max(0, v); }, commit, min: 0, max: 3, step: 0.01 })),
      el('div', { class: 'hint', style: { margin: 0 } }, 'Burst layers export disabled with EmitCount / EmitDelay attributes. Fire them with emitter:Emit(count) — the exported ParticlyBurstPlayer script or ModuleScript does this for you.'),
    );
  };
  drawBurst();
  head.append(
    el('div', { class: 'card-head', style: { marginBottom: 0 } }, el('h3', null, 'Layer'),
      Editors.seg({
        items: [['continuous', '∿ Continuous'], ['burst', '✸ Burst']], get: () => L.mode,
        set: (v) => { L.mode = v; L.Enabled = v === 'continuous'; drawBurst(); commit(); renderEffectCard(); },
      })),
    el('div', { class: 'prop' }, el('label', null, 'Name'), nameIn),
    el('div', { class: 'prop' }, el('label', { title: 'Spawn every particle at the centre of the part instead of across its shape. Exported by putting this emitter inside an Attachment — handy for cores, flashes and rings.' }, 'Emit from centre'),
      Editors.boolField({ get: () => L.point, set: (v) => { L.point = v; }, commit })),
    burstBox,
  );

  const sections = SECTIONS.map((sec) => {
    const d = el('details', { class: 'section', open: App.openSections[sec] });
    d.addEventListener('toggle', () => { App.openSections[sec] = d.open; store.set(LS.ui, { openSections: App.openSections }); });
    const body = el('div', { class: 'sbody' });
    for (const p of PROPS.filter((x) => x.sec === sec)) body.append(propRow(L, p));
    d.append(el('summary', null, sec), body);
    return d;
  });
  const scroll = $('right').scrollTop;
  host.replaceChildren(head, ...sections);
  $('right').scrollTop = scroll;
}

function propRow(L, p) {
  const get = () => L[p.key];
  const set = (v) => { L[p.key] = v; };
  let w, tall = false;
  switch (p.type) {
    case 'number': w = Editors.numberField({ get, set, commit, min: p.min, max: p.max, step: p.step }); break;
    case 'range': w = Editors.multiField({ get, set, commit, labels: ['min', 'max'], step: p.step }); break;
    case 'vec2': w = Editors.multiField({ get, set, commit, labels: ['X', 'Y'], step: p.step }); break;
    case 'vec3': w = Editors.multiField({ get, set, commit, labels: ['X', 'Y', 'Z'], step: p.step }); break;
    case 'enum': w = Editors.enumField({ get, set, commit, items: ENUMS[p.key].items }); break;
    case 'bool': w = Editors.boolField({ get, set, commit }); break;
    case 'numseq': tall = true; w = Editors.numSeqField({ get, set, commit, min: p.min, max: p.max, soft: p.soft, key: p.key }); break;
    case 'colorseq': tall = true; w = Editors.colorSeqField({ get, set, commit }); break;
    case 'texture': tall = true; w = textureField(L); break;
  }
  return el('div', { class: 'prop' + (tall ? ' tall' : '') }, el('label', { title: p.help }, p.key), w);
}

/* ------------------------------ texture field ------------------------------ */

function parseAssetInput(v) {
  v = v.trim();
  if (/^\d+$/.test(v)) return 'rbxassetid://' + v;
  const m = /roblox\.com\/(?:library|catalog|store\/asset|asset\/\?id=|marketplace\/asset)\/?(\d+)/i.exec(v) || /[?&]id=(\d+)/.exec(v);
  if (m) return 'rbxassetid://' + m[1];
  return v;
}

function applyTexture(L, key) {
  const def = TEX_BY_KEY[key];
  L.previewTex = key;
  L.Texture = def && def.rbx ? def.rbx : '';
  commit();
  renderProps();
}

function textureField(L) {
  const box = el('div', { class: 'tex-field' });
  const key = TextureStore.previewKey(L);
  const def = TEX_BY_KEY[key];
  const btn = el('button', { class: 'tex-btn', title: 'Choose texture', style: { backgroundImage: `url(${texThumb(key)})` } });
  btn.addEventListener('click', () => openTexturePicker(btn, L));
  const input = el('input', { type: 'text', value: L.Texture, placeholder: 'rbxassetid://… (paste after uploading)', spellcheck: false });
  input.addEventListener('change', () => {
    const v = parseAssetInput(input.value);
    L.Texture = v;
    const known = TEX_BY_RBX[v.toLowerCase()];
    if (known) L.previewTex = known.key;
    commit();
    renderProps();
  });
  let pill;
  const custom = String(L.Texture).trim() && !TEX_BY_RBX[String(L.Texture).toLowerCase()];
  if (custom) pill = el('span', { class: 'pill custom', title: 'Custom Roblox asset. The preview shows the texture picked on the left.' }, 'Custom ID');
  else if (TextureStore.needsUpload(L) || (TextureStore.isUser(key) && !custom)) pill = el('span', { class: 'pill up' }, 'Needs upload');
  else pill = el('span', { class: 'pill ok', title: 'Ships with Roblox — works immediately' }, 'Built-in ✓');
  const name = def ? def.name : TextureStore.userName(key) || 'Texture';
  const col = el('div', { class: 'col' }, el('div', { class: 'tname' }, name, pill), input);
  box.append(btn, col);
  const wrap = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } }, box);
  if (TextureStore.needsUpload(L) || (TextureStore.isUser(key) && !String(L.Texture).trim())) {
    wrap.append(el('div', { class: 'warn' },
      'This texture isn\'t on Roblox yet. Download the PNG, upload it (Studio: Asset Manager → Import, or create.roblox.com), then paste its ID above. Until then it exports with a similar built-in texture.',
      el('div', null, el('button', { class: 'btn small', onclick: () => downloadTexturePng(key) }, '⬇ Download PNG'))));
  }
  return wrap;
}

function closePopover() { document.querySelectorAll('.popover').forEach((p) => p.remove()); }

function openTexturePicker(anchor, L) {
  closePopover();
  const pop = el('div', { class: 'popover' });
  const tile = (key, title, dotClass) => el('div', {
    class: 'tex-tile' + (TextureStore.previewKey(L) === key ? ' selected' : ''), title,
    style: { backgroundImage: `url(${texThumb(key)})` },
    onclick: () => { applyTexture(L, key); closePopover(); },
  }, el('span', { class: 'dot ' + dotClass }));
  const grid = el('div', { class: 'tex-grid' });
  grid.append(el('h4', null, 'Roblox built-in (work instantly)'));
  TEXTURES.filter((t) => t.group === 'builtin').forEach((t) => grid.append(tile(t.key, t.name + ' — ' + t.rbx, '')));
  grid.append(el('h4', null, 'Shapes (upload once)'));
  TEXTURES.filter((t) => t.group === 'shape').forEach((t) => grid.append(tile(t.key, t.name, 'up')));
  const users = Object.entries(App.effect.textures);
  if (users.length) {
    grid.append(el('h4', null, 'Your images'));
    users.forEach(([k, t]) => grid.append(tile(k, t.name, 'up')));
  }
  pop.append(grid, el('button', { class: 'btn small block', style: { marginTop: '10px' }, onclick: () => { closePopover(); pickImage((k) => applyTexture(L, k)); } }, 'Import your own image…'));
  document.body.append(pop);
  const r = anchor.getBoundingClientRect();
  pop.style.left = Math.max(8, Math.min(window.innerWidth - 340, r.left - 300)) + 'px';
  pop.style.top = Math.max(8, Math.min(window.innerHeight - pop.offsetHeight - 8, r.top)) + 'px';
  setTimeout(() => document.addEventListener('pointerdown', function off(e) {
    if (!pop.contains(e.target)) { closePopover(); document.removeEventListener('pointerdown', off); }
  }), 0);
}

function downloadTexturePng(key, size = 512) {
  const c = TextureStore.render(key, size);
  c.toBlob((b) => U.download(`particly_${key}_${size}.png`, b));
}

/* ------------------------------ user images ------------------------------ */

let imageCallback = null;
function pickImage(cb) { imageCallback = cb; $('texFile').value = ''; $('texFile').click(); }

async function addUserTexture(file) {
  const data = await U.readFile(file, true);
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = data; });
  const max = 256, s = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const key = 'user_' + U.uid();
  const name = file.name.replace(/\.[^.]+$/, '').slice(0, 30) || 'Image';
  App.effect.textures[key] = { name, data: c.toDataURL('image/png') };
  TextureStore.addUser(key, name, App.effect.textures[key].data);
  return key;
}

/* ============================== left panel ============================== */

function setLeftTab(tab) {
  document.querySelectorAll('#leftTabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  ['presets', 'library', 'textures'].forEach((t) => $('tab-' + t).classList.toggle('hidden', t !== tab));
  if (tab === 'library') renderLibrary();
  if (tab === 'textures') renderTextureTab();
}

function renderPresetCats() {
  $('presetCats').replaceChildren(...['All', ...PRESET_CATEGORIES].map((c) => el('button', {
    class: 'chip' + (App.presetCat === c ? ' active' : ''), onclick: () => { App.presetCat = c; renderPresetCats(); renderPresets(); },
  }, c)));
}

function renderPresets() {
  const q = $('presetSearch').value.trim().toLowerCase();
  const items = PRESET_EFFECTS.filter((p) => (App.presetCat === 'All' || p.category === App.presetCat) &&
    (!q || (p.name + ' ' + p.desc + ' ' + p.category).toLowerCase().includes(q)));
  $('presetGrid').replaceChildren(...items.map((p) => {
    const img = el('img', { class: 'thumb', alt: '', src: App.presetThumbs[p.id] || '' });
    img.dataset.preset = p.id;
    return el('div', { class: 'card', title: p.desc, onclick: () => { loadEffect(p); U.toast(`Loaded "${p.name}"`); } },
      img, presetBadge(p), el('div', { class: 'label' }, p.name));
  }));
  if (!items.length) $('presetGrid').append(el('div', { class: 'empty', style: { gridColumn: '1/-1' } }, 'No effects match.'));
}

/** Gallery badge: how the effect behaves once it's in a Roblox game. */
function presetBadge(p) {
  const t = p.trigger;
  const text = {
    vehicle: `🏎 hold ${t.key.replace('Left', '')}`,
    touch: '👆 touch',
    prompt: '💬 prompt',
    character: '🧍 character',
    script: '📜 scripted',
  }[t.mode] || (p.layers.every((l) => l.mode === 'burst') ? '✸ burst' : null);
  return text ? el('span', { class: 'badge', title: BEHAVIOURS[t.mode].label }, text) : null;
}

function generatePresetThumbs() {
  if (!App.thumbView) return;
  const queue = PRESET_EFFECTS.filter((p) => !App.presetThumbs[p.id]);
  const next = () => {
    const p = queue.shift();
    if (!p) return;
    try {
      App.presetThumbs[p.id] = App.thumbView.snapshot(p);
      document.querySelectorAll(`img[data-preset="${p.id}"]`).forEach((i) => { i.src = App.presetThumbs[p.id]; });
    } catch (e) { console.warn(e); }
    setTimeout(next, 16);
  };
  next();
}

function snapshotThumb(effect) {
  try { return App.thumbView ? App.thumbView.snapshot(effect) : ''; } catch { return ''; }
}

/* ------------------------------ library ------------------------------ */

function saveLibrary() { return store.set(LS.library, App.library); }

function saveToLibrary() {
  const E = App.effect;
  const thumb = snapshotThumb(E);
  const existing = App.library.findIndex((x) => x.effect.id === E.id);
  const item = { effect: U.clone(E), thumb, saved: Date.now() };
  if (existing >= 0) App.library[existing] = item; else App.library.unshift(item);
  if (saveLibrary()) U.toast(existing >= 0 ? `Updated "${E.name}" in My Library` : `Saved "${E.name}" to My Library`);
  renderLibrary();
}

function renderLibrary() {
  const grid = $('libGrid');
  $('libEmpty').classList.toggle('hidden', App.library.length > 0);
  grid.replaceChildren(...App.library.map((item, i) => el('div', {
    class: 'card' + (item.effect.id === App.effect.id ? ' current' : ''), title: item.effect.desc || item.effect.name,
    onclick: () => { loadEffect(item.effect, { fresh: true }); App.effect.id = item.effect.id; U.toast(`Loaded "${item.effect.name}"`); renderLibrary(); },
  },
  el('img', { class: 'thumb', src: item.thumb || '', alt: '' }),
  el('div', { class: 'card-actions' },
    el('button', { title: 'Duplicate', onclick: (e) => { e.stopPropagation(); const c = U.clone(item); c.effect.id = U.uid(); c.effect.name += ' copy'; App.library.splice(i + 1, 0, c); saveLibrary(); renderLibrary(); } }, '⧉'),
    el('button', { title: 'Delete', onclick: (e) => { e.stopPropagation(); if (confirm(`Delete "${item.effect.name}" from your library?`)) { App.library.splice(i, 1); saveLibrary(); renderLibrary(); } } }, '✕')),
  el('div', { class: 'label' }, item.effect.name))));
}

/* ------------------------------ textures tab ------------------------------ */

function renderTextureTab() {
  if ($('tab-textures').classList.contains('hidden')) return;
  const grid = $('texGrid');
  const tile = (key, title, dot) => el('div', {
    class: 'tex-tile' + (App.selTexKey === key ? ' selected' : ''), title, style: { backgroundImage: `url(${texThumb(key)})` },
    onclick: () => { App.selTexKey = key; renderTextureTab(); },
  }, el('span', { class: 'dot ' + dot }));
  grid.replaceChildren(
    el('h4', null, 'Roblox built-in'), ...TEXTURES.filter((t) => t.group === 'builtin').map((t) => tile(t.key, t.name, '')),
    el('h4', null, 'Shapes'), ...TEXTURES.filter((t) => t.group === 'shape').map((t) => tile(t.key, t.name, 'up')),
    ...(Object.keys(App.effect.textures).length ? [el('h4', null, 'Your images'), ...Object.entries(App.effect.textures).map(([k, t]) => tile(k, t.name, 'up'))] : []),
  );
  const key = App.selTexKey;
  const detail = $('texDetail');
  if (!key || (!TEX_BY_KEY[key] && !TextureStore.isUser(key))) { detail.replaceChildren(); return; }
  const def = TEX_BY_KEY[key];
  const big = TextureStore.render(key, 256);
  big.className = 'big';
  detail.replaceChildren(
    big,
    el('b', null, def ? def.name : TextureStore.userName(key)),
    def && def.rbx
      ? el('div', { class: 'ok-note' }, 'Built into Roblox: ', el('code', null, def.rbx), el('br'), 'Preview is a close look-alike.')
      : el('div', { class: 'hint', style: { margin: 0 } }, 'Download the PNG, upload it to Roblox, then paste the asset id into a layer\'s Texture field. White textures are best — the layer colour tints them.'),
    el('div', { class: 'row gap wrap' },
      el('button', { class: 'btn small primary grow', onclick: () => { applyTexture(current(), key); U.toast(`Applied to "${current().Name}"`); } }, 'Use on selected layer'),
      el('button', { class: 'btn small grow', onclick: () => downloadTexturePng(key, 512) }, '⬇ PNG 512'),
      el('button', { class: 'btn small grow', onclick: () => downloadTexturePng(key, 256) }, '⬇ PNG 256')),
  );
}

/* ============================== modals ============================== */

function modal(title, body, { width } = {}) {
  const back = el('div', { class: 'modal-back' });
  const close = () => {
    back.remove();
    document.removeEventListener('keydown', onKey);
    if (App.closeModal === close) App.closeModal = null;
  };
  if (App.closeModal) App.closeModal();
  App.closeModal = close;
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const box = el('div', { class: 'modal', style: width ? { width: `min(${width}px, 100%)` } : null },
    el('header', null, el('h2', null, title), el('button', { class: 'close', title: 'Close', onclick: close }, '×')),
    el('div', { class: 'mbody' }, body));
  back.append(box);
  back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });
  document.addEventListener('keydown', onKey);
  $('modalHost').append(back);
  return { close, box };
}

function tabbed(tabs) {
  const nav = el('nav', { class: 'tabs' });
  const bodies = tabs.map(([, build]) => el('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } }, build()));
  const show = (i) => {
    nav.querySelectorAll('button').forEach((b, j) => b.classList.toggle('active', i === j));
    bodies.forEach((b, j) => b.classList.toggle('hidden', i !== j));
  };
  tabs.forEach(([name], i) => nav.append(el('button', { onclick: () => show(i) }, name)));
  show(0);
  return [nav, ...bodies];
}

function codeBox(text) {
  const ta = el('textarea', { class: 'code', readonly: true, spellcheck: false });
  ta.value = text;
  return ta;
}

/* ------------------------------ export ------------------------------ */

function openExport() {
  const E = App.effect;
  const base = U.safeName(E.name);
  const warns = Export.warnings(E);
  const hasBurst = Export.hasBurst(E);
  const warnBox = warns.length ? el('div', { class: 'warn' }, el('b', null, 'Heads up'), el('ul', { style: { margin: '4px 0 0', paddingLeft: '18px' } }, warns.map((w) => el('li', null, w)))) : null;

  const modelTab = () => {
    let container = 'part';
    const radios = el('div', { class: 'row gap wrap' }, ...[
      ['part', 'Part with emitters (recommended)'],
      ['attachment', 'Attachment (all layers emit from one point)'],
      ['emitters', 'Emitters only'],
    ].map(([v, label]) => {
      const r = el('input', { type: 'radio', name: 'container', value: v, checked: v === 'part' });
      r.addEventListener('change', () => { container = v; });
      return el('label', { class: 'vt', style: { color: 'var(--text)' } }, r, label);
    }));
    const character = E.trigger.mode === 'character';
    return [
      el('p', { class: 'hint', style: { margin: 0 } }, 'Easiest way: a Roblox model file with everything set up — emitters plus the scripts for the behaviour below. No scripting needed.'),
      el('div', { class: 'ok-note' }, el('b', null, 'In Roblox: '), BEHAVIOURS[E.trigger.mode].label, ' — change it under Effect › In Roblox.'),
      character ? null : radios,
      el('button', { class: 'btn primary', onclick: () => { U.download(`${base}.rbxmx`, Export.rbxmx(E, { container }), 'application/xml'); U.toast('Downloaded ' + base + '.rbxmx'); } }, `⬇ Download ${base}.rbxmx`),
      el('h4', null, 'Import into Roblox Studio'),
      el('ol', null, ...Behaviour.instructions(E).map((t) => el('li', null, t))),
      character ? null : el('p', { class: 'hint', style: { margin: 0 } }, 'Inside the export: ', el('code', null, 'ParticlyControl'), ' (start / stop / burst / play from any server Script) plus the trigger scripts. "Emitters only" leaves the scripts out.'),
    ];
  };
  const cmdTab = () => {
    const code = Export.commandBar(E);
    return [
      el('p', { class: 'hint', style: { margin: 0 } }, 'Paste into Studio\'s Command Bar. Select one or more Parts / Attachments first to add the effect to them; with nothing selected a new Part is created in front of the camera. Undo with Ctrl+Z.'),
      el('div', { class: 'row gap' },
        el('button', { class: 'btn primary', onclick: () => U.copy(code) }, '⧉ Copy script'),
        el('button', { class: 'btn', onclick: () => U.download(`${base}_command.lua`, code) }, '⬇ .lua')),
      el('ol', null,
        el('li', null, 'In Studio open ', el('b', null, 'View → Command Bar'), '.'),
        el('li', null, 'Paste the script and press ', el('b', null, 'Enter'), '.')),
      codeBox(code),
    ];
  };
  const modTab = () => {
    const code = Export.moduleScript(E);
    return [
      el('p', { class: 'hint', style: { margin: 0 } }, 'For game code: spawn the effect on characters, projectiles, pickups… ', el('code', null, 'Effect.create(part)'), ', ', el('code', null, 'Effect.burst(emitters)'), ', ', el('code', null, 'Effect.playAt(cframe)'), '.'),
      el('div', { class: 'row gap wrap' },
        el('button', { class: 'btn primary', onclick: () => U.copy(code) }, '⧉ Copy ModuleScript'),
        el('button', { class: 'btn', onclick: () => U.download(`${base}.rbxmx`, Export.moduleRbxmx(E), 'application/xml') }, '⬇ ModuleScript .rbxmx'),
        el('button', { class: 'btn', onclick: () => U.download(`${base}.lua`, code) }, '⬇ .lua')),
      el('p', { class: 'hint', style: { margin: 0 } }, 'Drag the .rbxmx into ReplicatedStorage in the Explorer, or create a ModuleScript and paste the code.'),
      codeBox(code),
    ];
  };
  const shareTab = () => {
    // Opened from a file (desktop app / local HTML) a URL is useless to others, so share a code instead.
    const asCode = !/^https?:/.test(location.protocol);
    const linkIn = el('input', { type: 'text', readonly: true, placeholder: asCode ? 'Click "Create code"' : 'Click "Create link"', style: { flex: 1 } });
    const hasImages = Object.keys(E.textures).length > 0;
    return [
      el('h4', null, 'Particly file (.json)'),
      el('p', { class: 'hint', style: { margin: 0 } }, 'Full-fidelity backup you can re-import here or send to a friend. Includes imported images.'),
      el('div', { class: 'row gap' },
        el('button', { class: 'btn primary', onclick: () => U.download(`${base}.particly.json`, Export.json(E), 'application/json') }, '⬇ Download .json'),
        el('button', { class: 'btn', onclick: () => U.copy(Export.json(E)) }, '⧉ Copy JSON')),
      el('h4', null, asCode ? 'Share code' : 'Share link'),
      el('p', { class: 'hint', style: { margin: 0 } }, (asCode ? 'Send this code to a friend — they paste it into Particly\'s Import box.' : 'Anyone opening the link gets this effect loaded.') + (hasImages ? ' Imported images are not included — use the .json file for those.' : '')),
      el('div', { class: 'row gap' }, linkIn,
        el('button', { class: 'btn', onclick: async () => { linkIn.value = await Export.shareLink(E); linkIn.select(); U.copy(linkIn.value); } }, asCode ? 'Create code' : 'Create link')),
    ];
  };
  modal('Export to Roblox', [warnBox, ...tabbed([['Roblox model (.rbxmx)', modelTab], ['Command Bar', cmdTab], ['ModuleScript', modTab], ['Share / backup', shareTab]])], { width: 760 });
}

/* ------------------------------ import ------------------------------ */

function importEffects(effects, label) {
  if (!effects.length) throw new Error('Nothing found to import.');
  effects.forEach(registerTextures);
  if (effects.length > 1) {
    for (const e of effects) App.library.unshift({ effect: U.clone(e), thumb: snapshotThumb(e), saved: Date.now() });
    saveLibrary();
    loadEffect(effects[0]);
    U.toast(`Imported ${effects.length} effects into My Library${label ? ' from ' + label : ''}`);
    setLeftTab('library');
  } else {
    loadEffect(effects[0]);
    const n = effects[0].layers.length;
    U.toast(`Imported "${effects[0].name}" (${n} layer${n > 1 ? 's' : ''})`);
  }
}

async function importFile(file) {
  try {
    if (/^image\//.test(file.type)) {
      const key = await addUserTexture(file);
      applyTexture(current(), key);
      renderTextureTab();
      U.toast(`Image applied to layer "${current().Name}"`);
      return true;
    }
    if (/\.rbxm$/i.test(file.name)) {
      const head = await file.slice(0, 8).text();
      if (head.startsWith('<roblox!')) throw new Error('Binary .rbxm isn\'t supported. In Studio: right-click → Save to File… and choose "Roblox XML Model Files (*.rbxmx)".');
    }
    const text = await file.text();
    importEffects(await Import.fromText(text, file.name), file.name);
    return true;
  } catch (e) {
    U.toast(e.message || String(e), 'err', 6000);
    return false;
  }
}

function openImport() {
  let m;
  const fileIn = el('input', { type: 'file', multiple: true, accept: '.json,.rbxmx,.rbxm,.lua,.luau,.txt,image/*', hidden: true });
  const drop = el('div', { class: 'drop', onclick: () => fileIn.click() },
    el('div', { style: { fontSize: '26px' } }, '⬇'),
    el('b', null, 'Drop files here or click to browse'),
    el('div', null, '.json · .rbxmx · .lua / .luau · .txt · images'));
  const handle = async (files) => {
    let ok = false;
    for (const f of files) ok = (await importFile(f)) || ok;
    if (ok) m.close();
  };
  fileIn.addEventListener('change', () => handle([...fileIn.files]));
  drop.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); drop.classList.remove('over'); handle([...e.dataTransfer.files]); });
  const paste = el('textarea', { class: 'code', style: { height: '120px' }, placeholder: 'Paste Luau code, rbxmx XML, Particly JSON or a share link / code…' });
  const url = el('input', { type: 'url', placeholder: 'https://… (raw .json / .rbxmx / .lua file or share link)', style: { flex: 1 } });
  const run = async (fn) => {
    try { importEffects(await fn()); m.close(); } catch (e) { U.toast(e.message || String(e), 'err', 6000); }
  };
  m = modal('Import', [
    drop, fileIn,
    el('h4', null, 'Paste'),
    paste,
    el('div', null, el('button', { class: 'btn primary', onclick: () => run(() => Import.fromText(paste.value)) }, 'Import pasted text')),
    el('h4', null, 'From a URL'),
    el('div', { class: 'row gap' }, url, el('button', { class: 'btn', onclick: () => run(() => Import.fromUrl(url.value.trim())) }, 'Fetch')),
    el('h4', null, 'What can I import?'),
    el('div', { class: 'formats' },
      el('div', null, el('b', null, 'From Roblox Studio: '), 'select a Part / ParticleEmitters → right-click → ', el('i', null, 'Save to File…'), ' → choose .rbxmx. Every emitter becomes a layer.'),
      el('div', null, el('b', null, 'Luau code: '), 'scripts from tutorials, the DevForum or your game that set ParticleEmitter properties (', el('code', null, 'pe.Rate = 20'), ', property tables, ', el('code', null, 'ColorSequence.new(…)'), ').'),
      el('div', null, el('b', null, 'Particly files & links: '), '.json effects or whole libraries, and share links or codes from other Particly users.'),
      el('div', null, el('b', null, 'Images: '), 'PNG/JPG/WebP become a texture on the selected layer (white on transparent works best).')),
  ], { width: 640 });
}

/* ------------------------------ help ------------------------------ */

function openHelp() {
  modal('Particly — quick guide', [
    el('h4', null, '1. Pick a starting point'),
    el('p', { class: 'hint', style: { margin: 0 } }, 'Choose a preset on the left, hit 🎲 Random, or import an existing effect. 🧬 Vary makes a fresh variation of whatever you have.'),
    el('h4', null, '2. Tweak it'),
    el('ul', null,
      el('li', null, 'Each ', el('b', null, 'layer'), ' is one Roblox ParticleEmitter — stack layers (flames + smoke + sparks) for rich effects.'),
      el('li', null, 'Curves: click to add points, drag to move, ', el('b', null, 'Shift+drag'), ' for random variation (envelope), double-click to delete.'),
      el('li', null, 'Gradients: click the bar to add a colour stop, drag stops, double-click to delete.'),
      el('li', null, el('b', null, 'Burst'), ' layers fire all at once (explosions, hits). Use ', el('b', null, '✸ Emit'), ' or the E key to test.'),
      el('li', null, 'Turn on ', el('b', null, 'Move emitter'), ' to preview trails, LockedToPart and VelocityInheritance.')),
    el('h4', null, '3. Send it to Roblox'),
    el('ul', null,
      el('li', null, el('b', null, 'Export → .rbxmx'), ': drag the file into Studio. Done.'),
      el('li', null, el('b', null, 'Command Bar'), ': paste a script that builds the effect on your selected parts.'),
      el('li', null, el('b', null, 'ModuleScript'), ': spawn the effect from code (abilities, pickups, hits).')),
    el('h4', null, '4. Make it do something in your game'),
    el('p', { class: 'hint', style: { margin: 0 } }, 'Effect › ', el('b', null, 'In Roblox'), ' picks what the exported effect does by itself — the scripts come with the export:'),
    el('ul', null,
      el('li', null, el('b', null, 'Vehicle boost'), ': nitro / exhaust / drift smoke. Drop it into a car model with a VehicleSeat; the driver holds a key (gamepad button and mobile button included) and every player sees it. Tick ', el('b', null, 'Drive'), ' in the preview to see it at speed.'),
      el('li', null, el('b', null, 'Play when touched'), ' (pads, puddles, pickups — cars count too) and ', el('b', null, 'ProximityPrompt'), ' (chests, buttons).'),
      el('li', null, el('b', null, 'Attach to every character'), ': auras, trails, footstep dust.'),
      el('li', null, el('b', null, 'Controlled by my scripts'), ': require(part.ParticlyControl).play(2) / .start() / .stop() / .burst().')),
    el('h4', null, 'Textures'),
    el('p', { class: 'hint', style: { margin: 0 } }, 'Built-in textures ship with Roblox and just work. Generated shapes (hearts, leaves, rings…) need a one-time upload: download the PNG from the Textures tab, import it in Studio (Asset Manager → Import), right-click → Copy Asset ID, and paste it into the layer\'s Texture box.'),
    el('h4', null, 'Shortcuts'),
    el('p', { class: 'hint', style: { margin: 0 } }, 'Space: pause · E: emit burst · Ctrl+Z / Ctrl+Shift+Z: undo / redo · Ctrl+S: save to library · double-click the view: frame particles.'),
    el('p', { class: 'hint', style: { margin: 0 } }, 'Everything runs locally on your computer; your library is stored on this computer only — export it to back it up.'),
  ], { width: 620 });
}

/* ============================== random generator ============================== */

function randomPalette() {
  const h = Math.random();
  const scheme = U.pick(['analog', 'analog', 'mono', 'complement', 'hot', 'white']);
  const c = (dh, s, v) => U.rgbToHex(U.hsvToRgb([h + dh, s, v]));
  switch (scheme) {
    case 'mono': return [c(0, 0.3, 1), c(0, 0.85, 0.9)];
    case 'complement': return [c(0, 0.7, 1), c(0.5, 0.8, 0.9)];
    case 'hot': return ['#fff3b0', c(0.02, 0.9, 1), c(-0.03, 0.95, 0.6)];
    case 'white': return ['#ffffff', c(0, 0.5, 1)];
    default: return [c(0, 0.4, 1), c(0.08, 0.8, 1), c(0.16, 0.9, 0.7)];
  }
}

function randomLayer(palette, kind) {
  const tex = U.pick(['rbx_sparkles', 'rbx_ff_glow', 'rbx_ff_glow', 'rbx_fire', 'rbx_smoke', 'rbx_fire_sparks', 'rbx_exp_shock', 'rbx_ff_vortex', 'star4', 'ring', 'streak', 'circle', 'flare']);
  const def = TEX_BY_KEY[tex];
  const sz = U.rand(0.3, 2.5);
  const sizeCurve = U.pick([[[0, sz], [1, 0]], [[0, 0], [0.25, sz, sz * 0.3], [1, 0]], [[0, sz * 0.3], [1, sz * 1.8]], [[0, sz, sz * 0.3], [1, sz, sz * 0.3]]]);
  const trans = U.pick([[[0, 0], [1, 1]], [[0, 1], [0.2, 0], [0.8, 0], [1, 1]], [[0, 0], [0.7, 0.1], [1, 1]]]);
  const L = {
    Name: kind[0].toUpperCase() + kind.slice(1), Texture: def.rbx || '', previewTex: tex,
    Color: Math.random() < 0.3 ? [...palette].reverse() : palette, Size: sizeCurve, Transparency: trans,
    LightEmission: Math.random() < 0.6 ? 1 : U.rand(0, 0.5), Brightness: Math.random() < 0.5 ? U.rand(1, 3) : 1,
    Rotation: [0, 360], RotSpeed: Math.random() < 0.5 ? [-U.rand(0, 180), U.rand(0, 180)] : [0, 0],
  };
  if (def.key === 'streak') L.Orientation = 'VelocityParallel';
  switch (kind) {
    case 'fountain': Object.assign(L, { Rate: U.randInt(30, 120), Lifetime: [1, 2], Speed: [U.rand(10, 18), U.rand(18, 25)], SpreadAngle: [U.rand(5, 25), U.rand(5, 25)], Acceleration: [0, -U.rand(15, 40), 0] }); break;
    case 'rise': Object.assign(L, { Rate: U.randInt(10, 60), Lifetime: [1, U.rand(1.5, 3)], Speed: [U.rand(1, 3), U.rand(3, 6)], SpreadAngle: [U.rand(0, 30), U.rand(0, 30)], Acceleration: [0, U.rand(0, 4), 0], Shape: U.pick(['Box', 'Disc']) }); break;
    case 'explode': Object.assign(L, { mode: 'burst', Enabled: false, emitCount: U.randInt(15, 80), Lifetime: [0.5, U.rand(0.8, 1.6)], Speed: [U.rand(8, 15), U.rand(15, 35)], Shape: 'Sphere', Drag: U.rand(1.5, 5), Acceleration: [0, Math.random() < 0.5 ? -U.rand(5, 20) : 0, 0] }); break;
    case 'aura': Object.assign(L, { Rate: U.randInt(15, 50), Lifetime: [0.8, 1.6], Speed: [0.5, 2], Shape: U.pick(['Cylinder', 'Sphere']), ShapeStyle: 'Surface', Acceleration: [0, U.rand(0, 4), 0], LockedToPart: true }); break;
    case 'drift': Object.assign(L, { Rate: U.randInt(5, 30), Lifetime: [2, U.rand(3, 6)], Speed: [0.2, U.rand(0.5, 2)], SpreadAngle: [180, 180], Shape: 'Sphere' }); break;
    case 'jet': Object.assign(L, { Rate: U.randInt(60, 200), Lifetime: [0.2, U.rand(0.3, 0.7)], Speed: [U.rand(15, 25), U.rand(25, 45)], SpreadAngle: [U.rand(0, 8), U.rand(0, 8)], Orientation: 'VelocityParallel', Squash: -1.5 }); break;
  }
  return L;
}

function randomEffect() {
  const palette = randomPalette();
  const kinds = ['fountain', 'rise', 'explode', 'aura', 'drift', 'jet'];
  const main = U.pick(kinds);
  const layers = [randomLayer(palette, main)];
  const n = U.pick([0, 1, 1, 2]);
  for (let i = 0; i < n; i++) {
    const k = main === 'explode' && Math.random() < 0.6 ? 'explode' : U.pick(kinds.filter((x) => x !== 'explode'));
    const L = randomLayer(Math.random() < 0.7 ? palette : randomPalette(), k);
    if (L.mode !== 'burst') L.Rate = Math.max(4, Math.round(L.Rate * 0.5));
    layers.push(L);
  }
  const adj = U.pick(['Arcane', 'Solar', 'Frost', 'Neon', 'Mystic', 'Cosmic', 'Ember', 'Crystal', 'Shadow', 'Lunar', 'Toxic', 'Storm', 'Prism', 'Spirit']);
  const noun = { fountain: 'Fountain', rise: 'Rise', explode: 'Burst', aura: 'Aura', drift: 'Drift', jet: 'Jet' }[main];
  return { name: `${adj} ${noun}`, category: 'Random', partSize: main === 'aura' ? [3, 4, 3] : [2, 1, 2], burstLoop: 2, layers };
}

function mutateEffect() {
  const E = App.effect;
  const j = (v, a = 0.25) => v * U.rand(1 - a, 1 + a);
  const dh = U.rand(-0.06, 0.06);
  for (const L of E.layers) {
    L.Rate = Math.max(0, Math.round(j(L.Rate)));
    L.Lifetime = Model.range(L.Lifetime.map((v) => U.clamp(j(v, 0.2), 0, 20)), L.Lifetime);
    L.Speed = Model.range(L.Speed.map((v) => j(v)), L.Speed);
    L.SpreadAngle = L.SpreadAngle.map((v) => U.clamp(v + U.rand(-10, 10), 0, 180));
    L.Acceleration = L.Acceleration.map((v) => j(v, 0.3));
    L.RotSpeed = L.RotSpeed.map((v) => j(v, 0.4));
    L.Size.forEach((k) => { k.v = U.clamp(j(k.v, 0.2), 0, 100); });
    L.Color.forEach((k) => { const h = U.rgbToHsv(k.c); h[0] += dh; h[1] = U.clamp(h[1] * U.rand(0.85, 1.15), 0, 1); k.c = U.hsvToRgb(h); });
    if (L.mode === 'burst') L.emitCount = Math.max(1, Math.round(j(L.emitCount)));
  }
  commit();
  refreshAll();
}

/* ============================== main loop & boot ============================== */

function startLoop() {
  let last = performance.now(), frames = 0, acc = 0;
  const stats = $('viewStats');
  const loop = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    App.view.step(dt);
    App.view.render();
    frames++; acc += dt;
    if (acc >= 0.5) {
      const n = App.view.sim.count();
      stats.textContent = `${n.toLocaleString()} particles · ${Math.round(frames / acc)} fps${n > 3000 ? ' · heavy for mobile' : ''}`;
      frames = 0; acc = 0;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function bindTopBar() {
  $('effectName').addEventListener('input', (e) => { App.effect.name = e.target.value.slice(0, 60) || 'Effect'; });
  $('effectName').addEventListener('change', commit);
  $('btnNew').onclick = () => { loadEffect(Model.newEffect()); U.toast('New effect'); };
  $('btnUndo').onclick = undo;
  $('btnRedo').onclick = redo;
  $('btnRandom').onclick = () => loadEffect(randomEffect());
  $('btnMutate').onclick = () => { mutateEffect(); U.toast('Variation created — Ctrl+Z to go back'); };
  $('btnSave').onclick = saveToLibrary;
  $('btnLibSave').onclick = saveToLibrary;
  $('btnImport').onclick = openImport;
  $('btnExport').onclick = openExport;
  $('btnHelp').onclick = openHelp;
  $('btnAddLayer').onclick = () => addLayer();
  $('btnPack').onclick = () => { U.download('ParticlyPresets.rbxmx', Export.rbxmxPack(PRESET_EFFECTS, 'ParticlyPresets'), 'application/xml'); U.toast('Downloaded all presets as one Roblox model'); };
  $('btnLibExport').onclick = () => {
    if (!App.library.length) return U.toast('Your library is empty', 'warn');
    U.download('particly-library.json', Export.libraryJson(App.library.map((x) => x.effect)), 'application/json');
  };
  $('btnLibPack').onclick = () => {
    if (!App.library.length) return U.toast('Your library is empty', 'warn');
    U.download('ParticlyLibrary.rbxmx', Export.rbxmxPack(App.library.map((x) => x.effect), 'ParticlyLibrary'), 'application/xml');
  };
  $('btnTexUpload').onclick = () => pickImage((k) => { App.selTexKey = k; applyTexture(current(), k); renderTextureTab(); });
  $('texFile').addEventListener('change', async () => {
    const f = $('texFile').files[0];
    if (!f) return;
    try {
      const key = await addUserTexture(f);
      imageCallback && imageCallback(key);
      U.toast(`Imported image "${TextureStore.userName(key)}"`);
    } catch { U.toast('Could not read that image', 'err'); }
  });
  document.querySelectorAll('#leftTabs button').forEach((b) => { b.onclick = () => setLeftTab(b.dataset.tab); });
  $('presetSearch').addEventListener('input', renderPresets);
}

function bindViewBar() {
  const v = App.view, s = v.settings;
  const play = $('vPlay');
  const togglePause = () => { s.paused = !s.paused; play.textContent = s.paused ? '▶' : '⏸'; };
  play.onclick = togglePause;
  $('vRestart').onclick = () => v.reset();
  $('vBurst').onclick = () => v.burst();
  $('vSpeed').onchange = (e) => { s.speed = +e.target.value; };
  $('vGrid').onchange = (e) => { s.grid = e.target.checked; };
  $('vPart').onchange = (e) => { s.part = e.target.checked; };
  $('vMove').onchange = (e) => { s.move = e.target.checked; if (s.move) { s.drive = false; $('vDrive').checked = false; } };
  $('vDrive').onchange = (e) => { s.drive = e.target.checked; if (s.drive) { s.move = false; $('vMove').checked = false; } v.frame(); };
  $('vAuto').onchange = (e) => { s.autoBurst = e.target.checked; };
  $('vBg').onchange = (e) => { s.bg = e.target.value; };
  $('vFrame').onclick = () => v.frame();

  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);
    const mod = e.ctrlKey || e.metaKey;
    const desktop = !!window.particlyDesktop; // the desktop app's menu owns Ctrl+S / Z / Y
    if (!desktop && mod && e.key.toLowerCase() === 's') { e.preventDefault(); saveToLibrary(); return; }
    if (typing || document.querySelector('.modal-back')) return;
    if (!desktop && mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if (!desktop && mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    else if (e.key === ' ') { e.preventDefault(); togglePause(); }
    else if (e.key.toLowerCase() === 'e' && !mod) v.burst();
  });

  // drop files anywhere
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    if (document.querySelector('.modal-back')) return;
    for (const f of e.dataTransfer.files) await importFile(f);
  });
}

/* ============================== desktop app bridge ============================== */

function bindDesktop() {
  const D = window.particlyDesktop;
  if (!D) return;
  document.body.classList.add('desktop');
  const editingText = () => /^(INPUT|TEXTAREA)$/.test(document.activeElement && document.activeElement.tagName);
  const withoutModal = (fn) => () => { if (App.closeModal) App.closeModal(); fn(); };
  const commands = {
    new: withoutModal(() => $('btnNew').click()),
    import: withoutModal(openImport),
    export: withoutModal(openExport),
    help: withoutModal(openHelp),
    save: saveToLibrary,
    undo: () => (editingText() ? document.execCommand('undo') : undo()),
    redo: () => (editingText() ? document.execCommand('redo') : redo()),
    random: withoutModal(() => $('btnRandom').click()),
    vary: withoutModal(() => $('btnMutate').click()),
    addLayer: () => addLayer(),
    burst: () => App.view && App.view.burst(),
    pause: () => $('vPlay').click(),
    restart: () => App.view && App.view.reset(),
    frame: () => App.view && App.view.frame(),
  };
  D.onMenu((cmd) => commands[cmd] && commands[cmd]());
  const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };
  D.onOpenFile(({ name, data }) => {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (App.closeModal) App.closeModal();
    importFile(new File([data], name, { type: MIME[ext] || '' }));
  });
  D.ready();
}

async function boot() {
  const ui = store.get(LS.ui, null);
  if (ui && ui.openSections) Object.assign(App.openSections, ui.openSections);
  App.library = (store.get(LS.library, []) || []).filter((x) => x && x.effect).map((x) => ({ ...x, effect: Model.normalizeEffect(x.effect) }));

  try {
    App.view = new ParticleView($('view'));
    const tc = document.createElement('canvas');
    tc.width = 200; tc.height = 150;
    App.thumbView = new ParticleView(tc, { thumb: true });
    App.thumbView.settings.grid = false;
    App.thumbView.settings.part = false;
  } catch (e) {
    if (window.particlyDesktop && window.particlyDesktop.webglFailed) window.particlyDesktop.webglFailed();
    $('center').replaceChildren(el('div', { class: 'empty', style: { padding: '40px' } }, 'Particly needs WebGL2 for the live preview. Please use a recent Chrome, Edge, Firefox or Safari. (', String(e.message || e), ')'));
  }
  TextureStore.onChange = () => { renderLayers(); };

  bindTopBar();
  $('presetSearch').placeholder = `Search ${PRESET_EFFECTS.length} effects…`;
  buildAddFromPreset();
  renderPresetCats();
  renderPresets();

  // Initial effect: share link > last session > Campfire
  let initial = null;
  if (/#fx=/.test(location.hash)) {
    try { initial = (await Import.fromShare(location.hash))[0]; U.toast(`Loaded shared effect "${initial.name}"`); } catch { U.toast('That share link looks broken', 'err'); }
    history.replaceState(null, '', location.pathname + location.search);
  }
  if (!initial) {
    const saved = store.get(LS.current, null);
    if (saved && Array.isArray(saved.layers)) initial = Model.normalizeEffect(saved);
  }
  if (!initial) initial = PRESET_EFFECTS[0];
  const keepId = initial.id;
  loadEffect(initial, { fresh: true });
  if (keepId && !String(keepId).startsWith('preset_')) App.effect.id = keepId;
  App.snap = JSON.stringify(App.effect);
  App.undo = [];
  updateUndoButtons();

  if (App.view) {
    // A context lost right after start-up means the GPU can't run WebGL: the desktop app retries in software mode.
    const bootTime = performance.now();
    $('view').addEventListener('webglcontextlost', () => {
      if (performance.now() - bootTime < 8000 && window.particlyDesktop && window.particlyDesktop.webglFailed) window.particlyDesktop.webglFailed();
    });
    bindViewBar();
    startLoop();
    setTimeout(generatePresetThumbs, 300);
  }
  window.addEventListener('resize', closePopover);
  bindDesktop();
}

boot();
