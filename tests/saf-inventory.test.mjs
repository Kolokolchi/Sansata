import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
const result = await build({ stdin: { contents: "export * from './src/lib/safInventory'; export * from './src/lib/geometry';", resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node' });
const api = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));

test('numbered apartment index preserves all observations without promoting historic status to current stock', () => {
  assert.equal(api.safApartments.length, 348);
  assert.equal(api.safApartmentById.size, 348);
  for (const unit of api.safApartments) {
    assert.equal(unit.status, 'unknown'); assert.equal(unit.price, null);
    assert.ok(api.safFloorUnits.get(`${unit.section}/${unit.floor}`).includes(unit));
    assert.equal(api.safApartmentById.get(unit.id), unit);
  }
  assert.deepEqual(api.safSectionFloors('5'), [9,8,7,6,5,4,3,2]);
  assert.equal(api.safFloorUnits.get('1/2').length, 5);
});

test('traced masterplan regions stay in source coordinates with interior anchors and separate footprints', async () => {
  const data = JSON.parse(await readFile('src/data/saf-masterplan-regions.json', 'utf8'));
  assert.equal(data.regions.length, 7);
  for (const region of data.regions) {
    for (const [x,y] of region.points) { assert.ok(x >= 0 && x <= data.width && y >= 0 && y <= data.height); }
    const center = api.calculateCentroid(region.points);
    assert.ok(api.pointInPolygon(center, region.points));
    assert.deepEqual(api.calculateCentroid([...region.points].reverse()), center);
    for (const other of data.regions) if (other.id !== region.id) assert.equal(api.pointInPolygon(center, other.points), false);
  }
});
