'use strict';
/*
 * Built-in effect presets. Shorthand is expanded by Model.normalizeEffect:
 *   Size: 2            -> constant
 *   Size: [2, 0]       -> evenly spaced values (2 at start, 0 at end)
 *   Size: [[0,1],[0.3,2,0.5],[1,0]] -> keypoints [time, value, envelope]
 *   Color: '#hex' | ['#a','#b'] | [[t,'#hex'],...]
 */

const T = (key) => (TEX_BY_KEY[key].rbx ? { Texture: TEX_BY_KEY[key].rbx, previewTex: key } : { Texture: '', previewTex: key });

const PRESET_CATEGORIES = ['Fire', 'Smoke & Gas', 'Magic', 'Weather & Nature', 'Combat & Impact', 'Sci-Fi & Energy', 'Fun & Rewards'];

const PRESETS = [
  /* ------------------------------ Fire ------------------------------ */
  {
    name: 'Campfire', category: 'Fire', desc: 'Flames, rising embers and soft smoke.', partSize: [3, 0.5, 3],
    layers: [
      { Name: 'Flames', ...T('rbx_fire'), Color: ['#ffd36b', '#ff7a1a', '#c4260e'], Size: [[0, 2.4, 0.4], [0.6, 1.6], [1, 0.2]], Transparency: [[0, 0.3], [0.7, 0.4], [1, 1]], LightEmission: 1, Rate: 45, Lifetime: [0.7, 1.2], Speed: [3, 5], SpreadAngle: [10, 10], Rotation: [-30, 30], RotSpeed: [-40, 40], Acceleration: [0, 3, 0] },
      { Name: 'Embers', ...T('rbx_fire_sparks'), Color: ['#ffe08a', '#ff5a1a'], Size: [[0, 0.25, 0.1], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 12, Lifetime: [1.2, 2.2], Speed: [4, 8], SpreadAngle: [25, 25], Acceleration: [0.5, 2, 0], Drag: 0.6 },
      { Name: 'Smoke', ...T('rbx_smoke'), Color: ['#3a3a3a', '#5a5a5a'], Size: [[0, 1.5], [1, 5, 1]], Transparency: [[0, 1], [0.25, 0.6], [1, 1]], Rate: 6, Lifetime: [3, 4.5], Speed: [3, 4], SpreadAngle: [8, 8], Rotation: [0, 360], RotSpeed: [-20, 20], Acceleration: [0.6, 0.5, 0], ZOffset: -1 },
    ],
  },
  {
    name: 'Torch Flame', category: 'Fire', desc: 'Compact flame that sticks to its part — great for torches.', partSize: [0.6, 0.4, 0.6],
    layers: [
      { Name: 'Flame', ...T('rbx_fire'), Color: ['#fff2b0', '#ff9a2a', '#ff3b0f'], Size: [[0, 1.1, 0.2], [1, 0.1]], Transparency: [[0, 0.2], [1, 1]], LightEmission: 1, Rate: 40, Lifetime: [0.4, 0.7], Speed: [1.5, 2.5], SpreadAngle: [6, 6], RotSpeed: [-60, 60], LockedToPart: true },
      { point: true, Name: 'Glow', ...T('rbx_ff_glow'), Color: '#ff8a2a', Size: 3, Transparency: [[0, 0.75], [0.5, 0.65], [1, 1]], LightEmission: 1, Rate: 4, Lifetime: [0.5, 0.6], Speed: 0, LockedToPart: true },
    ],
  },
  {
    name: 'Blue Soul Flame', category: 'Fire', desc: 'Eerie cyan-blue fire.', partSize: [2, 0.5, 2],
    layers: [
      { Name: 'Flames', ...T('rbx_fire'), Color: ['#e0ffff', '#3fc8ff', '#1a3cff'], Size: [[0, 2, 0.3], [1, 0.1]], Transparency: [[0, 0.2], [1, 1]], LightEmission: 1, Brightness: 1.5, Rate: 50, Lifetime: [0.6, 1.1], Speed: [3, 5], SpreadAngle: [8, 8], RotSpeed: [-50, 50] },
      { Name: 'Wisps', ...T('rbx_fire_sparks'), Color: '#9ff4ff', Size: [0.3, 0], LightEmission: 1, Rate: 10, Lifetime: [1, 2], Speed: [3, 6], SpreadAngle: [30, 30], Drag: 1 },
    ],
  },
  {
    name: 'Inferno', category: 'Fire', desc: 'Huge roaring blaze for burning buildings.', partSize: [8, 1, 8],
    layers: [
      { Name: 'Fire', ...T('rbx_fire'), Color: [[0, '#fff1a8'], [0.3, '#ff8c1a'], [0.7, '#d4300c'], [1, '#3a0d05']], Size: [[0, 5, 1.5], [1, 1]], Transparency: [[0, 0.2], [0.8, 0.5], [1, 1]], LightEmission: 0.9, Rate: 90, Lifetime: [1, 1.8], Speed: [6, 10], SpreadAngle: [15, 15], Rotation: [0, 360], RotSpeed: [-45, 45], Acceleration: [0, 4, 0] },
      { Name: 'Black Smoke', ...T('rbx_smoke'), Color: '#151515', Size: [[0, 4], [1, 14, 3]], Transparency: [[0, 1], [0.2, 0.35], [1, 1]], Rate: 14, Lifetime: [4, 6], Speed: [8, 12], SpreadAngle: [10, 10], Rotation: [0, 360], RotSpeed: [-15, 15], Acceleration: [2, 1, 0], ZOffset: -2 },
      { Name: 'Sparks', ...T('rbx_fire_sparks'), Color: '#ffb347', Size: [0.4, 0], LightEmission: 1, Brightness: 3, Rate: 30, Lifetime: [1.5, 3], Speed: [10, 18], SpreadAngle: [35, 35], Acceleration: [1, 0, 0], Drag: 1 },
    ],
  },
  {
    name: 'Burning Ground', category: 'Fire', desc: 'Patch of low flames spread over a disc.', partSize: [10, 0.2, 10],
    layers: [
      { Name: 'Flames', ...T('rbx_fire'), Color: ['#ffd56b', '#ff5a14'], Size: [[0, 1.6, 0.5], [1, 0]], Transparency: [[0, 0.3], [1, 1]], LightEmission: 1, Rate: 120, Lifetime: [0.5, 1], Speed: [2, 4], Shape: 'Disc', RotSpeed: [-40, 40] },
    ],
  },
  {
    name: 'Fireball Trail', category: 'Fire', desc: 'Move the emitter (preview toolbar) to see the trail.', partSize: [1.5, 1.5, 1.5],
    layers: [
      { point: true, Name: 'Core', ...T('rbx_ff_glow'), Color: '#ffcf5a', Size: [4, 3], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 2, Rate: 30, Lifetime: [0.2, 0.25], Speed: 0, LockedToPart: true },
      { Name: 'Trail', ...T('rbx_fire'), Color: ['#ffe28a', '#ff6a1a', '#5a1a0a'], Size: [[0, 2.2], [1, 0.4]], Transparency: [[0, 0.2], [1, 1]], LightEmission: 0.8, Rate: 80, Lifetime: [0.4, 0.8], Speed: [0.5, 1], Shape: 'Sphere', SpreadAngle: [180, 180], RotSpeed: [-90, 90] },
    ],
  },

  /* --------------------------- Smoke & Gas --------------------------- */
  {
    name: 'Smoke Column', category: 'Smoke & Gas', desc: 'Thick grey smoke rising and spreading.', partSize: [3, 1, 3],
    layers: [
      { Name: 'Smoke', ...T('rbx_smoke'), Color: ['#9a9a9a', '#5c5c5c'], Size: [[0, 2], [1, 9, 2]], Transparency: [[0, 1], [0.15, 0.4], [1, 1]], Rate: 16, Lifetime: [4, 6], Speed: [4, 6], SpreadAngle: [12, 12], Rotation: [0, 360], RotSpeed: [-20, 20], Acceleration: [1.2, 0.4, 0] },
    ],
  },
  {
    name: 'Steam Vent', category: 'Smoke & Gas', desc: 'Fast white steam jet that slows and puffs out.', partSize: [1, 0.5, 1],
    layers: [
      { Name: 'Steam', ...T('rbx_smoke'), Color: '#ffffff', Size: [[0, 0.8], [1, 6, 1]], Transparency: [[0, 0.5], [1, 1]], Rate: 30, Lifetime: [1.5, 2.5], Speed: [14, 18], SpreadAngle: [6, 6], Drag: 1.5, Rotation: [0, 360], RotSpeed: [-30, 30] },
    ],
  },
  {
    name: 'Toxic Gas', category: 'Smoke & Gas', desc: 'Slow, low-lying green poison cloud.', partSize: [10, 1, 10],
    layers: [
      { Name: 'Gas', ...T('rbx_smoke'), Color: ['#9dff4a', '#3c8f1a'], Size: [[0, 3], [1, 8, 2]], Transparency: [[0, 1], [0.3, 0.55], [1, 1]], LightEmission: 0.3, Rate: 14, Lifetime: [5, 7], Speed: [0.5, 1.5], SpreadAngle: [80, 80], Rotation: [0, 360], RotSpeed: [-10, 10] },
      { Name: 'Bubbles', ...T('bubble'), Color: '#b6ff6a', Size: [[0, 0], [0.2, 0.6, 0.3], [1, 0.8]], Transparency: [[0, 0.2], [0.85, 0.2], [1, 1]], Rate: 6, Lifetime: [1.5, 2.5], Speed: [1, 2], Shape: 'Disc' },
    ],
  },
  {
    name: 'Dust Puff', category: 'Smoke & Gas', desc: 'Burst of dust for landings, footsteps and skids.', partSize: [2, 0.2, 2], burstLoop: 1.5,
    layers: [
      { Name: 'Dust', ...T('rbx_smoke'), Color: '#c9b38f', Size: [[0, 1], [1, 4, 0.8]], Transparency: [[0, 0.4], [1, 1]], Lifetime: [0.8, 1.4], Speed: [6, 10], SpreadAngle: [80, 80], Drag: 3, Rotation: [0, 360], RotSpeed: [-60, 60], Acceleration: [0, 1, 0], mode: 'burst', emitCount: 14, Enabled: false },
    ],
  },
  {
    name: 'Fog Bank', category: 'Smoke & Gas', desc: 'Huge soft fog sheets for spooky maps.', partSize: [40, 2, 40],
    layers: [
      { Name: 'Fog', ...T('rbx_smoke'), Color: '#c8d2dc', Size: [[0, 12, 4], [1, 18]], Transparency: [[0, 1], [0.4, 0.75], [1, 1]], Rate: 8, Lifetime: [10, 14], Speed: [0.3, 0.8], SpreadAngle: [90, 90], Rotation: [0, 360], RotSpeed: [-3, 3], Orientation: 'FacingCameraWorldUp' },
    ],
  },

  /* ------------------------------ Magic ------------------------------ */
  {
    name: 'Sparkles', category: 'Magic', desc: 'Classic golden twinkles.', partSize: [3, 3, 3],
    layers: [
      { Name: 'Sparkles', ...T('rbx_sparkles'), Color: ['#fff7c2', '#ffcb3d'], Size: [[0, 0], [0.2, 0.6, 0.3], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 25, Lifetime: [1, 1.6], Speed: [0.5, 1.5], Shape: 'Sphere', SpreadAngle: [180, 180], Rotation: [0, 90], RotSpeed: [-90, 90] },
    ],
  },
  {
    name: 'Magic Aura', category: 'Magic', desc: 'Swirling purple aura that follows a character.', partSize: [3, 5, 3],
    layers: [
      { Name: 'Aura', ...T('rbx_ff_glow'), Color: ['#e2a8ff', '#7a2cff'], Size: [[0, 0.5], [0.5, 1.2, 0.3], [1, 0]], Transparency: [[0, 1], [0.3, 0.3], [1, 1]], LightEmission: 1, Rate: 40, Lifetime: [1, 1.5], Speed: [1, 2], Shape: 'Cylinder', ShapeStyle: 'Surface', Acceleration: [0, 4, 0], LockedToPart: true },
      { Name: 'Glints', ...T('rbx_sparkles'), Color: '#f3d6ff', Size: [[0, 0], [0.5, 0.5], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 12, Lifetime: [0.6, 1], Speed: 0, Shape: 'Cylinder', LockedToPart: true },
    ],
  },
  {
    name: 'Healing Rise', category: 'Magic', desc: 'Green motes drifting upward — heal pads, potions.', partSize: [4, 0.4, 4],
    layers: [
      { Name: 'Motes', ...T('rbx_ff_glow'), Color: ['#c8ffb0', '#3bdc6a'], Size: [[0, 0], [0.2, 0.5, 0.2], [1, 0]], LightEmission: 1, Brightness: 1.5, Rate: 30, Lifetime: [1.5, 2.5], Speed: [2, 4], Shape: 'Disc', Acceleration: [0, 1, 0] },
      { Name: 'Crosses', ...T('flare'), Color: '#8dff9f', Size: [[0, 0], [0.3, 0.8], [1, 0]], LightEmission: 1, Rate: 4, Lifetime: [1.2, 1.8], Speed: [3, 4], Shape: 'Disc' },
    ],
  },
  {
    name: 'Level Up', category: 'Magic', desc: 'Golden ring burst plus rising column.', partSize: [4, 0.2, 4], burstLoop: 2.5,
    layers: [
      { point: true, Name: 'Ring', ...T('rbx_exp_shock'), Color: '#ffd84a', Size: [2, 16], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 2, Lifetime: [0.6, 0.6], Speed: 0.01, Orientation: 'VelocityPerpendicular', mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Column', ...T('rbx_sparkles'), Color: ['#fff6b3', '#ffb800'], Size: [[0, 0.8, 0.3], [1, 0]], LightEmission: 1, Brightness: 2, Lifetime: [0.8, 1.4], Speed: [8, 16], Shape: 'Disc', ShapeStyle: 'Surface', Drag: 1.5, mode: 'burst', emitCount: 60, Enabled: false },
    ],
  },
  {
    name: 'Portal', category: 'Magic', desc: 'Spinning vortex disc. Rotate the part to stand it upright.', partSize: [6, 0.2, 6],
    layers: [
      { point: true, Name: 'Vortex', ...T('rbx_ff_vortex'), Color: ['#7af0ff', '#6a2cff'], Size: [8, 6], Transparency: [[0, 1], [0.3, 0.2], [0.7, 0.2], [1, 1]], LightEmission: 1, Rate: 4, Lifetime: [2, 2], Speed: 0.01, RotSpeed: [180, 220], Orientation: 'VelocityPerpendicular', LockedToPart: true },
      { Name: 'Inflow', ...T('rbx_ff_glow'), Color: '#b9a1ff', Size: [0.6, 0], LightEmission: 1, Rate: 50, Lifetime: [0.7, 0.7], Speed: [4, 4], Shape: 'Cylinder', ShapeStyle: 'Surface', ShapeInOut: 'Inward', EmissionDirection: 'Top', LockedToPart: true },
    ],
  },
  {
    name: 'Fairy Dust Trail', category: 'Magic', desc: 'Glittering trail — turn on "Move emitter".', partSize: [0.5, 0.5, 0.5],
    layers: [
      { Name: 'Dust', ...T('star4'), Color: ['#ffe6fb', '#ff8de0', '#9b8cff'], Size: [[0, 0.6, 0.3], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 60, Lifetime: [0.8, 1.5], Speed: [0.3, 1], SpreadAngle: [180, 180], Rotation: [0, 90], RotSpeed: [-120, 120], Acceleration: [0, -2, 0], Drag: 1 },
    ],
  },
  {
    name: 'Holy Light', category: 'Magic', desc: 'Soft vertical shaft of light with drifting motes.', partSize: [4, 0.2, 4],
    layers: [
      { Name: 'Shaft', ...T('rbx_ff_glow'), Color: '#fff4cf', Size: [[0, 5], [1, 7]], Squash: -2.5, Transparency: [[0, 1], [0.5, 0.6], [1, 1]], LightEmission: 1, Rate: 6, Lifetime: [2, 2.5], Speed: [2, 2], Orientation: 'FacingCameraWorldUp' },
      { Name: 'Motes', ...T('rbx_sparkles'), Color: '#fffbe6', Size: [[0, 0], [0.5, 0.4], [1, 0]], LightEmission: 1, Rate: 20, Lifetime: [2, 3], Speed: [1.5, 3], Shape: 'Disc' },
    ],
  },
  {
    name: 'Dark Energy', category: 'Magic', desc: 'Dark wisps with violet glow — villains, curses.', partSize: [3, 3, 3],
    layers: [
      { Name: 'Wisps', ...T('rbx_smoke'), Color: ['#2a003d', '#000000'], Size: [[0, 1], [1, 4]], Transparency: [[0, 1], [0.3, 0.2], [1, 1]], Rate: 25, Lifetime: [1, 1.8], Speed: [1, 2], Shape: 'Sphere', SpreadAngle: [180, 180], Rotation: [0, 360], RotSpeed: [-90, 90], Acceleration: [0, 3, 0] },
      { Name: 'Glow', ...T('rbx_ff_glow'), Color: '#a020ff', Size: [[0, 0], [0.4, 0.7], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 20, Lifetime: [0.7, 1.2], Speed: [1, 3], Shape: 'Sphere', ZOffset: 1 },
    ],
  },
  {
    name: 'Rune Circle', category: 'Magic', desc: 'Pulsing ring on the floor with rising glyph sparks.', partSize: [6, 0.2, 6],
    layers: [
      { point: true, Name: 'Circle', ...T('ring'), Color: '#4ad8ff', Size: [[0, 7], [1, 7.6]], Transparency: [[0, 1], [0.5, 0.2], [1, 1]], LightEmission: 1, Brightness: 1.5, Rate: 2, Lifetime: [1, 1], Speed: 0.01, RotSpeed: [40, 40], Orientation: 'VelocityPerpendicular', LockedToPart: true },
      { Name: 'Glyphs', ...T('diamond'), Color: '#a4f0ff', Size: [[0, 0.4], [1, 0]], LightEmission: 1, Rate: 25, Lifetime: [1, 1.6], Speed: [2, 3], Shape: 'Disc', ShapeStyle: 'Surface' },
    ],
  },

  /* ------------------------ Weather & Nature ------------------------ */
  {
    name: 'Rain', category: 'Weather & Nature', desc: 'Falling rain streaks. Put the part high above the area.', partSize: [40, 1, 40],
    layers: [
      { Name: 'Rain', ...T('raindrop'), Color: '#c8dcff', Size: [[0, 1.4, 0.3], [1, 1.4, 0.3]], Squash: -2, Transparency: 0.3, Rate: 400, Lifetime: [1, 1.3], Speed: [55, 65], EmissionDirection: 'Bottom', Orientation: 'VelocityParallel' },
    ],
  },
  {
    name: 'Snowfall', category: 'Weather & Nature', desc: 'Gentle drifting snow.', partSize: [40, 1, 40],
    layers: [
      { Name: 'Snow', ...T('rbx_ff_glow'), Color: '#ffffff', Size: [[0, 0.35, 0.15], [1, 0.35, 0.15]], Transparency: [[0, 1], [0.1, 0.1], [0.9, 0.1], [1, 1]], Rate: 150, Lifetime: [6, 9], Speed: [2, 4], EmissionDirection: 'Bottom', SpreadAngle: [25, 25], RotSpeed: [-30, 30], Acceleration: [0.6, 0, 0.3] },
    ],
  },
  {
    name: 'Blizzard', category: 'Weather & Nature', desc: 'Heavy sideways snow storm.', partSize: [40, 20, 1],
    layers: [
      { Name: 'Snow', ...T('snowflake'), Color: '#ffffff', Size: [[0, 0.5, 0.25], [1, 0.5, 0.25]], Transparency: [[0, 1], [0.1, 0.1], [1, 0.6]], Rate: 300, Lifetime: [2, 3], Speed: [25, 35], EmissionDirection: 'Front', SpreadAngle: [10, 10], RotSpeed: [-200, 200], Acceleration: [0, -6, 0] },
      { Name: 'Haze', ...T('rbx_smoke'), Color: '#e6f0ff', Size: 12, Transparency: [[0, 1], [0.5, 0.8], [1, 1]], Rate: 8, Lifetime: [2, 3], Speed: [20, 25], EmissionDirection: 'Front' },
    ],
  },
  {
    name: 'Falling Leaves', category: 'Weather & Nature', desc: 'Autumn leaves tumbling down.', partSize: [20, 1, 20],
    layers: [
      { Name: 'Leaves', ...T('leaf'), Color: [[0, '#ffb13b'], [0.5, '#e8641c'], [1, '#a8321a']], Size: [[0, 0.8, 0.3], [1, 0.8, 0.3]], Transparency: [[0, 1], [0.05, 0], [0.9, 0], [1, 1]], Rate: 12, Lifetime: [6, 9], Speed: [2, 3], EmissionDirection: 'Bottom', SpreadAngle: [40, 40], Rotation: [0, 360], RotSpeed: [-120, 120], Acceleration: [1.5, 0, 0.5], Drag: 0.3 },
    ],
  },
  {
    name: 'Cherry Blossoms', category: 'Weather & Nature', desc: 'Pink sakura petals on the breeze.', partSize: [20, 1, 20],
    layers: [
      { Name: 'Petals', ...T('petal'), Color: ['#ffe3ef', '#ff9cc4'], Size: [[0, 0.5, 0.2], [1, 0.5, 0.2]], Transparency: [[0, 1], [0.05, 0], [0.9, 0], [1, 1]], Rate: 25, Lifetime: [6, 9], Speed: [1.5, 3], EmissionDirection: 'Bottom', SpreadAngle: [45, 45], Rotation: [0, 360], RotSpeed: [-150, 150], Acceleration: [2, 0, 1], Drag: 0.2 },
    ],
  },
  {
    name: 'Fireflies', category: 'Weather & Nature', desc: 'Slowly wandering glowing bugs.', partSize: [14, 4, 14],
    layers: [
      { Name: 'Fireflies', ...T('rbx_ff_glow'), Color: '#d8ff5a', Size: [[0, 0], [0.15, 0.35, 0.1], [0.5, 0.15], [0.85, 0.35], [1, 0]], LightEmission: 1, Brightness: 3, Rate: 6, Lifetime: [4, 7], Speed: [0.3, 0.8], SpreadAngle: [180, 180] },
    ],
  },
  {
    name: 'Bubbles', category: 'Weather & Nature', desc: 'Rising underwater bubbles.', partSize: [4, 0.5, 4],
    layers: [
      { Name: 'Bubbles', ...T('bubble'), Color: '#d8f6ff', Size: [[0, 0.3, 0.2], [1, 0.7, 0.3]], Transparency: [[0, 0.2], [0.9, 0.3], [1, 1]], Rate: 15, Lifetime: [2, 3.5], Speed: [2, 4], SpreadAngle: [12, 12], Acceleration: [0, 2, 0] },
    ],
  },
  {
    name: 'Waterfall Mist', category: 'Weather & Nature', desc: 'Spray and mist at the base of a waterfall.', partSize: [10, 1, 3],
    layers: [
      { Name: 'Mist', ...T('rbx_smoke'), Color: '#f2fbff', Size: [[0, 3], [1, 10]], Transparency: [[0, 0.5], [1, 1]], Rate: 25, Lifetime: [2, 3.5], Speed: [3, 6], SpreadAngle: [60, 30], Rotation: [0, 360], RotSpeed: [-25, 25], Drag: 0.8 },
      { Name: 'Spray', ...T('rbx_fire_sparks'), Color: '#ffffff', Size: [0.25, 0.1], Transparency: [0.2, 1], Rate: 60, Lifetime: [0.8, 1.4], Speed: [8, 14], SpreadAngle: [35, 35], Acceleration: [0, -30, 0] },
    ],
  },
  {
    name: 'Fountain', category: 'Weather & Nature', desc: 'Water arcing up and falling with gravity.', partSize: [0.6, 0.4, 0.6],
    layers: [
      { Name: 'Water', ...T('rbx_ff_glow'), Color: ['#e9fbff', '#5bc6ff'], Size: [[0, 0.5], [1, 0.9]], Transparency: [[0, 0.15], [1, 0.7]], Rate: 150, Lifetime: [1.4, 1.8], Speed: [18, 20], SpreadAngle: [8, 8], Acceleration: [0, -30, 0] },
    ],
  },
  {
    name: 'Lava Bubbles', category: 'Weather & Nature', desc: 'Molten glow with popping bubbles.', partSize: [10, 0.2, 10],
    layers: [
      { Name: 'Glow', ...T('rbx_ff_glow'), Color: '#ff5a10', Size: [[0, 0], [0.5, 4, 1.5], [1, 0]], Transparency: 0.5, LightEmission: 1, Rate: 15, Lifetime: [1.5, 2.5], Speed: 0.2, Shape: 'Disc' },
      { Name: 'Bubbles', ...T('bubble'), Color: '#ffb347', Size: [[0, 0], [0.8, 1.2, 0.4], [1, 1.6]], Transparency: [[0, 0], [0.9, 0], [1, 1]], LightEmission: 0.7, Rate: 8, Lifetime: [0.8, 1.4], Speed: 0.3, Shape: 'Disc' },
      { Name: 'Splash', ...T('rbx_fire_sparks'), Color: '#ffcf6a', Size: [0.3, 0], LightEmission: 1, Rate: 20, Lifetime: [0.6, 1], Speed: [5, 9], Shape: 'Disc', SpreadAngle: [30, 30], Acceleration: [0, -25, 0] },
    ],
  },
  {
    name: 'Sandstorm', category: 'Weather & Nature', desc: 'Dense sideways desert dust.', partSize: [1, 20, 40],
    layers: [
      { Name: 'Sand', ...T('rbx_smoke'), Color: ['#e6c48a', '#b98d4f'], Size: [[0, 6, 2], [1, 14]], Transparency: [[0, 1], [0.2, 0.55], [1, 1]], Rate: 30, Lifetime: [3, 4], Speed: [25, 35], EmissionDirection: 'Right', Rotation: [0, 360], RotSpeed: [-30, 30] },
      { Name: 'Grit', ...T('rbx_fire_sparks'), Color: '#d6b67a', Size: 0.15, Rate: 200, Lifetime: [1.5, 2], Speed: [40, 50], EmissionDirection: 'Right', SpreadAngle: [5, 5] },
    ],
  },

  /* ------------------------- Combat & Impact ------------------------- */
  {
    name: 'Explosion', category: 'Combat & Impact', desc: 'Fireball, sparks, smoke and shockwave — burst effect.', partSize: [2, 2, 2], burstLoop: 3,
    layers: [
      { Name: 'Fireball', ...T('rbx_exp_core'), Color: [[0, '#fff5c0'], [0.3, '#ffa32a'], [0.7, '#c2310c'], [1, '#2a0a05']], Size: [[0, 2, 1], [0.3, 7, 2], [1, 9]], Transparency: [[0, 0], [0.6, 0.2], [1, 1]], LightEmission: 0.8, Brightness: 2, Lifetime: [0.6, 1], Speed: [4, 10], Shape: 'Sphere', SpreadAngle: [180, 180], Drag: 4, Rotation: [0, 360], RotSpeed: [-60, 60], mode: 'burst', emitCount: 18, Enabled: false },
      { Name: 'Sparks', ...T('rbx_fire_sparks'), Color: '#ffcf6a', Size: [[0, 0.5], [1, 0]], Squash: -2, LightEmission: 1, Brightness: 3, Lifetime: [0.6, 1.2], Speed: [30, 50], Shape: 'Sphere', Drag: 2.5, Acceleration: [0, -20, 0], Orientation: 'VelocityParallel', mode: 'burst', emitCount: 40, Enabled: false },
      { Name: 'Smoke', ...T('rbx_exp_smoke'), Color: '#3a3330', Size: [[0, 4], [1, 12, 2]], Transparency: [[0, 1], [0.2, 0.3], [1, 1]], Lifetime: [2, 3], Speed: [6, 12], Shape: 'Sphere', Drag: 2, Rotation: [0, 360], RotSpeed: [-20, 20], Acceleration: [0, 3, 0], ZOffset: -1, mode: 'burst', emitCount: 14, emitDelay: 0.05, Enabled: false },
      { point: true, Name: 'Shockwave', ...T('rbx_exp_shock'), Color: '#ffe2b0', Size: [2, 30], Transparency: [[0, 0.2], [1, 1]], LightEmission: 1, Lifetime: [0.45, 0.45], Speed: 0.01, Orientation: 'VelocityPerpendicular', mode: 'burst', emitCount: 1, Enabled: false },
    ],
  },
  {
    name: 'Hit Sparks', category: 'Combat & Impact', desc: 'Sharp metal impact sparks.', partSize: [0.5, 0.5, 0.5], burstLoop: 0.8,
    layers: [
      { Name: 'Sparks', ...T('streak'), Color: ['#ffffff', '#ffd36b'], Size: [[0, 0.8], [1, 0]], Squash: -1.5, LightEmission: 1, Brightness: 3, Lifetime: [0.2, 0.4], Speed: [20, 35], Shape: 'Sphere', SpreadAngle: [180, 180], Drag: 4, Acceleration: [0, -15, 0], Orientation: 'VelocityParallel', mode: 'burst', emitCount: 16, Enabled: false },
      { point: true, Name: 'Flash', ...T('rbx_sparkles'), Color: '#ffffff', Size: [3, 0], LightEmission: 1, Brightness: 3, Lifetime: [0.12, 0.12], Speed: 0, Rotation: [0, 90], mode: 'burst', emitCount: 1, Enabled: false },
    ],
  },
  {
    name: 'Sword Slash', category: 'Combat & Impact', desc: 'Arc slash flash for melee swings.', partSize: [1, 1, 1], burstLoop: 1,
    layers: [
      { point: true, Name: 'Slash', ...T('slash'), Color: ['#ffffff', '#8fd8ff'], Size: [6, 8], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 2, Lifetime: [0.25, 0.25], Speed: 0, Rotation: [-20, 20], mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Glints', ...T('rbx_sparkles'), Color: '#c9efff', Size: [0.6, 0], LightEmission: 1, Lifetime: [0.3, 0.5], Speed: [6, 12], SpreadAngle: [180, 40], Drag: 4, mode: 'burst', emitCount: 10, Enabled: false },
    ],
  },
  {
    name: 'Muzzle Flash', category: 'Combat & Impact', desc: 'Short gun flash pointing Front (-Z).', partSize: [0.3, 0.3, 0.3], burstLoop: 0.4,
    layers: [
      { Name: 'Flash', ...T('rbx_fire'), Color: ['#fffbe0', '#ffb33a'], Size: [[0, 1.2, 0.3], [1, 0.4]], Squash: -1, LightEmission: 1, Brightness: 3, Lifetime: [0.06, 0.09], Speed: [20, 30], EmissionDirection: 'Front', SpreadAngle: [8, 8], Orientation: 'VelocityParallel', mode: 'burst', emitCount: 4, Enabled: false },
      { Name: 'Smoke', ...T('rbx_smoke'), Color: '#9a9a9a', Size: [[0, 0.5], [1, 2]], Transparency: [[0, 0.6], [1, 1]], Lifetime: [0.5, 0.8], Speed: [4, 6], EmissionDirection: 'Front', SpreadAngle: [15, 15], Drag: 3, mode: 'burst', emitCount: 3, Enabled: false },
    ],
  },
  {
    name: 'Ground Slam', category: 'Combat & Impact', desc: 'Dust ring + rock debris for stomps.', partSize: [1, 0.2, 1], burstLoop: 2,
    layers: [
      { Name: 'Ring Dust', ...T('rbx_smoke'), Color: '#b8a184', Size: [[0, 2], [1, 6]], Transparency: [[0, 0.3], [1, 1]], Lifetime: [0.8, 1.2], Speed: [25, 30], Shape: 'Disc', ShapeStyle: 'Surface', Drag: 4, Rotation: [0, 360], mode: 'burst', emitCount: 30, Enabled: false },
      { Name: 'Debris', ...T('square'), Color: '#6b5a48', Size: [[0, 0.5, 0.25], [1, 0.4, 0.2]], Lifetime: [0.8, 1.2], Speed: [15, 25], SpreadAngle: [40, 40], RotSpeed: [-300, 300], Acceleration: [0, -60, 0], mode: 'burst', emitCount: 16, Enabled: false },
      { point: true, Name: 'Shock', ...T('rbx_exp_shock'), Color: '#ffffff', Size: [2, 22], Transparency: [[0, 0.3], [1, 1]], Lifetime: [0.4, 0.4], Speed: 0.01, Orientation: 'VelocityPerpendicular', mode: 'burst', emitCount: 1, Enabled: false },
    ],
  },
  {
    name: 'Hit Marker Pop', category: 'Combat & Impact', desc: 'Cartoony white/red hit marker pop.', partSize: [0.5, 0.5, 0.5], burstLoop: 0.8,
    layers: [
      { point: true, Name: 'Pop', ...T('star6'), Color: ['#ffffff', '#ff3b3b'], Size: [[0, 1], [0.3, 3], [1, 3.5]], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Lifetime: [0.25, 0.25], Speed: 0, Rotation: [0, 45], mode: 'burst', emitCount: 1, Enabled: false },
    ],
  },
  {
    name: 'Fireworks', category: 'Combat & Impact', desc: 'Colourful exploding shell with falling trails.', partSize: [1, 1, 1], burstLoop: 2.5,
    layers: [
      { Name: 'Shell', ...T('rbx_sparkles'), Color: [[0, '#ffffff'], [0.15, '#ff4fd8'], [1, '#4f7bff']], Size: [[0, 0.8], [0.8, 0.5], [1, 0]], LightEmission: 1, Brightness: 3, Lifetime: [1.4, 2], Speed: [18, 24], Shape: 'Sphere', ShapeStyle: 'Surface', Drag: 1.8, Acceleration: [0, -6, 0], mode: 'burst', emitCount: 120, Enabled: false },
      { point: true, Name: 'Flash', ...T('rbx_ff_glow'), Color: '#fff0fa', Size: [20, 30], Transparency: [[0, 0.3], [1, 1]], LightEmission: 1, Lifetime: [0.3, 0.3], Speed: 0, mode: 'burst', emitCount: 1, Enabled: false },
    ],
  },

  /* ------------------------- Sci-Fi & Energy ------------------------- */
  {
    name: 'Electric Sparks', category: 'Sci-Fi & Energy', desc: 'Crackling electric arcs for broken machinery.', partSize: [1, 1, 1],
    layers: [
      { Name: 'Bolts', ...T('lightning'), Color: ['#ffffff', '#6ad8ff'], Size: [[0, 2.5, 1], [1, 1.5]], LightEmission: 1, Brightness: 3, Rate: 14, Lifetime: [0.06, 0.12], Speed: 0, Rotation: [0, 360], Shape: 'Sphere' },
      { Name: 'Sparks', ...T('streak'), Color: '#b8f0ff', Size: [0.6, 0], Squash: -1.5, LightEmission: 1, Brightness: 2, Rate: 25, Lifetime: [0.2, 0.5], Speed: [8, 16], SpreadAngle: [180, 180], Acceleration: [0, -20, 0], Orientation: 'VelocityParallel' },
    ],
  },
  {
    name: 'Plasma Orb', category: 'Sci-Fi & Energy', desc: 'Pulsing energy core with orbiting glints.', partSize: [2, 2, 2],
    layers: [
      { point: true, Name: 'Core', ...T('rbx_ff_glow'), Color: ['#ffffff', '#3cf0ff'], Size: [[0, 3], [0.5, 4.5], [1, 3]], Transparency: [[0, 0.6], [0.5, 0.2], [1, 0.6]], LightEmission: 1, Brightness: 2, Rate: 6, Lifetime: [0.6, 0.6], Speed: 0, LockedToPart: true },
      { point: true, Name: 'Swirl', ...T('rbx_ff_vortex'), Color: '#4ad8ff', Size: [3, 4], Transparency: [[0, 1], [0.5, 0.4], [1, 1]], LightEmission: 1, Rate: 5, Lifetime: [0.8, 1.2], Speed: 0, Rotation: [0, 360], RotSpeed: [-300, 300], LockedToPart: true },
      { Name: 'Glints', ...T('rbx_fire_sparks'), Color: '#c9fbff', Size: [0.3, 0], LightEmission: 1, Rate: 30, Lifetime: [0.4, 0.8], Speed: [3, 6], Shape: 'Sphere', ShapeStyle: 'Surface' },
    ],
  },
  {
    name: 'Charge Up', category: 'Sci-Fi & Energy', desc: 'Particles sucked inward — charging a beam or ability.', partSize: [6, 6, 6],
    layers: [
      { Name: 'Inflow', ...T('streak'), Color: ['#9ffcff', '#ffffff'], Size: [[0, 0], [0.3, 0.8], [1, 0.2]], Squash: -1, LightEmission: 1, Brightness: 2, Rate: 60, Lifetime: [0.5, 0.5], Speed: [6, 6], Shape: 'Sphere', ShapeStyle: 'Surface', ShapeInOut: 'Inward', Orientation: 'VelocityParallel' },
      { point: true, Name: 'Core', ...T('rbx_ff_glow'), Color: '#aefcff', Size: [[0, 1], [0.5, 2], [1, 1]], Transparency: 0.3, LightEmission: 1, Brightness: 2, Rate: 8, Lifetime: [0.4, 0.4], Speed: 0, LockedToPart: true },
    ],
  },
  {
    name: 'Black Hole', category: 'Sci-Fi & Energy', desc: 'Dark core devouring a spiralling accretion disc.', partSize: [12, 0.4, 12],
    layers: [
      { Name: 'Accretion', ...T('rbx_ff_glow'), Color: ['#ffd38a', '#ff4a2a', '#5a10ff'], Size: [[0, 1], [1, 0.2]], LightEmission: 1, Rate: 120, Lifetime: [0.9, 0.9], Speed: [6, 6], Shape: 'Cylinder', ShapeStyle: 'Surface', ShapeInOut: 'Inward', EmissionDirection: 'Top' },
      { point: true, Name: 'Core', ...T('circle'), Color: '#000000', Size: 3.5, Rate: 5, Lifetime: [0.5, 0.5], Speed: 0, ZOffset: 2, LockedToPart: true },
    ],
  },
  {
    name: 'Warp Speed', category: 'Sci-Fi & Energy', desc: 'Star streaks flying past — hyperspace tunnel.', partSize: [30, 30, 1],
    layers: [
      { Name: 'Stars', ...T('streak'), Color: ['#ffffff', '#8fb8ff'], Size: [[0, 0.2], [1, 1.2]], Squash: -2.5, Transparency: [[0, 1], [0.3, 0], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 200, Lifetime: [0.6, 0.8], Speed: [60, 90], EmissionDirection: 'Back', Orientation: 'VelocityParallel' },
    ],
  },
  {
    name: 'Hologram Glitch', category: 'Sci-Fi & Energy', desc: 'Flickering digital squares.', partSize: [3, 5, 3],
    layers: [
      { Name: 'Pixels', ...T('square'), Color: ['#3cffe6', '#3c8cff'], Size: [[0, 0.3, 0.2], [1, 0.3, 0.2]], Transparency: [[0, 0], [0.5, 0.6], [1, 1]], LightEmission: 1, Rate: 60, Lifetime: [0.2, 0.6], Speed: [0, 0.5], Shape: 'Box', ShapeStyle: 'Surface', Orientation: 'FacingCameraWorldUp', LockedToPart: true },
      { Name: 'Scanlines', ...T('square'), Color: '#3cffe6', Size: 3, Squash: 3, Transparency: [[0, 1], [0.5, 0.7], [1, 1]], LightEmission: 1, Rate: 4, Lifetime: [1, 1], Speed: [5, 5], EmissionDirection: 'Top', Orientation: 'FacingCameraWorldUp' },
    ],
  },
  {
    name: 'Jet Thruster', category: 'Sci-Fi & Energy', desc: 'Engine exhaust pointing down.', partSize: [1, 0.4, 1],
    layers: [
      { Name: 'Flame', ...T('rbx_fire'), Color: ['#ffffff', '#5ac8ff', '#2a2aff'], Size: [[0, 1.4], [1, 0.2]], Squash: -1, Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 2, Rate: 120, Lifetime: [0.2, 0.3], Speed: [25, 30], EmissionDirection: 'Bottom', SpreadAngle: [4, 4], Orientation: 'VelocityParallel', LockedToPart: true },
      { Name: 'Heat Haze', ...T('rbx_smoke'), Color: '#888888', Size: [[0, 1], [1, 4]], Transparency: [[0, 0.7], [1, 1]], Rate: 20, Lifetime: [0.8, 1.2], Speed: [12, 16], EmissionDirection: 'Bottom', SpreadAngle: [10, 10], Drag: 2 },
    ],
  },
  {
    name: 'Neon Pulse', category: 'Sci-Fi & Energy', desc: 'Expanding neon rings — speakers, scanners, radar.', partSize: [1, 0.2, 1],
    layers: [
      { point: true, Name: 'Rings', ...T('ring'), Color: ['#ff3cf0', '#3cf0ff'], Size: [1, 20], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 2, Rate: 2, Lifetime: [1.5, 1.5], Speed: 0.01, Orientation: 'VelocityPerpendicular' },
    ],
  },

  /* -------------------------- Fun & Rewards -------------------------- */
  {
    name: 'Confetti', category: 'Fun & Rewards', desc: 'Party confetti cannon burst.', partSize: [1, 1, 1], burstLoop: 3,
    layers: [
      { Name: 'Confetti', ...T('confetti'), Color: [[0, '#ff4a6a'], [0.25, '#ffd23a'], [0.5, '#4aff8f'], [0.75, '#3ab8ff'], [1, '#c64aff']], Size: [[0, 0.5, 0.2], [1, 0.5, 0.2]], Transparency: [[0, 0], [0.85, 0], [1, 1]], Lifetime: [2.5, 3.5], Speed: [20, 30], SpreadAngle: [35, 35], Rotation: [0, 360], RotSpeed: [-400, 400], Acceleration: [0, -18, 0], Drag: 1.5, mode: 'burst', emitCount: 120, Enabled: false },
    ],
  },
  {
    name: 'Hearts', category: 'Fun & Rewards', desc: 'Floating love hearts.', partSize: [2, 2, 2],
    layers: [
      { Name: 'Hearts', ...T('heart'), Color: ['#ff8ab8', '#ff2a6a'], Size: [[0, 0], [0.2, 0.9, 0.3], [1, 0.6]], Transparency: [[0, 0], [0.8, 0], [1, 1]], LightEmission: 0.3, Rate: 6, Lifetime: [1.5, 2.5], Speed: [2, 3], SpreadAngle: [25, 25], Rotation: [-15, 15] },
    ],
  },
  {
    name: 'Star Pop', category: 'Fun & Rewards', desc: 'Cartoon stars popping outward.', partSize: [1, 1, 1], burstLoop: 1.5,
    layers: [
      { Name: 'Stars', ...T('star5'), Color: ['#fff36a', '#ffb02a'], Size: [[0, 1, 0.4], [1, 0]], LightEmission: 0.5, Lifetime: [0.6, 0.9], Speed: [10, 16], Shape: 'Sphere', Drag: 3, Rotation: [0, 360], RotSpeed: [-200, 200], mode: 'burst', emitCount: 12, Enabled: false },
    ],
  },
  {
    name: 'Coin Burst', category: 'Fun & Rewards', desc: 'Gold pickup burst with sparkle.', partSize: [1, 1, 1], burstLoop: 1.6,
    layers: [
      { Name: 'Coins', ...T('circle'), Color: '#ffcc2a', Size: [[0, 0.7], [1, 0.6]], Squash: [[0, 0], [0.25, 2], [0.5, 0], [0.75, 2], [1, 0]], Lifetime: [0.8, 1], Speed: [14, 20], SpreadAngle: [30, 30], Acceleration: [0, -50, 0], mode: 'burst', emitCount: 10, Enabled: false },
      { Name: 'Shine', ...T('rbx_sparkles'), Color: '#fff6c0', Size: [[0, 0], [0.3, 1.2], [1, 0]], LightEmission: 1, Brightness: 2, Lifetime: [0.4, 0.6], Speed: [3, 6], Shape: 'Sphere', mode: 'burst', emitCount: 8, Enabled: false },
    ],
  },
  {
    name: 'Rainbow Trail', category: 'Fun & Rewards', desc: 'Colour-cycling trail — turn on "Move emitter".', partSize: [0.5, 0.5, 0.5],
    layers: [
      { Name: 'Trail', ...T('rbx_ff_glow'), Color: [[0, '#ff3a3a'], [0.17, '#ff9a2a'], [0.33, '#ffee2a'], [0.5, '#3aff5a'], [0.67, '#2ac8ff'], [0.83, '#5a3aff'], [1, '#d42aff']], Size: [1.5, 0], LightEmission: 1, Rate: 100, Lifetime: [1, 1], Speed: 0 },
    ],
  },
  {
    name: 'Galaxy Swirl', category: 'Fun & Rewards', desc: 'Starry cosmic cloud.', partSize: [8, 8, 8],
    layers: [
      { Name: 'Nebula', ...T('rbx_smoke'), Color: ['#6a2cff', '#ff2ad4', '#2ab8ff'], Size: [[0, 5, 2], [1, 8]], Transparency: [[0, 1], [0.5, 0.6], [1, 1]], LightEmission: 1, Rate: 10, Lifetime: [3, 5], Speed: [0.2, 0.6], Shape: 'Sphere', Rotation: [0, 360], RotSpeed: [-15, 15] },
      { Name: 'Stars', ...T('rbx_sparkles'), Color: '#ffffff', Size: [[0, 0], [0.5, 0.4, 0.2], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 40, Lifetime: [1, 2], Speed: 0, Shape: 'Sphere' },
    ],
  },
  {
    name: 'Ice Frost', category: 'Fun & Rewards', desc: 'Freezing aura with drifting crystals.', partSize: [3, 4, 3],
    layers: [
      { Name: 'Frost Mist', ...T('rbx_smoke'), Color: '#cfefff', Size: [[0, 1], [1, 4]], Transparency: [[0, 1], [0.3, 0.6], [1, 1]], LightEmission: 0.3, Rate: 12, Lifetime: [1.5, 2.5], Speed: [0.5, 1], Shape: 'Cylinder', Acceleration: [0, -1, 0] },
      { Name: 'Crystals', ...T('snowflake'), Color: '#e6f8ff', Size: [[0, 0], [0.3, 0.6, 0.2], [1, 0]], LightEmission: 0.8, Rate: 15, Lifetime: [1.5, 2.2], Speed: [0.5, 1.5], Shape: 'Cylinder', RotSpeed: [-60, 60] },
    ],
  },
  {
    name: 'Speed Boost', category: 'Fun & Rewards', desc: 'Upward wind streaks around a character.', partSize: [3, 5, 3],
    layers: [
      { Name: 'Streaks', ...T('streak'), Color: '#e6fbff', Size: [[0, 0.6], [1, 0.4]], Squash: -2, Transparency: [[0, 1], [0.3, 0.3], [1, 1]], LightEmission: 1, Rate: 40, Lifetime: [0.3, 0.5], Speed: [20, 25], Shape: 'Disc', ShapeStyle: 'Surface', EmissionDirection: 'Top', Orientation: 'VelocityParallel' },
    ],
  },
];
