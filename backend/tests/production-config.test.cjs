const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('production server refuses a weak JWT secret', () => {
  const result = spawnSync(process.execPath, ['-r', 'ts-node/register', 'src/server.ts'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'production', JWT_SECRET: 'short' },
    encoding: 'utf8',
    timeout: 30000,
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JWT_SECRET deve conter pelo menos 32 caracteres/);
});

test('MySQL mode refuses to start without its database URL', () => {
  const result = spawnSync(process.execPath, ['-r', 'ts-node/register', 'src/server.ts'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, DB_DRIVER: 'mysql', MYSQL_DATABASE_URL: '', NODE_ENV: 'production',
      JWT_SECRET: 'isolated-test-secret-with-at-least-32-characters' },
    encoding: 'utf8',
    timeout: 30000,
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /MYSQL_DATABASE_URL não configurada/);
});
