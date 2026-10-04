'use strict';
/*
 * Texture library.
 *  - "Roblox built-in" textures ship with every Roblox client (rbxasset:// paths),
 *    so they work immediately in Studio. Previews here are procedural look-alikes.
 *  - "Shape" textures are generated here; download the PNG, upload it to Roblox
 *    (Creator Hub / Asset Manager) and paste the resulting rbxassetid:// into the layer.
 *    Until then exports fall back to the closest built-in texture.
 *  - "User" textures are images the user imported (stored in the effect as data URLs).
 */

const TEX_SIZE = 128;

const TexGen = (() => {
  // Deterministic value noise for smoke-ish textures
  function noise2(seed) {
    const g = new Float32Array(17 * 17);
    let s = seed * 9301 + 49297;
    for (let i = 0; i < g.length; i++) { s = (s * 9301 + 49297) % 233280; g[i] = s / 233280; }
    return (x, y) => {
      x *= 16; y *= 16;
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const at = (a, b) => g[(U.clamp(b, 0, 16)) * 17 + U.clamp(a, 0, 16)];
      const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
      const top = U.lerp(at(xi, yi), at(xi + 1, yi), sx);
      const bot = U.lerp(at(xi, yi + 1), at(xi + 1, yi + 1), sx);
      return U.lerp(top, bot, sy);
    };
  }
  function pixels(ctx, S, fn) {
    const img = ctx.createImageData(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const [r, g, b, a] = fn((x + 0.5) / S, (y + 0.5) / S);
      const i = (y * S + x) * 4;
      img.data[i] = r * 255; img.data[i + 1] = g * 255; img.data[i + 2] = b * 255; img.data[i + 3] = U.clamp(a, 0, 1) * 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  const W = (a) => [1, 1, 1, a];
  const smooth = (e0, e1, x) => { const t = U.clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const radial = (u, v) => Math.hypot(u - 0.5, v - 0.5) * 2;

  function glow(ctx, S, o = {}) {
    const p = o.power || 2;
    pixels(ctx, S, (u, v) => W(Math.pow(Math.max(0, 1 - radial(u, v)), p)));
  }
  function circle(ctx, S, o = {}) {
    const soft = o.soft ?? 0.06;
    pixels(ctx, S, (u, v) => W(1 - smooth(0.9 - soft, 0.9, radial(u, v))));
  }
  function ring(ctx, S, o = {}) {
    const th = o.thickness ?? 0.12, soft = o.soft ?? 0.08;
    pixels(ctx, S, (u, v) => {
      const d = Math.abs(radial(u, v) - (0.9 - th));
      return W(1 - smooth(th - soft, th, d));
    });
  }
  function shockwave(ctx, S) {
    const n = noise2(7);
    pixels(ctx, S, (u, v) => {
      const r = radial(u, v);
      const a = Math.pow(smooth(0.35, 0.85, r) * (1 - smooth(0.85, 0.97, r)), 1.2);
      return W(a * (0.75 + 0.25 * n(u, v)));
    });
  }
  function square(ctx, S, o = {}) {
    const soft = o.soft ?? 0.04;
    pixels(ctx, S, (u, v) => {
      const d = Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5)) * 2;
      return W(1 - smooth(0.85 - soft, 0.85, d));
    });
  }
  function star(ctx, S, o = {}) {
    // n-pointed sparkle star with glow
    const pts = o.points || 4, sharp = o.sharp ?? 6, glowAmt = o.glow ?? 0.5;
    pixels(ctx, S, (u, v) => {
      const dx = u - 0.5, dy = v - 0.5;
      const r = Math.hypot(dx, dy) * 2, a = Math.atan2(dy, dx);
      const arm = Math.pow(Math.abs(Math.cos(a * pts / 2)), sharp * 8);
      const rays = Math.max(0, 1 - r / (0.25 + 0.75 * arm));
      const core = Math.pow(Math.max(0, 1 - r * 1.6), 2);
      const halo = Math.pow(Math.max(0, 1 - r), 3) * glowAmt;
      return W(Math.min(1, rays * 1.2 + core + halo));
    });
  }
  function star5(ctx, S) {
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = (i % 2 ? 0.2 : 0.46) * S, a = -Math.PI / 2 + i * Math.PI / 5;
      ctx.lineTo(S / 2 + Math.cos(a) * r, S / 2 + 0.03 * S + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.shadowColor = '#fff'; ctx.shadowBlur = S * 0.04;
    ctx.fill();
  }
  function heart(ctx, S) {
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff'; ctx.shadowBlur = S * 0.03;
    ctx.beginPath();
    const s = S / 128;
    ctx.moveTo(64 * s, 112 * s);
    ctx.bezierCurveTo(10 * s, 72 * s, 6 * s, 38 * s, 30 * s, 24 * s);
    ctx.bezierCurveTo(46 * s, 15 * s, 60 * s, 24 * s, 64 * s, 38 * s);
    ctx.bezierCurveTo(68 * s, 24 * s, 82 * s, 15 * s, 98 * s, 24 * s);
    ctx.bezierCurveTo(122 * s, 38 * s, 118 * s, 72 * s, 64 * s, 112 * s);
    ctx.fill();
  }
  function streak(ctx, S, o = {}) {
    const w = o.width ?? 0.45;
    pixels(ctx, S, (u, v) => {
      const dx = Math.abs(u - 0.5) * 2, dy = Math.abs(v - 0.5) * 2;
      const a = Math.pow(Math.max(0, 1 - dx / w), 1.5) * Math.pow(Math.max(0, 1 - dy), 0.7);
      return W(a);
    });
  }
  function raindrop(ctx, S) {
    pixels(ctx, S, (u, v) => {
      const dx = Math.abs(u - 0.5) * 2;
      const w = 0.6 * Math.pow(U.clamp(v, 0, 1), 0.7);
      const a = Math.max(0, 1 - dx / Math.max(0.001, w)) * smooth(0.0, 0.5, v) * (1 - smooth(0.92, 1, v));
      return W(a * 0.9);
    });
  }
  function snowflake(ctx, S) {
    ctx.clearRect(0, 0, S, S);
    ctx.strokeStyle = '#fff'; ctx.lineCap = 'round';
    ctx.lineWidth = S * 0.045;
    ctx.shadowColor = '#fff'; ctx.shadowBlur = S * 0.04;
    ctx.translate(S / 2, S / 2);
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -S * 0.42); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -S * 0.26); ctx.lineTo(-S * 0.1, -S * 0.36); ctx.moveTo(0, -S * 0.26); ctx.lineTo(S * 0.1, -S * 0.36); ctx.stroke();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  function leaf(ctx, S) {
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = '#fff';
    ctx.translate(S / 2, S / 2); ctx.rotate(-Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(0, -S * 0.44);
    ctx.quadraticCurveTo(S * 0.34, 0, 0, S * 0.44);
    ctx.quadraticCurveTo(-S * 0.34, 0, 0, -S * 0.44);
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = S * 0.025;
    ctx.beginPath(); ctx.moveTo(0, -S * 0.36); ctx.lineTo(0, S * 0.4); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  function petal(ctx, S) {
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(S * 0.5, S * 0.92);
    ctx.bezierCurveTo(S * 0.05, S * 0.6, S * 0.2, S * 0.1, S * 0.42, S * 0.12);
    ctx.lineTo(S * 0.5, S * 0.22); ctx.lineTo(S * 0.58, S * 0.12);
    ctx.bezierCurveTo(S * 0.8, S * 0.1, S * 0.95, S * 0.6, S * 0.5, S * 0.92);
    ctx.fill();
  }
  function bubble(ctx, S) {
    pixels(ctx, S, (u, v) => {
      const r = radial(u, v);
      const rim = Math.pow(smooth(0.55, 0.88, r), 2) * (1 - smooth(0.88, 0.95, r));
      const hl = Math.pow(Math.max(0, 1 - Math.hypot(u - 0.35, v - 0.33) * 7), 1.5);
      return W(Math.min(1, rim * 0.9 + 0.08 * (r < 0.9) + hl));
    });
  }
  function flare(ctx, S) {
    pixels(ctx, S, (u, v) => {
      const dx = Math.abs(u - 0.5) * 2, dy = Math.abs(v - 0.5) * 2, r = Math.hypot(dx, dy);
      const cross = Math.max(0, 1 - dy * 30) * (1 - dx) + Math.max(0, 1 - dx * 30) * (1 - dy);
      const core = Math.pow(Math.max(0, 1 - r * 1.3), 3);
      return W(Math.min(1, cross * 0.9 + core));
    });
  }
  function lightning(ctx, S) {
    ctx.clearRect(0, 0, S, S);
    ctx.strokeStyle = '#fff'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const pts = [[0.5, 0.02], [0.42, 0.25], [0.58, 0.4], [0.38, 0.62], [0.6, 0.78], [0.48, 0.98]];
    for (const [w, blur, a] of [[0.07, 0.08, 0.5], [0.025, 0.01, 1]]) {
      ctx.globalAlpha = a; ctx.lineWidth = S * w; ctx.shadowColor = '#fff'; ctx.shadowBlur = S * blur;
      ctx.beginPath(); pts.forEach(([x, y]) => ctx.lineTo(x * S, y * S)); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function smoke(ctx, S, o = {}) {
    const n = noise2(o.seed || 3), n2 = noise2((o.seed || 3) + 11);
    pixels(ctx, S, (u, v) => {
      const r = radial(u, v);
      const base = Math.pow(Math.max(0, 1 - r), 1.3);
      const turb = 0.55 * n(u, v) + 0.45 * n2(u * 2 % 1, v * 2 % 1);
      return W(U.clamp(base * (0.35 + turb * 1.1) * 1.2, 0, 1));
    });
  }
  function fire(ctx, S) {
    const n = noise2(5);
    pixels(ctx, S, (u, v) => {
      const dx = (u - 0.5) * 2, dy = (v - 0.62) * 2;
      const r = Math.hypot(dx * (1 + Math.max(0, -dy) * 0.9), dy * 0.85);
      const a = Math.pow(Math.max(0, 1 - r), 1.6) * (0.8 + 0.3 * n(u, v));
      return W(U.clamp(a * 1.25, 0, 1));
    });
  }
  function vortex(ctx, S) {
    pixels(ctx, S, (u, v) => {
      const dx = u - 0.5, dy = v - 0.5, r = Math.hypot(dx, dy) * 2, a = Math.atan2(dy, dx);
      const sw = 0.5 + 0.5 * Math.sin(a * 3 + r * 9);
      return W(Math.pow(sw, 3) * Math.pow(Math.max(0, 1 - r), 0.8) * smooth(0.05, 0.3, r));
    });
  }
  function implosion(ctx, S) {
    pixels(ctx, S, (u, v) => {
      const dx = u - 0.5, dy = v - 0.5, r = Math.hypot(dx, dy) * 2, a = Math.atan2(dy, dx);
      const rays = Math.pow(0.5 + 0.5 * Math.sin(a * 14), 6);
      return W(rays * smooth(0.2, 0.6, r) * (1 - smooth(0.8, 1, r)));
    });
  }
  function diamond(ctx, S) {
    pixels(ctx, S, (u, v) => W(1 - smooth(0.82, 0.9, Math.abs(u - 0.5) * 2 + Math.abs(v - 0.5) * 2)));
  }
  function crescent(ctx, S) {
    pixels(ctx, S, (u, v) => {
      const a = 1 - smooth(0.82, 0.9, radial(u, v));
      const b = 1 - smooth(0.82, 0.9, Math.hypot(u - 0.66, v - 0.42) * 2.2);
      return W(Math.max(0, a - b));
    });
  }
  function dot(ctx, S) { glow(ctx, S, { power: 6 }); }
  function confetti(ctx, S) {
    pixels(ctx, S, (u, v) => W(Math.abs(u - 0.5) < 0.3 && Math.abs(v - 0.5) < 0.18 ? 1 : 0));
  }
  function slash(ctx, S) {
    pixels(ctx, S, (u, v) => {
      const dx = u - 0.5, dy = v - 0.85;
      const r = Math.hypot(dx * 1.1, dy), a = Math.atan2(dy, dx);
      const band = 1 - smooth(0.02, 0.1, Math.abs(r - 0.62));
      const along = smooth(-Math.PI * 0.92, -Math.PI * 0.6, a) * (1 - smooth(-Math.PI * 0.4, -Math.PI * 0.08, a));
      return W(band * along);
    });
  }

  function flameJet(ctx, S) {
    // long tapered flame, bright core — nitro / thrusters (use with Squash or VelocityParallel)
    const n = noise2(13);
    pixels(ctx, S, (u, v) => {
      const w = 0.42 * Math.pow(1 - v, 0.6) + 0.04;
      const dx = Math.abs(u - 0.5) / w;
      const a = Math.max(0, 1 - dx * dx) * smooth(0, 0.12, v) * (0.75 + 0.35 * n(u, v * 0.5));
      return W(U.clamp(a * 1.2, 0, 1));
    });
  }
  function shard(ctx, S) {
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(S * 0.5, S * 0.04); ctx.lineTo(S * 0.68, S * 0.62); ctx.lineTo(S * 0.5, S * 0.96); ctx.lineTo(S * 0.36, S * 0.58);
    ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out'; ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.moveTo(S * 0.5, S * 0.04); ctx.lineTo(S * 0.5, S * 0.96); ctx.lineTo(S * 0.36, S * 0.58); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  function droplet(ctx, S) {
    pixels(ctx, S, (u, v) => {
      const dx = (u - 0.5) * 2, dy = (v - 0.62) * 2;
      const r = dy < 0 ? Math.abs(dx) / Math.max(0.001, 0.62 * (1 + dy / 1.25)) : Math.hypot(dx / 0.62, dy / 0.62);
      const body = 1 - smooth(0.85, 1, dy < 0 ? Math.max(r, -dy / 1.2) : r);
      const hl = Math.max(0, 1 - Math.hypot(u - 0.42, v - 0.6) * 9);
      return W(Math.min(1, body * 0.85 + hl * 0.4));
    });
  }
  function debris(ctx, S) {
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    [[0.22, 0.3], [0.55, 0.14], [0.86, 0.38], [0.76, 0.8], [0.4, 0.9], [0.12, 0.62]].forEach(([x, y]) => ctx.lineTo(x * S, y * S));
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; // shade one side so chunks read as 3D when tinted
    ctx.globalCompositeOperation = 'source-atop';
    ctx.beginPath(); ctx.moveTo(0.55 * S, 0.5 * S); [[0.86, 0.38], [0.76, 0.8], [0.4, 0.9]].forEach(([x, y]) => ctx.lineTo(x * S, y * S)); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  function cloud(ctx, S) {
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = '#fff';
    [[0.32, 0.58, 0.2], [0.5, 0.45, 0.25], [0.68, 0.58, 0.2], [0.5, 0.64, 0.2], [0.2, 0.66, 0.13], [0.8, 0.66, 0.13]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x * S, y * S, r * S, 0, Math.PI * 2); ctx.fill(); });
  }
  function hexagon(ctx, S) {
    ctx.clearRect(0, 0, S, S);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = S * 0.07; ctx.lineJoin = 'round';
    ctx.shadowColor = '#fff'; ctx.shadowBlur = S * 0.06;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; ctx.lineTo(S / 2 + Math.cos(a) * S * 0.4, S / 2 + Math.sin(a) * S * 0.4); }
    ctx.closePath(); ctx.stroke();
    ctx.globalAlpha = 0.15; ctx.fillStyle = '#fff'; ctx.fill(); ctx.globalAlpha = 1;
  }
  function spiral(ctx, S) {
    ctx.clearRect(0, 0, S, S);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = S * 0.06; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 5; a += 0.1) { const r = S * 0.03 + a * S * 0.026; ctx.lineTo(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r); }
    ctx.stroke();
  }
  function beam(ctx, S) {
    pixels(ctx, S, (u, v) => {
      const dx = Math.abs(u - 0.5) * 2;
      return W(Math.pow(Math.max(0, 1 - dx), 2.2) * smooth(0, 0.25, v) * (1 - smooth(0.75, 1, v)));
    });
  }
  function feather(ctx, S) {
    ctx.clearRect(0, 0, S, S);
    ctx.translate(S / 2, S / 2); ctx.rotate(-0.5);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(0, 0, S * 0.14, S * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = S * 0.015;
    for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(0, i * S * 0.05); ctx.lineTo(S * 0.2, i * S * 0.05 - S * 0.08); ctx.moveTo(0, i * S * 0.05); ctx.lineTo(-S * 0.2, i * S * 0.05 - S * 0.08); ctx.stroke(); }
    ctx.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  function glyph(ch, scale = 0.8) {
    return (ctx, S) => {
      ctx.clearRect(0, 0, S, S);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(S * scale)}px "Segoe UI Symbol", "Apple Symbols", "DejaVu Sans", Arial, sans-serif`;
      ctx.shadowColor = '#fff'; ctx.shadowBlur = S * 0.03;
      ctx.fillText(ch, S / 2, S * 0.54);
    };
  }

  /* ---------- pixel art (crisp blocks: draws the same at any resolution) ---------- */
  // '#' = solid, '+' = 60 % (shading), '.' = empty
  function pixelArt(rows) {
    return (ctx, S) => {
      ctx.clearRect(0, 0, S, S);
      const n = Math.max(rows.length, ...rows.map((r) => r.length)) + 2, c = S / n; // 1 empty cell of padding
      const oy = (n - rows.length) / 2, ox = (n - Math.max(...rows.map((r) => r.length))) / 2;
      rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (ch === '.' || ch === ' ') return;
        ctx.fillStyle = ch === '+' ? 'rgba(255,255,255,0.6)' : '#fff';
        ctx.fillRect(Math.floor((x + ox) * c), Math.floor((y + oy) * c), Math.ceil(c), Math.ceil(c));
      }));
    };
  }
  /** Bold outlined text (race signs, countdown numbers). */
  function text(lines, scale = 0.5) {
    return (ctx, S) => {
      ctx.clearRect(0, 0, S, S);
      const ls = String(lines).split('\n');
      const size = Math.round(S * scale / Math.max(1, ls.length * 0.8));
      ctx.font = `900 ${size}px "Arial Black", Impact, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ls.forEach((l, i) => {
        const y = S / 2 + (i - (ls.length - 1) / 2) * size * 1.05;
        ctx.lineWidth = size * 0.16; ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.strokeText(l, S / 2, y, S * 0.94);
        ctx.fillStyle = '#fff'; ctx.fillText(l, S / 2, y, S * 0.94);
      });
    };
  }
  function shape(draw) {
    return (ctx, S) => { ctx.clearRect(0, 0, S, S); ctx.save(); ctx.fillStyle = ctx.strokeStyle = '#fff'; draw(ctx, S); ctx.restore(); };
  }
  const poly = (ctx, pts, S) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * S, y * S) : ctx.moveTo(x * S, y * S))); ctx.closePath(); };

  // comic "POW" star burst
  const pow = shape((ctx, S) => {
    const pts = [];
    for (let i = 0; i < 24; i++) { const r = i % 2 ? 0.28 : 0.47 + (i % 4 === 0 ? 0.02 : -0.04), a = i * Math.PI / 12; pts.push([0.5 + Math.cos(a) * r, 0.5 + Math.sin(a) * r]); }
    poly(ctx, pts, S); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = S * 0.03; poly(ctx, pts.map(([x, y]) => [0.5 + (x - 0.5) * 0.8, 0.5 + (y - 0.5) * 0.8]), S); ctx.stroke();
  });
  // anime anger mark: four curved brackets
  const anger = shape((ctx, S) => {
    ctx.lineWidth = S * 0.09; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      ctx.save(); ctx.translate(S / 2, S / 2); ctx.rotate(i * Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(S * 0.08, -S * 0.36); ctx.quadraticCurveTo(S * 0.1, -S * 0.1, S * 0.36, -S * 0.08); ctx.stroke();
      ctx.restore();
    }
  });
  // manga impact frame: radial speed lines around an empty centre
  const impactLines = shape((ctx, S) => {
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2 + Math.sin(i * 12.9898) * 0.05, w = 0.012 + (Math.sin(i * 78.233) * 0.5 + 0.5) * 0.02, r0 = 0.22 + (Math.sin(i * 3.7) * 0.5 + 0.5) * 0.12;
      poly(ctx, [[0.5 + Math.cos(a - w) * 0.5, 0.5 + Math.sin(a - w) * 0.5], [0.5 + Math.cos(a) * r0, 0.5 + Math.sin(a) * r0], [0.5 + Math.cos(a + w) * 0.5, 0.5 + Math.sin(a + w) * 0.5]], S);
      ctx.fill();
    }
  });
  function ripple(ctx, S) {
    pixels(ctx, S, (u, v) => {
      const r = radial(u, v);
      const a = 1 - smooth(0.02, 0.06, Math.abs(r - 0.84)), b = 0.55 * (1 - smooth(0.015, 0.05, Math.abs(r - 0.62)));
      return W(Math.max(a, b) * (1 - smooth(0.9, 1, r)));
    });
  }
  const splash = shape((ctx, S) => {
    // crown splash: jagged rim with droplets thrown up
    ctx.beginPath(); ctx.moveTo(0.08 * S, 0.9 * S);
    for (let i = 0; i <= 8; i++) { const x = 0.08 + i * 0.105; ctx.lineTo((x - 0.03) * S, (0.72 - (i % 2 ? 0 : 0.2 + Math.abs(4 - i) * -0.02)) * S); ctx.lineTo((x + 0.02) * S, 0.74 * S); }
    ctx.lineTo(0.92 * S, 0.9 * S); ctx.closePath(); ctx.fill();
    for (const [x, y, r] of [[0.2, 0.3, 0.035], [0.4, 0.2, 0.04], [0.62, 0.24, 0.035], [0.8, 0.34, 0.03], [0.5, 0.4, 0.025]]) { ctx.beginPath(); ctx.arc(x * S, y * S, r * S, 0, Math.PI * 2); ctx.fill(); }
  });
  const foam = shape((ctx, S) => {
    for (let i = 0; i < 26; i++) {
      const a = i * 2.39996, r = Math.sqrt(i / 26) * 0.36, br = 0.05 + (Math.sin(i * 4.1) * 0.5 + 0.5) * 0.06;
      ctx.globalAlpha = 0.65 + 0.35 * Math.sin(i * 1.7) ** 2;
      ctx.beginPath(); ctx.arc((0.5 + Math.cos(a) * r) * S, (0.5 + Math.sin(a) * r) * S, br * S, 0, Math.PI * 2); ctx.fill();
    }
  });
  const pumpkin = shape((ctx, S) => {
    for (const [dx, rx] of [[-0.17, 0.2], [0.17, 0.2], [0, 0.22]]) { ctx.beginPath(); ctx.ellipse((0.5 + dx) * S, 0.56 * S, rx * S, 0.3 * S, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillRect(0.46 * S, 0.14 * S, 0.08 * S, 0.14 * S);
    ctx.globalCompositeOperation = 'destination-out';
    poly(ctx, [[0.33, 0.5], [0.4, 0.4], [0.45, 0.5]], S); ctx.fill();
    poly(ctx, [[0.55, 0.5], [0.6, 0.4], [0.67, 0.5]], S); ctx.fill();
    poly(ctx, [[0.3, 0.62], [0.38, 0.7], [0.44, 0.64], [0.5, 0.72], [0.56, 0.64], [0.62, 0.7], [0.7, 0.62], [0.64, 0.76], [0.36, 0.76]], S); ctx.fill();
  });
  const gift = shape((ctx, S) => {
    ctx.fillRect(0.18 * S, 0.4 * S, 0.64 * S, 0.5 * S);
    ctx.fillRect(0.14 * S, 0.3 * S, 0.72 * S, 0.12 * S);
    ctx.lineWidth = S * 0.06;
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse((0.5 + sx * 0.12) * S, 0.22 * S, 0.12 * S, 0.07 * S, sx * 0.5, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalCompositeOperation = 'destination-out'; ctx.globalAlpha = 0.45;
    ctx.fillRect(0.45 * S, 0.3 * S, 0.1 * S, 0.6 * S);
  });
  const egg = shape((ctx, S) => {
    ctx.beginPath(); ctx.ellipse(0.5 * S, 0.54 * S, 0.3 * S, 0.4 * S, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out'; ctx.globalAlpha = 0.4; ctx.lineWidth = S * 0.05;
    ctx.beginPath(); for (let i = 0; i <= 6; i++) ctx.lineTo((0.22 + i * 0.093) * S, (i % 2 ? 0.42 : 0.5) * S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.24 * S, 0.66 * S); ctx.lineTo(0.76 * S, 0.66 * S); ctx.stroke();
  });
  const clover = shape((ctx, S) => {
    for (let i = 0; i < 4; i++) {
      ctx.save(); ctx.translate(S / 2, S * 0.46); ctx.rotate(i * Math.PI / 2 + Math.PI / 4);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-S * 0.26, -S * 0.12, -S * 0.12, -S * 0.36, 0, -S * 0.22); ctx.bezierCurveTo(S * 0.12, -S * 0.36, S * 0.26, -S * 0.12, 0, 0); ctx.fill();
      ctx.restore();
    }
    ctx.lineWidth = S * 0.04; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0.5 * S, 0.5 * S); ctx.quadraticCurveTo(0.55 * S, 0.8 * S, 0.66 * S, 0.92 * S); ctx.stroke();
  });
  const candy = shape((ctx, S) => {
    ctx.lineWidth = S * 0.13; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0.56 * S, 0.92 * S); ctx.lineTo(0.56 * S, 0.34 * S); ctx.arc(0.43 * S, 0.34 * S, 0.13 * S, 0, Math.PI, true); ctx.lineTo(0.3 * S, 0.42 * S); ctx.stroke();
    ctx.globalCompositeOperation = 'destination-out'; ctx.globalAlpha = 0.5; ctx.lineWidth = S * 0.035;
    for (let y = 0.4; y < 0.92; y += 0.11) { ctx.beginPath(); ctx.moveTo(0.48 * S, (y + 0.05) * S); ctx.lineTo(0.64 * S, (y - 0.03) * S); ctx.stroke(); }
  });
  const tree = shape((ctx, S) => {
    poly(ctx, [[0.5, 0.1], [0.72, 0.4], [0.62, 0.4], [0.8, 0.64], [0.68, 0.64], [0.86, 0.84], [0.14, 0.84], [0.32, 0.64], [0.2, 0.64], [0.38, 0.4], [0.28, 0.4]], S); ctx.fill();
    ctx.fillRect(0.44 * S, 0.84 * S, 0.12 * S, 0.1 * S);
  });
  const chevron = shape((ctx, S) => { poly(ctx, [[0.12, 0.66], [0.5, 0.2], [0.88, 0.66], [0.88, 0.84], [0.5, 0.4], [0.12, 0.84]], S); ctx.fill(); });
  const checker = shape((ctx, S) => {
    const n = 6, c = S * 0.84 / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { ctx.globalAlpha = (x + y) % 2 ? 0.22 : 1; ctx.fillRect(S * 0.08 + x * c, S * 0.08 + y * c, c, c); }
  });
  function skid(ctx, S) {
    // tyre track: a dark band with tread blocks (tint it dark grey, use LightEmission 0)
    pixels(ctx, S, (u, v) => {
      const band = 1 - smooth(0.32, 0.4, Math.abs(u - 0.5));
      const tread = ((Math.floor(v * 10) + (u < 0.5 ? 0 : 1)) % 2) ? 1 : 0.7;
      return W(band * tread * 0.9);
    });
  }
  function windline(ctx, S) {
    pixels(ctx, S, (u, v) => {
      const y = 0.5 + Math.sin(u * Math.PI * 1.5) * 0.08;
      const line = 1 - smooth(0.006, 0.03, Math.abs(v - y));
      return W(line * smooth(0, 0.3, u) * (1 - smooth(0.7, 1, u)));
    });
  }

  return { pixelArt, text, pow, anger, impactLines, ripple, splash, foam, pumpkin, gift, egg, clover, candy, tree, chevron, checker, skid, windline, flameJet, shard, droplet, debris, cloud, hexagon, spiral, beam, feather, glyph, glow, circle, ring, shockwave, square, star, star5, heart, streak, raindrop, snowflake, leaf, petal, bubble, flare, lightning, smoke, fire, vortex, implosion, diamond, crescent, dot, confetti, slash };
})();

const RBX = (n) => 'rbxasset://textures/particles/' + n;

const TEXTURES = [
  // Roblox built-ins (work instantly in Studio)
  { key: 'rbx_sparkles', name: 'Sparkles', group: 'builtin', rbx: RBX('sparkles_main.dds'), gen: (c, S) => TexGen.star(c, S, { points: 4, glow: 0.6 }) },
  { key: 'rbx_fire', name: 'Fire', group: 'builtin', rbx: RBX('fire_main.dds'), gen: TexGen.fire },
  { key: 'rbx_fire_sparks', name: 'Fire Sparks', group: 'builtin', rbx: RBX('fire_sparks_main.dds'), gen: TexGen.dot },
  { key: 'rbx_smoke', name: 'Smoke', group: 'builtin', rbx: RBX('smoke_main.dds'), gen: (c, S) => TexGen.smoke(c, S, { seed: 3 }) },
  { key: 'rbx_exp_core', name: 'Explosion Core', group: 'builtin', rbx: RBX('explosion01_core_main.dds'), gen: (c, S) => TexGen.smoke(c, S, { seed: 9 }) },
  { key: 'rbx_exp_smoke', name: 'Explosion Smoke', group: 'builtin', rbx: RBX('explosion01_smoke_main.dds'), gen: (c, S) => TexGen.smoke(c, S, { seed: 21 }) },
  { key: 'rbx_exp_shock', name: 'Shockwave', group: 'builtin', rbx: RBX('explosion01_shockwave_main.dds'), gen: TexGen.shockwave },
  { key: 'rbx_exp_implosion', name: 'Implosion', group: 'builtin', rbx: RBX('explosion01_implosion_main.dds'), gen: TexGen.implosion },
  { key: 'rbx_ff_glow', name: 'Glow', group: 'builtin', rbx: RBX('forcefield_glow_main.dds'), gen: (c, S) => TexGen.glow(c, S, { power: 2 }) },
  { key: 'rbx_ff_vortex', name: 'Vortex', group: 'builtin', rbx: RBX('forcefield_vortex_main.dds'), gen: TexGen.vortex },
  // Generated shapes (download PNG -> upload to Roblox -> paste id)
  { key: 'soft_glow', name: 'Soft Glow', group: 'shape', fallback: 'rbx_ff_glow', gen: (c, S) => TexGen.glow(c, S, { power: 1.6 }) },
  { key: 'circle', name: 'Circle', group: 'shape', fallback: 'rbx_ff_glow', gen: TexGen.circle },
  { key: 'ring', name: 'Ring', group: 'shape', fallback: 'rbx_exp_shock', gen: TexGen.ring },
  { key: 'square', name: 'Square', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.square },
  { key: 'diamond', name: 'Diamond', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.diamond },
  { key: 'star4', name: 'Twinkle', group: 'shape', fallback: 'rbx_sparkles', gen: (c, S) => TexGen.star(c, S, { points: 4, sharp: 9, glow: 0.2 }) },
  { key: 'star6', name: 'Star Burst', group: 'shape', fallback: 'rbx_sparkles', gen: (c, S) => TexGen.star(c, S, { points: 8, sharp: 5, glow: 0.4 }) },
  { key: 'star5', name: 'Star', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.star5 },
  { key: 'heart', name: 'Heart', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.heart },
  { key: 'streak', name: 'Streak', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.streak },
  { key: 'raindrop', name: 'Raindrop', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.raindrop },
  { key: 'snowflake', name: 'Snowflake', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.snowflake },
  { key: 'leaf', name: 'Leaf', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.leaf },
  { key: 'petal', name: 'Petal', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.petal },
  { key: 'bubble', name: 'Bubble', group: 'shape', fallback: 'rbx_ff_glow', gen: TexGen.bubble },
  { key: 'flare', name: 'Lens Flare', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.flare },
  { key: 'lightning', name: 'Lightning', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.lightning },
  { key: 'crescent', name: 'Crescent', group: 'shape', fallback: 'rbx_ff_glow', gen: TexGen.crescent },
  { key: 'confetti', name: 'Confetti', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.confetti },
  { key: 'slash', name: 'Slash Arc', group: 'shape', fallback: 'rbx_exp_shock', gen: TexGen.slash },
  { key: 'wisp', name: 'Wispy Smoke', group: 'shape', fallback: 'rbx_smoke', gen: (c, S) => TexGen.smoke(c, S, { seed: 42 }) },
  { key: 'flame_jet', name: 'Flame Jet', group: 'shape', fallback: 'rbx_fire', gen: TexGen.flameJet },
  { key: 'shard', name: 'Shard', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.shard },
  { key: 'droplet', name: 'Droplet', group: 'shape', fallback: 'rbx_ff_glow', gen: TexGen.droplet },
  { key: 'debris', name: 'Debris Chunk', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.debris },
  { key: 'cloud', name: 'Cartoon Cloud', group: 'shape', fallback: 'rbx_smoke', gen: TexGen.cloud },
  { key: 'hexagon', name: 'Hexagon', group: 'shape', fallback: 'rbx_exp_shock', gen: TexGen.hexagon },
  { key: 'spiral', name: 'Spiral', group: 'shape', fallback: 'rbx_ff_vortex', gen: TexGen.spiral },
  { key: 'beam', name: 'Light Beam', group: 'shape', fallback: 'rbx_ff_glow', gen: TexGen.beam },
  { key: 'feather', name: 'Feather', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.feather },
  { key: 'g_plus', name: 'Plus', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.glyph('+', 1.1) },
  { key: 'g_note', name: 'Music Note', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.glyph('\u266A', 0.8) },
  { key: 'g_z', name: 'Sleep Z', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.glyph('Z', 0.8) },
  { key: 'g_bang', name: 'Exclamation', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.glyph('!', 0.85) },
  { key: 'g_dollar', name: 'Dollar', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.glyph('$', 0.8) },
  { key: 'g_question', name: 'Question', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.glyph('?', 0.85) },
  // cartoon / anime
  { key: 'pow', name: 'Comic POW', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.pow },
  { key: 'anger', name: 'Anger Mark', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.anger },
  { key: 'impact_lines', name: 'Impact Frame', group: 'shape', fallback: 'rbx_exp_shock', gen: TexGen.impactLines },
  // water
  { key: 'ripple', name: 'Ripple', group: 'shape', fallback: 'rbx_exp_shock', gen: TexGen.ripple },
  { key: 'splash', name: 'Splash Crown', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.splash },
  { key: 'foam', name: 'Foam', group: 'shape', fallback: 'rbx_smoke', gen: TexGen.foam },
  // race / cars
  { key: 'chevron', name: 'Arrow Chevron', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.chevron },
  { key: 'checker', name: 'Checkered Flag', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.checker },
  { key: 'skid', name: 'Skid Mark', group: 'shape', fallback: 'rbx_smoke', gen: TexGen.skid },
  { key: 'windline', name: 'Wind Line', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.windline },
  { key: 't_3', name: 'Countdown 3', group: 'shape', fallback: 'rbx_ff_glow', gen: TexGen.text('3', 0.8) },
  { key: 't_2', name: 'Countdown 2', group: 'shape', fallback: 'rbx_ff_glow', gen: TexGen.text('2', 0.8) },
  { key: 't_1', name: 'Countdown 1', group: 'shape', fallback: 'rbx_ff_glow', gen: TexGen.text('1', 0.8) },
  { key: 't_go', name: 'GO!', group: 'shape', fallback: 'rbx_ff_glow', gen: TexGen.text('GO!', 0.6) },
  { key: 't_record', name: 'NEW RECORD', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.text('NEW\nRECORD!', 0.5) },
  { key: 't_finish', name: 'FINISH', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.text('FINISH', 0.42) },
  // holidays
  { key: 'pumpkin', name: 'Pumpkin', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.pumpkin },
  { key: 'gift', name: 'Gift', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.gift },
  { key: 'egg', name: 'Easter Egg', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.egg },
  { key: 'clover', name: 'Clover', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.clover },
  { key: 'candy', name: 'Candy Cane', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.candy },
  { key: 'tree', name: 'Xmas Tree', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.tree },
  // retro / pixel
  { key: 'px_heart', name: 'Pixel Heart', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.pixelArt(['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...']) },
  { key: 'px_star', name: 'Pixel Star', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.pixelArt(['...#...', '...#...', '#######', '.#####.', '..###..', '.##.##.', '##...##']) },
  { key: 'px_coin', name: 'Pixel Coin', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.pixelArt(['..###..', '.#+++#.', '#++#++#', '#++#++#', '#++#++#', '.#+++#.', '..###..']) },
  { key: 'px_spark', name: 'Pixel Sparkle', group: 'shape', fallback: 'rbx_sparkles', gen: TexGen.pixelArt(['...#...', '...#...', '..+#+..', '###.###', '..+#+..', '...#...', '...#...']) },
  { key: 'px_puff', name: 'Pixel Puff', group: 'shape', fallback: 'rbx_smoke', gen: TexGen.pixelArt(['..####..', '.######.', '########', '##++####', '#####++#', '.######.', '..####..']) },
  { key: 'px_flame', name: 'Pixel Flame', group: 'shape', fallback: 'rbx_fire', gen: TexGen.pixelArt(['...#....', '...##...', '..###.#.', '.####.##', '.##++###', '##++++##', '##+++###', '.######.']) },
  { key: 'px_block', name: 'Pixel Block', group: 'shape', fallback: 'rbx_fire_sparks', gen: TexGen.pixelArt(['####', '#++#', '#++#', '####']) },
];
const TEX_BY_KEY = Object.fromEntries(TEXTURES.map((t) => [t.key, t]));
const TEX_BY_RBX = Object.fromEntries(TEXTURES.filter((t) => t.rbx).map((t) => [t.rbx.toLowerCase(), t]));

const TextureStore = {
  _canvases: {},
  _user: {}, // key -> {name, data, img, ready}
  _version: 0, // bumps when a user texture finishes loading (renderers re-upload)
  onChange: null,

  /** Returns a drawable (canvas/image) for a texture key, or null if not ready. */
  source(key) {
    if (this._user[key]) return this._user[key].ready ? this._user[key].img : null;
    const def = TEX_BY_KEY[key];
    if (!def) return null;
    if (!this._canvases[key]) {
      const c = document.createElement('canvas');
      c.width = c.height = TEX_SIZE;
      def.gen(c.getContext('2d'), TEX_SIZE, {});
      this._canvases[key] = c;
    }
    return this._canvases[key];
  },
  /** Register a user/imported image texture. */
  addUser(key, name, data) {
    if (this._user[key] && this._user[key].data === data) return;
    const img = new Image();
    const rec = { name, data, img, ready: false };
    this._user[key] = rec;
    img.onload = () => { rec.ready = true; this._version++; this.onChange && this.onChange(); };
    img.src = data;
  },
  isUser(key) { return !!this._user[key]; },
  userName(key) { return this._user[key] && this._user[key].name; },

  /** Which texture key should the preview use for a layer? */
  previewKey(layer) {
    if (layer.previewTex && (TEX_BY_KEY[layer.previewTex] || this._user[layer.previewTex])) return layer.previewTex;
    const t = TEX_BY_RBX[String(layer.Texture).toLowerCase()];
    return t ? t.key : 'rbx_ff_glow';
  },
  /** The texture string that will actually be exported for a layer. */
  exportTexture(layer) {
    const tex = String(layer.Texture || '').trim();
    if (tex) return tex;
    const def = TEX_BY_KEY[layer.previewTex];
    if (def && def.fallback) return TEX_BY_KEY[def.fallback].rbx;
    return DEFAULT_TEXTURE;
  },
  /** True when the layer previews a texture that Roblox won't have (needs upload). */
  needsUpload(layer) {
    return !String(layer.Texture || '').trim() && !!layer.previewTex && !TEX_BY_KEY[layer.previewTex]?.rbx;
  },

  /** Render a texture at an arbitrary resolution (for PNG download / texture studio). */
  render(key, size, opts) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const def = TEX_BY_KEY[key];
    if (def) def.gen(ctx, size, opts || {});
    else if (this._user[key] && this._user[key].ready) ctx.drawImage(this._user[key].img, 0, 0, size, size);
    return c;
  },
};
