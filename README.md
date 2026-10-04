# Particly — Roblox Particle Studio

Design Roblox **ParticleEmitter** effects with a live 3D preview, then drop them straight into Roblox Studio.

- **No install.** It's a single HTML page. Open `dist/Particly.html` (or `index.html`) in Chrome, Edge, Firefox or Safari. Works offline.
- **54 ready-made effects** in 7 categories: fire, smoke & gas, magic, weather & nature, combat & impact, sci-fi & energy, and fun & rewards.
- **Build your own:** layer as many emitters as you want, and edit every ParticleEmitter property with curve and gradient editors. There's also a random generator, a "vary" button, and scale, hue and timing tools.
- **One-click export to Roblox:** a `.rbxmx` model you drag into Studio, a Command Bar script, or a ModuleScript to use from game code.
- **Import from anywhere:** `.rbxmx` saved from Studio, Luau code from tutorials or the DevForum, Particly JSON files and share links, URLs, and your own images.

## Quick start

1. Open `dist/Particly.html`.
2. Pick a preset on the left, or press **🎲 Random**.
3. Tweak it in the right panel. Each layer is one ParticleEmitter.
4. Click **⬆ Export to Roblox** and download the `.rbxmx`.
5. In Roblox Studio, drag the file into the 3D viewport, or right-click **Workspace → Insert from File…**.

## Export options

| Format | Best for | How to use it in Studio |
| --- | --- | --- |
| **Roblox model (.rbxmx)** | Most people | Drag into the viewport. You get an invisible, anchored Part holding the emitters. You can also export it as an Attachment or as bare emitters. |
| **Command Bar script** | Adding the effect to parts you already have | Select Parts/Attachments, then paste the script into **View → Command Bar** and press Enter. Ctrl+Z undoes it. |
| **ModuleScript** | Game code (abilities, hits, pickups) | Put it in ReplicatedStorage. It provides `Effect.create(part)`, `Effect.burst(emitters)`, `Effect.playAt(cframe, duration)` and `Effect.stop(emitters)`. |
| **Particly JSON / share link** | Backups and sharing | Re-import in Particly, or send the link to a friend. |

**Burst layers** (explosions, hits, confetti) are exported with `Enabled = false` plus `EmitCount` and `EmitDelay` attributes. The model export can include a small `ParticlyBurstPlayer` script that replays them. In your own code, call `emitter:Emit(emitter:GetAttribute("EmitCount"))`.

## Textures

- **Built-in** textures (Sparkles, Fire, Smoke, Explosion, Shockwave, Glow, Vortex, …) use `rbxasset://textures/particles/...` paths. These ship with Roblox, so they work as soon as you import.
- **Generated shapes** (heart, star, leaf, ring, snowflake, raindrop, lightning, …) need to be uploaded once:
  1. Download the PNG from the **Textures** tab, or from the warning shown on the layer.
  2. In Studio, open **Asset Manager → Import** (or use create.roblox.com) and upload it.
  3. Right-click the image, choose **Copy Asset ID**, and paste the ID into the layer's Texture box.
  4. Until you do this, exports use the closest built-in texture, and the export dialog warns you.
- **Your own images** (PNG/JPG/WebP) can be imported for the preview. Upload them to Roblox the same way.

The preview approximates Roblox's renderer. It handles colour, size, transparency and squash curves, LightEmission blending, Brightness, all four orientations, all emitter shapes, spread, drag, acceleration, rotation, flipbooks, LockedToPart and VelocityInheritance. Always check the final look in Studio, especially lighting.

## Importing existing effects

- **From Studio:** select the Part or ParticleEmitters, right-click, choose **Save to File…**, and pick **.rbxmx** (binary `.rbxm` isn't supported). Drop the file on Particly.
- **Luau code:** paste scripts that create emitters (`local p = Instance.new("ParticleEmitter") p.Rate = 20 …`) or that use property tables. Particly understands `ColorSequence`, `NumberSequence`, `NumberRange`, `Vector2/3`, `Color3.fromRGB/new/fromHex/fromHSV`, `Enum.*` and the `EmitCount` attribute.
- **Particly files:** single effects, whole libraries, and share links.

## Shortcuts

`Space` pause · `E` emit a burst · `Ctrl+Z` / `Ctrl+Shift+Z` undo / redo · `Ctrl+S` save to My Library · double-click the view to frame the particles · drag to orbit · Shift+drag or right-drag to pan · scroll to zoom.

## Development

Plain HTML, CSS and JavaScript, with no dependencies and no build step needed to run it. Open `index.html` directly.

```
index.html          app shell
css/style.css       styles
js/model.js         ParticleEmitter schema, defaults, sequence math
js/textures.js      built-in + procedural textures
js/presets.js       the 54 presets
js/renderer.js      particle simulation + WebGL2 preview
js/exporters.js     .rbxmx / Command Bar / ModuleScript / JSON / share links
js/importers.js     JSON / .rbxmx / Luau parser / URLs
js/editors.js       curve, gradient and field widgets
js/app.js           UI and app state
tools/build.mjs     bundles everything into dist/Particly.html
```

To rebuild the single-file version, run `node tools/build.mjs`.
