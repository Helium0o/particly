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

  function emitterXml(L, ind) {
    const p = [];
    const add = (s) => p.push(ind + '\t\t' + s);
    add(`<string name="Name">${esc(L.Name)}</string>`);
    add(`<bool name="Enabled">${L.mode === 'burst' ? 'false' : L.Enabled ? 'true' : 'false'}</bool>`);
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

  function scriptXml(cls, name, source, ind) {
    return `${ind}<Item class="${cls}" referent="${ref()}">\n${ind}\t<Properties>\n${ind}\t\t<string name="Name">${esc(name)}</string>\n${ind}\t\t<ProtectedString name="Source"><![CDATA[${source.replace(/]]>/g, ']]]]><![CDATA[>')}]]></ProtectedString>\n${ind}\t</Properties>\n${ind}</Item>`;
  }

  /** Point layers sit in their own Attachment so they emit from the part's centre. */
  function layerXml(L, ind) {
    if (!L.point) return emitterXml(L, ind);
    return `${ind}<Item class="Attachment" referent="${ref()}">\n${ind}\t<Properties>\n${ind}\t\t<string name="Name">${esc(L.Name)}Point</string>\n${ind}\t</Properties>\n${emitterXml(L, ind + '\t')}\n${ind}</Item>`;
  }

  function partXml(effect, opts, pos, ind) {
    const s = effect.partSize;
    const kids = exportLayers(effect).map((L) => layerXml(L, ind + '\t'));
    if (opts.burstPlayer && hasBurst(effect)) kids.push(scriptXml('Script', 'ParticlyBurstPlayer', burstPlayerSource(effect), ind + '\t'));
    const props = [
      `<string name="Name">${esc(effect.name)}</string>`,
      `<bool name="Anchored">true</bool>`,
      `<bool name="CanCollide">false</bool>`,
      `<bool name="CanQuery">false</bool>`,
      `<bool name="CanTouch">false</bool>`,
      `<bool name="CastShadow">false</bool>`,
      `<bool name="Locked">false</bool>`,
      `<float name="Transparency">1</float>`,
      `<Vector3 name="size"><X>${f(s[0])}</X><Y>${f(s[1])}</Y><Z>${f(s[2])}</Z></Vector3>`,
      `<CoordinateFrame name="CFrame"><X>${f(pos[0])}</X><Y>${f(pos[1])}</Y><Z>${f(pos[2])}</Z><R00>1</R00><R01>0</R01><R02>0</R02><R10>0</R10><R11>1</R11><R12>0</R12><R20>0</R20><R21>0</R21><R22>1</R22></CoordinateFrame>`,
    ].map((x) => ind + '\t\t' + x).join('\n');
    return `${ind}<Item class="Part" referent="${ref()}">\n${ind}\t<Properties>\n${props}\n${ind}\t</Properties>\n${kids.join('\n')}\n${ind}</Item>`;
  }

  function attachmentXml(effect, ind) {
    const kids = exportLayers(effect).map((L) => emitterXml(L, ind + '\t'));
    if (hasBurst(effect)) kids.push(scriptXml('Script', 'ParticlyBurstPlayer', burstPlayerSource(effect), ind + '\t'));
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
    const c = opts.container || 'part';
    if (c === 'attachment') return wrap(attachmentXml(effect, '\t'));
    if (c === 'emitters') return wrap(exportLayers(effect).map((L) => emitterXml(L, '\t')).join('\n'));
    return wrap(partXml(effect, { burstPlayer: opts.burstPlayer !== false }, [0, effect.partSize[1] / 2 + 3, 0], '\t'));
  }

  /** Many effects as one Model with Parts laid out in a grid. */
  function rbxmxPack(effects, name = 'ParticlyPack') {
    refCounter = 0;
    const cols = Math.ceil(Math.sqrt(effects.length));
    const parts = effects.map((e, i) => partXml(e, { burstPlayer: true }, [(i % cols) * 25, e.partSize[1] / 2 + 3, Math.floor(i / cols) * 25], '\t\t'));
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
  function emittersTable(effect, ind = '') {
    const rows = exportLayers(effect).map((L) => {
      const props = PROPS.map((p) => `${ind}\t\t\t${p.key} = ${luaValue(p, L[p.key], L)},`);
      props.unshift(`${ind}\t\t\tEnabled = ${L.mode === 'burst' ? 'false' : L.Enabled ? 'true' : 'false'},`);
      const burst = L.mode === 'burst' ? `${ind}\t\tBurst = { Count = ${L.emitCount}, Delay = ${f(L.emitDelay)} },\n` : '';
      const point = L.point ? `${ind}\t\tPoint = true, -- emits from the centre (placed in an Attachment)\n` : '';
      return `${ind}\t{\n${ind}\t\tName = ${lStr(L.Name)},\n${point}${burst}${ind}\t\tProps = {\n${props.join('\n')}\n${ind}\t\t},\n${ind}\t},`;
    });
    return `{\n${rows.join('\n')}\n${ind}}`;
  }

  function burstPlayerSource(effect) {
    return `-- Particly burst player: replays this effect's burst emitters every LOOP_SECONDS.
-- Burst emitters are disabled ParticleEmitters with an "EmitCount" attribute
-- (and optional "EmitDelay"). Delete this script if you trigger them yourself:
--     emitter:Emit(emitter:GetAttribute("EmitCount"))
local LOOP_SECONDS = ${f(effect.burstLoop)}

local root = script.Parent
while root.Parent do
	for _, emitter in ipairs(root:GetDescendants()) do
		if emitter:IsA("ParticleEmitter") then
			local count = emitter:GetAttribute("EmitCount")
			if count then
				task.delay(emitter:GetAttribute("EmitDelay") or 0, function()
					emitter:Emit(count)
				end)
			end
		end
	end
	task.wait(LOOP_SECONDS)
end
`;
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

  function commandBar(effect, opts = {}) {
    const burstPlayer = opts.burstPlayer !== false && hasBurst(effect);
    const s = effect.partSize;
    return `-- Particly effect: ${effect.name}
-- HOW TO USE: Roblox Studio > View > Command Bar. Paste this whole script and press Enter.
--   * Select Part(s) or Attachment(s) first to add the emitters to them, or
--   * select nothing to create a new invisible Part in front of the camera.
-- Undo with Ctrl+Z.

local EFFECT_NAME = ${lStr(effect.name)}
local PART_SIZE = Vector3.new(${f(s[0])}, ${f(s[1])}, ${f(s[2])})
local ADD_BURST_PLAYER = ${burstPlayer ? 'true' : 'false'} -- adds a Script that replays burst emitters
local BURST_PLAYER_SOURCE = [==[
${burstPlayerSource(effect)}]==]

local EMITTERS = ${emittersTable(effect)}

local ChangeHistoryService = game:GetService("ChangeHistoryService")
local Selection = game:GetService("Selection")

${APPLY_FN}

local function build(parent)
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
	if ADD_BURST_PLAYER then
		local player = Instance.new("Script")
		player.Name = "ParticlyBurstPlayer"
		player.Source = BURST_PLAYER_SOURCE
		player.Parent = parent
	end
end

local recording
pcall(function()
	recording = ChangeHistoryService:TryBeginRecording("Insert Particly effect")
end)

local targets = {}
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
	part.CanTouch = false
	part.CastShadow = false
	part.Transparency = 1
	part.CFrame = CFrame.new(camera.CFrame.Position + camera.CFrame.LookVector * 20)
	build(part)
	part.Parent = workspace
	targets = { part }
else
	for _, target in ipairs(targets) do
		build(target)
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

	-- Stop continuous emitters (existing particles finish naturally):
	Effect.stop(emitters)
]]

local Debris = game:GetService("Debris")

local Effect = {}

Effect.Name = ${lStr(effect.name)}
Effect.PartSize = Vector3.new(${f(s[0])}, ${f(s[1])}, ${f(s[2])})
Effect.MaxLifetime = ${f(maxLifetime(effect))}
Effect.BurstLoop = ${f(effect.burstLoop)} -- suggested seconds between bursts if you loop them

Effect.Emitters = ${emittersTable(effect)}

${APPLY_FN}

function Effect.create(parent: Instance): { ParticleEmitter }
	local created = {}
	for _, def in ipairs(Effect.Emitters) do
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
		table.insert(created, emitter)
	end
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

function Effect.stop(emitters: { ParticleEmitter })
	for _, emitter in ipairs(emitters) do
		emitter.Enabled = false
	end
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

  return { warnings, rbxmx, rbxmxPack, moduleRbxmx, commandBar, moduleScript, burstPlayerSource, json, libraryJson, shareLink, hasBurst, exportLayers };
})();
