'use strict';
/*
 * Exporters: Roblox model XML (.rbxmx), Studio Command Bar script, ModuleScript,
 * Particly JSON and share links.
 */

const Export = (() => {
  const f = U.fmt;
  const exportLayers = (effect) => effect.layers.filter((l) => !l.hidden);
  const hasBurst = (effect) => exportLayers(effect).some((l) => l.mode === 'burst');
  const maxLifetime = (effect) => Math.max(0, ...exportLayers(effect).map((l) => l.Lifetime[1] / Math.max(0.01, l.TimeScale || 1)));

  /** Warnings about things that won't look the same in Roblox. */
  function warnings(effect) {
    const out = [];
    for (const L of exportLayers(effect)) {
      if (TextureStore.needsUpload(L)) {
        const def = TEX_BY_KEY[L.previewTex];
        const fb = def && def.fallback ? TEX_BY_KEY[def.fallback].name : 'Sparkles';
        out.push(`"${L.Name}" uses the generated texture "${def ? def.name : L.previewTex}". Download its PNG (Textures tab), upload it to Roblox and paste the rbxassetid into the layer. Until then it exports with the built-in "${fb}" texture.`);
      } else if (TextureStore.isUser(L.previewTex) && !String(L.Texture).trim()) {
        out.push(`"${L.Name}" uses an imported image. Upload it to Roblox and paste the rbxassetid into the layer's Texture field (exports with the default sparkles texture for now).`);
      }
    }
    const u = effect.underglow;
    if (u && u.enabled) {
      if (Neon.needsUpload(u)) out.push(`Car neon design "${Neon.BY_KEY[u.design].name}" is an image: download its PNG (Car Neon panel), upload it to Roblox and paste the rbxassetid. Until then it exports as glowing bars.`);
      if (effect.trigger.mode === 'character') out.push('Car neon is not included for "Attach to every character" effects.');
    }
    const hidden = effect.layers.filter((l) => l.hidden).length;
    if (hidden) out.push(`${hidden} hidden layer${hidden > 1 ? 's are' : ' is'} not exported.`);
    return out;
  }

  /* ------------------------------ rbxmx ------------------------------ */
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const xNumSeq = (k) => k.map((p) => `${f(p.t)} ${f(p.v)} ${f(p.e)} `).join('');
  const xColSeq = (k) => k.map((p) => `${f(p.t)} ${f(p.c[0])} ${f(p.c[1])} ${f(p.c[2])} 0 `).join('');

  /** Roblox binary attribute blob (base64) for number attributes. */
  function attributesBlob(attrs) {
    const entries = Object.entries(attrs);
    const enc = new TextEncoder();
    const parts = [];
    const u32 = (n) => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n, true); return b; };
    parts.push(u32(entries.length));
    for (const [k, v] of entries) {
      const name = enc.encode(k);
      parts.push(u32(name.length), name, new Uint8Array([0x06]));
      const d = new Uint8Array(8); new DataView(d.buffer).setFloat64(0, v, true);
      parts.push(d);
    }
    const all = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
    let o = 0; for (const p of parts) { all.set(p, o); o += p.length; }
    let s = ''; for (const b of all) s += String.fromCharCode(b);
    return btoa(s);
  }

  let refCounter = 0;
  const ref = () => 'RBX' + (refCounter++).toString(16).toUpperCase().padStart(8, '0');

  /** Burst layers are always exported disabled; continuous ones only start on for some behaviours. */
  const enabledFor = (L, startOn) => L.mode !== 'burst' && L.Enabled && startOn;

  function emitterXml(L, ind, startOn = true) {
    const p = [];
    const add = (s) => p.push(ind + '\t\t' + s);
    add(`<string name="Name">${esc(L.Name)}</string>`);
    add(`<bool name="Enabled">${enabledFor(L, startOn) ? 'true' : 'false'}</bool>`);
    for (const prop of PROPS) {
      const k = prop.key, v = L[k];
      switch (prop.type) {
        case 'texture': add(`<Content name="Texture"><url>${esc(TextureStore.exportTexture(L))}</url></Content>`); break;
        case 'colorseq': add(`<ColorSequence name="${k}">${xColSeq(v)}</ColorSequence>`); break;
        case 'numseq': add(`<NumberSequence name="${k}">${xNumSeq(v)}</NumberSequence>`); break;
        case 'range': add(`<NumberRange name="${k}">${f(v[0])} ${f(v[1])} </NumberRange>`); break;
        case 'number': add(`<float name="${k}">${f(v)}</float>`); break;
        case 'bool': add(`<bool name="${k}">${v ? 'true' : 'false'}</bool>`); break;
        case 'enum': add(`<token name="${k}">${Math.max(0, ENUMS[k].items.indexOf(v))}</token>`); break;
        case 'vec2': add(`<Vector2 name="${k}"><X>${f(v[0])}</X><Y>${f(v[1])}</Y></Vector2>`); break;
        case 'vec3': add(`<Vector3 name="${k}"><X>${f(v[0])}</X><Y>${f(v[1])}</Y><Z>${f(v[2])}</Z></Vector3>`); break;
      }
    }
    if (L.mode === 'burst') add(`<BinaryString name="AttributesSerialize">${attributesBlob({ EmitCount: L.emitCount, EmitDelay: L.emitDelay })}</BinaryString>`);
    return `${ind}<Item class="ParticleEmitter" referent="${ref()}">\n${ind}\t<Properties>\n${p.join('\n')}\n${ind}\t</Properties>\n${ind}</Item>`;
  }

  const RUN_CONTEXT = { Legacy: 0, Server: 1, Client: 2 };
  function scriptXml(cls, name, source, ind, runContext, children = []) {
    const rc = runContext ? `\n${ind}\t\t<token name="RunContext">${RUN_CONTEXT[runContext]}</token>` : '';
    const kids = children.length ? '\n' + children.join('\n') : '';
    return `${ind}<Item class="${cls}" referent="${ref()}">\n${ind}\t<Properties>\n${ind}\t\t<string name="Name">${esc(name)}</string>${rc}\n${ind}\t\t<ProtectedString name="Source"><![CDATA[${source.replace(/]]>/g, ']]]]><![CDATA[>')}]]></ProtectedString>\n${ind}\t</Properties>${kids}\n${ind}</Item>`;
  }

  /** Point layers sit in their own Attachment so they emit from the part's centre. */
  function layerXml(L, ind, startOn = true) {
    if (!L.point) return emitterXml(L, ind, startOn);
    return `${ind}<Item class="Attachment" referent="${ref()}">\n${ind}\t<Properties>\n${ind}\t\t<string name="Name">${esc(L.Name)}Point</string>\n${ind}\t</Properties>\n${emitterXml(L, ind + '\t', startOn)}\n${ind}</Item>`;
  }

  /* ---------- car neon (SurfaceGui on the Top face + SurfaceLight shining down) ---------- */
  const xColor = (name, c) => `<Color3 name="${name}"><R>${f(c[0])}</R><G>${f(c[1])}</G><B>${f(c[2])}</B></Color3>`;
  const xUDim2 = (name, xs, xo, ys, yo) => `<UDim2 name="${name}"><XS>${f(xs)}</XS><XO>${f(xo)}</XO><YS>${f(ys)}</YS><YO>${f(yo)}</YO></UDim2>`;
  const item = (cls, ind, props, kids = []) => `${ind}<Item class="${cls}" referent="${ref()}">\n${ind}\t<Properties>\n${props.filter(Boolean).map((p) => ind + '\t\t' + p).join('\n')}\n${ind}\t</Properties>${kids.length ? '\n' + kids.join('\n') : ''}\n${ind}</Item>`;
  /** Neon image or Frames: frame designs need no upload; icon designs fall back to bars until uploaded. */
  const neonFrames = (u) => Neon.guiFrames(u.imageId || Neon.isFrameDesign(u.design) ? u : { ...u, design: 'bars' });

  function neonXml(effect, ind, on) {
    const u = effect.underglow;
    if (!u || !u.enabled) return [];
    const kids = [];
    if (u.imageId) {
      kids.push(item('ImageLabel', ind + '\t', [
        `<string name="Name">Design</string>`, `<float name="BackgroundTransparency">1</float>`,
        `<Content name="Image"><url>${esc(u.imageId)}</url></Content>`, xColor('ImageColor3', u.color),
        `<float name="ImageTransparency">${f(1 - u.opacity)}</float>`, xUDim2('Size', 1, 0, 1, 0),
      ]));
    } else {
      neonFrames(u).forEach((fr, i) => {
        const deco = fr.stroke
          ? [item('UICorner', ind + '\t\t', [`<UDim name="CornerRadius"><S>${f(fr.radius || 0)}</S><O>0</O></UDim>`]),
            item('UIStroke', ind + '\t\t', [xColor('Color', u.color), `<float name="Thickness">${f(fr.stroke)}</float>`, `<float name="Transparency">${f(fr.t)}</float>`])]
          : fr.pill ? [item('UICorner', ind + '\t\t', [`<UDim name="CornerRadius"><S>1</S><O>0</O></UDim>`])] : [];
        kids.push(item('Frame', ind + '\t', [
          `<string name="Name">Glow${i + 1}</string>`, xColor('BackgroundColor3', u.color),
          `<float name="BackgroundTransparency">${f(fr.stroke ? 1 : fr.t)}</float>`, `<int name="BorderSizePixel">0</int>`,
          xUDim2('Position', fr.x, 0, fr.y, 0), xUDim2('Size', fr.w, 0, fr.h, 0),
        ], deco));
      });
    }
    const neonAttr = `<BinaryString name="AttributesSerialize">${attributesBlob({ ParticlyNeon: 1 })}</BinaryString>`;
    const out = [item('SurfaceGui', ind, [
      `<string name="Name">ParticlyNeon</string>`, `<token name="Face">1</token>`, `<bool name="Enabled">${on}</bool>`,
      `<float name="LightInfluence">0</float>`, `<float name="Brightness">${f(u.brightness)}</float>`,
      `<token name="SizingMode">0</token>`, `<Vector2 name="CanvasSize"><X>${NEON_W}</X><Y>${NEON_H}</Y></Vector2>`, neonAttr,
    ], kids)];
    if (u.light && u.lightBrightness > 0) {
      out.push(item('SurfaceLight', ind, [
        `<string name="Name">ParticlyNeonLight</string>`, `<token name="Face">4</token>`, `<bool name="Enabled">${on}</bool>`,
        xColor('Color', u.color), `<float name="Brightness">${f(u.lightBrightness)}</float>`, `<float name="Range">${f(u.lightRange)}</float>`,
        `<float name="Angle">120</float>`, `<bool name="Shadows">false</bool>`, neonAttr,
      ]));
    }
    if (u.anim !== 'none') out.push(scriptXml('Script', 'ParticlyNeonFx', Neon.fxSource(u), ind, 'Client'));
    return out;
  }

  /** Emitters + ParticlyControl + behaviour scripts, as children of a Part or Attachment. */
  function containerKids(effect, ind, withNeon = false) {
    const startOn = Behaviour.startsEnabled(effect);
    const kids = exportLayers(effect).map((L) => layerXml(L, ind, startOn));
    if (withNeon) kids.push(...neonXml(effect, ind, startOn));
    for (const sc of Behaviour.containerScripts(effect)) kids.push(scriptXml(sc.cls, sc.name, sc.source, ind, sc.runContext));
    return kids;
  }

  /** "Attach to every character": a Script for StarterCharacterScripts holding emitter templates. */
  function characterXml(effect, ind) {
    const emitters = exportLayers(effect).map((L) => layerXml(L, ind + '\t\t', true));
    const folder = `${ind}\t<Item class="Folder" referent="${ref()}">\n${ind}\t\t<Properties>\n${ind}\t\t\t<string name="Name">Emitters</string>\n${ind}\t\t</Properties>\n${emitters.join('\n')}\n${ind}\t</Item>`;
    const control = scriptXml('ModuleScript', 'ParticlyControl', Behaviour.CONTROL_SOURCE, ind + '\t');
    return scriptXml('Script', 'Particly_' + U.safeName(effect.name), Behaviour.characterSource(effect), ind, null, [folder, control]);
  }

  function partXml(effect, opts, pos, ind) {
    const s = effect.partSize;
    const mode = effect.trigger.mode;
    const kids = containerKids(effect, ind + '\t', true);
    const props = [
      `<string name="Name">${esc(effect.name)}</string>`,
      `<bool name="Anchored">true</bool>`,
      `<bool name="CanCollide">false</bool>`,
      `<bool name="CanQuery">false</bool>`,
      `<bool name="CanTouch">${mode === 'touch' ? 'true' : 'false'}</bool>`,
      `<bool name="CastShadow">false</bool>`,
      `<bool name="Locked">false</bool>`,
      `<float name="Transparency">1</float>`,
      `<Vector3 name="size"><X>${f(s[0])}</X><Y>${f(s[1])}</Y><Z>${f(s[2])}</Z></Vector3>`,
      `<CoordinateFrame name="CFrame"><X>${f(pos[0])}</X><Y>${f(pos[1])}</Y><Z>${f(pos[2])}</Z><R00>1</R00><R01>0</R01><R02>0</R02><R10>0</R10><R11>1</R11><R12>0</R12><R20>0</R20><R21>0</R21><R22>1</R22></CoordinateFrame>`,
      // Vehicle boosts: this Part welds itself to the nearest car part at runtime
      mode === 'vehicle' ? `<BinaryString name="AttributesSerialize">${attributesBlob({ ParticlyAutoWeld: 1 })}</BinaryString>` : null,
    ].filter(Boolean).map((x) => ind + '\t\t' + x).join('\n');
    return `${ind}<Item class="Part" referent="${ref()}">\n${ind}\t<Properties>\n${props}\n${ind}\t</Properties>\n${kids.join('\n')}\n${ind}</Item>`;
  }

  function attachmentXml(effect, ind) {
    const kids = containerKids(effect, ind + '\t');
    return `${ind}<Item class="Attachment" referent="${ref()}">\n${ind}\t<Properties>\n${ind}\t\t<string name="Name">${esc(effect.name)}</string>\n${ind}\t</Properties>\n${kids.join('\n')}\n${ind}</Item>`;
  }

  const wrap = (body) => `<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">\n\t<Meta name="ExplicitAutoJoints">true</Meta>\n${body}\n</roblox>\n`;

  /**
   * opts.container: 'part' (invisible anchored Part holding the emitters),
   *                 'attachment' (Attachment holding emitters – drop onto any part),
   *                 'emitters' (bare ParticleEmitters – Insert from File onto a selection)
   */
  function rbxmx(effect, opts = {}) {
    refCounter = 0;
    if (effect.trigger.mode === 'character') return wrap(characterXml(effect, '\t'));
    const c = opts.container || 'part';
    if (c === 'attachment') return wrap(attachmentXml(effect, '\t'));
    if (c === 'emitters') return wrap(exportLayers(effect).map((L) => emitterXml(L, '\t', Behaviour.startsEnabled(effect))).join('\n'));
    return wrap(partXml(effect, {}, [0, effect.partSize[1] / 2 + 3, 0], '\t'));
  }

  /** Many effects as one Model with Parts laid out in a grid (all set to "Always on" so you can browse them). */
  function rbxmxPack(effects, name = 'ParticlyPack') {
    refCounter = 0;
    const cols = Math.ceil(Math.sqrt(effects.length));
    const parts = effects.map((e, i) => partXml({ ...e, trigger: { ...e.trigger, mode: 'always' } }, {}, [(i % cols) * 25, e.partSize[1] / 2 + 3, Math.floor(i / cols) * 25], '\t\t'));
    return wrap(`\t<Item class="Model" referent="${ref()}">\n\t\t<Properties>\n\t\t\t<string name="Name">${esc(name)}</string>\n\t\t</Properties>\n${parts.join('\n')}\n\t</Item>`);
  }

  function moduleRbxmx(effect) {
    refCounter = 0;
    return wrap(scriptXml('ModuleScript', U.safeName(effect.name), moduleScript(effect), '\t'));
  }

  /* ------------------------------ Luau ------------------------------ */
  const lStr = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '') + '"';
  const lCol = (c) => `Color3.fromRGB(${c.map((v) => Math.round(U.clamp(v, 0, 1) * 255)).join(', ')})`;
  function lColSeq(k) {
    const same = k.every((p) => p.c.every((v, i) => Math.abs(v - k[0].c[i]) < 1 / 512));
    if (same) return `ColorSequence.new(${lCol(k[0].c)})`;
    if (k.length === 2) return `ColorSequence.new(${lCol(k[0].c)}, ${lCol(k[1].c)})`;
    return `ColorSequence.new({ ${k.map((p) => `ColorSequenceKeypoint.new(${f(p.t)}, ${lCol(p.c)})`).join(', ')} })`;
  }
  function lNumSeq(k) {
    const noEnv = k.every((p) => !p.e);
    if (noEnv && k.every((p) => p.v === k[0].v)) return `NumberSequence.new(${f(k[0].v)})`;
    if (noEnv && k.length === 2) return `NumberSequence.new(${f(k[0].v)}, ${f(k[1].v)})`;
    return `NumberSequence.new({ ${k.map((p) => `NumberSequenceKeypoint.new(${f(p.t)}, ${f(p.v)}${p.e ? ', ' + f(p.e) : ''})`).join(', ')} })`;
  }
  function luaValue(prop, v, L) {
    switch (prop.type) {
      case 'texture': return lStr(TextureStore.exportTexture(L));
      case 'colorseq': return lColSeq(v);
      case 'numseq': return lNumSeq(v);
      case 'range': return v[0] === v[1] ? `NumberRange.new(${f(v[0])})` : `NumberRange.new(${f(v[0])}, ${f(v[1])})`;
      case 'number': return f(v);
      case 'bool': return v ? 'true' : 'false';
      case 'enum': return `Enum.${ENUMS[prop.key].type}.${v}`;
      case 'vec2': return `Vector2.new(${f(v[0])}, ${f(v[1])})`;
      case 'vec3': return `Vector3.new(${f(v[0])}, ${f(v[1])}, ${f(v[2])})`;
    }
    return 'nil';
  }
  function emittersTable(effect, ind = '', startOn = true) {
    const rows = exportLayers(effect).map((L) => {
      const props = PROPS.map((p) => `${ind}\t\t\t${p.key} = ${luaValue(p, L[p.key], L)},`);
      props.unshift(`${ind}\t\t\tEnabled = ${enabledFor(L, startOn) ? 'true' : 'false'},`);
      const burst = L.mode === 'burst' ? `${ind}\t\tBurst = { Count = ${L.emitCount}, Delay = ${f(L.emitDelay)} },\n` : '';
      const point = L.point ? `${ind}\t\tPoint = true, -- emits from the centre (placed in an Attachment)\n` : '';
      return `${ind}\t{\n${ind}\t\tName = ${lStr(L.Name)},\n${point}${burst}${ind}\t\tProps = {\n${props.join('\n')}\n${ind}\t\t},\n${ind}\t},`;
    });
    return `{\n${rows.join('\n')}\n${ind}}`;
  }

  const APPLY_FN = `local function apply(instance, props)
	for key, value in pairs(props) do
		-- pcall so a property missing in an older Studio version doesn't stop the rest
		local ok, err = pcall(function()
			instance[key] = value
		end)
		if not ok then
			warn(("[Particly] Skipped %s.%s: %s"):format(instance.Name, key, tostring(err)))
		end
	end
end`;

  const longStr = (src) => `[==[\n${src}]==]`;

  /** Luau table + builder for the car neon (shared by Command Bar and ModuleScript exports). */
  function neonLua(effect) {
    const u = effect.underglow;
    if (!u || !u.enabled) return { table: 'local NEON = nil', fn: '' };
    const frames = u.imageId ? [] : neonFrames(u);
    const rows = frames.map((fr) => `\t\t{ ${[`X = ${f(fr.x)}`, `Y = ${f(fr.y)}`, `W = ${f(fr.w)}`, `H = ${f(fr.h)}`, `T = ${f(fr.t)}`, fr.pill ? 'Pill = true' : null, fr.stroke ? `Stroke = ${f(fr.stroke)}, Radius = ${f(fr.radius || 0)}` : null].filter(Boolean).join(', ')} },`).join('\n');
    const table = `-- Car neon: a glowing SurfaceGui on the part's Top face + a SurfaceLight lighting the road
local NEON = {
	Image = ${u.imageId ? lStr(u.imageId) : 'nil'},
	Color = ${lCol(u.color)},
	Brightness = ${f(u.brightness)},
	Opacity = ${f(u.opacity)},
	Light = ${u.light && u.lightBrightness > 0 ? 'true' : 'false'},
	LightBrightness = ${f(u.lightBrightness)},
	LightRange = ${f(u.lightRange)},
	Anim = ${lStr(u.anim)},
	AnimSpeed = ${f(u.animSpeed)},
	Frames = {
${rows}
	},
}`;
    const fn = `local function buildNeon(part, on)
	local gui = Instance.new("SurfaceGui")
	gui.Name = "ParticlyNeon"
	gui.Face = Enum.NormalId.Top
	gui.LightInfluence = 0
	gui.Brightness = NEON.Brightness
	gui.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
	gui.CanvasSize = Vector2.new(${NEON_W}, ${NEON_H})
	gui.Enabled = on
	gui:SetAttribute("ParticlyNeon", 1)
	if NEON.Image then
		local image = Instance.new("ImageLabel")
		image.Name = "Design"
		image.BackgroundTransparency = 1
		image.Image = NEON.Image
		image.ImageColor3 = NEON.Color
		image.ImageTransparency = 1 - NEON.Opacity
		image.Size = UDim2.fromScale(1, 1)
		image.Parent = gui
	end
	for i, def in ipairs(NEON.Frames) do
		local frame = Instance.new("Frame")
		frame.Name = "Glow" .. i
		frame.BackgroundColor3 = NEON.Color
		frame.BackgroundTransparency = def.Stroke and 1 or def.T
		frame.BorderSizePixel = 0
		frame.Position = UDim2.fromScale(def.X, def.Y)
		frame.Size = UDim2.fromScale(def.W, def.H)
		if def.Pill or def.Stroke then
			local corner = Instance.new("UICorner")
			corner.CornerRadius = UDim.new(def.Stroke and def.Radius or 1, 0)
			corner.Parent = frame
		end
		if def.Stroke then
			local stroke = Instance.new("UIStroke")
			stroke.Color = NEON.Color
			stroke.Thickness = def.Stroke
			stroke.Transparency = def.T
			stroke.Parent = frame
		end
		frame.Parent = gui
	end
	gui.Parent = part
	local light = nil
	if NEON.Light then
		light = Instance.new("SurfaceLight")
		light.Name = "ParticlyNeonLight"
		light.Face = Enum.NormalId.Bottom
		light.Color = NEON.Color
		light.Brightness = NEON.LightBrightness
		light.Range = NEON.LightRange
		light.Angle = 120
		light.Shadows = false
		light.Enabled = on
		light:SetAttribute("ParticlyNeon", 1)
		light.Parent = part
	end
	return gui, light
end`;
    return { table, fn };
  }

  function commandBar(effect) {
    const s = effect.partSize;
    const mode = effect.trigger.mode;
    const character = mode === 'character';
    const neon = neonLua(effect);
    const scripts = character ? [] : Behaviour.containerScripts(effect);
    const scriptRows = scripts.map((sc) => `\t{ Class = ${lStr(sc.cls)}, Name = ${lStr(sc.name)}, RunContext = ${sc.runContext ? lStr(sc.runContext) : 'nil'}, Source = ${longStr(sc.source)} },`).join('\n');
    const how = {
      vehicle: '--   * Select the car\'s exhaust Part(s) first (inside a model with a VehicleSeat), or\n--   * select nothing to create a Part, then drag it into your car model at the exhaust.',
      character: '--   * Creates a Script in StarterPlayer > StarterCharacterScripts: every character gets the effect.',
    }[mode] || '--   * Select Part(s) or Attachment(s) first to add the effect to them, or\n--   * select nothing to create a new invisible Part in front of the camera.';
    return `-- Particly effect: ${effect.name}
-- In Roblox: ${BEHAVIOURS[mode].label}
-- HOW TO USE: Roblox Studio > View > Command Bar. Paste this whole script and press Enter.
${how}
-- Undo with Ctrl+Z.

local EFFECT_NAME = ${lStr(effect.name)}
local PART_SIZE = Vector3.new(${f(s[0])}, ${f(s[1])}, ${f(s[2])})
local MODE = ${lStr(mode)}

local EMITTERS = ${emittersTable(effect, '', Behaviour.startsEnabled(effect))}

-- Behaviour scripts placed next to the emitters
local SCRIPTS = {
${scriptRows}
}
local CONTROL_SOURCE = ${longStr(Behaviour.CONTROL_SOURCE)}
local CHARACTER_SOURCE = ${character ? longStr(Behaviour.characterSource(effect)) : 'nil'}

${character ? 'local NEON = nil' : neon.table}
local NEON_FX_SOURCE = ${!character && effect.underglow.enabled && effect.underglow.anim !== 'none' ? longStr(Neon.fxSource(effect.underglow)) : 'nil'}

local ChangeHistoryService = game:GetService("ChangeHistoryService")
local Selection = game:GetService("Selection")

${APPLY_FN}

local function addEmitters(parent)
	for _, def in ipairs(EMITTERS) do
		local emitter = Instance.new("ParticleEmitter")
		emitter.Name = def.Name
		apply(emitter, def.Props)
		if def.Burst then
			emitter:SetAttribute("EmitCount", def.Burst.Count)
			emitter:SetAttribute("EmitDelay", def.Burst.Delay)
		end
		local holder = parent
		if def.Point and parent:IsA("BasePart") then
			holder = Instance.new("Attachment")
			holder.Name = def.Name .. "Point"
			holder.Parent = parent
		end
		emitter.Parent = holder
	end
end

local function newScript(class, name, source, parent, runContext)
	local s = Instance.new(class)
	s.Name = name
	s.Source = source
	if runContext then
		s.RunContext = Enum.RunContext[runContext]
	end
	s.Parent = parent
	return s
end

${character ? '' : neon.fn}

local function build(parent)
	addEmitters(parent)
	for _, def in ipairs(SCRIPTS) do
		newScript(def.Class, def.Name, def.Source, parent, def.RunContext)
	end
	if NEON and parent:IsA("BasePart") then
		buildNeon(parent, ${Behaviour.startsEnabled(effect) ? 'true' : 'false'})
		if NEON_FX_SOURCE then
			newScript("Script", "ParticlyNeonFx", NEON_FX_SOURCE, parent, "Client")
		end
	end
end

local recording
pcall(function()
	recording = ChangeHistoryService:TryBeginRecording("Insert Particly effect")
end)

local targets = {}
if MODE == "character" then
	local folder = game:GetService("StarterPlayer"):WaitForChild("StarterCharacterScripts")
	local main = newScript("Script", "Particly_" .. EFFECT_NAME:gsub("%W", ""), CHARACTER_SOURCE, nil)
	local templates = Instance.new("Folder")
	templates.Name = "Emitters"
	addEmitters(templates)
	templates.Parent = main
	newScript("ModuleScript", "ParticlyControl", CONTROL_SOURCE, main)
	main.Parent = folder
	targets = { main }
else
	for _, instance in ipairs(Selection:Get()) do
		if instance:IsA("BasePart") or instance:IsA("Attachment") then
			table.insert(targets, instance)
		end
	end
	if #targets == 0 then
		local camera = workspace.CurrentCamera
		local part = Instance.new("Part")
		part.Name = EFFECT_NAME
		part.Size = PART_SIZE
		part.Anchored = true
		part.CanCollide = false
		part.CanQuery = false
		part.CanTouch = MODE == "touch"
		part.CastShadow = false
		part.Transparency = 1
		part.CFrame = CFrame.new(camera.CFrame.Position + camera.CFrame.LookVector * 20)
		if MODE == "vehicle" then
			part:SetAttribute("ParticlyAutoWeld", 1) -- welds itself to the nearest car part at runtime
		end
		build(part)
		part.Parent = workspace
		targets = { part }
	else
		for _, target in ipairs(targets) do
			build(target)
		end
	end
end

Selection:Set(targets)
if recording then
	ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Commit)
end
print(("[Particly] Added %q (%d emitters) to %d object(s)"):format(EFFECT_NAME, #EMITTERS, #targets))
`;
  }

  function moduleScript(effect) {
    const s = effect.partSize;
    const neon = neonLua(effect);
    const modName = U.safeName(effect.name);
    return `--[[
	Particly effect module: ${effect.name}
	Put this ModuleScript in ReplicatedStorage (e.g. ReplicatedStorage.Effects.${modName}).

	local Effect = require(game.ReplicatedStorage.Effects.${modName})

	-- Add the emitters to a Part or Attachment (e.g. a character's HumanoidRootPart):
	local emitters = Effect.create(somePart)

	-- Fire the burst layers once (layers with EmitCount):
	Effect.burst(emitters)

	-- One-shot at a world position; cleans itself up afterwards:
	Effect.playAt(CFrame.new(0, 5, 0), 2)

	-- Turn continuous layers on/off (e.g. nitro while a key is held):
	Effect.start(emitters)
	Effect.stop(emitters)   -- existing particles finish naturally

	-- Create switched off, start later:
	local emitters = Effect.create(somePart, false)
]]

local Debris = game:GetService("Debris")

local Effect = {}

Effect.Name = ${lStr(effect.name)}
Effect.PartSize = Vector3.new(${f(s[0])}, ${f(s[1])}, ${f(s[2])})
Effect.MaxLifetime = ${f(maxLifetime(effect))}
Effect.BurstLoop = ${f(effect.burstLoop)} -- suggested seconds between bursts if you loop them

Effect.Emitters = ${emittersTable(effect)}

${neon.table}

${APPLY_FN}
${neon.fn ? '\n' + neon.fn + '\n\n' + Neon.ANIMATE_FN + '\n' : ''}
function Effect.create(parent: Instance, startOn: boolean?): { ParticleEmitter }
	local created = {}
	for _, def in ipairs(Effect.Emitters) do
		local emitter = Instance.new("ParticleEmitter")
		emitter.Name = def.Name
		apply(emitter, def.Props)
		if startOn == false then
			emitter.Enabled = false
		end
		if def.Burst then
			emitter:SetAttribute("EmitCount", def.Burst.Count)
			emitter:SetAttribute("EmitDelay", def.Burst.Delay)
		end
		local holder = parent
		if def.Point and parent:IsA("BasePart") then
			holder = Instance.new("Attachment")
			holder.Name = def.Name .. "Point"
			holder.Parent = parent
		end
		emitter.Parent = holder
		table.insert(created, emitter)
	end${neon.fn ? `
	if NEON and parent:IsA("BasePart") then
		local gui, light = buildNeon(parent, startOn ~= false)
		if NEON.Anim ~= "none" and game:GetService("RunService"):IsClient() then
			animateNeon(gui, light, NEON.Anim, NEON.AnimSpeed) -- animations run on the client
		end
	end` : ''}
	return created
end

function Effect.burst(emitters: { ParticleEmitter })
	for _, emitter in ipairs(emitters) do
		local count = emitter:GetAttribute("EmitCount")
		if count then
			local delay = emitter:GetAttribute("EmitDelay") or 0
			if delay > 0 then
				task.delay(delay, function()
					emitter:Emit(count)
				end)
			else
				emitter:Emit(count)
			end
		end
	end
end

-- Car neon on the emitters' part follows start / stop
local function setNeon(emitters: { ParticleEmitter }, on: boolean)
	local done = {}
	for _, emitter in ipairs(emitters) do
		local part = emitter:FindFirstAncestorWhichIsA("BasePart")
		if part and not done[part] then
			done[part] = true
			for _, item in ipairs(part:GetChildren()) do
				if item:GetAttribute("ParticlyNeon") then
					item.Enabled = on
				end
			end
		end
	end
end

function Effect.start(emitters: { ParticleEmitter })
	for _, emitter in ipairs(emitters) do
		if not emitter:GetAttribute("EmitCount") then
			emitter.Enabled = true
		end
	end
	setNeon(emitters, true)
	Effect.burst(emitters)
end

function Effect.stop(emitters: { ParticleEmitter })
	for _, emitter in ipairs(emitters) do
		emitter.Enabled = false
	end
	setNeon(emitters, false)
end

function Effect.playAt(cframe: CFrame, duration: number?): BasePart
	local part = Instance.new("Part")
	part.Name = Effect.Name
	part.Size = Effect.PartSize
	part.Anchored = true
	part.CanCollide = false
	part.CanQuery = false
	part.CanTouch = false
	part.CastShadow = false
	part.Transparency = 1
	part.CFrame = cframe
	part.Parent = workspace
	local emitters = Effect.create(part)
	Effect.burst(emitters)
	local activeFor = duration or 1
	task.delay(activeFor, function()
		Effect.stop(emitters)
	end)
	Debris:AddItem(part, activeFor + Effect.MaxLifetime + 0.5)
	return part
end

return Effect
`;
  }

  /* --------------------------- JSON / share --------------------------- */
  function json(effect) {
    return JSON.stringify({ particly: 1, type: 'effect', effect }, null, 2);
  }
  function libraryJson(effects) {
    return JSON.stringify({ particly: 1, type: 'library', effects }, null, 2);
  }
  async function shareLink(effect) {
    const e = U.clone(effect);
    delete e.textures;
    const { z, bytes } = await U.deflate(JSON.stringify(e));
    // Over http(s) we can hand out a real link; from a file (desktop app) a bare code is portable.
    const base = /^https?:/.test(location.protocol) ? location.href.split('#')[0] : '';
    return `${base}#fx=${z ? 'z' : 'r'}${U.bytesToB64url(bytes)}`;
  }

  return { warnings, rbxmx, rbxmxPack, moduleRbxmx, commandBar, moduleScript, json, libraryJson, shareLink, hasBurst, exportLayers };
})();
