import { execFileSync } from 'node:child_process';
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-b'], { stdio: 'inherit' });
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--configLoader', 'native'], { stdio: 'inherit', env: { ...process.env, VITE_ENABLE_DEMO: 'true' } });
