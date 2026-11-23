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

test('CORS permits only the configured frontend origins', async () => {
  const port = await unusedPort();
  const child = spawn(process.execPath, ['-r', 'ts-node/register', 'src/server.ts'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port), CORS_ORIGINS: 'https://frontend.example.com, https://other.example.com' },
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

    for (const [origin, expected] of [
      ['https://frontend.example.com', 'https://frontend.example.com'],
      ['https://other.example.com', 'https://other.example.com'],
      ['https://untrusted.example.com', null],
      ['http://localhost:5173', null],
    ]) {
      const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
        method: 'OPTIONS',
        headers: { Origin: origin, 'Access-Control-Request-Method': 'POST' },
      });
      assert.equal(response.headers.get('access-control-allow-origin'), expected);
    }
  } finally {
    child.kill();
  }
});
