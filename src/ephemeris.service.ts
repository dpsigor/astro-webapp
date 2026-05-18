import { BehaviorSubject, Subject } from 'rxjs';
import { SwEph, Planet } from './sweph';

const HALF_DAY_MS = 1000 * 60 * 60 * 12;
const MAX_PRECOMPUTE_ITERATIONS = 10000;

type EphemerisEvent = {
  time: Date;
  a: Planet;
  b: Planet;
  angle: number;
};

export type Ephemeris = {
  events: EphemerisEvent[];
};

export class EphemerisService {
  private planets = new BehaviorSubject<Set<Planet>>(new Set<Planet>([]));
  private dateRange = new BehaviorSubject<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 60),
  });

  constructor(
    private sweph: SwEph,
    private ephs: Subject<Ephemeris>,
  ) {
    this.planets.subscribe(() => {
      this.reevaluate();
    });
    this.dateRange.subscribe(() => {
      this.reevaluate();
    });
  }

  setPlanets(planets: Set<Planet>) {
    this.planets.next(planets);
  }

  setDateRange(start: Date, end: Date) {
    // TODO: validate start < end
    // TODO: validate range not too big
    this.dateRange.next({ start, end });
  }

  reevaluate() {
    this.ephs.next({
      events: calculate(
        this.sweph,
        this.planets.value,
        this.dateRange.value.start,
        this.dateRange.value.end,
      ),
    });
  }
}

let cacheKey = '';
let cachedResults: EphemerisEvent[] = [];

// Finding conjunctions in a multi-body system is essentially a "root-finding"
// problem. Since planets move at different angular velocities, we look for
// moments when the difference in their celestial longitudes is zero (modulo
// 360°).
//
// The Conjunction Search Algorithm
// To do this accurately, we use a "Bracket and Solve" approach. We can't just
// check every second (too slow) or every month (we’ll miss fast-moving planets
// like Mercury).
function calculate(
  sweph: SwEph,
  planets: Set<Planet>,
  start: Date,
  end: Date,
): EphemerisEvent[] {
  const newCacheKey = `${Array.from(planets).sort().join(',')}-${start.toISOString()}-${end.toISOString()}`;
  if (newCacheKey === cacheKey) {
    return cachedResults;
  }
  cacheKey = newCacheKey;

  if (planets.size < 2) {
    return [];
  }

  const planetList = Array.from(planets).sort();
  const results: EphemerisEvent[] = [];

  // Pre-computation and Setup
  const jds: number[] = [];
  const dates: Date[] = [];
  let d = new Date(start);
  let n = 0;
  while (d <= end) {
    n++;
    if (n > MAX_PRECOMPUTE_ITERATIONS) {
      throw new Error('Too many iterations in ephemeris calculation');
    }
    const { jd, err } = sweph.jd(d);
    if (err) throw new Error(err);
    jds.push(jd);
    dates.push(new Date(d));
    d = new Date(d.getTime() + HALF_DAY_MS);
  }

  const planetsPositions: Map<Planet, number[]> = new Map();
  for (const planet of planetList) {
    const positions: number[] = [];
    for (let i = 0; i < jds.length; i++) {
      const { lon, err } = sweph.planetPos(jds[i], planet);
      if (err) throw new Error(err);
      positions.push(lon);
    }
    planetsPositions.set(planet, positions);
  }

  // Bracketing Conjunctions
  for (let i = 0; i < planetList.length; i++) {
    for (let j = i + 1; j < planetList.length; j++) {
      const planetA = planetList[i];
      const planetB = planetList[j];
      const posA = planetsPositions.get(planetA);
      const posB = planetsPositions.get(planetB);
      if (!posA || !posB) throw new Error('Missing planet positions');

      for (let k = 1; k < jds.length; k++) {
        const angle1 = separationAngle(posA[k - 1], posB[k - 1]);
        const angle2 = separationAngle(posA[k], posB[k]);

        // Check for sign change indicating a conjunction
        if (angle1 * angle2 <= 0) {
          // TODO: Refine the conjunction time
          results.push({
            time: dates[k],
            a: planetA,
            b: planetB,
            angle: posA[k],
          });
        }
      }
    }
  }

  results.sort((a, b) => a.time.getTime() - b.time.getTime());

  cachedResults = results;

  return results;
}

function separationAngle(lon1: number, lon2: number): number {
  return (lon1 - lon2) % 360;
}
