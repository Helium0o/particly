// Compiles every exported Luau file, then runs them in the Roblox simulation (tests/sim):
//   run_all  : every preset's Command Bar export, built and run with a strict ParticleEmitter validator
//   run_sim  : behaviour scenarios (nitro, touch, prompt, speed, crash, neon, colour shop, …)
// Needs the Luau CLI (luau + luau-compile) from https://github.com/luau-lang/luau/releases
// on PATH, or LUAU_DIR=<folder containing them>. Run `npm run test:export` first.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const GEN = path.join(__dirname, '.gen');
const SIM = path.join(__dirname, 'sim');
const exe = (n) => (process.env.LUAU_DIR ? path.join(process.env.LUAU_DIR, n) : n) + (process.platform === 'win32' ? '.exe' : '');
if (!fs.existsSync(GEN)) { console.error('No tests/.gen — run `npm run test:export` first.'); process.exit(2); }
const list = (d) => (fs.existsSync(path.join(GEN, d)) ? fs.readdirSync(path.join(GEN, d)).filter((f) => f.endsWith('.luau')).sort().map((f) => path.join(GEN, d, f)) : []);
const read = (f) => fs.readFileSync(f, 'utf8');
const base = (f) => path.basename(f, '.luau');

// 1. compile
let compileFails = 0;
const all = ['cmd', 'mod', 'cs', 'extra'].flatMap(list);
for (const f of all) {
  const r = spawnSync(exe('luau-compile'), ['--text', f], { encoding: 'utf8' });
  if (r.error) { console.error('Cannot run luau-compile:', r.error.message); process.exit(2); }
  if (r.status !== 0) { compileFails++; console.log('COMPILE FAIL', path.relative(GEN, f), (r.stderr || r.stdout).split('\n')[0]); }
}
console.log(`compiled ${all.length} files, ${compileFails} failures`);

// 2. strict simulation with the ParticleEmitter validator
const sim = read(path.join(SIM, 'sim.luau')).replace('return SIM\n', '');
const strict = sim.replace('local function newInstance(class)', read(path.join(SIM, 'validator.luau')) + '\nlocal function newInstance(class)')
  .replace(`		__newindex = function(_, k, v)
			if k == "Parent" then`, `		__newindex = function(_, k, v)
			if class == "ParticleEmitter" then validatePE(k, v) end
			if k == "Parent" then`);
if (!strict.includes('validatePE(k, v)')) throw new Error('could not inject the validator into sim.luau');
const long = (s) => `[=====[${s}]=====]`;

const cmds = list('cmd');
const body = ['local count, bad = 0, 0', 'local lp = SIM.newPlayer("Local") SIM.Players.LocalPlayer = lp SIM.localPlayer = lp'];
for (const f of cmds) {
  const n = base(f);
  body.push(`do
  local ok, err = pcall(function()
    SIM.select({})
    SIM.runChunk(${long(read(f))}, "${n}")
    local root = SIM.selection()[1]
    if root.Parent and root.Parent.Name == "StarterCharacterScripts" then
      local _, char = SIM.newPlayer("P_${n}")
      local copy = root:Clone() copy.Parent = char SIM.runScript(copy)
    else
      local car = SIM.new("Model") car.Parent = workspace
      local seat = SIM.new("VehicleSeat") seat.Parent = car
      root.Parent = car
      SIM.runAll(root)
    end
    SIM.advance(0.3)
    SIM.RunService.RenderStepped:Fire(1/60)
    SIM.RunService.Heartbeat:Fire(1/60)
    SIM.advance(0.1)
  end)
  count += 1
  if not ok then bad += 1 SIM.print("FAIL ${n}: " .. tostring(err)) end
end`);
}
body.push(`local warns = 0
for _, l in ipairs(SIM.log) do if l:find("WARN") then warns += 1 SIM.print(l) end end
SIM.print(("ran %d command-bar exports, %d failures, %d warnings"):format(count, bad, warns))
if bad > 0 or warns > 0 then error("run_all failed") end`);
fs.writeFileSync(path.join(GEN, 'run_all.luau'), strict + body.join('\n'));

const scen = read(path.join(SIM, 'scenarios.luau'));
const mods = [...new Set([...scen.matchAll(/MOD\.(\w+)/g)].map((m) => m[1]))].sort();
const cmdTable = 'CMD = {\n' + [...cmds, ...list('extra')].map((f) => `  ["${base(f)}"] = ${long(read(f))},`).join('\n') + '\n}';
const modTable = 'MOD = {\n' + mods.map((m) => `  ["${m}"] = ${long(read(path.join(GEN, 'mod', m + '.luau')))},`).join('\n') + '\n}';
fs.writeFileSync(path.join(GEN, 'run_sim.luau'), `${strict}${cmdTable}\n${modTable}\n${scen}\nif fails > 0 then error(fails .. " scenario failures") end\n`);

let failed = compileFails > 0;
for (const name of ['run_all.luau', 'run_sim.luau']) {
  const r = spawnSync(exe('luau'), [name], { cwd: GEN, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || '') + (r.stderr || '');
  const lines = out.trim().split('\n');
  if (name === 'run_sim.luau') console.log(lines.filter((l) => !/^\s+ok /.test(l)).join('\n'), `\n(${lines.filter((l) => /^\s+ok /.test(l)).length} checks ok)`);
  else console.log(lines.slice(-3).join('\n'));
  if (r.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
