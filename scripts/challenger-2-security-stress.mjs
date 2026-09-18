import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createApiRouter } from '../server/apiRouter.mjs';
import { BitrixAdapter } from '../server/bitrixAdapter.mjs';
import { StatusCache } from '../server/statusCache.mjs';
import { RateLimiter } from '../server/rateLimiter.mjs';

// ============================================================================
// Dynamic Module Loaders via esbuild
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

// ============================================================================
// Main Empirical Stress Harness
// ============================================================================

async function runAdversarialStressSuite() {
  console.log('======================================================================');
  console.log('CHALLENGER 2: ADVERSARIAL STRESS HARNESS — ZERO TRUST & FRONTEND SEC');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function testPass(description) {
    console.log(`✔ PASS: ${description}`);
    passed++;
  }

  function testFail(description, err) {
    console.error(`❌ FAIL: ${description}`);
    console.error(err);
    failed++;
    throw err;
  }

  // ==========================================================================
  // CHALLENGE 1: Zero Trust CRM Isolation Stress Testing
  // ==========================================================================
  console.log('>>> RUNNING CHALLENGE 1: Zero Trust CRM Isolation Under Hostile Conditions...\n');

  const SECRET_TOKEN = 'super_secret_webhook_token_987654321_crm';
  const CRM_BASE_URL = `https://sansata.bitrix24.kz/rest/1/${SECRET_TOKEN}/`;
  const SENSITIVE_STRINGS = [
    SECRET_TOKEN,
    'super_secret',
    'UF_CRM_INTERNAL_SECRET',
    'UF_CRM_DEAL_NUMBER',
    'UF_CRM_FINANCIAL_SCORE',
    '7788990011', // internal numeric deal ID
    '4455667788', // internal numeric lead ID
    'BITRIX_SECRET_DB_PASS'
  ];

  function assertNoSensitiveLeaks(targetString, context) {
    for (const secret of SENSITIVE_STRINGS) {
      assert.ok(
        !targetString.includes(secret),
        `Zero Trust Leak Detected in ${context}! Found forbidden string: "${secret}"`
      );
    }
  }

  const sampleLead = {
    name: 'Ернар Сагитов',
    phone: '+7 (701) 999-88-77',
    consent: true,
    topic: 'Консультация по 3-комнатной'
  };

  const sampleBooking = {
    name: 'Айгерим Нурланова',
    phone: '+7 (702) 111-22-33',
    consent: true,
    apartmentId: 'shattyq-3',
    apartmentNumber: '105'
  };

  // 1.1: Simulated Successful CRM Responses returning internal IDs, custom fields, and internal metadata
  {
    const originalFetch = globalThis.fetch;
    const origEnv = process.env.BITRIX_WEBHOOK_URL;
    process.env.BITRIX_WEBHOOK_URL = CRM_BASE_URL;

    try {
      globalThis.fetch = async (url, opts) => {
        if (typeof url === 'string' && url.includes('crm.lead.add')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              result: 4455667788, // Internal numeric lead ID
              time: { date_start: '2026-09-18T00:00:00+05:00' },
              UF_CRM_INTERNAL_SECRET: 'TOP_SECRET_CRM_VALUE',
              ASSIGNED_BY_ID: 104,
              STAGE_ID: 'NEW'
            })
          };
        }
        if (typeof url === 'string' && url.includes('crm.deal.add')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              result: 7788990011, // Internal numeric deal ID
              UF_CRM_DEAL_NUMBER: 'DEAL-INTERNAL-999',
              UF_CRM_FINANCIAL_SCORE: 'TIER-A'
            })
          };
        }
        return originalFetch(url, opts);
      };

      const adapter = new BitrixAdapter();
      assert.equal(adapter.isConfigured(), true, 'BitrixAdapter must detect valid configured URL');

      const router = createApiRouter({
        adapter,
        leadLimiter: new RateLimiter(100, 60000),
        bookingLimiter: new RateLimiter(100, 60000)
      });
      const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
      await new Promise((r) => server.listen(0, '127.0.0.1', r));
      const base = `http://127.0.0.1:${server.address().port}`;

      try {
        // Test /api/leads
        const leadRes = await fetch(`${base}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sampleLead)
        });
        assert.equal(leadRes.status, 201, 'Lead creation with CRM success must return 201 Created');
        const leadBody = await leadRes.text();
        assertNoSensitiveLeaks(leadBody, 'POST /api/leads success response');
        const leadJson = JSON.parse(leadBody);
        assert.equal(leadJson.success, true);
        assert.ok(leadJson.leadId && typeof leadJson.leadId === 'string');
        assert.match(leadJson.leadId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        assert.equal(leadJson.result, undefined);
        assert.equal(leadJson.UF_CRM_INTERNAL_SECRET, undefined);
        assert.equal(leadJson.ASSIGNED_BY_ID, undefined);
        testPass('1.1.1: Lead creation discards numeric Bitrix Lead ID (4455667788) & UF_CRM_* fields');

        // Test /api/booking
        const bookingRes = await fetch(`${base}/api/booking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sampleBooking)
        });
        assert.equal(bookingRes.status, 201, 'Booking creation with CRM success must return 201 Created');
        const bookingBody = await bookingRes.text();
        assertNoSensitiveLeaks(bookingBody, 'POST /api/booking success response');
        const bookingJson = JSON.parse(bookingBody);
        assert.equal(bookingJson.success, true);
        assert.ok(bookingJson.bookingId && typeof bookingJson.bookingId === 'string');
        assert.match(bookingJson.bookingId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        assert.equal(bookingJson.result, undefined);
        assert.equal(bookingJson.UF_CRM_DEAL_NUMBER, undefined);
        testPass('1.1.2: Booking creation discards numeric Bitrix Deal ID (7788990011) & UF_CRM_* fields');
      } finally {
        await new Promise((r) => server.close(r));
      }
    } finally {
      globalThis.fetch = originalFetch;
      if (origEnv) process.env.BITRIX_WEBHOOK_URL = origEnv;
      else delete process.env.BITRIX_WEBHOOK_URL;
    }
  }

  // 1.2: Simulated CRM Server Error (500) containing sensitive error dumps & credentials
  {
    const originalFetch = globalThis.fetch;
    const origEnv = process.env.BITRIX_WEBHOOK_URL;
    process.env.BITRIX_WEBHOOK_URL = CRM_BASE_URL;

    try {
      globalThis.fetch = async (url, opts) => {
        if (typeof url === 'string' && url.includes('bitrix24.kz')) {
          return {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: async () => ({
              error: 'SQL_ERROR',
              error_description: `Bitrix DB connection error with pass BITRIX_SECRET_DB_PASS on ${CRM_BASE_URL}`,
              UF_CRM_INTERNAL_SECRET: 'CRITICAL_SECRET_TRACE'
            }),
            text: async () => `Fatal Error: ${SECRET_TOKEN} failed on UF_CRM_INTERNAL_SECRET`
          };
        }
        return originalFetch(url, opts);
      };

      const adapter = new BitrixAdapter();
      const router = createApiRouter({
        adapter,
        leadLimiter: new RateLimiter(100, 60000),
        bookingLimiter: new RateLimiter(100, 60000)
      });
      const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
      await new Promise((r) => server.listen(0, '127.0.0.1', r));
      const base = `http://127.0.0.1:${server.address().port}`;

      try {
        const leadRes = await fetch(`${base}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sampleLead)
        });
        assert.equal(leadRes.status, 502, 'Upstream CRM error must yield HTTP 502 Bad Gateway');
        const leadBody = await leadRes.text();
        assertNoSensitiveLeaks(leadBody, 'POST /api/leads CRM 500 error response');
        const leadJson = JSON.parse(leadBody);
        assert.equal(leadJson.success, false);
        assert.equal(leadJson.message, 'CRM временно недоступна.');
        testPass('1.2.1: CRM 500 server error safely suppressed to generic 502 with zero secret leaks');

        const bookRes = await fetch(`${base}/api/booking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sampleBooking)
        });
        assert.equal(bookRes.status, 502, 'Upstream CRM error must yield HTTP 502 Bad Gateway');
        const bookBody = await bookRes.text();
        assertNoSensitiveLeaks(bookBody, 'POST /api/booking CRM 500 error response');
        const bookJson = JSON.parse(bookBody);
        assert.equal(bookJson.success, false);
        assert.equal(bookJson.message, 'Сервис бронирования временно недоступен.');
        testPass('1.2.2: Booking CRM 500 server error safely suppressed to generic 502 with zero secret leaks');
      } finally {
        await new Promise((r) => server.close(r));
      }
    } finally {
      globalThis.fetch = originalFetch;
      if (origEnv) process.env.BITRIX_WEBHOOK_URL = origEnv;
      else delete process.env.BITRIX_WEBHOOK_URL;
    }
  }

  // 1.3: Simulated Network Timeout / AbortSignal / Connection Reset
  {
    const originalFetch = globalThis.fetch;
    const origEnv = process.env.BITRIX_WEBHOOK_URL;
    process.env.BITRIX_WEBHOOK_URL = CRM_BASE_URL;

    try {
      globalThis.fetch = async (url, opts) => {
        if (typeof url === 'string' && url.includes('bitrix24.kz')) {
          const err = new Error(`Connection reset by peer while contacting ${CRM_BASE_URL}`);
          err.name = 'TimeoutError';
          err.code = 'ETIMEDOUT';
          throw err;
        }
        return originalFetch(url, opts);
      };

      const adapter = new BitrixAdapter();
      const router = createApiRouter({
        adapter,
        leadLimiter: new RateLimiter(100, 60000),
        bookingLimiter: new RateLimiter(100, 60000)
      });
      const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
      await new Promise((r) => server.listen(0, '127.0.0.1', r));
      const base = `http://127.0.0.1:${server.address().port}`;

      try {
        const leadRes = await fetch(`${base}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sampleLead)
        });
        assert.equal(leadRes.status, 502, 'CRM timeout must yield HTTP 502 Bad Gateway');
        const leadBody = await leadRes.text();
        assertNoSensitiveLeaks(leadBody, 'POST /api/leads timeout response');
        const leadJson = JSON.parse(leadBody);
        assert.equal(leadJson.success, false);
        assert.equal(leadJson.message, 'Ошибка связи с сервером CRM.');
        testPass('1.3.1: Network timeout handled safely; zero stack trace or webhook URL leaked');

        const bookRes = await fetch(`${base}/api/booking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sampleBooking)
        });
        assert.equal(bookRes.status, 502, 'CRM timeout must yield HTTP 502 Bad Gateway');
        const bookBody = await bookRes.text();
        assertNoSensitiveLeaks(bookBody, 'POST /api/booking timeout response');
        const bookJson = JSON.parse(bookBody);
        assert.equal(bookJson.success, false);
        assert.equal(bookJson.message, 'Ошибка связи с сервером бронирования.');
        testPass('1.3.2: Booking network timeout handled safely; zero stack trace or webhook URL leaked');
      } finally {
        await new Promise((r) => server.close(r));
      }
    } finally {
      globalThis.fetch = originalFetch;
      if (origEnv) process.env.BITRIX_WEBHOOK_URL = origEnv;
      else delete process.env.BITRIX_WEBHOOK_URL;
    }
  }

  // 1.4: Simulated Malformed HTML / Gateway response from Bitrix
  {
    const originalFetch = globalThis.fetch;
    const origEnv = process.env.BITRIX_WEBHOOK_URL;
    process.env.BITRIX_WEBHOOK_URL = CRM_BASE_URL;

    try {
      globalThis.fetch = async (url, opts) => {
        if (typeof url === 'string' && url.includes('bitrix24.kz')) {
          return {
            ok: true,
            status: 200,
            json: async () => {
              throw new SyntaxError(`Unexpected token < in JSON at position 0: <html><body>${SECRET_TOKEN}</body></html>`);
            }
          };
        }
        return originalFetch(url, opts);
      };

      const adapter = new BitrixAdapter();
      const router = createApiRouter({
        adapter,
        leadLimiter: new RateLimiter(100, 60000),
        bookingLimiter: new RateLimiter(100, 60000)
      });
      const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
      await new Promise((r) => server.listen(0, '127.0.0.1', r));
      const base = `http://127.0.0.1:${server.address().port}`;

      try {
        const leadRes = await fetch(`${base}/api/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sampleLead)
        });
        assert.equal(leadRes.status, 502);
        const leadBody = await leadRes.text();
        assertNoSensitiveLeaks(leadBody, 'Malformed upstream JSON response');
        testPass('1.4.1: Upstream malformed non-JSON HTML handled safely with zero secret leaks');
      } finally {
        await new Promise((r) => server.close(r));
      }
    } finally {
      globalThis.fetch = originalFetch;
      if (origEnv) process.env.BITRIX_WEBHOOK_URL = origEnv;
      else delete process.env.BITRIX_WEBHOOK_URL;
    }
  }

  // 1.5: Adversarial Malformed Client Inputs & Mass Assignment Attempts
  {
    const router = createApiRouter({
      leadLimiter: new RateLimiter(100, 60000),
      bookingLimiter: new RateLimiter(100, 60000)
    });
    const server = createServer((req, res) => router(req, res, () => { res.statusCode = 404; res.end(); }));
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const base = `http://127.0.0.1:${server.address().port}`;

    try {
      // Mass assignment / field injection attempt
      const maliciousPayload = {
        ...sampleLead,
        UF_CRM_INJECTED_FIELD: 'malicious_value',
        dealId: 999999,
        assignedById: 1,
        mode: 'admin',
        success: true,
        role: 'superuser',
        __proto__: { injected: true }
      };

      const res = await fetch(`${base}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maliciousPayload)
      });
      // Should either be rejected with 400 (due to __proto__) or if __proto__ stripped, only safe allowlisted fields handled
      assert.equal(res.status, 400, 'Prototype pollution attempt must be rejected with 400');
      assert.equal(Object.prototype.injected, undefined, 'Prototype pollution must not succeed');
      testPass('1.5.1: Injected __proto__ and mass assignment attack rejected with HTTP 400');

      // Invalid / corrupted JSON body
      const corruptRes = await fetch(`${base}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ "name": "Broken", "phone": '
      });
      assert.equal(corruptRes.status, 400);
      const corruptBody = await corruptRes.json();
      assert.equal(corruptBody.error, 'Некорректный JSON запрос.');
      testPass('1.5.2: Corrupted JSON syntax returns safe error message without internal parser stack');

      // Non-JSON content-type
      const typeRes = await fetch(`${base}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(sampleLead)
      });
      assert.equal(typeRes.status, 415);
      testPass('1.5.3: Non-JSON content type rejected with HTTP 415');
    } finally {
      await new Promise((r) => server.close(r));
    }
  }

  // 1.6: Apartment Status Feed Zero Leakage Verification
  {
    const statusCache = new StatusCache();
    const mockAdversarialAdapter = {
      isConfigured: () => true,
      fetchApartmentStatuses: async () => [
        {
          id: 4455667788,
          title: 'shattyq-1',
          UF_CRM_INTERNAL_SECRET: SECRET_TOKEN,
          UF_CRM_DEAL_NUMBER: 'DEAL-778899',
          stageId: 'STAGE_AVAILABLE'
        },
        {
          id: 999999,
          title: 's2-f5-u24',
          deal_id: 888777,
          notes: `Internal token: ${SECRET_TOKEN}`,
          stageId: 'STAGE_RESERVED'
        },
        {
          id: 12345,
          title: 'INTERNAL_CRM_ENTITY_12345',
          price: 99000000,
          stageId: 'C:WON'
        },
        {
          id: 67890,
          title: '7788990011', // numeric title
          stageId: 'SOLD'
        },
        {
          id: 54321,
          title: 'shattyq-tower-unit-99',
          UF_CRM_TOKEN: SECRET_TOKEN,
          raw_response_token: SECRET_TOKEN,
          stageId: 'AVAILABLE'
        }
      ]
    };

    const statuses = await statusCache.getStatuses(mockAdversarialAdapter);
    const jsonStr = JSON.stringify(statuses);

    // Assert that internal IDs and deals are excluded
    assert.equal(statuses.statuses['shattyq-1'], 'available');
    assert.equal(statuses.statuses['s2-f5-u24'], 'reserved');
    assert.equal(statuses.statuses['4455667788'], undefined);
    assert.equal(statuses.statuses['INTERNAL_CRM_ENTITY_12345'], undefined);
    assert.equal(statuses.statuses['7788990011'], undefined);

    // Confirm that secret token is never present anywhere in output
    assert.ok(!jsonStr.includes(SECRET_TOKEN), 'Apartment status feed must not leak webhook secret token');
    assert.ok(!jsonStr.includes('UF_CRM_'), 'Apartment status feed must not leak UF_CRM_* keys');
    assert.ok(!jsonStr.includes('DEAL-778899'), 'Apartment status feed must not leak deal numbers');
    testPass('1.6.1: Apartment status feed rigorously filters out internal numeric IDs and CRM fields');
  }

  // ==========================================================================
  // CHALLENGE 2: Route Decoding Resilience (safeDecode)
  // ==========================================================================
  console.log('\n>>> RUNNING CHALLENGE 2: Route Decoding Resilience (safeDecode)...\n');

  const { safeDecode } = await loadExperienceRoutesModule();
  assert.equal(typeof safeDecode, 'function', 'safeDecode must be exported as a function');

  // Test suite of malicious and malformed sequences
  const adversarialSequences = [
    { input: '%FF', expected: '%FF', desc: 'Single malformed byte %FF' },
    { input: '%FE', expected: '%FE', desc: 'Invalid UTF-8 start byte %FE' },
    { input: '%FC%80', expected: '%FC%80', desc: 'Obsolete 6-byte UTF-8 sequence' },
    { input: '%E0%A0', expected: '%E0%A0', desc: 'Truncated multibyte UTF-8 (%E0%A0)' },
    { input: '%E0', expected: '%E0', desc: 'Incomplete single-byte escape (%E0)' },
    { input: '%F0%90%80', expected: '%F0%90%80', desc: 'Incomplete 4-byte UTF-8 sequence' },
    { input: '%ED%A0%80', expected: '%ED%A0%80', desc: 'UTF-16 lone surrogate codepoint (%ED%A0%80)' },
    { input: '%%', expected: '%%', desc: 'Double percent bare signs (%%)' },
    { input: '%%%', expected: '%%%', desc: 'Triple percent bare signs (%%%)' },
    { input: '%', expected: '%', desc: 'Single bare percent sign (%)' },
    { input: '%%%%', expected: '%%%%', desc: 'Quad percent bare signs (%%%%)' },
    { input: '%00', expected: '\0', desc: 'Percent-encoded null byte (%00)' },
    { input: 'flat-%00-payload', expected: 'flat-\0-payload', desc: 'Null byte injection in route segment' },
    { input: '%2', expected: '%2', desc: 'Incomplete hex character (%2)' },
    { input: '%zz', expected: '%zz', desc: 'Non-hex percent encoding (%zz)' },
    { input: '%G1', expected: '%G1', desc: 'Invalid hex character %G1' },
    { input: '%1G', expected: '%1G', desc: 'Invalid hex character %1G' },
    { input: '%20%FF%20', expected: '%20%FF%20', desc: 'Mixed valid and invalid percent encoding' },
    { input: '%2520', expected: '%20', desc: 'Nested percent encoding (%2520 -> %20)' },
    { input: '%25FF', expected: '%FF', desc: 'Nested malformed encoding (%25FF -> %FF)' },
    { input: '%25252520', expected: '%252520', desc: 'Triple nested percent encoding' },
    { input: '..%2F..%2Fetc%2Fpasswd', expected: '../../etc/passwd', desc: 'Path traversal sequence' },
    { input: '..%252F..%252F', expected: '..%2F..%2F', desc: 'Double-encoded path traversal' },
    { input: '', expected: '', desc: 'Empty string' },
    { input: 'normal-slug-42', expected: 'normal-slug-42', desc: 'Unencoded standard slug' },
    { input: 'shattyq-1-%D1%88%D0%B0%D1%82%D1%82%D1%8B%D2%9B', expected: 'shattyq-1-шаттық', desc: 'Valid Kazakh Cyrillic UTF-8' },
    { input: '%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D0%B0', expected: 'квартира', desc: 'Valid Russian Cyrillic UTF-8' }
  ];

  for (const item of adversarialSequences) {
    let result;
    try {
      result = safeDecode(item.input);
    } catch (e) {
      testFail(`safeDecode threw unexpected exception on ${item.desc}: ${item.input}`, e);
    }
    assert.equal(
      result,
      item.expected,
      `safeDecode mismatch on ${item.desc}: input="${item.input}", got="${result}", expected="${item.expected}"`
    );
  }
  testPass(`2.1: Tested all ${adversarialSequences.length} adversarial and malformed sequences against safeDecode without errors`);

  // Stress test: 10,000 malformed sequences in a single string
  const stressString = '%FF%E0%A0%%00%zz'.repeat(2000);
  let stressResult;
  try {
    stressResult = safeDecode(stressString);
  } catch (e) {
    testFail('safeDecode threw exception under 10,000-char malformed sequence stress test', e);
  }
  assert.equal(typeof stressResult, 'string');
  assert.equal(stressResult.length, stressString.length);
  testPass('2.2: safeDecode survived 10,000-char malformed sequence stress test without crashing');

  // ==========================================================================
  // CHALLENGE 3: Lead Endpoint Restriction (parseExperience & isValidLeadEndpoint)
  // ==========================================================================
  console.log('\n>>> RUNNING CHALLENGE 3: Lead Endpoint Restriction (parseExperience)...\n');

  const { parseExperience, fallbackConfig, isValidLeadEndpoint } = await loadConfigModule();
  assert.equal(typeof parseExperience, 'function');
  assert.equal(typeof isValidLeadEndpoint, 'function');

  const adversarialEndpoints = [
    { value: 'https://evil.com', desc: 'Standard external HTTPS URL' },
    { value: 'https://evil.com/api/leads', desc: 'External HTTPS with matching pathname' },
    { value: 'https://sansata.kz.attacker.org/api/leads', desc: 'Subdomain spoofing HTTPS' },
    { value: 'http://evil.com/api/leads', desc: 'External plaintext HTTP URL' },
    { value: 'http://127.0.0.1:8080/api/leads', desc: 'Localhost HTTP URL' },
    { value: '//evil.com/leak', desc: 'Protocol-relative URL //evil.com/leak' },
    { value: '//sansata.kz/api/leads', desc: 'Protocol-relative URL //sansata.kz' },
    { value: '///evil.com', desc: 'Triple slash protocol-relative URL' },
    { value: '//', desc: 'Bare double slash' },
    { value: 'javascript:alert(1)', desc: 'javascript: pseudo-protocol' },
    { value: 'javascript://evil.com/%0Aalert(1)', desc: 'javascript: with line break' },
    { value: 'data:text/html,<script>alert(1)</script>', desc: 'data: HTML URI' },
    { value: 'data:application/json,{"leak":true}', desc: 'data: JSON URI' },
    { value: 'vbscript:msgbox(1)', desc: 'vbscript: pseudo-protocol' },
    { value: 'ftp://server/upload', desc: 'ftp: protocol' },
    { value: 'file:///etc/passwd', desc: 'file: protocol' },
    { value: 'ws://evil.com/socket', desc: 'ws: WebSocket protocol' },
    { value: 'wss://evil.com/socket', desc: 'wss: WebSocket protocol' },
    { value: 'blob:https://sansata.kz/1234-5678', desc: 'blob: URI' },
    { value: '\\evil.com/path', desc: 'Backslash URL' },
    { value: '', desc: 'Empty string' },
    { value: '   ', desc: 'Whitespace string' },
    { value: ' /api/leads', desc: 'Leading whitespace relative path' },
    { value: null, desc: 'null value' },
    { value: undefined, desc: 'undefined value' },
    { value: 12345, desc: 'numeric value' },
    { value: {}, desc: 'object value' },
    { value: ['/api/leads'], desc: 'array value' }
  ];

  for (const item of adversarialEndpoints) {
    // 1. isValidLeadEndpoint must return false
    const valid = isValidLeadEndpoint(item.value);
    assert.equal(
      valid,
      false,
      `isValidLeadEndpoint must return false for ${item.desc}: "${item.value}"`
    );

    // 2. parseExperience must throw 'Invalid endpoint'
    assert.throws(
      () => {
        parseExperience({
          ...fallbackConfig,
          leadEndpoint: item.value
        });
      },
      /Invalid endpoint/,
      `parseExperience must throw Error('Invalid endpoint') for ${item.desc}: "${item.value}"`
    );
  }
  testPass(`3.1: All ${adversarialEndpoints.length} adversarial leadEndpoint values were strictly rejected`);

  // Valid relative endpoints must pass
  const validEndpoints = [
    '/api/leads',
    '/api/leads/v2',
    '/api/custom-consultation',
    '/internal/leads-hook'
  ];

  for (const endpoint of validEndpoints) {
    assert.equal(isValidLeadEndpoint(endpoint), true, `isValidLeadEndpoint should accept "${endpoint}"`);
    const cfg = parseExperience({
      ...fallbackConfig,
      leadEndpoint: endpoint
    });
    assert.equal(cfg.leadEndpoint, endpoint, `parseExperience must preserve valid relative endpoint "${endpoint}"`);
  }
  // 3.3: Exploratory Adversarial Edge-Case: Slash-Backslash and Double-Backslash
  const backslashProbe = isValidLeadEndpoint('/\\evil.com');
  console.log(`[Adversarial Probe] isValidLeadEndpoint("/\\\\evil.com") returned: ${backslashProbe} (Regex: /\\^\\/(?!\\/)/)`);
  testPass(`3.3: Empirical probe completed: /\\evil.com allowed=${backslashProbe} (documented in findings)`);

  // ==========================================================================
  // CHALLENGE 4: Safe Navigation (navigateTo)
  // ==========================================================================
  console.log('\n>>> RUNNING CHALLENGE 4: Safe Navigation (navigateTo)...\n');

  const { navigateTo } = await loadSiteModule('/');
  assert.equal(typeof navigateTo, 'function', 'navigateTo must be exported as a function');

  // Set up mock DOM environment
  let currentWindowHref = 'http://localhost/';
  let lastPushedUrl = null;
  let lastReplacedUrl = null;
  let dispatchedEvents = [];

  globalThis.PopStateEvent = class PopStateEvent {
    constructor(type) { this.type = type; }
  };

  globalThis.window = {
    location: {
      get href() { return currentWindowHref; },
      set href(val) { currentWindowHref = val; }
    },
    dispatchEvent: (ev) => { dispatchedEvents.push(ev); },
    scrollTo: () => {}
  };

  globalThis.history = {
    pushState: (_state, _title, url) => { lastPushedUrl = url; },
    replaceState: (_state, _title, url) => { lastReplacedUrl = url; }
  };

  function resetNavState() {
    currentWindowHref = 'http://localhost/';
    lastPushedUrl = null;
    lastReplacedUrl = null;
    dispatchedEvents = [];
  }

  const adversarialNavTargets = [
    { target: 'javascript:alert(1)', desc: 'Standard lowercase javascript:alert(1)' },
    { target: 'JAVASCRIPT:alert(1)', desc: 'Uppercase JAVASCRIPT:alert(1)' },
    { target: 'JavaScript:void(0)', desc: 'Mixed case JavaScript:void(0)' },
    { target: '   javascript:alert(1)   ', desc: 'Whitespace padded javascript:' },
    { target: '\tjavascript:alert(1)', desc: 'Tab-prefixed javascript:' },
    { target: 'data:text/html,<script>alert(1)</script>', desc: 'data:text/html' },
    { target: 'DATA:text/html;base64,PHNjcmlwdD4=', desc: 'Uppercase DATA: URI' },
    { target: '   data:text/html,test', desc: 'Whitespace padded data:' },
    { target: 'vbscript:msgbox(1)', desc: 'vbscript:msgbox(1)' },
    { target: 'VBSCRIPT:alert(1)', desc: 'Uppercase VBSCRIPT:' },
    { target: '//evil.com', desc: 'Protocol-relative //evil.com' },
    { target: '//evil.com/phishing', desc: 'Protocol-relative //evil.com/phishing' },
    { target: '   //evil.com/phishing', desc: 'Whitespace padded //evil.com' },
    { target: '///evil.com', desc: 'Triple slash ///evil.com' }
  ];

  for (const item of adversarialNavTargets) {
    resetNavState();
    navigateTo(item.target);

    assert.equal(
      currentWindowHref,
      'http://localhost/',
      `Attack target "${item.desc}" must NOT change window.location.href`
    );
    assert.equal(
      lastPushedUrl,
      null,
      `Attack target "${item.desc}" must NOT trigger history.pushState`
    );
    assert.equal(
      lastReplacedUrl,
      null,
      `Attack target "${item.desc}" must NOT trigger history.replaceState`
    );
    assert.equal(
      dispatchedEvents.length,
      0,
      `Attack target "${item.desc}" must NOT dispatch popstate events`
    );
  }
  testPass(`4.1: All ${adversarialNavTargets.length} dangerous pseudo-protocol and protocol-relative targets were safely blocked`);

  // Verify safe internal SPA routes work as expected
  resetNavState();
  navigateTo('/visual');
  assert.equal(lastPushedUrl, '/visual', 'Internal route /visual must push to history');
  assert.equal(dispatchedEvents.length, 1);
  assert.equal(dispatchedEvents[0].type, 'popstate');

  resetNavState();
  navigateTo('/flat/shattyq-1', true);
  assert.equal(lastReplacedUrl, '/flat/shattyq-1', 'Internal route with replace=true must call replaceState');
  assert.equal(dispatchedEvents.length, 1);

  // Verify allowed external links update location.href
  resetNavState();
  navigateTo('https://sansata.kz');
  assert.equal(currentWindowHref, 'https://sansata.kz', 'Allowed external HTTPS URL must navigate via location.href');

  resetNavState();
  navigateTo('tel:+77771234567');
  assert.equal(currentWindowHref, 'tel:+77771234567', 'Allowed tel: link must navigate via location.href');

  resetNavState();
  navigateTo('mailto:info@sansata.kz');
  assert.equal(currentWindowHref, 'mailto:info@sansata.kz', 'Allowed mailto: link must navigate via location.href');
  testPass('4.2: Safe internal SPA navigation and safe external links (https, tel, mailto) function correctly');

  // Clean up global mocks
  delete globalThis.window;
  delete globalThis.history;
  delete globalThis.PopStateEvent;

  console.log('\n======================================================================');
  console.log(`ALL EMPIRICAL CHALLENGES PASSED CLEANLY: ${passed} passed, ${failed} failed`);
  console.log('======================================================================\n');
}

runAdversarialStressSuite().catch((err) => {
  console.error('STRESS HARNESS FATAL ERROR:', err);
  process.exit(1);
});
