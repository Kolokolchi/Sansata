import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateLead, getClientIp } from '../server/leads.mjs';
import { createApiRouter } from '../server/apiRouter.mjs';
import { RateLimiter } from '../server/rateLimiter.mjs';

const validLead = {
  name: 'Тестовый клиент',
  phone: '+7 (700) 000-00-00',
  consent: true,
  topic: 'Автоматическая проверка'
};

test('lead validation requires name, KZ phone and consent', () => {
  assert.equal(validateLead(validLead).value.phone, '+77000000000');

  for (const patch of [
    { name: 'x' },
    { phone: '123' },
    { consent: false },
    { name: '<script>' }
  ]) {
    assert.ok(validateLead({ ...validLead, ...patch }).error);
  }
});

test('getClientIp trusts only configured socket peers and the rightmost untrusted forwarded hop', () => {
  delete process.env.TRUST_PROXY;
  delete process.env.TRUSTED_PROXY_IPS;
  assert.equal(
    getClientIp({ headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' }, socket: { remoteAddress: '192.168.1.1' } }),
    '192.168.1.1'
  );
  assert.equal(
    getClientIp({ headers: {}, socket: { remoteAddress: '192.168.1.1' } }),
    '192.168.1.1'
  );
  assert.equal(getClientIp({ headers: {}, socket: {} }), 'local');

  process.env.TRUST_PROXY = 'true';
  try {
    assert.equal(
      getClientIp({ headers: { 'x-forwarded-for': '203.0.113.195' }, socket: { remoteAddress: '192.168.1.1' } }),
      '192.168.1.1'
    );
    process.env.TRUSTED_PROXY_IPS = '192.168.1.1';
    assert.equal(
      getClientIp({ headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' }, socket: { remoteAddress: '192.168.1.1' } }),
      '70.41.3.18'
    );
  } finally {
    delete process.env.TRUST_PROXY;
    delete process.env.TRUSTED_PROXY_IPS;
  }
});

test('HTTP saves once, rejects malformed and cross-origin requests', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'saf-test-'));
  const file = join(dir, '.local', 'leads.ndjson');
  const originalCwd = process.cwd();
  process.chdir(dir);

  const middleware = createApiRouter({
    adapter: { isConfigured: () => false, createLead: async () => ({ success: true }), fetchApartmentStatuses: async () => [] },
    leadLimiter: new RateLimiter(6, 600000)
  });
  const server = createServer((req, res) =>
    middleware(req, res, () => {
      res.statusCode = 404;
      res.end();
    })
  );

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  const post = (body, headers = {}) =>
    fetch(base + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body)
    });

  try {
    assert.equal((await post('{')).status, 400);
    assert.equal((await post('null')).status, 400);
    assert.equal(
      (await post(validLead, { Origin: 'https://unrelated.example' })).status,
      403
    );
    assert.equal((await post({ ...validLead, consent: false })).status, 400);

    // Honeypot silently returns 200 OK without persisting, but consumes quota.
    const botRes = await post({ ...validLead, website: 'bot' });
    assert.equal(botRes.status, 200);
    const botData = await botRes.json();
    assert.equal(botData.ok || botData.success, true);

    const first = await post({ ...validLead, requestId: 'request-123' });
    assert.equal(first.status, 201);
    const receipt = await first.json();
    assert.equal(receipt.mode, 'local');

    const retry = await post({ ...validLead, requestId: 'request-123' });
    assert.equal(retry.status, 200);
    assert.equal((await retry.json()).id, receipt.id);

    assert.equal((await readFile(file, 'utf8')).trim().split('\n').length, 1);

    // The current router counts malformed bodies, invalid data, bots and retries.
    // Six same-origin requests above have exhausted this test's quota.
    assert.equal((await post(validLead)).status, 429);

    assert.equal((await fetch(base + '/api/leads')).status, 405);
    assert.equal((await fetch(base + '/api/lead', { method: 'POST' })).status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    process.chdir(originalCwd);
    await rm(dir, { recursive: true, force: true });
  }
});
