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
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
