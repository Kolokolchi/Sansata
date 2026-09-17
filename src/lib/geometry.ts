/**
 * Polygon geometry and spatial calculations for floor plans and SVG overlays.
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Checks whether point p is inside the polygon defined by vertices vs (Ray Casting algorithm / Jordan curve theorem).
 */
export function pointInPolygon(p: Point, vs: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > p.y) !== (yj > p.y)) &&
      (p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Computes the geometric centroid (center of mass) of a 2D polygon using the Shoelace formula.
 * For concave polygons where the centroid falls outside, finds an interior anchor.
 * For degenerate/collinear polygons, falls back to the bounding average.
 */
export function calculateCentroid(points: [number, number][]): Point {
  const n = points.length;
  if (n === 0) return { x: 0, y: 0 };
  if (n === 1) return { x: points[0][0], y: points[0][1] };
  if (n === 2) return { x: (points[0][0] + points[1][0]) / 2, y: (points[0][1] + points[1][1]) / 2 };

  let signedArea = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < n; i++) {
    const x0 = points[i][0];
    const y0 = points[i][1];
    const x1 = points[(i + 1) % n][0];
    const y1 = points[(i + 1) % n][1];

    const cross = x0 * y1 - x1 * y0;
    signedArea += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }

  signedArea *= 0.5;

  let centroid: Point;
  if (Math.abs(signedArea) < 1e-6) {
    let sumX = 0;
    let sumY = 0;
    for (const p of points) {
      sumX += p[0];
      sumY += p[1];
    }
    centroid = { x: sumX / n, y: sumY / n };
  } else {
    const factor = 1 / (6 * signedArea);
    centroid = { x: cx * factor, y: cy * factor };
  }

  // If centroid falls outside concave polygon, fall back to an interior anchor
  if (n >= 3 && !pointInPolygon(centroid, points)) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const mid: Point = {
          x: (points[i][0] + points[j][0]) / 2,
          y: (points[i][1] + points[j][1]) / 2,
        };
        if (pointInPolygon(mid, points)) {
          return mid;
        }
      }
    }
  }

  return centroid;
}
