import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const result = await build({
  stdin: {
    contents: "export * from './src/lib/geometry';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});

const { calculateCentroid, pointInPolygon } = await import(
  'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
);

test('pointInPolygon correctly identifies interior and exterior points for convex polygon', () => {
  // 10x10 square
  const square = [[0, 0], [10, 0], [10, 10], [0, 10]];

  // Interior points
  assert.equal(pointInPolygon({ x: 5, y: 5 }, square), true);
  assert.equal(pointInPolygon({ x: 1, y: 1 }, square), true);
  assert.equal(pointInPolygon({ x: 9, y: 9 }, square), true);

  // Exterior points
  assert.equal(pointInPolygon({ x: -1, y: 5 }, square), false);
  assert.equal(pointInPolygon({ x: 11, y: 5 }, square), false);
  assert.equal(pointInPolygon({ x: 5, y: -1 }, square), false);
  assert.equal(pointInPolygon({ x: 5, y: 11 }, square), false);
  assert.equal(pointInPolygon({ x: 15, y: 15 }, square), false);
});

test('calculateCentroid computes exact center of mass for convex polygons (CCW and CW)', () => {
  // Counter-clockwise 10x10 square
  const squareCCW = [[0, 0], [10, 0], [10, 10], [0, 10]];
  const centroidCCW = calculateCentroid(squareCCW);
  assert.ok(Math.abs(centroidCCW.x - 5) < 1e-5);
  assert.ok(Math.abs(centroidCCW.y - 5) < 1e-5);
  assert.equal(pointInPolygon(centroidCCW, squareCCW), true);

  // Clockwise 10x10 square
  const squareCW = [[0, 0], [0, 10], [10, 10], [10, 0]];
  const centroidCW = calculateCentroid(squareCW);
  assert.ok(Math.abs(centroidCW.x - 5) < 1e-5);
  assert.ok(Math.abs(centroidCW.y - 5) < 1e-5);
  assert.equal(pointInPolygon(centroidCW, squareCW), true);

  // Right-angled triangle
  const triangle = [[0, 0], [6, 0], [0, 6]];
  const centroidTri = calculateCentroid(triangle);
  assert.ok(Math.abs(centroidTri.x - 2) < 1e-5);
  assert.ok(Math.abs(centroidTri.y - 2) < 1e-5);
  assert.equal(pointInPolygon(centroidTri, triangle), true);
});

test('concave L-shaped polygon: pointInPolygon distinguishes interior arms from cutout', () => {
  // Thin L-shaped polygon
  const thinL = [[0, 0], [10, 0], [10, 1], [1, 1], [1, 10], [0, 10]];

  // Inside horizontal arm
  assert.equal(pointInPolygon({ x: 5, y: 0.5 }, thinL), true);
  // Inside vertical arm
  assert.equal(pointInPolygon({ x: 0.5, y: 5 }, thinL), true);
  // In the corner cutout (outside)
  assert.equal(pointInPolygon({ x: 5, y: 5 }, thinL), false);
  assert.equal(pointInPolygon({ x: 2, y: 2 }, thinL), false);
  // Far outside
  assert.equal(pointInPolygon({ x: 12, y: 12 }, thinL), false);
});

test('calculateCentroid falls back to interior anchor for concave shapes where centroid is outside', () => {
  // In this thin L-shape, Shoelace center of mass is around (2.868, 2.868), which is outside the shape
  const thinL = [[0, 0], [10, 0], [10, 1], [1, 1], [1, 10], [0, 10]];
  const anchor = calculateCentroid(thinL);

  // Mandatory invariant: centroid/anchor MUST be strictly inside the polygon
  assert.equal(pointInPolygon(anchor, thinL), true);

  // U-shaped polygon
  const uShape = [
    [0, 0], [10, 0], [10, 10], [8, 10],
    [8, 2], [2, 2], [2, 10], [0, 10]
  ];
  const uAnchor = calculateCentroid(uShape);
  assert.equal(pointInPolygon(uAnchor, uShape), true);
});

test('calculateCentroid handles degenerate polygons gracefully without crashing', () => {
  // Empty array
  assert.deepEqual(calculateCentroid([]), { x: 0, y: 0 });

  // Single point
  assert.deepEqual(calculateCentroid([[7, 42]]), { x: 7, y: 42 });

  // Two points (segment)
  assert.deepEqual(calculateCentroid([[0, 0], [10, 20]]), { x: 5, y: 10 });

  // Collinear points with zero signed area
  const collinear = [[0, 0], [5, 0], [10, 0]];
  const collinearCentroid = calculateCentroid(collinear);
  assert.ok(Math.abs(collinearCentroid.x - 5) < 1e-5);
  assert.ok(Math.abs(collinearCentroid.y - 0) < 1e-5);

  // Closed degenerate collinear (triangle with height 0)
  const flatTriangle = [[0, 2], [10, 2], [4, 2]];
  const flatCentroid = calculateCentroid(flatTriangle);
  assert.ok(Math.abs(flatCentroid.x - (14 / 3)) < 1e-5);
  assert.ok(Math.abs(flatCentroid.y - 2) < 1e-5);
});
