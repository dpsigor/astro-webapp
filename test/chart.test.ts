import assert from 'node:assert/strict';
import { beforeAll, describe, it } from 'vitest';
import {
  aspectColor,
  computeChart,
  partOfFortune,
  type ChartOptions,
} from '../src/lib/chart';
import { HouseSystem, Planet, SwEph, planets } from '../src/lib/sweph';
import { assertNear, loadSwEph, utc } from './helpers';

describe('partOfFortune', () => {
  it('is Asc + Moon − Sun by day', () => {
    // With 0° rising, a Sun at 270° is near the midheaven.
    assert.equal(partOfFortune(0, 270, 100), 190);
    assert.equal(partOfFortune(100, 300, 50), 210);
  });

  it('is Asc + Sun − Moon by night', () => {
    assert.equal(partOfFortune(0, 90, 100), 350);
    assert.equal(partOfFortune(100, 150, 20), 230);
  });

  it('treats the Sun as risen from the descendant round to the ascendant', () => {
    assert.equal(partOfFortune(10, 190, 40), 220);
    assertNear(partOfFortune(10, 189.9, 40), 159.9, 1e-9, 'just before sunset');
    assert.equal(partOfFortune(10, 10, 40), 340);
    assertNear(partOfFortune(10, 9.9, 40), 40.1, 1e-9, 'just before sunrise');
  });

  it('falls on the ascendant at a new moon', () => {
    assert.equal(partOfFortune(123, 200, 200), 123);
    assert.equal(partOfFortune(123, 20, 20), 123);
  });

  it('mirrors across the ascendant between day and night', () => {
    for (let asc = 0; asc < 360; asc += 37) {
      for (let moon = 0; moon < 360; moon += 41) {
        const day = partOfFortune(asc, asc + 200, moon);
        const night = partOfFortune(asc, asc + 160, moon);
        assertNear(day - asc, moon - (asc + 200), 1e-9, 'day');
        assertNear(night - asc, asc + 160 - moon, 1e-9, 'night');
      }
    }
  });

  it('stays within [0, 360)', () => {
    for (let asc = 0; asc < 360; asc += 29) {
      for (let sun = 0; sun < 360; sun += 31) {
        for (let moon = 0; moon < 360; moon += 37) {
          const lon = partOfFortune(asc, sun, moon);
          assert.ok(lon >= 0 && lon < 360, `${asc} ${sun} ${moon} → ${lon}`);
        }
      }
    }
  });
});

describe('computeChart', () => {
  let sweph: SwEph;
  const date = utc(2000, 0, 1, 12);
  const LAT = 51.5;
  const LON = 0;
  const plain: ChartOptions = {
    houseSystem: HouseSystem.Placidus,
    partOfFortune: false,
    nodes: false,
  };
  const chart = (options: Partial<ChartOptions> = {}, when = date) =>
    computeChart(sweph, when, LAT, LON, { ...plain, ...options });

  beforeAll(async () => {
    sweph = await loadSwEph();
  });

  it('holds the position and speed of every planet', () => {
    const { positions } = chart();
    const { jd } = sweph.jd(date);
    assert.deepEqual([...positions.keys()], planets);
    for (const planet of planets) {
      const { lon, slon } = sweph.planetPos(jd, planet);
      assert.deepEqual(positions.get(planet), { lon, slon });
    }
  });

  it('holds the houses and angles of the chosen system', () => {
    const { jd } = sweph.jd(date);
    for (const houseSystem of [HouseSystem.Placidus, HouseSystem.WholeSign]) {
      const { houses, asc, mc } = chart({ houseSystem });
      const expected = sweph.houses(jd, LAT, LON, houseSystem);
      assert.deepEqual(houses, expected.cusps);
      assert.equal(asc, expected.asc);
      assert.equal(mc, expected.mc);
    }
    assert.notDeepEqual(
      chart({ houseSystem: HouseSystem.Placidus }).houses,
      chart({ houseSystem: HouseSystem.WholeSign }).houses,
    );
  });

  it('depends on the place', () => {
    const here = chart();
    const there = computeChart(sweph, date, -23.5, -46.6, plain);
    assert.notEqual(there.asc, here.asc);
    assert.deepEqual(there.positions, here.positions);
  });

  it('has no extra points unless asked', () => {
    assert.deepEqual(chart().points, []);
  });

  it('adds the nodes opposite each other', () => {
    const { points } = chart({ nodes: true });
    assert.deepEqual(
      points.map((p) => p.label),
      ['North node', 'South node'],
    );
    const { lon } = sweph.northNodeLon(sweph.jd(date).jd);
    assert.equal(points[0].lon, lon);
    assertNear(points[1].lon, lon + 180, 1e-9, 'south node');
    assert.ok(points[1].lon >= 0 && points[1].lon < 360);
    assert.notEqual(points[0].glyph, points[1].glyph);
  });

  it('adds the Part of Fortune', () => {
    const { points, asc, positions } = chart({ partOfFortune: true });
    assert.equal(points.length, 1);
    assert.equal(points[0].label, 'Part of Fortune');
    const sun = positions.get(Planet.Sun)?.lon ?? NaN;
    const moon = positions.get(Planet.Moon)?.lon ?? NaN;
    assert.equal(points[0].lon, partOfFortune(asc, sun, moon));
    // Noon in London: a day chart.
    assertNear(points[0].lon, asc + moon - sun, 1e-9, 'day formula');
  });

  it('uses the night formula for a night chart', () => {
    const midnight = utc(2000, 0, 1, 0);
    const { points, asc, positions } = chart({ partOfFortune: true }, midnight);
    const sun = positions.get(Planet.Sun)?.lon ?? NaN;
    const moon = positions.get(Planet.Moon)?.lon ?? NaN;
    assertNear(points[0].lon, asc + sun - moon, 1e-9, 'night formula');
  });

  it('adds the nodes before the Part of Fortune', () => {
    const { points } = chart({ nodes: true, partOfFortune: true });
    assert.deepEqual(
      points.map((p) => p.label),
      ['North node', 'South node', 'Part of Fortune'],
    );
  });

  it('throws outside the ephemeris range', () => {
    assert.throws(
      () => chart({}, utc(4000, 0, 1)),
      /outside Moshier planet range/,
    );
  });
});

describe('aspectColor', () => {
  const CONJUNCTION = '#FFFF00';
  const SEXTILE = '#00FFFF';
  const SQUARE = '#FF0000';
  const TRINE = '#00FF00';
  const OPPOSITION = '#FF00FF';

  it('recognises each aspect at its exact angle', () => {
    assert.equal(aspectColor(0, 3, 3), CONJUNCTION);
    assert.equal(aspectColor(60, 0, 2), SEXTILE);
    assert.equal(aspectColor(90, 0, 3), SQUARE);
    assert.equal(aspectColor(120, 0, 4), TRINE);
    assert.equal(aspectColor(180, 0, 6), OPPOSITION);
  });

  it('recognises aspects measured the long way round', () => {
    assert.equal(aspectColor(300, 0, 10), SEXTILE);
    assert.equal(aspectColor(270, 0, 9), SQUARE);
    assert.equal(aspectColor(240, 0, 8), TRINE);
  });

  it('does not depend on which planet comes first', () => {
    assert.equal(aspectColor(60, 2, 0), SEXTILE);
    assert.equal(aspectColor(300, 10, 0), SEXTILE);
    assert.equal(aspectColor(90, 3, 0), SQUARE);
    assert.equal(aspectColor(270, 9, 0), SQUARE);
    assert.equal(aspectColor(120, 4, 0), TRINE);
    assert.equal(aspectColor(240, 8, 0), TRINE);
    assert.equal(aspectColor(180, 6, 0), OPPOSITION);
  });

  it('allows an orb of just under 5°', () => {
    assert.equal(aspectColor(4.9, 0, 0), CONJUNCTION);
    assert.equal(aspectColor(5, 0, 0), '');
    for (const [angle, sign, color] of [
      [60, 2, SEXTILE],
      [90, 3, SQUARE],
      [120, 4, TRINE],
      [180, 6, OPPOSITION],
    ] as const) {
      assert.equal(aspectColor(angle - 4.9, 0, sign), color);
      assert.equal(aspectColor(angle + 4.9, 0, sign), color);
      assert.equal(aspectColor(angle - 5, 0, sign), '');
      assert.equal(aspectColor(angle + 5, 0, sign), '');
    }
  });

  it('ignores aspects between signs that do not fit them', () => {
    // 29° Aries and 2° Taurus: 3° apart, but in adjacent signs.
    assert.equal(aspectColor(3, 0, 1), '');
    assert.equal(aspectColor(58, 0, 1), '');
    assert.equal(aspectColor(88, 0, 2), '');
    assert.equal(aspectColor(118, 0, 3), '');
    assert.equal(aspectColor(178, 0, 5), '');
  });

  it('finds no aspect at other angles', () => {
    assert.equal(aspectColor(20, 0, 0), '');
    assert.equal(aspectColor(45, 0, 1), '');
    assert.equal(aspectColor(150, 0, 5), '');
  });
});
