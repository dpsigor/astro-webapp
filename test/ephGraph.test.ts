import assert from 'node:assert/strict';
import { beforeAll, describe, it } from 'vitest';
import type { CanvasSize } from '../src/lib/canvasSize';
import {
  computeGraphPoints,
  findGraphPoint,
  planetColors,
  type GraphPoint,
} from '../src/lib/ephGraph';
import { Planet, SwEph } from '../src/lib/sweph';
import { DAY_MS, loadSwEph, utc } from './helpers';

describe('computeGraphPoints', () => {
  let sweph: SwEph;
  const size: CanvasSize = { width: 400, height: 300, radius: 100 };
  const start = utc(2024, 0, 1);
  const end = utc(2024, 0, 21);
  const range: [Date, Date] = [start, end];
  const SAMPLES = 200;

  const flat = (planets: Planet[]): GraphPoint[] =>
    [...computeGraphPoints(sweph, planets, range, size).values()].flat();

  beforeAll(async () => {
    sweph = await loadSwEph();
  });

  it('samples each planet 200 times', () => {
    assert.equal(flat([Planet.Sun]).length, SAMPLES);
    const both = flat([Planet.Sun, Planet.Moon]);
    assert.equal(both.length, 2 * SAMPLES);
    for (const planet of [Planet.Sun, Planet.Moon]) {
      const color = planetColors[planet];
      assert.equal(both.filter((p) => p.color === color).length, SAMPLES);
    }
  });

  it('returns nothing without planets', () => {
    assert.equal(computeGraphPoints(sweph, [], range, size).size, 0);
  });

  it('spreads the samples evenly from the start of the range', () => {
    const points = flat([Planet.Sun]).sort((a, b) => a.x - b.x);
    const dt = (end.getTime() - start.getTime()) / SAMPLES;
    points.forEach((p, i) => {
      assert.ok(Math.abs(p.date.getTime() - (start.getTime() + i * dt)) < 1);
      assert.ok(Math.abs(p.x - (20 + (i * 360) / SAMPLES)) < 1e-9);
    });
    assert.equal(points[0].x, 20);
    assert.ok(points[SAMPLES - 1].x < size.width - 20);
  });

  it('plots the longitude of each sample, growing upwards', () => {
    for (const p of flat([Planet.Sun, Planet.Moon])) {
      const planet =
        p.color === planetColors[Planet.Sun] ? Planet.Sun : Planet.Moon;
      const { lon } = sweph.planetLon(sweph.jd(p.date).jd, planet);
      assert.equal(p.lon, lon);
      assert.ok(Math.abs(p.y - (280 - (lon * 260) / 360)) < 1e-9);
      assert.ok(p.y > 20 && p.y <= 280);
    }
  });

  it('throws outside the ephemeris range', () => {
    assert.throws(
      () =>
        computeGraphPoints(
          sweph,
          [Planet.Sun],
          [utc(4000, 0, 1), utc(4000, 1, 1)],
          size,
        ),
      /outside Moshier planet range/,
    );
  });

  describe('findGraphPoint', () => {
    it('finds a point at or next to its position', () => {
      const points = computeGraphPoints(sweph, [Planet.Sun], range, size);
      for (const p of [...points.values()].flat()) {
        const found = findGraphPoint(points, p.x, p.y);
        assert.ok(found);
        assert.ok(
          Math.abs(found.x - p.x) <= 10 && Math.abs(found.y - p.y) <= 10,
        );
        assert.ok(
          Math.abs(found.date.getTime() - p.date.getTime()) < 2 * DAY_MS,
        );
      }
    });

    it('finds nothing on empty canvas', () => {
      const points = computeGraphPoints(sweph, [Planet.Sun], range, size);
      // The Sun is in Capricorn all through the range, far from 0° and 180°.
      assert.equal(findGraphPoint(points, 200, 270), undefined);
      assert.equal(findGraphPoint(points, 200, 150), undefined);
      assert.equal(findGraphPoint(new Map(), 200, 150), undefined);
    });
  });
});
