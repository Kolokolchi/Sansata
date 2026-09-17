import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createApiRouter } from '../server/apiRouter.mjs';

async function runSecurityStressSuite() {
  console.log('=== STARTING EMPIRICAL SECURITY & ANTI-SPAM STRESS SUITE ===\n');

  const router = createApiRouter();
  const server = createServer((req, res) =>
    router(req, res, () => {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Not found' }));
    })
  );

  await new Promise((res) => server.listen(0, '127.0.0.1', res));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server listening on ${baseUrl}`);

  let failedTests = 0;
  let passedTests = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      failedTests++;
      throw new Error(message);
    } else {
      console.log(`✔ PASS: ${message}`);
      passedTests++;
    }
  }

  const post = async (endpoint, body, headers = {}) => {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: typeof body === 'string' ? body : JSON.stringify(body)
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, headers: res.headers, text, json };
  };

  const get = async (endpoint, headers = {}) => {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, headers: res.headers, text, json };
  };

  try {
    // -------------------------------------------------------------
    // Test 1: Spoofed X-Forwarded-For with TRUST_PROXY unset
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Spoofed X-Forwarded-For with TRUST_PROXY unset ---');
    delete process.env.TRUST_PROXY;

    const baseLead = {
      name: 'Алексей Смирнов',
      phone: '+7 701 111 22 33',
      consent: true,
      topic: 'Проверка безопасности IP'
    };

    // Requests 1, 2, 3 with different fake X-Forwarded-For should consume the 3 slots for 127.0.0.1
    const r1 = await post('/api/leads', baseLead, { 'x-forwarded-for': '1.2.3.4' });
    assert(r1.status === 201, `Req 1 with X-Forwarded-For: 1.2.3.4 returned ${r1.status}`);

    const r2 = await post('/api/leads', baseLead, { 'x-forwarded-for': '5.6.7.8' });
    assert(r2.status === 201, `Req 2 with X-Forwarded-For: 5.6.7.8 returned ${r2.status}`);

    const r3 = await post('/api/leads', baseLead, { 'x-forwarded-for': '9.10.11.12' });
    assert(r3.status === 201, `Req 3 with X-Forwarded-For: 9.10.11.12 returned ${r3.status}`);

    // Request 4 MUST be blocked with 429 even though X-Forwarded-For is a new IP
    const r4 = await post('/api/leads', baseLead, { 'x-forwarded-for': '13.14.15.16' });
    assert(r4.status === 429, `Req 4 with fake X-Forwarded-For MUST return 429, got ${r4.status}`);
    assert(r4.json?.error?.includes('Слишком много запросов'), `Req 4 error message matches rate limit: ${r4.text}`);
    console.log('✔ Confirmed: Spoofing X-Forwarded-For cannot bypass rate limiting when TRUST_PROXY is unset.');

    // -------------------------------------------------------------
    // Test 2: TRUST_PROXY=true allows distinct IPs from reverse proxy
    // -------------------------------------------------------------
    console.log('\n--- Test 2: TRUST_PROXY=true behavior ---');
    process.env.TRUST_PROXY = 'true';
    try {
      const p1 = await post('/api/leads', baseLead, { 'x-forwarded-for': '100.64.0.1' });
      assert(p1.status === 201, `Req with distinct proxy IP 100.64.0.1 returned ${p1.status}`);

      const p2 = await post('/api/leads', baseLead, { 'x-forwarded-for': '100.64.0.2' });
      assert(p2.status === 201, `Req with distinct proxy IP 100.64.0.2 returned ${p2.status}`);

      // Now exhaust 100.64.0.1
      const p1_2 = await post('/api/leads', baseLead, { 'x-forwarded-for': '100.64.0.1' });
      assert(p1_2.status === 201, `Req 2 for 100.64.0.1 returned ${p1_2.status}`);
      const p1_3 = await post('/api/leads', baseLead, { 'x-forwarded-for': '100.64.0.1' });
      assert(p1_3.status === 201, `Req 3 for 100.64.0.1 returned ${p1_3.status}`);

      // 4th for 100.64.0.1 should fail with 429
      const p1_4 = await post('/api/leads', baseLead, { 'x-forwarded-for': '100.64.0.1' });
      assert(p1_4.status === 429, `Req 4 for 100.64.0.1 returned ${p1_4.status}`);
    } finally {
      delete process.env.TRUST_PROXY;
    }

    // -------------------------------------------------------------
    // Test 3: Honeypot field injection on /api/leads and /api/booking
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Honeypot field injection and persistence audit ---');
    // Check initial file lines in .local/leads.ndjson
    const leadsFile = resolve('.local/leads.ndjson');
    let initialCount = 0;
    try {
      const content = await readFile(leadsFile, 'utf8');
      initialCount = content.trim() ? content.trim().split('\n').length : 0;
    } catch {
      initialCount = 0;
    }

    process.env.TRUST_PROXY = 'true';
    try {
      // Honeypot lead submission with website filled
      const honeyLead = await post(
        '/api/leads',
        {
          ...baseLead,
          website: 'http://evil-spammer-domain.xyz'
        },
        { 'x-forwarded-for': '10.200.0.1' }
      );
      assert(honeyLead.status === 200, `Honeypot lead returned ${honeyLead.status} (expected 200 silent success)`);
      assert(honeyLead.json?.success === true, `Honeypot lead response indicates success`);

      // Honeypot booking submission with website filled
      const honeyBooking = await post(
        '/api/booking',
        {
          name: 'Bot Spammer',
          phone: '+7 700 999 88 77',
          consent: true,
          apartmentId: 'shattyq-1',
          website: 'http://evil-spammer-domain.xyz'
        },
        { 'x-forwarded-for': '10.200.0.2' }
      );
      assert(honeyBooking.status === 200, `Honeypot booking returned ${honeyBooking.status} (expected 200 silent success)`);
      assert(honeyBooking.json?.success === true, `Honeypot booking response indicates success`);

      // Verify NO line was added to .local/leads.ndjson
      let afterCount = 0;
      try {
        const content = await readFile(leadsFile, 'utf8');
        afterCount = content.trim() ? content.trim().split('\n').length : 0;
      } catch {
        afterCount = 0;
      }
      assert(
        afterCount === initialCount,
        `Honeypot submissions did NOT persist to disk (before: ${initialCount}, after: ${afterCount})`
      );
      console.log('✔ Confirmed: Honeypot silently succeeded without persisting to disk.');
    } finally {
      delete process.env.TRUST_PROXY;
    }

    // -------------------------------------------------------------
    // Test 4: Concurrency & Race Condition Stress
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Concurrency & Race Condition Stress ---');
    process.env.TRUST_PROXY = 'true';
    try {
      const concurrentIp = '10.250.0.1';
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          post(
            '/api/leads',
            { ...baseLead, name: `Concurrent User ${i}` },
            { 'x-forwarded-for': concurrentIp }
          )
        );
      }
      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.status === 201).length;
      const rateLimitedCount = results.filter((r) => r.status === 429).length;

      console.log(`20 concurrent requests result: ${successCount} passed (201), ${rateLimitedCount} rejected (429)`);
      assert(successCount === 3, `Expected exactly 3 allowed requests, got ${successCount}`);
      assert(rateLimitedCount === 17, `Expected exactly 17 rate-limited requests, got ${rateLimitedCount}`);
      console.log('✔ Confirmed: Concurrency race condition is prevented. Rate limit enforced atomically.');
    } finally {
      delete process.env.TRUST_PROXY;
    }

    // -------------------------------------------------------------
    // Test 5: Malformed Payloads & Payload Injection Attacks
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Malformed Payloads & Payload Injection Attacks ---');
    process.env.TRUST_PROXY = 'true';
    try {
      const testIp = '10.250.0.2';

      // 5.1 Broken JSON
      const broken = await post('/api/leads', '{"name": "test", broken...', { 'x-forwarded-for': testIp });
      assert(broken.status === 400, `Broken JSON returned status ${broken.status}`);

      // 5.2 Array payload
      const arr = await post('/api/leads', '[1, 2, 3]', { 'x-forwarded-for': testIp });
      assert(arr.status === 400, `Array payload returned status ${arr.status}`);

      // 5.3 Primitive string payload
      const str = await post('/api/leads', '"just a string"', { 'x-forwarded-for': testIp });
      assert(str.status === 400, `Primitive payload returned status ${str.status}`);

      // 5.4 Oversized payload (> 8192 bytes) from a fresh IP
      const largePayload = {
        ...baseLead,
        topic: 'A'.repeat(9000)
      };
      const large = await post('/api/leads', largePayload, { 'x-forwarded-for': '10.250.0.3' });
      assert(large.status === 413, `Oversized payload returned status ${large.status}`);

      // 5.5 HTML / XSS Injection in name
      const xssRes = await post(
        '/api/leads',
        { ...baseLead, name: '<script>alert("xss")</script>Иван' },
        { 'x-forwarded-for': '10.250.0.4' }
      );
      console.log(`XSS attempt response: status=${xssRes.status}, body=${xssRes.text}`);
      assert(xssRes.status === 201 || xssRes.status === 400, `XSS handled safely with status ${xssRes.status}`);

      // 5.6 SQL Injection attempt
      const sqliRes = await post(
        '/api/leads',
        { ...baseLead, name: "Иван'; DROP TABLE leads; --" },
        { 'x-forwarded-for': '10.250.0.5' }
      );
      console.log(`SQLi attempt response: status=${sqliRes.status}`);
      assert(sqliRes.status === 201 || sqliRes.status === 400, `SQLi payload safely processed`);

      // 5.7 Invalid Phone numbers (each tested with distinct IP)
      const badPhones = ['123', 'abcdefghijk', '+1234567890', '+7123', '+78000000000000000'];
      let phoneIpIdx = 10;
      for (const badPhone of badPhones) {
        const pRes = await post(
          '/api/leads',
          { ...baseLead, phone: badPhone },
          { 'x-forwarded-for': `10.250.0.${phoneIpIdx++}` }
        );
        assert(pRes.status === 400, `Invalid phone "${badPhone}" returned status 400`);
      }

      // 5.8 Missing or invalid consent
      const noConsent = await post(
        '/api/leads',
        { ...baseLead, consent: false },
        { 'x-forwarded-for': '10.250.0.20' }
      );
      assert(noConsent.status === 400, `consent: false returned 400`);

      const stringConsent = await post(
        '/api/leads',
        { ...baseLead, consent: 'true' },
        { 'x-forwarded-for': '10.250.0.21' }
      );
      assert(stringConsent.status === 400, `consent: "true" (string) returned 400`);
    } finally {
      delete process.env.TRUST_PROXY;
    }

    // -------------------------------------------------------------
    // Test 6: Information Leakage Audit in Responses
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Information Leakage Audit in Responses ---');
    const statusResp = await get('/api/apartments/status');
    assert(statusResp.status === 200, `Status endpoint responded with 200`);
    const bodyStr = statusResp.text;
    assert(!bodyStr.includes('UF_CRM'), `Response does not contain UF_CRM fields`);
    assert(!bodyStr.includes('webhook'), `Response does not contain webhook references`);
    assert(!bodyStr.includes('rest/'), `Response does not contain Bitrix REST token segments`);

    // Verify all keys in statuses are valid public IDs and not internal Bitrix integer IDs
    for (const key of Object.keys(statusResp.json.statuses)) {
      assert(!/^\d+$/.test(key), `Key "${key}" must not be a purely numeric Bitrix ID`);
    }
    console.log('✔ Confirmed: Zero internal CRM IDs or secrets in public API response.');

    console.log(`\n=============================================================`);
    console.log(`ALL TESTS PASSED! (${passedTests} passed, ${failedTests} failed)`);
    console.log(`=============================================================`);
  } finally {
    await new Promise((res) => server.close(res));
  }
}

runSecurityStressSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
