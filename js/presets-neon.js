'use strict';
/*
 * Car neon presets: a glowing underglow plate (see neon.js) plus a subtle particle layer.
 * The effect Part is the plate: 6 x 0.2 x 12 studs fits a typical Roblox car.
 */

const CAR_PLATE = [6, 0.2, 12];
const NEON_TOGGLE = { mode: 'vehicle', key: 'N', toggle: true, buttonText: 'NEON' };

const haze = (color) => ({ Name: 'Neon Haze', ...T('rbx_ff_glow'), Color: color, Size: [[0, 3, 1], [1, 5]], Transparency: [[0, 1], [0.4, 0.82], [1, 1]], LightEmission: 1, Rate: 5, Lifetime: [1.5, 2.5], Speed: [0.1, 0.4], EmissionDirection: 'Bottom', Shape: 'Box', ShapeStyle: 'Surface' });
const twinkles = (color) => ({ Name: 'Twinkles', ...T('rbx_sparkles'), Color: color, Size: [[0, 0], [0.5, 0.4, 0.2], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 8, Lifetime: [0.5, 0.9], Speed: [0.2, 0.6], EmissionDirection: 'Bottom', Shape: 'Box', ShapeStyle: 'Surface', Rotation: [0, 90] });

function neonPreset(name, desc, underglow, layers, extra = {}) {
  return {
    name, category: 'Car Neon', desc, partSize: CAR_PLATE, ...extra,
    underglow: { enabled: true, brightness: 2, opacity: 1, light: true, lightBrightness: 3, lightRange: 10, ...underglow },
    layers,
  };
}

PRESETS.push(
  neonPreset('Neon Classic Bars', 'Solid glowing tubes around the car — no upload needed.', { design: 'bars', color: '#3a8dff' }, [haze('#3a8dff')]),
  neonPreset('Neon LED Strip', 'Dotted LED strips along both sides — no upload needed.', { design: 'led', color: '#00e5ff' }, [haze('#00e5ff')]),
  neonPreset('Neon Glow Ring', 'One continuous rounded glow ring — no upload needed.', { design: 'ring', color: '#a040ff' }, [haze('#a040ff')]),
  neonPreset('Neon Side Tubes', 'Just the two long side tubes — no upload needed.', { design: 'sides', color: '#39ff6a' }, [haze('#39ff6a')]),
  neonPreset('Neon Double Tubes', 'Twin tubes per side — no upload needed.', { design: 'double', color: '#ff3cf0' }, [haze('#ff3cf0')]),
  neonPreset('Neon Rainbow LED', 'LED strip cycling through every colour.', { design: 'led', color: '#ff2a6a', anim: 'rainbow', animSpeed: 1 }, [twinkles('#ffffff')]),
  neonPreset('Neon Toggle (press N)', 'Blue LED neon the driver switches on/off with N (mobile NEON button).', { design: 'led', color: '#3a8dff' }, [haze('#3a8dff')], { trigger: NEON_TOGGLE }),
  neonPreset('Neon Police Strobe', 'Red strobing bars — press N for the "siren" lights.', { design: 'bars', color: '#ff1a1a', anim: 'strobe', animSpeed: 1 }, [haze('#ff1a1a')], { trigger: { ...NEON_TOGGLE, buttonText: 'SIREN' } }),
  neonPreset('Neon Hearts', 'LED strips with glowing hearts front and back, gently breathing.', { design: 'hearts', color: '#ff4fa8', anim: 'breathe', animSpeed: 0.8 }, [
    haze('#ff4fa8'),
    { Name: 'Floating Hearts', ...T('heart'), Color: ['#ffb3d0', '#ff2a6a'], Size: [[0, 0], [0.3, 0.6], [1, 0.3]], Transparency: [[0, 0], [0.8, 0], [1, 1]], LightEmission: 0.6, Rate: 2, Lifetime: [1.2, 1.8], Speed: [1, 2], Shape: 'Box', ShapeStyle: 'Surface' },
  ]),
  neonPreset('Neon Flames', 'Hot-rod flames with flickering glow and embers.', { design: 'flames', color: '#ff7a1a', anim: 'flicker', animSpeed: 1 }, [
    { Name: 'Embers', ...T('rbx_fire_sparks'), Color: ['#ffe08a', '#ff5a1a'], Size: [[0, 0.2], [1, 0]], LightEmission: 1, Brightness: 2, Rate: 10, Lifetime: [0.6, 1.2], Speed: [1, 3], SpreadAngle: [30, 30], Shape: 'Box', ShapeStyle: 'Surface', Acceleration: [0, 2, 0] },
  ]),
  neonPreset('Neon Skulls', 'Toxic green skulls with a slow pulse.', { design: 'skulls', color: '#39ff6a', anim: 'pulse', animSpeed: 0.6 }, [haze('#39ff6a')]),
  neonPreset('Neon Chevrons', 'Racing chevrons in red.', { design: 'chevrons', color: '#ff1a1a' }, [haze('#ff1a1a')]),
  neonPreset('Neon Gold Stars', 'Gold stars with sparkles.', { design: 'stars', color: '#ffd23a' }, [twinkles('#fff3b0')]),
  neonPreset('Neon Flowers', 'Spring flowers in violet.', { design: 'flowers', color: '#c070ff' }, [twinkles('#f0d6ff')]),
  neonPreset('Neon Hex Grid', 'Sci-fi honeycomb in teal.', { design: 'hexes', color: '#00e5d0', anim: 'breathe' }, [haze('#00e5d0')]),
  neonPreset('Neon Lightning', 'Flickering yellow bolts with sparks.', { design: 'bolts', color: '#ffe23a', anim: 'flicker', animSpeed: 1.2 }, [
    { Name: 'Sparks', ...T('rbx_fire_sparks'), Color: '#fff6b0', Size: [0.2, 0], LightEmission: 1, Brightness: 3, Rate: 15, Lifetime: [0.15, 0.3], Speed: [4, 8], SpreadAngle: [80, 80], Shape: 'Box', ShapeStyle: 'Surface' },
  ]),
  neonPreset('Neon Diamonds', 'Exotic white diamonds with glints.', { design: 'diamonds', color: '#eaf6ff' }, [twinkles('#ffffff')]),
  neonPreset('Neon Checkered', 'Racing checkered flags.', { design: 'checker', color: '#ffffff' }, [haze('#d8e8ff')]),
  neonPreset('Neon Halloween Bats', 'Orange bats with spooky mist.', { design: 'bats', color: '#ff8a1a', anim: 'breathe' }, [
    { Name: 'Spooky Mist', ...T('rbx_smoke'), Color: '#6a3aa0', Size: [[0, 3], [1, 6]], Transparency: [[0, 1], [0.4, 0.75], [1, 1]], Rate: 3, Lifetime: [2, 3], Speed: [0.2, 0.6], Shape: 'Box', Rotation: [0, 360] },
  ]),
  neonPreset('Neon Snowflakes', 'Icy blue snowflakes with drifting sparkles.', { design: 'snow', color: '#9fe6ff' }, [twinkles('#ffffff')]),
  neonPreset('Neon Crosses', 'Bold red X marks.', { design: 'cross', color: '#ff2a3a' }, [haze('#ff2a3a')]),
  neonPreset('Neon Winged Heart', 'Golden winged hearts.', { design: 'wings', color: '#ffc83a', anim: 'breathe' }, [twinkles('#fff3b0')]),
  neonPreset('Neon Spirals', 'Hypnotic magenta spirals, colour cycling.', { design: 'spiral', color: '#ff3cf0', anim: 'rainbow', animSpeed: 0.5 }, [haze('#ff3cf0')]),
  neonPreset('Neon Bubbles', 'Playful teal bubbles.', { design: 'bubbles', color: '#2ad8c8' }, [haze('#2ad8c8')]),
  neonPreset('Neon Paw Prints', 'Pink paw prints.', { design: 'paws', color: '#ff6ad5' }, [haze('#ff6ad5')]),
  neonPreset('Neon Custom Text', 'Your own text along both sides — change it in the Car Neon panel.', { design: 'text', text: 'JDM', color: '#ffffff' }, [haze('#c8d8ff')]),
);

PRESET_CATEGORIES.splice(1, 0, 'Car Neon');
