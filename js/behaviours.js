'use strict';
/*
 * "In Roblox" behaviours: what an exported effect does by itself in a game.
 * Generates the Luau that ships inside exports:
 *   ParticlyControl  (ModuleScript) start / stop / burst / play API for any script
 *   ParticlyTrigger  (Script)       wires the chosen behaviour (loop, touch, prompt, vehicle boost)
 *   ParticlyBoostClient (Script, RunContext = Client)  reads the boost key while driving
 *   Particly_<name>  (Script for StarterCharacterScripts) attaches the effect to every character
 */

const BEHAVIOURS = {
  always: { label: 'Always on', help: 'Continuous layers run all the time; burst layers replay every "Burst replay" seconds.' },
  vehicle: { label: 'Vehicle boost (hold key while driving)', help: 'For nitro / exhaust / afterburners. Put the effect inside a car model that has a VehicleSeat. The driver holds the key (or the on-screen BOOST button on mobile) and everyone sees it.' },
  speed: { label: 'React to car speed / drifting', help: 'Grows with the car\'s speed — or with how fast it slides sideways (drift): exhaust flames, wind lines, tyre smoke, skid marks, rim sparks. Burst layers fire when the car hits top speed (sonic boom). Put the effect inside a car model.' },
  impact: { label: 'Play on crash / hard impact', help: 'Plays when the car suddenly changes speed — a crash, a wall hit or a hard landing (spark showers, debris, smoke). Put it inside a car model, or on any unanchored part.' },
  touch: { label: 'Play when touched', help: 'Plays when a player — or a car someone is driving — touches the part (pickups, boost pads, puddles, traps, checkpoints).' },
  prompt: { label: 'Play from a ProximityPrompt', help: 'Shows an interaction prompt ("Press E"); plays when used (chests, buttons, shrines).' },
  character: { label: 'Attach to every player\'s character', help: 'Auras, trails and footstep dust. Export goes into StarterPlayer › StarterCharacterScripts.' },
  script: { label: 'Controlled by my scripts', help: 'Starts off. From any server Script: require(effect.ParticlyControl).play(2) — or .start(), .stop(), .burst().' },
};
const BOOST_KEYS = ['LeftShift', 'RightShift', 'LeftControl', 'Q', 'E', 'F', 'R', 'B', 'N', 'X', 'Z', 'Space'];
const ATTACH_POINTS = ['HumanoidRootPart', 'Head', 'UpperTorso', 'LowerTorso'];

const TRIGGER_DEFAULTS = {
  mode: 'always', key: 'LeftShift', buttonText: 'BOOST', toggle: false, maxSeconds: 0, duration: 2, cooldown: 1, actionText: 'Activate', attachTo: 'HumanoidRootPart',
  measure: 'speed', minSpeed: 10, maxSpeed: 120, scaleSize: true, impact: 45, keepOn: false, shop: 'none',
};
/** Colour-shop slots: players recolour every effect tagged with a slot (see Shop in shop.js). */
const SHOP_SLOTS = { none: { id: 0, label: 'No' }, neon: { id: 1, label: 'Neon / underglow' }, boost: { id: 2, label: 'Nitro / boost' }, smoke: { id: 3, label: 'Tyre smoke' }, aura: { id: 4, label: 'Aura / trail' } };
const SPEED_MEASURES = { speed: 'Car speed', drift: 'Sideways slide (drift)' };
/** Gamepad button paired with each keyboard key (so different effects don't share one button). */
const GAMEPAD_FOR_KEY = { LeftShift: 'ButtonR1', RightShift: 'ButtonR1', Space: 'ButtonR1', LeftControl: 'ButtonL1', Q: 'ButtonL1', E: 'ButtonY', R: 'ButtonY', F: 'ButtonX', X: 'ButtonX', B: 'ButtonB', N: 'DPadUp', Z: 'DPadDown' };

const Behaviour = (() => {
  const f = U.fmt;
  const lStr = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ').replace(/\r/g, '') + '"';

  function normalize(t) {
    const d = TRIGGER_DEFAULTS;
    t = t && typeof t === 'object' ? t : {};
    const num = (v, def, min, max) => (isFinite(+v) && v !== null && v !== '' ? U.clamp(+v, min, max) : def);
    return {
      mode: BEHAVIOURS[t.mode] ? t.mode : d.mode,
      key: BOOST_KEYS.includes(t.key) ? t.key : d.key,
      buttonText: String(t.buttonText || d.buttonText).slice(0, 12),
      toggle: !!t.toggle,
      maxSeconds: num(t.maxSeconds, d.maxSeconds, 0, 600),
      duration: num(t.duration, d.duration, 0.05, 600),
      cooldown: num(t.cooldown, d.cooldown, 0, 600),
      actionText: String(t.actionText || d.actionText).slice(0, 40),
      attachTo: ATTACH_POINTS.includes(t.attachTo) ? t.attachTo : d.attachTo,
      measure: SPEED_MEASURES[t.measure] ? t.measure : d.measure,
      minSpeed: num(t.minSpeed, d.minSpeed, 0, 2000),
      maxSpeed: num(t.maxSpeed, d.maxSpeed, 1, 4000),
      scaleSize: t.scaleSize === undefined ? d.scaleSize : !!t.scaleSize,
      impact: num(t.impact, d.impact, 5, 1000),
      keepOn: !!t.keepOn,
      shop: SHOP_SLOTS[t.shop] ? t.shop : d.shop,
    };
  }

  /** Machine-readable header so Particly can re-import the behaviour from exported scripts. */
  const marker = (effect) => `--@particly ${JSON.stringify({ ...effect.trigger, burstLoop: effect.burstLoop, name: effect.name, partSize: effect.partSize, ...(effect.underglow && effect.underglow.enabled ? { underglow: effect.underglow } : {}) })}`;
  const controlSource = (effect) => `${marker(effect)}\n${CONTROL_SOURCE}`;

  const hasBurst = (effect) => effect.layers.some((l) => !l.hidden && l.mode === 'burst');
  /** Continuous emitters start enabled only for "always" (and inside character templates). */
  const startsEnabled = (effect) => {
    const m = effect.trigger.mode;
    return m === 'always' || m === 'character' || ((m === 'touch' || m === 'prompt') && effect.trigger.keepOn);
  };
  /** Behaviours whose effect Part welds itself into the car it is dropped into. */
  const autoWelds = (effect) => ['vehicle', 'speed', 'impact'].includes(effect.trigger.mode);
  const shopSlot = (effect) => SHOP_SLOTS[effect.trigger.shop].id;
  /** Does the container need a ParticlyTrigger script? */
  const needsTrigger = (effect) => {
    const m = effect.trigger.mode;
    return m === 'touch' || m === 'prompt' || m === 'vehicle' || m === 'speed' || m === 'impact' || (m === 'always' && hasBurst(effect));
  };

  const CONTROL_SOURCE = `--[[
	ParticlyControl: start, stop or fire this effect from any server Script.

		local control = require(effectPart.ParticlyControl)
		control.start()     -- continuous layers on + burst layers fire once
		control.stop()      -- continuous layers off (live particles fade out naturally)
		control.burst()     -- fire the burst layers (emitters with an EmitCount attribute)
		control.play(2)     -- start, then stop again after 2 seconds
		control.isActive()

	Burst layers are ParticleEmitters with Enabled = false and an "EmitCount"
	attribute (optionally "EmitDelay"). Everything else is a continuous layer.
	Call these from the server so every player sees the change.
]]

local function new(target)
	local self = {}
	local active = false
	local token = 0

	local function emitters()
		if typeof(target) ~= "Instance" then
			return target -- a list of emitters
		end
		local list = {}
		for _, item in ipairs(target:GetDescendants()) do
			if item:IsA("ParticleEmitter") then
				table.insert(list, item)
			end
		end
		return list
	end

	-- Car neon (SurfaceGui / SurfaceLight tagged ParticlyNeon) follows start / stop
	local function setNeon(on)
		if typeof(target) ~= "Instance" then
			return
		end
		for _, item in ipairs(target:GetDescendants()) do
			if item:GetAttribute("ParticlyNeon") then
				item.Enabled = on
			end
		end
	end

	function self.burst()
		for _, emitter in ipairs(emitters()) do
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

	function self.start()
		token += 1
		if active then
			return
		end
		active = true
		for _, emitter in ipairs(emitters()) do
			if not emitter:GetAttribute("EmitCount") then
				emitter.Enabled = true
			end
		end
		setNeon(true)
		self.burst()
	end

	function self.stop()
		token += 1
		active = false
		for _, emitter in ipairs(emitters()) do
			if not emitter:GetAttribute("EmitCount") then
				emitter.Enabled = false
			end
		end
		setNeon(false)
	end

	function self.play(duration)
		self.start()
		token += 1
		local mine = token
		task.delay(duration or 1, function()
			if token == mine then
				self.stop()
			end
		end)
	end

	function self.isActive()
		return active
	end

	return self
end

local default = new(script.Parent)
default.new = new -- ParticlyControl.new(instanceOrListOfEmitters) for other targets
return default
`;

  /** Finds the VehicleSeat of the car this script sits in (stops at Workspace). */
  const FIND_SEAT = `local function findVehicle()
	local model = script:FindFirstAncestorWhichIsA("Model")
	while model and model ~= workspace do
		local seat = model:FindFirstChildWhichIsA("VehicleSeat", true)
		if seat then
			return model, seat
		end
		model = model:FindFirstAncestorWhichIsA("Model")
	end
	return nil, nil
end`;

  /** Welds an anchored Particly effect Part (dropped into a car) to the nearest car part. */
  const AUTO_WELD = `local function autoWeld(vehicle)
	local holder = script.Parent
	if not (holder:IsA("BasePart") and holder:GetAttribute("ParticlyAutoWeld") == 1 and holder.Anchored) then
		return
	end
	local nearest, nearestDistance = nil, math.huge
	for _, item in ipairs(vehicle:GetDescendants()) do
		if item:IsA("BasePart") and item ~= holder then
			local distance = (item.Position - holder.Position).Magnitude
			if distance < nearestDistance then
				nearest, nearestDistance = item, distance
			end
		end
	end
	if nearest then
		local weld = Instance.new("WeldConstraint")
		weld.Part0 = nearest
		weld.Part1 = holder
		weld.Parent = holder
		holder.Massless = true
		holder.Anchored = false
	end
end`;

  /** The part whose velocity a speed / impact effect reads: the car's seat, else the effect's own part. */
  const BODY = `local function findBody(seat)
	if seat then
		return seat
	end
	local holder = script.Parent
	if holder:IsA("BasePart") then
		return holder
	end
	return holder:FindFirstAncestorWhichIsA("BasePart")
end`;

  function alwaysSource(effect) {
    return `${marker(effect)}
-- Particly: keeps this effect running and replays its burst layers.
local LOOP_SECONDS = ${f(effect.burstLoop)}

local control = require(script.Parent:WaitForChild("ParticlyControl"))
control.start()
while script.Parent do
	task.wait(LOOP_SECONDS)
	control.burst()
end
`;
  }

  function touchSource(effect) {
    const t = effect.trigger;
    return `${marker(effect)}
-- Particly: plays this effect when a player touches the part.
local DURATION = ${f(t.duration)} -- seconds the effect stays on
local COOLDOWN = ${f(t.cooldown)} -- seconds before it can trigger again
local KEEP_ON = ${t.keepOn ? 'true' : 'false'} -- true: continuous layers always run, a touch only fires the bursts

local Players = game:GetService("Players")
local control = require(script.Parent:WaitForChild("ParticlyControl"))

local part = script.Parent
if not part:IsA("BasePart") then
	part = part.Parent -- inside an Attachment: use the Attachment's part
end
if not (part and part:IsA("BasePart")) then
	warn("[Particly] Touch effect must be inside a Part")
	return
end
part.CanTouch = true

-- Triggered by a player's character, or by a vehicle that someone is driving.
local function byPlayer(hit)
	local model = hit:FindFirstAncestorOfClass("Model")
	while model do
		if Players:GetPlayerFromCharacter(model) then
			return true
		end
		local seat = model:FindFirstChildWhichIsA("VehicleSeat", true)
		if seat and seat.Occupant then
			return true
		end
		model = model:FindFirstAncestorOfClass("Model")
	end
	return false
end

local ready = true
part.Touched:Connect(function(hit)
	if ready and byPlayer(hit) then
		ready = false
		if KEEP_ON then
			control.burst()
		else
			control.play(DURATION)
		end
		task.wait(math.max(COOLDOWN, 0.1))
		ready = true
	end
end)
`;
  }

  function promptSource(effect) {
    const t = effect.trigger;
    return `${marker(effect)}
-- Particly: adds a ProximityPrompt that plays this effect.
local ACTION_TEXT = ${lStr(t.actionText)}
local DURATION = ${f(t.duration)} -- seconds the effect stays on
local COOLDOWN = ${f(t.cooldown)} -- seconds before it can be used again
local KEEP_ON = ${t.keepOn ? 'true' : 'false'} -- true: continuous layers always run, the prompt only fires the bursts

local control = require(script.Parent:WaitForChild("ParticlyControl"))

local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = ACTION_TEXT
prompt.ObjectText = ${lStr(effect.name)}
prompt.MaxActivationDistance = 12
prompt.RequiresLineOfSight = false
prompt.Parent = script.Parent

prompt.Triggered:Connect(function()
	prompt.Enabled = false
	if KEEP_ON then
		control.burst()
	else
		control.play(DURATION)
	end
	task.wait(math.max(COOLDOWN, 0.1))
	prompt.Enabled = true
end)
`;
  }

  function vehicleServerSource(effect) {
    const t = effect.trigger;
    return `${marker(effect)}
-- Particly vehicle boost (server). Place this effect inside a car model that has a
-- VehicleSeat. While the driver holds the boost key the effect plays for everyone.
local MAX_BOOST_SECONDS = ${f(t.maxSeconds)} -- 0 = unlimited while the key is held

local Players = game:GetService("Players")
local control = require(script.Parent:WaitForChild("ParticlyControl"))

${FIND_SEAT}

local vehicle, seat = findVehicle()
if not seat then
	warn(("[Particly] %q needs to be inside a vehicle model with a VehicleSeat"):format(script.Parent.Name))
	return
end

-- A Particly effect Part dropped into the car welds itself to the nearest car part.
${AUTO_WELD}
autoWeld(vehicle)

local remote = Instance.new("RemoteEvent")
remote.Name = "ParticlyBoostRemote"
remote.Parent = script.Parent

local function driver()
	local occupant = seat.Occupant
	return occupant and Players:GetPlayerFromCharacter(occupant.Parent)
end

local boostId = 0
local lastStart = 0
remote.OnServerEvent:Connect(function(player, on)
	if typeof(on) ~= "boolean" or player ~= driver() then
		return
	end
	boostId += 1
	if not on then
		control.stop()
		return
	end
	if os.clock() - lastStart < 0.15 then
		return -- ignore key spam
	end
	lastStart = os.clock()
	control.start()
	if MAX_BOOST_SECONDS > 0 then
		local id = boostId
		task.delay(MAX_BOOST_SECONDS, function()
			if id == boostId then
				control.stop()
			end
		end)
	end
end)

seat:GetPropertyChangedSignal("Occupant"):Connect(function()
	if not seat.Occupant then
		boostId += 1
		control.stop()
	end
end)
`;
  }

  function vehicleClientSource(effect) {
    const t = effect.trigger;
    return `${marker(effect)}
-- Particly vehicle boost (client, RunContext = Client). Reads the boost key while
-- you drive and tells the server. Keyboard: ${t.key} · Gamepad: ${GAMEPAD_FOR_KEY[t.key]} · Mobile: ${t.buttonText} button.
local BOOST_KEYS = {
	[Enum.KeyCode.${t.key}] = true,
	[Enum.KeyCode.${GAMEPAD_FOR_KEY[t.key]}] = true,
}
local BUTTON_TEXT = ${lStr(t.buttonText)}
local TOGGLE = ${t.toggle ? 'true' : 'false'} -- true: press once for on, again for off
-- One flag + one touch button per key: twin exhausts on the same key stay in sync,
-- while e.g. nitro (Shift) and drift smoke (Q) on the same car stay independent.
local STATE = "ParticlyBoost_${t.key}"

local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local ContextActionService = game:GetService("ContextActionService")

local player = Players.LocalPlayer

${FIND_SEAT}

local _, seat = findVehicle()
if not seat then
	return
end
local remote = script.Parent:WaitForChild("ParticlyBoostRemote")

local function isDriving()
	local occupant = seat.Occupant
	return occupant ~= nil and occupant.Parent == player.Character
end

local function setBoost(on)
	player:SetAttribute(STATE, on)
end

player:GetAttributeChangedSignal(STATE):Connect(function()
	if isDriving() then
		remote:FireServer(player:GetAttribute(STATE) == true)
	end
end)

local function press()
	if TOGGLE then
		setBoost(player:GetAttribute(STATE) ~= true)
	else
		setBoost(true)
	end
end
local function release()
	if not TOGGLE then
		setBoost(false)
	end
end

UserInputService.InputBegan:Connect(function(input, processed)
	if not processed and BOOST_KEYS[input.KeyCode] and isDriving() then
		press()
	end
end)
UserInputService.InputEnded:Connect(function(input)
	if BOOST_KEYS[input.KeyCode] then
		release()
	end
end)

local function onBoostButton(_, state)
	if state == Enum.UserInputState.Begin then
		press()
	elseif state == Enum.UserInputState.End or state == Enum.UserInputState.Cancel then
		release()
	end
	return Enum.ContextActionResult.Sink
end

local function refresh()
	if isDriving() then
		ContextActionService:BindAction(STATE, onBoostButton, true) -- true = on-screen button on touch devices
		ContextActionService:SetTitle(STATE, BUTTON_TEXT)
	else
		ContextActionService:UnbindAction(STATE)
		setBoost(false)
	end
end
seat:GetPropertyChangedSignal("Occupant"):Connect(refresh)
refresh()
`;
  }

  function speedServerSource(effect) {
    return `${marker(effect)}
-- Particly speed effect (server part): welds the effect into the car. The client script
-- ParticlySpeedFx next to this one makes the particles react to the car's speed.

${FIND_SEAT}

${AUTO_WELD}

local vehicle = findVehicle()
if vehicle then
	autoWeld(vehicle)
end
`;
  }

  function speedClientSource(effect) {
    const t = effect.trigger;
    return `${marker(effect)}
-- Particly speed effect (client, RunContext = Client). Every player's game scales the
-- particles with the car's speed, so it looks smooth and costs no network traffic.
local MEASURE = ${lStr(t.measure)} -- "speed": how fast the car moves · "drift": how fast it slides sideways
local MIN_SPEED = ${f(t.minSpeed)} -- studs/s where the effect switches on
local MAX_SPEED = ${f(t.maxSpeed)} -- studs/s for full strength (burst layers fire when this is reached)
local SCALE_SIZE = ${t.scaleSize ? 'true' : 'false'} -- particles also grow with speed

local RunService = game:GetService("RunService")

${FIND_SEAT}

${BODY}

local _, seat = findVehicle()
local body = findBody(seat)
if not body then
	warn("[Particly] Speed effect must be inside a car model or a Part")
	return
end

local layers, bursts, neon = {}, {}, {}
local level = -1 -- 0 = off, 1..20 = strength steps (properties only change when the step does)
local function collect(item)
	if item:IsA("ParticleEmitter") then
		if item:GetAttribute("EmitCount") then
			table.insert(bursts, item)
		else
			table.insert(layers, { emitter = item, rate = item.Rate, size = item.Size })
			item.Enabled = false
			level = -1 -- re-apply the current strength
		end
	elseif item:GetAttribute("ParticlyNeon") then
		table.insert(neon, item)
		level = -1
	end
end
for _, item in ipairs(script.Parent:GetDescendants()) do
	collect(item)
end
script.Parent.DescendantAdded:Connect(collect) -- parts streamed in later (StreamingEnabled)

local function scaled(sequence, k)
	local points = {}
	for _, point in ipairs(sequence.Keypoints) do
		table.insert(points, NumberSequenceKeypoint.new(point.Time, point.Value * k, point.Envelope * k))
	end
	return NumberSequence.new(points)
end

local function burst()
	for _, emitter in ipairs(bursts) do
		local delay = emitter:GetAttribute("EmitDelay") or 0
		if delay > 0 then
			task.delay(delay, function()
				emitter:Emit(emitter:GetAttribute("EmitCount"))
			end)
		else
			emitter:Emit(emitter:GetAttribute("EmitCount"))
		end
	end
end

local atTop = false
RunService.Heartbeat:Connect(function()
	local velocity = body.AssemblyLinearVelocity
	local amount = if MEASURE == "drift" then math.abs(velocity:Dot(body.CFrame.RightVector)) else velocity.Magnitude
	local strength = math.clamp((amount - MIN_SPEED) / math.max(MAX_SPEED - MIN_SPEED, 1), 0, 1)
	local step = if amount < MIN_SPEED then 0 else math.max(1, math.floor(strength * 20 + 0.5))
	if step ~= level then
		level = step
		local k = step / 20
		for _, layer in ipairs(layers) do
			layer.emitter.Enabled = step > 0
			if step > 0 then
				layer.emitter.Rate = layer.rate * (0.15 + 0.85 * k)
				if SCALE_SIZE then
					layer.emitter.Size = scaled(layer.size, 0.4 + 0.6 * k)
				end
			end
		end
		for _, item in ipairs(neon) do
			item.Enabled = step > 0
		end
	end
	if strength >= 1 and not atTop then
		atTop = true
		burst()
	elseif strength < 0.85 then
		atTop = false
	end
end)
`;
  }

  function impactSource(effect) {
    const t = effect.trigger;
    return `${marker(effect)}
-- Particly crash effect (server): plays when the car suddenly changes speed —
-- a crash, a wall hit or a hard landing.
local IMPACT_SPEED = ${f(t.impact)} -- studs/s of sudden speed change (within 0.15 s) that counts as a crash
local DURATION = ${f(t.duration)} -- seconds continuous layers stay on
local COOLDOWN = ${f(t.cooldown)} -- seconds before it can trigger again

local RunService = game:GetService("RunService")
local control = require(script.Parent:WaitForChild("ParticlyControl"))

${FIND_SEAT}

${AUTO_WELD}

${BODY}

local vehicle, seat = findVehicle()
if vehicle then
	autoWeld(vehicle)
end
local body = findBody(seat)
if not body then
	warn("[Particly] Crash effect must be inside a car model or a Part")
	return
end

-- Compare the velocity with a reference sample refreshed every 0.15 s
local refTime, refVelocity = 0, nil
local ready = true
RunService.Heartbeat:Connect(function()
	if seat and not seat.Occupant then
		refVelocity = nil -- parked: nothing to check
		return
	end
	local now = os.clock()
	local velocity = body.AssemblyLinearVelocity
	if not refVelocity then
		refTime, refVelocity = now, velocity
		return
	end
	local change = (velocity - refVelocity).Magnitude
	if now - refTime >= 0.15 then
		refTime, refVelocity = now, velocity
	end
	if ready and change >= IMPACT_SPEED then
		ready = false
		refTime, refVelocity = now, velocity
		control.play(DURATION)
		task.delay(math.max(COOLDOWN, 0.1), function()
			ready = true
		end)
	end
end)
`;
  }

  function characterSource(effect) {
    const t = effect.trigger;
    return `${marker(effect)}
-- Particly character effect: put this Script in StarterPlayer > StarterCharacterScripts.
-- Every player's character gets the effect, attached to their ${t.attachTo}.
-- Turn it off/on from the server: character.${U.safeName(effect.name)}Control (BoolValue)
local ATTACH_TO = ${lStr(t.attachTo)}
local LOOP_SECONDS = ${f(effect.burstLoop)}
local HAS_BURSTS = ${hasBurst(effect) ? 'true' : 'false'}

local character = script.Parent
local target = character:WaitForChild(ATTACH_TO, 10) or character:WaitForChild("HumanoidRootPart", 10)
if not target then
	return
end

local emitters = {}
for _, template in ipairs(script:WaitForChild("Emitters"):GetChildren()) do
	local copy = template:Clone()
	copy.Parent = target
	if copy:IsA("ParticleEmitter") then
		table.insert(emitters, copy)
	end
	for _, item in ipairs(copy:GetDescendants()) do
		if item:IsA("ParticleEmitter") then
			table.insert(emitters, item)
		end
	end
end

local control = require(script:WaitForChild("ParticlyControl")).new(emitters)

local toggle = Instance.new("BoolValue")
toggle.Name = ${lStr(U.safeName(effect.name) + 'Control')}
toggle.Value = true
toggle.Parent = character
toggle.Changed:Connect(function(on)
	if on then
		control.start()
	else
		control.stop()
	end
end)

control.start()
while HAS_BURSTS and character.Parent do
	task.wait(LOOP_SECONDS)
	if toggle.Value then
		control.burst()
	end
end
`;
  }

  /** Scripts that go inside the effect container: [{cls, name, source, runContext?}] */
  function containerScripts(effect) {
    const list = [{ cls: 'ModuleScript', name: 'ParticlyControl', source: controlSource(effect) }];
    const m = effect.trigger.mode;
    if (m === 'always' && hasBurst(effect)) list.push({ cls: 'Script', name: 'ParticlyTrigger', source: alwaysSource(effect) });
    if (m === 'touch') list.push({ cls: 'Script', name: 'ParticlyTrigger', source: touchSource(effect) });
    if (m === 'prompt') list.push({ cls: 'Script', name: 'ParticlyTrigger', source: promptSource(effect) });
    if (m === 'vehicle') {
      list.push({ cls: 'Script', name: 'ParticlyTrigger', source: vehicleServerSource(effect) });
      list.push({ cls: 'Script', name: 'ParticlyBoostClient', source: vehicleClientSource(effect), runContext: 'Client' });
    }
    if (m === 'speed') {
      list.push({ cls: 'Script', name: 'ParticlyTrigger', source: speedServerSource(effect) });
      list.push({ cls: 'Script', name: 'ParticlySpeedFx', source: speedClientSource(effect), runContext: 'Client' });
    }
    if (m === 'impact') list.push({ cls: 'Script', name: 'ParticlyTrigger', source: impactSource(effect) });
    return list;
  }

  /** Short how-to for the export dialog. */
  function instructions(effect) {
    const t = effect.trigger;
    switch (t.mode) {
      case 'vehicle': return [
        'Drag the .rbxmx into your car model in the Explorer (the model that contains the VehicleSeat).',
        'Move the effect Part to the exhaust pipe and rotate it so its Back face (blue arrow when using Move, +Z) points out of the pipe. It welds itself to the car when the game starts.',
        'Twin exhausts: duplicate the Part (Ctrl+D) and move the copy to the other pipe — both boost together.',
        `Play: sit in the driver seat and ${t.toggle ? 'press' : 'hold'} ${t.key} (gamepad ${GAMEPAD_FOR_KEY[t.key]}, mobile "${t.buttonText}" button)${t.toggle ? ' to switch it on/off' : ''}.`,
        ...(effect.underglow && effect.underglow.enabled ? ['Car neon: put the Part flat under the car (X = car width, Z = car length), just above the road. The glow is on its Top face and a light shines down onto the road.'] : []),
      ];
      case 'speed': return [
        'Drag the .rbxmx into your car model (the model that contains the VehicleSeat) and move the Part where the effect belongs: exhaust, wheel, roof, bumper… It welds itself to the nearest car part.',
        t.measure === 'drift' ? `It shows while the car slides sideways faster than ${U.fmt(t.minSpeed)} studs/s and is strongest at ${U.fmt(t.maxSpeed)}.` : `It switches on above ${U.fmt(t.minSpeed)} studs/s and is strongest at ${U.fmt(t.maxSpeed)} studs/s${hasBurst(effect) ? ' — burst layers fire when that top speed is reached' : ''}.`,
        'Wheel effects: put the Part on the wheel itself so it spins with it (rim sparks fling off the tyre).',
      ];
      case 'impact': return [
        'Drag the .rbxmx into your car model and move the Part to the front bumper (or wherever sparks should fly). It welds itself to the car.',
        `A sudden speed change of ${U.fmt(t.impact)} studs/s plays the effect for ${U.fmt(t.duration)}s (cooldown ${U.fmt(t.cooldown)}s). Lower the number for more sensitive crashes.`,
      ];
      case 'touch': return ['Drag the .rbxmx into Workspace and move/resize the Part where players should touch it (it is invisible).', t.keepOn ? `It glows all the time; each touch fires the burst layers (cooldown ${U.fmt(t.cooldown)}s).` : `Each touch plays the effect for ${U.fmt(t.duration)}s (cooldown ${U.fmt(t.cooldown)}s).`];
      case 'prompt': return ['Drag the .rbxmx into Workspace and place the Part on your chest / button / shrine.', t.keepOn ? `It runs all the time; "${t.actionText}" fires the burst layers.` : `Players see "${t.actionText}" and the effect plays for ${U.fmt(t.duration)}s.`];
      case 'character': return ['Drag the .rbxmx onto StarterPlayer › StarterCharacterScripts in the Explorer.', `Press Play: every character gets the effect on its ${t.attachTo}. Server scripts can set character.${U.safeName(effect.name)}Control.Value = false to hide it.`];
      case 'script': return ['Drag the .rbxmx into Workspace (or put the Part where you need it).', 'From a server Script: require(part.ParticlyControl).play(2) — or .start(), .stop(), .burst().'];
      default: return ['Drag the .rbxmx into the Studio 3D view — or right-click Workspace › Insert from File…', 'Move/resize the invisible Part where you want the effect.'];
    }
  }

  return { normalize, containerScripts, characterSource, CONTROL_SOURCE, startsEnabled, needsTrigger, hasBurst, instructions, marker, autoWelds, shopSlot };
})();
