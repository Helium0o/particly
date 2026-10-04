'use strict';
/*
 * Data model. A Particly "effect" is a list of layers; each layer maps 1:1 to a
 * Roblox ParticleEmitter and uses Roblox property names so exports are direct.
 *
 * Sequences are stored as keypoint arrays:
 *   NumberSequence: [{t, v, e}]  (time 0..1, value, envelope)
 *   ColorSequence:  [{t, c:[r,g,b]}] (0..1 floats)
 */

const ENUMS = {
  // Order == Roblox enum value (used for rbxmx <token>)
  EmissionDirection: { type: 'NormalId', items: ['Right', 'Top', 'Back', 'Left', 'Bottom', 'Front'] },
  Orientation: { type: 'ParticleOrientation', items: ['FacingCamera', 'FacingCameraWorldUp', 'VelocityParallel', 'VelocityPerpendicular'] },
  Shape: { type: 'ParticleEmitterShape', items: ['Box', 'Sphere', 'Cylinder', 'Disc'] },
  ShapeStyle: { type: 'ParticleEmitterShapeStyle', items: ['Volume', 'Surface'] },
  ShapeInOut: { type: 'ParticleEmitterShapeInOut', items: ['Outward', 'Inward', 'InAndOut'] },
  FlipbookLayout: { type: 'ParticleFlipbookLayout', items: ['None', 'Grid2x2', 'Grid4x4', 'Grid8x8'] },
  FlipbookMode: { type: 'ParticleFlipbookMode', items: ['Loop', 'OneShot', 'PingPong', 'Random'] },
};

const DEFAULT_TEXTURE = 'rbxasset://textures/particles/sparkles_main.dds';

/*
 * Property schema. `roblox: false` marks editor-only fields (not exported as
 * properties). Sections drive the property panel layout.
 */
const PROPS = [
  // Appearance
  { key: 'Texture', type: 'texture', sec: 'Appearance', help: 'Image used for each particle. Roblox needs an asset id (rbxassetid://…) or a built-in rbxasset:// path.' },
  { key: 'Color', type: 'colorseq', sec: 'Appearance', help: 'Colour over each particle\'s lifetime.' },
  { key: 'Transparency', type: 'numseq', sec: 'Appearance', min: 0, max: 1, help: 'Transparency over lifetime (0 = solid, 1 = invisible).' },
  { key: 'Size', type: 'numseq', sec: 'Appearance', min: 0, max: 100, soft: 10, help: 'Size in studs over lifetime. Envelope adds random variation.' },
  { key: 'Squash', type: 'numseq', sec: 'Appearance', min: -3, max: 3, help: 'Stretch particles: positive = wider, negative = taller.' },
  { key: 'LightEmission', type: 'number', sec: 'Appearance', min: 0, max: 1, step: 0.01, help: '0 = normal blending, 1 = fully additive (glowy).' },
  { key: 'LightInfluence', type: 'number', sec: 'Appearance', min: 0, max: 1, step: 0.01, help: 'How much world lighting affects colour (not simulated in preview).' },
  { key: 'Brightness', type: 'number', sec: 'Appearance', min: 0, max: 10, step: 0.05, help: 'Multiplies emitted light. Values > 1 bloom in-game.' },
  { key: 'Orientation', type: 'enum', sec: 'Appearance', help: 'How particles face the camera / their velocity.' },
  { key: 'ZOffset', type: 'number', sec: 'Appearance', min: -10, max: 10, step: 0.1, help: 'Pushes particles toward (+) or away from (−) the camera for sorting.' },
  // Emission
  { key: 'Rate', type: 'number', sec: 'Emission', min: 0, max: 500, step: 1, help: 'Particles emitted per second.' },
  { key: 'Lifetime', type: 'range', sec: 'Emission', min: 0, max: 20, step: 0.05, help: 'Seconds each particle lives (random between min & max).' },
  { key: 'EmissionDirection', type: 'enum', sec: 'Emission', help: 'Face of the parent part particles are emitted from.' },
  { key: 'SpreadAngle', type: 'vec2', sec: 'Emission', step: 1, help: 'Random angular spread in degrees (X, Y). 180 = all directions.' },
  { key: 'TimeScale', type: 'number', sec: 'Emission', min: 0, max: 1, step: 0.01, help: 'Simulation speed (1 = normal, 0 = frozen).' },
  // Motion
  { key: 'Speed', type: 'range', sec: 'Motion', min: -100, max: 100, step: 0.1, help: 'Initial speed in studs/second.' },
  { key: 'Acceleration', type: 'vec3', sec: 'Motion', step: 0.1, help: 'Constant world acceleration (e.g. 0, -20, 0 for gravity).' },
  { key: 'Drag', type: 'number', sec: 'Motion', min: 0, max: 20, step: 0.05, help: 'How fast particles lose speed (exponential).' },
  { key: 'Rotation', type: 'range', sec: 'Motion', min: -360, max: 360, step: 1, help: 'Starting rotation in degrees.' },
  { key: 'RotSpeed', type: 'range', sec: 'Motion', min: -1000, max: 1000, step: 1, help: 'Spin speed in degrees/second.' },
  { key: 'VelocityInheritance', type: 'number', sec: 'Motion', min: 0, max: 1, step: 0.01, help: 'Fraction of the part\'s velocity added to new particles.' },
  { key: 'LockedToPart', type: 'bool', sec: 'Motion', help: 'Particles move with the part instead of being left behind.' },
  { key: 'WindAffectsDrag', type: 'bool', sec: 'Motion', help: 'If on (and Drag > 0) particles follow Workspace wind.' },
  // Shape
  { key: 'Shape', type: 'enum', sec: 'Shape', help: 'Volume particles spawn from.' },
  { key: 'ShapeStyle', type: 'enum', sec: 'Shape', help: 'Spawn inside the volume or on its surface.' },
  { key: 'ShapeInOut', type: 'enum', sec: 'Shape', help: 'Emit outward, inward, or both.' },
  { key: 'ShapePartial', type: 'number', sec: 'Shape', min: 0, max: 1, step: 0.01, help: 'Partial shape: sphere arc / disc & cylinder inner radius.' },
  // Flipbook
  { key: 'FlipbookLayout', type: 'enum', sec: 'Flipbook', help: 'Texture is a sprite sheet with this grid.' },
  { key: 'FlipbookMode', type: 'enum', sec: 'Flipbook', help: 'How frames play.' },
  { key: 'FlipbookFramerate', type: 'range', sec: 'Flipbook', min: 0, max: 60, step: 1, help: 'Frames per second.' },
  { key: 'FlipbookStartRandom', type: 'bool', sec: 'Flipbook', help: 'Start each particle on a random frame.' },
];
const PROP_BY_KEY = Object.fromEntries(PROPS.map((p) => [p.key, p]));
const SECTIONS = ['Appearance', 'Emission', 'Motion', 'Shape', 'Flipbook'];

const LAYER_DEFAULTS = {
  Name: 'ParticleEmitter',
  Enabled: true,
  Texture: DEFAULT_TEXTURE,
  Color: [{ t: 0, c: [1, 1, 1] }, { t: 1, c: [1, 1, 1] }],
  Transparency: [{ t: 0, v: 0, e: 0 }, { t: 1, v: 0, e: 0 }],
  Size: [{ t: 0, v: 1, e: 0 }, { t: 1, v: 1, e: 0 }],
  Squash: [{ t: 0, v: 0, e: 0 }, { t: 1, v: 0, e: 0 }],
  LightEmission: 0,
  LightInfluence: 0,
  Brightness: 1,
  Orientation: 'FacingCamera',
  ZOffset: 0,
  Rate: 20,
  Lifetime: [5, 10],
  EmissionDirection: 'Top',
  SpreadAngle: [0, 0],
  TimeScale: 1,
  Speed: [5, 5],
  Acceleration: [0, 0, 0],
  Drag: 0,
  Rotation: [0, 0],
  RotSpeed: [0, 0],
  VelocityInheritance: 0,
  LockedToPart: false,
  WindAffectsDrag: false,
  Shape: 'Box',
  ShapeStyle: 'Volume',
  ShapeInOut: 'Outward',
  ShapePartial: 1,
  FlipbookLayout: 'None',
  FlipbookMode: 'Loop',
  FlipbookFramerate: [1, 1],
  FlipbookStartRandom: false,
  // Editor-only fields
  previewTex: '',      // texture key used for the live preview ('' = derive from Texture)
  mode: 'continuous',  // 'continuous' | 'burst'
  emitCount: 20,       // particles per burst (exported as EmitCount attribute)
  emitDelay: 0,        // seconds after loop start (EmitDelay attribute)
  point: false,        // emit from the part's centre (exported inside an Attachment)
  hidden: false,
};

const EFFECT_DEFAULTS = {
  name: 'New Effect',
  category: 'Custom',
  desc: '',
  partSize: [2, 1, 2],
  burstLoop: 2,
  textures: {}, // user textures: key -> {name, data (dataURL)}
  layers: [],
};

const Model = {
  /* ---------- sequence helpers ---------- */
  numSeq(input, fallback) {
    // Accepts: number | [a,b] (start/end) | [[t,v,e?],...] | [{t,v,e}]
    let kps;
    if (typeof input === 'number') kps = [{ t: 0, v: input, e: 0 }, { t: 1, v: input, e: 0 }];
    else if (Array.isArray(input) && input.length && typeof input[0] === 'number') {
      if (input.length === 1) return Model.numSeq(input[0]);
      kps = input.map((v, i) => ({ t: i / (input.length - 1), v, e: 0 }));
    } else if (Array.isArray(input) && input.length) {
      kps = input.map((k) => Array.isArray(k) ? { t: +k[0], v: +k[1], e: +(k[2] || 0) } : { t: +k.t, v: +k.v, e: +(k.e || 0) });
    } else return U.clone(fallback);
    return Model.fixSeq(kps.filter((k) => isFinite(k.t) && isFinite(k.v)), fallback, (a) => ({ ...a }));
  },
  colorSeq(input, fallback) {
    // Accepts: '#hex' | [r,g,b] floats | ['#a','#b',...] | [[t,'#hex'|[r,g,b]],...] | [{t,c}]
    const toRgb = (c) => typeof c === 'string' ? U.hexToRgb(c) : Array.isArray(c) ? c.map(Number) : [1, 1, 1];
    let kps;
    if (typeof input === 'string') kps = [{ t: 0, c: toRgb(input) }, { t: 1, c: toRgb(input) }];
    else if (Array.isArray(input) && input.length === 3 && input.every((n) => typeof n === 'number')) kps = [{ t: 0, c: input }, { t: 1, c: input }];
    else if (Array.isArray(input) && input.length && typeof input[0] === 'string') {
      if (input.length === 1) return Model.colorSeq(input[0]);
      kps = input.map((c, i) => ({ t: i / (input.length - 1), c: toRgb(c) }));
    } else if (Array.isArray(input) && input.length) {
      kps = input.map((k) => Array.isArray(k) ? { t: +k[0], c: toRgb(k[1]) } : { t: +k.t, c: toRgb(k.c) });
    } else return U.clone(fallback);
    return Model.fixSeq(kps.filter((k) => isFinite(k.t)), fallback, (a) => ({ ...a, c: [...a.c] }));
  },
  /** Roblox rules: 2..20 keypoints, sorted, first at t=0, last at t=1. */
  fixSeq(kps, fallback, copy) {
    if (!kps.length) return U.clone(fallback);
    kps.sort((a, b) => a.t - b.t);
    kps.forEach((k) => { k.t = U.clamp(k.t, 0, 1); });
    if (kps[0].t > 0) kps.unshift({ ...copy(kps[0]), t: 0 });
    if (kps[kps.length - 1].t < 1) kps.push({ ...copy(kps[kps.length - 1]), t: 1 });
    if (kps.length > 20) kps = kps.filter((_, i) => i === 0 || i === kps.length - 1 || i % Math.ceil(kps.length / 18) === 0).slice(0, 20);
    return kps;
  },
  range(input, fallback) {
    if (typeof input === 'number') return [input, input];
    if (Array.isArray(input) && input.length >= 1) {
      const a = +input[0], b = input.length > 1 ? +input[1] : a;
      if (isFinite(a) && isFinite(b)) return [Math.min(a, b), Math.max(a, b)];
    }
    return [...fallback];
  },
  vec(input, n, fallback) {
    if (typeof input === 'number') return Array(n).fill(input);
    if (Array.isArray(input) && input.length >= n && input.slice(0, n).every((v) => isFinite(+v))) return input.slice(0, n).map(Number);
    return [...fallback];
  },

  evalNum(kps, t, r) {
    let i = 1;
    while (i < kps.length - 1 && kps[i].t < t) i++;
    const a = kps[i - 1], b = kps[i];
    const f = b.t > a.t ? U.clamp((t - a.t) / (b.t - a.t), 0, 1) : 0;
    return a.v + (b.v - a.v) * f + (a.e + (b.e - a.e) * f) * r;
  },
  evalColor(kps, t, out) {
    let i = 1;
    while (i < kps.length - 1 && kps[i].t < t) i++;
    const a = kps[i - 1], b = kps[i];
    const f = b.t > a.t ? U.clamp((t - a.t) / (b.t - a.t), 0, 1) : 0;
    out[0] = a.c[0] + (b.c[0] - a.c[0]) * f;
    out[1] = a.c[1] + (b.c[1] - a.c[1]) * f;
    out[2] = a.c[2] + (b.c[2] - a.c[2]) * f;
    return out;
  },

  /* ---------- normalisation (tolerant of shorthand + bad input) ---------- */
  normalizeLayer(src = {}) {
    const d = LAYER_DEFAULTS;
    const L = { id: src.id || U.uid() };
    for (const key of Object.keys(d)) {
      const p = PROP_BY_KEY[key];
      const v = src[key];
      if (!p) {
        L[key] = v === undefined ? d[key] : (typeof d[key] === 'number' ? (isFinite(+v) ? +v : d[key]) : typeof d[key] === 'boolean' ? !!v : String(v));
        continue;
      }
      switch (p.type) {
        case 'numseq': L[key] = Model.numSeq(v, d[key]); break;
        case 'colorseq': L[key] = Model.colorSeq(v, d[key]); break;
        case 'range': L[key] = Model.range(v, d[key]); break;
        case 'vec2': L[key] = Model.vec(v, 2, d[key]); break;
        case 'vec3': L[key] = Model.vec(v, 3, d[key]); break;
        case 'number': L[key] = isFinite(+v) && v !== null && v !== '' ? +v : d[key]; break;
        case 'bool': L[key] = v === undefined ? d[key] : !!v; break;
        case 'enum': L[key] = ENUMS[key].items.includes(v) ? v : d[key]; break;
        case 'texture': L[key] = typeof v === 'string' ? v.trim() : d[key]; break;
      }
    }
    if (!['continuous', 'burst'].includes(L.mode)) L.mode = 'continuous';
    L.emitCount = Math.max(0, Math.round(L.emitCount));
    L.emitDelay = Math.max(0, L.emitDelay);
    return L;
  },
  normalizeEffect(src = {}) {
    const E = { id: src.id || U.uid() };
    E.name = String(src.name || EFFECT_DEFAULTS.name).slice(0, 60);
    E.category = String(src.category || src.cat || EFFECT_DEFAULTS.category);
    E.desc = String(src.desc || '');
    E.partSize = Model.vec(src.partSize || src.part, 3, EFFECT_DEFAULTS.partSize).map((v) => U.clamp(v, 0.05, 2048));
    E.burstLoop = isFinite(+src.burstLoop) && +src.burstLoop > 0 ? +src.burstLoop : EFFECT_DEFAULTS.burstLoop;
    E.trigger = Behaviour.normalize(src.trigger); // what the effect does by itself in Roblox
    E.underglow = Neon.normalize(src.underglow); // optional car neon plate (SurfaceGui + light)
    E.textures = {};
    if (src.textures && typeof src.textures === 'object') {
      for (const [k, t] of Object.entries(src.textures)) {
        if (t && typeof t.data === 'string' && t.data.startsWith('data:image/')) E.textures[k] = { name: String(t.name || k), data: t.data };
      }
    }
    const layers = Array.isArray(src.layers) ? src.layers : [];
    E.layers = layers.slice(0, 32).map((l) => Model.normalizeLayer(l));
    if (!E.layers.length) E.layers.push(Model.normalizeLayer({}));
    return E;
  },
  newEffect() {
    return Model.normalizeEffect({ name: 'New Effect', layers: [{ Name: 'Emitter' }] });
  },
};
