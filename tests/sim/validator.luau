local PE_PROPS = { Name = "string", Enabled = "boolean", Texture = "string", Color = "ColorSequence", Transparency = "NumberSequence",
  Size = "NumberSequence", Squash = "NumberSequence", LightEmission = "number", LightInfluence = "number", Brightness = "number", ZOffset = "number",
  Rate = "number", Lifetime = "NumberRange", SpreadAngle = "Vector2", TimeScale = "number", Speed = "NumberRange", Acceleration = "Vector3",
  Drag = "number", Rotation = "NumberRange", RotSpeed = "NumberRange", VelocityInheritance = "number", LockedToPart = "boolean",
  WindAffectsDrag = "boolean", ShapePartial = "number", FlipbookFramerate = "NumberRange", FlipbookStartRandom = "boolean",
  Orientation = "ParticleOrientation", EmissionDirection = "NormalId", Shape = "ParticleEmitterShape", ShapeStyle = "ParticleEmitterShapeStyle",
  ShapeInOut = "ParticleEmitterShapeInOut", FlipbookLayout = "ParticleFlipbookLayout", FlipbookMode = "ParticleFlipbookMode" }
local function validatePE(k, v)
  if k == "Parent" or k == "__emitted" then return end
  local want = PE_PROPS[k]
  if not want then error(k .. " is not a valid member of ParticleEmitter") end
  local t = typeof(v)
  if t == "EnumItem" then assert(v.EnumType == want, "wrong enum for " .. k .. ": " .. v.EnumType) return end
  if t ~= want then error(("bad type for %s: expected %s got %s"):format(k, want, t)) end
end

