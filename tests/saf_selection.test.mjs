import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundled = await build({
  stdin: { contents: "export * from './src/lib/safSelection';", resolveDir: process.cwd() },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node'
});
const { groupSafPlans, parseOptionalBound } = await import(
  'data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64')
);

test('catalogue groups published variants by block and level without admitting malformed codes', () => {
  const plans = [
    { code: 'KV-P1-E2-S1' },
    { code: 'KV-P1-E2-S2' },
    { code: 'KV-P1-T1-S1' },
    { code: 'KV-P7-E3-S1' },
    { code: 'not-a-public-plan' }
  ];
  const grouped = groupSafPlans(plans);
  assert.deepEqual(grouped.byBlock.get(1), plans.slice(0, 3));
  assert.deepEqual(grouped.byBlockLevel.get(1).get('E2'), plans.slice(0, 2));
  assert.deepEqual(grouped.byBlockLevel.get(7).get('E3'), [plans[3]]);
  assert.equal(grouped.byCode.has(plans[4].code), false);
  assert.equal(grouped.entries.length, 4);
});

test('numeric filters distinguish an empty upper bound from zero and reject invalid input', () => {
  assert.equal(parseOptionalBound('', Infinity), Infinity);
  assert.equal(parseOptionalBound('  ', Infinity), Infinity);
  assert.equal(parseOptionalBound('0', Infinity), 0);
  assert.equal(parseOptionalBound('80.5', 0), 80.5);
  assert.equal(Number.isNaN(parseOptionalBound('-1', Infinity)), true);
  assert.equal(Number.isNaN(parseOptionalBound('1e309', Infinity)), true);
});
