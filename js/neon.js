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

const NEON_ANIMS = { none: 'Steady', pulse: 'Pulse', breathe: 'Breathe', flicker: 'Flicker', strobe: 'Strobe', rainbow: 'Rainbow cycle' };

const NEON_DEFAULTS = {
  enabled: false, design: 'led', text: 'TURBO', color: [0.25, 0.6, 1], brightness: 2, opacity: 1,
  anim: 'none', animSpeed: 1, light: true, lightBrightness: 3, lightRange: 10, imageId: '',
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
  ];
  const BY_KEY = Object.fromEntries(DESIGNS.map((d) => [d.key, d]));

  function normalize(u) {
    const d = NEON_DEFAULTS;
    u = u && typeof u === 'object' ? u : {};
    const num = (v, def, min, max) => (isFinite(+v) && v !== null && v !== '' ? U.clamp(+v, min, max) : def);
    const col = Array.isArray(u.color) && u.color.length === 3 && u.color.every((v) => isFinite(+v)) ? u.color.map((v) => U.clamp(+v, 0, 1))
      : typeof u.color === 'string' ? U.hexToRgb(u.color) : [...d.color];
    return {
      enabled: !!u.enabled,
      design: BY_KEY[u.design] ? u.design : d.design,
      text: String(u.text ?? d.text).slice(0, 14),
      color: col,
      brightness: num(u.brightness, d.brightness, 0, 10),
      opacity: num(u.opacity, d.opacity, 0, 1),
      anim: NEON_ANIMS[u.anim] ? u.anim : d.anim,
      animSpeed: num(u.animSpeed, d.animSpeed, 0.1, 10),
      light: u.light === undefined ? d.light : !!u.light,
      lightBrightness: num(u.lightBrightness, d.lightBrightness, 0, 40),
      lightRange: num(u.lightRange, d.lightRange, 0, 60),
      imageId: String(u.imageId || '').trim(),
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
  function spill(design, text = '') {
    const k = `spill|${design}|${text}`;
    if (cache[k]) return cache[k];
    const src = canvas(design, text);
    const c = document.createElement('canvas');
    c.width = 128; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.filter = 'blur(10px)';
    ctx.drawImage(src, 0, 0, c.width, c.height);
    ctx.filter = 'none';
    cache[k] = c;
    return c;
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
  const ANIMATE_FN = `local function animateNeon(gui, light, anim, speed)
	local RunService = game:GetService("RunService")
	local parts = {}
	for _, item in ipairs(gui:GetDescendants()) do
		if item:IsA("ImageLabel") then
			table.insert(parts, { item = item, prop = "ImageTransparency", color = "ImageColor3", base = item.ImageTransparency })
		elseif item:IsA("UIStroke") then
			table.insert(parts, { item = item, prop = "Transparency", color = "Color", base = item.Transparency })
		elseif item:IsA("Frame") then
			table.insert(parts, { item = item, prop = "BackgroundTransparency", color = "BackgroundColor3", base = item.BackgroundTransparency })
		end
	end
	local lightBase = light and light.Brightness or 0
	return RunService.RenderStepped:Connect(function()
		if not gui.Enabled then
			return
		end
		local s = os.clock() * speed
		local k, color = 1, nil
		if anim == "pulse" then
			k = 0.5 + 0.5 * math.sin(s * math.pi * 2)
		elseif anim == "breathe" then
			k = 0.65 + 0.35 * math.sin(s * 2)
		elseif anim == "flicker" then
			k = (math.floor(s * 12) * 7919) % 100 < 9 and 0.3 or 1
		elseif anim == "strobe" then
			k = (s * 4) % 1 < 0.5 and 1 or 0.1
		elseif anim == "rainbow" then
			color = Color3.fromHSV((s * 0.25) % 1, 0.8, 1)
		end
		for _, p in ipairs(parts) do
			p.item[p.prop] = 1 - (1 - p.base) * k
			if color then
				p.item[p.color] = color
			end
		end
		if light then
			light.Brightness = lightBase * k
			if color then
				light.Color = color
			end
		end
	end)
end`;

  function fxSource(u) {
    return `-- Particly car neon animation (RunContext = Client): ${NEON_ANIMS[u.anim]}.
local ANIM = "${u.anim}"
local SPEED = ${U.fmt(u.animSpeed)}

${ANIMATE_FN}

local gui = script.Parent:WaitForChild("ParticlyNeon")
animateNeon(gui, script.Parent:FindFirstChild("ParticlyNeonLight"), ANIM, SPEED)
`;
  }

  return { DESIGNS, BY_KEY, normalize, rects, isFrameDesign, needsUpload, canvas, spill, guiFrames, fxSource, ANIMATE_FN };
})();
