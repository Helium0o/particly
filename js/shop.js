'use strict';
/*
 * Particly colour shop: an in-game colour picker that lets players recolour effects tagged
 * with a colour-shop slot (Effect › In Roblox › Colour shop) and saves their choice.
 *
 * Exported as a Folder holding two scripts (drop it into Workspace):
 *   ColourShopServer  validates requests, saves colours in a DataStore, recolours the car
 *                     the player drives and their character
 *   ColourShopClient  (RunContext = Client) the picker UI: hue / saturation / brightness bars
 */

const Shop = (() => {
  const slotNames = () => Object.values(SHOP_SLOTS).filter((s) => s.id).map((s) => JSON.stringify(s.label)).join(', ');

  const SERVER_SOURCE = () => `--[[
	Particly colour shop (server). Players pick their own colours for effects that have a
	colour-shop slot (Particly › Effect › In Roblox › Colour shop). The choice is saved, and
	applied to the car a player drives (VehicleSeat) and to their own character.

	Owned cars: give a car model the attribute OwnerUserId (= player.UserId) when you spawn it
	and only its owner's colours are applied. Cars without it take the driver's colours.
	Several cars inside one model (e.g. a "Vehicles" model)? Each car is found on its own, or
	give each car model the attribute ParticlyVehicle = true.

	To test saving in Studio: Game Settings › Security › Enable Studio Access to API Services.
]]
local SLOTS = { ${slotNames()} } -- slot ids 1, 2, 3… (match Particly)
local DATASTORE_NAME = "ParticlyColours"
local AUTOSAVE_SECONDS = 120

-- Optional: return false to refuse a change (e.g. require a game pass or in-game cash).
local function canChange(player: Player, slot: number, color: Color3): boolean
	return true
end

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local remote = ReplicatedStorage:FindFirstChild("ParticlyColourRemote")
if not remote then
	remote = Instance.new("RemoteEvent")
	remote.Name = "ParticlyColourRemote"
	remote.Parent = ReplicatedStorage
end

local store = nil
local storeOk = pcall(function()
	store = DataStoreService:GetDataStore(DATASTORE_NAME)
end)
if not storeOk then
	warn("[Particly] Colour shop: DataStores are unavailable, colours will not be saved")
end

local function attributeName(slot: number): string
	return "ParticlyColour_" .. slot
end

------------------------------------------------------------------ recolouring

local originals = setmetatable({}, { __mode = "k" }) -- emitter -> its original ColorSequence

-- New hue for a ColorSequence: white-hot cores stay white, coloured parts take the new
-- colour, and all-grey sequences (smoke) are tinted completely.
local function tint(sequence: ColorSequence, color: Color3): ColorSequence
	local hue, saturation, value = color:ToHSV()
	local maxSaturation = 0
	for _, point in ipairs(sequence.Keypoints) do
		local _, s = point.Value:ToHSV()
		maxSaturation = math.max(maxSaturation, s)
	end
	local points = {}
	for _, point in ipairs(sequence.Keypoints) do
		local _, s, v = point.Value:ToHSV()
		local keep = if maxSaturation < 0.15 then 1 else s / maxSaturation
		table.insert(points, ColorSequenceKeypoint.new(point.Time, Color3.fromHSV(hue, saturation * keep, v * math.max(value, 0.05))))
	end
	return ColorSequence.new(points)
end

local function recolour(item: Instance, color: Color3)
	if item:IsA("ParticleEmitter") then
		if not originals[item] then
			originals[item] = item.Color
		end
		item.Color = tint(originals[item], color)
	elseif item:IsA("SurfaceGui") then
		item:SetAttribute("ParticlyNeonColor", color) -- read by the neon animation script
		for _, child in ipairs(item:GetDescendants()) do
			if child:IsA("Frame") then
				child.BackgroundColor3 = color
			elseif child:IsA("UIStroke") then
				child.Color = color
			elseif child:IsA("ImageLabel") then
				child.ImageColor3 = color
			end
		end
	elseif item:IsA("Light") then
		item.Color = color
	end
end

local function recolourTagged(item: Instance, player: Player)
	local slot = item:GetAttribute("ParticlyShop")
	if slot then
		local color = player:GetAttribute(attributeName(slot))
		if typeof(color) == "Color3" then
			recolour(item, color)
		end
	end
end

local function recolourIn(root: Instance, player: Player)
	for _, item in ipairs(root:GetDescendants()) do
		recolourTagged(item, player)
	end
end

local function seatCount(model: Instance): number
	local n = 0
	for _, item in ipairs(model:GetDescendants()) do
		if item:IsA("VehicleSeat") then
			n += 1
			if n > 1 then
				break
			end
		end
	end
	return n
end

-- The whole car: the largest model around the seat that holds no other VehicleSeat
-- (so a map or "Vehicles" model full of cars is never treated as one car)
local vehicles = setmetatable({}, { __mode = "k" }) -- seat -> car model (cache)
local function vehicleOf(seat: Instance): Instance?
	if vehicles[seat] and vehicles[seat].Parent then
		return vehicles[seat]
	end
	local model = seat:FindFirstAncestorWhichIsA("Model")
	while model and not model:GetAttribute("ParticlyVehicle") do
		local outer = model:FindFirstAncestorWhichIsA("Model")
		if not outer or outer == workspace or seatCount(outer) > 1 then
			break
		end
		model = outer
	end
	vehicles[seat] = model
	return model
end

local function refresh(player: Player)
	local character = player.Character
	if not character then
		return
	end
	recolourIn(character, player)
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	local seat = humanoid and humanoid.SeatPart
	if seat and seat:IsA("VehicleSeat") then
		local vehicle = vehicleOf(seat)
		local owner = vehicle and vehicle:GetAttribute("OwnerUserId")
		if vehicle and (owner == nil or owner == player.UserId) then
			recolourIn(vehicle, player)
		end
	end
end

------------------------------------------------------------------ saving

local loaded = {} -- only save players whose colours loaded (never overwrite good data)
local dirty = {}

-- DataStore call with 3 tries (requests can fail when the service is busy)
local function try(fn)
	local ok, result
	for attempt = 1, 3 do
		ok, result = pcall(fn)
		if ok then
			break
		end
		task.wait(attempt * 2)
	end
	return ok, result
end

local function load(player: Player)
	if not store then
		return
	end
	local ok, data = try(function()
		return store:GetAsync("player_" .. player.UserId)
	end)
	if not player.Parent then
		return -- left while loading
	end
	if not ok then
		warn("[Particly] Could not load colours for " .. player.Name .. ": " .. tostring(data))
		return
	end
	loaded[player] = true
	if type(data) ~= "table" then
		return
	end
	for slot = 1, #SLOTS do
		local hex = data[tostring(slot)]
		local name = attributeName(slot)
		if type(hex) == "string" and hex:match("^%x%x%x%x%x%x$") and player:GetAttribute(name) == nil then
			player:SetAttribute(name, Color3.fromHex(hex))
		end
	end
end

local function save(player: Player)
	if not (store and loaded[player] and dirty[player]) then
		return
	end
	local data = {}
	for slot = 1, #SLOTS do
		local color = player:GetAttribute(attributeName(slot))
		if typeof(color) == "Color3" then
			data[tostring(slot)] = color:ToHex()
		end
	end
	dirty[player] = nil
	local ok, err = try(function()
		store:SetAsync("player_" .. player.UserId, data, { player.UserId })
	end)
	if not ok then
		dirty[player] = true
		warn("[Particly] Could not save colours for " .. player.Name .. ": " .. tostring(err))
	end
end

------------------------------------------------------------------ requests

local lastChange = {}
remote.OnServerEvent:Connect(function(player, slot, color)
	if typeof(slot) ~= "number" or slot % 1 ~= 0 or not SLOTS[slot] or typeof(color) ~= "Color3" then
		return
	end
	if color.R ~= color.R or color.G ~= color.G or color.B ~= color.B then
		return -- NaN
	end
	local now = os.clock()
	if lastChange[player] and now - lastChange[player] < 0.25 then
		return
	end
	lastChange[player] = now
	color = Color3.new(math.clamp(color.R, 0, 1), math.clamp(color.G, 0, 1), math.clamp(color.B, 0, 1))
	if not canChange(player, slot, color) then
		return
	end
	player:SetAttribute(attributeName(slot), color)
	dirty[player] = true
	refresh(player)
end)

local function onCharacter(player: Player, character: Model)
	character.DescendantAdded:Connect(function(item)
		recolourTagged(item, player) -- effects attached to the character later
	end)
	local humanoid = character:WaitForChild("Humanoid", 10)
	if humanoid then
		humanoid:GetPropertyChangedSignal("SeatPart"):Connect(function()
			refresh(player)
		end)
	end
	refresh(player)
end

local function onPlayer(player: Player)
	player.CharacterAdded:Connect(function(character)
		onCharacter(player, character)
	end)
	if player.Character then
		task.spawn(onCharacter, player, player.Character)
	end
	load(player)
	refresh(player)
end

Players.PlayerAdded:Connect(onPlayer)
for _, player in ipairs(Players:GetPlayers()) do
	task.spawn(onPlayer, player)
end

Players.PlayerRemoving:Connect(function(player)
	save(player)
	loaded[player] = nil
	dirty[player] = nil
	lastChange[player] = nil
end)

game:BindToClose(function()
	local pending = 0
	for _, player in ipairs(Players:GetPlayers()) do
		pending += 1
		task.spawn(function()
			save(player)
			pending -= 1
		end)
	end
	local started = os.clock()
	while pending > 0 and os.clock() - started < 25 do
		task.wait(0.1)
	end
end)

task.spawn(function()
	while true do
		task.wait(AUTOSAVE_SECONDS)
		for _, player in ipairs(Players:GetPlayers()) do
			task.spawn(save, player)
		end
	end
end)
`;

  const SWATCHES = ['#3a8dff', '#00e5ff', '#39ff6a', '#ffd23a', '#ff7a1a', '#ff1a1a', '#ff3cf0', '#a040ff', '#ffffff', '#202020'];
  const lHex = (h) => `Color3.fromHex("${h.slice(1)}")`;

  const CLIENT_SOURCE = () => `--[[
	Particly colour shop (client, RunContext = Client): the colour picker UI.
	A "Colours" button opens a panel with hue / saturation / brightness bars, presets and
	an Apply button. The server (ColourShopServer) checks and saves the choice.
]]
local SLOTS = { ${slotNames()} } -- must match the server script
local SHOW_SLOTS = { 1, 2, 3, 4 } -- remove slots your game does not use
local BUTTON_TEXT = "Colours"
local SWATCHES = { ${SWATCHES.map(lHex).join(', ')} }

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local remote = ReplicatedStorage:WaitForChild("ParticlyColourRemote")

local function make(class, props, parent)
	local item = Instance.new(class)
	for key, value in pairs(props) do
		item[key] = value
	end
	item.Parent = parent
	return item
end
local function round(item, radius)
	make("UICorner", { CornerRadius = UDim.new(0, radius or 8) }, item)
	return item
end

local DARK = Color3.fromRGB(24, 26, 34)
local MID = Color3.fromRGB(44, 48, 62)
local TEXT = Color3.fromRGB(235, 238, 245)

local gui = make("ScreenGui", { Name = "ParticlyColourShop", ResetOnSpawn = false, IgnoreGuiInset = true, ZIndexBehavior = Enum.ZIndexBehavior.Sibling }, player:WaitForChild("PlayerGui"))

local openButton = round(make("TextButton", {
	Name = "Open", Text = BUTTON_TEXT, Font = Enum.Font.GothamBold, TextSize = 16, TextColor3 = TEXT,
	BackgroundColor3 = DARK, BackgroundTransparency = 0.15, Size = UDim2.fromOffset(110, 40),
	AnchorPoint = Vector2.new(0, 1), Position = UDim2.new(0, 16, 1, -90),
}, gui))

local panel = round(make("Frame", {
	Name = "Panel", Visible = false, BackgroundColor3 = DARK, Size = UDim2.fromOffset(300, 336),
	AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5),
}, gui), 12)
make("UIStroke", { Color = MID, Thickness = 2 }, panel)
local scale = make("UIScale", {}, panel)
local function fit()
	local camera = workspace.CurrentCamera
	if camera then
		scale.Scale = math.min(1, (camera.ViewportSize.Y - 20) / 336, (camera.ViewportSize.X - 20) / 300)
	end
end

make("TextLabel", { Text = "Colours", Font = Enum.Font.GothamBold, TextSize = 20, TextColor3 = TEXT, BackgroundTransparency = 1,
	TextXAlignment = Enum.TextXAlignment.Left, Position = UDim2.fromOffset(16, 10), Size = UDim2.fromOffset(200, 28) }, panel)
local closeButton = round(make("TextButton", { Name = "Close", Text = "X", Font = Enum.Font.GothamBold, TextSize = 16, TextColor3 = TEXT,
	BackgroundColor3 = MID, Position = UDim2.new(1, -44, 0, 10), Size = UDim2.fromOffset(30, 30) }, panel))

-- slot tabs
local slot = SHOW_SLOTS[1]
local tabs = {}
local tabWidth = math.floor(268 / #SHOW_SLOTS)
for i, id in ipairs(SHOW_SLOTS) do
	tabs[id] = round(make("TextButton", { Name = "Slot" .. id, Text = SLOTS[id], Font = Enum.Font.Gotham, TextSize = 12, TextWrapped = true, TextColor3 = TEXT,
		BackgroundColor3 = MID, Position = UDim2.fromOffset(16 + (i - 1) * tabWidth, 48), Size = UDim2.fromOffset(tabWidth - 4, 32) }, panel), 6)
end

-- hue / saturation / brightness bars
local hue, saturation, value = 0.6, 0.8, 1
local function bar(y, label)
	make("TextLabel", { Text = label, Font = Enum.Font.Gotham, TextSize = 12, TextColor3 = TEXT, BackgroundTransparency = 1,
		TextXAlignment = Enum.TextXAlignment.Left, Position = UDim2.fromOffset(16, y), Size = UDim2.fromOffset(268, 14) }, panel)
	local frame = round(make("Frame", { BackgroundColor3 = Color3.new(1, 1, 1), Position = UDim2.fromOffset(16, y + 16), Size = UDim2.fromOffset(268, 22) }, panel), 6)
	local gradient = make("UIGradient", {}, frame)
	local knob = round(make("Frame", { BackgroundColor3 = Color3.new(1, 1, 1), AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0, 0.5), Size = UDim2.fromOffset(8, 28), ZIndex = 2 }, frame), 4)
	make("UIStroke", { Color = Color3.new(0, 0, 0), Thickness = 1.5 }, knob)
	return { frame = frame, gradient = gradient, knob = knob }
end
local bars = { hue = bar(90, "Colour"), saturation = bar(132, "Strength"), value = bar(174, "Brightness") }
bars.hue.gradient.Color = ColorSequence.new({
	ColorSequenceKeypoint.new(0, Color3.fromHSV(0, 1, 1)), ColorSequenceKeypoint.new(1 / 6, Color3.fromHSV(1 / 6, 1, 1)),
	ColorSequenceKeypoint.new(2 / 6, Color3.fromHSV(2 / 6, 1, 1)), ColorSequenceKeypoint.new(3 / 6, Color3.fromHSV(3 / 6, 1, 1)),
	ColorSequenceKeypoint.new(4 / 6, Color3.fromHSV(4 / 6, 1, 1)), ColorSequenceKeypoint.new(5 / 6, Color3.fromHSV(5 / 6, 1, 1)),
	ColorSequenceKeypoint.new(1, Color3.fromHSV(1, 1, 1)),
})

-- presets
local swatchButtons = {}
for i, color in ipairs(SWATCHES) do
	swatchButtons[i] = round(make("TextButton", { Text = "", BackgroundColor3 = color, AutoButtonColor = true,
		Position = UDim2.fromOffset(16 + (i - 1) * 27, 222), Size = UDim2.fromOffset(23, 23) }, panel), 5)
end

local preview = round(make("Frame", { Name = "Preview", Position = UDim2.fromOffset(16, 258), Size = UDim2.fromOffset(70, 42) }, panel))
make("UIStroke", { Color = MID, Thickness = 2 }, preview)
local applyButton = round(make("TextButton", { Name = "Apply", Text = "Apply", Font = Enum.Font.GothamBold, TextSize = 18, TextColor3 = Color3.new(1, 1, 1),
	BackgroundColor3 = Color3.fromRGB(46, 120, 255), Position = UDim2.fromOffset(98, 258), Size = UDim2.fromOffset(186, 42) }, panel))
local status = make("TextLabel", { Name = "Status", Text = "", Font = Enum.Font.Gotham, TextSize = 12, TextColor3 = Color3.fromRGB(150, 230, 160),
	BackgroundTransparency = 1, Position = UDim2.fromOffset(16, 306), Size = UDim2.fromOffset(268, 20) }, panel)

local function update()
	local color = Color3.fromHSV(hue, saturation, value)
	preview.BackgroundColor3 = color
	bars.saturation.gradient.Color = ColorSequence.new(Color3.fromHSV(hue, 0, value), Color3.fromHSV(hue, 1, value))
	bars.value.gradient.Color = ColorSequence.new(Color3.new(0, 0, 0), Color3.fromHSV(hue, saturation, 1))
	bars.hue.knob.Position = UDim2.fromScale(hue, 0.5)
	bars.saturation.knob.Position = UDim2.fromScale(saturation, 0.5)
	bars.value.knob.Position = UDim2.fromScale(value, 0.5)
	for id, tab in pairs(tabs) do
		tab.BackgroundColor3 = if id == slot then Color3.fromRGB(46, 120, 255) else MID
	end
end

local function selectSlot(id)
	slot = id
	local saved = player:GetAttribute("ParticlyColour_" .. id)
	if typeof(saved) == "Color3" then
		hue, saturation, value = saved:ToHSV()
	end
	status.Text = ""
	update()
end
for id, tab in pairs(tabs) do
	tab.Activated:Connect(function()
		selectSlot(id)
	end)
end
for i, button in ipairs(swatchButtons) do
	button.Activated:Connect(function()
		hue, saturation, value = SWATCHES[i]:ToHSV()
		update()
	end)
end

local dragging = nil
local function setFromX(name, x)
	local frame = bars[name].frame
	local t = math.clamp((x - frame.AbsolutePosition.X) / math.max(frame.AbsoluteSize.X, 1), 0, 1)
	if name == "hue" then
		hue = t
	elseif name == "saturation" then
		saturation = t
	else
		value = t
	end
	update()
end
local function isPress(input)
	return input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch
end
for name, b in pairs(bars) do
	b.frame.InputBegan:Connect(function(input)
		if isPress(input) then
			dragging = name
			setFromX(name, input.Position.X)
		end
	end)
end
UserInputService.InputChanged:Connect(function(input)
	if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
		setFromX(dragging, input.Position.X)
	end
end)
UserInputService.InputEnded:Connect(function(input)
	if isPress(input) then
		dragging = nil
	end
end)

applyButton.Activated:Connect(function()
	remote:FireServer(slot, Color3.fromHSV(hue, saturation, value))
	status.Text = "Saving…"
end)
for _, id in ipairs(SHOW_SLOTS) do
	player:GetAttributeChangedSignal("ParticlyColour_" .. id):Connect(function()
		if id == slot then
			status.Text = "Saved! " .. SLOTS[id] .. " colour updated."
		end
	end)
end
openButton.Activated:Connect(function()
	panel.Visible = not panel.Visible
	if panel.Visible then
		fit()
		selectSlot(slot)
	end
end)
closeButton.Activated:Connect(function()
	panel.Visible = false
end)
update()
`;

  return { serverSource: SERVER_SOURCE, clientSource: CLIENT_SOURCE };
})();
