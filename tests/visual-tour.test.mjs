import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundled = await build({
  stdin: {
    contents: "export * from './src/data/shattyqVisualData'; export * from './src/lib/experience';",
    resolveDir: process.cwd()
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node'
});

const {
  SHATTYQ_VISUAL_ANGLES,
  resolveVisualAngle,
  getSectionPlansSummary,
  flats
} = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'));

test('visual angles have correct dimensions, polygons within 2560x1440 and POIs', () => {
  assert.equal(SHATTYQ_VISUAL_ANGLES.length, 2);

  for (const angle of SHATTYQ_VISUAL_ANGLES) {
    assert.equal(angle.width, 2560);
    assert.equal(angle.height, 1440);
    assert.ok(angle.image.startsWith('/images/3d_tour/'));

    // Check sections
    assert.equal(angle.sections.length, 2);
    for (const section of angle.sections) {
      assert.ok(section.id === 1 || section.id === 2);
      assert.ok(section.points.length > 0);

      // Verify each point in polygon is within 0..2560 and 0..1440
      const pairs = section.points.trim().split(/\s+/);
      for (const pair of pairs) {
        const [x, y] = pair.split(',').map(Number);
        assert.ok(!isNaN(x) && x >= 0 && x <= 2560, `x=${x} out of bounds`);
        assert.ok(!isNaN(y) && y >= 0 && y <= 1440, `y=${y} out of bounds`);
      }

      // Verify badge position is within bounds
      assert.ok(section.badgePos.x >= 0 && section.badgePos.x <= 2560);
      assert.ok(section.badgePos.y >= 0 && section.badgePos.y <= 1440);
    }

    // Check POI pins
    assert.ok(angle.poiPins.length >= 2);
    for (const poi of angle.poiPins) {
      assert.ok(poi.x >= 0 && poi.x <= 2560);
      assert.ok(poi.y >= 0 && poi.y <= 1440);
    }
  }
});

test('resolveVisualAngle correctly maps rotateId and index parameters', () => {
  assert.equal(resolveVisualAngle().id, 'cam5');
  assert.equal(resolveVisualAngle(null).id, 'cam5');
  assert.equal(resolveVisualAngle('57').id, 'cam5');
  assert.equal(resolveVisualAngle('64').id, 'cam6');
  assert.equal(resolveVisualAngle('0').id, 'cam5');
  assert.equal(resolveVisualAngle('1').id, 'cam6');
  assert.equal(resolveVisualAngle('nonexistent').id, 'cam5');
});

test('getSectionPlansSummary computes accurate statistics from catalog flats', () => {
  const summary1 = getSectionPlansSummary(flats, 1);
  const summary2 = getSectionPlansSummary(flats, 2);

  assert.ok(summary1.totalPlans > 0);
  assert.ok(summary2.totalPlans > 0);
  assert.ok(summary1.minArea > 0 && summary1.maxArea >= summary1.minArea);
  assert.ok(summary2.minArea > 0 && summary2.maxArea >= summary2.minArea);
  assert.ok(summary1.roomLabels.length > 0);
});
