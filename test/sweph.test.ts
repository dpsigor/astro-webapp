import assert from 'node:assert/strict';
import { beforeAll, describe, it } from 'vitest';
import {
  Dignity,
  HouseSystem,
  Planet,
  Sign,
  SwEph,
  dignity,
  houseSystems,
  planets,
  signs,
} from '../src/lib/sweph';
import { ARCMIN, arc, assertNear, dms, loadSwEph, norm, utc } from './helpers';

const J2000 = utc(2000, 0, 1, 12);

describe('SwEph', () => {
  let sweph: SwEph;
  let jd2000: number;

  const jdOf = (date: Date) => {
    const { jd, err } = sweph.jd(date);
    assert.equal(err, undefined);
    return jd;
  };

  beforeAll(async () => {
    sweph = await loadSwEph();
    jd2000 = jdOf(J2000);
  });

  describe('jd', () => {
    // The result is UT1, which stays within 0.9 s of UTC.
    const UT1_TOLERANCE = 1 / 86400;
    // UT1 drifts against UTC by a millisecond or so per day.
    const DRIFT_TOLERANCE = 0.01 / 86400;

    it('gives the J2000 epoch for 2000-01-01 12:00 UTC', () => {
      assert.ok(Math.abs(jd2000 - 2451545) < UT1_TOLERANCE);
    });

    it('gives 2440587.5 for the Unix epoch', () => {
      assert.ok(Math.abs(jdOf(new Date(0)) - 2440587.5) < UT1_TOLERANCE);
    });

    it('accounts for the time of day down to milliseconds', () => {
      const midnight = jdOf(utc(2010, 5, 15));
      assert.ok(
        Math.abs(jdOf(utc(2010, 5, 15, 18)) - midnight - 0.75) <
          DRIFT_TOLERANCE,
      );
      assert.ok(
        Math.abs(
          jdOf(utc(2010, 5, 15, 0, 0, 0, 500)) - midnight - 0.5 / 86400,
        ) < DRIFT_TOLERANCE,
      );
    });

    it('advances by one per day across a leap day', () => {
      const diff = jdOf(utc(2024, 2, 1)) - jdOf(utc(2024, 1, 28));
      assert.ok(Math.abs(diff - 2) < DRIFT_TOLERANCE);
    });
  });

  describe('planetPos', () => {
    // Published ephemeris positions for 2000-01-01 12:00 UT, to the arcminute.
    const atJ2000: [Planet, number][] = [
      [Planet.Sun, dms(280, 22)],
      [Planet.Moon, dms(223, 19)],
      [Planet.Mercury, dms(271, 53)],
      [Planet.Venus, dms(241, 34)],
      [Planet.Mars, dms(327, 58)],
      [Planet.Jupiter, dms(25, 15)],
      [Planet.Saturn, dms(40, 24)],
    ];

    for (const [planet, expected] of atJ2000) {
      it(`places ${Planet[planet]} at J2000`, () => {
        const { lon, err } = sweph.planetPos(jd2000, planet);
        assert.equal(err, undefined);
        assertNear(lon, expected, ARCMIN, Planet[planet]);
      });
    }

    it('puts the Sun at 0° Aries at the March 2024 equinox', () => {
      const { lon } = sweph.planetPos(jdOf(utc(2024, 2, 20, 3, 6)), Planet.Sun);
      assertNear(lon, 0, ARCMIN, 'Sun');
    });

    it('puts the Sun and Moon together at the 2024-04-08 solar eclipse', () => {
      const jd = jdOf(utc(2024, 3, 8, 18, 21));
      const sun = sweph.planetPos(jd, Planet.Sun).lon;
      const moon = sweph.planetPos(jd, Planet.Moon).lon;
      assertNear(moon, sun, 2 * ARCMIN, 'Moon');
    });

    it('puts the Sun and Moon opposite at the 2025-03-14 lunar eclipse', () => {
      const jd = jdOf(utc(2025, 2, 14, 6, 55));
      const sun = sweph.planetPos(jd, Planet.Sun).lon;
      const moon = sweph.planetPos(jd, Planet.Moon).lon;
      assertNear(moon, sun + 180, 2 * ARCMIN, 'Moon');
    });

    it('keeps every longitude within [0, 360)', () => {
      for (let day = 0; day < 3650; day += 73) {
        for (const planet of planets) {
          const { lon } = sweph.planetPos(jd2000 + day, planet);
          assert.ok(lon >= 0 && lon < 360, `${Planet[planet]} at ${lon}`);
        }
      }
    });

    it('reports a speed matching the change in longitude', () => {
      const h = 0.01;
      for (const planet of planets) {
        const { slon } = sweph.planetPos(jd2000, planet);
        const after = sweph.planetPos(jd2000 + h, planet).lon;
        const prior = sweph.planetPos(jd2000 - h, planet).lon;
        const measured = (((after - prior + 540) % 360) - 180) / (2 * h);
        assert.ok(
          Math.abs(slon - measured) < 1e-4,
          `${Planet[planet]}: slon ${slon}, measured ${measured}`,
        );
      }
    });

    it('never reports the Sun or Moon as retrograde', () => {
      for (let day = 0; day < 365; day += 5) {
        assert.ok(sweph.planetPos(jd2000 + day, Planet.Sun).slon > 0);
        assert.ok(sweph.planetPos(jd2000 + day, Planet.Moon).slon > 0);
      }
    });

    it('reports a negative speed for a retrograde planet', () => {
      // Mercury was retrograde from 2024-04-01 to 2024-04-25.
      const mercury = (date: Date) =>
        sweph.planetPos(jdOf(date), Planet.Mercury).slon;
      assert.ok(mercury(utc(2024, 3, 10)) < 0);
      assert.ok(mercury(utc(2024, 2, 20)) > 0);
      assert.ok(mercury(utc(2024, 4, 5)) > 0);
      // Saturn was retrograde at J2000.
      assert.ok(sweph.planetPos(jd2000, Planet.Saturn).slon < 0);
    });

    it('returns an error outside the ephemeris range', () => {
      const { err } = sweph.planetPos(1e9, Planet.Sun);
      assert.match(err ?? '', /outside Moshier planet range/);
    });

    it('recovers after an error', () => {
      sweph.planetPos(1e9, Planet.Sun);
      const { lon, err } = sweph.planetPos(jd2000, Planet.Sun);
      assert.equal(err, undefined);
      assertNear(lon, dms(280, 22), ARCMIN, 'Sun');
    });
  });

  describe('planetLon', () => {
    it('agrees with planetPos', () => {
      for (let day = 0; day < 3650; day += 365) {
        for (const planet of planets) {
          const jd = jd2000 + day;
          const { lon, err } = sweph.planetLon(jd, planet);
          assert.equal(err, undefined);
          assertNear(
            lon,
            sweph.planetPos(jd, planet).lon,
            1e-9,
            Planet[planet],
          );
        }
      }
    });

    it('returns an error outside the ephemeris range', () => {
      assert.ok(sweph.planetLon(1e9, Planet.Moon).err);
    });
  });

  describe('northNodeLon', () => {
    it('places the mean node at J2000', () => {
      const { lon, err } = sweph.northNodeLon(jd2000);
      assert.equal(err, undefined);
      assertNear(lon, dms(125, 2), ARCMIN, 'node');
    });

    it('moves backwards through the zodiac in 18.6 years', () => {
      const perDay =
        sweph.northNodeLon(jd2000 + 1).lon - sweph.northNodeLon(jd2000).lon;
      assert.ok(Math.abs(perDay + 360 / (18.6 * 365.25)) < 1e-4);
      const cycle = 6798.38;
      assertNear(
        sweph.northNodeLon(jd2000 + cycle).lon,
        sweph.northNodeLon(jd2000).lon,
        0.05,
        'node after a full cycle',
      );
    });
  });

  describe('houses', () => {
    const LAT = 51.5;
    const LON = 0;
    const at = (hsys: HouseSystem) => sweph.houses(jd2000, LAT, LON, hsys);

    it('matches the ascendant and midheaven derived from sidereal time', () => {
      const rad = Math.PI / 180;
      // Greenwich mean sidereal time and mean obliquity at J2000.
      const ramc = 280.46061837 * rad;
      const eps = 23.4392911 * rad;
      const mc = norm(
        Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / rad,
      );
      const asc = norm(
        Math.atan2(
          Math.cos(ramc),
          -(
            Math.sin(ramc) * Math.cos(eps) +
            Math.tan(LAT * rad) * Math.sin(eps)
          ),
        ) / rad,
      );
      const houses = at(HouseSystem.Placidus);
      // The library uses apparent sidereal time and true obliquity.
      assertNear(houses.mc, mc, 0.02, 'MC');
      assertNear(houses.asc, asc, 0.02, 'ASC');
    });

    it('moves the angles with the place', () => {
      const here = at(HouseSystem.Placidus);
      const east = sweph.houses(jd2000, LAT, 15, HouseSystem.Placidus);
      // 15° of longitude is one hour of sidereal time.
      assertNear(east.mc - here.mc, 15, 2, 'MC shift');
      const south = sweph.houses(jd2000, -LAT, LON, HouseSystem.Placidus);
      assertNear(south.mc, here.mc, 1e-9, 'MC at the opposite latitude');
      assert.ok(arc(south.asc, here.asc) > 1);
    });

    for (const { value, label } of houseSystems) {
      describe(label, () => {
        it('returns twelve cusps within [0, 360)', () => {
          const { cusps } = at(value);
          assert.equal(cusps.length, 12);
          for (const cusp of cusps) assert.ok(cusp >= 0 && cusp < 360);
        });

        it('has opposite cusps 180° apart', () => {
          const { cusps } = at(value);
          for (let i = 0; i < 6; i++)
            assertNear(cusps[i + 6], cusps[i] + 180, 1e-9, `cusp ${i + 7}`);
        });

        it('runs the cusps in zodiacal order, once around', () => {
          const { cusps } = at(value);
          let total = 0;
          for (let i = 0; i < 12; i++) {
            const span = norm(cusps[(i + 1) % 12] - cusps[i]);
            assert.ok(span > 0 && span < 180, `house ${i + 1} spans ${span}`);
            total += span;
          }
          assert.ok(Math.abs(total - 360) < 1e-9);
        });

        it('has the same angles as every other system', () => {
          const placidus = at(HouseSystem.Placidus);
          const houses = at(value);
          assertNear(houses.asc, placidus.asc, 1e-9, 'ASC');
          assertNear(houses.mc, placidus.mc, 1e-9, 'MC');
        });
      });
    }

    const quadrant = [
      HouseSystem.Placidus,
      HouseSystem.Koch,
      HouseSystem.Regiomontanus,
      HouseSystem.Campanus,
      HouseSystem.Porphyry,
    ];
    for (const hsys of quadrant) {
      it(`starts house 1 at the ASC and house 10 at the MC (${hsys})`, () => {
        const { cusps, asc, mc } = at(hsys);
        assertNear(cusps[0], asc, 1e-9, 'cusp 1');
        assertNear(cusps[9], mc, 1e-9, 'cusp 10');
      });
    }

    it('trisects each quadrant in Porphyry', () => {
      const { cusps, asc, mc } = at(HouseSystem.Porphyry);
      const third = norm(asc - mc) / 3;
      assertNear(cusps[10], mc + third, 1e-9, 'cusp 11');
      assertNear(cusps[11], mc + 2 * third, 1e-9, 'cusp 12');
    });

    it('spaces Equal houses 30° apart from the ASC', () => {
      const { cusps, asc } = at(HouseSystem.Equal);
      cusps.forEach((cusp, i) =>
        assertNear(cusp, asc + 30 * i, 1e-9, `cusp ${i + 1}`),
      );
    });

    it('starts Whole sign houses at 0° of the rising sign', () => {
      const { cusps, asc } = at(HouseSystem.WholeSign);
      const rising = Math.floor(asc / 30) * 30;
      cusps.forEach((cusp, i) =>
        assertNear(cusp, rising + 30 * i, 1e-9, `cusp ${i + 1}`),
      );
    });
  });
});

describe('dignity', () => {
  const { Domicile, Detriment, Exaltation, Fall } = Dignity;
  // One entry per sign, Aries to Pisces.
  const table: Record<Planet, (Dignity | undefined)[]> = {
    [Planet.Sun]: [
      Exaltation,
      undefined,
      undefined,
      undefined,
      Domicile,
      undefined,
      Fall,
      undefined,
      undefined,
      undefined,
      Detriment,
      undefined,
    ],
    [Planet.Moon]: [
      undefined,
      Exaltation,
      undefined,
      Domicile,
      undefined,
      undefined,
      undefined,
      Fall,
      undefined,
      Detriment,
      undefined,
      undefined,
    ],
    [Planet.Mercury]: [
      undefined,
      undefined,
      Domicile,
      undefined,
      undefined,
      Domicile,
      undefined,
      undefined,
      Detriment,
      undefined,
      undefined,
      Detriment,
    ],
    [Planet.Venus]: [
      Detriment,
      Domicile,
      undefined,
      undefined,
      undefined,
      Fall,
      Domicile,
      Detriment,
      undefined,
      undefined,
      undefined,
      Exaltation,
    ],
    [Planet.Mars]: [
      Domicile,
      Detriment,
      undefined,
      Fall,
      undefined,
      undefined,
      Detriment,
      Domicile,
      undefined,
      Exaltation,
      undefined,
      undefined,
    ],
    [Planet.Jupiter]: [
      undefined,
      undefined,
      Detriment,
      Exaltation,
      undefined,
      Detriment,
      undefined,
      undefined,
      Domicile,
      Fall,
      undefined,
      Domicile,
    ],
    [Planet.Saturn]: [
      Fall,
      undefined,
      undefined,
      Detriment,
      Detriment,
      undefined,
      Exaltation,
      undefined,
      undefined,
      Domicile,
      Domicile,
      undefined,
    ],
  };

  for (const planet of planets) {
    it(`knows the dignities of ${Planet[planet]}`, () => {
      for (const sign of signs) {
        assert.equal(
          dignity(planet, sign * 30 + 15),
          table[planet][sign],
          `${Planet[planet]} in ${Sign[sign]}`,
        );
      }
    });
  }

  it('treats a sign as starting at 0° and ending just before 30°', () => {
    assert.equal(dignity(Planet.Sun, 0), Exaltation);
    assert.equal(dignity(Planet.Sun, 29.999), Exaltation);
    assert.equal(dignity(Planet.Sun, 30), undefined);
    assert.equal(dignity(Planet.Sun, 120), Domicile);
    assert.equal(dignity(Planet.Sun, 149.999), Domicile);
    assert.equal(dignity(Planet.Jupiter, 359.999), Domicile);
  });

  it('puts every domicile opposite a detriment and every exaltation opposite a fall', () => {
    const opposite = {
      [Domicile]: Detriment,
      [Detriment]: Domicile,
      [Exaltation]: Fall,
      [Fall]: Exaltation,
    };
    for (const planet of planets) {
      for (const sign of signs) {
        const here = dignity(planet, sign * 30);
        const there = dignity(planet, ((sign + 6) % 12) * 30);
        assert.equal(there, here && opposite[here]);
      }
    }
  });

  it('rejects a longitude outside [0, 360)', () => {
    assert.throws(() => dignity(Planet.Sun, 360), /sign not found/);
    assert.throws(() => dignity(Planet.Sun, -1), /sign not found/);
    assert.throws(() => dignity(Planet.Sun, NaN), /sign not found/);
  });
});

describe('houseSystems', () => {
  it('lists every house system once', () => {
    assert.deepEqual(
      houseSystems.map((h) => h.value).sort(),
      Object.values(HouseSystem).sort(),
    );
  });
});
