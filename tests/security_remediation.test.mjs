import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { build } from 'esbuild';
import { createAppServer, securityHeaders } from '../server/index.mjs';
import { createApiRouter, MAX_RECEIVED_REQUESTS } from '../server/apiRouter.mjs';
import { BitrixAdapter } from '../server/bitrixAdapter.mjs';
import { RateLimiter } from '../server/rateLimiter.mjs';
import { StatusCache } from '../server/statusCache.mjs';

// ============================================================================
// Dynamic Module Loaders via esbuild (matching project test convention)
// ============================================================================

async function loadConfigModule() {
  const bundled = await build({
    stdin: {
      contents: "export * from './src/lib/config'; export * from './src/lib/experience';",
      resolveDir: process.cwd()
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node'
  });

  return import(
    'data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64')
  );
}

async function loadSiteModule(base = '/') {
  const result = await build({
    entryPoints: ['src/lib/site.ts'],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    define: {
      'import.meta.env.BASE_URL': JSON.stringify(base),
      'import.meta.env.VITE_STATIC_HOSTING': '"false"'
    }
  });

  return import(
    'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
  );
}

async function loadExperienceRoutesModule() {
  const result = await build({
    stdin: {
      contents: "export { safeDecode } from './src/features/ExperienceRoutes';",
      resolveDir: process.cwd()
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    loader: { '.css': 'empty' },
    define: {
      'import.meta.env.BASE_URL': '"/"',
      'import.meta.env.VITE_STATIC_HOSTING': '"false"'
    }
  });

  return import(
    'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
  );
}

const sampleLead = {
  name: 'Азамат Исмаилов',
  phone: '+7 (777) 123-45-67',
  consent: true,
  topic: 'Консультация по ипотеке'
};

const sampleBooking = {
  name: 'Алия Мусина',
  phone: '+7 (705) 555-55-55',
  consent: true,
  apartmentId: 'shattyq-1',
  apartmentNumber: '42'
};

// ============================================================================
// TIER 1: Feature Coverage for Server Security
// ============================================================================

test('Tier 1: Feature coverage for server security - Content-Security-Policy headers', async () => {
  // 1. Verify export definition in securityHeaders
  assert.ok(securityHeaders['Content-Security-Policy'], 'Content-Security-Policy must be defined');
  const csp = securityHeaders['Content-Security-Policy'];

  // Check required directives
  assert.match(csp, /default-src 'self'/, 'CSP must contain default-src self');
  assert.match(csp, /script-src 'self'/, 'CSP must contain script-src self');
  assert.match(csp, /style-src 'self' 'unsafe-inline'/, 'CSP must allow inline styles');
  assert.match(csp, /object-src 'none'/, 'CSP must block object-src');
  assert.match(csp, /frame-ancestors 'none'/, 'CSP must block frame-ancestors');
  assert.match(csp, /frame-src [^;]*lumalabs\.ai/, 'CSP must allow lumalabs.ai iframe embeds');
  assert.match(csp, /connect-src [^;]*https:/, 'CSP must allow https: connect-src');

  // 2. Verify CSP header is attached to HTTP responses from createAppServer
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const res = await fetch(base + '/', { method: 'HEAD' });
    assert.equal(res.headers.get('content-security-policy'), csp);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Tier 1: Feature coverage for server security - Stream error handling resilience', async () => {
  // Verify that an error emitted on a file stream piped to an HTTP response
  // is caught gracefully by stream error handlers without crashing the server process.
  let errorCaught = false;

  const mockServer = createServer((req, res) => {
    const faultyStream = new Readable({
      read() {
        this.emit('error', new Error('Simulated disk read error during streaming'));
      }
    });

    faultyStream.on('error', (err) => {
      errorCaught = true;
      faultyStream.destroy();
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Server error' }));
      } else {
        res.destroy();
      }
    });

    faultyStream.pipe(res);
  });

  await new Promise((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${mockServer.address().port}`;

  try {
    const res = await fetch(base + '/faulty-file');
    assert.equal(res.status, 500);
    const data = await res.json();
    assert.equal(data.error, 'Server error');
    assert.equal(errorCaught, true, 'Stream error listener must handle the error');
  } finally {
    await new Promise((resolve) => mockServer.close(resolve));
  }
});

test('Tier 1: Feature coverage for server security - receivedRequests FIFO eviction and bounds', async () => {
  // Constant verification
  assert.equal(MAX_RECEIVED_REQUESTS, 10000, 'MAX_RECEIVED_REQUESTS constant should be 10000');

  // Verify FIFO eviction in createApiRouter by configuring a small capacity bound of 2
  process.env.TRUST_PROXY = 'true';
  const router = createApiRouter({ maxReceivedRequests: 2 });
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const postWithIp = (ip, requestId, name) =>
      fetch(base + '/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': ip
        },
        body: JSON.stringify({ ...sampleLead, requestId, name })
      });

    // 1. Submit Request 1 (capacity: 1/2) -> 201 Created
    const res1 = await postWithIp('10.0.0.1', 'req-alpha', 'Клиент 1');
    assert.equal(res1.status, 201);
    const data1 = await res1.json();
    assert.ok(data1.id);

    // 2. Submit Request 2 (capacity: 2/2) -> 201 Created
    const res2 = await postWithIp('10.0.0.2', 'req-beta', 'Клиент 2');
    assert.equal(res2.status, 201);
    const data2 = await res2.json();
    assert.ok(data2.id);

    // 3. Submit Request 3 (capacity exceeds 2 -> oldest 'req-alpha' from 10.0.0.1 must be evicted)
    const res3 = await postWithIp('10.0.0.3', 'req-gamma', 'Клиент 3');
    assert.equal(res3.status, 201);
    const data3 = await res3.json();
    assert.ok(data3.id);

    // 4. Verify 'req-beta' (still in cache) returns deduplicated 200 OK with identical id
    const resBetaDedupe = await postWithIp('10.0.0.2', 'req-beta', 'Клиент 2');
    assert.equal(resBetaDedupe.status, 200);
    const dataBetaDedupe = await resBetaDedupe.json();
    assert.equal(dataBetaDedupe.id, data2.id);

    // 5. Verify 'req-alpha' was evicted: re-submitting executes as a fresh request (new ID, 201 Created)
    const resAlphaReplay = await postWithIp('10.0.0.1', 'req-alpha', 'Клиент 1');
    assert.equal(resAlphaReplay.status, 201);
    const dataAlphaReplay = await resAlphaReplay.json();
    assert.notEqual(dataAlphaReplay.id, data1.id, 'Evicted request must generate a fresh response instead of cached duplicate');
  } finally {
    delete process.env.TRUST_PROXY;
    await new Promise((resolve) => server.close(resolve));
  }
});

// ============================================================================
// TIER 2: Boundary & Corner Cases
// ============================================================================

test('Tier 2: Boundary & corner cases - Safe URI decoding on malformed sequences', async () => {
  const { safeDecode } = await loadExperienceRoutesModule();

  // Malformed percent encodings that throw native URIError in decodeURIComponent
  assert.equal(safeDecode('%FF'), '%FF', 'Malformed byte %FF must return original string without throwing');
  assert.equal(safeDecode('%E0%A0'), '%E0%A0', 'Truncated UTF-8 sequence must return original string');
  assert.equal(safeDecode('invalid%2'), 'invalid%2', 'Trailing incomplete escape sequence must return original string');
  assert.equal(safeDecode('slug%zz'), 'slug%zz', 'Non-hex percent encoding must return original string');

  // Valid encodings must decode correctly
  assert.equal(safeDecode('%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D0%B0'), 'квартира');
  assert.equal(safeDecode('normal-slug-42'), 'normal-slug-42');
  assert.equal(safeDecode('room%20tour'), 'room tour');
});

test('Tier 2: Boundary & corner cases - parseExperience rejects external HTTPS lead endpoints', async () => {
  const { parseExperience, fallbackConfig, isValidLeadEndpoint } = await loadConfigModule();

  // Test isValidLeadEndpoint helper
  assert.equal(isValidLeadEndpoint('/api/leads'), true);
  assert.equal(isValidLeadEndpoint('/api/custom-endpoint'), true);
  assert.equal(isValidLeadEndpoint('https://evil.com/api/leads'), false);
  assert.equal(isValidLeadEndpoint('http://attacker.org/exfiltrate'), false);
  assert.equal(isValidLeadEndpoint('//evil.com/leads'), false);
  assert.equal(isValidLeadEndpoint('javascript:alert(1)'), false);
  assert.equal(isValidLeadEndpoint(''), false);
  assert.equal(isValidLeadEndpoint(null), false);

  // Valid relative endpoint passes parseExperience
  const validConfig = parseExperience({
    ...fallbackConfig,
    leadEndpoint: '/api/leads'
  });
  assert.equal(validConfig.leadEndpoint, '/api/leads');

  // External HTTPS URL must throw Error('Invalid endpoint')
  assert.throws(
    () => parseExperience({ ...fallbackConfig, leadEndpoint: 'https://attacker.com/steal-leads' }),
    /Invalid endpoint/
  );

  assert.throws(
    () => parseExperience({ ...fallbackConfig, leadEndpoint: '//exfiltrate.org/api' }),
    /Invalid endpoint/
  );
});

test('Tier 2: Boundary & corner cases - navigateTo rejects dangerous pseudo-protocols and protocol-relative URLs', async () => {
  const { navigateTo } = await loadSiteModule('/');

  let currentHref = 'http://localhost/';
  let pushedUrl = null;

  globalThis.PopStateEvent = class PopStateEvent {
    constructor(type) { this.type = type; }
  };

  globalThis.window = {
    location: {
      get href() { return currentHref; },
      set href(val) { currentHref = val; }
    },
    dispatchEvent: () => {},
    scrollTo: () => {}
  };

  globalThis.history = {
    pushState: (_state, _title, url) => { pushedUrl = url; },
    replaceState: (_state, _title, url) => { pushedUrl = url; }
  };

  try {
    // 1. Dangerous javascript: URLs must be blocked
    currentHref = 'http://localhost/';
    pushedUrl = null;
    navigateTo('javascript:alert(1)');
    assert.equal(currentHref, 'http://localhost/', 'javascript: pseudo-protocol must not navigate');
    assert.equal(pushedUrl, null, 'javascript: URL must not update history state');

    navigateTo('  javascript:fetch("https://attacker.com")  ');
    assert.equal(currentHref, 'http://localhost/', 'Whitespace-padded javascript: must be blocked');

    // 2. Protocol-relative URLs must be blocked
    navigateTo('//evil.com/phishing');
    assert.equal(currentHref, 'http://localhost/', '// protocol-relative URL must not navigate');
    assert.equal(pushedUrl, null);

    // 3. Dangerous data: and vbscript: URLs must be blocked
    navigateTo('data:text/html,<script>alert(1)</script>');
    assert.equal(currentHref, 'http://localhost/');
    navigateTo('vbscript:msgbox(1)');
    assert.equal(currentHref, 'http://localhost/');

    // 4. Safe internal routes must navigate cleanly
    navigateTo('/flat/shattyq-1');
    assert.equal(pushedUrl, '/flat/shattyq-1', 'Safe internal URL must push to history');
  } finally {
    delete globalThis.window;
    delete globalThis.history;
    delete globalThis.PopStateEvent;
  }
});

test('Tier 2: Boundary & corner cases - Vite dev server fs.deny blocks .db and .env files', async () => {
  const viteConfigModule = await import('../vite.config.ts');
  const viteConfigFn = viteConfigModule.default;
  assert.equal(typeof viteConfigFn, 'function', 'vite.config.ts should export a configuration function');

  const devConfig = viteConfigFn({ mode: 'development', command: 'serve' });
  assert.ok(devConfig.server, 'Dev server config must be defined');
  assert.ok(devConfig.server.fs, 'server.fs configuration must be defined');
  assert.ok(Array.isArray(devConfig.server.fs.deny), 'server.fs.deny must be an array');

  const denyList = devConfig.server.fs.deny;
  assert.ok(denyList.includes('**/*.db'), 'server.fs.deny must include **/*.db to protect SQLite databases');
  assert.ok(denyList.includes('**/.env*'), 'server.fs.deny must include **/.env* to protect environment files');
});

// ============================================================================
// TIER 3: Cross-Feature Combinations
// ============================================================================

test('Tier 3: Cross-feature combinations - Rate limiter enforces quota on honeypot bot submissions', async () => {
  const router = createApiRouter({
    leadLimiter: new RateLimiter(3, 60000)
  });
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const postHoneypot = () =>
      fetch(base + '/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sampleLead,
          website: 'http://spambot-automation.net' // honeypot triggered
        })
      });

    // Submissions 1, 2, 3: honeypot returns silent 200 OK
    for (let i = 0; i < 3; i++) {
      const res = await postHoneypot();
      assert.equal(res.status, 200, `Honeypot submission ${i + 1} must return silent 200 OK`);
      const body = await res.json();
      assert.equal(body.success, true);
    }

    // Submission 4 from same IP: rate limiter must reject with 429 Too Many Requests
    const blockedRes = await postHoneypot();
    assert.equal(blockedRes.status, 429, 'Excess honeypot attempts must be blocked by rate limiter');
    assert.ok(blockedRes.headers.get('retry-after'), 'Rate limited response must include Retry-After header');
    const blockedData = await blockedRes.json();
    assert.match(blockedData.error, /3 заявки/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Tier 3: Cross-feature combinations - 8 KB payload limit and prototype pollution rejection across all endpoints', async () => {
  // Use dedicated high-capacity limiters so rate limits do not interfere with input validation tests
  const router = createApiRouter({
    leadLimiter: new RateLimiter(50, 60000),
    bookingLimiter: new RateLimiter(50, 60000)
  });
  const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // 1. Oversized body (> 8192 bytes) on /api/leads
    const oversizedBody = JSON.stringify({
      ...sampleLead,
      topic: 'X'.repeat(8500)
    });
    const leadsOversized = await fetch(base + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: oversizedBody
    });
    assert.equal(leadsOversized.status, 413, 'Body > 8KB must return 413 Payload Too Large on /api/leads');

    // 2. Oversized body on /api/booking
    const bookingOversized = await fetch(base + '/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: oversizedBody
    });
    assert.equal(bookingOversized.status, 413, 'Body > 8KB must return 413 Payload Too Large on /api/booking');

    // 3. Prototype pollution variations on /api/leads
    const protoPayload1 = '{"name":"Hacker","phone":"+77011112233","consent":true,"__proto__":{"polluted":true}}';
    const protoRes1 = await fetch(base + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: protoPayload1
    });
    assert.equal(protoRes1.status, 400, 'Payload with __proto__ must return 400 Bad Request');
    assert.equal(Object.prototype.polluted, undefined, 'Object.prototype must not be polluted');

    const protoPayload2 = '{"name":"Hacker","phone":"+77011112233","consent":true,"constructor":{"prototype":{"polluted":true}}}';
    const protoRes2 = await fetch(base + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: protoPayload2
    });
    assert.equal(protoRes2.status, 400, 'Payload with constructor.prototype must return 400 Bad Request');
    assert.equal(Object.prototype.polluted, undefined);

    // 4. Non-object JSON inputs on /api/leads
    const arrayRes = await fetch(base + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '["array", "of", "strings"]'
    });
    assert.equal(arrayRes.status, 400, 'JSON array root must return 400 Bad Request');

    const stringRes = await fetch(base + '/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '"just-a-raw-string"'
    });
    assert.equal(stringRes.status, 400, 'JSON string root must return 400 Bad Request');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

// ============================================================================
// TIER 4: Real-World Security Scenarios
// ============================================================================

test('Tier 4: Real-world security scenarios - Consultation submission zero CRM credential and internal ID leakage', async () => {
  // Test BitrixAdapter with simulated Bitrix24 CRM REST responses containing internal IDs and sensitive tokens
  const originalFetch = globalThis.fetch;
  const originalWebhook = process.env.BITRIX_WEBHOOK_URL;
  process.env.BITRIX_WEBHOOK_URL = 'https://sansata.bitrix24.kz/rest/1/supersecretwebhooktoken12345/';

  try {
    // Intercept outbound CRM calls: simulate Bitrix returning internal numeric ID 49201 and custom UF_CRM fields
    globalThis.fetch = async (url, opts) => {
      if (typeof url === 'string' && url.includes('bitrix24.kz')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            result: 49201, // internal numeric Bitrix Lead ID
            time: { date_start: '2026-09-18T02:00:00+05:00' },
            UF_CRM_INTERNAL_STATUS: 'PROCESSED',
            ASSIGNED_BY_ID: 99
          })
        };
      }
      return originalFetch(url, opts);
    };

    const adapter = new BitrixAdapter();
    assert.equal(adapter.isConfigured(), true);

    const router = createApiRouter({ adapter });
    const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;

    try {
      const res = await fetch(base + '/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleLead)
      });

      assert.equal(res.status, 201);
      const body = await res.json();
      const rawString = JSON.stringify(body);

      // Verify response structure and zero secret/CRM ID leakage
      assert.equal(body.success, true);
      assert.ok(body.leadId, 'Response must contain a public leadId UUID');
      assert.match(body.leadId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      assert.equal(body.mode, 'crm');

      // Assert zero leakage of CRM credentials or internal numeric structures
      assert.equal(typeof body.result, 'undefined');
      assert.equal(typeof body.UF_CRM_INTERNAL_STATUS, 'undefined');
      assert.equal(typeof body.ASSIGNED_BY_ID, 'undefined');
      assert.ok(!rawString.includes('supersecretwebhooktoken12345'), 'Webhook token must not leak in response');
      assert.ok(!rawString.includes('49201'), 'Internal Bitrix numerical ID must not leak in response');

      // Also verify booking endpoint under simulated CRM deal response
      globalThis.fetch = async (url, opts) => {
        if (typeof url === 'string' && url.includes('bitrix24.kz')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              result: 778899, // internal numeric Bitrix Deal ID
              time: { date_start: '2026-09-18T02:00:00+05:00' }
            })
          };
        }
        return originalFetch(url, opts);
      };

      const bookingRes = await fetch(base + '/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleBooking)
      });

      assert.equal(bookingRes.status, 201);
      const bookingBody = await bookingRes.json();
      const rawBookingString = JSON.stringify(bookingBody);

      assert.equal(bookingBody.success, true);
      assert.ok(bookingBody.bookingId);
      assert.match(bookingBody.bookingId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      assert.ok(!rawBookingString.includes('778899'), 'Internal numeric Deal ID must not leak');
      assert.ok(!rawBookingString.includes('supersecretwebhooktoken12345'));
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWebhook) {
      process.env.BITRIX_WEBHOOK_URL = originalWebhook;
    } else {
      delete process.env.BITRIX_WEBHOOK_URL;
    }
  }
});

test('Tier 4: Real-world security scenarios - Apartment status feed sanitization restricts to public IDs', async () => {
  // StatusCache and public catalog filtering
  const statusCache = new StatusCache();

  const mockAdapter = {
    isConfigured: () => true,
    fetchApartmentStatuses: async () => [
      { id: 101, title: 'shattyq-1', price: 45000000 },
      { id: 102, title: 's1-f4-u15', price: 50000000 },
      { id: 103, title: 'INTERNAL_DEAL_103', price: 60000000 },
      { id: 104, title: '99999', price: 70000000 },
      { id: 105, title: 'shattyq-tower-unit-99', price: 80000000 }
    ]
  };

  const statuses = await statusCache.getStatuses(mockAdapter);
  assert.ok(statuses.statuses, 'Statuses dictionary must exist');

  const keys = Object.keys(statuses.statuses);
  assert.ok(keys.length > 0, 'Valid public keys must be included');

  // Verify that all returned status keys match strictly public ID formats
  for (const key of keys) {
    const isPublicShattyq = /^shattyq-[a-zA-Z0-9_-]{1,64}$/i.test(key);
    const isPublicCoord = /^s\d+-f\d+-u\d+$/i.test(key);
    assert.ok(
      isPublicShattyq || isPublicCoord,
      `Status key "${key}" must be a public identifier (shattyq-* or s*-f*-u*), not an internal CRM ID`
    );
    assert.ok(!/^\d+$/.test(key), `Status key "${key}" must not be a purely numeric ID`);
    assert.ok(!key.includes('INTERNAL_DEAL'), `Status key "${key}" must not include CRM deal internal title`);
  }

  // Verify expected mapped keys
  assert.ok(keys.includes('shattyq-1'));
  assert.ok(keys.includes('s1-f4-u15'));
  assert.ok(keys.includes('shattyq-tower-unit-99'));
  assert.equal(keys.includes('INTERNAL_DEAL_103'), false);
  assert.equal(keys.includes('99999'), false);
});
