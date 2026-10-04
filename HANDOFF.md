# Handoff: Particly (cloud session → local)

Written at the move from the Claude Code cloud session to a local session. `CLAUDE.md` covers how to run, test and change the code. This file is what was built, why, and where things stand.

## Where things are

- **Repository:** https://github.com/Helium0o/particly (public).
- **Branch and PR:** all work is on `claude/blissful-rubin-ty5krj`, with pull request #1 open against the default branch (not merged yet).
- **Releases**, all published from that branch by CI:
  - v1.0.0: desktop app and first presets.
  - v1.1.0: speed / crash behaviours, neon patterns, colour shop, packs.
  - v1.2.0: NFS Neon tab.
- **Latest version:** 1.2.0 (`package.json`).
- **Tests:** `npm test` passes on the latest commit. That covers:
  - 973 generated Luau files compile;
  - 270 Command Bar exports run in the simulation with 0 failures;
  - 98 scenario checks pass;
  - all 270 presets round-trip cleanly;
  - the UI smoke test passes on both `index.html` and `dist/Particly.html`.
- **CI (`.github/workflows/desktop.yml`):** builds Windows (NSIS + portable), macOS (dmg x64 / arm64) and Linux (AppImage). Each packaged app is smoke-tested. A `[release]` commit publishes the GitHub Release.

### Set up locally

```bash
git clone https://github.com/Helium0o/particly.git
cd particly
git checkout claude/blissful-rubin-ty5krj
npm install
npm start               # desktop app (or just open index.html)
npm i --no-save playwright && npx playwright install chromium
# put luau + luau-compile on PATH (or set LUAU_DIR), then:
npm test
```

**NFS World neon pictures:** `Particly-NFS-World-Neon-Pack.json` was sent in the chat. It holds the 126 neons converted from the user's World Neon 1.0.0.5 mod. Keep it outside the repo and load it in **NFS Neon › Load neon pack…**. The browser version and the desktop app each keep their own copy (IndexedDB), so load it in each one you use. To rebuild it from the mod, extract the .rar and load `Binary/Collections/NFSTEXTURES.bin` together with `Binary/Strings/English.end`.

## What exists (feature map)

| Area | Where | Notes |
| --- | --- | --- |
| Editor, layers, curves, gradients, textures | `app.js`, `editors.js`, `textures.js` | Every ParticleEmitter property. Generated shape textures need a one-time Roblox upload; until then they export with a built-in fallback. |
| Preview | `renderer.js` | WebGL2 approximation of Roblox. It covers: <ul><li>Drive mode (the world streams past a moving car)</li><li>Move mode</li><li>a speed cycle for speed effects</li><li>neon plate and road light drawing</li></ul> |
| Presets (270, 20 categories) | `presets*.js` | <ul><li>Car presets: `presets-vehicles.js`, `presets-neon.js`, `presets-race.js`</li><li>Water, cartoon, pixel and holiday packs: `presets-packs.js`, which also renames Seasonal to Holidays</li></ul> |
| "In Roblox" behaviours | `behaviours.js` | <ul><li>Always on</li><li>Vehicle boost (key / gamepad / mobile button, hold or toggle)</li><li>React to car speed / drifting (client-side scaling, burst at top speed)</li><li>Play on crash (server velocity-change detector, idle while parked)</li><li>Touch (with Keep on)</li><li>ProximityPrompt (with Keep on)</li><li>Attach to every character</li><li>Scripted</li></ul>Every container also gets `ParticlyControl` (start / stop / burst / play). Vehicle, speed and crash effects auto-weld into the car (attribute `ParticlyAutoWeld`). |
| Car neon | `neon.js` | <ul><li>Designs built from SurfaceGui Frames need no upload; icon designs need an uploaded image.</li><li>Animations include chase, scanner, police and two-colour fade (`color2`).</li><li>The SurfaceLight lights the road.</li><li>The `image` design shows a full-colour picture from the NFS Neon tab.</li></ul> |
| NFS Neon tab | `neonpack.js`, `app.js` (`renderNfsTab`, `applyNeonPicture`) | <ul><li>Decodes the mod's DXT5 texture pack in the browser.</li><li>Stores pictures in IndexedDB.</li><li>Remembers each picture's Roblox asset ID.</li><li>Pictures export as an untinted ImageLabel (attribute `ParticlyFullColour`), or as LED strips until uploaded.</li></ul> |
| Colour shop | `shop.js`, Export › Colour shop | <ul><li>Server script: validated, rate-limited remote; DataStore with retries; recolours the driven car (respects `OwnerUserId` and `ParticlyVehicle` attributes) and the player's character.</li><li>Client script: HSV picker UI.</li><li>Effects opt in with Effect › In Roblox › Colour shop, which sets a `ParticlyShop` slot (1 neon, 2 boost, 3 tyre smoke, 4 aura).</li></ul> |
| Import | `importers.js` | <ul><li>`.rbxmx` (not binary .rbxm), Luau code (a tokenizer and parser, so tutorial snippets work), Particly JSON and share links / codes.</li><li>Neon packs (`.bin`, `.json`, PNG) go through the NFS Neon tab or drag-and-drop.</li></ul> |
| Desktop | `desktop/` | <ul><li>Native menus, dialogs and file associations.</li><li>Remembers the window.</li><li>Falls back to SwiftShader software rendering when WebGL fails (Windows / Linux only).</li></ul> |

## Decisions worth knowing

- **Plain JS, no framework:** loads from file://, works offline, and is easy to inline into one HTML file.
- **No EA / NFS art is committed or shipped.** The repo and releases are public, so users load their own pack at runtime. Uploading those pictures to Roblox is at the user's own risk: they are EA's art, and Roblox can take down copyrighted images.
- **Speed effects run on the client.** Each player scales emitters locally from the replicated car velocity, which gives smooth results with no network traffic. Crash detection runs on the server.
- **Releases come from CI on `[release]` commits.** Pushing tags directly from the cloud sandbox was refused.

## Known limitations and next ideas

- Everything Roblox-side has been verified only in `tests/sim`, not in real Roblox Studio. Do a Studio pass on these first:
  - nitro on a real car;
  - speed and crash effects;
  - the colour shop UI on PC and mobile;
  - an uploaded NFS neon under a real car (check the picture's orientation, front vs back, on the plate).
- **Auto-weld** uses the car part whose centre is nearest. That is intended for wheel effects, but an exhaust effect placed near a wheel can weld to the wheel. A per-effect "weld to" option would fix it.
- **Not supported yet:** binary `.rbxm` import, `Beam` / `Trail` objects (only ParticleEmitters).
- **Neon pack storage** is per browser profile or app. Firefox may block IndexedDB for file:// pages; use Chrome / Edge or the desktop app.
- **Possible next features:**
  - per-effect weld target;
  - Trail / Beam support (light trails, tyre marks as Beams);
  - a Studio plugin version;
  - pack thumbnails in preset cards;
  - Roblox asset-ID bulk paste for many neons at once.
