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
  touch: { label: 'Play when touched', help: 'Plays when a player — or a car someone is driving — touches the part (pickups, boost pads, puddles, traps, checkpoints).' },
  prompt: { label: 'Play from a ProximityPrompt', help: 'Shows an interaction prompt ("Press E"); plays when used (chests, buttons, shrines).' },
  character: { label: 'Attach to every player\'s character', help: 'Auras, trails and footstep dust. Export goes into StarterPlayer › StarterCharacterScripts.' },
  script: { label: 'Controlled by my scripts', help: 'Starts off. From any server Script: require(effect.ParticlyControl).play(2) — or .start(), .stop(), .burst().' },
};
const BOOST_KEYS = ['LeftShift', 'RightShift', 'LeftControl', 'Q', 'E', 'F', 'R', 'B', 'N', 'X', 'Z', 'Space'];
const ATTACH_POINTS = ['HumanoidRootPart', 'Head', 'UpperTorso', 'LowerTorso'];

const TRIGGER_DEFAULTS = { mode: 'always', key: 'LeftShift', buttonText: 'BOOST', maxSeconds: 0, duration: 2, cooldown: 1, actionText: 'Activate', attachTo: 'HumanoidRootPart' };
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
      maxSeconds: num(t.maxSeconds, d.maxSeconds, 0, 600),
      duration: num(t.duration, d.duration, 0.05, 600),
      cooldown: num(t.cooldown, d.cooldown, 0, 600),
      actionText: String(t.actionText || d.actionText).slice(0, 40),
      attachTo: ATTACH_POINTS.includes(t.attachTo) ? t.attachTo : d.attachTo,
    };
  }

  /** Machine-readable header so Particly can re-import the behaviour from exported scripts. */
  const marker = (effect) => `--@particly ${JSON.stringify({ ...effect.trigger, burstLoop: effect.burstLoop, name: effect.name, partSize: effect.partSize })}`;
  const controlSource = (effect) => `${marker(effect)}\n${CONTROL_SOURCE}`;

  const hasBurst = (effect) => effect.layers.some((l) => !l.hidden && l.mode === 'burst');
  /** Continuous emitters start enabled only for "always" (and inside character templates). */
  const startsEnabled = (effect) => effect.trigger.mode === 'always' || effect.trigger.mode === 'character';
  /** Does the container need a ParticlyTrigger script? */
  const needsTrigger = (effect) => {
    const m = effect.trigger.mode;
    return m === 'touch' || m === 'prompt' || m === 'vehicle' || (m === 'always' && hasBurst(effect));
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
		control.play(DURATION)
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

local control = require(script.Parent:WaitForChild("ParticlyControl"))

local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = ACTION_TEXT
prompt.ObjectText = ${lStr(effect.name)}
prompt.MaxActivationDistance = 12
prompt.RequiresLineOfSight = false
prompt.Parent = script.Parent

prompt.Triggered:Connect(function()
	prompt.Enabled = false
	control.play(DURATION)
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
local holder = script.Parent
if holder:IsA("BasePart") and holder:GetAttribute("ParticlyAutoWeld") == 1 and holder.Anchored then
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
end

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

UserInputService.InputBegan:Connect(function(input, processed)
	if not processed and BOOST_KEYS[input.KeyCode] and isDriving() then
		setBoost(true)
	end
end)
UserInputService.InputEnded:Connect(function(input)
	if BOOST_KEYS[input.KeyCode] then
		setBoost(false)
	end
end)

local function onBoostButton(_, state)
	if state == Enum.UserInputState.Begin then
		setBoost(true)
	elseif state == Enum.UserInputState.End or state == Enum.UserInputState.Cancel then
		setBoost(false)
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
        `Play: sit in the driver seat and hold ${t.key} (gamepad ${GAMEPAD_FOR_KEY[t.key]}, mobile "${t.buttonText}" button).`,
      ];
      case 'touch': return ['Drag the .rbxmx into Workspace and move/resize the Part where players should touch it (it is invisible).', `Each touch plays the effect for ${U.fmt(t.duration)}s (cooldown ${U.fmt(t.cooldown)}s).`];
      case 'prompt': return ['Drag the .rbxmx into Workspace and place the Part on your chest / button / shrine.', `Players see "${t.actionText}" and the effect plays for ${U.fmt(t.duration)}s.`];
      case 'character': return ['Drag the .rbxmx onto StarterPlayer › StarterCharacterScripts in the Explorer.', `Press Play: every character gets the effect on its ${t.attachTo}. Server scripts can set character.${U.safeName(effect.name)}Control.Value = false to hide it.`];
      case 'script': return ['Drag the .rbxmx into Workspace (or put the Part where you need it).', 'From a server Script: require(part.ParticlyControl).play(2) — or .start(), .stop(), .burst().'];
      default: return ['Drag the .rbxmx into the Studio 3D view — or right-click Workspace › Insert from File…', 'Move/resize the invisible Part where you want the effect.'];
    }
  }

  return { normalize, containerScripts, characterSource, CONTROL_SOURCE, startsEnabled, needsTrigger, hasBurst, instructions, marker };
})();
