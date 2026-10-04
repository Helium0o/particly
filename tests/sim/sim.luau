-- Minimal Roblox runtime simulation to exercise Particly's generated scripts.
local SIM = {}
local now = 0
local timers = {}
local LOG = {}
local function log(...) table.insert(LOG, table.concat({ ... }, " ")) end

------------------------------------------------------------------ scheduler
local function schedule(t, co, ...)
	table.insert(timers, { at = now + (t or 0), co = co, args = table.pack(...) })
end
local function resume(co, ...)
	local ok, err = coroutine.resume(co, ...)
	if not ok then
		error("script error: " .. tostring(err) .. "\n" .. debug.traceback(co), 0)
	end
end
task = {
	wait = function(t)
		local co = coroutine.running()
		schedule(t or 0, co)
		coroutine.yield()
		return t
	end,
	delay = function(t, fn, ...)
		schedule(t, coroutine.create(fn), ...)
	end,
	spawn = function(fn, ...)
		resume(coroutine.create(fn), ...)
	end,
}
function SIM.advance(dt)
	local target = now + dt
	while true do
		table.sort(timers, function(a, b) return a.at < b.at end)
		local nxt = timers[1]
		if not nxt or nxt.at > target then break end
		table.remove(timers, 1)
		now = nxt.at
		resume(nxt.co, table.unpack(nxt.args, 1, nxt.args.n))
	end
	now = target
end
local realOs = os
os = setmetatable({ clock = function() return now end }, { __index = realOs })

------------------------------------------------------------------ signals
local function Signal()
	local s = { handlers = {} }
	function s:Connect(fn)
		table.insert(self.handlers, fn)
		return { Disconnect = function() end }
	end
	function s:Fire(...)
		for _, fn in ipairs(self.handlers) do task.spawn(fn, ...) end
	end
	return s
end

------------------------------------------------------------------ datatypes
local V3 = {}
V3.__index = V3
local function v3(x, y, z) return setmetatable({ X = x or 0, Y = y or 0, Z = z or 0, __type = "Vector3" }, V3) end
V3.__add = function(a, b) return v3(a.X + b.X, a.Y + b.Y, a.Z + b.Z) end
V3.__sub = function(a, b) return v3(a.X - b.X, a.Y - b.Y, a.Z - b.Z) end
V3.__mul = function(a, b) if type(a) == "number" then a, b = b, a end return v3(a.X * b, a.Y * b, a.Z * b) end
V3.Dot = function(a, b) return a.X * b.X + a.Y * b.Y + a.Z * b.Z end
V3.__index = function(t, k)
	if k == "Magnitude" then return math.sqrt(t.X * t.X + t.Y * t.Y + t.Z * t.Z) end
	return rawget(V3, k)
end
Vector3 = { new = v3, zero = v3(0, 0, 0) }
Vector2 = { new = function(x, y) return { X = x, Y = y, __type = "Vector2" } end }
SIM.v3 = v3
local function typed(t, fields) fields.__type = t return fields end
local C3 = {}
C3.__index = C3
local function c3(r, g, b) return setmetatable({ R = r, G = g, B = b, __type = "Color3" }, C3) end
function C3:ToHSV()
	local r, g, b = self.R, self.G, self.B
	local max, min = math.max(r, g, b), math.min(r, g, b)
	local d = max - min
	local h = 0
	if d > 0 then
		if max == r then h = ((g - b) / d) % 6 elseif max == g then h = (b - r) / d + 2 else h = (r - g) / d + 4 end
		h /= 6
	end
	return h, (max > 0 and d / max or 0), max
end
function C3:ToHex() return string.format("%02X%02X%02X", math.floor(self.R * 255 + 0.5), math.floor(self.G * 255 + 0.5), math.floor(self.B * 255 + 0.5)) end
function C3:Lerp(o, t) return c3(self.R + (o.R - self.R) * t, self.G + (o.G - self.G) * t, self.B + (o.B - self.B) * t) end
Color3 = { new = function(r, g, b) return c3(r or 0, g or 0, b or 0) end,
	fromRGB = function(r, g, b) return c3(r / 255, g / 255, b / 255) end,
	fromHex = function(h) h = h:gsub("#", "") return c3(tonumber(h:sub(1, 2), 16) / 255, tonumber(h:sub(3, 4), 16) / 255, tonumber(h:sub(5, 6), 16) / 255) end }
ColorSequenceKeypoint = { new = function(t, c) return typed("CSK", { Time = t, Value = c }) end }
NumberSequenceKeypoint = { new = function(t, v, e) return typed("NSK", { Time = t, Value = v, Envelope = e or 0 }) end }
ColorSequence = { new = function(a, b)
	local kp = type(a) == "table" and rawget(a, "__type") == nil and a or { ColorSequenceKeypoint.new(0, a), ColorSequenceKeypoint.new(1, b or a) }
	assert(#kp >= 2 and kp[1].Time == 0 and kp[#kp].Time == 1, "bad ColorSequence keypoints")
	return typed("ColorSequence", { a = a, Keypoints = kp })
end }
NumberSequence = { new = function(a, b)
	local kp = type(a) == "table" and a or { NumberSequenceKeypoint.new(0, a), NumberSequenceKeypoint.new(1, b or a) }
	assert(#kp >= 2 and kp[1].Time == 0 and kp[#kp].Time == 1, "bad NumberSequence keypoints")
	return typed("NumberSequence", { a = a, Keypoints = kp })
end }
NumberRange = { new = function(a, b) return typed("NumberRange", { Min = a, Max = b or a }) end }
CFrame = { new = function(p) return typed("CFrame", { Position = p or v3(), LookVector = v3(0, 0, -1), RightVector = v3(1, 0, 0) }) end }
UDim = { new = function(s, o) return typed("UDim", { Scale = s, Offset = o }) end }
UDim2 = { new = function(xs, xo, ys, yo) return typed("UDim2", { X = UDim.new(xs, xo), Y = UDim.new(ys, yo) }) end,
	fromScale = function(x, y) return typed("UDim2", { X = UDim.new(x, 0), Y = UDim.new(y, 0) }) end,
	fromOffset = function(x, y) return typed("UDim2", { X = UDim.new(0, x), Y = UDim.new(0, y) }) end }
Color3.fromHSV = function(h, s, v)
	assert(h == h and s == s and v == v, "NaN in fromHSV")
	h = (h % 1) * 6
	local i, f = math.floor(h), h - math.floor(h)
	local p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
	local row = ({ { v, t, p }, { q, v, p }, { p, v, t }, { p, q, v }, { t, p, v }, { v, p, q } })[i + 1]
	return c3(row[1], row[2], row[3])
end
local enumCache = {}
Enum = setmetatable({}, { __index = function(_, enumType)
	enumCache[enumType] = enumCache[enumType] or setmetatable({}, { __index = function(t, item)
		local v = typed("EnumItem", { Name = item, EnumType = enumType })
		rawset(t, item, v)
		return v
	end })
	return enumCache[enumType]
end })
typeof = function(v) if type(v) == "table" and rawget(v, "__props") then return "Instance" end if type(v) == "table" and rawget(v, "__type") then return v.__type end return type(v) end

------------------------------------------------------------------ instances
local CLASS_PARENTS = { Part = "BasePart", VehicleSeat = "BasePart", Workspace = "Model", BasePart = "Instance", Model = "Instance",
	SurfaceLight = "Light", PointLight = "Light", Frame = "GuiObject", TextButton = "GuiObject", TextLabel = "GuiObject", ImageLabel = "GuiObject" }
local ALL = {}
local Instance_ = {}
local function isA(class, want)
	while class do
		if class == want then return true end
		class = CLASS_PARENTS[class]
	end
	return want == "Instance"
end

local function newInstance(class)
	local props = { Name = class, ClassName = class, Enabled = class == "ParticleEmitter" and true or nil, Anchored = false, Position = v3() }
	local attrs, children, propSignals, attrSignals = {}, {}, {}, {}
	local obj
	local function propSignal(k)
		propSignals[k] = propSignals[k] or Signal()
		return propSignals[k]
	end
	local methods = {}
	function methods:IsA(c) return isA(class, c) end
	function methods:GetChildren() return table.clone(children) end
	function methods:GetDescendants()
		local out = {}
		local function walk(i) for _, c in ipairs(i:GetChildren()) do table.insert(out, c) walk(c) end end
		walk(obj)
		return out
	end
	function methods:FindFirstChild(n) for _, c in ipairs(children) do if c.Name == n then return c end end return nil end
	function methods:WaitForChild(n, timeout)
		local waited = 0
		while true do
			local c = obj:FindFirstChild(n)
			if c then return c end
			if timeout and waited >= timeout then return nil end
			if waited > 30 then error("infinite yield on " .. n) end
			task.wait(0.1)
			waited += 0.1
		end
	end
	function methods:FindFirstChildWhichIsA(c, recursive)
		for _, ch in ipairs(recursive and obj:GetDescendants() or children) do if ch:IsA(c) then return ch end end
		return nil
	end
	function methods:FindFirstChildOfClass(c) for _, ch in ipairs(children) do if ch.ClassName == c then return ch end end return nil end
	function methods:FindFirstAncestorWhichIsA(c)
		local p = props.Parent
		while p do if p:IsA(c) then return p end p = p.Parent end
		return nil
	end
	function methods:FindFirstAncestorOfClass(c)
		local p = props.Parent
		while p do if p.ClassName == c then return p end p = p.Parent end
		return nil
	end
	function methods:GetAttribute(k) return attrs[k] end
	function methods:SetAttribute(k, v)
		local old = attrs[k]
		attrs[k] = v
		if old ~= v and attrSignals[k] then attrSignals[k]:Fire() end
	end
	function methods:GetAttributeChangedSignal(k) attrSignals[k] = attrSignals[k] or Signal() return attrSignals[k] end
	function methods:GetPropertyChangedSignal(k) return propSignal(k) end
	function methods:Emit(n) assert(class == "ParticleEmitter") props.__emitted = (props.__emitted or 0) + n end
	function methods:GetDebugId() return tostring(obj) end
	function methods:Clone()
		local c = newInstance(class)
		for k, v in pairs(props) do if k ~= "Parent" and k ~= "__children" then rawset(c.__props, k, v) end end
		for k, v in pairs(attrs) do c:SetAttribute(k, v) end
		for _, ch in ipairs(children) do ch:Clone().Parent = c end
		return c
	end
	function methods:FireServer(...) assert(class == "RemoteEvent") props.OnServerEvent:Fire(SIM.localPlayer, ...) end
	if class == "RemoteEvent" then props.OnServerEvent = Signal() end
	if class == "ProximityPrompt" then props.Triggered = Signal() props.Enabled = true end
	if isA(class, "BasePart") then props.Touched = Signal() props.CanTouch = true props.AssemblyLinearVelocity = v3() props.CFrame = CFrame.new() end
	props.DescendantAdded = Signal()
	if class == "Player" then props.CharacterAdded = Signal() end
	if isA(class, "GuiObject") then props.Position = UDim2.new(0, 0, 0, 0) props.Size = UDim2.new(0, 0, 0, 0) props.InputBegan = Signal() props.AbsolutePosition = Vector2.new(100, 100) props.AbsoluteSize = Vector2.new(268, 22) end
	if class == "TextButton" then props.Activated = Signal() end
	if class == "BoolValue" then props.Changed = Signal() props.Value = false end
	obj = setmetatable({ __props = props, __children = children }, {
		__index = function(_, k)
			if methods[k] then return methods[k] end
			if k == "Parent" then return props.Parent end
			local v = props[k]
			if v == nil and k ~= "Occupant" and k ~= "__emitted" and k ~= "Source" and k ~= "RunContext" then
				local c = obj:FindFirstChild(k)
				if c then return c end
			end
			return v
		end,
		__newindex = function(_, k, v)
			if k == "Parent" then
				local old = props.Parent
				if old then
					local list = old.__children
					for i, c in ipairs(list) do if c == obj then table.remove(list, i) break end end
				end
				props.Parent = v
				if v then
					table.insert(v.__children, obj)
					local a = v
					while a do
						local sig = rawget(a, "__props").DescendantAdded
						if sig then sig:Fire(obj) end
						a = a.Parent
					end
				end
				return
			end
			local old = props[k]
			props[k] = v
			if old ~= v then
				if propSignals[k] then propSignals[k]:Fire() end
				if k == "Value" and class == "BoolValue" then props.Changed:Fire(v) end
			end
		end,
		__tostring = function() return class .. ":" .. tostring(props.Name) end,
	})
	table.insert(ALL, obj)
	return obj
end
Instance = { new = function(class, parent) local i = newInstance(class) if parent then i.Parent = parent end return i end }
SIM.new = Instance.new

------------------------------------------------------------------ services
workspace = newInstance("Workspace")
workspace.Name = "Workspace"
workspace.CurrentCamera = { CFrame = CFrame.new(v3(0, 10, 0)), ViewportSize = Vector2.new(1280, 720) }
local StarterPlayer = newInstance("StarterPlayer")
local scs = newInstance("Folder") scs.Name = "StarterCharacterScripts" scs.Parent = StarterPlayer

local players = {}
SIM.playersFolder = newInstance("Folder") SIM.playersFolder.Name = "Players"
local Players = { GetPlayerFromCharacter = function(_, char)
	for _, p in ipairs(players) do if p.Character == char then return p end end
	return nil
end, PlayerAdded = Signal(), PlayerRemoving = Signal(), GetPlayers = function() return table.clone(players) end }
function SIM.newPlayer(name)
	local p = newInstance("Player")
	p.Name = name
	local char = newInstance("Model") char.Name = name
	local hum = newInstance("Humanoid") hum.Parent = char
	local hrp = newInstance("Part") hrp.Name = "HumanoidRootPart" hrp.Parent = char
	local head = newInstance("Part") head.Name = "Head" head.Parent = char
	p.Character = char
	local pg = newInstance("PlayerGui") pg.Name = "PlayerGui" pg.Parent = p
	p.Parent = SIM.playersFolder
	p.UserId = #players + 1000
	table.insert(players, p)
	return p, char, hum
end
local UIS = { InputBegan = Signal(), InputEnded = Signal(), InputChanged = Signal() }
local CAS = { bound = {} }
function CAS:BindAction(n, fn, touch) self.bound[n] = fn end
function CAS:UnbindAction(n) self.bound[n] = nil end
function CAS:SetTitle() end
SIM.UIS, SIM.CAS, SIM.Players = UIS, CAS, Players
local SelectionList = {}
local RunService = { RenderStepped = Signal(), Heartbeat = Signal(), IsClient = function() return true end }
local ReplicatedStorage = newInstance("ReplicatedStorage") ReplicatedStorage.Name = "ReplicatedStorage"
local DATA = {} -- DataStore contents: name -> key -> value
SIM.DATA = DATA
SIM.closeHandlers = {}
local DataStoreService = { GetDataStore = function(_, name)
	DATA[name] = DATA[name] or {}
	local d = DATA[name]
	return {
		GetAsync = function(_, k) task.wait(0.05) return d[k] end,
		SetAsync = function(_, k, v, ids) task.wait(0.05) assert(type(ids) == "table", "userIds") d[k] = v end,
	}
end }
SIM.RunService = RunService
local services = {
	RunService = RunService, ReplicatedStorage = ReplicatedStorage, DataStoreService = DataStoreService,
	Players = Players, UserInputService = UIS, ContextActionService = CAS, StarterPlayer = StarterPlayer,
	Debris = { AddItem = function() end },
	ChangeHistoryService = { TryBeginRecording = function() return "rec" end, FinishRecording = function() end },
	Selection = { Get = function() return SelectionList end, Set = function(_, s) SelectionList = s end },
}
game = { GetService = function(_, n) return assert(services[n], "service " .. n) end,
	BindToClose = function(_, fn) table.insert(SIM.closeHandlers, fn) end }
function SIM.select(list) SelectionList = list end
function SIM.selection() return SelectionList end
warn = function(...) log("WARN", ...) end
local realPrint = print
print = function(...) log("PRINT", ...) end

------------------------------------------------------------------ running scripts
local baseEnv = getfenv(1)
local function load(source, scriptInst, label)
	local fn, err = loadstring(source, label)
	assert(fn, err)
	setfenv(fn, setmetatable({ script = scriptInst }, { __index = baseEnv }))
	return fn
end
local moduleCache = {}
require = function(m)
	if moduleCache[m] ~= nil then return moduleCache[m] end
	local result = load(m.Source, m, m.Name)()
	moduleCache[m] = result
	return result
end
function SIM.runScript(s) task.spawn(load(s.Source, s, s.Name)) end
function SIM.runAll(root)
	for _, d in ipairs(root:GetDescendants()) do
		if d.ClassName == "Script" then SIM.runScript(d) end
	end
end
function SIM.runChunk(source, label) load(source, nil, label)() end
function SIM.emitters(root)
	local out = {}
	for _, d in ipairs(root:GetDescendants()) do if d.ClassName == "ParticleEmitter" then table.insert(out, d) end end
	return out
end
function SIM.state(root)
	local on, emitted = 0, 0
	for _, e in ipairs(SIM.emitters(root)) do
		if e.Enabled and not e:GetAttribute("EmitCount") then on += 1 end
		emitted += e.__emitted or 0
	end
	return on, emitted
end
SIM.log = LOG
SIM.print = realPrint
SIM.time = function() return now end
return SIM
