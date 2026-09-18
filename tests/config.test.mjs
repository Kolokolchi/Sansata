import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

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

const { parseExperience, fallbackConfig, calculateMortgage, flats } = await import(
  'data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64')
);

test('config accepts connected panoramas and limits inventory to public fields', () => {
  const config = parseExperience({
    ...fallbackConfig,
    panoramas: [
      { id: 'a', title: 'A', src: '/a.jpg', links: [{ target: 'b', yaw: 0, pitch: 0 }] },
      { id: 'b', title: 'B', src: '/b.jpg' }
    ],
    inventory: [
      { id: 'shattyq-1', price: 50000000, status: 'available', image: 'https://wrong.example/image' }
    ]
  });

  assert.equal(config.panoramas.length, 2);
  assert.equal(config.inventory[0].price, 50000000);
  assert.equal(config.inventory[0].image, undefined);
});

test('config rejects broken arrays, protocols, linked ids and values', () => {
  const invalidPatches = [
    { version: 2 },
    { inventory: null },
    { model: { url: 'javascript:alert(1)', label: 'x', scale: 1 } },
    { inventory: [{ id: 'x', price: -1 }] },
    { panoramas: [{ id: 'a', title: 'A', src: '/a.jpg', links: [{ target: 'missing', yaw: 0, pitch: 0 }] }] }
  ];

  for (const patch of invalidPatches) {
    assert.throws(() => parseExperience({ ...fallbackConfig, ...patch }));
  }
});

test('config accepts a Luma capture ID and rejects malformed embed identifiers', () => {
  const validTour = {
    captureId: '4f362242-ad43-4851-9b04-88adf71f24f5',
    title: 'Example',
    note: 'External scene'
  };
  assert.deepEqual(parseExperience({ ...fallbackConfig, lumaTour: validTour }).lumaTour, validTour);
  assert.throws(() => parseExperience({
    ...fallbackConfig,
    lumaTour: { ...validTour, captureId: '../../javascript:alert(1)' }
  }));
});

test('config accepts multiple Luma scenes and rejects invalid scene definitions', () => {
  const validScenes = [
    {
      id: 'exterior',
      label: 'Экстерьер',
      captureId: '4f362242-ad43-4851-9b04-88adf71f24f5',
      title: 'Corsewall Lighthouse Hotel',
      note: 'External scene'
    },
    {
      id: 'interior',
      label: 'Интерьер',
      captureId: 'b271fff7-37dd-47b1-8921-6375cd069c91',
      title: 'Grand Central Terminal',
      note: 'Interior scene'
    }
  ];
  assert.deepEqual(parseExperience({ ...fallbackConfig, lumaScenes: validScenes }).lumaScenes, validScenes);
  assert.throws(() => parseExperience({
    ...fallbackConfig,
    lumaScenes: [{ ...validScenes[0], captureId: 'invalid-uuid' }]
  }));
  assert.throws(() => parseExperience({
    ...fallbackConfig,
    lumaScenes: [validScenes[0], validScenes[0]] // duplicate id
  }));
});

test('mortgage handles zero rate, full payment and annuity reference', () => {
  assert.equal(calculateMortgage(1200000, 0, 1, 0).payment, 100000);
  assert.equal(calculateMortgage(1200000, 1200000, 1, 18).payment, 0);
  assert.ok(Math.abs(calculateMortgage(1000000, 0, 1, 12).payment - 88848.7887) < 0.01);
});

test('catalogue contains unique original plans and no invented prices', () => {
  assert.equal(flats.length, 20);
  assert.equal(new Set(flats.map((f) => f.id)).size, 20);
  assert.ok(flats.every((f) => f.price === null && f.status === 'unknown'));
  assert.equal(flats.filter((f) => f.rooms === 4 && f.floor === 2).length, 1);
});
