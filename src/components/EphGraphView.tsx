import { useCallback, useMemo, useState } from 'react';
import { z } from 'zod';
import { useSweph } from '../context/SwephContext';
import { usePersistentState, type Codec } from '../hooks/usePersistentState';
import type { CanvasSize } from '../lib/canvasSize';
import { conjunctionSearchEnd, findConjunctions } from '../lib/conjunctions';
import { toDateInput } from '../lib/dates';
import {
  computeGraphPoints,
  drawEphGraph,
  drawPointDescription,
  findGraphPoint,
  planetColors,
  type GraphPoints,
} from '../lib/ephGraph';
import { Planet, planetGlyph, planets as allPlanets } from '../lib/sweph';
import { Canvas } from './Canvas';
import { Card } from './Card';
import { Field, inputClass } from './Field';
import { ConjunctionsTable } from './ConjunctionsTable';

const CFG_KEY = 'ephGraphCfg';

interface EphGraphCfg {
  range: [Date, Date];
  planets: Planet[];
}

const storedCfgSchema = z.object({
  range: z.tuple([z.string(), z.string()]),
  planets: z.array(z.number()),
});

const cfgCodec: Codec<EphGraphCfg> = {
  parse: (raw) => {
    try {
      const stored = storedCfgSchema.parse(JSON.parse(raw));
      const range = parseRange(...stored.range);
      if (!range) return undefined;
      return {
        range,
        planets: allPlanets.filter((p) => stored.planets.includes(p)),
      };
    } catch (e) {
      console.error('Failed to parse cached eph graph config', e);
      return undefined;
    }
  },
  serialize: (cfg) => JSON.stringify(cfg),
};

function defaultCfg(): EphGraphCfg {
  const start = new Date();
  const end = new Date();
  end.setFullYear(end.getFullYear() + 1);
  return { range: [start, end], planets: [] };
}

/** Parses a date range, or returns null unless it is two dates in order. */
function parseRange(start: string, end: string): [Date, Date] | null {
  const range: [Date, Date] = [new Date(start), new Date(end)];
  if (range.some((d) => Number.isNaN(d.getTime()))) return null;
  return range[0] < range[1] ? range : null;
}

export function EphGraphView({ size }: { size: CanvasSize }) {
  const sweph = useSweph();

  const [cfg, setCfg] = usePersistentState(CFG_KEY, defaultCfg, cfgCodec);
  const { range, planets } = cfg;
  // The date inputs are kept as typed: they only become the range once valid.
  const [inputs, setInputs] = useState(() => ({
    start: toDateInput(range[0]),
    end: toDateInput(range[1]),
  }));
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  const points = useMemo<GraphPoints>(() => {
    try {
      return computeGraphPoints(sweph, planets, range, size);
    } catch (e) {
      console.error('Failed to compute ephemeris graph', e);
      return new Map();
    }
  }, [sweph, planets, range, size]);

  const conjunctions = useMemo(() => {
    try {
      return findConjunctions(sweph, planets, range[0], range[1]);
    } catch (e) {
      console.error('Failed to compute conjunctions', e);
      return [];
    }
  }, [sweph, planets, range]);

  const searchEnd = conjunctionSearchEnd(planets.length, range[0], range[1]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      drawEphGraph(ctx, points, size);
      const point = pointer && findGraphPoint(points, pointer.x, pointer.y);
      if (point) drawPointDescription(ctx, point, pointer.x, pointer.y, size);
    },
    [points, pointer, size],
  );

  const handleRangeChange = (next: typeof inputs) => {
    setInputs(next);
    const nextRange = parseRange(next.start, next.end);
    if (nextRange) setCfg({ ...cfg, range: nextRange });
  };

  const handlePlanetToggle = (planet: Planet, checked: boolean) => {
    setCfg({
      ...cfg,
      planets: allPlanets.filter((p) =>
        p === planet ? checked : planets.includes(p),
      ),
    });
  };

  const rangeOutOfOrder =
    inputs.start !== '' && inputs.end !== '' && inputs.start >= inputs.end;

  return (
    <div className="flex flex-col items-center gap-3 lg:flex-row lg:items-start lg:justify-center lg:gap-4">
      <Canvas
        className="border-slate-800 bg-slate-950/60 md:rounded-xl md:border"
        width={size.width}
        height={size.height}
        draw={draw}
        onMouseMove={({ nativeEvent: { offsetX: x, offsetY: y } }) =>
          setPointer(findGraphPoint(points, x, y) ? { x, y } : null)
        }
      />

      <div className="flex w-full flex-col gap-3 px-2 md:px-0 lg:w-96">
        <Card title="Period & planets">
          <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
            <Field label="From">
              <input
                type="date"
                className={inputClass}
                value={inputs.start}
                onChange={(e) =>
                  handleRangeChange({ ...inputs, start: e.target.value })
                }
              />
            </Field>
            <Field label="To">
              <input
                type="date"
                className={inputClass}
                value={inputs.end}
                onChange={(e) =>
                  handleRangeChange({ ...inputs, end: e.target.value })
                }
              />
            </Field>
          </div>
          {rangeOutOfOrder && (
            <p role="alert" className="mt-2 text-left text-sm text-rose-400">
              Start date must be before end date
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {allPlanets.map((planet) => {
              const checked = planets.includes(planet);
              return (
                <label
                  key={planet}
                  title={Planet[planet]}
                  // a checked planet takes the color of its line in the graph
                  style={
                    checked
                      ? {
                          color: planetColors[planet],
                          borderColor: planetColors[planet],
                        }
                      : undefined
                  }
                  className={`flex size-10 cursor-pointer items-center justify-center rounded-full border font-glyphs text-xl transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-indigo-400 ${
                    checked
                      ? 'bg-slate-800'
                      : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    aria-label={Planet[planet]}
                    checked={checked}
                    onChange={(e) =>
                      handlePlanetToggle(planet, e.target.checked)
                    }
                  />
                  {planetGlyph[planet]}
                </label>
              );
            })}
          </div>
        </Card>
        <ConjunctionsTable
          conjunctions={conjunctions}
          searchedUntil={searchEnd < range[1] ? searchEnd : undefined}
        />
      </div>
    </div>
  );
}
