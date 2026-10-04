'use strict';
/*
 * Car neon / underglow: a glowing design drawn on a flat plate under a car.
 *
 * In Roblox this exports as a SurfaceGui (LightInfluence 0 = it glows) on the effect Part's
 * Top face, plus a SurfaceLight that throws the neon colour onto the road. The plate *is* the
 * effect Part: its X size is the car's width and its Z size the car's length.
 *
 * Designs are white masks (tinted by the chosen colour), portrait: x = car width, y = car length.
 * "Frame" designs (bars, LEDs, ring…) are rebuilt from GUI Frames in Roblox, so they need no
 * image upload. Icon designs export as a PNG you upload once and paste the asset id for.
 */

const NEON_W = 256, NEON_H = 512;

const NEON_ANIMS = {
  none: 'Steady', pulse: 'Pulse', breathe: 'Breathe', flicker: 'Flicker', strobe: 'Strobe', rainbow: 'Rainbow cycle',
  chase: 'Chasing LEDs', scanner: 'Scanner sweep', police: 'Police (2 colours)', duo: 'Two-colour fade',
};
/** Animations that use the second colour. */
const NEON_TWO_COLOUR = ['police', 'duo'];

const NEON_DEFAULTS = {
  enabled: false, design: 'led', text: 'TURBO', color: [0.25, 0.6, 1], color2: [1, 0.1, 0.15], brightness: 2, opacity: 1,
  anim: 'none', animSpeed: 1, light: true, lightBrightness: 3, lightRange: 10, imageId: '',
  image: '', // design 'image': key of a full-colour neon picture in effect.textures (NFS Neon tab)
};

const Neon = (() => {
  /* ---------------- rect specs (shared by preview canvas and Roblox GUI Frames) ---------------- */
  // rect: { x, y, w, h } in 0..1 of the plate, pill: rounded ends, stroke: outline px (on 256x512), a: alpha
  const pill = (x, y, w, h, a = 1) => ({ x, y, w, h, pill: true, a });
  function sideBars() { return [pill(0.05, 0.17, 0.07, 0.66), pill(0.88, 0.17, 0.07, 0.66)]; }
  function endBars() { return [pill(0.3, 0.035, 0.4, 0.035), pill(0.3, 0.93, 0.4, 0.035)]; }
  function dots(n, x, y0, y1, w = 0.05, h = 0.022) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(pill(x, y0 + (y1 - y0) * (i / (n - 1)), w, h));
    return out;
  }
  function ledSides() { return [...dots(12, 0.06, 0.18, 0.8), ...dots(12, 0.89, 0.18, 0.8)]; }
  function ledEnds() {
    const out = [];
    for (let i = 0; i < 6; i++) { out.push(pill(0.27 + i * 0.08, 0.04, 0.05, 0.022)); out.push(pill(0.27 + i * 0.08, 0.935, 0.05, 0.022)); }
    return out;
  }

  /* ---------------- emblems (drawn at the front and back of the plate) ---------------- */
  function path(ctx, pts) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); }
  const EMBLEMS = {
    heart(ctx, s) {
      ctx.beginPath();
      ctx.moveTo(0, s * 0.42);
      ctx.bezierCurveTo(-s * 0.85, -s * 0.12, -s * 0.45, -s * 0.72, 0, -s * 0.28);
      ctx.bezierCurveTo(s * 0.45, -s * 0.72, s * 0.85, -s * 0.12, 0, s * 0.42);
      ctx.fill();
    },
    flame(ctx, s) {
      for (const [dx, k] of [[-0.42, 0.75], [0, 1], [0.42, 0.75]]) {
        ctx.beginPath();
        ctx.moveTo(dx * s, s * 0.45);
        ctx.quadraticCurveTo(dx * s - s * 0.32 * k, 0, dx * s + s * 0.05, -s * 0.55 * k);
        ctx.quadraticCurveTo(dx * s + s * 0.05, -s * 0.1, dx * s + s * 0.3 * k, -s * 0.15 * k);
        ctx.quadraticCurveTo(dx * s + s * 0.3 * k, s * 0.25, dx * s, s * 0.45);
        ctx.fill();
      }
    },
    skull(ctx, s) {
      ctx.beginPath(); ctx.ellipse(0, -s * 0.08, s * 0.42, s * 0.38, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(-s * 0.24, s * 0.18, s * 0.48, s * 0.26);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.arc(-s * 0.16, -s * 0.05, s * 0.11, 0, Math.PI * 2); ctx.arc(s * 0.16, -s * 0.05, s * 0.11, 0, Math.PI * 2); ctx.fill();
      path(ctx, [[0, s * 0.08], [-s * 0.05, s * 0.18], [s * 0.05, s * 0.18]]); ctx.fill();
      for (let i = -1; i <= 1; i++) ctx.fillRect(i * s * 0.11 - s * 0.02, s * 0.3, s * 0.04, s * 0.14);
      ctx.globalCompositeOperation = 'source-over';
    },
    chevrons(ctx, s) {
      for (const dy of [-0.28, 0.12]) {
        path(ctx, [[-s * 0.5, (dy + 0.25) * s], [0, (dy - 0.12) * s], [s * 0.5, (dy + 0.25) * s], [s * 0.5, (dy + 0.42) * s], [0, (dy + 0.05) * s], [-s * 0.5, (dy + 0.42) * s]]);
        ctx.fill();
      }
    },
    star(ctx, s) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) { const r = (i % 2 ? 0.2 : 0.5) * s, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill();
    },
    flower(ctx, s) {
      for (let i = 0; i < 5; i++) {
        ctx.save(); ctx.rotate(i * Math.PI * 2 / 5);
        ctx.beginPath(); ctx.ellipse(0, -s * 0.26, s * 0.14, s * 0.24, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.08, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    },
    hex(ctx, s) {
      const r = s * 0.17;
      for (const [hx, hy] of [[0, 0], [-1.75, 0], [1.75, 0], [-0.87, -1.5], [0.87, -1.5], [-0.87, 1.5], [0.87, 1.5]]) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx.lineTo(hx * r + Math.cos(a) * r * 0.88, hy * r + Math.sin(a) * r * 0.88); }
        ctx.closePath(); ctx.lineWidth = s * 0.05; ctx.stroke();
      }
    },
    bolt(ctx, s) { path(ctx, [[s * 0.08, -s * 0.5], [-s * 0.3, s * 0.06], [-s * 0.02, s * 0.06], [-s * 0.12, s * 0.5], [s * 0.3, -s * 0.08], [s * 0.02, -s * 0.08]]); ctx.fill(); },
    diamond(ctx, s) {
      path(ctx, [[0, -s * 0.48], [s * 0.36, -s * 0.1], [0, s * 0.48], [-s * 0.36, -s * 0.1]]); ctx.fill();
      ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = s * 0.03;
      ctx.beginPath(); ctx.moveTo(-s * 0.36, -s * 0.1); ctx.lineTo(s * 0.36, -s * 0.1); ctx.moveTo(0, -s * 0.48); ctx.lineTo(-s * 0.12, -s * 0.1); ctx.lineTo(0, s * 0.48); ctx.lineTo(s * 0.12, -s * 0.1); ctx.closePath(); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    },
    checker(ctx, s) {
      const n = 4, c = s * 0.9 / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if ((x + y) % 2 === 0) ctx.fillRect(-s * 0.45 + x * c, -s * 0.45 + y * c, c, c);
      ctx.lineWidth = s * 0.03; ctx.strokeRect(-s * 0.45, -s * 0.45, s * 0.9, s * 0.9);
    },
    bat(ctx, s) {
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.12);
      ctx.quadraticCurveTo(-s * 0.2, -s * 0.32, -s * 0.55, -s * 0.22);
      ctx.quadraticCurveTo(-s * 0.42, -s * 0.05, -s * 0.5, s * 0.14);
      ctx.quadraticCurveTo(-s * 0.36, s * 0.04, -s * 0.24, s * 0.16);
      ctx.quadraticCurveTo(-s * 0.14, s * 0.06, 0, s * 0.24);
      ctx.quadraticCurveTo(s * 0.14, s * 0.06, s * 0.24, s * 0.16);
      ctx.quadraticCurveTo(s * 0.36, s * 0.04, s * 0.5, s * 0.14);
      ctx.quadraticCurveTo(s * 0.42, -s * 0.05, s * 0.55, -s * 0.22);
      ctx.quadraticCurveTo(s * 0.2, -s * 0.32, 0, -s * 0.12);
      ctx.fill();
      path(ctx, [[-s * 0.1, -s * 0.16], [-s * 0.07, -s * 0.3], [0, -s * 0.18], [s * 0.07, -s * 0.3], [s * 0.1, -s * 0.16]]); ctx.fill();
    },
    snowflake(ctx, s) {
      ctx.lineWidth = s * 0.07; ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        ctx.save(); ctx.rotate(i * Math.PI / 3);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * 0.45);
        ctx.moveTo(0, -s * 0.28); ctx.lineTo(-s * 0.11, -s * 0.39); ctx.moveTo(0, -s * 0.28); ctx.lineTo(s * 0.11, -s * 0.39);
        ctx.stroke(); ctx.restore();
      }
    },
    cross(ctx, s) {
      ctx.lineWidth = s * 0.16; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-s * 0.34, -s * 0.34); ctx.lineTo(s * 0.34, s * 0.34); ctx.moveTo(s * 0.34, -s * 0.34); ctx.lineTo(-s * 0.34, s * 0.34); ctx.stroke();
    },
    wings(ctx, s) {
      // three swept feathers per side, fanning up and out from the heart
      for (const side of [-1, 1]) {
        ctx.save(); ctx.scale(side, 1);
        [[0.62, -0.42, 0.13], [0.55, -0.12, 0.11], [0.45, 0.14, 0.09]].forEach(([len, ang, wd]) => {
          ctx.save(); ctx.translate(s * 0.14, -s * 0.02); ctx.rotate(ang);
          ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(s * len * 0.5, -s * wd * 1.6, s * len, -s * wd * 0.4);
          ctx.quadraticCurveTo(s * len * 0.55, s * wd * 0.6, 0, s * wd * 0.5);
          ctx.closePath(); ctx.fill();
          ctx.restore();
        });
        ctx.restore();
      }
      EMBLEMS.heart(ctx, s * 0.5);
    },
    spiral(ctx, s) {
      ctx.lineWidth = s * 0.06; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 4.5; a += 0.1) { const r = s * 0.02 + a * s * 0.032; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.stroke();
    },
    bubbles(ctx, s) {
      for (const [bx, by, br] of [[-0.25, -0.15, 0.2], [0.18, -0.25, 0.14], [0.22, 0.15, 0.22], [-0.2, 0.28, 0.12], [0, 0.02, 0.1]]) {
        ctx.beginPath(); ctx.arc(bx * s, by * s, br * s, 0, Math.PI * 2); ctx.fill();
      }
    },
    paw(ctx, s) {
      ctx.beginPath(); ctx.ellipse(0, s * 0.14, s * 0.24, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
      for (const [px, py] of [[-0.3, -0.12], [-0.11, -0.3], [0.11, -0.3], [0.3, -0.12]]) { ctx.beginPath(); ctx.ellipse(px * s, py * s, s * 0.09, s * 0.12, px, 0, Math.PI * 2); ctx.fill(); }
    },
  };

  /* ---------------- design catalogue ---------------- */
  const glowRing = () => [{ x: 0.05, y: 0.03, w: 0.9, h: 0.94, stroke: 10, radius: 0.12, a: 1 }];
  const DESIGNS = [
    { key: 'bars', name: 'Classic Bars', rects: () => [...sideBars(), ...endBars()] },
    { key: 'led', name: 'LED Strip', rects: () => [...ledSides(), ...ledEnds()] },
    { key: 'ring', name: 'Glow Ring', rects: glowRing },
    { key: 'sides', name: 'Side Tubes', rects: sideBars },
    { key: 'strip', name: 'Single Strip', rects: () => [pill(0.3, 0.01, 0.4, 0.98)] },
    { key: 'dashes', name: 'Dashed Line', rects: () => Array.from({ length: 7 }, (_, i) => pill(0.38, 0.02 + i * 0.14, 0.24, 0.1)) },
    { key: 'double', name: 'Double Tubes', rects: () => [pill(0.04, 0.15, 0.05, 0.7), pill(0.13, 0.22, 0.03, 0.56), pill(0.91, 0.15, 0.05, 0.7), pill(0.84, 0.22, 0.03, 0.56)] },
    { key: 'hearts', name: 'Hearts', emblem: 'heart' },
    { key: 'flames', name: 'Flames', emblem: 'flame' },
    { key: 'skulls', name: 'Skulls', emblem: 'skull' },
    { key: 'chevrons', name: 'Chevrons', emblem: 'chevrons' },
    { key: 'stars', name: 'Stars', emblem: 'star' },
    { key: 'flowers', name: 'Flowers', emblem: 'flower' },
    { key: 'hexes', name: 'Hex Grid', emblem: 'hex' },
    { key: 'bolts', name: 'Lightning', emblem: 'bolt' },
    { key: 'diamonds', name: 'Diamonds', emblem: 'diamond' },
    { key: 'checker', name: 'Checkered', emblem: 'checker' },
    { key: 'bats', name: 'Bats', emblem: 'bat' },
    { key: 'snow', name: 'Snowflakes', emblem: 'snowflake' },
    { key: 'cross', name: 'Crosses', emblem: 'cross' },
    { key: 'wings', name: 'Winged Heart', emblem: 'wings' },
    { key: 'spiral', name: 'Spirals', emblem: 'spiral' },
    { key: 'bubbles', name: 'Bubbles', emblem: 'bubbles' },
    { key: 'paws', name: 'Paw Prints', emblem: 'paw' },
    { key: 'text', name: 'Custom Text', text: true },
    { key: 'image', name: 'Neon picture (NFS Neon tab)', image: true },
  ];
  const BY_KEY = Object.fromEntries(DESIGNS.map((d) => [d.key, d]));

  function normalize(u) {
    const d = NEON_DEFAULTS;
    u = u && typeof u === 'object' ? u : {};
    const num = (v, def, min, max) => (isFinite(+v) && v !== null && v !== '' ? U.clamp(+v, min, max) : def);
    const colour = (c, def) => (Array.isArray(c) && c.length === 3 && c.every((v) => isFinite(+v)) ? c.map((v) => U.clamp(+v, 0, 1))
      : typeof c === 'string' ? U.hexToRgb(c) : [...def]);
    return {
      enabled: !!u.enabled,
      design: BY_KEY[u.design] ? u.design : d.design,
      text: String(u.text ?? d.text).slice(0, 14),
      color: colour(u.color, d.color),
      color2: colour(u.color2, d.color2),
      brightness: num(u.brightness, d.brightness, 0, 10),
      opacity: num(u.opacity, d.opacity, 0, 1),
      anim: NEON_ANIMS[u.anim] ? u.anim : d.anim,
      animSpeed: num(u.animSpeed, d.animSpeed, 0.1, 10),
      light: u.light === undefined ? d.light : !!u.light,
      lightBrightness: num(u.lightBrightness, d.lightBrightness, 0, 40),
      lightRange: num(u.lightRange, d.lightRange, 0, 60),
      imageId: String(u.imageId || '').trim(),
      image: String(u.image || '').slice(0, 120),
    };
  }

  /** Rect list for frame-based designs (null for icon designs). */
  function rects(design) {
    const d = BY_KEY[design];
    return d && d.rects ? d.rects() : null;
  }
  const isFrameDesign = (design) => !!(BY_KEY[design] && BY_KEY[design].rects);
  /** Icon designs need an uploaded image unless an asset id was pasted. */
  const needsUpload = (u) => u.enabled && !isFrameDesign(u.design) && !u.imageId;

  function drawRect(ctx, r, W, H) {
    const x = r.x * W, y = r.y * H, w = r.w * W, h = r.h * H;
    ctx.globalAlpha = r.a ?? 1;
    ctx.beginPath();
    if (r.stroke) {
      const rad = (r.radius || 0) * Math.min(W, H);
      ctx.roundRect(x + r.stroke / 2, y + r.stroke / 2, w - r.stroke, h - r.stroke, rad);
      ctx.lineWidth = r.stroke; ctx.stroke();
    } else {
      ctx.roundRect(x, y, w, h, r.pill ? Math.min(w, h) / 2 : 0);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function paint(ctx, design, text, W, H) {
    const d = BY_KEY[design] || BY_KEY.led;
    ctx.fillStyle = ctx.strokeStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = W * 0.06;
    if (d.rects) {
      for (const r of d.rects()) drawRect(ctx, r, W, H);
      return;
    }
    // icon designs: LED side strips + emblems at front and back
    for (const r of ledSides()) drawRect(ctx, r, W, H);
    if (d.text) {
      ctx.font = `900 ${Math.round(W * 0.2)}px "Arial Black", Impact, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const [cx, rot] of [[0.28, -Math.PI / 2], [0.72, Math.PI / 2]]) {
        ctx.save(); ctx.translate(cx * W, H / 2); ctx.rotate(rot);
        ctx.fillText(String(text || '').toUpperCase(), 0, 0, H * 0.7);
        ctx.restore();
      }
      for (const r of ledEnds()) drawRect(ctx, r, W, H);
      return;
    }
    const s = W * 0.4;
    for (const [cy, rot] of [[0.1, 0], [0.9, Math.PI]]) {
      ctx.save(); ctx.translate(W / 2, cy * H); ctx.rotate(rot);
      EMBLEMS[d.emblem](ctx, s);
      ctx.restore();
    }
  }

  /* ---------------- full-colour neon pictures (NFS World style, landscape 2:1) ---------------- */
  // Pictures are landscape (x = car length); the plate is portrait (x = car width), so turn them 90°.
  const isImage = (u) => u.design === 'image';
  const imgCache = {};
  function imageCanvas(key, scale = 1) {
    const k = key + '|' + scale;
    if (imgCache[k]) return imgCache[k];
    const c = document.createElement('canvas');
    c.width = NEON_W * scale; c.height = NEON_H * scale;
    const src = key && typeof TextureStore !== 'undefined' ? TextureStore.source(key) : null;
    if (!src) return c; // not loaded yet: blank (not cached)
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.translate(c.width, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(src, 0, 0, c.height, c.width);
    return (imgCache[k] = c);
  }
  /** Average glow colour of a picture (bright, opaque pixels count most): road light + fallback colour. */
  function averageColour(src) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 32;
    const ctx = c.getContext('2d');
    ctx.drawImage(src, 0, 0, 64, 32);
    const d = ctx.getImageData(0, 0, 64, 32).data;
    let r = 0, g = 0, b = 0, w = 0;
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3] / 255, l = Math.max(d[i], d[i + 1], d[i + 2]) / 255, k = a * l * l;
      r += d[i] * k; g += d[i + 1] * k; b += d[i + 2] * k; w += k;
    }
    if (!w) return [1, 1, 1];
    const col = [r / w / 255, g / w / 255, b / w / 255], m = Math.max(...col) || 1;
    return col.map((v) => U.clamp(v / m, 0, 1)); // full brightness, keep the hue
  }
  /** Canvas for the plate: the picture for image designs, the white mask otherwise. */
  const plateCanvas = (u, scale = 1) => (isImage(u) ? imageCanvas(u.image, scale) : canvas(u.design, u.text, scale));

  const cache = {};
  /** White-mask canvas for a design (portrait NEON_W x NEON_H, or scaled). */
  function canvas(design, text = '', scale = 1) {
    const k = `${design}|${text}|${scale}`;
    if (cache[k]) return cache[k];
    const c = document.createElement('canvas');
    c.width = NEON_W * scale; c.height = NEON_H * scale;
    paint(c.getContext('2d'), design, text, c.width, c.height);
    cache[k] = c;
    return c;
  }
  /** Soft blurred copy used for the light spill on the ground in the preview. */
  function spill(design, text = '', image = '') {
    const k = `spill|${design}|${text}|${design === 'image' ? image : ''}`;
    if (cache[k]) return cache[k];
    if (design === 'image' && !imgCache[image + '|1']) return imageCanvas(image); // blank until loaded
    const src = design === 'image' ? imageCanvas(image) : canvas(design, text);
    const c = document.createElement('canvas');
    c.width = 128; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.filter = 'blur(10px)';
    ctx.drawImage(src, 0, 0, c.width, c.height);
    ctx.filter = 'none';
    cache[k] = c;
    return c;
  }

  /* ---------------- animation maths (mirrors animateNeon in Luau below) ---------------- */
  const mod1 = (x) => x - Math.floor(x); // Lua's x % 1 (always 0..1)
  /** Police colour group: 0 = whole design, 1 = left / front half, 2 = right / back half. */
  function groupOf(cx, cy) {
    if (Math.abs(cx - 0.5) < 0.05 && Math.abs(cy - 0.5) < 0.1) return 0;
    if (cx < 0.45) return 1;
    if (cx > 0.55) return 2;
    return cy < 0.5 ? 1 : 2;
  }
  const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  /**
   * Brightness k (0..1) and colour of one glowing piece centred at (cx, cy) on the plate at
   * animation time s (seconds x speed). Pieces of icon designs use the plate centre.
   */
  function state(anim, s, cx, cy, c1, c2) {
    let k = 1, col = c1;
    switch (anim) {
      case 'pulse': k = 0.5 + 0.5 * Math.sin(s * Math.PI * 2); break;
      case 'breathe': k = 0.65 + 0.35 * Math.sin(s * 2); break;
      case 'flicker': k = ((Math.floor(s * 12) * 7919) % 100) < 9 ? 0.3 : 1; break;
      case 'strobe': k = mod1(s * 4) < 0.5 ? 1 : 0.1; break;
      case 'rainbow': col = U.hsvToRgb([mod1(s * 0.25), 0.8, 1]); break;
      case 'duo': col = lerp3(c1, c2, 0.5 + 0.5 * Math.sin(s * 2)); break;
      case 'chase': k = 0.12 + 0.88 * Math.max(0, 1 - mod1((s * 0.6 - cy) * 2) * 3); break;
      case 'scanner': k = 0.1 + 0.9 * Math.max(0, 1 - Math.abs(cy - (0.5 - 0.5 * Math.cos(s * 2.4))) * 4); break;
      case 'police': {
        const { phaseA, flash } = police(s), g = groupOf(cx, cy);
        const on = g === 1 ? phaseA : g === 2 ? !phaseA : true;
        k = on && flash ? 1 : 0.12;
        col = g === 1 ? c1 : g === 2 ? c2 : phaseA ? c1 : c2;
        break;
      }
    }
    return { k, col };
  }
  function police(s) {
    const cycle = mod1(s * 1.2);
    return { phaseA: cycle < 0.5, flash: Math.floor(mod1(cycle * 2) * 6) % 2 === 0 };
  }
  /** Road light (SurfaceLight) brightness factor and colour. */
  function lightState(anim, s, c1, c2) {
    if (anim === 'police') { const { phaseA, flash } = police(s); return { k: flash ? 1 : 0.15, col: phaseA ? c1 : c2 }; }
    if (anim === 'chase' || anim === 'scanner') return { k: 1, col: c1 };
    return state(anim, s, 0.5, 0.5, c1, c2);
  }
  /** Per-piece patterns only make sense for frame designs (an image is a single piece). */
  const isPattern = (u) => ['chase', 'scanner', 'police'].includes(u.anim) && isFrameDesign(u.design);

  /** Coloured canvas of a frame design with every piece lit by its own animation state (preview). */
  let animCv = null;
  function animCanvas(u, s) {
    if (!animCv) { animCv = document.createElement('canvas'); animCv.width = NEON_W / 2; animCv.height = NEON_H / 2; }
    const W = animCv.width, H = animCv.height, ctx = animCv.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    ctx.shadowBlur = W * 0.06;
    for (const r of rects(u.design)) {
      const { k, col } = state(u.anim, s, r.x + r.w / 2, r.y + r.h / 2, u.color, u.color2);
      ctx.fillStyle = ctx.strokeStyle = ctx.shadowColor = U.rgbToHex(col);
      drawRect(ctx, { ...r, stroke: r.stroke && r.stroke / 2, a: (r.a ?? 1) * k }, W, H);
    }
    return animCv;
  }

  /**
   * GUI Frame specs for Roblox (frame designs only), including soft "halo" copies so the
   * hard-edged Frames read as glowing tubes. Pixel units are on the 256x512 SurfaceGui canvas.
   */
  function guiFrames(u) {
    const list = rects(u.design);
    if (!list) return null;
    const out = [];
    for (const r of list) {
      if (r.stroke) {
        out.push({ ...r, stroke: r.stroke * 2.6, t: 0.8 }); // halo
        out.push({ ...r, t: 0 });
      } else {
        const gx = 0.018, gy = gx * NEON_W / NEON_H;
        out.push({ ...r, x: r.x - gx, y: r.y - gy, w: r.w + gx * 2, h: r.h + gy * 2, t: 0.75 }); // halo
        out.push({ ...r, t: 0 });
      }
    }
    return out.map((f) => ({ ...f, t: 1 - (1 - f.t) * u.opacity * (f.a ?? 1) }));
  }

  /** Luau: animates a neon SurfaceGui (+ light) on each client. Shared by the script and ModuleScript exports. */
  const ANIMATE_FN = `local function animateNeon(gui, light, anim, speed, color2)
	local RunService = game:GetService("RunService")
	color2 = color2 or Color3.new(1, 0.1, 0.15)
	-- centre of a glowing piece on the plate (0..1): used by the chase / scanner / police patterns
	local function centre(item)
		local frame = if item:IsA("UIStroke") then item.Parent else item
		if frame and frame:IsA("GuiObject") then
			return frame.Position.X.Scale + frame.Size.X.Scale / 2, frame.Position.Y.Scale + frame.Size.Y.Scale / 2
		end
		return 0.5, 0.5
	end
	-- police colour group: 0 = whole design, 1 = left / front, 2 = right / back
	local function group(cx, cy)
		if math.abs(cx - 0.5) < 0.05 and math.abs(cy - 0.5) < 0.1 then
			return 0
		elseif cx < 0.45 then
			return 1
		elseif cx > 0.55 then
			return 2
		end
		return if cy < 0.5 then 1 else 2
	end
	local parts = {}
	local function add(item, prop, color)
		local cx, cy = centre(item)
		table.insert(parts, { item = item, prop = prop, color = color, base = item[prop], cy = cy, group = group(cx, cy) })
	end
	for _, item in ipairs(gui:GetDescendants()) do
		if item:IsA("ImageLabel") then
			add(item, "ImageTransparency", "ImageColor3")
		elseif item:IsA("UIStroke") then
			add(item, "Transparency", "Color")
		elseif item:IsA("Frame") then
			add(item, "BackgroundTransparency", "BackgroundColor3")
		end
	end
	local color1 = if parts[1] then parts[1].item[parts[1].color] else Color3.new(1, 1, 1)
	local lightBase = if light then light.Brightness else 0
	local plate = gui.Parent
	return RunService.RenderStepped:Connect(function()
		if not gui.Enabled then
			return
		end
		local camera = workspace.CurrentCamera
		if camera and plate and plate:IsA("BasePart") and (camera.CFrame.Position - plate.Position).Magnitude > 300 then
			return -- too far away to see: skip the work
		end
		local s = os.clock() * speed
		local c1 = gui:GetAttribute("ParticlyNeonColor") or color1 -- set by the Particly colour shop
		local k, color = 1, nil
		local phaseA, flash = true, true
		if anim == "pulse" then
			k = 0.5 + 0.5 * math.sin(s * math.pi * 2)
		elseif anim == "breathe" then
			k = 0.65 + 0.35 * math.sin(s * 2)
		elseif anim == "flicker" then
			k = if (math.floor(s * 12) * 7919) % 100 < 9 then 0.3 else 1
		elseif anim == "strobe" then
			k = if (s * 4) % 1 < 0.5 then 1 else 0.1
		elseif anim == "rainbow" then
			color = Color3.fromHSV((s * 0.25) % 1, 0.8, 1)
		elseif anim == "duo" then
			color = c1:Lerp(color2, 0.5 + 0.5 * math.sin(s * 2))
		elseif anim == "police" then
			local cycle = (s * 1.2) % 1
			phaseA = cycle < 0.5
			flash = math.floor(((cycle * 2) % 1) * 6) % 2 == 0
		end
		local sweep = 0.5 - 0.5 * math.cos(s * 2.4)
		for _, p in ipairs(parts) do
			local pk, pc = k, color
			if anim == "chase" then
				pk = 0.12 + 0.88 * math.max(0, 1 - (((s * 0.6 - p.cy) * 2) % 1) * 3)
			elseif anim == "scanner" then
				pk = 0.1 + 0.9 * math.max(0, 1 - math.abs(p.cy - sweep) * 4)
			elseif anim == "police" then
				local on = if p.group == 1 then phaseA elseif p.group == 2 then not phaseA else true
				pk = if on and flash then 1 else 0.12
				pc = if p.group == 1 then c1 elseif p.group == 2 then color2 elseif phaseA then c1 else color2
			end
			p.item[p.prop] = 1 - (1 - p.base) * pk
			if pc then
				p.item[p.color] = pc
			end
		end
		if light then
			local lk, lc = k, color
			if anim == "police" then
				lk = if flash then 1 else 0.15
				lc = if phaseA then c1 else color2
			end
			light.Brightness = lightBase * lk
			if lc then
				light.Color = lc
			end
		end
	end)
end`;

  function fxSource(u) {
    return `-- Particly car neon animation (RunContext = Client): ${NEON_ANIMS[u.anim]}.
local ANIM = "${u.anim}"
local SPEED = ${U.fmt(u.animSpeed)}
local COLOR2 = Color3.new(${u.color2.map(U.fmt).join(', ')}) -- second colour (police / two-colour fade)

${ANIMATE_FN}

local gui = script.Parent:WaitForChild("ParticlyNeon")
animateNeon(gui, script.Parent:FindFirstChild("ParticlyNeonLight"), ANIM, SPEED, COLOR2)
`;
  }

  return { DESIGNS, BY_KEY, normalize, rects, isFrameDesign, needsUpload, canvas, spill, guiFrames, fxSource, ANIMATE_FN, state, lightState, isPattern, animCanvas, isImage, imageCanvas, plateCanvas, averageColour };
})();
