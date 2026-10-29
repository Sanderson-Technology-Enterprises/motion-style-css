import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

/** Start an isolated demo process and prove that private project files stay private. */
test('demo serves public assets and refuses private paths', async () => {
  const child = spawn(process.execPath, ['playground/serve.js'], {
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    const [chunk] = await once(child.stdout, 'data');
    const origin = String(chunk).match(/http:\/\/localhost:\d+/)?.[0];
    assert.ok(origin, 'server must report its actual listening port');
    assert.notEqual(
      new URL(origin).port,
      '0',
      'report the assigned port rather than the requested ephemeral port',
    );
    assert.equal((await fetch(origin)).status, 200);
    for (const path of [
      '/.git/config',
      '/package.json',
      '/.tmp/release-audit/activity.txt',
      '/src/index.d.ts',
      '/%2e%2e%2fpackage.json',
    ]) {
      assert.equal((await fetch(origin + path)).status, 404, path);
    }
    assert.equal(
      (await fetch(origin + '/src/motion.css')).headers.get('content-type'),
      'text/css; charset=utf-8',
    );
    assert.equal(
      (await fetch(origin + '/src/index.js', { method: 'POST' })).status,
      405,
    );
  } finally {
    child.kill();
    await once(child, 'exit');
  }
});
