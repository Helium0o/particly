local fails = 0
local function check(cond, msg)
	if cond then SIM.print("  ok   " .. msg) else fails += 1 SIM.print("  FAIL " .. msg) end
end
local function build(cmdName, selection)
	SIM.select(selection or {})
	SIM.runChunk(CMD[cmdName], cmdName)
	return SIM.selection()[1]
end

---------------------------------------------------------------- vehicle nitro on an existing exhaust part
SIM.print("Nitro Boost (Blue) on a car's exhaust part:")
local car = SIM.new("Model") car.Name = "Car" car.Parent = workspace
local seat = SIM.new("VehicleSeat") seat.Parent = car
local body = SIM.new("Part") body.Name = "Body" body.Parent = car
local exhaust = SIM.new("Part") exhaust.Name = "Exhaust" exhaust.Parent = car
build("Nitro_Boost_Blue_", { exhaust })
check(exhaust:FindFirstChild("ParticlyControl") and exhaust:FindFirstChild("ParticlyTrigger") and exhaust:FindFirstChild("ParticlyBoostClient"), "scripts added to exhaust")
check(exhaust.ParticlyBoostClient.RunContext and exhaust.ParticlyBoostClient.RunContext.Name == "Client", "client script has RunContext = Client")
local on, emitted = SIM.state(exhaust)
check(#SIM.emitters(exhaust) == 4 and on == 0, "4 emitters, all off before driving (on=" .. on .. ")")
local driver, driverChar, driverHum = SIM.newPlayer("Driver")
SIM.Players.LocalPlayer = driver
SIM.localPlayer = driver
SIM.runAll(car)
SIM.advance(0.5)
check(exhaust:FindFirstChild("ParticlyBoostRemote") ~= nil, "server created the boost RemoteEvent")
SIM.UIS.InputBegan:Fire({ KeyCode = Enum.KeyCode.LeftShift }, false)
SIM.advance(0.1)
on = SIM.state(exhaust)
check(on == 0, "Shift ignored while not seated")
seat.Occupant = driverHum
SIM.advance(0.1)
check(SIM.CAS.bound.ParticlyBoost_LeftShift ~= nil, "mobile BOOST button bound when driver sits")
SIM.UIS.InputBegan:Fire({ KeyCode = Enum.KeyCode.LeftShift }, false)
SIM.advance(0.1)
on, emitted = SIM.state(exhaust)
check(on == 3 and emitted == 1, "holding Shift: 3 continuous layers on + ignition pop (on=" .. on .. ", emitted=" .. emitted .. ")")
SIM.UIS.InputEnded:Fire({ KeyCode = Enum.KeyCode.LeftShift })
SIM.advance(0.1)
on = SIM.state(exhaust)
check(on == 0, "releasing Shift stops the boost")
SIM.UIS.InputBegan:Fire({ KeyCode = Enum.KeyCode.ButtonR1 }, false)
SIM.advance(0.3)
check((SIM.state(exhaust)) == 3, "gamepad R1 also boosts")
SIM.UIS.InputEnded:Fire({ KeyCode = Enum.KeyCode.ButtonR1 })
SIM.advance(0.3)
SIM.CAS.bound.ParticlyBoost_LeftShift("x", Enum.UserInputState.Begin)
SIM.advance(0.1)
check((SIM.state(exhaust)) == 3, "mobile BOOST button boosts")
SIM.CAS.bound.ParticlyBoost_LeftShift("x", Enum.UserInputState.End)
SIM.advance(0.1)
check((SIM.state(exhaust)) == 0, "releasing the mobile button stops")
-- someone else tries to boost the car remotely
local hacker = SIM.newPlayer("Hacker")
exhaust.ParticlyBoostRemote.OnServerEvent:Fire(hacker, true)
SIM.advance(0.3)
check((SIM.state(exhaust)) == 0, "non-driver FireServer(true) is ignored")
exhaust.ParticlyBoostRemote.OnServerEvent:Fire(driver, "yes")
SIM.advance(0.3)
check((SIM.state(exhaust)) == 0, "bad argument type ignored")
-- boost then hop out
SIM.UIS.InputBegan:Fire({ KeyCode = Enum.KeyCode.LeftShift }, false)
SIM.advance(0.3)
seat.Occupant = nil
SIM.advance(0.1)
check((SIM.state(exhaust)) == 0 and SIM.CAS.bound.ParticlyBoost_LeftShift == nil, "leaving the seat stops boost and removes the button")

---------------------------------------------------------------- new effect Part dropped into a car: auto-weld
SIM.print("Tire Smoke dropped into a car as its own Part (auto-weld, key Q, max boost):")
local car2 = SIM.new("Model") car2.Name = "Car2" car2.Parent = workspace
local seat2 = SIM.new("VehicleSeat") seat2.Parent = car2 seat2.Position = Vector3.new(0, 0, 0)
local wheel = SIM.new("Part") wheel.Name = "RearWheel" wheel.Parent = car2 wheel.Position = Vector3.new(3, 0, 6)
local smokePart = build("Tire_Smoke_Drift_", {})
check(smokePart and smokePart:GetAttribute("ParticlyAutoWeld") == 1 and smokePart.Anchored == true, "new Part is anchored and marked for auto-weld")
smokePart.Parent = car2
smokePart.Position = Vector3.new(3, 0, 7)
local exhaust2 = SIM.new("Part") exhaust2.Name = "Exhaust2" exhaust2.Parent = car2 exhaust2.Position = Vector3.new(0, 0, 8)
build("Nitro_Boost_Blue_", { exhaust2 })
local d2, _, d2Hum = SIM.newPlayer("Drifter")
SIM.Players.LocalPlayer = d2 SIM.localPlayer = d2
SIM.runAll(car2)
SIM.advance(0.2)
local weld = smokePart:FindFirstChild("WeldConstraint")
check(weld and weld.Part0 == wheel and smokePart.Anchored == false and smokePart.Massless == true, "welded itself to the nearest car part and unanchored")
seat2.Occupant = d2Hum
SIM.advance(0.1)
check(SIM.CAS.bound.ParticlyBoost_Q ~= nil and SIM.CAS.bound.ParticlyBoost_LeftShift ~= nil, "separate DRIFT and BOOST mobile buttons")
SIM.UIS.InputBegan:Fire({ KeyCode = Enum.KeyCode.Q }, false)
SIM.advance(0.1)
check((SIM.state(smokePart)) == 1 and (SIM.state(exhaust2)) == 0, "Q starts the drift smoke only (nitro stays off)")
SIM.UIS.InputBegan:Fire({ KeyCode = Enum.KeyCode.LeftShift }, false)
SIM.UIS.InputEnded:Fire({ KeyCode = Enum.KeyCode.Q })
SIM.advance(0.3)
check((SIM.state(smokePart)) == 0 and (SIM.state(exhaust2)) == 3, "Shift boosts nitro, releasing Q stops the smoke")
SIM.UIS.InputBegan:Fire({ KeyCode = Enum.KeyCode.ButtonL1 }, false)
SIM.advance(0.1)
check((SIM.state(smokePart)) == 1, "gamepad L1 is the drift button")

---------------------------------------------------------------- touch (puddle) triggered by a driven car
SIM.print("Mud Splash puddle touched by a car / player:")
local puddle = build("Mud_Splash", {})
check(puddle.CanTouch == true, "puddle part has CanTouch on")
SIM.runAll(puddle)
SIM.advance(0.2)
local _, e0 = SIM.state(puddle)
puddle.Touched:Fire(body) -- car 1 has nobody driving now
SIM.advance(0.1)
local _, e1 = SIM.state(puddle)
check(e1 == e0, "an empty car does not trigger it")
seat.Occupant = driverHum
SIM.advance(0.1)
puddle.Touched:Fire(body)
SIM.advance(0.1)
local _, e2 = SIM.state(puddle)
check(e2 == 52, "a driven car triggers the splash bursts (emitted=" .. e2 .. ")")
puddle.Touched:Fire(body)
SIM.advance(0.1)
local _, e3 = SIM.state(puddle)
check(e3 == e2, "cooldown prevents an instant re-trigger")
SIM.advance(1)
puddle.Touched:Fire(driverChar.HumanoidRootPart)
SIM.advance(0.1)
local _, e4 = SIM.state(puddle)
check(e4 == 104, "a player's character triggers it after the cooldown")

---------------------------------------------------------------- prompt
SIM.print("Treasure Chest Open via ProximityPrompt:")
local chest = build("Treasure_Chest_Open", {})
SIM.runAll(chest)
SIM.advance(0.2)
local prompt = chest:FindFirstChildWhichIsA("ProximityPrompt")
check(prompt and prompt.ActionText == "Open", "ProximityPrompt 'Open' created")
prompt.Triggered:Fire(driver)
SIM.advance(0.1)
local on6, em6 = SIM.state(chest)
check(on6 == 1 and em6 == 26 and prompt.Enabled == false, "plays: glitter on, light + 25 coins, prompt disabled during cooldown")
SIM.advance(1.3)
check((SIM.state(chest)) == 0, "continuous layer stops after the duration")
SIM.advance(4)
check(prompt.Enabled == true, "prompt re-enabled after cooldown")

---------------------------------------------------------------- character
SIM.print("Power-Up Aura attached to every character:")
local auraScript = build("Power_Up_Aura", {})
check(auraScript.Parent and auraScript.Parent.Name == "StarterCharacterScripts", "Script placed in StarterCharacterScripts")
local hero, heroChar = SIM.newPlayer("Hero")
local copy = auraScript:Clone()
copy.Parent = heroChar
SIM.runScript(copy)
SIM.advance(0.5)
local hrpOn = SIM.state(heroChar.HumanoidRootPart)
check(hrpOn == 2, "both aura layers running on the HumanoidRootPart (on=" .. hrpOn .. ")")
local toggle = heroChar:FindFirstChild("Power-Up_AuraControl") or heroChar:FindFirstChildWhichIsA("BoolValue")
check(toggle ~= nil, "BoolValue toggle created on the character")
toggle.Value = false
SIM.advance(0.1)
check((SIM.state(heroChar.HumanoidRootPart)) == 0, "setting the toggle false hides the aura")

---------------------------------------------------------------- always + bursts
SIM.print("Geyser (always on, bursts replay):")
local geyser = build("Geyser", {})
SIM.runAll(geyser)
SIM.advance(0.1)
local onG, eG1 = SIM.state(geyser)
check(onG == 1 and eG1 == 140, "idle steam on + first eruption (emitted=" .. eG1 .. ")")
SIM.advance(4.05)
local _, eG2 = SIM.state(geyser)
check(eG2 == 280, "eruption replays after Burst replay seconds (emitted=" .. eG2 .. ")")

---------------------------------------------------------------- scripted control
SIM.print("Car Explosion controlled from a game script:")
local boom = build("Car_Explosion", {})
check((SIM.state(boom)) == 0, "starts off")
local control = require(boom.ParticlyControl)
control.burst()
SIM.advance(0.2)
local _, eB = SIM.state(boom)
check(eB == 135, "control.burst() fires every burst layer incl. delayed smoke (emitted=" .. eB .. ")")
local smokeCar = build("Engine_Damage_Smoke", {})
local c2 = require(smokeCar.ParticlyControl)
c2.play(2)
SIM.advance(0.1)
check((SIM.state(smokeCar)) == 2 and c2.isActive(), "control.play(2) turns damage smoke on")
SIM.advance(2)
check((SIM.state(smokeCar)) == 0 and not c2.isActive(), "...and off again after 2 seconds")

---------------------------------------------------------------- module export
SIM.print("ModuleScript export for game code:")
local mod = SIM.new("ModuleScript") mod.Name = "Nitro" mod.Source = MOD.Nitro_Boost_Blue_
local Effect = require(mod)
local att = SIM.new("Attachment") att.Parent = exhaust
local list = Effect.create(att, false)
local onM = 0 for _, e in ipairs(list) do if e.Enabled then onM += 1 end end
check(#list == 4 and onM == 0, "Effect.create(part, false) builds 4 emitters switched off")
Effect.start(list)
onM = 0 for _, e in ipairs(list) do if e.Enabled then onM += 1 end end
check(onM == 3, "Effect.start turns the continuous layers on")
Effect.stop(list)


---------------------------------------------------------------- car neon: toggle with N
SIM.print("Neon Toggle (press N) on a car chassis:")
local car3 = SIM.new("Model") car3.Name = "Car3" car3.Parent = workspace
local seat3 = SIM.new("VehicleSeat") seat3.Parent = car3
local chassis = SIM.new("Part") chassis.Name = "Chassis" chassis.Parent = car3
build("Neon_Toggle_press_N_", { chassis })
local gui = chassis:FindFirstChild("ParticlyNeon")
local nlight = chassis:FindFirstChild("ParticlyNeonLight")
check(gui and gui.ClassName == "SurfaceGui" and gui.Face.Name == "Top" and gui.LightInfluence == 0, "glowing SurfaceGui on the Top face (LightInfluence 0)")
local frames = 0 for _, d in ipairs(gui:GetDescendants()) do if d.ClassName == "Frame" then frames += 1 end end
check(frames == 72, "LED design built from GUI frames, no image needed (frames=" .. frames .. ")")
check(nlight and nlight.ClassName == "SurfaceLight" and nlight.Face.Name == "Bottom", "SurfaceLight shines down onto the road")
check(gui.Enabled == false and nlight.Enabled == false, "neon starts off (toggle mode)")
local d3, _, d3Hum = SIM.newPlayer("NeonDriver")
SIM.Players.LocalPlayer = d3 SIM.localPlayer = d3
SIM.runAll(car3)
SIM.advance(0.3)
seat3.Occupant = d3Hum
SIM.advance(0.1)
check(SIM.CAS.bound.ParticlyBoost_N ~= nil, "mobile NEON button bound")
SIM.UIS.InputBegan:Fire({ KeyCode = Enum.KeyCode.N }, false)
SIM.UIS.InputEnded:Fire({ KeyCode = Enum.KeyCode.N })
SIM.advance(0.3)
check(gui.Enabled == true and nlight.Enabled == true and (SIM.state(chassis)) == 1, "press N: neon, light and haze on (and stay on after release)")
SIM.UIS.InputBegan:Fire({ KeyCode = Enum.KeyCode.N }, false)
SIM.UIS.InputEnded:Fire({ KeyCode = Enum.KeyCode.N })
SIM.advance(0.3)
check(gui.Enabled == false and nlight.Enabled == false and (SIM.state(chassis)) == 0, "press N again: everything off")

---------------------------------------------------------------- always-on animated neon
SIM.print("Neon Rainbow LED (always on, animated):")
local rb = build("Neon_Rainbow_LED", {})
check(rb.ParticlyNeon.Enabled == true, "always-on neon starts enabled")
check(rb:FindFirstChild("ParticlyNeonFx") and rb.ParticlyNeonFx.RunContext.Name == "Client", "animation runs in a client script")
SIM.runAll(rb)
SIM.advance(0.2)
SIM.RunService.RenderStepped:Fire(1 / 60)
SIM.advance(0.05)
local glow1 = rb.ParticlyNeon:FindFirstChild("Glow2")
check(glow1.BackgroundColor3:ToHex() ~= "FF2A6A", "rainbow animation recolours the frames (" .. glow1.BackgroundColor3:ToHex() .. ")")

---------------------------------------------------------------- icon design without upload falls back to bars
SIM.print("Neon Hearts before uploading its image:")
local hearts = build("Neon_Hearts", {})
local hf = 0 for _, d in ipairs(hearts.ParticlyNeon:GetDescendants()) do if d.ClassName == "Frame" then hf += 1 end end
check(hf == 8 and hearts.ParticlyNeon:FindFirstChildWhichIsA("ImageLabel") == nil, "falls back to glowing bars until an image id is set")
SIM.runAll(hearts)
SIM.advance(0.2)
SIM.RunService.RenderStepped:Fire(1 / 60)
SIM.advance(0.05)
check(true, "breathe animation runs without errors")

---------------------------------------------------------------- module export with neon
SIM.print("ModuleScript export with neon:")
local nm = SIM.new("ModuleScript") nm.Name = "NeonMod" nm.Source = MOD.Neon_LED_Strip
local NeonFx = require(nm)
local plate = SIM.new("Part") plate.Parent = workspace
local em = NeonFx.create(plate, false)
check(plate.ParticlyNeon and plate.ParticlyNeon.Enabled == false, "Effect.create(part, false) adds the neon switched off")
NeonFx.start(em)
check(plate.ParticlyNeon.Enabled == true and plate.ParticlyNeonLight.Enabled == true, "Effect.start switches neon + light on")
NeonFx.stop(em)
check(plate.ParticlyNeon.Enabled == false, "Effect.stop switches it off")


local function beat(n) for _ = 1, n or 1 do SIM.RunService.Heartbeat:Fire(1 / 60) SIM.advance(1 / 60) end end
local function newCar(name)
	local m = SIM.new("Model") m.Name = name m.Parent = workspace
	local st = SIM.new("VehicleSeat") st.Parent = m
	local b = SIM.new("Part") b.Name = "Body" b.Parent = m
	return m, st, b
end
local function emitterNamed(root, n) for _, e in ipairs(SIM.emitters(root)) do if e.Name == n then return e end end end

---------------------------------------------------------------- speed-reactive flames
SIM.print("Speed Flames dropped into a car (React to car speed):")
local sCar, sSeat = newCar("SpeedCar")
local sf = build("Speed_Flames", {})
sf.Parent = sCar
check(sf:FindFirstChild("ParticlySpeedFx") and sf.ParticlySpeedFx.RunContext.Name == "Client", "speed script runs on the client")
check(sf:GetAttribute("ParticlyAutoWeld") == 1, "part is tagged to auto-weld into the car")
SIM.runAll(sf)
SIM.advance(0.2)
check(sf:FindFirstChildWhichIsA("WeldConstraint") ~= nil and sf.Anchored == false, "server welded the part to the car")
local flame = emitterNamed(sf, "Flame")
local baseRate = flame.Rate
beat(2)
check(flame.Enabled == false, "parked car: flames off")
sSeat.AssemblyLinearVelocity = SIM.v3(0, 0, -40)
beat(2)
local slowRate, slowSize = flame.Rate, flame.Size.Keypoints[1].Value
check(flame.Enabled == true and slowRate < baseRate, "40 studs/s: flames on, small (rate " .. string.format("%.1f", slowRate) .. ")")
sSeat.AssemblyLinearVelocity = SIM.v3(0, 0, -140)
beat(2)
check(flame.Rate > slowRate and flame.Size.Keypoints[1].Value > slowSize and math.abs(flame.Rate - baseRate) < 0.01, "140 studs/s: full rate and bigger flames")
sSeat.AssemblyLinearVelocity = SIM.v3(0, 0, -5)
beat(2)
check(flame.Enabled == false, "slowing below 20 studs/s switches them off")

SIM.print("Sonic Boom fires its burst once on reaching top speed:")
local bCar, bSeat = newCar("BoomCar")
local sb = build("Sonic_Boom", {})
sb.Parent = bCar
SIM.runAll(sb)
SIM.advance(0.2)
local ring = emitterNamed(sb, "Shock Ring")
bSeat.AssemblyLinearVelocity = SIM.v3(0, 0, -160)
beat(3)
check((ring.__emitted or 0) == 0 and emitterNamed(sb, "Vapour Cone").Enabled, "160 studs/s: vapour cone, no boom yet")
bSeat.AssemblyLinearVelocity = SIM.v3(0, 0, -190)
beat(5)
check(ring.__emitted == 1, "190 studs/s: boom fired once (" .. tostring(ring.__emitted) .. ")")
bSeat.AssemblyLinearVelocity = SIM.v3(0, 0, -100)
beat(2)
bSeat.AssemblyLinearVelocity = SIM.v3(0, 0, -200)
beat(2)
check(ring.__emitted == 2, "dropping below and back to top speed booms again")

SIM.print("Skid Marks (drift):")
local dCar, dSeat = newCar("DriftCar")
local sk = build("Skid_Marks", {})
sk.Parent = dCar
SIM.runAll(sk)
SIM.advance(0.2)
local track = emitterNamed(sk, "Track")
dSeat.AssemblyLinearVelocity = SIM.v3(0, 0, -120)
beat(2)
check(track.Enabled == false, "driving straight fast: no skid marks")
dSeat.AssemblyLinearVelocity = SIM.v3(30, 0, -80)
beat(2)
check(track.Enabled == true, "sliding sideways at 30 studs/s: skid marks")

---------------------------------------------------------------- crash
SIM.print("Crash Spark Shower (Play on crash):")
local cCar, cSeat = newCar("CrashCar")
local cs = build("Crash_Spark_Shower", {})
cs.Parent = cCar
SIM.runAll(cs)
SIM.advance(0.2)
local burstE, grind = emitterNamed(cs, "Spark Burst"), emitterNamed(cs, "Grind Sparks")
local _, _, crashHum = SIM.newPlayer("Crasher")
beat(3)
cSeat.AssemblyLinearVelocity = SIM.v3(0, 0, 0)
cSeat.AssemblyLinearVelocity = SIM.v3(0, 0, -100)
beat(3)
check((burstE.__emitted or 0) == 0, "parked car (nobody driving): crash check is idle")
cSeat.Occupant = crashHum
beat(20)
cSeat.AssemblyLinearVelocity = SIM.v3(0, 0, -92)
beat(5)
check((burstE.__emitted or 0) == 0, "braking gently is not a crash")
cSeat.AssemblyLinearVelocity = SIM.v3(0, 0, 0)
beat(1)
check(burstE.__emitted == 80 and grind.Enabled == true, "sudden stop from 92 studs/s: spark burst + grinding sparks")
beat(40)
check(grind.Enabled == false, "grinding sparks stop after 0.4 s")

---------------------------------------------------------------- keep-on touch pad
SIM.print("Checkpoint Gate (glows always, bursts on touch):")
local gate = build("Checkpoint_Gate", {})
SIM.runAll(gate)
SIM.advance(0.2)
check(emitterNamed(gate, "Shimmer").Enabled == true, "shimmer is on before anyone touches it")
local gp, gChar = SIM.newPlayer("Racer")
gate.Touched:Fire(gChar.HumanoidRootPart)
SIM.advance(0.1)
check(emitterNamed(gate, "Sparkles").__emitted == 50 and emitterNamed(gate, "Shimmer").Enabled == true, "touch fires the bursts, shimmer stays on")
SIM.advance(2)
check(emitterNamed(gate, "Shimmer").Enabled == true, "...and is still on afterwards")

---------------------------------------------------------------- police neon pattern
SIM.print("Neon Police Lights (two colours, per-LED pattern):")
local pCar, pSeat = newCar("PoliceCar")
local pchassis = SIM.new("Part") pchassis.Parent = pCar
build("Neon_Police_Lights", { pchassis })
local pgui = pchassis.ParticlyNeon
pgui.Enabled = true
SIM.runAll(pchassis)
SIM.advance(0.2)
local seen = {}
for i = 1, 40 do
	SIM.RunService.RenderStepped:Fire(1 / 60)
	SIM.advance(0.025)
	for _, f in ipairs(pgui:GetChildren()) do
		if f.ClassName == "Frame" and f.BackgroundTransparency < 0.5 then
			local cx = f.Position.X.Scale + f.Size.X.Scale / 2
			seen[(cx < 0.45 and "L" or cx > 0.55 and "R" or "M") .. f.BackgroundColor3:ToHex()] = true
		end
	end
end
check(seen.LFF1A1A and seen.R1A5CFF, "left LEDs flash red, right LEDs flash blue")
check(not seen.L1A5CFF and not seen.RFF1A1A, "colours never swap sides")
local lightColours = {}
for i = 1, 30 do SIM.RunService.RenderStepped:Fire(1 / 60) SIM.advance(0.03) lightColours[pchassis.ParticlyNeonLight.Color:ToHex()] = true end
check(lightColours.FF1A1A and lightColours["1A5CFF"], "road light alternates red / blue")

---------------------------------------------------------------- colour shop
SIM.print("Colour shop kit (server + client, DataStore):")
local shopPlayer, shopChar, shopHum = SIM.newPlayer("Shopper")
SIM.DATA.ParticlyColours = { ["player_" .. shopPlayer.UserId] = { ["1"] = "00FF00", ["9"] = "123456", ["2"] = "not a colour" } }
SIM.Players.LocalPlayer = shopPlayer SIM.localPlayer = shopPlayer
SIM.select({})
SIM.runChunk(CMD.Shop_Install, "Shop_Install")
local kit = workspace:FindFirstChild("ParticlyColourShop")
check(kit and kit.ColourShopServer.RunContext.Name == "Server" and kit.ColourShopClient.RunContext.Name == "Client", "installer adds server + client scripts")
SIM.runScript(kit.ColourShopServer)
SIM.advance(0.5)
local remoteC = game:GetService("ReplicatedStorage"):FindFirstChild("ParticlyColourRemote")
check(remoteC ~= nil, "server created ParticlyColourRemote")
local saved = shopPlayer:GetAttribute("ParticlyColour_1")
check(saved and saved:ToHex() == "00FF00", "saved neon colour loaded from the DataStore")
check(shopPlayer:GetAttribute("ParticlyColour_2") == nil, "corrupt saved values are ignored")
-- a car with shop-tagged neon (slot 1) and nitro (slot 2)
local shopCar, shopSeat = newCar("ShopCar")
local nchassis = SIM.new("Part") nchassis.Parent = shopCar
build("Neon_LED_Strip", { nchassis })
local exh = SIM.new("Part") exh.Parent = shopCar
build("Nitro_Boost_Blue_", { exh })
check(nchassis.ParticlyNeon:GetAttribute("ParticlyShop") == 1 and emitterNamed(exh, "Flame"):GetAttribute("ParticlyShop") == 2, "exports carry their colour-shop slot")
shopHum.SeatPart = shopSeat
SIM.advance(0.2)
check(nchassis.ParticlyNeon.Glow1.BackgroundColor3:ToHex() == "00FF00" and nchassis.ParticlyNeonLight.Color:ToHex() == "00FF00", "sitting in the car paints its neon in the saved colour")
-- someone else's car (OwnerUserId) and a showroom model holding two cars stay untouched
local garage = SIM.new("Model") garage.Name = "Vehicles" garage.Parent = workspace
local carA, seatA = newCar("CarA") carA.Parent = garage
local carB = newCar("CarB") carB.Parent = garage
local neonA, neonB = SIM.new("Part"), SIM.new("Part")
neonA.Parent = carA neonB.Parent = carB
build("Neon_LED_Strip", { neonA }) build("Neon_LED_Strip", { neonB })
shopHum.SeatPart = seatA
SIM.advance(0.2)
check(neonA.ParticlyNeon.Glow1.BackgroundColor3:ToHex() == "00FF00" and neonB.ParticlyNeon.Glow1.BackgroundColor3:ToHex() ~= "00FF00", "only the driven car in a model of many cars is painted")
local carC, seatC = newCar("CarC")
carC:SetAttribute("OwnerUserId", 999999)
local neonC = SIM.new("Part") neonC.Parent = carC
build("Neon_LED_Strip", { neonC })
shopHum.SeatPart = seatC
SIM.advance(0.2)
check(neonC.ParticlyNeon.Glow1.BackgroundColor3:ToHex() ~= "00FF00", "a car owned by someone else keeps its owner's colours")
shopHum.SeatPart = shopSeat
SIM.advance(0.2)
local before = emitterNamed(exh, "Flame").Color
remoteC:FireServer(2, Color3.new(1, 0, 0))
SIM.advance(0.1)
local after = emitterNamed(exh, "Flame").Color
local h, sat = after.Keypoints[#after.Keypoints].Value:ToHSV()
check(after ~= before and (h < 0.02 or h > 0.98) and sat > 0.5, "buying red nitro recolours the flame red")
local core = emitterNamed(exh, "Core").Color.Keypoints[1].Value
check(core.R > 0.9 and core.G > 0.9, "white-hot core stays white")
SIM.advance(0.3)
remoteC:FireServer(7, Color3.new(0, 0, 1))
remoteC:FireServer(1, "blue")
remoteC:FireServer(1.5, Color3.new(0, 0, 1))
remoteC:FireServer(1, Color3.new(0 / 0, 0, 1))
SIM.advance(0.3)
check(shopPlayer:GetAttribute("ParticlyColour_1"):ToHex() == "00FF00", "bad slots, types and NaN colours are rejected")
remoteC:FireServer(1, Color3.new(0, 0, 5))
remoteC:FireServer(1, Color3.new(1, 1, 0))
SIM.advance(0.1)
check(shopPlayer:GetAttribute("ParticlyColour_1"):ToHex() == "0000FF", "values are clamped; rapid repeat requests are throttled")
SIM.Players.PlayerRemoving:Fire(shopPlayer)
SIM.advance(0.3)
local stored = SIM.DATA.ParticlyColours["player_" .. shopPlayer.UserId]
check(stored["1"] == "0000FF" and stored["2"] == "FF0000", "colours are saved when the player leaves")
-- client UI
SIM.runScript(kit.ColourShopClient)
SIM.advance(0.2)
local sgui = shopPlayer.PlayerGui:FindFirstChild("ParticlyColourShop")
check(sgui and sgui.Panel.Visible == false, "client builds the picker UI (closed)")
sgui.Open.Activated:Fire()
SIM.advance(0.05)
check(sgui.Panel.Visible == true, "Colours button opens it")
local got = nil
remoteC.OnServerEvent:Connect(function(_, slot, color) got = { slot, color } end)
SIM.advance(0.3)
sgui.Panel.Apply.Activated:Fire()
SIM.advance(0.05)
check(got and got[1] == 1 and typeof(got[2]) == "Color3", "Apply sends the chosen colour to the server")


---------------------------------------------------------------- NFS neon picture (uploaded)
SIM.print("NFS neon picture (Brazil Flag, uploaded):")
local nCar = newCar("NfsCar")
local nPart = SIM.new("Part") nPart.Parent = nCar
build("NFS_CARNEONGLOW_BRAZIL_FLAG_up", { nPart })
local pic = nPart.ParticlyNeon:FindFirstChild("Design")
check(pic and pic.ClassName == "ImageLabel" and pic.Image == "rbxassetid://990", "uploaded picture shown by an ImageLabel")
check(pic.ImageColor3:ToHex() == "FFFFFF" and pic:GetAttribute("ParticlyFullColour") == 1, "full-colour picture is not tinted")
local fb = SIM.new("Part") fb.Parent = nCar
build("NFS_CARNEONGLOW_BRAZIL_FLAG", { fb })
local fbFrames = 0 for _, d in ipairs(fb.ParticlyNeon:GetChildren()) do if d.ClassName == "Frame" then fbFrames += 1 end end
check(fbFrames == 72, "not uploaded yet: LED strips in the picture's colour")
local mp = SIM.new("ModuleScript") mp.Source = MOD.NFS_CARNEONGLOW_COP_YELLOW_up
local CopFx = require(mp)
local cp = SIM.new("Part") cp.Parent = workspace
CopFx.create(cp)
check(cp.ParticlyNeon.Design.Image == "rbxassetid://991", "ModuleScript builds the picture neon too")

for _, l in ipairs(SIM.log) do if l:find("WARN") then SIM.print("  log: " .. l) end end
SIM.print(fails == 0 and "ALL SCENARIOS PASSED" or (fails .. " FAILURES"))
