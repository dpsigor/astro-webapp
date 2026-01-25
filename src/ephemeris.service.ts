import { BehaviorSubject, Subject } from 'rxjs';
import { SwEph, Planet } from './sweph';

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
  private planets = new BehaviorSubject<Set<Planet>>(new Set<Planet>());
  private dateRange = new BehaviorSubject<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 30),
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

function calculate(
  sweph: SwEph,
  planets: Set<Planet>,
  start: Date,
  end: Date,
): EphemerisEvent[] {
  console.log(sweph, planets, start, end);
  return [];
}
