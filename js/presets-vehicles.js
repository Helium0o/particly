'use strict';
/*
 * Vehicle presets. Exhaust-style effects emit from the part's Back face (+Z) because a
 * Roblox car drives toward its Front (-Z). Turn on "Drive" in the preview to see them at speed.
 * Most use the "Vehicle boost" behaviour: hold the key while driving (see behaviours.js).
 */

const VEH = (o = {}) => ({ mode: 'vehicle', key: 'LeftShift', ...o });

/** A nitro jet in any colour scheme. */
function nitroPreset(name, desc, core, flame, spark, extra = {}) {
  return {
    name, category: 'Vehicles', desc, partSize: [0.6, 0.6, 0.6], trigger: VEH(), burstLoop: 1.5,
    layers: [
      { Name: 'Core', ...T('rbx_ff_glow'), Color: core, Size: [[0, 1.1], [1, 0.25]], Squash: -1.6, Transparency: [[0, 0], [1, 0.6]], LightEmission: 1, Brightness: 3, Rate: 140, Lifetime: [0.08, 0.12], Speed: [38, 42], EmissionDirection: 'Back', SpreadAngle: [2, 2], Orientation: 'VelocityParallel', LockedToPart: true },
      { Name: 'Flame', ...T('rbx_fire'), Color: flame, Size: [[0, 1.3, 0.25], [0.6, 0.9], [1, 0.2]], Squash: -1.1, Transparency: [[0, 0.05], [0.7, 0.4], [1, 1]], LightEmission: 1, Brightness: 2, Rate: 110, Lifetime: [0.16, 0.26], Speed: [28, 34], EmissionDirection: 'Back', SpreadAngle: [6, 6], Rotation: [-10, 10], Orientation: 'VelocityParallel', LockedToPart: true },
      { Name: 'Sparks', ...T('rbx_fire_sparks'), Color: spark, Size: [[0, 0.3], [1, 0]], Squash: -2, LightEmission: 1, Brightness: 3, Rate: 35, Lifetime: [0.3, 0.55], Speed: [18, 30], EmissionDirection: 'Back', SpreadAngle: [16, 16], Drag: 1.5, Orientation: 'VelocityParallel' },
      { Name: 'Ignition Pop', ...T('rbx_ff_glow'), point: true, Color: core, Size: [[0, 1.5], [1, 3.5]], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 3, Lifetime: [0.14, 0.14], Speed: 0, mode: 'burst', emitCount: 1, Enabled: false },
      ...(extra.layers || []),
    ],
  };
}

PRESETS.push(
  nitroPreset('Nitro Boost (Blue)', 'Classic blue NOS flame — hold Shift while driving.', ['#ffffff', '#7fe7ff'], [[0, '#e8fbff'], [0.35, '#3fb4ff'], [1, '#3a2cff']], ['#ffffff', '#8fe9ff']),
  nitroPreset('Nitro Boost (Red Hot)', 'Orange-red racing nitro with hot sparks.', ['#fffbe6', '#ffd36b'], [[0, '#fff3c0'], [0.35, '#ff8a1a'], [1, '#d4200c']], ['#fff3c0', '#ffb347']),
  nitroPreset('Nitro Boost (Purple)', 'Purple / pink street-racer nitro.', ['#ffffff', '#f2a8ff'], [[0, '#ffe6ff'], [0.35, '#d24aff'], [1, '#6a2cff']], ['#ffffff', '#ff8ef2']),
  nitroPreset('Nitro Boost (Toxic Green)', 'Radioactive green nitro.', ['#ffffff', '#c8ff9a'], [[0, '#f2ffe0'], [0.35, '#6aff3a'], [1, '#13a84a']], ['#ffffff', '#b6ff6a']),
  nitroPreset('Nitro Boost (Rainbow)', 'Colour-cycling party nitro.', ['#ffffff', '#ffffff'], [[0, '#ff3a3a'], [0.2, '#ffb02a'], [0.4, '#ffee2a'], [0.6, '#3aff6a'], [0.8, '#2ab8ff'], [1, '#b03aff']], ['#ffffff', '#ffd6ff']),
  nitroPreset('Plasma Boost', 'Sci-fi white-hot plasma drive with a shock ring.', ['#ffffff', '#ffd6f8'], [[0, '#ffffff'], [0.4, '#ff6ad5'], [1, '#2a0aff']], ['#ffffff', '#ff9ff0'], {
    layers: [{ Name: 'Shock Ring', ...T('rbx_exp_shock'), Color: '#ffb3f2', Size: [[0, 0.6], [1, 1.6]], Transparency: [[0, 0.2], [1, 1]], LightEmission: 1, Rate: 12, Lifetime: [0.2, 0.2], Speed: [20, 20], EmissionDirection: 'Back', Orientation: 'VelocityPerpendicular', LockedToPart: true }],
  }),
  {
    name: 'Exhaust Smoke (Idle)', category: 'Vehicles', desc: 'Light grey puffs from the tailpipe — always on.', partSize: [0.5, 0.5, 0.5],
    layers: [
      { Name: 'Exhaust', ...T('rbx_smoke'), Color: ['#c8c8c8', '#8a8a8a'], Size: [[0, 0.4], [1, 2.6, 0.5]], Transparency: [[0, 0.55], [1, 1]], Rate: 10, Lifetime: [1.2, 2], Speed: [2.5, 4], EmissionDirection: 'Back', SpreadAngle: [10, 10], Rotation: [0, 360], RotSpeed: [-40, 40], Acceleration: [0, 1, 0], Drag: 1 },
    ],
  },
  {
    name: 'Diesel Black Smoke', category: 'Vehicles', desc: 'Thick black "rolling coal" smoke while boosting. Stack exhausts for trucks.', partSize: [0.8, 0.8, 0.8], trigger: VEH(),
    layers: [
      { Name: 'Black Smoke', ...T('rbx_smoke'), Color: ['#2a2a2a', '#111111'], Size: [[0, 1], [1, 9, 2]], Transparency: [[0, 0.15], [0.6, 0.5], [1, 1]], Rate: 45, Lifetime: [1.5, 2.5], Speed: [10, 16], EmissionDirection: 'Top', SpreadAngle: [12, 12], Rotation: [0, 360], RotSpeed: [-30, 30], Acceleration: [0, 3, 3], Drag: 1.2 },
      { Name: 'Soot', ...T('rbx_fire_sparks'), Color: '#3a3a3a', Size: 0.2, Rate: 20, Lifetime: [1, 1.6], Speed: [8, 14], EmissionDirection: 'Top', SpreadAngle: [20, 20], Acceleration: [0, -6, 4] },
    ],
  },
  {
    name: 'Backfire Flames', category: 'Vehicles', desc: 'Pops of flame and sparks from the exhaust each time the key is pressed.', partSize: [0.5, 0.5, 0.5], trigger: VEH({ key: 'B', buttonText: 'BACKFIRE' }), burstLoop: 1.2,
    layers: [
      { Name: 'Pop', ...T('rbx_fire'), Color: ['#ffffff', '#ffb02a', '#ff3a0c'], Size: [[0, 0.6, 0.2], [0.3, 2], [1, 1]], Squash: -0.8, Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 3, Lifetime: [0.12, 0.2], Speed: [14, 20], EmissionDirection: 'Back', SpreadAngle: [10, 10], Drag: 6, Orientation: 'VelocityParallel', mode: 'burst', emitCount: 6, Enabled: false },
      { Name: 'Sparks', ...T('rbx_fire_sparks'), Color: '#ffcf6a', Size: [0.25, 0], Squash: -2, LightEmission: 1, Brightness: 3, Lifetime: [0.3, 0.6], Speed: [14, 26], EmissionDirection: 'Back', SpreadAngle: [25, 25], Acceleration: [0, -20, 0], Orientation: 'VelocityParallel', mode: 'burst', emitCount: 14, Enabled: false },
      { Name: 'Puff', ...T('rbx_smoke'), Color: '#555555', Size: [[0, 0.6], [1, 2.5]], Transparency: [[0, 0.4], [1, 1]], Lifetime: [0.6, 0.9], Speed: [4, 6], EmissionDirection: 'Back', SpreadAngle: [15, 15], Drag: 3, mode: 'burst', emitCount: 3, emitDelay: 0.05, Enabled: false },
    ],
  },
  {
    name: 'Tire Smoke (Drift)', category: 'Vehicles', desc: 'Thick white drift smoke from the rear wheels — hold Q. Put one at each rear tyre.', partSize: [1, 0.3, 1.5], trigger: VEH({ key: 'Q', buttonText: 'DRIFT' }),
    layers: [
      { Name: 'Smoke', ...T('rbx_smoke'), Color: ['#ffffff', '#d6d6d6'], Size: [[0, 1.5], [1, 10, 2]], Transparency: [[0, 0.3], [0.5, 0.55], [1, 1]], Rate: 40, Lifetime: [2, 3], Speed: [4, 9], EmissionDirection: 'Back', SpreadAngle: [35, 20], Rotation: [0, 360], RotSpeed: [-25, 25], Acceleration: [0, 1.5, 0], Drag: 1.6, VelocityInheritance: 0.2 },
    ],
  },
  {
    name: 'Drift Smoke (Coloured)', category: 'Vehicles', desc: 'Pink & cyan show-off drift smoke — hold Q.', partSize: [1, 0.3, 1.5], trigger: VEH({ key: 'Q', buttonText: 'DRIFT' }),
    layers: [
      { Name: 'Smoke', ...T('rbx_smoke'), Color: ['#ff6ad5', '#6ad8ff'], Size: [[0, 1.5], [1, 9, 2]], Transparency: [[0, 0.3], [1, 1]], LightEmission: 0.3, Rate: 40, Lifetime: [2, 3], Speed: [4, 9], EmissionDirection: 'Back', SpreadAngle: [35, 20], Rotation: [0, 360], RotSpeed: [-25, 25], Acceleration: [0, 1.5, 0], Drag: 1.6 },
    ],
  },
  {
    name: 'Scrape Sparks', category: 'Vehicles', desc: 'Sparks from a lowered car scraping the road — hold Q.', partSize: [3, 0.2, 1], trigger: VEH({ key: 'Q', buttonText: 'DRIFT' }),
    layers: [
      { Name: 'Sparks', ...T('rbx_fire_sparks'), Color: ['#ffffff', '#ffb02a'], Size: [[0, 0.35], [1, 0]], Squash: -2.5, LightEmission: 1, Brightness: 3, Rate: 120, Lifetime: [0.25, 0.6], Speed: [12, 30], EmissionDirection: 'Back', SpreadAngle: [25, 8], Acceleration: [0, -30, 0], Drag: 0.8, Orientation: 'VelocityParallel' },
    ],
  },
  {
    name: 'Burnout', category: 'Vehicles', desc: 'Spinning-wheel burnout: rubber smoke and bits — hold Q.', partSize: [1, 0.4, 1.5], trigger: VEH({ key: 'Q', buttonText: 'DRIFT' }),
    layers: [
      { Name: 'Rubber Smoke', ...T('rbx_smoke'), Color: ['#f0f0f0', '#9a9a9a'], Size: [[0, 2], [1, 12, 3]], Transparency: [[0, 0.25], [1, 1]], Rate: 30, Lifetime: [2.5, 3.5], Speed: [2, 6], EmissionDirection: 'Top', SpreadAngle: [60, 60], Rotation: [0, 360], RotSpeed: [-20, 20], Acceleration: [0, 2, 2], Drag: 1 },
      { Name: 'Rubber Bits', ...T('rbx_fire_sparks'), Color: '#202020', Size: 0.25, Rate: 25, Lifetime: [0.5, 0.9], Speed: [8, 14], EmissionDirection: 'Back', SpreadAngle: [30, 30], Acceleration: [0, -40, 0] },
    ],
  },
  {
    name: 'Dirt Kick-Up', category: 'Vehicles', desc: 'Off-road wheel dirt and dust — always on at each tyre.', partSize: [1, 0.3, 1],
    layers: [
      { Name: 'Dust', ...T('rbx_smoke'), Color: '#b89a6e', Size: [[0, 1], [1, 5, 1]], Transparency: [[0, 0.4], [1, 1]], Rate: 20, Lifetime: [1, 1.8], Speed: [5, 9], EmissionDirection: 'Back', SpreadAngle: [30, 30], Rotation: [0, 360], Acceleration: [0, 1, 0], Drag: 2 },
      { Name: 'Clods', ...T('rbx_fire_sparks'), Color: '#6b4f2e', Size: [[0, 0.35, 0.15], [1, 0.3]], Rate: 25, Lifetime: [0.6, 1], Speed: [10, 16], EmissionDirection: 'Back', SpreadAngle: [25, 25], Acceleration: [0, -50, 0] },
    ],
  },
  {
    name: 'Mud Splash', category: 'Vehicles', desc: 'Put on a puddle: splashes when a car or player drives through.', partSize: [8, 0.4, 8], trigger: { mode: 'touch', duration: 0.3, cooldown: 0.4 }, burstLoop: 1.5,
    layers: [
      { Name: 'Splash', ...T('rbx_fire_sparks'), Color: '#5a3e22', Size: [[0, 0.6, 0.2], [1, 0.4]], Lifetime: [0.6, 1], Speed: [12, 20], SpreadAngle: [40, 40], Acceleration: [0, -50, 0], Shape: 'Disc', mode: 'burst', emitCount: 40, Enabled: false },
      { Name: 'Spray', ...T('rbx_smoke'), Color: '#7a5a38', Size: [[0, 1], [1, 4]], Transparency: [[0, 0.3], [1, 1]], Lifetime: [0.6, 1], Speed: [6, 10], SpreadAngle: [50, 50], Drag: 3, Shape: 'Disc', mode: 'burst', emitCount: 12, Enabled: false },
    ],
  },
  {
    name: 'Water Spray (Boat Wake)', category: 'Vehicles', desc: 'White spray thrown off the back of a boat or jet ski.', partSize: [3, 0.3, 1],
    layers: [
      { Name: 'Spray', ...T('rbx_fire_sparks'), Color: '#ffffff', Size: [[0, 0.4], [1, 0.15]], Transparency: [[0, 0.1], [1, 1]], Rate: 160, Lifetime: [0.5, 0.9], Speed: [12, 20], EmissionDirection: 'Back', SpreadAngle: [30, 25], Acceleration: [0, -35, 0] },
      { Name: 'Mist', ...T('rbx_smoke'), Color: '#eaf6ff', Size: [[0, 1.5], [1, 6]], Transparency: [[0, 0.5], [1, 1]], Rate: 20, Lifetime: [1, 1.6], Speed: [6, 10], EmissionDirection: 'Back', SpreadAngle: [30, 20], Drag: 2 },
    ],
  },
  {
    name: 'Boost Pad', category: 'Vehicles', desc: 'Drive over it for a speed-up flash (add your own speed code with ParticlyControl).', partSize: [10, 0.4, 14], trigger: { mode: 'touch', duration: 0.6, cooldown: 0.5 },
    layers: [
      { Name: 'Chevrons', ...T('rbx_sparkles'), Color: ['#ffffff', '#ffd23a'], Size: [[0, 0], [0.3, 1.2], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 60, Lifetime: [0.4, 0.6], Speed: [20, 30], EmissionDirection: 'Front', Shape: 'Box', ShapeStyle: 'Surface' },
      { Name: 'Flash', ...T('rbx_ff_glow'), point: true, Color: '#ffd23a', Size: [8, 14], Transparency: [[0, 0.4], [1, 1]], LightEmission: 1, Lifetime: [0.3, 0.3], Speed: 0.01, Orientation: 'VelocityPerpendicular', mode: 'burst', emitCount: 1, Enabled: false },
    ],
  },
  {
    name: 'Afterburner', category: 'Vehicles', desc: 'Jet afterburner with shock diamonds — for planes, hold Shift.', partSize: [1.5, 1.5, 0.5], trigger: VEH(),
    layers: [
      { Name: 'Core', ...T('rbx_fire'), Color: ['#ffffff', '#ffb347', '#ff5a1a'], Size: [[0, 1.6], [1, 0.4]], Squash: -1.5, Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 3, Rate: 160, Lifetime: [0.12, 0.2], Speed: [45, 55], EmissionDirection: 'Back', SpreadAngle: [3, 3], Orientation: 'VelocityParallel', LockedToPart: true },
      { Name: 'Shock Diamonds', ...T('rbx_exp_shock'), Color: '#ffd9a0', Size: [[0, 1.4], [1, 0.6]], Transparency: [[0, 0.3], [1, 1]], LightEmission: 1, Rate: 25, Lifetime: [0.18, 0.18], Speed: [30, 30], EmissionDirection: 'Back', Orientation: 'VelocityPerpendicular', LockedToPart: true },
      { Name: 'Heat Haze', ...T('rbx_smoke'), Color: '#777777', Size: [[0, 1.5], [1, 5]], Transparency: [[0, 0.75], [1, 1]], Rate: 20, Lifetime: [0.6, 1], Speed: [25, 30], EmissionDirection: 'Back', SpreadAngle: [6, 6], Drag: 2 },
    ],
  },
  {
    name: 'Rocket Booster', category: 'Vehicles', desc: 'Huge rocket flame with a thick smoke trail — hold Shift.', partSize: [2, 2, 1], trigger: VEH(),
    layers: [
      { Name: 'Flame', ...T('rbx_fire'), Color: [[0, '#ffffff'], [0.3, '#ffcf5a'], [1, '#ff4a0c']], Size: [[0, 3, 0.5], [1, 1]], Squash: -1.2, Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 3, Rate: 120, Lifetime: [0.2, 0.3], Speed: [40, 50], EmissionDirection: 'Back', SpreadAngle: [4, 4], Orientation: 'VelocityParallel', LockedToPart: true },
      { Name: 'Smoke Trail', ...T('rbx_smoke'), Color: ['#ffffff', '#9a9a9a'], Size: [[0, 2.5], [1, 12, 3]], Transparency: [[0, 0.2], [1, 1]], Rate: 40, Lifetime: [3, 4.5], Speed: [8, 12], EmissionDirection: 'Back', SpreadAngle: [8, 8], Rotation: [0, 360], RotSpeed: [-15, 15], Drag: 1.5 },
    ],
  },
  {
    name: 'Hover Thrusters', category: 'Vehicles', desc: 'Downward glowing jets for hover cars and speeders — always on.', partSize: [1.2, 0.3, 1.2],
    layers: [
      { Name: 'Jet', ...T('rbx_ff_glow'), Color: ['#ffffff', '#3cf0ff'], Size: [[0, 1.4], [1, 0.3]], Squash: -1, Transparency: [[0, 0.1], [1, 1]], LightEmission: 1, Brightness: 2, Rate: 60, Lifetime: [0.15, 0.25], Speed: [10, 14], EmissionDirection: 'Bottom', Orientation: 'VelocityParallel', LockedToPart: true },
      { Name: 'Ground Glow', ...T('ring'), Color: '#3cf0ff', Size: [[0, 1], [1, 4]], Transparency: [[0, 0.4], [1, 1]], LightEmission: 1, Rate: 4, Lifetime: [0.6, 0.6], Speed: 0.01, EmissionDirection: 'Bottom', Orientation: 'VelocityPerpendicular', LockedToPart: true, point: true },
    ],
  },
  {
    name: 'Electric Boost', category: 'Vehicles', desc: 'EV / sci-fi electric discharge boost — hold Shift.', partSize: [0.8, 0.8, 0.8], trigger: VEH(),
    layers: [
      { Name: 'Arc Glow', ...T('rbx_ff_glow'), Color: ['#ffffff', '#4ad8ff'], Size: [[0, 1.5], [1, 0.4]], Squash: -1.5, LightEmission: 1, Brightness: 3, Rate: 100, Lifetime: [0.1, 0.15], Speed: [30, 36], EmissionDirection: 'Back', Orientation: 'VelocityParallel', LockedToPart: true },
      { Name: 'Bolts', ...T('rbx_sparkles'), Color: ['#ffffff', '#6ad8ff'], Size: [[0, 1.2, 0.5], [1, 0.3]], LightEmission: 1, Brightness: 3, Rate: 40, Lifetime: [0.08, 0.15], Speed: [10, 25], EmissionDirection: 'Back', SpreadAngle: [25, 25], Rotation: [0, 360] },
      { Name: 'Static', ...T('rbx_fire_sparks'), Color: '#b8f0ff', Size: [0.25, 0], LightEmission: 1, Rate: 50, Lifetime: [0.2, 0.4], Speed: [6, 14], Shape: 'Sphere', SpreadAngle: [180, 180], Drag: 4 },
    ],
  },
  {
    name: 'Engine Damage Smoke', category: 'Vehicles', desc: 'Black smoke + flames from a wrecked engine. Starts off: turn on with ParticlyControl when health is low.', partSize: [3, 0.5, 2], trigger: { mode: 'script' },
    layers: [
      { Name: 'Smoke', ...T('rbx_smoke'), Color: ['#3a3a3a', '#111111'], Size: [[0, 2], [1, 9, 2]], Transparency: [[0, 0.3], [1, 1]], Rate: 18, Lifetime: [2.5, 4], Speed: [4, 7], Rotation: [0, 360], RotSpeed: [-20, 20], Acceleration: [0, 2, 1] },
      { Name: 'Flames', ...T('rbx_fire'), Color: ['#ffd36b', '#ff4a0c'], Size: [[0, 1.5, 0.4], [1, 0.3]], Transparency: [[0, 0.2], [1, 1]], LightEmission: 1, Rate: 30, Lifetime: [0.4, 0.8], Speed: [3, 5], RotSpeed: [-60, 60] },
    ],
  },
  {
    name: 'Car Explosion', category: 'Vehicles', desc: 'Big vehicle explosion with debris. Starts off: call ParticlyControl.burst() when the car is destroyed.', partSize: [6, 3, 10], trigger: { mode: 'script' }, burstLoop: 3.5,
    layers: [
      { Name: 'Fireball', ...T('rbx_exp_core'), point: true, Color: [[0, '#fff5c0'], [0.3, '#ffa32a'], [0.7, '#b8300c'], [1, '#2a0a05']], Size: [[0, 4, 1], [0.3, 14, 3], [1, 16]], Transparency: [[0, 0], [0.6, 0.2], [1, 1]], LightEmission: 0.8, Brightness: 2, Lifetime: [0.8, 1.2], Speed: [6, 14], Shape: 'Sphere', Drag: 4, Rotation: [0, 360], RotSpeed: [-50, 50], mode: 'burst', emitCount: 24, Enabled: false },
      { Name: 'Debris', ...T('debris'), Color: '#3a3a3a', Size: [[0, 0.8, 0.4], [1, 0.6]], Lifetime: [1.5, 2.2], Speed: [30, 50], Shape: 'Sphere', SpreadAngle: [70, 70], RotSpeed: [-400, 400], Acceleration: [0, -60, 0], mode: 'burst', emitCount: 30, Enabled: false },
      { Name: 'Sparks', ...T('rbx_fire_sparks'), Color: '#ffcf6a', Size: [[0, 0.5], [1, 0]], Squash: -2, LightEmission: 1, Brightness: 3, Lifetime: [0.8, 1.4], Speed: [40, 70], Shape: 'Sphere', Drag: 2, Acceleration: [0, -25, 0], Orientation: 'VelocityParallel', mode: 'burst', emitCount: 60, Enabled: false },
      { Name: 'Smoke Column', ...T('rbx_exp_smoke'), Color: '#2a2522', Size: [[0, 6], [1, 22, 4]], Transparency: [[0, 1], [0.15, 0.25], [1, 1]], Lifetime: [3, 4.5], Speed: [8, 14], Shape: 'Sphere', Drag: 1.5, Rotation: [0, 360], RotSpeed: [-15, 15], Acceleration: [0, 6, 0], mode: 'burst', emitCount: 20, emitDelay: 0.1, Enabled: false },
      { Name: 'Shockwave', ...T('rbx_exp_shock'), point: true, Color: '#ffe2b0', Size: [3, 50], Transparency: [[0, 0.2], [1, 1]], LightEmission: 1, Lifetime: [0.5, 0.5], Speed: 0.01, Orientation: 'VelocityPerpendicular', mode: 'burst', emitCount: 1, Enabled: false },
    ],
  },
  {
    name: 'Neon Underglow Sparkle', category: 'Vehicles', desc: 'Glowing sparkles drifting under a street car — always on.', partSize: [6, 0.2, 12],
    layers: [
      { Name: 'Glow', ...T('rbx_ff_glow'), Color: ['#ff3cf0', '#3cf0ff'], Size: [[0, 0], [0.4, 1.2, 0.4], [1, 0]], Transparency: 0.3, LightEmission: 1, Brightness: 2, Rate: 40, Lifetime: [0.8, 1.4], Speed: [0.5, 1.5], EmissionDirection: 'Bottom', Shape: 'Box', SpreadAngle: [60, 60] },
    ],
  },
  {
    name: 'Police Lights', category: 'Vehicles', desc: 'Alternating red / blue light bar glow — always on (use "Controlled by my scripts" for a siren button).', partSize: [3, 0.4, 0.8],
    layers: [
      { Name: 'Flash', ...T('rbx_ff_glow'), point: true, Color: [[0, '#ff1a1a'], [0.49, '#ff1a1a'], [0.51, '#1a4aff'], [1, '#1a4aff']], Size: 6, Transparency: [[0, 0], [0.2, 0.6], [0.3, 0], [0.49, 0.6], [0.51, 0], [0.7, 0.6], [0.8, 0], [1, 0.6]], LightEmission: 1, Brightness: 3, Rate: 1, Lifetime: [1, 1], Speed: 0, LockedToPart: true },
    ],
  },
  {
    name: 'Speed Wind Lines', category: 'Vehicles', desc: 'Anime-style wind streaks rushing past a fast car — hold Shift.', partSize: [8, 4, 14], trigger: VEH(),
    layers: [
      { Name: 'Streaks', ...T('rbx_fire_sparks'), Color: '#ffffff', Size: [[0, 0.5], [1, 0.3]], Squash: -3, Transparency: [[0, 1], [0.2, 0.3], [1, 1]], LightEmission: 1, Rate: 80, Lifetime: [0.25, 0.4], Speed: [60, 80], EmissionDirection: 'Back', Shape: 'Box', ShapeStyle: 'Surface', Orientation: 'VelocityParallel', LockedToPart: true },
    ],
  },
  {
    name: 'Plane Contrail', category: 'Vehicles', desc: 'Long white vapour trail from a wingtip — always on (try Drive).', partSize: [0.4, 0.4, 0.4],
    layers: [
      { Name: 'Trail', ...T('rbx_smoke'), Color: '#ffffff', Size: [[0, 0.5], [1, 2.5]], Transparency: [[0, 0.3], [1, 1]], Rate: 80, Lifetime: [3, 4], Speed: [0, 0.3], Rotation: [0, 360] },
    ],
  },
  {
    name: 'Turbo Blow-Off', category: 'Vehicles', desc: 'Pssh! A quick puff of air each time the key is pressed.', partSize: [0.4, 0.4, 0.4], trigger: VEH({ key: 'E', buttonText: 'TURBO' }), burstLoop: 1.2,
    layers: [
      { Name: 'Puff', ...T('rbx_smoke'), Color: '#ffffff', Size: [[0, 0.4], [1, 3]], Transparency: [[0, 0.4], [1, 1]], Lifetime: [0.4, 0.7], Speed: [14, 20], EmissionDirection: 'Top', SpreadAngle: [20, 20], Drag: 5, mode: 'burst', emitCount: 10, Enabled: false },
    ],
  },
);
