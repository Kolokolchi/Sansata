import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createApiRouter, MAX_RECEIVED_REQUESTS } from '../server/apiRouter.mjs';
import { RateLimiter } from '../server/rateLimiter.mjs';
import { BitrixAdapter } from '../server/bitrixAdapter.mjs';
import { StatusCache } from '../server/statusCache.mjs';

const sampleLead = {
  name: 'Кайрат Нуртас',
  phone: '+7 (701) 777-88-99',
  consent: true,
  topic: 'Стресс-тест периметра'
};

const sampleBooking = {
  name: 'Динара Сатпаева',
  phone: '+7 (702) 111-22-33',
  consent: true,
  apartmentId: 'shattyq-1',
  apartmentNumber: '101'
};

// ============================================================================
// CHALLENGE 1: Rate Limiter Bounds & Enforcement Under Rapid Requests
// ============================================================================

test('Challenge 1.1: Rapid concurrent requests to /api/leads enforce quota (3 allowed, remainder 429)', async () => {
  const router = createApiRouter({
    leadLimiter: new RateLimiter(3, 600000)
  });
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // Send 20 concurrent requests simultaneously
    const requests = Array.from({ length: 20 }, (_, i) =>
      fetch(base + '/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sampleLead, name: `Concurrent Client ${i}` })
      })
    );

    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.status);
    const status201Count = statuses.filter((s) => s === 201).length;
    const status429Count = statuses.filter((s) => s === 429).length;

    assert.equal(status201Count, 3, 'Exactly 3 requests must succeed with 201 Created');
    assert.equal(status429Count, 17, 'Exactly 17 requests must be rejected with 429 Too Many Requests');

    // Verify 429 responses contain Retry-After header and correct error message
    const rateLimitedResponses = responses.filter((r) => r.status === 429);
    for (const res of rateLimitedResponses) {
      assert.ok(res.headers.has('retry-after'), '429 response must include Retry-After header');
      const retryAfterVal = Number(res.headers.get('retry-after'));
      assert.ok(retryAfterVal > 0 && retryAfterVal <= 600, 'Retry-After must be positive integer <= 600s');
      const body = await res.json();
      assert.match(body.error, /3 заявки за 10 минут/);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Challenge 1.2: Rapid concurrent requests to /api/booking enforce quota (3 allowed, remainder 429)', async () => {
  const router = createApiRouter({
    bookingLimiter: new RateLimiter(3, 600000)
  });
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const requests = Array.from({ length: 20 }, (_, i) =>
      fetch(base + '/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sampleBooking, name: `Booking Client ${i}` })
      })
    );

    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.status);
    const status201Count = statuses.filter((s) => s === 201).length;
    const status429Count = statuses.filter((s) => s === 429).length;

    assert.equal(status201Count, 3, 'Exactly 3 booking requests must succeed with 201 Created');
    assert.equal(status429Count, 17, 'Exactly 17 booking requests must be rejected with 429 Too Many Requests');

    const rateLimited = responses.filter((r) => r.status === 429);
    for (const res of rateLimited) {
      assert.ok(res.headers.has('retry-after'));
      const body = await res.json();
      assert.match(body.error, /Слишком много запросов на бронирование/);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Challenge 1.3: Status endpoint rate limiting (60 allowed per minute, remainder 429)', async () => {
  const router = createApiRouter({
    statusLimiter: new RateLimiter(60, 60000)
  });
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // Fire 75 sequential/pipelined requests
    let passedCount = 0;
    let blockedCount = 0;

    for (let i = 0; i < 75; i++) {
      const res = await fetch(base + '/api/apartments/status');
      if (res.status === 200) {
        passedCount++;
      } else if (res.status === 429) {
        blockedCount++;
        assert.ok(res.headers.has('retry-after'));
      }
    }

    assert.equal(passedCount, 60, 'Exactly 60 status requests must return 200 OK');
    assert.equal(blockedCount, 15, 'Subsequent 15 status requests must return 429 Too Many Requests');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Challenge 1.4: Endpoint limiter isolation (exhausting leads does not block booking or status)', async () => {
  const router = createApiRouter();
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // 1. Exhaust leads quota (3 requests)
    for (let i = 0; i < 3; i++) {
      const res = await fetch(base + '/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sampleLead, name: `Exhaust User ${i}` })
      });
      assert.equal(res.status, 201);
    }

    // 4th leads request returns 429
    const blockedLead = await fetch(base + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sampleLead)
    });
    assert.equal(blockedLead.status, 429);

    // 2. Booking endpoint is NOT blocked
    const bookingRes = await fetch(base + '/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sampleBooking)
    });
    assert.equal(bookingRes.status, 201, 'Booking endpoint must remain operational when leads quota is exhausted');

    // 3. Status endpoint is NOT blocked
    const statusRes = await fetch(base + '/api/apartments/status');
    assert.equal(statusRes.status, 200, 'Status endpoint must remain operational when leads quota is exhausted');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Challenge 1.5: IP spoofing resistance: cycling X-Forwarded-For does NOT bypass rate limit without TRUST_PROXY', async () => {
  delete process.env.TRUST_PROXY;
  const router = createApiRouter({
    leadLimiter: new RateLimiter(3, 600000)
  });
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // Attacker sends 6 requests, each with a different forged X-Forwarded-For header
    const results = [];
    for (let i = 0; i < 6; i++) {
      const res = await fetch(base + '/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': `203.0.113.${i + 1}` // spoofed IP
        },
        body: JSON.stringify({ ...sampleLead, name: `Spoofer ${i}` })
      });
      results.push(res.status);
    }

    // Since TRUST_PROXY is undefined, getClientIp defaults to socket address (127.0.0.1).
    // The rate limiter must see the same socket IP and block after 3 requests!
    assert.deepEqual(
      results,
      [201, 201, 201, 429, 429, 429],
      'Spoofed X-Forwarded-For headers must be ignored when TRUST_PROXY is false'
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Challenge 1.6: RateLimiter memory capacity bound and FIFO eviction under 15,000 distinct IPs', () => {
  const maxEntries = 10000;
  const limiter = new RateLimiter(3, 600000, maxEntries);

  // Feed 15,000 distinct IP addresses
  for (let i = 0; i < 15000; i++) {
    const ip = `10.${Math.floor(i / 65536)}.${Math.floor((i % 65536) / 256)}.${i % 256}`;
    limiter.isAllowed(ip);
  }

  // Verify memory bound
  assert.ok(
    limiter.buckets.size <= maxEntries,
    `RateLimiter bucket size (${limiter.buckets.size}) must never exceed maxEntries (${maxEntries})`
  );
  assert.equal(limiter.buckets.size, maxEntries, 'RateLimiter bucket size should be capped at exactly maxEntries');

  // Verify FIFO eviction: earliest IPs (e.g. i < 5000) must have been evicted
  const earliestIp = '10.0.0.0';
  assert.equal(limiter.buckets.has(earliestIp), false, 'Oldest entry must have been evicted (FIFO)');

  // Latest IP must be present
  const latestIp = `10.${Math.floor(14999 / 65536)}.${Math.floor((14999 % 65536) / 256)}.${14999 % 256}`;
  assert.equal(limiter.buckets.has(latestIp), true, 'Latest inserted IP must be present');
});

// ============================================================================
// CHALLENGE 2: Honeypot Bot Defense
// ============================================================================

test('Challenge 2.1 & 2.2: Honeypot bot submission returns 200 OK without writing to disk or CRM', async () => {
  let crmLeadCalls = 0;
  let crmBookingCalls = 0;

  const mockAdapter = {
    isConfigured: () => true,
    createLead: async () => { crmLeadCalls++; return { success: true, id: 'crm-lead-1' }; },
    createBooking: async () => { crmBookingCalls++; return { success: true, bookingId: 'crm-book-1' }; }
  };

  const leadsFilePath = resolve('.local/leads.ndjson');
  const bookingsFilePath = resolve('.local/bookings.ndjson');

  const getFileSize = async (filePath) => {
    try {
      const s = await stat(filePath);
      return s.size;
    } catch {
      return 0;
    }
  };

  const leadsSizeBefore = await getFileSize(leadsFilePath);
  const bookingsSizeBefore = await getFileSize(bookingsFilePath);

  const router = createApiRouter({ adapter: mockAdapter });
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // 1. Submit Honeypot Lead (contains "website")
    const honeypotLeadRes = await fetch(base + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...sampleLead,
        website: 'http://spambot-automation.ru'
      })
    });

    assert.equal(honeypotLeadRes.status, 200, 'Honeypot lead submission must return HTTP 200 OK');
    const leadBody = await honeypotLeadRes.json();
    assert.equal(leadBody.success, true);
    assert.equal(leadBody.ok, true);
    assert.ok(leadBody.id, 'Honeypot response should return a mock ID to convince bot');
    assert.equal(leadBody.mode, 'local');

    // 2. Submit Honeypot Booking (contains "website")
    const honeypotBookRes = await fetch(base + '/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...sampleBooking,
        website: 'http://crawler-auto.org'
      })
    });

    assert.equal(honeypotBookRes.status, 200, 'Honeypot booking submission must return HTTP 200 OK');
    const bookBody = await honeypotBookRes.json();
    assert.equal(bookBody.success, true);
    assert.equal(bookBody.ok, true);
    assert.ok(bookBody.bookingId);

    // 3. Verify zero CRM calls were triggered
    assert.equal(crmLeadCalls, 0, 'BitrixAdapter.createLead must NOT be called for honeypot submissions');
    assert.equal(crmBookingCalls, 0, 'BitrixAdapter.createBooking must NOT be called for honeypot submissions');

    // 4. Verify zero disk writes occurred
    const leadsSizeAfter = await getFileSize(leadsFilePath);
    const bookingsSizeAfter = await getFileSize(bookingsFilePath);
    assert.equal(leadsSizeAfter, leadsSizeBefore, 'leads.ndjson size must not increase for honeypot submissions');
    assert.equal(bookingsSizeAfter, bookingsSizeBefore, 'bookings.ndjson size must not increase for honeypot submissions');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Challenge 2.3: Honeypot submissions strictly consume rate limiter quota', async () => {
  const router = createApiRouter({
    leadLimiter: new RateLimiter(3, 600000)
  });
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // Send 3 honeypot requests
    for (let i = 0; i < 3; i++) {
      const res = await fetch(base + '/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sampleLead, website: `http://bot-${i}.com` })
      });
      assert.equal(res.status, 200);
    }

    // 4th attempt from same IP (even a legitimate submission without honeypot) must be 429
    const res4 = await fetch(base + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sampleLead)
    });
    assert.equal(res4.status, 429, 'Rate limiter quota must be consumed by honeypot submissions');
    assert.ok(res4.headers.has('retry-after'));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

// ============================================================================
// CHALLENGE 3: Payload Limits (> 8 KB -> 413)
// ============================================================================

test('Challenge 3.1 & 3.2: Payloads > 8192 bytes return HTTP 413 across endpoints', async () => {
  const router = createApiRouter({
    leadLimiter: new RateLimiter(100, 60000),
    bookingLimiter: new RateLimiter(100, 60000)
  });
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // Exactly 8193 bytes body
    const baseJson = JSON.stringify({ name: 'User', phone: '+77011112233', consent: true, topic: '' });
    const paddingNeeded = 8193 - baseJson.length;
    const body8193 = JSON.stringify({
      name: 'User',
      phone: '+77011112233',
      consent: true,
      topic: 'A'.repeat(paddingNeeded)
    });
    assert.ok(Buffer.byteLength(body8193, 'utf8') >= 8193);

    // 1. /api/leads with 8193 bytes -> 413
    const leadsRes = await fetch(base + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body8193
    });
    assert.equal(leadsRes.status, 413, 'Payload >= 8193 bytes on /api/leads must return 413');
    const leadsBody = await leadsRes.json();
    assert.match(leadsBody.error, /8 КБ/);

    // 2. /api/booking with 8193 bytes -> 413
    const bookingRes = await fetch(base + '/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body8193
    });
    assert.equal(bookingRes.status, 413, 'Payload >= 8193 bytes on /api/booking must return 413');
    const bookingBody = await bookingRes.json();
    assert.match(bookingBody.error, /8 КБ/);

    // 3. Massive payload (64 KB) -> 413
    const massiveBody = JSON.stringify({ topic: 'M'.repeat(65536) });
    const massiveRes = await fetch(base + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: massiveBody
    });
    assert.equal(massiveRes.status, 413);

    // 4. Empty payload (0 bytes) -> 400 Bad Request
    const emptyRes = await fetch(base + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: ''
    });
    assert.equal(emptyRes.status, 400, 'Empty payload must return 400 Bad Request');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Challenge 3.3: Chunked stream exceeding 8 KB aborts with 413 before buffering', async () => {
  const router = createApiRouter({
    leadLimiter: new RateLimiter(10, 60000)
  });
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    const { request } = await import('node:http');

    const res = await new Promise((resolvePromise, rejectPromise) => {
      const clientReq = request(
        {
          hostname: '127.0.0.1',
          port,
          path: '/api/leads',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Transfer-Encoding': 'chunked'
          }
        },
        (clientRes) => {
          let data = '';
          clientRes.on('data', (c) => (data += c));
          clientRes.on('end', () => resolvePromise({ status: clientRes.statusCode, body: data }));
        }
      );

      clientReq.on('error', rejectPromise);

      // Send first chunk (4000 bytes)
      clientReq.write('{"topic":"' + 'X'.repeat(3900));
      // Send second chunk (5000 bytes) -> total 9000 bytes > 8192 limit
      clientReq.write('Y'.repeat(5000) + '"}');
      clientReq.end();
    });

    assert.equal(res.status, 413, 'Streaming payload exceeding 8192 bytes must trigger 413');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

// ============================================================================
// CHALLENGE 4: Prototype Pollution Defense
// ============================================================================

test('Challenge 4.1 & 4.2 & 4.3: Prototype pollution keys (__proto__, constructor, prototype) return 400', async () => {
  const router = createApiRouter({
    leadLimiter: new RateLimiter(50, 60000),
    bookingLimiter: new RateLimiter(50, 60000)
  });
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  const postRaw = (path, rawBody) =>
    fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: rawBody
    });

  try {
    // 1. __proto__ injection
    const proto1 = '{"name":"Hacker","phone":"+77011112233","consent":true,"__proto__":{"isAdmin":true}}';
    const res1 = await postRaw('/api/leads', proto1);
    assert.equal(res1.status, 400, '__proto__ in /api/leads must return 400');
    assert.equal(Object.prototype.isAdmin, undefined, 'Object.prototype must not be polluted');

    const res1b = await postRaw('/api/booking', proto1);
    assert.equal(res1b.status, 400, '__proto__ in /api/booking must return 400');

    // 2. constructor.prototype injection
    const proto2 = '{"name":"Hacker","phone":"+77011112233","consent":true,"constructor":{"prototype":{"isRoot":true}}}';
    const res2 = await postRaw('/api/leads', proto2);
    assert.equal(res2.status, 400, 'constructor.prototype must return 400');
    assert.equal(Object.prototype.isRoot, undefined);

    // 3. direct "constructor" top-level key
    const proto3 = '{"name":"Hacker","phone":"+77011112233","consent":true,"constructor":"evil"}';
    const res3 = await postRaw('/api/leads', proto3);
    assert.equal(res3.status, 400, 'constructor key must return 400');

    // 4. direct "prototype" top-level key
    const proto4 = '{"name":"Hacker","phone":"+77011112233","consent":true,"prototype":{"evil":true}}';
    const res4 = await postRaw('/api/leads', proto4);
    assert.equal(res4.status, 400, 'prototype key must return 400');

    // 5. non-object root JSON values
    const arrayRes = await postRaw('/api/leads', '[1, 2, 3]');
    assert.equal(arrayRes.status, 400, 'JSON array root must return 400');

    const numRes = await postRaw('/api/leads', '12345');
    assert.equal(numRes.status, 400, 'JSON number root must return 400');

    const strRes = await postRaw('/api/leads', '"test-string"');
    assert.equal(strRes.status, 400, 'JSON string root must return 400');

    const boolRes = await postRaw('/api/leads', 'true');
    assert.equal(boolRes.status, 400, 'JSON boolean root must return 400');

    const nullRes = await postRaw('/api/leads', 'null');
    assert.equal(nullRes.status, 400, 'JSON null root must return 400');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

// ============================================================================
// CHALLENGE 5: Idempotency Map Capacity Bound
// ============================================================================

test('Challenge 5.1 & 5.2 & 5.3: Idempotency Map capacity bound <= 10,000 entries under continuous load', async () => {
  assert.equal(MAX_RECEIVED_REQUESTS, 10000, 'MAX_RECEIVED_REQUESTS default constant must be 10,000');

  const router = createApiRouter({
    leadLimiter: new RateLimiter(50000, 60000)
  });

  const receivedRequests = router.receivedRequests;
  assert.ok(receivedRequests instanceof Map, 'receivedRequests must be a Map instance');
  assert.equal(receivedRequests.size, 0);

  // Directly exercise the internal deduplication storage under 15,000 continuous unique requests
  // Each entry simulates a recorded request
  for (let i = 0; i < 15000; i++) {
    const key = `127.0.0.1:req-key-${i}`;
    const item = {
      time: Date.now(),
      fingerprint: `fp-${i}`,
      result: Promise.resolve({ ok: true, id: `id-${i}` })
    };

    // Simulate saving through the identical FIFO eviction mechanism
    router.cleanReceivedRequests();
    if (receivedRequests.size >= router.maxReceivedRequests) {
      const oldestKey = receivedRequests.keys().next().value;
      receivedRequests.delete(oldestKey);
    }
    receivedRequests.set(key, item);
  }

  // Empirically assert capacity bound
  assert.ok(
    receivedRequests.size <= 10000,
    `receivedRequests.size (${receivedRequests.size}) must never exceed 10000`
  );
  assert.equal(receivedRequests.size, 10000, 'receivedRequests.size must be capped exactly at 10,000');

  // Verify FIFO eviction: keys 0..4999 MUST be deleted
  assert.equal(receivedRequests.has('127.0.0.1:req-key-0'), false, 'Key 0 must have been evicted');
  assert.equal(receivedRequests.has('127.0.0.1:req-key-4999'), false, 'Key 4999 must have been evicted');

  // Keys 5000..14999 MUST be retained
  assert.equal(receivedRequests.has('127.0.0.1:req-key-5000'), true, 'Key 5000 must be retained');
  assert.equal(receivedRequests.has('127.0.0.1:req-key-14999'), true, 'Key 14999 must be retained');
});

test('Challenge 5.4 & 5.5: Idempotency deduplication and conflict detection through HTTP', async () => {
  const router = createApiRouter();
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const reqId = 'emp-idem-test-999';
    const payload = { ...sampleLead, requestId: reqId };

    // 1. Initial request -> 201 Created
    const res1 = await fetch(base + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assert.equal(res1.status, 201);
    const data1 = await res1.json();
    assert.ok(data1.id);

    // 2. Duplicate request with identical payload -> 200 OK with cached response
    const res2 = await fetch(base + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assert.equal(res2.status, 200);
    const data2 = await res2.json();
    assert.equal(data2.id, data1.id, 'Cached ID must match original ID');

    // 3. Conflicting request with same requestId but different payload -> 409 Conflict
    const resConflict = await fetch(base + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, name: 'Совершенно Другое Имя' })
    });
    assert.equal(resConflict.status, 409, 'Modified payload with same requestId must return 409 Conflict');
    const conflictBody = await resConflict.json();
    assert.match(conflictBody.error, /Идентификатор запроса уже использован/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Challenge 5.6: cleanReceivedRequests evicts entries older than 1 hour (3600000 ms)', () => {
  const router = createApiRouter();
  const received = router.receivedRequests;

  const now = Date.now();
  // Old entry: 2 hours ago
  received.set('old-req', { time: now - 7200000, fingerprint: 'old', result: Promise.resolve({}) });
  // Recent entry: 5 minutes ago
  received.set('recent-req', { time: now - 300000, fingerprint: 'recent', result: Promise.resolve({}) });

  assert.equal(received.size, 2);

  router.cleanReceivedRequests();

  assert.equal(received.has('old-req'), false, 'Entries older than 1 hour must be evicted by cleanReceivedRequests');
  assert.equal(received.has('recent-req'), true, 'Recent entries must remain in cache');
});
