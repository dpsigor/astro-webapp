import { Subject } from 'rxjs';
import { SwEph, Planet } from './sweph';

const STEP_MS = 1000 * 60 * 60 * 4;
const MAX_PRECOMPUTE_ITERATIONS = 365 * 4 + 1; // 2 years

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
  private cfg: {
    planets: Set<Planet>;
    start: Date;
    end: Date;
  } = {
    planets: new Set(),
    start: new Date(),
    end: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 60),
  };

  constructor(
    private sweph: SwEph,
    private ephs: Subject<Ephemeris>,
  ) {}

  setFullCfg(cfg: { planets?: Planet[]; range?: [Date, Date] }) {
    if (!cfg.range) {
      cfg.range = [this.cfg.start, this.cfg.end];
    }
    if (!cfg.planets) cfg.planets = Array.from(this.cfg.planets);
    if (cfg.planets.sort().join(',') === Array.from(this.cfg.planets).sort().join(',')) {
      cfg.planets = undefined;
    }
    if (cfg.range[0].getTime() === this.cfg.start.getTime() &&
      cfg.range[1].getTime() === this.cfg.end.getTime()) {
      cfg.range = undefined;
    }
    if (!cfg.planets && !cfg.range) {
      return
    }
    if (cfg.planets) {
      this.cfg.planets = new Set(cfg.planets);
    }
    if (cfg.range) {
      this.cfg.start = cfg.range[0];
      this.cfg.end = cfg.range[1];
    }
    this.reevaluate();
  }

  private reevaluate() {
    this.ephs.next({
      events: calculate(
        this.sweph,
        this.cfg.planets,
        this.cfg.start,
        this.cfg.end,
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
      break
    }
    const { jd, err } = sweph.jd(d);
    if (err) throw new Error(err);
    jds.push(jd);
    dates.push(new Date(d));
    d = new Date(d.getTime() + STEP_MS);
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
      for (let k = 1; k < jds.length - 1; k++) {
        const sep0 = separationAngle(posA[k - 1], posB[k - 1]);
        const sep1 = separationAngle(posA[k], posB[k]);
        const sep2 = separationAngle(posA[k + 1], posB[k + 1]);
        const isMinimum = sep1 < sep0 && sep1 < sep2;
        if (isMinimum && Math.abs(sep1) < 10) {
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

// separationAngle returns the angle between two planets, normalized to the
// range [0, 180] degrees.
function separationAngle(angle1: number, angle2: number): number {
  let diff = Math.abs(angle1 - angle2) % 360;
  if (diff > 180) {
    diff = 360 - diff;
  }
  return diff;
}
