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

  return { flameJet, shard, droplet, debris, cloud, hexagon, spiral, beam, feather, glyph, glow, circle, ring, shockwave, square, star, star5, heart, streak, raindrop, snowflake, leaf, petal, bubble, flare, lightning, smoke, fire, vortex, implosion, diamond, crescent, dot, confetti, slash };
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
