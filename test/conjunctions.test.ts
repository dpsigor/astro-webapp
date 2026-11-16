import assert from 'node:assert/strict';
import { beforeAll, describe, it } from 'vitest';
import {
  conjunctionSearchEnd,
  findConjunctions,
} from '../src/lib/conjunctions';
import { Planet, SwEph, planets } from '../src/lib/sweph';
import {
  ARCMIN,
  DAY_MS,
  MINUTE_MS,
  arc,
  assertNear,
  dms,
  loadSwEph,
  utc,
} from './helpers';

function assertTimeNear(actual: Date, expected: Date, toleranceMs: number) {
  assert.ok(
    Math.abs(actual.getTime() - expected.getTime()) <= toleranceMs,
    `expected ${expected.toISOString()}, got ${actual.toISOString()}`,
  );
}

describe('findConjunctions', () => {
  let sweph: SwEph;

  const lonAt = (planet: Planet, time: Date) =>
    sweph.planetLon(sweph.jd(time).jd, planet).lon;

  beforeAll(async () => {
    sweph = await loadSwEph();
  });

  it('finds the Jupiter–Saturn great conjunction of 2020', () => {
    const found = findConjunctions(
      sweph,
      [Planet.Jupiter, Planet.Saturn],
      utc(2020, 0, 1),
      utc(2021, 0, 1),
    );
    assert.equal(found.length, 1);
    const [{ time, a, b, angle }] = found;
    assert.deepEqual([a, b], [Planet.Jupiter, Planet.Saturn]);
    // The two move together slowly, so the instant is sensitive to tiny
    // differences in position.
    assertTimeNear(time, utc(2020, 11, 21, 18, 20), 30 * MINUTE_MS);
    assertNear(angle, dms(300, 29), ARCMIN, '0°29′ Aquarius');
  });

  it('finds the thirteen new moons of 2024', () => {
    const found = findConjunctions(
      sweph,
      [Planet.Sun, Planet.Moon],
      utc(2024, 0, 1),
      utc(2025, 0, 1),
    );
    assert.equal(found.length, 13);
    assertTimeNear(found[0].time, utc(2024, 0, 11, 11, 57), 2 * MINUTE_MS);
    assertTimeNear(found[3].time, utc(2024, 3, 8, 18, 21), 2 * MINUTE_MS);
    assertTimeNear(found[12].time, utc(2024, 11, 30, 22, 27), 2 * MINUTE_MS);
    for (let i = 1; i < found.length; i++) {
      const days =
        (found[i].time.getTime() - found[i - 1].time.getTime()) / DAY_MS;
      assert.ok(days > 29.2 && days < 29.9, `lunation of ${days} days`);
    }
  });

  it('does not report oppositions', () => {
    // Full moon on 2024-04-23 23:49 UTC.
    const found = findConjunctions(
      sweph,
      [Planet.Sun, Planet.Moon],
      utc(2024, 3, 15),
      utc(2024, 4, 1),
    );
    assert.deepEqual(found, []);
  });

  it('finds both inferior and superior conjunctions of Mercury', () => {
    const found = findConjunctions(
      sweph,
      [Planet.Sun, Planet.Mercury],
      utc(2024, 0, 1),
      utc(2025, 0, 1),
    );
    const expected = [
      utc(2024, 1, 28),
      utc(2024, 3, 11),
      utc(2024, 5, 14),
      utc(2024, 7, 19),
      utc(2024, 8, 30),
      utc(2024, 11, 6),
    ];
    assert.equal(found.length, expected.length);
    found.forEach(({ time }, i) => {
      assertTimeNear(time, expected[i], 1.5 * DAY_MS);
      // Mercury is retrograde at an inferior conjunction and direct at a
      // superior one, and the two alternate.
      const { slon } = sweph.planetPos(sweph.jd(time).jd, Planet.Mercury);
      assert.equal(slon < 0, i % 2 === 1, time.toISOString());
    });
  });

  it('pins every conjunction down to the instant the longitudes match', () => {
    const found = findConjunctions(
      sweph,
      planets,
      utc(2024, 0, 1),
      utc(2024, 6, 1),
    );
    assert.ok(found.length > 50);
    for (const { time, a, b, angle } of found) {
      const what = `${Planet[a]}–${Planet[b]} at ${time.toISOString()}`;
      assert.ok(a < b, what);
      assertNear(lonAt(a, time), lonAt(b, time), 1e-4, what);
      assertNear(angle, lonAt(a, time), 1e-9, what);
    }
  });

  it('sorts the results by time', () => {
    const found = findConjunctions(
      sweph,
      planets,
      utc(2024, 0, 1),
      utc(2024, 6, 1),
    );
    for (let i = 1; i < found.length; i++)
      assert.ok(found[i].time >= found[i - 1].time);
  });

  it('finds each pair as it would alone', () => {
    const start = utc(2024, 0, 1);
    const end = utc(2024, 6, 1);
    const all = findConjunctions(sweph, planets, start, end);
    const pair = findConjunctions(
      sweph,
      [Planet.Venus, Planet.Mars],
      start,
      end,
    );
    assert.ok(pair.length > 0);
    assert.deepEqual(
      all.filter((c) => c.a === Planet.Venus && c.b === Planet.Mars),
      pair,
    );
  });

  it('ignores the order the planets are given in', () => {
    const start = utc(2024, 0, 1);
    const end = utc(2024, 3, 1);
    assert.deepEqual(
      findConjunctions(
        sweph,
        [Planet.Moon, Planet.Venus, Planet.Sun],
        start,
        end,
      ),
      findConjunctions(
        sweph,
        [Planet.Sun, Planet.Moon, Planet.Venus],
        start,
        end,
      ),
    );
  });

  it('finds a conjunction whatever the period starts on', () => {
    const eclipse = utc(2024, 3, 8, 18, 21);
    for (const hoursBefore of [1, 7, 13, 23, 36]) {
      const found = findConjunctions(
        sweph,
        [Planet.Sun, Planet.Moon],
        new Date(eclipse.getTime() - hoursBefore * 60 * MINUTE_MS),
        new Date(eclipse.getTime() + 5 * 60 * MINUTE_MS),
      );
      assert.equal(found.length, 1, `starting ${hoursBefore} h before`);
      assertTimeNear(found[0].time, eclipse, 2 * MINUTE_MS);
    }
  });

  it('leaves out a conjunction just outside the period', () => {
    const eclipse = utc(2024, 3, 8, 18, 21);
    const before = findConjunctions(
      sweph,
      [Planet.Sun, Planet.Moon],
      utc(2024, 3, 1),
      new Date(eclipse.getTime() - 10 * MINUTE_MS),
    );
    const after = findConjunctions(
      sweph,
      [Planet.Sun, Planet.Moon],
      new Date(eclipse.getTime() + 10 * MINUTE_MS),
      utc(2024, 3, 20),
    );
    assert.deepEqual(before, []);
    assert.deepEqual(after, []);
  });

  it('returns nothing for fewer than two planets or an empty period', () => {
    const start = utc(2024, 0, 1);
    const end = utc(2025, 0, 1);
    assert.deepEqual(findConjunctions(sweph, [], start, end), []);
    assert.deepEqual(findConjunctions(sweph, [Planet.Sun], start, end), []);
    assert.deepEqual(
      findConjunctions(sweph, [Planet.Sun, Planet.Moon], start, start),
      [],
    );
  });

  it('throws outside the ephemeris range', () => {
    assert.throws(
      () =>
        findConjunctions(
          sweph,
          [Planet.Sun, Planet.Moon],
          utc(4000, 0, 1),
          utc(4000, 1, 1),
        ),
      /outside Moshier planet range/,
    );
  });

  it('cuts a long search short', () => {
    const start = utc(1900, 0, 1);
    const found = findConjunctions(
      sweph,
      [Planet.Jupiter, Planet.Saturn],
      start,
      utc(2100, 0, 1),
    );
    const limit = conjunctionSearchEnd(2, start, utc(2100, 0, 1));
    assert.ok(found.length > 0);
    assert.ok(found.every((c) => c.time <= limit));
    // Great conjunctions of 1901 and 1921; the next, in 1940, is past the cut.
    assert.deepEqual(
      found.map((c) => c.time.getUTCFullYear()),
      [1901, 1921],
    );
    assert.ok(arc(found[0].angle, found[1].angle) > 100);
  });
});

describe('conjunctionSearchEnd', () => {
  const start = utc(2000, 0, 1);
  const daysAfter = (days: number) => new Date(start.getTime() + days * DAY_MS);

  it('keeps a short period as it is', () => {
    const end = daysAfter(365);
    assert.equal(conjunctionSearchEnd(7, start, end), end);
  });

  it('caps the period at 25,000 samples', () => {
    const farEnd = daysAfter(100_000);
    assert.deepEqual(conjunctionSearchEnd(2, start, farEnd), daysAfter(12_500));
    assert.deepEqual(conjunctionSearchEnd(7, start, farEnd), daysAfter(3571));
  });

  it('keeps a period exactly at the cap', () => {
    const end = daysAfter(12_500);
    assert.equal(conjunctionSearchEnd(2, start, end), end);
  });

  it('copes with no planets', () => {
    assert.deepEqual(
      conjunctionSearchEnd(0, start, daysAfter(100_000)),
      daysAfter(25_000),
    );
  });
});
