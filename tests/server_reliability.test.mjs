import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApiRouter } from '../server/apiRouter.mjs';
import { BitrixAdapter } from '../server/bitrixAdapter.mjs';
import { StatusCache } from '../server/statusCache.mjs';

const lead = { name: 'Тестовый клиент', phone: '+77001234567', topic: 'Консультация', consent: true, requestId: 'shared-request-01' };
const booking = { name: 'Тестовый клиент', phone: '+77001234567', consent: true, requestId: 'shared-request-01' };

async function withRouter(adapter, run) {
  const router = createApiRouter({ adapter });
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body) => fetch(base + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  try { await run(post, router); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

test('lead and booking idempotency keys are isolated and adapter IDs stay private', async () => {
  let leadCalls = 0;
  let bookingCalls = 0;
  const adapter = {
    isConfigured: () => true,
    createLead: async () => { leadCalls++; return { success: true, id: 49201, leadId: 49201, message: 'private' }; },
    createBooking: async () => { bookingCalls++; return { success: true, bookingId: 778899, message: 'private' }; },
    fetchApartmentStatuses: async () => []
  };
  await withRouter(adapter, async (post) => {
    const leadResponse = await post('/api/leads', lead);
    const bookingResponse = await post('/api/booking', booking);
    assert.equal(leadResponse.status, 201);
    assert.equal(bookingResponse.status, 201);
    const leadBody = await leadResponse.json();
    const bookingBody = await bookingResponse.json();
    assert.match(leadBody.id, /^[0-9a-f-]{36}$/i);
    assert.match(bookingBody.bookingId, /^[0-9a-f-]{36}$/i);
    assert.equal(leadBody.leadId, leadBody.id);
    assert.equal(bookingBody.id, bookingBody.bookingId);
    assert.ok(!JSON.stringify(leadBody).includes('49201'));
    assert.ok(!JSON.stringify(bookingBody).includes('778899'));
    assert.equal((await post('/api/leads', lead)).status, 200);
    assert.equal((await post('/api/booking', booking)).status, 200);
    assert.equal(leadCalls, 1);
    assert.equal(bookingCalls, 1);
  });
});

test('local write failures return an error and do not cache success receipts', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'sansata-write-fail-'));
  const originalCwd = process.cwd();
  await writeFile(join(directory, '.local'), 'blocks the data directory');
  let leadCalls = 0;
  let bookingCalls = 0;
  const adapter = {
    isConfigured: () => false,
    createLead: async () => { leadCalls++; return { success: true }; },
    createBooking: async () => { bookingCalls++; return { success: true }; },
    fetchApartmentStatuses: async () => []
  };
  try {
    process.chdir(directory);
    await withRouter(adapter, async (post) => {
      for (const path of ['/api/leads', '/api/booking']) {
        const payload = path === '/api/leads' ? lead : booking;
        for (let attempt = 0; attempt < 2; attempt++) {
          const response = await post(path, payload);
          assert.equal(response.status, 502);
          const body = await response.json();
          assert.equal(body.success, false);
          assert.equal(body.id, undefined);
          assert.equal(body.bookingId, undefined);
        }
      }
    });
    assert.equal(leadCalls, 2);
    assert.equal(bookingCalls, 2);
  } finally {
    process.chdir(originalCwd);
    await rm(directory, { recursive: true, force: true });
  }
});

test('CRM records without an explicit state remain unknown', async () => {
  const cache = new StatusCache();
  const data = await cache.getStatuses({ fetchApartmentStatuses: async () => [
    { title: 'saf-observation-1-2-property-1' },
    { title: 'saf-observation-1-2-property-2', status: 'available' },
    { title: 'saf-observation-1-2-property-3', status: 'sold' },
    { title: 'saf-observation-1-2-property-4', stageId: 'UNSOLD' }
  ] });
  assert.equal(data.statuses['saf-observation-1-2-property-1'], 'unknown');
  assert.equal(data.statuses['saf-observation-1-2-property-2'], 'available');
  assert.equal(data.statuses['saf-observation-1-2-property-3'], 'sold');
  assert.equal(data.statuses['saf-observation-1-2-property-4'], 'unknown');
});

test('concurrent cold status requests share the first CRM result', async () => {
  const cache = new StatusCache();
  let finishFetch;
  let calls = 0;
  const pending = new Promise((resolve) => { finishFetch = resolve; });
  const adapter = { fetchApartmentStatuses: async () => { calls++; return pending; } };
  const first = cache.getStatuses(adapter);
  const second = cache.getStatuses(adapter);
  finishFetch([{ title: 'saf-observation-1-2-property-1', status: 'available' }]);
  const [firstResult, secondResult] = await Promise.all([first, second]);
  assert.equal(calls, 1);
  assert.deepEqual(secondResult, firstResult);
  assert.equal(secondResult.statuses['saf-observation-1-2-property-1'], 'available');
});

test('public cache cleanup removes expired entries regardless of insertion order', () => {
  const router = createApiRouter();
  const now = Date.now();
  router.receivedRequests.set('fresh', { time: now, result: Promise.resolve({ success: true }) });
  router.receivedRequests.set('expired', { time: now - 2 * 60 * 60 * 1000, result: Promise.resolve({ success: true }) });
  router.cleanReceivedRequests();
  assert.equal(router.receivedRequests.has('fresh'), true);
  assert.equal(router.receivedRequests.has('expired'), false);
});

test('an expired receipt cannot block a new submission when cache entries are out of order', async () => {
  let calls = 0;
  const adapter = {
    isConfigured: () => true,
    createLead: async () => { calls++; return { success: true }; }
  };
  await withRouter(adapter, async (post, router) => {
    const requestId = 'stale-id-0001';
    router.receivedRequests.set('fresh', { time: Date.now(), fingerprint: 'fresh', result: Promise.resolve({ success: true }) });
    router.receivedRequests.set(`127.0.0.1:${requestId}`, {
      time: Date.now() - 2 * 60 * 60 * 1000,
      fingerprint: 'previous-payload',
      result: Promise.resolve({ success: true, id: 'previous-receipt' })
    });
    const response = await post('/api/leads', { ...lead, requestId });
    assert.equal(response.status, 201);
    assert.equal(calls, 1);
    assert.notEqual((await response.json()).id, 'previous-receipt');
  });
});

test('booking consultation creates a CRM lead, never a deal', async () => {
  const previousWebhook = process.env.BITRIX_WEBHOOK_URL;
  const previousFetch = globalThis.fetch;
  const calls = [];
  process.env.BITRIX_WEBHOOK_URL = 'https://example.bitrix24.kz/rest/1/placeholder/';
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), body: JSON.parse(options.body) });
    return { ok: true, json: async () => ({ result: 12345 }) };
  };
  try {
    const adapter = new BitrixAdapter();
    const result = await adapter.createBooking({ name: 'Тестовый клиент', phone: '+77001234567', apartmentId: 'saf-observation-1-2-property-1' });
    assert.equal(result.success, true);
    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.endsWith('/crm.lead.add.json'));
    assert.match(calls[0].body.fields.COMMENTS, /консультации/);
    assert.equal(calls[0].body.fields.CATEGORY_ID, undefined);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousWebhook === undefined) delete process.env.BITRIX_WEBHOOK_URL;
    else process.env.BITRIX_WEBHOOK_URL = previousWebhook;
  }
});
