'use strict';
/*
 * Racing presets: wheel & tyre FX, speed-reactive FX, race events and track / world pieces.
 * Speed effects use the "React to car speed / drifting" behaviour, crashes use "Play on crash".
 */

const SPEED = (o = {}) => ({ mode: 'speed', measure: 'speed', minSpeed: 10, maxSpeed: 120, scaleSize: true, ...o });
const DRIFT = (o = {}) => SPEED({ measure: 'drift', minSpeed: 8, maxSpeed: 40, ...o });
const CRASH = (o = {}) => ({ mode: 'impact', impact: 45, duration: 0.4, cooldown: 1, ...o });
const KEEP_TOUCH = (cooldown = 1.5) => ({ mode: 'touch', keepOn: true, cooldown, duration: 1 });

PRESETS.push(
  /* ------------------------------ Wheels & Tyres ------------------------------ */
  {
    name: 'Wheel Glow Ring', category: 'Wheels & Tyres', desc: 'Neon ring inside the wheel well. Put the Part on the wheel (X = axle). Press N to switch with the underglow.', partSize: [1, 3, 3], trigger: { ...NEON_TOGGLE, shop: 'neon' },
    layers: [
      { Name: 'Ring', ...T('ring'), Color: '#3a8dff', Size: 3.2, Transparency: 0.1, LightEmission: 1, Brightness: 3, Rate: 6, Lifetime: [0.4, 0.4], Speed: 0.01, EmissionDirection: 'Right', Orientation: 'VelocityPerpendicular', LockedToPart: true, point: true },
      { Name: 'Halo', ...T('rbx_ff_glow'), Color: '#3a8dff', Size: 4.2, Transparency: 0.6, LightEmission: 1, Rate: 4, Lifetime: [0.5, 0.5], Speed: 0.01, EmissionDirection: 'Right', Orientation: 'VelocityPerpendicular', LockedToPart: true, point: true },
    ],
  },
  {
    name: 'Rainbow Rim Glow', category: 'Wheels & Tyres', desc: 'Colour-cycling glow ring on the rims — always on.', partSize: [1, 3, 3],
    layers: [
      { Name: 'Ring', ...T('ring'), Color: [[0, '#ff3a3a'], [0.2, '#ffb02a'], [0.4, '#ffee2a'], [0.6, '#3aff6a'], [0.8, '#2ab8ff'], [1, '#b03aff']], Size: 3.2, Transparency: [[0, 1], [0.1, 0.1], [0.9, 0.1], [1, 1]], LightEmission: 1, Brightness: 3, Rate: 4, Lifetime: [1.5, 1.5], Speed: 0.01, EmissionDirection: 'Right', Orientation: 'VelocityPerpendicular', LockedToPart: true, point: true },
    ],
  },
  {
    name: 'Rim Sparks', category: 'Wheels & Tyres', desc: 'Sparks flung off the spinning rim, more the faster you go. Put the Part on the wheel itself.', partSize: [1, 3, 3], trigger: SPEED({ minSpeed: 30, maxSpeed: 130 }),
    layers: [
      { Name: 'Sparks', ...T('rbx_fire_sparks'), Color: ['#ffffff', '#ffc24a'], Size: [[0, 0.25], [1, 0]], Squash: -2, LightEmission: 1, Brightness: 3, Rate: 60, Lifetime: [0.25, 0.45], Speed: [12, 22], EmissionDirection: 'Right', Shape: 'Cylinder', ShapeStyle: 'Surface', Acceleration: [0, -30, 0], Orientation: 'VelocityParallel' },
    ],
  },
  {
    name: 'Tyre Smoke (Speed)', category: 'Wheels & Tyres', desc: 'Light tyre smoke that thickens with speed — place one at each rear tyre.', partSize: [1, 0.3, 1.5], trigger: SPEED({ minSpeed: 25, maxSpeed: 140, shop: 'smoke' }),
    layers: [
      { Name: 'Smoke', ...T('rbx_smoke'), Color: ['#ffffff', '#cfcfcf'], Size: [[0, 1], [1, 7, 1.5]], Transparency: [[0, 0.5], [1, 1]], Rate: 30, Lifetime: [1.2, 2], Speed: [3, 6], EmissionDirection: 'Back', SpreadAngle: [30, 15], Rotation: [0, 360], RotSpeed: [-25, 25], Acceleration: [0, 1.2, 0], Drag: 1.5 },
    ],
  },
  {
    name: 'Drift Smoke (Auto)', category: 'Wheels & Tyres', desc: 'Pours out automatically when the car slides sideways — no key needed.', partSize: [1, 0.3, 1.5], trigger: DRIFT({ shop: 'smoke' }),
    layers: [
      { Name: 'Smoke', ...T('rbx_smoke'), Color: ['#ffffff', '#d6d6d6'], Size: [[0, 1.5], [1, 11, 2]], Transparency: [[0, 0.3], [0.5, 0.55], [1, 1]], Rate: 45, Lifetime: [2, 3], Speed: [4, 9], EmissionDirection: 'Back', SpreadAngle: [35, 20], Rotation: [0, 360], RotSpeed: [-25, 25], Acceleration: [0, 1.5, 0], Drag: 1.6 },
    ],
  },
  {
    name: 'Skid Marks', category: 'Wheels & Tyres', desc: 'Dark tyre tracks left on the road while drifting. Put the Part at the bottom of each rear tyre.', partSize: [0.8, 0.2, 0.8], trigger: DRIFT({ scaleSize: false }),
    layers: [
      { Name: 'Track', ...T('skid'), Color: '#1a1a1a', Size: 0.9, Transparency: [[0, 0.15], [0.8, 0.3], [1, 1]], LightInfluence: 1, Rate: 70, Lifetime: [4, 4], Speed: 0.01, EmissionDirection: 'Top', Orientation: 'VelocityPerpendicular', Shape: 'Box', ZOffset: -1 },
    ],
  },
  {
    name: 'Coloured Drift Smoke (Auto)', category: 'Wheels & Tyres', desc: 'Pink & cyan drift smoke when sliding — recolour it in the colour shop.', partSize: [1, 0.3, 1.5], trigger: DRIFT({ shop: 'smoke' }),
    layers: [
      { Name: 'Smoke', ...T('rbx_smoke'), Color: ['#ff6ad5', '#6ad8ff'], Size: [[0, 1.5], [1, 10, 2]], Transparency: [[0, 0.35], [1, 1]], Rate: 40, Lifetime: [1.8, 2.6], Speed: [4, 8], EmissionDirection: 'Back', SpreadAngle: [35, 20], Rotation: [0, 360], RotSpeed: [-25, 25], Acceleration: [0, 1.5, 0], Drag: 1.6 },
    ],
  },
  {
    name: 'Off-Road Dirt Spray', category: 'Wheels & Tyres', desc: 'Dirt and pebbles thrown up by the wheels, more at speed.', partSize: [1, 0.3, 1.5], trigger: SPEED({ minSpeed: 15, maxSpeed: 90 }),
    layers: [
      { Name: 'Dirt', ...T('rbx_smoke'), Color: ['#8a6a48', '#5a4630'], Size: [[0, 1], [1, 5]], Transparency: [[0, 0.3], [1, 1]], Rate: 25, Lifetime: [0.8, 1.4], Speed: [6, 10], EmissionDirection: 'Back', SpreadAngle: [30, 30], Rotation: [0, 360], Acceleration: [0, -6, 0], Drag: 2 },
      { Name: 'Pebbles', ...T('debris'), Color: '#6a5238', Size: [0.3, 0.2], Rate: 20, Lifetime: [0.5, 0.9], Speed: [10, 16], EmissionDirection: 'Back', SpreadAngle: [25, 25], Rotation: [0, 360], RotSpeed: [-300, 300], Acceleration: [0, -40, 0] },
    ],
  },

  /* ------------------------------ Speed FX ------------------------------ */
  {
    name: 'Speed Flames', category: 'Speed FX', desc: 'Exhaust flames that grow bigger and longer the faster you drive.', partSize: [0.6, 0.6, 0.6], trigger: SPEED({ minSpeed: 20, maxSpeed: 140, shop: 'boost' }),
    layers: [
      { Name: 'Flame', ...T('rbx_fire'), Color: [[0, '#fff3c0'], [0.35, '#ff8a1a'], [1, '#d4200c']], Size: [[0, 1.4, 0.25], [0.6, 1], [1, 0.2]], Squash: -1.2, Transparency: [[0, 0.05], [0.7, 0.4], [1, 1]], LightEmission: 1, Brightness: 2, Rate: 120, Lifetime: [0.16, 0.26], Speed: [28, 34], EmissionDirection: 'Back', SpreadAngle: [6, 6], Rotation: [-10, 10], Orientation: 'VelocityParallel', LockedToPart: true },
      { Name: 'Core', ...T('rbx_ff_glow'), Color: ['#ffffff', '#ffd36b'], Size: [[0, 1], [1, 0.25]], Squash: -1.6, LightEmission: 1, Brightness: 3, Rate: 120, Lifetime: [0.08, 0.12], Speed: [38, 42], EmissionDirection: 'Back', SpreadAngle: [2, 2], Orientation: 'VelocityParallel', LockedToPart: true },
    ],
  },
  {
    name: 'Speed Wind Rush', category: 'Speed FX', desc: 'White wind streaks rushing past the car above 70 studs/s. Size the Part around the car.', partSize: [8, 4, 14], trigger: SPEED({ minSpeed: 70, maxSpeed: 160, scaleSize: false }),
    layers: [
      { Name: 'Wind', ...T('windline'), Color: '#ffffff', Size: [[0, 3], [1, 4]], Squash: -1.5, Transparency: [[0, 1], [0.3, 0.55], [1, 1]], LightEmission: 0.5, Rate: 40, Lifetime: [0.25, 0.35], Speed: [25, 35], EmissionDirection: 'Back', Shape: 'Box', ShapeStyle: 'Surface', Orientation: 'VelocityParallel' },
    ],
  },
  {
    name: 'Sonic Boom', category: 'Speed FX', desc: 'A vapour cone builds near top speed, then a shock ring blasts out when you hit it.', partSize: [6, 4, 2], trigger: SPEED({ minSpeed: 140, maxSpeed: 180 }), burstLoop: 3,
    layers: [
      { Name: 'Vapour Cone', ...T('rbx_smoke'), Color: '#f2f8ff', Size: [[0, 3], [1, 6]], Transparency: [[0, 0.7], [1, 1]], Rate: 30, Lifetime: [0.25, 0.35], Speed: [20, 30], EmissionDirection: 'Back', Shape: 'Cylinder', ShapeStyle: 'Surface', SpreadAngle: [10, 10], Rotation: [0, 360] },
      { Name: 'Shock Ring', ...T('rbx_exp_shock'), point: true, Color: '#ffffff', Size: [[0, 4], [1, 34]], Transparency: [[0, 0.1], [1, 1]], LightEmission: 1, Brightness: 2, Lifetime: [0.6, 0.6], Speed: 0.01, EmissionDirection: 'Front', Orientation: 'VelocityPerpendicular', mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Flash', ...T('rbx_ff_glow'), point: true, Color: '#dff2ff', Size: [[0, 6], [1, 16]], Transparency: [[0, 0.2], [1, 1]], LightEmission: 1, Brightness: 2, Lifetime: [0.25, 0.25], Speed: 0, mode: 'burst', emitCount: 1, Enabled: false },
    ],
  },
  {
    name: 'Tail-Light Trails', category: 'Speed FX', desc: 'Long-exposure red light streaks left behind the tail lights at speed.', partSize: [0.4, 0.4, 0.4], trigger: SPEED({ minSpeed: 30, maxSpeed: 120, scaleSize: false }),
    layers: [
      { Name: 'Trail', ...T('rbx_ff_glow'), Color: '#ff1a2a', Size: [[0, 0.7], [1, 0.2]], Transparency: [[0, 0.1], [1, 1]], LightEmission: 1, Brightness: 3, Rate: 120, Lifetime: [0.6, 0.6], Speed: 0, Shape: 'Box' },
    ],
  },
  {
    name: 'Underbody Scrape (Speed)', category: 'Speed FX', desc: 'Sparks from a lowered car scraping the road at high speed.', partSize: [4, 0.2, 2], trigger: SPEED({ minSpeed: 80, maxSpeed: 160 }),
    layers: [
      { Name: 'Sparks', ...T('rbx_fire_sparks'), Color: ['#ffffff', '#ffb347'], Size: [[0, 0.3], [1, 0]], Squash: -2, LightEmission: 1, Brightness: 3, Rate: 50, Lifetime: [0.3, 0.5], Speed: [10, 20], EmissionDirection: 'Back', SpreadAngle: [30, 10], Acceleration: [0, -25, 0], Orientation: 'VelocityParallel', Shape: 'Box', ShapeStyle: 'Surface' },
    ],
  },
  {
    name: 'Hyper Drive Streaks', category: 'Speed FX', desc: 'Blue sci-fi energy streaks around a fast car.', partSize: [7, 4, 12], trigger: SPEED({ minSpeed: 60, maxSpeed: 180, shop: 'boost' }),
    layers: [
      { Name: 'Streaks', ...T('streak'), Color: ['#ffffff', '#4ab8ff'], Size: [[0, 0.5], [1, 0.2]], Squash: -2.5, LightEmission: 1, Brightness: 3, Rate: 60, Lifetime: [0.2, 0.3], Speed: [40, 60], EmissionDirection: 'Back', Shape: 'Box', ShapeStyle: 'Surface', Orientation: 'VelocityParallel' },
    ],
  },
  {
    name: 'Speed Aura (Anime)', category: 'Speed FX', desc: 'A glowing aura that flares around the car the faster it goes.', partSize: [6, 3, 11], trigger: SPEED({ minSpeed: 40, maxSpeed: 150, shop: 'aura' }),
    layers: [
      { Name: 'Aura', ...T('rbx_fire'), Color: ['#ffffff', '#ffe04a'], Size: [[0, 2], [1, 0.5]], Transparency: [[0, 0.4], [1, 1]], LightEmission: 1, Brightness: 2, Rate: 50, Lifetime: [0.3, 0.5], Speed: [6, 10], EmissionDirection: 'Back', Shape: 'Box', ShapeStyle: 'Surface', Acceleration: [0, 6, 0] },
    ],
  },

  /* ------------------------------ Race Events ------------------------------ */
  {
    name: 'Start Countdown (3-2-1-GO)', category: 'Race Events', desc: 'Big 3 · 2 · 1 · GO! numbers with red / green lamp flashes. Upload the number PNGs for the digits.', partSize: [8, 8, 1], trigger: PROMPT('Start race', 4, 5), burstLoop: 5,
    layers: [
      ...[['t_3', 0], ['t_2', 1], ['t_1', 2]].map(([tex, d]) => ({ Name: 'Number ' + (3 - d), ...T(tex), point: true, Color: '#ff3a3a', Size: [[0, 5], [0.15, 6.5], [0.85, 6], [1, 4]], Transparency: [[0, 0], [0.85, 0], [1, 1]], LightEmission: 0.6, Brightness: 2, Lifetime: [0.9, 0.9], Speed: 0, LockedToPart: true, mode: 'burst', emitCount: 1, emitDelay: d, Enabled: false })),
      { Name: 'GO', ...T('t_go'), point: true, Color: '#3aff6a', Size: [[0, 5], [0.2, 9], [1, 10]], Transparency: [[0, 0], [0.7, 0], [1, 1]], LightEmission: 0.6, Brightness: 2, Lifetime: [1.2, 1.2], Speed: 0, LockedToPart: true, mode: 'burst', emitCount: 1, emitDelay: 3, Enabled: false },
      ...[0, 1, 2].map((d) => ({ Name: 'Red Lamp ' + (d + 1), ...T('rbx_ff_glow'), point: true, Color: '#ff1a1a', Size: [[0, 12], [1, 9]], Transparency: [[0, 0.3], [1, 1]], LightEmission: 1, Brightness: 2, Lifetime: [0.7, 0.7], Speed: 0, LockedToPart: true, ZOffset: -1, mode: 'burst', emitCount: 1, emitDelay: d, Enabled: false })),
      { Name: 'Green Lamp', ...T('rbx_ff_glow'), point: true, Color: '#2aff5a', Size: [[0, 14], [1, 18]], Transparency: [[0, 0.2], [1, 1]], LightEmission: 1, Brightness: 3, Lifetime: [1, 1], Speed: 0, LockedToPart: true, ZOffset: -1, mode: 'burst', emitCount: 1, emitDelay: 3, Enabled: false },
    ],
  },
  {
    name: 'Start Lights (no upload)', category: 'Race Events', desc: 'Three red light flashes then a big green one — built-in textures only.', partSize: [6, 6, 1], trigger: PROMPT('Start race', 4, 5), burstLoop: 5,
    layers: [
      ...[0, 1, 2].map((d) => ({ Name: 'Red ' + (d + 1), ...T('rbx_ff_glow'), point: true, Color: '#ff1a1a', Size: [[0, 6], [1, 4]], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 3, Lifetime: [0.8, 0.8], Speed: 0, LockedToPart: true, mode: 'burst', emitCount: 2, emitDelay: d, Enabled: false })),
      { Name: 'Green', ...T('rbx_ff_glow'), point: true, Color: '#2aff5a', Size: [[0, 8], [1, 14]], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 3, Lifetime: [1.2, 1.2], Speed: 0, LockedToPart: true, mode: 'burst', emitCount: 2, emitDelay: 3, Enabled: false },
      { Name: 'Go Sparks', ...T('rbx_sparkles'), point: true, Color: ['#ffffff', '#6aff8a'], Size: [[0, 1], [1, 0]], LightEmission: 1, Brightness: 2, Lifetime: [0.6, 1], Speed: [10, 18], SpreadAngle: [180, 180], Drag: 2, mode: 'burst', emitCount: 40, emitDelay: 3, Enabled: false },
    ],
  },
  {
    name: 'Checkpoint Gate', category: 'Race Events', desc: 'A shimmering gate that flashes when a car drives through. Make the Part as wide as the road.', partSize: [24, 12, 1], trigger: KEEP_TOUCH(1),
    layers: [
      { Name: 'Shimmer', ...T('rbx_ff_glow'), Color: '#3ad8ff', Size: [[0, 0], [0.5, 1.2], [1, 0]], Transparency: 0.4, LightEmission: 1, Rate: 40, Lifetime: [1, 1.6], Speed: [0.5, 1.5], EmissionDirection: 'Top', Shape: 'Box', Acceleration: [0, 1, 0] },
      { Name: 'Flash', ...T('rbx_ff_glow'), Color: '#bff4ff', Size: [[0, 4], [1, 8]], Transparency: [[0, 0.3], [1, 1]], LightEmission: 1, Brightness: 2, Lifetime: [0.3, 0.4], Speed: 0, Shape: 'Box', mode: 'burst', emitCount: 30, Enabled: false },
      { Name: 'Sparkles', ...T('rbx_sparkles'), Color: ['#ffffff', '#3ad8ff'], Size: [[0, 0.8], [1, 0]], LightEmission: 1, Brightness: 2, Lifetime: [0.6, 1], Speed: [6, 12], EmissionDirection: 'Front', SpreadAngle: [60, 60], Shape: 'Box', Drag: 2, mode: 'burst', emitCount: 50, Enabled: false },
    ],
  },
  {
    name: 'Finish Line Confetti', category: 'Race Events', desc: 'A checkered shimmer over the finish line; confetti cannons fire when a car crosses.', partSize: [24, 1, 4], trigger: KEEP_TOUCH(3),
    layers: [
      { Name: 'Checker Shimmer', ...T('checker'), Color: '#ffffff', Size: [[0, 0], [0.5, 1.2], [1, 0]], Transparency: 0.3, LightEmission: 0.5, Rate: 12, Lifetime: [1, 1.5], Speed: [1, 2], EmissionDirection: 'Top', Shape: 'Box', Rotation: [0, 360] },
      { Name: 'Confetti', ...T('confetti'), Color: [[0, '#ff3a5a'], [0.33, '#ffd23a'], [0.66, '#3ad8ff'], [1, '#6aff6a']], Size: 0.5, LightInfluence: 0.3, Lifetime: [2.5, 3.5], Speed: [30, 45], EmissionDirection: 'Top', SpreadAngle: [25, 25], Shape: 'Box', Rotation: [0, 360], RotSpeed: [-400, 400], Acceleration: [0, -18, 0], Drag: 1.5, mode: 'burst', emitCount: 150, Enabled: false },
      { Name: 'Streamers', ...T('streak'), Color: ['#ffffff', '#ffd23a'], Size: [[0, 0.6], [1, 0.3]], Squash: -1.5, LightEmission: 0.6, Lifetime: [1.2, 1.8], Speed: [35, 50], EmissionDirection: 'Top', SpreadAngle: [20, 20], Shape: 'Box', Acceleration: [0, -20, 0], Orientation: 'VelocityParallel', mode: 'burst', emitCount: 30, Enabled: false },
      { Name: 'FINISH', ...T('t_finish'), point: true, Color: '#ffffff', Size: [[0, 4], [0.2, 10], [1, 12]], Transparency: [[0, 0], [0.7, 0], [1, 1]], LightEmission: 0.5, Brightness: 2, Lifetime: [1.5, 1.5], Speed: [4, 4], EmissionDirection: 'Top', mode: 'burst', emitCount: 1, Enabled: false },
    ],
  },
  {
    name: 'New Record Burst', category: 'Race Events', desc: '"NEW RECORD!" pops up with a golden star burst. Fire it from your race script: require(part.ParticlyControl).burst().', partSize: [1, 1, 1], trigger: SCRIPTED, burstLoop: 3,
    layers: [
      { Name: 'Text', ...T('t_record'), point: true, Color: ['#fff3b0', '#ffc83a'], Size: [[0, 2], [0.12, 9], [0.2, 8], [1, 8.5]], Transparency: [[0, 0], [0.75, 0], [1, 1]], LightEmission: 0.5, Brightness: 2, Lifetime: [2, 2], Speed: [1.5, 1.5], EmissionDirection: 'Top', mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Gold Stars', ...T('star5'), point: true, Color: ['#fff3b0', '#ffb01a'], Size: [[0, 1.2], [1, 0]], LightEmission: 0.8, Brightness: 2, Lifetime: [1, 1.6], Speed: [14, 24], SpreadAngle: [180, 180], Rotation: [0, 360], RotSpeed: [-200, 200], Drag: 2.5, Acceleration: [0, -4, 0], mode: 'burst', emitCount: 40, Enabled: false },
      { Name: 'Ring', ...T('rbx_exp_shock'), point: true, Color: '#ffd23a', Size: [[0, 2], [1, 20]], Transparency: [[0, 0.2], [1, 1]], LightEmission: 1, Lifetime: [0.6, 0.6], Speed: 0, mode: 'burst', emitCount: 1, Enabled: false },
    ],
  },
  {
    name: 'Crash Spark Shower', category: 'Race Events', desc: 'A shower of sparks whenever the car crashes or hits a wall. Put it at the front bumper.', partSize: [5, 1.5, 1], trigger: CRASH(), burstLoop: 2,
    layers: [
      { Name: 'Spark Burst', ...T('rbx_fire_sparks'), Color: ['#ffffff', '#ffb347'], Size: [[0, 0.4], [1, 0]], Squash: -2, LightEmission: 1, Brightness: 3, Lifetime: [0.4, 0.9], Speed: [20, 40], EmissionDirection: 'Front', SpreadAngle: [70, 50], Shape: 'Box', Acceleration: [0, -40, 0], Drag: 1, Orientation: 'VelocityParallel', mode: 'burst', emitCount: 80, Enabled: false },
      { Name: 'Flash', ...T('rbx_ff_glow'), point: true, Color: '#ffe6b0', Size: [[0, 3], [1, 8]], Transparency: [[0, 0.1], [1, 1]], LightEmission: 1, Brightness: 2, Lifetime: [0.15, 0.15], Speed: 0, mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Grind Sparks', ...T('rbx_fire_sparks'), Color: '#ffcf6a', Size: [0.25, 0], Squash: -2, LightEmission: 1, Brightness: 3, Rate: 60, Lifetime: [0.2, 0.4], Speed: [10, 20], EmissionDirection: 'Front', SpreadAngle: [50, 30], Shape: 'Box', Acceleration: [0, -30, 0], Orientation: 'VelocityParallel' },
    ],
  },
  {
    name: 'Crash Debris & Smoke', category: 'Race Events', desc: 'Bits of bodywork, glass and a puff of smoke on a hard crash.', partSize: [5, 1.5, 1], trigger: CRASH({ impact: 60, duration: 1.5 }), burstLoop: 2.5,
    layers: [
      { Name: 'Debris', ...T('debris'), Color: ['#555a66', '#2a2d33'], Size: [0.6, 0.4], Lifetime: [1, 1.6], Speed: [12, 22], EmissionDirection: 'Front', SpreadAngle: [70, 60], Shape: 'Box', Rotation: [0, 360], RotSpeed: [-400, 400], Acceleration: [0, -50, 0], mode: 'burst', emitCount: 20, Enabled: false },
      { Name: 'Glass', ...T('shard'), Color: '#d8f2ff', Size: [0.3, 0.15], LightEmission: 0.3, Lifetime: [0.8, 1.2], Speed: [10, 18], EmissionDirection: 'Front', SpreadAngle: [80, 60], Shape: 'Box', Rotation: [0, 360], RotSpeed: [-600, 600], Acceleration: [0, -50, 0], mode: 'burst', emitCount: 25, Enabled: false },
      { Name: 'Smoke', ...T('rbx_smoke'), Color: ['#9a9a9a', '#4a4a4a'], Size: [[0, 2], [1, 7]], Transparency: [[0, 0.3], [1, 1]], Rate: 25, Lifetime: [1.2, 2], Speed: [2, 5], EmissionDirection: 'Top', SpreadAngle: [40, 40], Shape: 'Box', Rotation: [0, 360], RotSpeed: [-30, 30], Acceleration: [0, 2, 0] },
    ],
  },
  {
    name: 'Victory Podium Sparkle', category: 'Race Events', desc: 'Gold glitter raining over the winner\'s podium.', partSize: [8, 1, 8],
    layers: [
      { Name: 'Glitter', ...T('rbx_sparkles'), Color: ['#ffffff', '#ffd23a'], Size: [[0, 0.5], [0.5, 0.8], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 30, Lifetime: [2, 3], Speed: [1, 2], EmissionDirection: 'Bottom', Shape: 'Box', Acceleration: [0, -2, 0], Rotation: [0, 360] },
      { Name: 'Gold Glow', ...T('rbx_ff_glow'), Color: '#ffc83a', Size: [[0, 0], [0.5, 4], [1, 0]], Transparency: 0.75, LightEmission: 1, Rate: 3, Lifetime: [2, 3], Speed: [0.5, 1], EmissionDirection: 'Top', Shape: 'Box' },
    ],
  },

  /* ------------------------------ Track & World ------------------------------ */
  {
    name: 'Chevron Boost Pad', category: 'Track & World', desc: 'Glowing arrows floating forward (toward Front, -Z); a whoosh fires when a car drives over it.', partSize: [8, 0.4, 12], trigger: KEEP_TOUCH(1),
    layers: [
      { Name: 'Arrows', ...T('chevron'), Color: '#ffd23a', Size: 2.5, Transparency: [[0, 1], [0.2, 0.1], [0.8, 0.1], [1, 1]], LightEmission: 1, Brightness: 2, Rate: 5, Lifetime: [1.2, 1.2], Speed: [6, 6], EmissionDirection: 'Front', Orientation: 'FacingCameraWorldUp', Shape: 'Box', LockedToPart: true },
      { Name: 'Glow', ...T('rbx_ff_glow'), Color: '#ff9a1a', Size: [[0, 0], [0.5, 3], [1, 0]], Transparency: 0.6, LightEmission: 1, Rate: 12, Lifetime: [0.8, 1.2], Speed: [0.5, 1], EmissionDirection: 'Top', Shape: 'Box' },
      { Name: 'Whoosh', ...T('streak'), Color: ['#ffffff', '#ffd23a'], Size: [[0, 1], [1, 0.4]], Squash: -2, LightEmission: 1, Brightness: 2, Lifetime: [0.3, 0.5], Speed: [40, 60], EmissionDirection: 'Front', SpreadAngle: [8, 8], Shape: 'Box', Orientation: 'VelocityParallel', mode: 'burst', emitCount: 40, Enabled: false },
    ],
  },
  {
    name: 'Boost Ramp Sparks', category: 'Track & World', desc: 'Ramp edge glows; a launch of sparks and smoke when a car takes off. Put the Part along the ramp lip.', partSize: [10, 0.5, 1], trigger: KEEP_TOUCH(1),
    layers: [
      { Name: 'Edge Glow', ...T('rbx_ff_glow'), Color: '#3ad8ff', Size: [[0, 0], [0.5, 1.5], [1, 0]], Transparency: 0.3, LightEmission: 1, Rate: 25, Lifetime: [0.6, 1], Speed: [0.5, 1], EmissionDirection: 'Top', Shape: 'Box' },
      { Name: 'Launch Sparks', ...T('rbx_fire_sparks'), Color: ['#ffffff', '#3ad8ff'], Size: [[0, 0.4], [1, 0]], Squash: -2, LightEmission: 1, Brightness: 3, Lifetime: [0.4, 0.8], Speed: [20, 35], EmissionDirection: 'Top', SpreadAngle: [40, 40], Shape: 'Box', Acceleration: [0, -30, 0], Orientation: 'VelocityParallel', mode: 'burst', emitCount: 60, Enabled: false },
      { Name: 'Launch Smoke', ...T('rbx_smoke'), Color: '#d0d6e0', Size: [[0, 2], [1, 6]], Transparency: [[0, 0.4], [1, 1]], Lifetime: [1, 1.5], Speed: [3, 6], EmissionDirection: 'Top', SpreadAngle: [50, 50], Shape: 'Box', Rotation: [0, 360], Drag: 2, mode: 'burst', emitCount: 12, Enabled: false },
    ],
  },
  {
    name: 'Neon Road Edge', category: 'Track & World', desc: 'A glowing neon tube along the edge of the road (a SurfaceGui strip, no upload). Stretch the Part\'s Z to the road length.', partSize: [1.2, 0.2, 60],
    underglow: { enabled: true, design: 'strip', color: '#ff3cf0', brightness: 2.5, opacity: 1, light: false },
    layers: [{ Name: 'Glow Motes', ...T('rbx_ff_glow'), Color: '#ff3cf0', Size: [[0, 0], [0.5, 1], [1, 0]], Transparency: 0.5, LightEmission: 1, Rate: 10, Lifetime: [1, 2], Speed: [0.3, 0.8], EmissionDirection: 'Top', Shape: 'Box' }],
  },
  {
    name: 'Tunnel Light Strip', category: 'Track & World', desc: 'Dashed lights racing along a tunnel. Flip the Part upside down for the ceiling — the light then shines down.', partSize: [2, 0.2, 80],
    underglow: { enabled: true, design: 'dashes', color: '#ffe6a0', brightness: 3, opacity: 1, anim: 'chase', animSpeed: 0.6, light: true, lightBrightness: 4, lightRange: 16 },
    layers: [{ Name: 'Haze', ...T('rbx_ff_glow'), Color: '#ffe6a0', Size: [[0, 2], [1, 3]], Transparency: [[0, 1], [0.5, 0.88], [1, 1]], LightEmission: 1, Rate: 6, Lifetime: [2, 3], Speed: [0.1, 0.3], Shape: 'Box' }],
  },
  {
    name: 'Rain Splashing Off Cars', category: 'Track & World', desc: 'Raindrops bouncing off a car roof and bonnet. Put the Part flat on top of the car.', partSize: [5, 0.3, 10],
    layers: [
      { Name: 'Splashes', ...T('rbx_fire_sparks'), Color: '#cfe6ff', Size: [[0, 0.15], [1, 0.05]], Transparency: 0.3, Rate: 60, Lifetime: [0.25, 0.4], Speed: [3, 6], EmissionDirection: 'Top', SpreadAngle: [50, 50], Shape: 'Box', ShapeStyle: 'Surface', Acceleration: [0, -30, 0] },
      { Name: 'Spray Mist', ...T('rbx_smoke'), Color: '#e6f2ff', Size: [[0, 1], [1, 2.5]], Transparency: [[0, 0.8], [1, 1]], Rate: 8, Lifetime: [0.6, 1], Speed: [0.5, 1], EmissionDirection: 'Top', Shape: 'Box', ShapeStyle: 'Surface' },
    ],
  },
  {
    name: 'Puddle Shimmer & Splash', category: 'Track & World', desc: 'Ripples and glints on a puddle; a big splash when a car drives through.', partSize: [8, 0.2, 6], trigger: KEEP_TOUCH(0.8),
    layers: [
      { Name: 'Ripples', ...T('ripple'), Color: '#cfe6ff', Size: [[0, 0.5], [1, 3]], Transparency: [[0, 0.4], [1, 1]], LightEmission: 0.3, Rate: 4, Lifetime: [1.2, 1.6], Speed: 0.01, EmissionDirection: 'Top', Orientation: 'VelocityPerpendicular', Shape: 'Box' },
      { Name: 'Glints', ...T('rbx_sparkles'), Color: '#ffffff', Size: [[0, 0], [0.5, 0.4], [1, 0]], LightEmission: 1, Rate: 6, Lifetime: [0.3, 0.6], Speed: 0, Shape: 'Box' },
      { Name: 'Splash', ...T('splash'), Color: '#e6f4ff', Size: [[0, 2], [1, 5]], Transparency: [[0, 0.1], [1, 1]], LightInfluence: 0.6, Lifetime: [0.5, 0.7], Speed: [2, 4], EmissionDirection: 'Top', Shape: 'Box', mode: 'burst', emitCount: 4, Enabled: false },
      { Name: 'Droplets', ...T('droplet'), Color: '#cfe6ff', Size: [0.3, 0.15], Lifetime: [0.6, 0.9], Speed: [12, 18], EmissionDirection: 'Top', SpreadAngle: [45, 45], Shape: 'Box', Acceleration: [0, -50, 0], mode: 'burst', emitCount: 60, Enabled: false },
    ],
  },
  {
    name: 'Wet Road Sheen', category: 'Track & World', desc: 'Soft streaks of reflected light on a wet road at night (fakes reflections).', partSize: [16, 0.2, 30],
    layers: [
      { Name: 'Sheen', ...T('beam'), Color: ['#ffb36a', '#6ab8ff'], Size: [[0, 0], [0.5, 4], [1, 0]], Squash: -1.2, Transparency: 0.75, LightEmission: 1, Rate: 6, Lifetime: [2, 3], Speed: 0.01, EmissionDirection: 'Top', Orientation: 'VelocityPerpendicular', Shape: 'Box' },
    ],
  },
  {
    name: 'Garage Showroom Spotlight', category: 'Track & World', desc: 'Spotlight beam with dust motes and a glowing turntable ring under the car.', partSize: [16, 0.2, 16],
    underglow: { enabled: true, design: 'ring', color: '#ffffff', brightness: 1.5, opacity: 0.8, anim: 'breathe', animSpeed: 0.4, light: true, lightBrightness: 2, lightRange: 12 },
    layers: [
      { Name: 'Beam', ...T('beam'), point: true, Color: '#fff6e0', Size: 18, Transparency: 0.82, LightEmission: 1, Rate: 2, Lifetime: [2, 2], Speed: 0.01, EmissionDirection: 'Top', Orientation: 'FacingCameraWorldUp', LockedToPart: true },
      { Name: 'Dust Motes', ...T('rbx_ff_glow'), Color: '#fff6e0', Size: [[0, 0], [0.5, 0.25], [1, 0]], LightEmission: 1, Rate: 15, Lifetime: [3, 5], Speed: [0.2, 0.6], EmissionDirection: 'Top', Shape: 'Cylinder', Acceleration: [0, 0.3, 0] },
    ],
  },
  {
    name: 'Dirt Road Dust Trail', category: 'Track & World', desc: 'A long cloud of dust behind a car on dirt roads, thicker at speed.', partSize: [6, 0.3, 1], trigger: SPEED({ minSpeed: 15, maxSpeed: 100 }),
    layers: [
      { Name: 'Dust', ...T('rbx_smoke'), Color: ['#d8c39a', '#b09870'], Size: [[0, 2], [1, 12, 2]], Transparency: [[0, 0.4], [1, 1]], Rate: 25, Lifetime: [2.5, 4], Speed: [2, 4], EmissionDirection: 'Back', SpreadAngle: [30, 20], Shape: 'Box', Rotation: [0, 360], RotSpeed: [-15, 15], Acceleration: [0, 0.8, 0], Drag: 1 },
    ],
  },
);

PRESET_CATEGORIES.splice(PRESET_CATEGORIES.indexOf('Car Neon') + 1, 0, 'Wheels & Tyres', 'Speed FX', 'Race Events', 'Track & World');
