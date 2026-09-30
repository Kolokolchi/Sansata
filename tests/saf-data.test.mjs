import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('SAF public plan snapshot exposes only verified layout fields', async () => {
  const snapshot = JSON.parse(await readFile('src/data/saf-plans.json', 'utf8'));
  assert.equal(snapshot.source, 'https://saf.sensata.kz/quiz');
  assert.ok(snapshot.plans.length > 0);
  const codes = new Set();
  for (const plan of snapshot.plans) {
    assert.deepEqual(Object.keys(plan).sort(), ['area', 'code', 'image', 'rooms']);
    assert.match(plan.code, /^KV-[A-Z0-9-]+$/);
    assert.ok(!codes.has(plan.code), `duplicate code ${plan.code}`);
    codes.add(plan.code);
    assert.ok(Number.isInteger(plan.rooms) && plan.rooms >= 1 && plan.rooms <= 5);
    assert.ok(Number.isFinite(plan.area) && plan.area > 0);
    assert.match(plan.image, /^https:\/\/pb4678\.profitbase\.ru\/uploads\/preset\/4678\/[a-z0-9]+\.png$/);
  }
});
