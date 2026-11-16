import { Planet, SwEph } from './sweph';

const DAY_MS = 1000 * 60 * 60 * 24;
// The Moon gains at most ~15° a day on any other body, so a daily sample cannot
// step over a conjunction.
const STEP_MS = DAY_MS;
// The separation is close to linear within a day, so a few interpolation steps
// pin a conjunction down to well under a second.
const REFINE_ITERATIONS = 4;
// The search runs on the main thread. This many positions (one per planet per
// day) take up to about two seconds, so longer periods are cut short.
const MAX_SAMPLES = 25_000;

export type Conjunction = {
  time: Date;
  a: Planet;
  b: Planet;
  angle: number;
};

/** End of the period actually searched, which is cut short when too long. */
export function conjunctionSearchEnd(
  planetCount: number,
  start: Date,
  end: Date,
): Date {
  const maxDays = Math.floor(MAX_SAMPLES / Math.max(planetCount, 1));
  const maxEnd = start.getTime() + maxDays * DAY_MS;
  return end.getTime() > maxEnd ? new Date(maxEnd) : end;
}

/**
 * Finds every moment in the period when two of the planets share the same
 * longitude: where the signed difference of their longitudes crosses zero.
 */
export function findConjunctions(
  sweph: SwEph,
  planets: Planet[],
  start: Date,
  end: Date,
): Conjunction[] {
  if (planets.length < 2) return [];

  const planetList = [...planets].sort();
  const endMs = conjunctionSearchEnd(planets.length, start, end).getTime();

  const longitude = (planet: Planet, time: number) => {
    const { jd, err } = sweph.jd(new Date(time));
    if (err) throw new Error(err);
    const { lon, err: err2 } = sweph.planetLon(jd, planet);
    if (err2) throw new Error(err2);
    return lon;
  };

  const times: number[] = [];
  for (let t = start.getTime(); t < endMs; t += STEP_MS) times.push(t);
  times.push(endMs);

  // Times in the outer loop: the library reuses work between planets at the
  // same instant.
  const positions = new Map(
    planetList.map((planet) => [planet, [] as number[]]),
  );
  for (const time of times) {
    for (const [planet, lons] of positions) lons.push(longitude(planet, time));
  }

  const results: Conjunction[] = [];
  for (let i = 0; i < planetList.length; i++) {
    for (let j = i + 1; j < planetList.length; j++) {
      const a = planetList[i];
      const b = planetList[j];
      const posA = positions.get(a);
      const posB = positions.get(b);
      if (!posA || !posB) throw new Error('Missing planet positions');
      const separation = (time: number) =>
        signedSeparation(longitude(a, time), longitude(b, time));

      for (let k = 0; k < times.length - 1; k++) {
        const sep0 = signedSeparation(posA[k], posB[k]);
        const sep1 = signedSeparation(posA[k + 1], posB[k + 1]);
        if (!crossesZero(sep0, sep1)) continue;

        let lo = times[k];
        let hi = times[k + 1];
        let sepLo = sep0;
        let sepHi = sep1;
        const interpolate = () => lo - (sepLo * (hi - lo)) / (sepHi - sepLo);
        for (let n = 0; n < REFINE_ITERATIONS; n++) {
          const mid = interpolate();
          const sepMid = separation(mid);
          if (crossesZero(sepLo, sepMid)) {
            hi = mid;
            sepHi = sepMid;
          } else {
            lo = mid;
            sepLo = sepMid;
          }
        }
        const time = interpolate();
        results.push({ time: new Date(time), a, b, angle: longitude(a, time) });
      }
    }
  }

  results.sort((x, y) => x.time.getTime() - y.time.getTime());

  return results;
}

/** Difference between two longitudes, in the range (-180, 180] degrees. */
function signedSeparation(lon1: number, lon2: number): number {
  const diff = (((lon1 - lon2) % 360) + 360) % 360;
  return diff > 180 ? diff - 360 : diff;
}

/**
 * Whether the separation passes through 0° between two samples. The sign also
 * flips at an opposition, where it jumps between -180° and 180°, so a large
 * jump is not a crossing.
 */
function crossesZero(sep0: number, sep1: number): boolean {
  const signFlips = (sep0 < 0 && sep1 >= 0) || (sep0 > 0 && sep1 <= 0);
  return signFlips && Math.abs(sep1 - sep0) < 180;
}
