'use strict';
/* More presets: abilities, weapons, environment, seasonal, plus extra fun / sci-fi / magic. */

const CHAR = (o = {}) => ({ mode: 'character', attachTo: 'HumanoidRootPart', ...o });
const TOUCH = (duration = 1, cooldown = 1) => ({ mode: 'touch', duration, cooldown });
const PROMPT = (actionText, duration = 1.5, cooldown = 2) => ({ mode: 'prompt', actionText, duration, cooldown });
const SCRIPTED = { mode: 'script' };

PRESETS.push(
  /* ------------------------------ Abilities ------------------------------ */
  {
    name: 'Fireball Cast', category: 'Abilities', desc: 'Charge-up swirl then a fiery release. Fire with ParticlyControl.burst() when casting.', partSize: [2, 2, 2], trigger: SCRIPTED, burstLoop: 2,
    layers: [
      { Name: 'Charge', ...T('rbx_fire'), Color: ['#fff3b0', '#ff7a1a'], Size: [[0, 0.3], [1, 1.2]], LightEmission: 1, Brightness: 2, Lifetime: [0.4, 0.4], Speed: [6, 6], Shape: 'Sphere', ShapeStyle: 'Surface', ShapeInOut: 'Inward', mode: 'burst', emitCount: 30, Enabled: false },
      { Name: 'Release', ...T('rbx_exp_core'), point: true, Color: ['#fff5c0', '#ff8a1a', '#7a1a05'], Size: [[0, 2], [1, 6]], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 2, Lifetime: [0.35, 0.5], Speed: [2, 6], SpreadAngle: [180, 180], Rotation: [0, 360], mode: 'burst', emitCount: 8, emitDelay: 0.4, Enabled: false },
      { Name: 'Embers', ...T('rbx_fire_sparks'), Color: '#ffb347', Size: [0.35, 0], LightEmission: 1, Brightness: 3, Lifetime: [0.4, 0.8], Speed: [10, 20], Shape: 'Sphere', Drag: 3, mode: 'burst', emitCount: 25, emitDelay: 0.4, Enabled: false },
    ],
  },
  {
    name: 'Ice Spikes', category: 'Abilities', desc: 'Shards of ice erupt from the ground.', partSize: [6, 0.4, 6], trigger: SCRIPTED, burstLoop: 2,
    layers: [
      { Name: 'Shards', ...T('shard'), Color: ['#ffffff', '#8fe3ff'], Size: [[0, 0], [0.15, 2.5, 1], [0.8, 2.5], [1, 0]], LightEmission: 0.4, Lifetime: [0.8, 1.1], Speed: [3, 6], Shape: 'Disc', Rotation: [-20, 20], Orientation: 'FacingCameraWorldUp', mode: 'burst', emitCount: 18, Enabled: false },
      { Name: 'Frost Mist', ...T('rbx_smoke'), Color: '#dff6ff', Size: [[0, 1], [1, 5]], Transparency: [[0, 0.4], [1, 1]], Lifetime: [0.8, 1.4], Speed: [3, 6], Shape: 'Disc', SpreadAngle: [60, 60], Drag: 2, mode: 'burst', emitCount: 15, Enabled: false },
    ],
  },
  {
    name: 'Frost Nova', category: 'Abilities', desc: 'Freezing ring blast around the caster.', partSize: [1, 0.2, 1], trigger: SCRIPTED, burstLoop: 2,
    layers: [
      { Name: 'Ring', ...T('rbx_exp_shock'), point: true, Color: ['#ffffff', '#8fe3ff'], Size: [2, 26], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 2, Lifetime: [0.5, 0.5], Speed: 0.01, Orientation: 'VelocityPerpendicular', mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Ice Bits', ...T('shard'), Color: '#c9f2ff', Size: [[0, 0.8, 0.3], [1, 0.2]], LightEmission: 0.5, Lifetime: [0.6, 0.9], Speed: [25, 32], Shape: 'Disc', ShapeStyle: 'Surface', RotSpeed: [-300, 300], Drag: 3, mode: 'burst', emitCount: 40, Enabled: false },
      { Name: 'Snow Puff', ...T('rbx_smoke'), Color: '#ffffff', Size: [[0, 2], [1, 5]], Transparency: [[0, 0.4], [1, 1]], Lifetime: [0.8, 1.2], Speed: [20, 26], Shape: 'Disc', ShapeStyle: 'Surface', Drag: 4, mode: 'burst', emitCount: 20, Enabled: false },
    ],
  },
  {
    name: 'Lightning Strike', category: 'Abilities', desc: 'Bolt from the sky with a blinding flash and sparks.', partSize: [1, 30, 1], trigger: SCRIPTED, burstLoop: 1.8,
    layers: [
      { Name: 'Bolt', ...T('lightning'), Color: ['#ffffff', '#9fd8ff'], Size: 30, Squash: -2.4, LightEmission: 1, Brightness: 4, Lifetime: [0.12, 0.18], Speed: 0, Shape: 'Box', Orientation: 'FacingCameraWorldUp', mode: 'burst', emitCount: 2, Enabled: false },
      { Name: 'Flash', ...T('rbx_ff_glow'), point: true, Color: '#dff2ff', Size: [12, 20], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 3, Lifetime: [0.2, 0.2], Speed: 0, mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Ground Sparks', ...T('rbx_fire_sparks'), Color: '#b8e8ff', Size: [[0, 0.4], [1, 0]], Squash: -2, LightEmission: 1, Brightness: 3, Lifetime: [0.3, 0.6], Speed: [15, 30], EmissionDirection: 'Bottom', SpreadAngle: [80, 80], Acceleration: [0, -30, 0], Orientation: 'VelocityParallel', mode: 'burst', emitCount: 30, Enabled: false },
    ],
  },
  {
    name: 'Rock Eruption', category: 'Abilities', desc: 'Boulders and dust burst out of the ground.', partSize: [5, 0.4, 5], trigger: SCRIPTED, burstLoop: 2.2,
    layers: [
      { Name: 'Rocks', ...T('debris'), Color: '#7a6a58', Size: [[0, 1.4, 0.6], [1, 1.2]], Lifetime: [1.2, 1.6], Speed: [25, 35], Shape: 'Disc', SpreadAngle: [25, 25], RotSpeed: [-200, 200], Acceleration: [0, -70, 0], mode: 'burst', emitCount: 14, Enabled: false },
      { Name: 'Dust', ...T('rbx_smoke'), Color: '#a8957a', Size: [[0, 2], [1, 8]], Transparency: [[0, 0.3], [1, 1]], Lifetime: [1.2, 1.8], Speed: [8, 14], Shape: 'Disc', SpreadAngle: [50, 50], Drag: 2.5, Rotation: [0, 360], mode: 'burst', emitCount: 18, Enabled: false },
    ],
  },
  {
    name: 'Tornado', category: 'Abilities', desc: 'Spinning column of wind and debris.', partSize: [4, 14, 4],
    layers: [
      { Name: 'Funnel', ...T('rbx_smoke'), Color: ['#c8c8c8', '#6a6a6a'], Size: [[0, 2], [1, 6]], Transparency: [[0, 1], [0.3, 0.45], [1, 1]], Rate: 60, Lifetime: [1.5, 2], Speed: [4, 6], Shape: 'Cylinder', ShapeStyle: 'Surface', ShapeInOut: 'Inward', Rotation: [0, 360], RotSpeed: [200, 300], Acceleration: [0, 8, 0] },
      { Name: 'Debris', ...T('debris'), Color: '#6b5a48', Size: [[0, 0.5, 0.3], [1, 0.4]], Rate: 15, Lifetime: [1.5, 2.5], Speed: [2, 5], Shape: 'Cylinder', ShapeStyle: 'Surface', RotSpeed: [-500, 500], Acceleration: [0, 6, 0] },
    ],
  },
  {
    name: 'Teleport Out', category: 'Abilities', desc: 'Particles implode and vanish with a flash.', partSize: [3, 5, 3], trigger: SCRIPTED, burstLoop: 2,
    layers: [
      { Name: 'Implode', ...T('rbx_ff_glow'), Color: ['#b9a1ff', '#ffffff'], Size: [[0, 0.6], [1, 0.1]], LightEmission: 1, Brightness: 2, Lifetime: [0.5, 0.5], Speed: [6, 6], Shape: 'Cylinder', ShapeStyle: 'Surface', ShapeInOut: 'Inward', mode: 'burst', emitCount: 60, Enabled: false },
      { Name: 'Flash', ...T('rbx_sparkles'), point: true, Color: '#ffffff', Size: [[0, 0], [0.3, 8], [1, 0]], LightEmission: 1, Brightness: 3, Lifetime: [0.3, 0.3], Speed: 0, Rotation: [0, 90], mode: 'burst', emitCount: 1, emitDelay: 0.45, Enabled: false },
    ],
  },
  {
    name: 'Teleport In', category: 'Abilities', desc: 'A beam of light drops in, leaving sparkles.', partSize: [3, 0.4, 3], trigger: SCRIPTED, burstLoop: 2,
    layers: [
      { Name: 'Beam', ...T('beam'), point: true, Color: '#cfe8ff', Size: [[0, 4], [1, 2]], Squash: -2.8, Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 2, Lifetime: [0.5, 0.5], Speed: 0, Orientation: 'FacingCameraWorldUp', mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Sparkles', ...T('rbx_sparkles'), Color: '#e6f4ff', Size: [[0, 0.8], [1, 0]], LightEmission: 1, Lifetime: [0.6, 1], Speed: [3, 8], Shape: 'Disc', SpreadAngle: [20, 20], mode: 'burst', emitCount: 30, Enabled: false },
      { Name: 'Ring', ...T('ring'), point: true, Color: '#9fd0ff', Size: [1, 8], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Lifetime: [0.4, 0.4], Speed: 0.01, Orientation: 'VelocityPerpendicular', mode: 'burst', emitCount: 1, Enabled: false },
    ],
  },
  {
    name: 'Dash Trail', category: 'Abilities', desc: 'Streaky afterimage trail that follows every character.', partSize: [2, 3, 1], trigger: CHAR(),
    layers: [
      { Name: 'Streaks', ...T('rbx_ff_glow'), Color: ['#ffffff', '#6ad8ff'], Size: [[0, 1.5], [1, 0]], Transparency: [[0, 0.5], [1, 1]], LightEmission: 1, Rate: 40, Lifetime: [0.3, 0.4], Speed: 0, VelocityInheritance: 0 },
    ],
  },
  {
    name: 'Shield Bubble', category: 'Abilities', desc: 'Hexagon force-field bubble. Start/stop with ParticlyControl.', partSize: [7, 7, 7], trigger: SCRIPTED,
    layers: [
      { Name: 'Hex Cells', ...T('hexagon'), Color: '#4ad8ff', Size: [[0, 0], [0.3, 1.5], [0.7, 1.5], [1, 0]], Transparency: 0.3, LightEmission: 1, Brightness: 2, Rate: 60, Lifetime: [0.8, 1.2], Speed: 0, Shape: 'Sphere', ShapeStyle: 'Surface', LockedToPart: true },
      { Name: 'Glow', ...T('rbx_ff_glow'), point: true, Color: '#4ad8ff', Size: 9, Transparency: 0.85, LightEmission: 1, Rate: 3, Lifetime: [1, 1], Speed: 0, LockedToPart: true },
    ],
  },
  {
    name: 'Shield Hit', category: 'Abilities', desc: 'Impact ripple when something hits a shield.', partSize: [1, 1, 1], trigger: SCRIPTED, burstLoop: 1,
    layers: [
      { Name: 'Ripple', ...T('hexagon'), point: true, Color: ['#ffffff', '#4ad8ff'], Size: [1, 6], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 2, Lifetime: [0.35, 0.35], Speed: 0, mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Sparks', ...T('rbx_fire_sparks'), Color: '#b8f0ff', Size: [0.3, 0], LightEmission: 1, Lifetime: [0.2, 0.4], Speed: [8, 16], Shape: 'Sphere', Drag: 4, mode: 'burst', emitCount: 15, Enabled: false },
    ],
  },
  {
    name: 'Heal Station', category: 'Abilities', desc: 'Prompt "Heal": green rings and plus signs (add your own healing code).', partSize: [4, 0.4, 4], trigger: PROMPT('Heal', 2, 3),
    layers: [
      { Name: 'Plus Signs', ...T('g_plus'), Color: '#6aff8a', Size: [[0, 0], [0.2, 1], [1, 0.6]], Transparency: [[0, 0], [0.8, 0], [1, 1]], LightEmission: 0.8, Rate: 12, Lifetime: [1, 1.6], Speed: [3, 5], Shape: 'Disc' },
      { Name: 'Rings', ...T('ring'), point: true, Color: '#6aff8a', Size: [2, 8], Transparency: [[0, 0.2], [1, 1]], LightEmission: 1, Rate: 2, Lifetime: [0.8, 0.8], Speed: [2, 2], Orientation: 'VelocityPerpendicular' },
      { Name: 'Motes', ...T('rbx_ff_glow'), Color: '#c8ffb0', Size: [[0, 0], [0.3, 0.4], [1, 0]], LightEmission: 1, Rate: 25, Lifetime: [1, 1.6], Speed: [2, 4], Shape: 'Disc' },
    ],
  },
  {
    name: 'Mana Regen', category: 'Abilities', desc: 'Blue motes rising around every character.', partSize: [3, 5, 3], trigger: CHAR(),
    layers: [
      { Name: 'Motes', ...T('rbx_ff_glow'), Color: ['#a8d8ff', '#3a6aff'], Size: [[0, 0], [0.3, 0.5], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 15, Lifetime: [1, 1.6], Speed: [1.5, 3], Shape: 'Cylinder', ShapeStyle: 'Surface', LockedToPart: true },
    ],
  },
  {
    name: 'Power-Up Aura', category: 'Abilities', desc: 'Golden flame aura around every character (anime power-up).', partSize: [3, 5, 2], trigger: CHAR(),
    layers: [
      { Name: 'Aura Flames', ...T('rbx_fire'), Color: ['#ffffff', '#ffd23a', '#ff8a1a'], Size: [[0, 1.5, 0.4], [1, 0.3]], Squash: -1, Transparency: [[0, 0.3], [1, 1]], LightEmission: 1, Brightness: 2, Rate: 60, Lifetime: [0.4, 0.6], Speed: [6, 9], Shape: 'Cylinder', ShapeStyle: 'Surface', Orientation: 'VelocityParallel', LockedToPart: true },
      { Name: 'Sparks', ...T('rbx_sparkles'), Color: '#fff6b3', Size: [[0, 0], [0.5, 0.6], [1, 0]], LightEmission: 1, Rate: 15, Lifetime: [0.5, 0.8], Speed: [4, 8], Shape: 'Cylinder', LockedToPart: true },
    ],
  },
  {
    name: 'Ki Charge', category: 'Abilities', desc: 'Energy streaks rushing inward to a glowing core.', partSize: [6, 6, 6], trigger: SCRIPTED,
    layers: [
      { Name: 'Inflow', ...T('rbx_fire_sparks'), Color: ['#ffffff', '#ffe36a'], Size: [[0, 0], [0.3, 0.6], [1, 0.2]], Squash: -2, LightEmission: 1, Brightness: 2, Rate: 80, Lifetime: [0.4, 0.4], Speed: [8, 8], Shape: 'Sphere', ShapeStyle: 'Surface', ShapeInOut: 'Inward', Orientation: 'VelocityParallel' },
      { Name: 'Core', ...T('rbx_ff_glow'), point: true, Color: '#fff3a0', Size: [[0, 1.5], [0.5, 2.5], [1, 1.5]], Transparency: 0.2, LightEmission: 1, Brightness: 3, Rate: 8, Lifetime: [0.4, 0.4], Speed: 0, LockedToPart: true },
    ],
  },
  {
    name: 'Stun Stars', category: 'Abilities', desc: 'Dizzy stars above a stunned character\'s head.', partSize: [2, 0.5, 2], trigger: CHAR({ attachTo: 'Head' }),
    layers: [
      { Name: 'Stars', ...T('star5'), Color: '#ffe23a', Size: [[0, 0], [0.2, 0.6], [0.8, 0.6], [1, 0]], LightEmission: 0.6, Rate: 6, Lifetime: [0.8, 1], Speed: [0.5, 1], EmissionDirection: 'Top', Shape: 'Disc', ShapeStyle: 'Surface', RotSpeed: [-180, 180], LockedToPart: true },
    ],
  },
  {
    name: 'Sleeping Zzz', category: 'Abilities', desc: 'Z letters drifting up from a sleeping character.', partSize: [0.6, 0.6, 0.6], trigger: CHAR({ attachTo: 'Head' }),
    layers: [
      { Name: 'Zzz', ...T('g_z'), Color: '#ffffff', Size: [[0, 0.3], [1, 1.2]], Transparency: [[0, 0], [0.7, 0], [1, 1]], Rate: 1.5, Lifetime: [2, 2.5], Speed: [1, 1.5], EmissionDirection: 'Top', SpreadAngle: [20, 20], Rotation: [-20, 20], Acceleration: [0.5, 0, 0] },
    ],
  },
  {
    name: 'Music Notes', category: 'Abilities', desc: 'Notes floating from a singer, boombox or jukebox.', partSize: [1, 1, 1],
    layers: [
      { Name: 'Notes', ...T('g_note'), Color: ['#ff6ad5', '#6ad8ff', '#ffe23a'], Size: [[0, 0], [0.2, 0.9], [1, 0.7]], Transparency: [[0, 0], [0.8, 0], [1, 1]], Rate: 3, Lifetime: [1.8, 2.4], Speed: [1.5, 2.5], EmissionDirection: 'Top', SpreadAngle: [35, 35], Rotation: [-20, 20], RotSpeed: [-30, 30] },
    ],
  },
  {
    name: 'Angry Steam', category: 'Abilities', desc: 'Cartoon steam puffs from an angry character\'s head.', partSize: [1, 0.4, 1], trigger: CHAR({ attachTo: 'Head' }),
    layers: [
      { Name: 'Puffs', ...T('cloud'), Color: '#ffffff', Size: [[0, 0.3], [1, 1.4]], Transparency: [[0, 0], [0.6, 0.2], [1, 1]], Rate: 5, Lifetime: [0.6, 0.9], Speed: [4, 6], EmissionDirection: 'Top', SpreadAngle: [40, 10], Drag: 3 },
    ],
  },
  {
    name: 'Alert!', category: 'Abilities', desc: 'Exclamation pop over an NPC that spotted you.', partSize: [0.5, 0.5, 0.5], trigger: SCRIPTED, burstLoop: 1.5,
    layers: [
      { Name: 'Bang', ...T('g_bang'), point: true, Color: '#ff3a3a', Size: [[0, 0], [0.15, 2.2], [0.3, 1.6], [0.85, 1.6], [1, 0]], Lifetime: [1, 1], Speed: [0.5, 0.5], EmissionDirection: 'Top', mode: 'burst', emitCount: 1, Enabled: false },
    ],
  },
  {
    name: 'Confused ?', category: 'Abilities', desc: 'Question marks floating over a confused character.', partSize: [1.5, 0.4, 1.5], trigger: CHAR({ attachTo: 'Head' }),
    layers: [
      { Name: 'Marks', ...T('g_question'), Color: '#ffe23a', Size: [[0, 0], [0.2, 0.8], [1, 0.6]], Transparency: [[0, 0], [0.8, 0], [1, 1]], Rate: 2, Lifetime: [1.2, 1.6], Speed: [1, 1.5], EmissionDirection: 'Top', Shape: 'Disc', Rotation: [-25, 25] },
    ],
  },
  {
    name: 'Double Jump Ring', category: 'Abilities', desc: 'Puff ring under the feet for double jumps (burst from your jump script).', partSize: [1, 0.2, 1], trigger: SCRIPTED, burstLoop: 1.2,
    layers: [
      { Name: 'Ring', ...T('ring'), point: true, Color: '#ffffff', Size: [1, 7], Transparency: [[0, 0.1], [1, 1]], LightEmission: 0.5, Lifetime: [0.35, 0.35], Speed: 0.01, Orientation: 'VelocityPerpendicular', mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Puffs', ...T('rbx_smoke'), Color: '#ffffff', Size: [[0, 0.6], [1, 2]], Transparency: [[0, 0.3], [1, 1]], Lifetime: [0.4, 0.6], Speed: [8, 10], Shape: 'Disc', ShapeStyle: 'Surface', Drag: 5, mode: 'burst', emitCount: 10, Enabled: false },
    ],
  },
  {
    name: 'Footstep Dust', category: 'Abilities', desc: 'Light dust kicked up at every character\'s feet.', partSize: [2, 0.2, 1], trigger: CHAR(),
    layers: [
      { Name: 'Dust', ...T('rbx_smoke'), Color: '#cbb796', Size: [[0, 0.5], [1, 2]], Transparency: [[0, 0.5], [1, 1]], Rate: 6, Lifetime: [0.6, 0.9], Speed: [1, 2], EmissionDirection: 'Bottom', SpreadAngle: [60, 60], Acceleration: [0, 3, 0], Drag: 2 },
    ],
  },
  {
    name: 'Invisibility Shimmer', category: 'Abilities', desc: 'Faint shimmering sparkles when a character turns invisible.', partSize: [3, 5, 2], trigger: SCRIPTED,
    layers: [
      { Name: 'Shimmer', ...T('rbx_sparkles'), Color: '#e6f0ff', Size: [[0, 0], [0.5, 0.4], [1, 0]], Transparency: 0.3, LightEmission: 1, Rate: 30, Lifetime: [0.4, 0.8], Speed: 0, Shape: 'Box', LockedToPart: true },
    ],
  },

  /* ------------------------------ Weapons ------------------------------ */
  {
    name: 'Bullet Impact (Dirt)', category: 'Weapons', desc: 'Dirt puff + clods. Use playAt() from the ModuleScript at the hit position.', partSize: [0.3, 0.3, 0.3], trigger: SCRIPTED, burstLoop: 0.8,
    layers: [
      { Name: 'Puff', ...T('rbx_smoke'), Color: '#9a8061', Size: [[0, 0.4], [1, 2.2]], Transparency: [[0, 0.3], [1, 1]], Lifetime: [0.5, 0.8], Speed: [3, 6], SpreadAngle: [30, 30], Drag: 4, mode: 'burst', emitCount: 5, Enabled: false },
      { Name: 'Clods', ...T('debris'), Color: '#5c4630', Size: [[0, 0.3, 0.1], [1, 0.2]], Lifetime: [0.4, 0.7], Speed: [8, 14], SpreadAngle: [35, 35], Acceleration: [0, -50, 0], RotSpeed: [-300, 300], mode: 'burst', emitCount: 8, Enabled: false },
    ],
  },
  {
    name: 'Bullet Impact (Metal)', category: 'Weapons', desc: 'Bright ricochet sparks.', partSize: [0.3, 0.3, 0.3], trigger: SCRIPTED, burstLoop: 0.8,
    layers: [
      { Name: 'Sparks', ...T('rbx_fire_sparks'), Color: ['#ffffff', '#ffc84a'], Size: [[0, 0.3], [1, 0]], Squash: -2.5, LightEmission: 1, Brightness: 3, Lifetime: [0.15, 0.35], Speed: [15, 30], SpreadAngle: [50, 50], Drag: 3, Acceleration: [0, -20, 0], Orientation: 'VelocityParallel', mode: 'burst', emitCount: 12, Enabled: false },
      { Name: 'Flash', ...T('rbx_ff_glow'), point: true, Color: '#fff2c0', Size: [1.5, 0], LightEmission: 1, Brightness: 3, Lifetime: [0.06, 0.06], Speed: 0, mode: 'burst', emitCount: 1, Enabled: false },
    ],
  },
  {
    name: 'Bullet Impact (Wood)', category: 'Weapons', desc: 'Splinters and sawdust.', partSize: [0.3, 0.3, 0.3], trigger: SCRIPTED, burstLoop: 0.8,
    layers: [
      { Name: 'Splinters', ...T('shard'), Color: '#a87a48', Size: [[0, 0.4, 0.15], [1, 0.3]], Lifetime: [0.4, 0.7], Speed: [8, 14], SpreadAngle: [40, 40], RotSpeed: [-500, 500], Acceleration: [0, -40, 0], mode: 'burst', emitCount: 8, Enabled: false },
      { Name: 'Sawdust', ...T('rbx_smoke'), Color: '#c8a070', Size: [[0, 0.3], [1, 1.6]], Transparency: [[0, 0.4], [1, 1]], Lifetime: [0.4, 0.7], Speed: [2, 4], SpreadAngle: [30, 30], Drag: 4, mode: 'burst', emitCount: 4, Enabled: false },
    ],
  },
  {
    name: 'Bullet Impact (Water)', category: 'Weapons', desc: 'Small water splash column.', partSize: [0.3, 0.3, 0.3], trigger: SCRIPTED, burstLoop: 0.8,
    layers: [
      { Name: 'Splash', ...T('droplet'), Color: '#e6f6ff', Size: [[0, 0.35, 0.1], [1, 0.2]], Transparency: [[0, 0.1], [1, 0.6]], Lifetime: [0.5, 0.8], Speed: [10, 16], SpreadAngle: [12, 12], Acceleration: [0, -50, 0], Orientation: 'VelocityParallel', mode: 'burst', emitCount: 14, Enabled: false },
      { Name: 'Ripple', ...T('ring'), point: true, Color: '#ffffff', Size: [0.5, 4], Transparency: [[0, 0.3], [1, 1]], Lifetime: [0.6, 0.6], Speed: 0.01, Orientation: 'VelocityPerpendicular', mode: 'burst', emitCount: 1, Enabled: false },
    ],
  },
  {
    name: 'Shotgun Blast', category: 'Weapons', desc: 'Wide muzzle flash with smoke, pointing Front (-Z).', partSize: [0.4, 0.4, 0.4], trigger: SCRIPTED, burstLoop: 0.8,
    layers: [
      { Name: 'Flash', ...T('rbx_fire'), Color: ['#fffbe0', '#ff9a2a'], Size: [[0, 1.6, 0.4], [1, 0.6]], Squash: -0.8, LightEmission: 1, Brightness: 3, Lifetime: [0.06, 0.1], Speed: [15, 25], EmissionDirection: 'Front', SpreadAngle: [20, 20], Orientation: 'VelocityParallel', mode: 'burst', emitCount: 8, Enabled: false },
      { Name: 'Smoke', ...T('rbx_smoke'), Color: '#a0a0a0', Size: [[0, 0.8], [1, 3]], Transparency: [[0, 0.5], [1, 1]], Lifetime: [0.6, 1], Speed: [5, 8], EmissionDirection: 'Front', SpreadAngle: [25, 25], Drag: 3, mode: 'burst', emitCount: 6, Enabled: false },
    ],
  },
  {
    name: 'Rocket Trail', category: 'Weapons', desc: 'Flame + smoke trail for missiles. Attach to the projectile with Effect.create().', partSize: [0.5, 0.5, 0.5],
    layers: [
      { Name: 'Flame', ...T('rbx_fire'), Color: ['#ffffff', '#ffb347', '#ff4a0c'], Size: [[0, 1], [1, 0.2]], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 3, Rate: 60, Lifetime: [0.08, 0.14], Speed: [6, 10], EmissionDirection: 'Back', LockedToPart: true },
      { Name: 'Smoke', ...T('rbx_smoke'), Color: ['#ffffff', '#8a8a8a'], Size: [[0, 0.8], [1, 4, 1]], Transparency: [[0, 0.2], [1, 1]], Rate: 50, Lifetime: [1.5, 2.2], Speed: [0.5, 1.5], Rotation: [0, 360], RotSpeed: [-30, 30] },
    ],
  },
  {
    name: 'Grenade Explosion', category: 'Weapons', desc: 'Compact explosion with dirt, shrapnel and smoke.', partSize: [1, 1, 1], trigger: SCRIPTED, burstLoop: 2.5,
    layers: [
      { Name: 'Blast', ...T('rbx_exp_core'), point: true, Color: [[0, '#ffffff'], [0.3, '#ffb347'], [1, '#5a1a05']], Size: [[0, 2], [0.3, 8], [1, 9]], Transparency: [[0, 0], [1, 1]], LightEmission: 0.9, Brightness: 2, Lifetime: [0.4, 0.6], Speed: [4, 10], Shape: 'Sphere', Drag: 5, Rotation: [0, 360], mode: 'burst', emitCount: 12, Enabled: false },
      { Name: 'Dirt', ...T('debris'), Color: '#5c4630', Size: [[0, 0.5, 0.2], [1, 0.4]], Lifetime: [0.8, 1.2], Speed: [25, 40], SpreadAngle: [50, 50], Acceleration: [0, -60, 0], RotSpeed: [-300, 300], mode: 'burst', emitCount: 25, Enabled: false },
      { Name: 'Smoke', ...T('rbx_exp_smoke'), Color: '#3a3530', Size: [[0, 3], [1, 10]], Transparency: [[0, 0.3], [1, 1]], Lifetime: [1.5, 2.5], Speed: [5, 10], Shape: 'Sphere', Drag: 2, Acceleration: [0, 3, 0], mode: 'burst', emitCount: 10, emitDelay: 0.05, Enabled: false },
    ],
  },
  {
    name: 'Smoke Grenade', category: 'Weapons', desc: 'Thick lingering smoke screen. Start with ParticlyControl.play(10).', partSize: [1, 0.5, 1], trigger: SCRIPTED,
    layers: [
      { Name: 'Smoke', ...T('rbx_smoke'), Color: ['#d0d0d0', '#a8a8a8'], Size: [[0, 2], [1, 14, 3]], Transparency: [[0, 0.1], [0.7, 0.3], [1, 1]], Rate: 25, Lifetime: [5, 7], Speed: [3, 6], SpreadAngle: [70, 70], Rotation: [0, 360], RotSpeed: [-10, 10], Drag: 0.8 },
    ],
  },
  {
    name: 'Flashbang', category: 'Weapons', desc: 'Blinding white flash and sparks.', partSize: [0.5, 0.5, 0.5], trigger: SCRIPTED, burstLoop: 1.5,
    layers: [
      { Name: 'Flash', ...T('rbx_ff_glow'), point: true, Color: '#ffffff', Size: [[0, 10], [1, 30]], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 5, Lifetime: [0.4, 0.4], Speed: 0, mode: 'burst', emitCount: 2, Enabled: false },
      { Name: 'Sparks', ...T('rbx_fire_sparks'), Color: '#ffffff', Size: [0.3, 0], LightEmission: 1, Lifetime: [0.3, 0.6], Speed: [15, 25], Shape: 'Sphere', Drag: 3, mode: 'burst', emitCount: 30, Enabled: false },
    ],
  },
  {
    name: 'Laser Impact', category: 'Weapons', desc: 'Sci-fi laser hit: glow, scorch sparks.', partSize: [0.3, 0.3, 0.3], trigger: SCRIPTED, burstLoop: 0.8,
    layers: [
      { Name: 'Glow', ...T('rbx_ff_glow'), point: true, Color: ['#ffffff', '#ff3a6a'], Size: [[0, 2.5], [1, 0]], LightEmission: 1, Brightness: 3, Lifetime: [0.2, 0.2], Speed: 0, mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Sparks', ...T('rbx_fire_sparks'), Color: '#ff6a8a', Size: [[0, 0.3], [1, 0]], Squash: -2, LightEmission: 1, Brightness: 2, Lifetime: [0.2, 0.4], Speed: [10, 20], SpreadAngle: [60, 60], Drag: 4, Orientation: 'VelocityParallel', mode: 'burst', emitCount: 14, Enabled: false },
    ],
  },
  {
    name: 'Plasma Bolt Trail', category: 'Weapons', desc: 'Glowing trail for energy projectiles.', partSize: [0.4, 0.4, 0.4],
    layers: [
      { Name: 'Core', ...T('rbx_ff_glow'), Color: ['#ffffff', '#3cff9a'], Size: [2, 0], LightEmission: 1, Brightness: 3, Rate: 80, Lifetime: [0.2, 0.25], Speed: 0 },
      { Name: 'Bits', ...T('rbx_fire_sparks'), Color: '#9affc8', Size: [0.25, 0], LightEmission: 1, Rate: 30, Lifetime: [0.3, 0.5], Speed: [1, 3], Shape: 'Sphere', SpreadAngle: [180, 180] },
    ],
  },
  {
    name: 'Shell Casings', category: 'Weapons', desc: 'Brass casings ejected to the side (Right).', partSize: [0.2, 0.2, 0.2], trigger: SCRIPTED, burstLoop: 0.5,
    layers: [
      { Name: 'Casings', ...T('square'), Color: '#d4a640', Size: 0.15, Squash: -1.2, LightInfluence: 1, Lifetime: [0.6, 0.8], Speed: [6, 9], EmissionDirection: 'Right', SpreadAngle: [15, 15], RotSpeed: [-900, 900], Acceleration: [0, -60, 0], mode: 'burst', emitCount: 1, Enabled: false },
    ],
  },
  {
    name: 'Critical Hit', category: 'Weapons', desc: 'Big punchy hit: star burst, flash and sparks.', partSize: [0.5, 0.5, 0.5], trigger: SCRIPTED, burstLoop: 1,
    layers: [
      { Name: 'Star', ...T('star6'), point: true, Color: ['#ffffff', '#ffd23a'], Size: [[0, 1], [0.3, 5], [1, 6]], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 2, Lifetime: [0.3, 0.3], Speed: 0, Rotation: [0, 45], mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Sparks', ...T('rbx_fire_sparks'), Color: '#ffe36a', Size: [[0, 0.5], [1, 0]], Squash: -2, LightEmission: 1, Brightness: 3, Lifetime: [0.3, 0.5], Speed: [20, 35], Shape: 'Sphere', Drag: 4, Orientation: 'VelocityParallel', mode: 'burst', emitCount: 20, Enabled: false },
    ],
  },
  {
    name: 'Fire Arrow Trail', category: 'Weapons', desc: 'Small flame and smoke trail for arrows.', partSize: [0.2, 0.2, 0.2],
    layers: [
      { Name: 'Flame', ...T('rbx_fire'), Color: ['#fff3b0', '#ff6a1a'], Size: [[0, 0.8], [1, 0.1]], Transparency: [[0, 0.1], [1, 1]], LightEmission: 1, Rate: 60, Lifetime: [0.2, 0.3], Speed: [0.5, 1], Shape: 'Sphere', SpreadAngle: [180, 180] },
      { Name: 'Smoke', ...T('rbx_smoke'), Color: '#666666', Size: [[0, 0.4], [1, 1.6]], Transparency: [[0, 0.5], [1, 1]], Rate: 20, Lifetime: [0.6, 1], Speed: [0.5, 1] },
    ],
  },
  {
    name: 'Magic Missile Trail', category: 'Weapons', desc: 'Sparkly arcane projectile trail.', partSize: [0.4, 0.4, 0.4],
    layers: [
      { Name: 'Core', ...T('rbx_ff_glow'), Color: ['#ffffff', '#c04aff'], Size: [1.6, 0], LightEmission: 1, Brightness: 2, Rate: 70, Lifetime: [0.25, 0.3], Speed: 0 },
      { Name: 'Glitter', ...T('rbx_sparkles'), Color: ['#ffd6ff', '#8a4aff'], Size: [[0, 0.5], [1, 0]], LightEmission: 1, Rate: 40, Lifetime: [0.4, 0.8], Speed: [0.5, 2], Shape: 'Sphere', SpreadAngle: [180, 180], Rotation: [0, 90], Acceleration: [0, -3, 0] },
    ],
  },

  /* ------------------------------ Environment ------------------------------ */
  {
    name: 'Chimney Smoke', category: 'Environment', desc: 'Lazy grey smoke drifting from a chimney.', partSize: [1.5, 0.5, 1.5],
    layers: [
      { Name: 'Smoke', ...T('rbx_smoke'), Color: ['#b0b0b0', '#7a7a7a'], Size: [[0, 1.5], [1, 7, 1.5]], Transparency: [[0, 0.4], [1, 1]], Rate: 4, Lifetime: [5, 7], Speed: [1.5, 2.5], SpreadAngle: [8, 8], Rotation: [0, 360], RotSpeed: [-8, 8], Acceleration: [0.6, 0.2, 0] },
    ],
  },
  {
    name: 'Candle Flame', category: 'Environment', desc: 'Tiny flickering candle flame with glow.', partSize: [0.2, 0.2, 0.2],
    layers: [
      { Name: 'Flame', ...T('rbx_fire'), Color: ['#fff6d0', '#ffa83a'], Size: [[0, 0.35, 0.05], [1, 0.05]], Transparency: [[0, 0.1], [1, 1]], LightEmission: 1, Rate: 30, Lifetime: [0.3, 0.45], Speed: [0.8, 1.2], LockedToPart: true },
      { Name: 'Glow', ...T('rbx_ff_glow'), point: true, Color: '#ffb347', Size: [[0, 1.4], [0.5, 1.6], [1, 1.4]], Transparency: 0.75, LightEmission: 1, Rate: 3, Lifetime: [0.5, 0.6], Speed: 0, LockedToPart: true },
    ],
  },
  {
    name: 'Lantern Moths', category: 'Environment', desc: 'Soft glowing specks fluttering around a lamp.', partSize: [3, 3, 3],
    layers: [
      { Name: 'Moths', ...T('rbx_ff_glow'), Color: '#ffe8b0', Size: [[0, 0], [0.2, 0.2], [0.8, 0.2], [1, 0]], LightEmission: 1, Rate: 6, Lifetime: [2, 3], Speed: [0.5, 1.5], Shape: 'Sphere', SpreadAngle: [180, 180], Drag: 0.5 },
    ],
  },
  {
    name: 'Geyser', category: 'Environment', desc: 'Periodic eruption of water and steam.', partSize: [2, 0.4, 2], burstLoop: 4,
    layers: [
      { Name: 'Water Column', ...T('droplet'), Color: ['#ffffff', '#bfe8ff'], Size: [[0, 0.8, 0.3], [1, 0.5]], Transparency: [[0, 0.1], [1, 0.6]], Lifetime: [1.5, 2], Speed: [30, 40], SpreadAngle: [6, 6], Acceleration: [0, -30, 0], Orientation: 'VelocityParallel', mode: 'burst', emitCount: 120, Enabled: false },
      { Name: 'Steam', ...T('rbx_smoke'), Color: '#ffffff', Size: [[0, 3], [1, 12]], Transparency: [[0, 0.4], [1, 1]], Lifetime: [2.5, 3.5], Speed: [15, 22], SpreadAngle: [10, 10], Drag: 1.5, Rotation: [0, 360], mode: 'burst', emitCount: 20, Enabled: false },
      { Name: 'Idle Steam', ...T('rbx_smoke'), Color: '#ffffff', Size: [[0, 1], [1, 4]], Transparency: [[0, 0.6], [1, 1]], Rate: 3, Lifetime: [2, 3], Speed: [2, 3] },
    ],
  },
  {
    name: 'Volcano Eruption', category: 'Environment', desc: 'Lava bombs, ash column and glow from a crater.', partSize: [10, 1, 10],
    layers: [
      { Name: 'Ash Column', ...T('rbx_exp_smoke'), Color: ['#4a3a30', '#1a1a1a'], Size: [[0, 8], [1, 30, 6]], Transparency: [[0, 0.2], [1, 1]], Rate: 10, Lifetime: [6, 8], Speed: [18, 26], SpreadAngle: [12, 12], Rotation: [0, 360], RotSpeed: [-8, 8], Drag: 0.6 },
      { Name: 'Lava Bombs', ...T('rbx_ff_glow'), Color: ['#ffe36a', '#ff4a0c', '#5a1a05'], Size: [[0, 1.5, 0.5], [1, 1]], LightEmission: 1, Brightness: 2, Rate: 12, Lifetime: [2.5, 3.5], Speed: [40, 60], SpreadAngle: [25, 25], Acceleration: [0, -40, 0] },
      { Name: 'Crater Glow', ...T('rbx_ff_glow'), point: true, Color: '#ff5a10', Size: 16, Transparency: 0.6, LightEmission: 1, Rate: 2, Lifetime: [1, 1], Speed: 0 },
    ],
  },
  {
    name: 'Ash Fall', category: 'Environment', desc: 'Grey ash flakes drifting down after a fire or eruption.', partSize: [40, 1, 40],
    layers: [
      { Name: 'Ash', ...T('rbx_fire_sparks'), Color: '#8a8580', Size: [[0, 0.25, 0.1], [1, 0.25, 0.1]], Transparency: [[0, 1], [0.1, 0.2], [0.9, 0.2], [1, 1]], Rate: 120, Lifetime: [6, 9], Speed: [1, 2], EmissionDirection: 'Bottom', SpreadAngle: [40, 40], RotSpeed: [-90, 90], Acceleration: [0.4, 0, 0.2] },
    ],
  },
  {
    name: 'Floating Embers', category: 'Environment', desc: 'Ambient embers drifting up through a scene.', partSize: [20, 2, 20],
    layers: [
      { Name: 'Embers', ...T('rbx_fire_sparks'), Color: ['#ffe08a', '#ff5a1a'], Size: [[0, 0], [0.2, 0.3, 0.1], [1, 0]], LightEmission: 1, Brightness: 3, Rate: 25, Lifetime: [4, 6], Speed: [1, 3], SpreadAngle: [40, 40], Acceleration: [0.4, 0.5, 0.2] },
    ],
  },
  {
    name: 'Sunbeam Dust Motes', category: 'Environment', desc: 'Tiny bright specks floating in a shaft of light.', partSize: [6, 8, 6],
    layers: [
      { Name: 'Motes', ...T('rbx_ff_glow'), Color: '#fff6dc', Size: [[0, 0], [0.3, 0.12], [0.7, 0.12], [1, 0]], LightEmission: 1, Rate: 30, Lifetime: [4, 6], Speed: [0.1, 0.4], Shape: 'Box', SpreadAngle: [180, 180] },
      { Name: 'Light Ray', ...T('beam'), point: true, Color: '#fff2c8', Size: 9, Squash: -2.2, Transparency: [[0, 1], [0.5, 0.85], [1, 1]], LightEmission: 1, Rate: 1, Lifetime: [3, 3], Speed: 0, Orientation: 'FacingCameraWorldUp' },
    ],
  },
  {
    name: 'Pollen', category: 'Environment', desc: 'Yellow pollen floating over meadows.', partSize: [30, 4, 30],
    layers: [
      { Name: 'Pollen', ...T('rbx_ff_glow'), Color: '#fff3a0', Size: [[0, 0], [0.2, 0.15], [0.8, 0.15], [1, 0]], Rate: 30, Lifetime: [5, 8], Speed: [0.2, 0.8], Shape: 'Box', SpreadAngle: [180, 180], Acceleration: [0.3, 0.05, 0.1] },
    ],
  },
  {
    name: 'Swamp Gas', category: 'Environment', desc: 'Greenish glowing marsh bubbles and mist.', partSize: [16, 0.5, 16],
    layers: [
      { Name: 'Mist', ...T('rbx_smoke'), Color: '#9fbf6a', Size: [[0, 4], [1, 9]], Transparency: [[0, 1], [0.4, 0.75], [1, 1]], Rate: 6, Lifetime: [6, 8], Speed: [0.3, 0.8], SpreadAngle: [80, 80], Orientation: 'FacingCameraWorldUp' },
      { Name: 'Will-o-wisps', ...T('rbx_ff_glow'), Color: '#c8ff7a', Size: [[0, 0], [0.3, 0.5], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 3, Lifetime: [3, 5], Speed: [0.3, 1], SpreadAngle: [60, 60] },
    ],
  },
  {
    name: 'Underwater Particles', category: 'Environment', desc: 'Drifting plankton specks for underwater scenes.', partSize: [40, 20, 40],
    layers: [
      { Name: 'Plankton', ...T('rbx_ff_glow'), Color: '#d8f6ff', Size: [[0, 0], [0.2, 0.15, 0.08], [0.8, 0.15], [1, 0]], Transparency: 0.3, Rate: 60, Lifetime: [6, 10], Speed: [0.1, 0.4], Shape: 'Box', SpreadAngle: [180, 180] },
      { Name: 'Bubbles', ...T('bubble'), Color: '#e6f8ff', Size: [[0, 0.2, 0.1], [1, 0.5]], Transparency: [[0, 0.3], [1, 0.6]], Rate: 4, Lifetime: [4, 6], Speed: [2, 3], Shape: 'Box', Acceleration: [0, 0.5, 0] },
    ],
  },
  {
    name: 'Sea Spray', category: 'Environment', desc: 'Waves crashing on rocks: periodic white spray.', partSize: [10, 0.5, 2], burstLoop: 3,
    layers: [
      { Name: 'Spray', ...T('rbx_smoke'), Color: '#ffffff', Size: [[0, 2], [1, 7]], Transparency: [[0, 0.2], [1, 1]], Lifetime: [1.2, 1.8], Speed: [12, 20], SpreadAngle: [30, 20], Drag: 2, Acceleration: [0, -10, 0], mode: 'burst', emitCount: 25, Enabled: false },
      { Name: 'Droplets', ...T('droplet'), Color: '#e6f6ff', Size: [[0, 0.3], [1, 0.2]], Lifetime: [0.8, 1.2], Speed: [15, 25], SpreadAngle: [35, 25], Acceleration: [0, -40, 0], mode: 'burst', emitCount: 60, Enabled: false },
    ],
  },
  {
    name: 'Rain Splashes', category: 'Environment', desc: 'Tiny splashes and ripples on the ground — pair with Rain.', partSize: [30, 0.2, 30],
    layers: [
      { Name: 'Ripples', ...T('ring'), Color: '#dfeeff', Size: [[0, 0.1], [1, 1.2]], Transparency: [[0, 0.3], [1, 1]], Rate: 120, Lifetime: [0.4, 0.5], Speed: 0.01, Orientation: 'VelocityPerpendicular' },
      { Name: 'Splashes', ...T('rbx_fire_sparks'), Color: '#e6f2ff', Size: [0.15, 0.05], Transparency: 0.3, Rate: 120, Lifetime: [0.2, 0.3], Speed: [3, 5], SpreadAngle: [40, 40], Acceleration: [0, -30, 0] },
    ],
  },
  {
    name: 'Meteor Shower', category: 'Environment', desc: 'Streaking meteors across the night sky (put the part high up).', partSize: [200, 1, 200],
    layers: [
      { Name: 'Meteors', ...T('rbx_fire_sparks'), Color: ['#ffffff', '#ffd6a0'], Size: [[0, 2], [1, 1]], Squash: -2.8, Transparency: [[0, 1], [0.1, 0], [0.8, 0], [1, 1]], LightEmission: 1, Brightness: 3, Rate: 2, Lifetime: [1, 1.5], Speed: [120, 160], EmissionDirection: 'Bottom', SpreadAngle: [40, 10], Orientation: 'VelocityParallel' },
    ],
  },
  {
    name: 'Aurora', category: 'Environment', desc: 'Huge soft green/purple curtains for night skies.', partSize: [300, 20, 40],
    layers: [
      { Name: 'Curtains', ...T('beam'), Color: ['#3aff9a', '#2ad8ff', '#b03aff'], Size: [[0, 60, 20], [1, 60, 20]], Squash: -1.5, Transparency: [[0, 1], [0.5, 0.6], [1, 1]], LightEmission: 1, Rate: 3, Lifetime: [8, 12], Speed: [0.5, 1], Shape: 'Box', Orientation: 'FacingCameraWorldUp' },
    ],
  },
  {
    name: 'Twinkling Stars', category: 'Environment', desc: 'Stars twinkling in a night sky dome.', partSize: [300, 60, 300],
    layers: [
      { Name: 'Stars', ...T('rbx_sparkles'), Color: '#ffffff', Size: [[0, 0], [0.5, 2, 1], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 40, Lifetime: [2, 4], Speed: 0, Shape: 'Box', Rotation: [0, 90] },
    ],
  },
  {
    name: 'Fireplace', category: 'Environment', desc: 'Cosy indoor fire with soft glow and crackling embers.', partSize: [3, 0.5, 1.5],
    layers: [
      { Name: 'Flames', ...T('rbx_fire'), Color: ['#ffe9a0', '#ff8a1a', '#c4260e'], Size: [[0, 1.6, 0.4], [1, 0.3]], Transparency: [[0, 0.2], [1, 1]], LightEmission: 1, Rate: 40, Lifetime: [0.6, 1], Speed: [2, 3.5], RotSpeed: [-40, 40] },
      { Name: 'Glow', ...T('rbx_ff_glow'), point: true, Color: '#ff8a2a', Size: [[0, 5], [0.5, 5.5], [1, 5]], Transparency: 0.8, LightEmission: 1, Rate: 3, Lifetime: [0.7, 0.8], Speed: 0 },
      { Name: 'Crackles', ...T('rbx_fire_sparks'), Color: '#ffcf6a', Size: [0.15, 0], LightEmission: 1, Brightness: 2, Rate: 6, Lifetime: [0.4, 0.8], Speed: [3, 6], SpreadAngle: [40, 40], Acceleration: [0, -6, 0] },
    ],
  },
  {
    name: 'Light Rays', category: 'Environment', desc: 'Soft god-rays through a window or forest canopy.', partSize: [10, 0.5, 10],
    layers: [
      { Name: 'Rays', ...T('beam'), Color: '#fff4d0', Size: [[0, 8, 2], [1, 8, 2]], Squash: -2.5, Transparency: [[0, 1], [0.5, 0.82], [1, 1]], LightEmission: 1, Rate: 2, Lifetime: [4, 6], Speed: 0, Shape: 'Box', Rotation: [-12, -8], Orientation: 'FacingCameraWorldUp' },
    ],
  },

  /* ------------------------------ Fun & Rewards ------------------------------ */
  {
    name: 'Gem Sparkle', category: 'Fun & Rewards', desc: 'Glints around a collectible gem.', partSize: [1.5, 1.5, 1.5],
    layers: [
      { Name: 'Glints', ...T('star4'), Color: '#ffffff', Size: [[0, 0], [0.4, 1], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 6, Lifetime: [0.4, 0.6], Speed: 0, Shape: 'Box', ShapeStyle: 'Surface', Rotation: [0, 45], LockedToPart: true },
      { Name: 'Glow', ...T('rbx_ff_glow'), point: true, Color: '#6ad8ff', Size: [[0, 3], [0.5, 3.5], [1, 3]], Transparency: 0.7, LightEmission: 1, Rate: 2, Lifetime: [1, 1], Speed: 0, LockedToPart: true },
    ],
  },
  {
    name: 'XP Orbs', category: 'Fun & Rewards', desc: 'Green experience orbs bubbling up — play on touch.', partSize: [2, 1, 2], trigger: TOUCH(1, 2),
    layers: [
      { Name: 'Orbs', ...T('rbx_ff_glow'), Color: ['#e6ffb0', '#6aff3a'], Size: [[0, 0], [0.2, 0.8], [1, 0.4]], LightEmission: 1, Brightness: 2, Rate: 30, Lifetime: [0.8, 1.2], Speed: [6, 10], SpreadAngle: [30, 30], Acceleration: [0, -8, 0] },
    ],
  },
  {
    name: 'Spawn Beam', category: 'Fun & Rewards', desc: 'Column of light over a spawn point.', partSize: [4, 0.4, 4],
    layers: [
      { Name: 'Beam', ...T('beam'), point: true, Color: '#9fd8ff', Size: 14, Squash: -2.5, Transparency: [[0, 1], [0.3, 0.6], [0.7, 0.6], [1, 1]], LightEmission: 1, Rate: 2, Lifetime: [1.5, 1.5], Speed: [3, 3], Orientation: 'FacingCameraWorldUp' },
      { Name: 'Rising', ...T('rbx_sparkles'), Color: '#d8f0ff', Size: [[0, 0], [0.4, 0.5], [1, 0]], LightEmission: 1, Rate: 20, Lifetime: [1.5, 2], Speed: [3, 6], Shape: 'Disc', ShapeStyle: 'Surface' },
    ],
  },
  {
    name: 'Checkpoint Reached', category: 'Fun & Rewards', desc: 'Touch to activate: ring burst + rising column.', partSize: [6, 0.4, 6], trigger: TOUCH(1.2, 3), burstLoop: 2.5,
    layers: [
      { Name: 'Ring', ...T('rbx_exp_shock'), point: true, Color: '#3aff9a', Size: [2, 16], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 2, Lifetime: [0.6, 0.6], Speed: 0.01, Orientation: 'VelocityPerpendicular', mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Column', ...T('rbx_sparkles'), Color: ['#ffffff', '#3aff9a'], Size: [[0, 0.8], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 60, Lifetime: [0.8, 1.2], Speed: [10, 16], Shape: 'Disc', ShapeStyle: 'Surface', Drag: 1 },
    ],
  },
  {
    name: 'Treasure Chest Open', category: 'Fun & Rewards', desc: 'Prompt "Open": gold coins and light fountain out.', partSize: [3, 1, 2], trigger: PROMPT('Open', 1.2, 4), burstLoop: 2.5,
    layers: [
      { Name: 'Light', ...T('beam'), point: true, Color: '#ffe8a0', Size: [[0, 2], [0.3, 8], [1, 6]], Squash: -1.8, Transparency: [[0, 0.2], [1, 1]], LightEmission: 1, Brightness: 2, Lifetime: [1.2, 1.2], Speed: [1, 1], Orientation: 'FacingCameraWorldUp', mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Coins', ...T('circle'), Color: '#ffcc2a', Size: [[0, 0.5], [1, 0.45]], Squash: [[0, 0], [0.25, 2], [0.5, 0], [0.75, 2], [1, 0]], Lifetime: [1, 1.4], Speed: [16, 22], SpreadAngle: [25, 25], Acceleration: [0, -45, 0], mode: 'burst', emitCount: 25, Enabled: false },
      { Name: 'Glitter', ...T('rbx_sparkles'), Color: '#fff6c0', Size: [[0, 0], [0.3, 0.8], [1, 0]], LightEmission: 1, Rate: 30, Lifetime: [0.6, 1], Speed: [4, 8], SpreadAngle: [40, 40] },
    ],
  },
  {
    name: 'Legendary Drop', category: 'Fun & Rewards', desc: 'Tall orange loot beam marking a legendary item.', partSize: [1.5, 0.4, 1.5],
    layers: [
      { Name: 'Beam', ...T('beam'), point: true, Color: ['#ffffff', '#ff9a2a'], Size: 24, Squash: -2.8, Transparency: [[0, 1], [0.2, 0.4], [0.8, 0.4], [1, 1]], LightEmission: 1, Brightness: 2, Rate: 2, Lifetime: [1.2, 1.2], Speed: [4, 4], Orientation: 'FacingCameraWorldUp' },
      { Name: 'Sparks', ...T('rbx_sparkles'), Color: '#ffd38a', Size: [[0, 0], [0.4, 0.6], [1, 0]], LightEmission: 1, Rate: 15, Lifetime: [1, 2], Speed: [5, 10], Shape: 'Disc' },
      { Name: 'Ground Ring', ...T('ring'), point: true, Color: '#ff9a2a', Size: [[0, 2], [1, 5]], Transparency: [[0, 0.3], [1, 1]], LightEmission: 1, Rate: 1.5, Lifetime: [1, 1], Speed: 0.01, Orientation: 'VelocityPerpendicular' },
    ],
  },
  {
    name: 'Gift Box Pop', category: 'Fun & Rewards', desc: 'Present opens with ribbons of confetti and stars.', partSize: [2, 2, 2], trigger: PROMPT('Open Gift', 1, 3), burstLoop: 2,
    layers: [
      { Name: 'Confetti', ...T('confetti'), Color: [[0, '#ff3a6a'], [0.5, '#ffd23a'], [1, '#3ab8ff']], Size: [[0, 0.5, 0.2], [1, 0.5, 0.2]], Lifetime: [1.5, 2.2], Speed: [14, 20], SpreadAngle: [40, 40], RotSpeed: [-400, 400], Acceleration: [0, -20, 0], Drag: 1.2, mode: 'burst', emitCount: 50, Enabled: false },
      { Name: 'Stars', ...T('star5'), Color: '#ffe23a', Size: [[0, 0.8], [1, 0]], LightEmission: 0.5, Lifetime: [0.8, 1.2], Speed: [10, 15], Shape: 'Sphere', Drag: 3, RotSpeed: [-200, 200], mode: 'burst', emitCount: 10, Enabled: false },
    ],
  },
  {
    name: 'Money Rain', category: 'Fun & Rewards', desc: 'Dollar signs raining down (jackpot!).', partSize: [20, 1, 20],
    layers: [
      { Name: 'Cash', ...T('g_dollar'), Color: ['#6aff6a', '#2ad84a'], Size: [[0, 1.2, 0.4], [1, 1.2, 0.4]], Rate: 25, Lifetime: [3, 4], Speed: [6, 10], EmissionDirection: 'Bottom', SpreadAngle: [15, 15], RotSpeed: [-120, 120] },
    ],
  },
  {
    name: 'Rainbow Burst', category: 'Fun & Rewards', desc: 'Every colour exploding outward.', partSize: [1, 1, 1], trigger: SCRIPTED, burstLoop: 2,
    layers: [
      { Name: 'Burst', ...T('rbx_ff_glow'), Color: [[0, '#ff3a3a'], [0.2, '#ffb02a'], [0.4, '#ffee2a'], [0.6, '#3aff6a'], [0.8, '#2ab8ff'], [1, '#b03aff']], Size: [[0, 1.5], [1, 0]], LightEmission: 1, Brightness: 2, Lifetime: [1, 1.4], Speed: [15, 22], Shape: 'Sphere', ShapeStyle: 'Surface', Drag: 2.5, mode: 'burst', emitCount: 80, Enabled: false },
    ],
  },
  {
    name: 'Bubble Pop', category: 'Fun & Rewards', desc: 'Bubbles that grow then pop — cute pickup.', partSize: [2, 2, 2], trigger: TOUCH(1, 1.5), burstLoop: 1.5,
    layers: [
      { Name: 'Bubbles', ...T('bubble'), Color: ['#ffd6f8', '#d6f0ff'], Size: [[0, 0.4], [0.85, 1.6, 0.4], [0.9, 2.2], [1, 0]], Transparency: [[0, 0.1], [0.85, 0.1], [1, 1]], Lifetime: [0.8, 1.2], Speed: [3, 6], Shape: 'Sphere', Drag: 2, mode: 'burst', emitCount: 12, Enabled: false },
    ],
  },
  {
    name: 'Trophy Shine', category: 'Fun & Rewards', desc: 'Gleaming star glints on a trophy or medal.', partSize: [1.5, 2.5, 1.5],
    layers: [
      { Name: 'Gleam', ...T('flare'), Color: '#fff6d0', Size: [[0, 0], [0.5, 2], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 2, Lifetime: [0.5, 0.6], Speed: 0, Shape: 'Box', ShapeStyle: 'Surface', LockedToPart: true },
    ],
  },
  {
    name: 'Level Complete', category: 'Fun & Rewards', desc: 'Big celebration: fireworks, confetti and a golden flash.', partSize: [4, 1, 4], trigger: TOUCH(1, 5), burstLoop: 3,
    layers: [
      { Name: 'Flash', ...T('rbx_ff_glow'), point: true, Color: '#fff2b0', Size: [6, 30], Transparency: [[0, 0.2], [1, 1]], LightEmission: 1, Lifetime: [0.5, 0.5], Speed: 0, mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Fireworks', ...T('rbx_sparkles'), Color: [[0, '#ffffff'], [0.2, '#ffd23a'], [1, '#ff4fd8']], Size: [[0, 1], [1, 0]], LightEmission: 1, Brightness: 3, Lifetime: [1.5, 2], Speed: [25, 35], Shape: 'Sphere', ShapeStyle: 'Surface', Drag: 2, Acceleration: [0, -8, 0], mode: 'burst', emitCount: 120, Enabled: false },
      { Name: 'Confetti', ...T('confetti'), Color: [[0, '#ff4a6a'], [0.33, '#ffd23a'], [0.66, '#4aff8f'], [1, '#3ab8ff']], Size: [[0, 0.5, 0.2], [1, 0.5, 0.2]], Lifetime: [2.5, 3.5], Speed: [20, 30], SpreadAngle: [30, 30], RotSpeed: [-400, 400], Acceleration: [0, -18, 0], Drag: 1.5, mode: 'burst', emitCount: 100, emitDelay: 0.1, Enabled: false },
    ],
  },

  /* ------------------------------ Sci-Fi & Energy ------------------------------ */
  {
    name: 'Force Field Dome', category: 'Sci-Fi & Energy', desc: 'Shimmering hemisphere shield over a base.', partSize: [30, 30, 30],
    layers: [
      { Name: 'Hex Shell', ...T('hexagon'), Color: '#4ad8ff', Size: [[0, 0], [0.3, 3], [0.7, 3], [1, 0]], Transparency: 0.5, LightEmission: 1, Rate: 80, Lifetime: [1, 1.6], Speed: 0, Shape: 'Sphere', ShapeStyle: 'Surface', ShapePartial: 0.5 },
    ],
  },
  {
    name: 'Tractor Beam', category: 'Sci-Fi & Energy', desc: 'UFO beam pulling particles upward.', partSize: [6, 0.4, 6],
    layers: [
      { Name: 'Beam', ...T('beam'), point: true, Color: '#9affc8', Size: 16, Squash: -1.5, Transparency: [[0, 1], [0.3, 0.7], [0.7, 0.7], [1, 1]], LightEmission: 1, Rate: 2, Lifetime: [1.5, 1.5], Speed: [-4, -4], Orientation: 'FacingCameraWorldUp' },
      { Name: 'Lifted', ...T('rbx_ff_glow'), Color: '#c8ffe0', Size: [[0, 0], [0.3, 0.5], [1, 0]], LightEmission: 1, Rate: 30, Lifetime: [2, 2.5], Speed: [5, 7], Shape: 'Disc' },
    ],
  },
  {
    name: 'Warp Gate', category: 'Sci-Fi & Energy', desc: 'Swirling sci-fi gate. Rotate the part upright.', partSize: [8, 0.2, 8],
    layers: [
      { Name: 'Swirl', ...T('spiral'), point: true, Color: ['#ffffff', '#3cf0ff'], Size: [8, 6], Transparency: [[0, 1], [0.3, 0.3], [0.7, 0.3], [1, 1]], LightEmission: 1, Rate: 5, Lifetime: [1.5, 1.5], Speed: 0.01, RotSpeed: [-200, -150], Orientation: 'VelocityPerpendicular', LockedToPart: true },
      { Name: 'Rim', ...T('rbx_fire_sparks'), Color: '#9ffcff', Size: [0.4, 0], LightEmission: 1, Rate: 80, Lifetime: [0.4, 0.6], Speed: [1, 2], Shape: 'Disc', ShapeStyle: 'Surface' },
    ],
  },
  {
    name: 'Data Stream', category: 'Sci-Fi & Energy', desc: 'Green digital squares streaming upward (hacker vibes).', partSize: [4, 0.4, 4],
    layers: [
      { Name: 'Bits', ...T('square'), Color: ['#9affb0', '#1aff5a'], Size: [[0, 0.25, 0.1], [1, 0.25, 0.1]], Transparency: [[0, 0], [0.5, 0.4], [1, 1]], LightEmission: 1, Rate: 60, Lifetime: [1, 1.6], Speed: [4, 8], Shape: 'Box', Orientation: 'FacingCameraWorldUp' },
    ],
  },
  {
    name: 'EMP Blast', category: 'Sci-Fi & Energy', desc: 'Electromagnetic pulse: blue ring and crackles.', partSize: [1, 1, 1], trigger: SCRIPTED, burstLoop: 2,
    layers: [
      { Name: 'Pulse', ...T('rbx_exp_shock'), point: true, Color: '#6ad8ff', Size: [2, 40], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 2, Lifetime: [0.6, 0.6], Speed: 0, mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Crackle', ...T('lightning'), Color: '#b8f0ff', Size: [[0, 3], [1, 1]], LightEmission: 1, Brightness: 2, Lifetime: [0.1, 0.2], Speed: [10, 20], Shape: 'Sphere', Rotation: [0, 360], mode: 'burst', emitCount: 12, Enabled: false },
    ],
  },
  {
    name: 'Nanobot Swarm', category: 'Sci-Fi & Energy', desc: 'Tiny glinting bots buzzing around.', partSize: [6, 4, 6],
    layers: [
      { Name: 'Bots', ...T('rbx_fire_sparks'), Color: '#c8e6ff', Size: 0.25, LightEmission: 1, Rate: 60, Lifetime: [0.6, 1.2], Speed: [3, 6], Shape: 'Sphere', SpreadAngle: [180, 180], Drag: 2, LockedToPart: true },
    ],
  },
  {
    name: 'Teleporter Pad', category: 'Sci-Fi & Energy', desc: 'Step on the pad: energy rings rise around you.', partSize: [5, 0.4, 5], trigger: TOUCH(1.5, 2),
    layers: [
      { Name: 'Rings', ...T('ring'), point: true, Color: '#3cf0ff', Size: 5, Transparency: [[0, 0.2], [1, 1]], LightEmission: 1, Brightness: 2, Rate: 6, Lifetime: [0.8, 0.8], Speed: [6, 6], Orientation: 'VelocityPerpendicular' },
      { Name: 'Specks', ...T('rbx_fire_sparks'), Color: '#c8fcff', Size: [0.3, 0], LightEmission: 1, Rate: 60, Lifetime: [0.6, 1], Speed: [6, 10], Shape: 'Disc', ShapeStyle: 'Surface' },
    ],
  },
  {
    name: 'Reactor Core', category: 'Sci-Fi & Energy', desc: 'Pulsing green reactor with orbiting energy.', partSize: [4, 6, 4],
    layers: [
      { Name: 'Core', ...T('rbx_ff_glow'), point: true, Color: ['#ffffff', '#6aff3a'], Size: [[0, 5], [0.5, 7], [1, 5]], Transparency: 0.35, LightEmission: 1, Brightness: 2, Rate: 3, Lifetime: [1, 1], Speed: 0, LockedToPart: true },
      { Name: 'Energy', ...T('rbx_ff_vortex'), Color: '#9aff6a', Size: [3, 5], Transparency: [[0, 1], [0.5, 0.5], [1, 1]], LightEmission: 1, Rate: 6, Lifetime: [1.2, 1.6], Speed: 0, Shape: 'Cylinder', Rotation: [0, 360], RotSpeed: [-200, 200], LockedToPart: true },
      { Name: 'Sparks', ...T('rbx_fire_sparks'), Color: '#d8ffb0', Size: [0.3, 0], LightEmission: 1, Rate: 25, Lifetime: [0.4, 0.8], Speed: [4, 8], Shape: 'Cylinder', ShapeStyle: 'Surface' },
    ],
  },

  /* ------------------------------ Magic ------------------------------ */
  {
    name: 'Arcane Runes Orbit', category: 'Magic', desc: 'Glowing glyph-diamonds circling a mage.', partSize: [5, 1, 5], trigger: CHAR(),
    layers: [
      { Name: 'Glyphs', ...T('diamond'), Color: '#b98aff', Size: [[0, 0], [0.2, 0.5], [0.8, 0.5], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 10, Lifetime: [1.2, 1.6], Speed: [0.5, 1], Shape: 'Cylinder', ShapeStyle: 'Surface', RotSpeed: [90, 180], LockedToPart: true },
    ],
  },
  {
    name: 'Void Rift', category: 'Magic', desc: 'Tear in reality: black core, purple wisps sucked inward.', partSize: [6, 6, 6],
    layers: [
      { Name: 'Inflow', ...T('rbx_smoke'), Color: ['#c04aff', '#1a0030'], Size: [[0, 2], [1, 0.4]], Transparency: [[0, 1], [0.3, 0.3], [1, 0.8]], LightEmission: 0.6, Rate: 40, Lifetime: [1, 1], Speed: [3, 3], Shape: 'Sphere', ShapeStyle: 'Surface', ShapeInOut: 'Inward', Rotation: [0, 360], RotSpeed: [-120, 120] },
      { Name: 'Core', ...T('circle'), point: true, Color: '#000000', Size: [[0, 2], [0.5, 2.4], [1, 2]], Rate: 4, Lifetime: [0.5, 0.5], Speed: 0, ZOffset: 1, LockedToPart: true },
    ],
  },
  {
    name: 'Holy Smite', category: 'Magic', desc: 'Pillar of light slams down with a radiant ring.', partSize: [3, 0.4, 3], trigger: SCRIPTED, burstLoop: 2,
    layers: [
      { Name: 'Pillar', ...T('beam'), point: true, Color: '#fff6d0', Size: [[0, 30], [1, 20]], Squash: -2.6, Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 3, Lifetime: [0.6, 0.6], Speed: 0, Orientation: 'FacingCameraWorldUp', mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Ring', ...T('rbx_exp_shock'), point: true, Color: '#ffe8a0', Size: [2, 18], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Lifetime: [0.5, 0.5], Speed: 0.01, Orientation: 'VelocityPerpendicular', mode: 'burst', emitCount: 1, emitDelay: 0.05, Enabled: false },
      { Name: 'Feathers', ...T('feather'), Color: '#ffffff', Size: [[0, 0.6], [1, 0.5]], Transparency: [[0, 0], [0.8, 0], [1, 1]], Lifetime: [1.5, 2.5], Speed: [6, 10], Shape: 'Disc', SpreadAngle: [40, 40], RotSpeed: [-120, 120], Drag: 2, Acceleration: [0, -2, 0], mode: 'burst', emitCount: 15, Enabled: false },
    ],
  },
  {
    name: 'Crimson Aura', category: 'Magic', desc: 'Menacing red aura with dark wisps around every character.', partSize: [3, 5, 2], trigger: CHAR(),
    layers: [
      { Name: 'Aura', ...T('rbx_fire'), Color: ['#ff6a6a', '#8a0010'], Size: [[0, 1.3, 0.3], [1, 0.3]], Transparency: [[0, 0.3], [1, 1]], LightEmission: 0.8, Rate: 40, Lifetime: [0.5, 0.8], Speed: [4, 7], Shape: 'Cylinder', ShapeStyle: 'Surface', LockedToPart: true },
      { Name: 'Wisps', ...T('rbx_smoke'), Color: '#200005', Size: [[0, 0.8], [1, 2.5]], Transparency: [[0, 1], [0.3, 0.4], [1, 1]], Rate: 12, Lifetime: [1, 1.5], Speed: [2, 4], Shape: 'Cylinder', ShapeStyle: 'Surface' },
    ],
  },
  {
    name: 'Angel Feathers', category: 'Magic', desc: 'Soft white feathers floating down.', partSize: [8, 1, 8],
    layers: [
      { Name: 'Feathers', ...T('feather'), Color: '#ffffff', Size: [[0, 0.8, 0.3], [1, 0.8, 0.3]], Transparency: [[0, 1], [0.1, 0], [0.9, 0], [1, 1]], Rate: 6, Lifetime: [4, 6], Speed: [1, 2], EmissionDirection: 'Bottom', SpreadAngle: [40, 40], Rotation: [0, 360], RotSpeed: [-60, 60], Acceleration: [0.5, 0, 0.3] },
    ],
  },

  /* ------------------------------ Seasonal ------------------------------ */
  {
    name: 'Ghost Wisps', category: 'Seasonal', desc: 'Pale ghostly wisps drifting through a haunted house.', partSize: [12, 4, 12],
    layers: [
      { Name: 'Wisps', ...T('wisp'), Color: ['#e6fff8', '#9ad8c8'], Size: [[0, 1], [1, 4]], Transparency: [[0, 1], [0.3, 0.6], [1, 1]], LightEmission: 0.6, Rate: 6, Lifetime: [3, 5], Speed: [0.5, 1.5], Shape: 'Box', SpreadAngle: [180, 180], Rotation: [0, 360], RotSpeed: [-30, 30] },
    ],
  },
  {
    name: 'Pumpkin Fire', category: 'Seasonal', desc: 'Spooky green-orange flames for jack-o\'-lanterns.', partSize: [1, 0.4, 1],
    layers: [
      { Name: 'Flames', ...T('rbx_fire'), Color: ['#e6ff8a', '#3aff6a', '#ff8a1a'], Size: [[0, 1.2, 0.3], [1, 0.2]], Transparency: [[0, 0.2], [1, 1]], LightEmission: 1, Rate: 30, Lifetime: [0.5, 0.8], Speed: [2, 3], RotSpeed: [-50, 50] },
    ],
  },
  {
    name: 'Haunted Fog', category: 'Seasonal', desc: 'Low purple fog rolling over a graveyard.', partSize: [40, 1, 40],
    layers: [
      { Name: 'Fog', ...T('rbx_smoke'), Color: ['#8a6aaa', '#3a2a50'], Size: [[0, 10, 3], [1, 16]], Transparency: [[0, 1], [0.4, 0.7], [1, 1]], Rate: 8, Lifetime: [8, 12], Speed: [0.3, 0.8], SpreadAngle: [90, 90], Rotation: [0, 360], RotSpeed: [-3, 3], Orientation: 'FacingCameraWorldUp' },
    ],
  },
  {
    name: 'Christmas Sparkles', category: 'Seasonal', desc: 'Red, green and gold twinkles for trees and presents.', partSize: [4, 8, 4],
    layers: [
      { Name: 'Twinkles', ...T('rbx_sparkles'), Color: [[0, '#ff3a3a'], [0.5, '#3aff6a'], [1, '#ffd23a']], Size: [[0, 0], [0.5, 0.6], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 30, Lifetime: [0.8, 1.4], Speed: 0, Shape: 'Cylinder', ShapeStyle: 'Surface', Rotation: [0, 90] },
    ],
  },
  {
    name: 'Snowball Impact', category: 'Seasonal', desc: 'Puff of snow when a snowball hits.', partSize: [0.5, 0.5, 0.5], trigger: SCRIPTED, burstLoop: 1,
    layers: [
      { Name: 'Snow', ...T('rbx_smoke'), Color: '#ffffff', Size: [[0, 0.8], [1, 3]], Transparency: [[0, 0.1], [1, 1]], Lifetime: [0.5, 0.8], Speed: [5, 10], Shape: 'Sphere', Drag: 4, mode: 'burst', emitCount: 10, Enabled: false },
      { Name: 'Chunks', ...T('circle'), Color: '#eef6ff', Size: [[0, 0.3, 0.1], [1, 0.2]], Lifetime: [0.5, 0.8], Speed: [8, 14], Shape: 'Sphere', Acceleration: [0, -40, 0], mode: 'burst', emitCount: 15, Enabled: false },
    ],
  },
  {
    name: 'Sparkler', category: 'Seasonal', desc: 'Handheld firework sparkler — fizzing star sparks.', partSize: [0.2, 0.2, 0.2],
    layers: [
      { Name: 'Sparks', ...T('rbx_fire_sparks'), Color: ['#ffffff', '#ffd36b'], Size: [[0, 0.25], [1, 0]], Squash: -2, LightEmission: 1, Brightness: 3, Rate: 150, Lifetime: [0.2, 0.4], Speed: [6, 12], Shape: 'Sphere', SpreadAngle: [180, 180], Drag: 3, Acceleration: [0, -10, 0], Orientation: 'VelocityParallel' },
      { Name: 'Glow', ...T('rbx_ff_glow'), point: true, Color: '#fff2c0', Size: 1.5, Transparency: 0.3, LightEmission: 1, Rate: 10, Lifetime: [0.1, 0.1], Speed: 0, LockedToPart: true },
    ],
  },
  {
    name: 'New Year Rockets', category: 'Seasonal', desc: 'Rockets shooting up and exploding in colour.', partSize: [1, 1, 1], burstLoop: 2.5,
    layers: [
      { Name: 'Rocket', ...T('rbx_fire_sparks'), Color: '#ffd36b', Size: [[0, 0.6], [1, 0.4]], Squash: -2, LightEmission: 1, Brightness: 3, Lifetime: [1, 1], Speed: [40, 40], Orientation: 'VelocityParallel', mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Shell', ...T('rbx_sparkles'), Color: [[0, '#ffffff'], [0.2, '#3ab8ff'], [1, '#ff3a8a']], Size: [[0, 0.9], [1, 0]], LightEmission: 1, Brightness: 3, Lifetime: [1.2, 1.6], Speed: [16, 22], Shape: 'Sphere', ShapeStyle: 'Surface', Drag: 2, Acceleration: [0, -6, 0], mode: 'burst', emitCount: 90, emitDelay: 1, Enabled: false },
    ],
  },
  {
    name: 'Valentine Burst', category: 'Seasonal', desc: 'Explosion of hearts.', partSize: [1, 1, 1], trigger: SCRIPTED, burstLoop: 2,
    layers: [
      { Name: 'Hearts', ...T('heart'), Color: ['#ffb3d0', '#ff2a6a'], Size: [[0, 0.5], [0.3, 1.2, 0.4], [1, 0]], LightEmission: 0.3, Lifetime: [1, 1.5], Speed: [10, 16], Shape: 'Sphere', Drag: 2.5, Rotation: [-20, 20], mode: 'burst', emitCount: 25, Enabled: false },
    ],
  },
  {
    name: 'Autumn Leaf Swirl', category: 'Seasonal', desc: 'Gust of leaves spiralling up.', partSize: [6, 0.4, 6],
    layers: [
      { Name: 'Leaves', ...T('leaf'), Color: [[0, '#ffb13b'], [0.5, '#e8641c'], [1, '#a8321a']], Size: [[0, 0.8, 0.3], [1, 0.8, 0.3]], Transparency: [[0, 1], [0.1, 0], [0.9, 0], [1, 1]], Rate: 15, Lifetime: [2.5, 3.5], Speed: [3, 5], Shape: 'Cylinder', ShapeStyle: 'Surface', Rotation: [0, 360], RotSpeed: [-200, 200], Acceleration: [0, 3, 0] },
    ],
  },
);

// Sensible Roblox behaviours for some of the original presets
for (const [name, trigger] of [
  ['Magic Aura', CHAR()], ['Speed Boost', CHAR()], ['Rainbow Trail', CHAR()], ['Fairy Dust Trail', CHAR()],
  ['Coin Burst', TOUCH(0.5, 1)], ['Star Pop', TOUCH(0.5, 1)], ['Level Up', SCRIPTED], ['Healing Rise', TOUCH(2, 2)],
  ['Explosion', SCRIPTED], ['Hit Sparks', SCRIPTED], ['Sword Slash', SCRIPTED], ['Muzzle Flash', SCRIPTED],
  ['Ground Slam', SCRIPTED], ['Hit Marker Pop', SCRIPTED], ['Jet Thruster', VEH()], ['Dust Puff', SCRIPTED],
]) {
  const p = PRESETS.find((x) => x.name === name);
  if (p) p.trigger = trigger;
}

// Category order shown in the preset gallery
PRESET_CATEGORIES.splice(0, PRESET_CATEGORIES.length,
  'Vehicles', 'Fire', 'Smoke & Gas', 'Magic', 'Abilities', 'Combat & Impact', 'Weapons',
  'Weather & Nature', 'Environment', 'Sci-Fi & Energy', 'Fun & Rewards', 'Seasonal');
