const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

async function unusedPort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

test('unified server serves the frontend and preserves API and health routes', async () => {
  const port = await unusedPort();
  const root = path.join(__dirname, '..', '..');
  const child = spawn(process.execPath, ['backend/dist/server.js', '--serve-frontend'], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'production',
      DB_DRIVER: 'postgres',
      JWT_SECRET: 'isolated-test-secret-with-at-least-32-characters',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let errors = '';
  child.stderr.on('data', chunk => { errors += chunk; });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Server did not start')), 30000);
      child.once('error', reject);
      child.once('exit', code => reject(new Error(`Server exited: ${code}. ${errors}`)));
      child.stdout.on('data', chunk => {
        if (chunk.toString().includes('Server running')) {
          clearTimeout(timer);
          resolve();
        }
      });
    });

    const base = `http://127.0.0.1:${port}`;
    const home = await fetch(`${base}/`, { headers: { Accept: 'text/html' } });
    assert.equal(home.status, 200);
    const html = await home.text();
    const asset = html.match(/src="([^"]+\.js)"/);
    assert.ok(asset, 'frontend JavaScript bundle is referenced');
    assert.equal((await fetch(new URL(asset[1], base))).status, 200);
    const route = await fetch(`${base}/pacientes/123`, { headers: { Accept: 'text/html' } });
    assert.equal(route.status, 200);
    assert.equal(await route.text(), html);
    const health = await fetch(`${base}/health`);
    assert.equal((await health.json()).status, 'OK');
    for (const missing of ['/api/unknown', '/missing.js']) {
      const response = await fetch(`${base}${missing}`, { headers: { Accept: 'text/html' } });
      assert.equal(response.status, 404);
    }
  } finally {
    child.kill();
  }
});
