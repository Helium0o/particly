# Particly — Roblox Particle Studio

Design Roblox **ParticleEmitter** effects with a live 3D preview, then drop them straight into Roblox Studio.

- **No install needed.** It's a single HTML page, and there's also a desktop app for Windows, Mac and Linux (see below). Open `dist/Particly.html` (or `index.html`) in Chrome, Edge, Firefox or Safari. Works offline.
- **173 ready-made effects** in 12 categories: vehicles (nitro, exhaust, drift smoke, backfire, afterburners…), fire, smoke & gas, magic, abilities, combat & impact, weapons, weather & nature, environment, sci-fi & energy, fun & rewards, and seasonal.
- **Effects that work in your game straight away.** Each export includes the scripts for what the effect should do: hold a key while driving (nitro), play when touched, play from a ProximityPrompt, attach to every player's character, or be controlled from your own scripts.
- **Build your own:** layer as many emitters as you want, and edit every ParticleEmitter property with curve and gradient editors. There's also a random generator, a "vary" button, and scale, hue and timing tools.
- **One-click export to Roblox:** a `.rbxmx` model you drag into Studio, a Command Bar script, or a ModuleScript to use from game code.
- **Import from anywhere:** `.rbxmx` saved from Studio, Luau code from tutorials or the DevForum, Particly JSON files and share links, URLs, and your own images.

## Desktop app (Windows / Mac / Linux)

Particly also runs as a normal desktop app with its own window and menus.

| Download | What it is |
| --- | --- |
| `Particly-Setup-<version>.exe` | Windows installer. Adds Start-menu and desktop shortcuts. |
| `Particly-Portable-<version>.exe` | Windows, no install needed. Run it from anywhere, e.g. a USB stick. |
| `Particly-<version>-arm64.dmg` / `-x64.dmg` | macOS, for Apple Silicon and Intel Macs. |
| `Particly-<version>.AppImage` | Linux. Run `chmod +x` on it, then start it. |

Where to get them:

- Every push builds them automatically: open **GitHub → Actions → Desktop builds**, pick the latest run and download the `Particly-Windows` (or macOS/Linux) artifact.
- Pushing a version tag (for example `git tag v1.0.0 && git push --tags`) also attaches them to a **GitHub Release**.

The builds are **unsigned**, so the first launch shows a warning:

- **Windows** (SmartScreen): click **More info → Run anyway**.
- **macOS**: right-click the app, choose **Open**, then confirm **Open**.

What the desktop app adds over the browser version:

- **Native menus with shortcuts:**
  - Ctrl+N new effect, Ctrl+O open, Ctrl+I import, Ctrl+E export, Ctrl+S save to library
  - Ctrl+Shift+R random effect, Ctrl+B emit a burst, Ctrl+F frame the particles, F1 quick guide
- **Real Open/Save dialogs.** Exports go wherever you choose, and the app remembers your last export folder.
- **Opening files from Windows Explorer:** right-click a `.rbxmx`, `.json`, `.lua` or image file and choose **Open with → Particly**, or drag it onto the app icon.
- **Remembers its window** size and position between launches.
- **Works without a usable GPU:** if WebGL can't start (for example, on old or blocklisted graphics drivers), the app restarts itself once in software-rendering mode and stays in that mode.
- Your library and settings are stored in `%APPDATA%\Particly` on Windows, `~/Library/Application Support/Particly` on macOS, and `~/.config/Particly` on Linux. **Help → Open Data Folder** opens it.

Share *links* only work from a hosted web page. In the desktop app the Share tab gives you a **share code** instead. Your friend pastes the code into Particly's Import box, in either the web or the desktop version.

### Building it yourself

```bash
npm install          # installs Electron + electron-builder
npm start            # run the desktop app from source
npm run dist:win     # Windows installer + portable .exe  -> release/
npm run dist:mac     # macOS .dmg (must be run on a Mac)
npm run dist:linux   # Linux AppImage
```

On Linux you can also build the Windows `.exe` files if Wine is installed, including 32-bit Wine (`wine32:i386`).

## Quick start

1. Open `dist/Particly.html`.
2. Pick a preset on the left, or press **🎲 Random**.
3. Tweak it in the right panel. Each layer is one ParticleEmitter.
4. Click **⬆ Export to Roblox** and download the `.rbxmx`.
5. In Roblox Studio, drag the file into the 3D viewport, or right-click **Workspace → Insert from File…**.

## Making effects do things in your game ("In Roblox")

Every effect has an **In Roblox** setting in the Effect panel. The `.rbxmx` / Command Bar export includes the scripts for it, so there's nothing to code:

| In Roblox | What it does | Good for |
| --- | --- | --- |
| **Always on** | Continuous layers run all the time; burst layers replay every *Burst replay* seconds. | Torches, waterfalls, ambience |
| **Vehicle boost** | Plays while the driver holds a key. A matching gamepad button and an on-screen mobile button are added, and every player sees it. | Nitro, exhaust, drift smoke, afterburners |
| **Play when touched** | Plays when a player, or a car someone is driving, touches the part. | Boost pads, puddles, pickups, checkpoints |
| **ProximityPrompt** | Shows a "Press E" prompt and plays when it's used. | Chests, buttons, heal stations |
| **Attach to every character** | Put the export in StarterPlayer › StarterCharacterScripts and every character gets the effect. | Auras, trails, footstep dust |
| **Controlled by my scripts** | Starts off. From a server Script, call `require(part.ParticlyControl).play(2)`, `.start()`, `.stop()` or `.burst()`. | Explosions, abilities, damage smoke |

### Car nitro, step by step

1. Pick a preset from **Vehicles**, for example *Nitro Boost (Blue)*. Its behaviour is already set to **Vehicle boost**, and the preview switches to **Drive** mode.
2. Optionally change the colour, the key (default **Shift**) and the mobile button text.
3. Click **Export → Roblox model (.rbxmx)**, then drag the file onto your car model in the Explorer. The car model is the one that contains the `VehicleSeat`.
4. Move the effect Part to the exhaust pipe, rotating it so its **Back** face (+Z) points out of the pipe. When the game starts, the Part welds itself to the nearest part of the car.
5. For twin exhausts, duplicate the Part (Ctrl+D) and move the copy to the other pipe. Both copies boost together.
6. Press Play, sit in the driver's seat and hold Shift.

Effects on different keys stay independent. For example, a car can have nitro on Shift and drift smoke on Q.

You can also add the effect straight onto your car's own exhaust part instead: select that part and run the **Command Bar** export.

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
js/presets*.js      the 173 presets (presets-vehicles.js = cars)
js/behaviours.js    "In Roblox" behaviours: generates ParticlyControl + trigger scripts
js/renderer.js      particle simulation + WebGL2 preview
js/exporters.js     .rbxmx / Command Bar / ModuleScript / JSON / share links
js/importers.js     JSON / .rbxmx / Luau parser / URLs
js/editors.js       curve, gradient and field widgets
js/app.js           UI and app state
tools/build.mjs     bundles everything into dist/Particly.html
tools/smoke-test.cjs launches the packaged desktop app and checks it works (used by CI)
desktop/main.js     Electron main process: window, menus, dialogs, file opening
desktop/preload.js  safe bridge between the desktop shell and the web app
.github/workflows/desktop.yml  builds + smoke-tests installers on Windows, macOS, Linux
```

To rebuild the single-file version, run `node tools/build.mjs`.
