import { execFileSync, spawn } from 'node:child_process';

const origin = 'http://127.0.0.1:4173';
let server;
try {
  let available = false;
  try { available = (await fetch(origin, { signal: AbortSignal.timeout(1500) })).ok; } catch { /* Start an isolated local preview below. */ }
  if (!available) {
    // Own the direct Node child. This avoids Windows npm-shell teardown hangs.
    server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort', '--configLoader', 'native'], { windowsHide: true, stdio: 'ignore' });
    for (let attempt = 0; attempt < 50; attempt++) {
      if (server.exitCode !== null) throw new Error('Local preview exited unexpectedly.');
      try { available = (await fetch(origin, { signal: AbortSignal.timeout(1000) })).ok; } catch { /* Waiting for Vite. */ }
      if (available) break;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  if (!available) throw new Error('Local preview did not start.');
  execFileSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)], { stdio: 'inherit', windowsHide: true, env: { ...process.env, APEX_EXTERNAL_PREVIEW: 'true' } });
} finally {
  server?.kill();
}
