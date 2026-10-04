// npm test: export Luau, compile + simulate, round trip, UI smoke test (index.html and dist).
const { spawnSync } = require('child_process');
const steps = [['export-luau.cjs'], ['run-luau.cjs'], ['roundtrip.cjs'], ['ui.cjs'], ['ui.cjs', '--dist']];
let failed = 0;
for (const [file, ...args] of steps) {
  console.log(`\n=== ${file} ${args.join(' ')}`);
  const r = spawnSync(process.execPath, [require('path').join(__dirname, file), ...args], { stdio: 'inherit' });
  if (r.status !== 0) failed++;
}
console.log(failed ? `\n${failed} step(s) failed` : '\nall tests passed');
process.exit(failed ? 1 : 0);
