# Particly — notes for Claude Code

Particly is a Roblox ParticleEmitter studio: a plain HTML/CSS/JS app (no framework, no build step to run it) with a WebGL2 preview, plus an Electron desktop wrapper. It exports effects to Roblox as `.rbxmx`, Command Bar scripts and ModuleScripts. The exports include generated Luau scripts that make the effects behave in a game. See `HANDOFF.md` for project history and current state, and `README.md` for user-facing docs.

## Run it

- **Browser:** open `index.html` directly (file:// works).
- **Desktop app:** `npm install`, then `npm start` (Electron).
- **Single-file build:** `npm run build:web` writes `dist/Particly.html`. **Rebuild and commit `dist/` whenever `js/`, `css/` or `index.html` change.**
- **Installers:** `npm run dist:win`, `dist:mac` or `dist:linux`. These are normally built by CI.

## Tests (run before every commit)

`npm test` runs all of the following (details in `tests/README.md`):

- **Exports:** writes every preset's Luau exports to `tests/.gen/`.
- **Compile and simulate:** compiles them with `luau-compile` and runs them in a mock Roblox runtime (`tests/sim/sim.luau`). The mock includes a strict ParticleEmitter property validator. It also runs about 100 behaviour scenarios from `tests/sim/scenarios.luau`.
- **Round trip:** checks that every preset survives export and re-import in every format.
- **UI smoke test:** runs against both `index.html` and `dist/Particly.html`.

Requirements:

- **Playwright:** `npm i --no-save playwright && npx playwright install chromium`. Alternatively, `playwright-core` with Chrome installed.
- **Luau CLI:** `luau` and `luau-compile` from https://github.com/luau-lang/luau/releases, on PATH or in `LUAU_DIR`.

When you add a behaviour or Roblox-side feature, add a scenario to `tests/sim/scenarios.luau`. If the sim lacks a Roblox API, extend `tests/sim/sim.luau`.

## Layout (script load order matters — globals, no modules)

`index.html` loads, in order:

1. `util.js` (U helpers)
2. `model.js` (PROPS / ENUMS / defaults / normalize)
3. `behaviours.js` ("In Roblox" behaviours + generated Luau)
4. `textures.js` (procedural textures + TextureStore)
5. `neon.js` (car neon designs, animations, neon-picture support)
6. `shop.js` (colour shop Luau)
7. `neonpack.js` (NFS Neon tab pack loader, IndexedDB)
8. The preset files: `presets.js`, `presets-vehicles.js`, `presets-more.js`, `presets-neon.js`, `presets-race.js`, `presets-packs.js`
9. `renderer.js` (Sim + WebGL2 ParticleView)
10. `exporters.js` (Export)
11. `importers.js` (Import: JSON / rbxmx / Luau parser / share links)
12. `editors.js` (curve and gradient widgets)
13. `app.js` (UI)

`tools/build.mjs` inlines them into `dist/Particly.html`.

Desktop: `desktop/main.js` (Electron main process) and `desktop/preload.js` (`window.particlyDesktop` bridge).

## Conventions and gotchas

- **Effect model:** `Model.normalizeEffect` is the single source of truth. `effect.trigger` comes from `Behaviour.normalize`, and `effect.underglow` from `Neon.normalize`. New fields need defaults there, or they are lost.
- **Re-import marker:** behaviour and neon settings survive re-import through a `--@particly {json}` marker in the exported scripts (`Behaviour.marker`). The importers read it back.
- **rbxmx details:**
  - Enums are `<token>` indices: NormalId Right=0, Top=1, Back=2, Left=3, Bottom=4, Front=5; RunContext Legacy=0, Server=1, Client=2.
  - Part size is the lowercase `size` property.
  - Attributes go in `AttributesSerialize`. Only doubles are written; see `attributesBlob`.
- **Burst layers:** exported with `Enabled=false` plus `EmitCount` / `EmitDelay` attributes. `ParticlyControl` fires them.
- **Generated Luau must stay secure:** validate every RemoteEvent argument (type, NaN, range) and rate-limit. The server is authoritative. DataStore calls are wrapped in pcall with retries, and data is never overwritten when a load failed.
- **No ripped game art in the repo.** The repo and releases are public. NFS World neon pictures are loaded by the user at runtime through the NFS Neon tab. Never commit them.
- **Previews:** the preview approximates Roblox. Preset look changes should be checked visually (screenshots via Playwright).
- **Commits:**
  - Keep commit messages descriptive.
  - Put `[release]` in a commit message, and bump `version` in `package.json` and `package-lock.json` first. CI then publishes a GitHub Release (tag `v<version>`) with the installers after Windows, macOS and Linux all build and pass the smoke test.
  - A plain `git push --tags` from the cloud sandbox was refused, which is why release publishing runs in CI.
