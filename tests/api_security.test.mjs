import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApiRouter } from '../server/apiRouter.mjs';

const validLead = {
  name: 'Канат Сатпаев',
  phone: '+7 (701) 123-45-67',
  consent: true,
  topic: 'Консультация по 2-комнатной'
};

test('BFF API Router security, validation, ratelimit and safe DTO', async () => {
  const router = createApiRouter();
  const server = createServer((req, res) =>
    router(req, res, () => {
      res.statusCode = 404;
      res.end();
    })
  );

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  const post = (url, body, headers = {}) =>
    fetch(base + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body)
    });

  try {
    // 1. GET /api/apartments/status
    const statusRes = await fetch(base + '/api/apartments/status');
    assert.equal(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.ok(statusData.statuses);
    assert.ok(statusData.updatedAt);

    // 2. CORS rejection
    const corsRes = await post('/api/lead', validLead, { Origin: 'https://malicious-site.com' });
    assert.equal(corsRes.status, 403);

    // 3. Validation errors
    assert.equal((await post('/api/lead', { ...validLead, phone: 'invalid' })).status, 400);
    assert.equal((await post('/api/lead', { ...validLead, consent: false })).status, 400);

    // 4. Honeypot check
    const honeypotRes = await post('/api/lead', { ...validLead, website: 'spambot.com' });
    assert.equal(honeypotRes.status, 200);
    const honeypotData = await honeypotRes.json();
    assert.equal(honeypotData.success, true);

    // 5. Booking endpoint returns safe DTO
    const bookingRes = await post('/api/booking', {
      name: 'Алия Мусина',
      phone: '+7 (705) 555-55-55',
      consent: true,
      apartmentId: '550e8400-e29b-41d4-a716-446655440000',
      apartmentNumber: '42'
    });
    assert.equal(bookingRes.status, 201);
    const bookingData = await bookingRes.json();
    assert.equal(bookingData.success, true);
    assert.ok(bookingData.bookingId);
    assert.equal(typeof bookingData.UF_CRM_FIELD, 'undefined'); // никаких сырых полей CRM

    // 6. Rate limiting strictly enforced: 4th request from same IP is rejected with 429
    const leadsRes = await post('/api/leads', validLead);
    assert.equal(leadsRes.status, 429);
    const leadsData = await leadsRes.json();
    assert.match(leadsData.error, /3 заявки за 10 минут/);

    // 7. Canonical POST /api/leads from a fresh IP under TRUST_PROXY succeeds with 201
    process.env.TRUST_PROXY = 'true';
    try {
      const freshLeadRes = await post('/api/leads', validLead, {
        'x-forwarded-for': '198.51.100.42'
      });
      assert.equal(freshLeadRes.status, 201);
      const freshLeadData = await freshLeadRes.json();
      assert.equal(freshLeadData.success, true);
      assert.ok(freshLeadData.id);
      assert.equal(freshLeadData.mode, 'local');
    } finally {
      delete process.env.TRUST_PROXY;
    }

    // 8. Status cache keys sanitization: ensure no purely numeric Bitrix item.id exists
    for (const key of Object.keys(statusData.statuses)) {
      assert.ok(!/^\d+$/.test(key), `Status key ${key} should not be an internal numeric CRM ID`);
    }

    // 9. API8: Security headers check
    assert.equal(statusRes.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(statusRes.headers.get('x-frame-options'), 'DENY');
    assert.equal(statusRes.headers.get('cache-control'), 'no-store');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('OWASP API1 & API3: BOLA, Mass Assignment and Prototype Pollution defense', async () => {
  const router = createApiRouter();
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  const post = (url, body, headers = {}) =>
    fetch(base + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body)
    });

  try {
    // Mass Assignment: extra unauthorized fields rejected with 400
    const massAssignRes = await post('/api/leads', { ...validLead, role: 'admin', internalNotes: 'hack' });
    assert.equal(massAssignRes.status, 400);

    const massAssignBooking = await post('/api/booking', {
      name: 'Клиент',
      phone: '+77019998877',
      consent: true,
      apartmentId: 'shattyq-1',
      priceOverride: 0
    });
    assert.equal(massAssignBooking.status, 400);

    // Prototype pollution payload rejected with 400
    const protoPollutionRes = await post('/api/leads', '{"name":"Иван","phone":"+77011112233","consent":true,"__proto__":{"polluted":true}}');
    assert.equal(protoPollutionRes.status, 400);

    // Bounded topic (> 600 characters rejected with 400)
    const longTopicRes = await post('/api/leads', { ...validLead, topic: 'A'.repeat(601) });
    assert.equal(longTopicRes.status, 400);

    // Invalid apartmentId character injection rejected with 400
    const badApartmentIdRes = await post('/api/booking', {
      name: 'Клиент',
      phone: '+77019998877',
      consent: true,
      apartmentId: 'shattyq-1; DROP TABLE apartments;'
    });
    assert.equal(badApartmentIdRes.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('OWASP API4: RateLimiter bounded memory, FIFO eviction and Retry-After header', async () => {
  const { RateLimiter } = await import('../server/rateLimiter.mjs');

  // RateLimiter with maxEntries = 2
  const miniLimiter = new RateLimiter(1, 60000, 2);
  assert.equal(miniLimiter.isAllowed('ip-1'), true);
  assert.equal(miniLimiter.isAllowed('ip-2'), true);
  assert.equal(miniLimiter.buckets.size, 2);

  // 3rd IP should trigger FIFO eviction of oldest IP (ip-1)
  assert.equal(miniLimiter.isAllowed('ip-3'), true);
  assert.equal(miniLimiter.buckets.size, 2);
  assert.equal(miniLimiter.buckets.has('ip-1'), false);
  assert.equal(miniLimiter.buckets.has('ip-2'), true);
  assert.equal(miniLimiter.buckets.has('ip-3'), true);

  // Retry-After calculation
  const retry = miniLimiter.getRetryAfter('ip-3');
  assert.ok(retry > 0 && retry <= 60);

  // HTTP Retry-After header in BFF
  const router = createApiRouter();
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // Send 3 requests to exhaust lead rate limit
    for (let i = 0; i < 3; i++) {
      await fetch(base + '/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validLead, name: `User ${i}` })
      });
    }

    const blockedRes = await fetch(base + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validLead)
    });
    assert.equal(blockedRes.status, 429);
    assert.ok(blockedRes.headers.has('retry-after'));
    assert.ok(Number(blockedRes.headers.get('retry-after')) > 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('OWASP API5: Broken Function Level Authorization & HTTP method restrictions', async () => {
  const router = createApiRouter();
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // POST to /api/apartments/status should return 405 Method Not Allowed
    const statusPost = await fetch(base + '/api/apartments/status', { method: 'POST' });
    assert.equal(statusPost.status, 405);
    assert.match(statusPost.headers.get('allow') || '', /GET/);

    // GET to /api/leads should return 405 Method Not Allowed
    const leadsGet = await fetch(base + '/api/leads', { method: 'GET' });
    assert.equal(leadsGet.status, 405);
    assert.match(leadsGet.headers.get('allow') || '', /POST/);

    // GET to /api/booking should return 405 Method Not Allowed
    const bookingGet = await fetch(base + '/api/booking', { method: 'GET' });
    assert.equal(bookingGet.status, 405);
    assert.match(bookingGet.headers.get('allow') || '', /POST/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('OWASP API6: Sensitive Business Flows & Idempotency deduplication', async () => {
  const router = createApiRouter();
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  const post = (url, body) =>
    fetch(base + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

  try {
    const reqId = 'idem-req-' + Date.now();
    const payload = { ...validLead, requestId: reqId };

    // Initial submission -> 201 Created
    const res1 = await post('/api/leads', payload);
    assert.equal(res1.status, 201);
    const data1 = await res1.json();
    assert.ok(data1.id);

    // Idempotent retry with same requestId and identical body -> 200 OK with same id
    const res2 = await post('/api/leads', payload);
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.id, data1.id);

    // Conflict: same requestId but modified body -> 409 Conflict
    const resConflict = await post('/api/leads', { ...payload, name: 'Другой клиент' });
    assert.equal(resConflict.status, 409);
    const conflictData = await resConflict.json();
    assert.match(conflictData.error, /Идентификатор запроса уже использован/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('OWASP API7: Server Side Request Forgery (SSRF) in webhook configuration', async () => {
  const { BitrixAdapter } = await import('../server/bitrixAdapter.mjs');

  const origEnv = process.env.BITRIX_WEBHOOK_URL;
  try {
    // 1. Cloud metadata IP must be rejected
    process.env.BITRIX_WEBHOOK_URL = 'http://169.254.169.254/latest/meta-data/';
    const adapterMetadata = new BitrixAdapter();
    assert.equal(adapterMetadata.isConfigured(), false);

    // 2. Google internal metadata must be rejected
    process.env.BITRIX_WEBHOOK_URL = 'http://metadata.google.internal/computeMetadata/v1/';
    const adapterGoogle = new BitrixAdapter();
    assert.equal(adapterGoogle.isConfigured(), false);

    // 3. FTP protocol must be rejected
    process.env.BITRIX_WEBHOOK_URL = 'ftp://attacker.com/bitrix';
    const adapterFtp = new BitrixAdapter();
    assert.equal(adapterFtp.isConfigured(), false);

    // 4. Valid HTTPS webhook URL must be accepted
    process.env.BITRIX_WEBHOOK_URL = 'https://shattyq.bitrix24.kz/rest/1/valid_token_123';
    const adapterValid = new BitrixAdapter();
    assert.equal(adapterValid.isConfigured(), true);
  } finally {
    if (origEnv) {
      process.env.BITRIX_WEBHOOK_URL = origEnv;
    } else {
      delete process.env.BITRIX_WEBHOOK_URL;
    }
  }
});

test('OWASP API8: CORS preflight (OPTIONS) and Content-Type enforcement', async () => {
  const router = createApiRouter();
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // OPTIONS preflight request
    const optionsRes = await fetch(base + '/api/leads', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost',
        'Access-Control-Request-Method': 'POST'
      }
    });
    assert.equal(optionsRes.status, 204);
    assert.equal(optionsRes.headers.get('access-control-allow-origin'), 'http://localhost');
    assert.match(optionsRes.headers.get('access-control-allow-methods') || '', /POST/);

    // Unsupported Content-Type (text/plain) rejected with 415
    const plainTextRes = await fetch(base + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(validLead)
    });
    assert.equal(plainTextRes.status, 415);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('OWASP API5 & API8: Static server security, dotfiles blocking, URI error handling and security headers', async () => {
  const { createAppServer } = await import('../server/index.mjs');
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // 1. Method Not Allowed (405) for POST on static files
    const postStatic = await fetch(base + '/index.html', { method: 'POST', body: 'test' });
    assert.equal(postStatic.status, 405);
    assert.match(postStatic.headers.get('allow') || '', /GET, HEAD/);

    // 2. Access denied (403) for hidden dotfiles
    const dotfileRes = await fetch(base + '/.env');
    assert.equal(dotfileRes.status, 403);

    const dotgitRes = await fetch(base + '/.git/config');
    assert.equal(dotgitRes.status, 403);

    // 3. Bad Request (400) for malformed percent-encoding
    const malformedRes = await fetch(base + '/%80');
    assert.equal(malformedRes.status, 400);

    // 4. Security headers on static responses
    const headRes = await fetch(base + '/', { method: 'HEAD' });
    assert.ok(headRes.status === 200 || headRes.status === 404);
    assert.equal(headRes.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(headRes.headers.get('x-frame-options'), 'DENY');
    assert.equal(headRes.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.equal(headRes.headers.get('cross-origin-opener-policy'), 'same-origin');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

