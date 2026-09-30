import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
const results = [];
function run(label, args, env = process.env) {
  console.log(`\n${label}`);
  execFileSync(process.execPath, args, { stdio: 'inherit', env, windowsHide: true });
  results.push({ check: label, status: 'passed' });
}
run('TypeScript', ['node_modules/typescript/bin/tsc', '-b']);
run('Unit tests', ['node_modules/vitest/vitest.mjs', 'run', '--configLoader', 'native', 'src/lib']);
const productionEnv = { ...process.env, VITE_ENABLE_DEMO: 'false', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' };
run('Production build', ['node_modules/vite/bin/vite.js', 'build', '--configLoader', 'native'], productionEnv);
run('Production configuration safeguards', ['scripts/check-production.mjs'], productionEnv);
run('Demo build for browser integration', ['scripts/build-demo.mjs'], productionEnv);
run('Browser integration suite', ['scripts/browser-tests.mjs'], productionEnv);
mkdirSync('.qa', { recursive: true });
writeFileSync('.qa/verification-results.json', JSON.stringify({ verifiedAt: new Date().toISOString(), dataMode: 'browser-local demonstration; no Supabase credentials', results }, null, 2));
console.log('\nAll verification stages passed. Final dist is the explicitly enabled demo build.');
