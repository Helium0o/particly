# Particly tests

`npm test` runs every step in order. Each step can also be run on its own:

| Command | What it checks |
| --- | --- |
| `npm run test:export` | Writes every preset's Command Bar, ModuleScript and behaviour scripts, plus the colour shop and neon-picture exports, to `tests/.gen/` (git-ignored). |
| `npm run test:luau` | Compiles every generated file with `luau-compile`. Runs all Command Bar exports in the mock Roblox runtime with a strict ParticleEmitter validator (`run_all`). Runs the behaviour scenarios (`run_sim`). |
| `npm run test:roundtrip` | Exports each preset to .rbxmx, Command Bar, ModuleScript, JSON and share link, imports it again and compares layers, behaviour and neon. Also checks the XML is well formed. |
| `npm run test:ui` | Browser smoke test: presets, behaviour editor, export dialog, colour shop download, NFS Neon tab. Add `-- --dist` to test `dist/Particly.html`. |

## Setup

- **Playwright:** `npm i --no-save playwright && npx playwright install chromium`. If you only have `playwright-core`, the tests use your installed Chrome. Set `PW_CHANNEL=msedge` for Edge.
- **Luau CLI:** download `luau` and `luau-compile` from https://github.com/luau-lang/luau/releases. Put them on your PATH, or set `LUAU_DIR` to their folder. On Windows, for example: `set LUAU_DIR=C:\tools\luau`.

## The Roblox simulation (`tests/sim/`)

- `sim.luau` is a small mock of the Roblox engine. It covers:
  - a scheduler (`task.wait`, `task.delay`, `task.spawn`) and signals;
  - Instances with attributes, and services: Players, RunService, UserInputService, ContextActionService, DataStoreService, ReplicatedStorage;
  - datatypes such as Color3 (with HSV and hex), NumberSequence and UDim2.
- `SIM.advance(seconds)` moves time forward.
- `SIM.RunService.Heartbeat:Fire()` and `RenderStepped:Fire()` step frame loops.
- `validator.luau` is injected for strict runs. It rejects unknown ParticleEmitter properties and wrong value types.
- `scenarios.luau` holds the behaviour checks. They use `CMD.<preset_name>` (Command Bar sources) and `MOD.<name>` (ModuleScripts). Preset names become identifiers by replacing every run of non-alphanumeric characters with `_`.

When a script uses a Roblox API the mock doesn't have, add it to `sim.luau` and keep it faithful to real Roblox behaviour.
