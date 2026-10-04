'use strict';
/* Preset packs: water, cartoon & anime, retro / pixel, and holidays. */

PRESETS.push(
  /* ------------------------------ Water ------------------------------ */
  {
    name: 'Splash (Jump In)', category: 'Water', desc: 'Big splash when a player or car lands in water. Lay the Part flat on the water surface.', partSize: [10, 0.4, 10], trigger: TOUCH(0.2, 1.2),
    layers: [
      { Name: 'Crown', ...T('splash'), point: true, Color: '#e6f4ff', Size: [[0, 3], [1, 8]], Transparency: [[0, 0.05], [1, 1]], LightInfluence: 0.6, Lifetime: [0.6, 0.8], Speed: [2, 3], EmissionDirection: 'Top', mode: 'burst', emitCount: 3, Enabled: false },
      { Name: 'Droplets', ...T('droplet'), point: true, Color: '#cfe6ff', Size: [0.5, 0.2], Lifetime: [0.8, 1.2], Speed: [16, 26], EmissionDirection: 'Top', SpreadAngle: [40, 40], Acceleration: [0, -60, 0], mode: 'burst', emitCount: 50, Enabled: false },
      { Name: 'Ring', ...T('ripple'), point: true, Color: '#ffffff', Size: [[0, 2], [1, 16]], Transparency: [[0, 0.2], [1, 1]], Lifetime: [1.2, 1.2], Speed: 0.01, EmissionDirection: 'Top', Orientation: 'VelocityPerpendicular', mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Mist', ...T('rbx_smoke'), point: true, Color: '#f2f8ff', Size: [[0, 2], [1, 7]], Transparency: [[0, 0.5], [1, 1]], Lifetime: [1, 1.5], Speed: [4, 8], EmissionDirection: 'Top', SpreadAngle: [60, 60], Drag: 2, mode: 'burst', emitCount: 10, Enabled: false },
    ],
  },
  {
    name: 'Ocean Wave Foam', category: 'Water', desc: 'White foam rolling along a shoreline. Stretch the Part along the beach.', partSize: [40, 0.5, 4],
    layers: [
      { Name: 'Foam', ...T('foam'), Color: '#ffffff', Size: [[0, 1], [1, 4]], Transparency: [[0, 1], [0.2, 0.2], [1, 1]], LightInfluence: 0.8, Rate: 25, Lifetime: [2, 3], Speed: [1.5, 3], EmissionDirection: 'Front', Shape: 'Box', Rotation: [0, 360], Orientation: 'FacingCameraWorldUp' },
      { Name: 'Spray', ...T('rbx_smoke'), Color: '#e6f4ff', Size: [[0, 1], [1, 3]], Transparency: [[0, 0.7], [1, 1]], Rate: 10, Lifetime: [1, 1.5], Speed: [2, 4], EmissionDirection: 'Top', Shape: 'Box' },
    ],
  },
  {
    name: 'Park Fountain', category: 'Water', desc: 'Arcing water jets falling back into a basin.', partSize: [1, 0.4, 1],
    layers: [
      { Name: 'Jet', ...T('droplet'), Color: '#cfe8ff', Size: [[0, 0.5], [1, 0.3]], Transparency: 0.2, LightInfluence: 0.6, Rate: 120, Lifetime: [1.4, 1.6], Speed: [20, 22], EmissionDirection: 'Top', SpreadAngle: [12, 12], Acceleration: [0, -30, 0], Orientation: 'VelocityParallel', Squash: -0.8 },
      { Name: 'Spray', ...T('rbx_smoke'), Color: '#ffffff', Size: [[0, 0.5], [1, 2]], Transparency: [[0, 0.75], [1, 1]], Rate: 20, Lifetime: [0.8, 1.2], Speed: [18, 20], EmissionDirection: 'Top', SpreadAngle: [14, 14], Acceleration: [0, -25, 0] },
    ],
  },
  {
    name: 'Rain Ripples', category: 'Water', desc: 'Raindrop rings spreading across a pond or puddle.', partSize: [20, 0.2, 20],
    layers: [
      { Name: 'Ripples', ...T('ripple'), Color: '#dceeff', Size: [[0, 0.2], [1, 2.5]], Transparency: [[0, 0.3], [1, 1]], LightEmission: 0.2, Rate: 30, Lifetime: [0.8, 1.2], Speed: 0.01, EmissionDirection: 'Top', Orientation: 'VelocityPerpendicular', Shape: 'Box' },
    ],
  },
  {
    name: 'Garden Sprinkler', category: 'Water', desc: 'Sweeping fan of water from a lawn sprinkler.', partSize: [0.5, 0.5, 0.5],
    layers: [
      { Name: 'Water', ...T('droplet'), Color: '#cfe8ff', Size: [0.25, 0.15], Transparency: 0.2, Rate: 150, Lifetime: [1, 1.3], Speed: [14, 16], EmissionDirection: 'Top', SpreadAngle: [60, 6], Acceleration: [0, -25, 0], Orientation: 'VelocityParallel', Squash: -0.6 },
    ],
  },
  {
    name: 'Underwater Bubble Stream', category: 'Water', desc: 'Bubbles wobbling up from a diver or vent.', partSize: [0.5, 0.5, 0.5],
    layers: [
      { Name: 'Bubbles', ...T('bubble'), Color: '#dff6ff', Size: [[0, 0.2], [1, 0.6, 0.2]], Transparency: [[0, 0.2], [0.9, 0.3], [1, 1]], LightEmission: 0.2, Rate: 12, Lifetime: [2, 3], Speed: [3, 5], EmissionDirection: 'Top', SpreadAngle: [10, 10], Acceleration: [0, 1, 0], Drag: 0.5, RotSpeed: [-60, 60] },
    ],
  },
  {
    name: 'Jet Ski Wake', category: 'Water', desc: 'Spray and foam behind a fast boat, bigger with speed.', partSize: [2, 0.4, 1], trigger: SPEED({ minSpeed: 10, maxSpeed: 90 }),
    layers: [
      { Name: 'Spray', ...T('rbx_smoke'), Color: '#ffffff', Size: [[0, 1], [1, 5]], Transparency: [[0, 0.3], [1, 1]], Rate: 50, Lifetime: [0.8, 1.2], Speed: [8, 14], EmissionDirection: 'Back', SpreadAngle: [30, 20], Acceleration: [0, -20, 0], Rotation: [0, 360] },
      { Name: 'Foam Trail', ...T('foam'), Color: '#ffffff', Size: [[0, 2], [1, 4]], Transparency: [[0, 0.3], [1, 1]], Rate: 20, Lifetime: [2, 3], Speed: 0.01, EmissionDirection: 'Top', Orientation: 'VelocityPerpendicular', Rotation: [0, 360], Shape: 'Box' },
    ],
  },
  {
    name: 'Water Hose Spray', category: 'Water', desc: 'A strong water jet — fire it from a script while a tool is held.', partSize: [0.3, 0.3, 0.3], trigger: SCRIPTED,
    layers: [
      { Name: 'Jet', ...T('droplet'), Color: '#d6ecff', Size: [[0, 0.3], [1, 0.6]], Transparency: 0.15, LightInfluence: 0.6, Rate: 150, Lifetime: [0.7, 0.9], Speed: [40, 45], EmissionDirection: 'Front', SpreadAngle: [3, 3], Acceleration: [0, -30, 0], Orientation: 'VelocityParallel', Squash: -1 },
      { Name: 'Mist', ...T('rbx_smoke'), Color: '#ffffff', Size: [[0, 0.5], [1, 3]], Transparency: [[0, 0.8], [1, 1]], Rate: 20, Lifetime: [0.6, 0.9], Speed: [30, 38], EmissionDirection: 'Front', SpreadAngle: [6, 6], Acceleration: [0, -20, 0] },
    ],
  },

  /* ------------------------------ Cartoon & Anime ------------------------------ */
  {
    name: 'Comic POW Hit', category: 'Cartoon & Anime', desc: 'Comic-book "POW" burst with action lines when something gets hit.', partSize: [1, 1, 1], trigger: SCRIPTED, burstLoop: 1.5,
    layers: [
      { Name: 'Pow', ...T('pow'), point: true, Color: ['#fff36a', '#ff9a1a'], Size: [[0, 2], [0.15, 6], [0.8, 5.5], [1, 0]], Rotation: [-15, 15], LightEmission: 0.3, Lifetime: [0.5, 0.5], Speed: 0, mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Action Lines', ...T('streak'), point: true, Color: '#ffffff', Size: [[0, 1.2], [1, 0]], Squash: -2, LightEmission: 0.5, Lifetime: [0.2, 0.3], Speed: [25, 35], SpreadAngle: [180, 180], Orientation: 'VelocityParallel', mode: 'burst', emitCount: 14, Enabled: false },
    ],
  },
  {
    name: 'Anime Impact Frame', category: 'Cartoon & Anime', desc: 'Black & white manga speed-line flash for big hits.', partSize: [1, 1, 1], trigger: SCRIPTED, burstLoop: 1.5,
    layers: [
      { Name: 'Speed Lines', ...T('impact_lines'), point: true, Color: '#ffffff', Size: [[0, 10], [1, 16]], Transparency: [[0, 0], [0.7, 0], [1, 1]], Rotation: [0, 360], LightEmission: 0, Lifetime: [0.25, 0.25], Speed: 0, mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Flash', ...T('rbx_ff_glow'), point: true, Color: '#ffffff', Size: [[0, 2], [1, 8]], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Brightness: 4, Lifetime: [0.12, 0.12], Speed: 0, mode: 'burst', emitCount: 1, Enabled: false },
      { Name: 'Shock', ...T('rbx_exp_shock'), point: true, Color: '#ffffff', Size: [[0, 1], [1, 12]], Transparency: [[0, 0], [1, 1]], LightEmission: 1, Lifetime: [0.3, 0.3], Speed: 0, mode: 'burst', emitCount: 1, Enabled: false },
    ],
  },
  {
    name: 'Sweat Drops', category: 'Cartoon & Anime', desc: 'Nervous sweat drops popping off a character\'s head.', partSize: [1.5, 0.5, 1.5], trigger: CHAR({ attachTo: 'Head' }),
    layers: [
      { Name: 'Drops', ...T('droplet'), Color: '#8fd8ff', Size: [[0, 0], [0.15, 0.6], [1, 0.5]], Transparency: [[0, 0], [0.8, 0], [1, 1]], LightInfluence: 0.4, Rate: 2, Lifetime: [0.7, 0.9], Speed: [4, 6], EmissionDirection: 'Top', SpreadAngle: [45, 45], Acceleration: [0, -12, 0] },
    ],
  },
  {
    name: 'Anger Mark', category: 'Cartoon & Anime', desc: 'Throbbing red anger vein above an angry character.', partSize: [0.5, 0.5, 0.5], trigger: CHAR({ attachTo: 'Head' }),
    layers: [
      { Name: 'Vein', ...T('anger'), Color: '#ff2a3a', Size: [[0, 1.2], [0.25, 1.6], [0.5, 1.2], [0.75, 1.6], [1, 1.2]], Transparency: [[0, 1], [0.1, 0], [0.9, 0], [1, 1]], LightEmission: 0.3, Rate: 1, Lifetime: [1, 1], Speed: [2.5, 2.5], EmissionDirection: 'Top', Drag: 6, LockedToPart: true },
    ],
  },
  {
    name: 'Kawaii Sparkles', category: 'Cartoon & Anime', desc: 'Cute pink sparkles and hearts floating around a character.', partSize: [3, 4, 3], trigger: CHAR(),
    layers: [
      { Name: 'Sparkles', ...T('star4'), Color: ['#ffffff', '#ffb3e6'], Size: [[0, 0], [0.5, 0.6], [1, 0]], LightEmission: 0.8, Rate: 6, Lifetime: [0.8, 1.2], Speed: [0.5, 1], Shape: 'Box', Rotation: [0, 90] },
      { Name: 'Hearts', ...T('heart'), Color: '#ff6ab0', Size: [[0, 0], [0.3, 0.5], [1, 0.4]], Transparency: [[0, 0], [0.8, 0], [1, 1]], LightEmission: 0.3, Rate: 2, Lifetime: [1.2, 1.6], Speed: [1, 2], EmissionDirection: 'Top', Shape: 'Box' },
    ],
  },
  {
    name: 'Dizzy Swirl', category: 'Cartoon & Anime', desc: 'Spinning swirl and stars over a stunned character.', partSize: [0.5, 0.5, 0.5], trigger: CHAR({ attachTo: 'Head' }),
    layers: [
      { Name: 'Swirl', ...T('spiral'), point: true, Color: '#ffffff', Size: 1.8, Transparency: [[0, 1], [0.1, 0.1], [0.9, 0.1], [1, 1]], LightEmission: 0.3, Rate: 1, Lifetime: [1, 1], Speed: [2, 2], EmissionDirection: 'Top', Drag: 8, RotSpeed: [360, 360], LockedToPart: true },
      { Name: 'Stars', ...T('star5'), Color: '#ffe04a', Size: [[0, 0], [0.3, 0.4], [1, 0]], LightEmission: 0.6, Rate: 4, Lifetime: [0.8, 1.2], Speed: [1.5, 2.5], EmissionDirection: 'Top', SpreadAngle: [50, 50], RotSpeed: [-200, 200], LockedToPart: true },
    ],
  },
  {
    name: 'Cartoon Run Dust', category: 'Cartoon & Anime', desc: 'Puffy cartoon cloud puffs behind running feet.', partSize: [2, 0.4, 1], trigger: CHAR({ attachTo: 'HumanoidRootPart' }),
    layers: [
      { Name: 'Puffs', ...T('cloud'), Color: '#f2ede4', Size: [[0, 0.6], [1, 1.8]], Transparency: [[0, 0.1], [0.7, 0.2], [1, 1]], LightInfluence: 0.8, Rate: 6, Lifetime: [0.4, 0.6], Speed: [1, 2], EmissionDirection: 'Back', Rotation: [0, 360], Drag: 3, Acceleration: [0, 1, 0] },
    ],
  },
  {
    name: 'Love-Struck Hearts', category: 'Cartoon & Anime', desc: 'Hearts popping up and bobbing above a character in love.', partSize: [0.5, 0.5, 0.5], trigger: CHAR({ attachTo: 'Head' }),
    layers: [
      { Name: 'Hearts', ...T('heart'), Color: ['#ff9ad0', '#ff2a6a'], Size: [[0, 0], [0.2, 0.9], [0.4, 0.7], [1, 0.6]], Transparency: [[0, 0], [0.8, 0], [1, 1]], LightEmission: 0.4, Rate: 2.5, Lifetime: [1.2, 1.6], Speed: [2, 3], EmissionDirection: 'Top', SpreadAngle: [35, 35], Rotation: [-15, 15] },
    ],
  },
  {
    name: 'Anime Power-Up', category: 'Cartoon & Anime', desc: 'Golden aura flames and crackling lightning — "this isn\'t even my final form".', partSize: [3, 5, 3], trigger: CHAR(), shopSlot: 'aura',
    layers: [
      { Name: 'Aura', ...T('rbx_fire'), Color: ['#fffbe0', '#ffd23a'], Size: [[0, 2.5], [1, 0.5]], Transparency: [[0, 0.3], [1, 1]], LightEmission: 1, Brightness: 2, Rate: 40, Lifetime: [0.4, 0.6], Speed: [6, 9], EmissionDirection: 'Top', Shape: 'Cylinder', ShapeStyle: 'Surface', LockedToPart: true },
      { Name: 'Sparks', ...T('lightning'), Color: '#fff6b0', Size: [1, 2], LightEmission: 1, Brightness: 3, Rate: 5, Lifetime: [0.08, 0.12], Speed: 0, Shape: 'Box', Rotation: [0, 360], LockedToPart: true },
      { Name: 'Rising Bits', ...T('rbx_fire_sparks'), Color: '#ffe04a', Size: [0.3, 0], LightEmission: 1, Rate: 15, Lifetime: [0.8, 1.2], Speed: [4, 8], EmissionDirection: 'Top', Shape: 'Disc' },
    ],
  },

  /* ------------------------------ Retro & Pixel ------------------------------ */
  {
    name: 'Pixel Coin Burst', category: 'Retro & Pixel', desc: '8-bit coins bursting out — upload the Pixel Coin texture for crisp pixels.', partSize: [1, 1, 1], trigger: TOUCH(0.2, 1), burstLoop: 1.5,
    layers: [
      { Name: 'Coins', ...T('px_coin'), Color: '#ffd23a', Size: 1, LightInfluence: 0.3, Lifetime: [0.9, 1.2], Speed: [14, 20], EmissionDirection: 'Top', SpreadAngle: [35, 35], Acceleration: [0, -40, 0], mode: 'burst', emitCount: 15, Enabled: false },
      { Name: 'Sparkle', ...T('px_spark'), Color: '#ffffff', Size: [[0, 0], [0.5, 1], [1, 0]], LightEmission: 0.6, Lifetime: [0.3, 0.5], Speed: [3, 6], SpreadAngle: [180, 180], mode: 'burst', emitCount: 8, Enabled: false },
    ],
  },
  {
    name: 'Pixel Hearts', category: 'Retro & Pixel', desc: 'Blocky hearts floating up — health pickup or love.', partSize: [2, 0.5, 2],
    layers: [
      { Name: 'Hearts', ...T('px_heart'), Color: '#ff2a4a', Size: [[0, 0], [0.2, 0.8], [1, 0.8]], Transparency: [[0, 0], [0.8, 0], [1, 1]], LightInfluence: 0.3, Rate: 3, Lifetime: [1.5, 2], Speed: [2, 3], EmissionDirection: 'Top', Shape: 'Box' },
    ],
  },
  {
    name: 'Pixel Fire', category: 'Retro & Pixel', desc: 'Retro game campfire built from pixel flames.', partSize: [2, 0.4, 2],
    layers: [
      { Name: 'Flames', ...T('px_flame'), Color: [[0, '#fff36a'], [0.5, '#ff8a1a'], [1, '#d4200c']], Size: [[0, 1.4], [1, 0.4]], Transparency: [[0, 0], [0.8, 0.1], [1, 1]], LightEmission: 0.8, Rate: 14, Lifetime: [0.6, 0.9], Speed: [3, 5], EmissionDirection: 'Top', Shape: 'Box' },
      { Name: 'Embers', ...T('px_block'), Color: '#ffb02a', Size: 0.25, LightEmission: 1, Rate: 6, Lifetime: [0.8, 1.2], Speed: [3, 6], EmissionDirection: 'Top', SpreadAngle: [20, 20], Shape: 'Box' },
    ],
  },
  {
    name: 'Pixel Explosion', category: 'Retro & Pixel', desc: 'Chunky 8-bit explosion with block debris.', partSize: [1, 1, 1], trigger: SCRIPTED, burstLoop: 2,
    layers: [
      { Name: 'Blast', ...T('px_puff'), point: true, Color: [[0, '#ffffff'], [0.3, '#ffd23a'], [0.7, '#ff5a1a'], [1, '#3a3a3a']], Size: [[0, 1], [0.4, 5], [1, 6]], Transparency: [[0, 0], [0.7, 0], [1, 1]], LightEmission: 0.6, Lifetime: [0.6, 0.8], Speed: [3, 6], SpreadAngle: [180, 180], mode: 'burst', emitCount: 8, Enabled: false },
      { Name: 'Blocks', ...T('px_block'), point: true, Color: ['#ffb02a', '#5a5a5a'], Size: [0.6, 0.3], Lifetime: [0.8, 1.2], Speed: [14, 24], SpreadAngle: [180, 180], Acceleration: [0, -40, 0], mode: 'burst', emitCount: 30, Enabled: false },
    ],
  },
  {
    name: 'Pixel Sparkle Trail', category: 'Retro & Pixel', desc: 'Retro star-power sparkles trailing a running character.', partSize: [2, 3, 1], trigger: CHAR(),
    layers: [
      { Name: 'Sparkles', ...T('px_spark'), Color: [[0, '#ff3a3a'], [0.25, '#ffd23a'], [0.5, '#3aff6a'], [0.75, '#3ab8ff'], [1, '#b03aff']], Size: [[0, 0.8], [1, 0]], LightEmission: 0.8, Rate: 15, Lifetime: [0.5, 0.8], Speed: [0.5, 1.5], Shape: 'Box' },
    ],
  },
  {
    name: 'Pixel Smoke Puffs', category: 'Retro & Pixel', desc: 'Blocky smoke puffs — chimneys, landing dust, vanish poofs.', partSize: [1, 0.5, 1],
    layers: [
      { Name: 'Puffs', ...T('px_puff'), Color: ['#ffffff', '#9a9a9a'], Size: [[0, 0.6], [1, 2.4]], Transparency: [[0, 0.1], [0.7, 0.3], [1, 1]], LightInfluence: 0.8, Rate: 4, Lifetime: [1.5, 2], Speed: [2, 3], EmissionDirection: 'Top', SpreadAngle: [10, 10] },
    ],
  },
  {
    name: '8-Bit Power-Up', category: 'Retro & Pixel', desc: 'Stars and pixel blocks shoot up when a player grabs a power-up.', partSize: [2, 2, 2], trigger: TOUCH(0.3, 2), burstLoop: 1.8,
    layers: [
      { Name: 'Stars', ...T('px_star'), point: true, Color: '#ffe04a', Size: [[0, 0], [0.2, 1.2], [1, 0.6]], LightEmission: 0.5, Lifetime: [0.8, 1.2], Speed: [10, 16], EmissionDirection: 'Top', SpreadAngle: [50, 50], Acceleration: [0, -10, 0], mode: 'burst', emitCount: 10, Enabled: false },
      { Name: 'Blocks', ...T('px_block'), point: true, Color: [[0, '#ff3a3a'], [0.5, '#3ab8ff'], [1, '#3aff6a']], Size: 0.4, LightEmission: 0.6, Lifetime: [0.5, 0.8], Speed: [6, 12], SpreadAngle: [180, 180], mode: 'burst', emitCount: 24, Enabled: false },
    ],
  },
  {
    name: 'Pixel Rain', category: 'Retro & Pixel', desc: 'Falling blocky raindrops for retro-style worlds.', partSize: [40, 1, 40],
    layers: [
      { Name: 'Drops', ...T('px_block'), Color: '#6ab8ff', Size: 0.2, Squash: -2, Transparency: 0.2, Rate: 150, Lifetime: [1.2, 1.4], Speed: [30, 30], EmissionDirection: 'Bottom', Shape: 'Box' },
    ],
  },

  /* ------------------------------ Holidays ------------------------------ */
  {
    name: 'Halloween Pumpkin Rain', category: 'Holidays', desc: 'Grinning jack-o\'-lanterns tumbling from the sky with purple mist.', partSize: [30, 1, 30],
    layers: [
      { Name: 'Pumpkins', ...T('pumpkin'), Color: '#ff8a1a', Size: 1.2, LightEmission: 0.3, Rate: 6, Lifetime: [4, 5], Speed: [5, 7], EmissionDirection: 'Bottom', Shape: 'Box', Rotation: [0, 360], RotSpeed: [-60, 60] },
      { Name: 'Mist', ...T('rbx_smoke'), Color: '#6a3aa0', Size: [[0, 4], [1, 8]], Transparency: [[0, 1], [0.4, 0.8], [1, 1]], Rate: 4, Lifetime: [4, 6], Speed: [3, 5], EmissionDirection: 'Bottom', Shape: 'Box', Rotation: [0, 360] },
    ],
  },
  {
    name: 'Christmas Gift Shower', category: 'Holidays', desc: 'Presents and snowflakes raining down — great for a Christmas event.', partSize: [30, 1, 30],
    layers: [
      { Name: 'Gifts', ...T('gift'), Color: [[0, '#ff2a3a'], [0.5, '#2aff5a'], [1, '#ffd23a']], Size: 1.2, LightInfluence: 0.5, Rate: 6, Lifetime: [4, 5], Speed: [5, 7], EmissionDirection: 'Bottom', Shape: 'Box', Rotation: [-25, 25], RotSpeed: [-40, 40] },
      { Name: 'Snow', ...T('snowflake'), Color: '#ffffff', Size: 0.4, Rate: 30, Lifetime: [5, 7], Speed: [2, 4], EmissionDirection: 'Bottom', Shape: 'Box', Rotation: [0, 360], RotSpeed: [-30, 30] },
    ],
  },
  {
    name: 'Christmas Tree Twinkle', category: 'Holidays', desc: 'Coloured fairy lights twinkling over a tree. Size the Part to the tree.', partSize: [6, 10, 6],
    layers: [
      { Name: 'Lights', ...T('rbx_ff_glow'), Color: [[0, '#ff2a3a'], [0.33, '#ffd23a'], [0.66, '#2ab8ff'], [1, '#2aff5a']], Size: [[0, 0], [0.5, 0.8], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 25, Lifetime: [1, 2], Speed: 0, Shape: 'Cylinder', ShapeStyle: 'Surface' },
      { Name: 'Star Sparkle', ...T('star4'), Color: '#fff3b0', Size: [[0, 0], [0.5, 0.5], [1, 0]], LightEmission: 1, Rate: 6, Lifetime: [0.6, 1], Speed: 0, Shape: 'Cylinder', ShapeStyle: 'Surface' },
    ],
  },
  {
    name: 'Easter Egg Hunt', category: 'Holidays', desc: 'Pastel eggs pop out when a hidden egg is found.', partSize: [1.5, 1.5, 1.5], trigger: PROMPT('Collect egg', 0.5, 3), burstLoop: 2,
    layers: [
      { Name: 'Eggs', ...T('egg'), point: true, Color: [[0, '#ffb3d9'], [0.33, '#b3e6ff'], [0.66, '#d9ffb3'], [1, '#fff0b3']], Size: [[0, 0.6], [1, 0.4]], LightInfluence: 0.4, Lifetime: [1, 1.4], Speed: [10, 16], EmissionDirection: 'Top', SpreadAngle: [40, 40], RotSpeed: [-200, 200], Acceleration: [0, -30, 0], mode: 'burst', emitCount: 12, Enabled: false },
      { Name: 'Sparkle', ...T('rbx_sparkles'), point: true, Color: '#ffffff', Size: [[0, 0.8], [1, 0]], LightEmission: 1, Lifetime: [0.5, 0.8], Speed: [4, 8], SpreadAngle: [180, 180], mode: 'burst', emitCount: 20, Enabled: false },
    ],
  },
  {
    name: 'Lucky Clovers', category: 'Holidays', desc: 'St Patrick\'s Day clovers and gold glitter swirling up.', partSize: [6, 0.5, 6],
    layers: [
      { Name: 'Clovers', ...T('clover'), Color: ['#3aff6a', '#13a84a'], Size: [[0, 0], [0.2, 0.7], [1, 0.6]], Transparency: [[0, 0], [0.8, 0], [1, 1]], LightInfluence: 0.5, Rate: 5, Lifetime: [2, 3], Speed: [2, 4], EmissionDirection: 'Top', Shape: 'Box', Rotation: [0, 360], RotSpeed: [-90, 90] },
      { Name: 'Gold', ...T('rbx_sparkles'), Color: '#ffd23a', Size: [[0, 0], [0.5, 0.4], [1, 0]], LightEmission: 1, Rate: 10, Lifetime: [1, 2], Speed: [2, 4], EmissionDirection: 'Top', Shape: 'Box' },
    ],
  },
  {
    name: 'Candy Cane Swirl', category: 'Holidays', desc: 'Candy canes and peppermint sparkles spinning around a character.', partSize: [3, 4, 3], trigger: CHAR(),
    layers: [
      { Name: 'Canes', ...T('candy'), Color: '#ff4a5a', Size: 0.8, Transparency: [[0, 1], [0.15, 0], [0.85, 0], [1, 1]], LightInfluence: 0.4, Rate: 3, Lifetime: [1.5, 2], Speed: [1, 2], EmissionDirection: 'Top', Shape: 'Cylinder', ShapeStyle: 'Surface', RotSpeed: [-120, 120] },
      { Name: 'Peppermint', ...T('star4'), Color: ['#ffffff', '#ff8a9a'], Size: [[0, 0], [0.5, 0.5], [1, 0]], LightEmission: 0.8, Rate: 8, Lifetime: [0.8, 1.2], Speed: 0.5, Shape: 'Cylinder', ShapeStyle: 'Surface' },
    ],
  },
  {
    name: 'Lantern Festival', category: 'Holidays', desc: 'Warm red-gold lanterns drifting up into the night sky (Lunar New Year, Mid-Autumn).', partSize: [30, 1, 30],
    layers: [
      { Name: 'Lanterns', ...T('soft_glow'), Color: ['#ffd27a', '#ff5a2a'], Size: [[0, 0], [0.1, 1.4], [0.9, 1.2], [1, 0]], Squash: 0.4, LightEmission: 1, Brightness: 2, Rate: 4, Lifetime: [10, 14], Speed: [2, 3], EmissionDirection: 'Top', Shape: 'Box', Acceleration: [0.3, 0, 0] },
    ],
  },
  {
    name: 'Diwali Diya Lights', category: 'Holidays', desc: 'Warm flickering lamp glows with golden sparkles.', partSize: [8, 0.4, 8],
    layers: [
      { Name: 'Glow', ...T('rbx_ff_glow'), Color: '#ffb02a', Size: [[0, 0.6], [0.5, 1], [1, 0.6]], Transparency: 0.3, LightEmission: 1, Brightness: 2, Rate: 10, Lifetime: [1, 1.5], Speed: 0, Shape: 'Box', ShapeStyle: 'Surface', EmissionDirection: 'Top' },
      { Name: 'Sparkles', ...T('rbx_sparkles'), Color: ['#fff3b0', '#ffb02a'], Size: [[0, 0], [0.5, 0.4], [1, 0]], LightEmission: 1, Rate: 12, Lifetime: [1, 2], Speed: [1, 2], EmissionDirection: 'Top', Shape: 'Box' },
    ],
  },
);

// Seasonal presets live in the Holidays pack too; vehicle drift smoke can be recoloured in the colour shop.
for (const p of PRESETS) {
  if (p.category === 'Seasonal') p.category = 'Holidays';
  if (p.shopSlot) { p.trigger = { ...(p.trigger || {}), shop: p.shopSlot }; delete p.shopSlot; }
  if (/^(Tire Smoke \(Drift\)|Drift Smoke \(Coloured\))$/.test(p.name)) p.trigger = { ...p.trigger, shop: 'smoke' };
}
PRESET_CATEGORIES.splice(PRESET_CATEGORIES.indexOf('Seasonal'), 1);
PRESET_CATEGORIES.push('Water', 'Cartoon & Anime', 'Retro & Pixel', 'Holidays');
