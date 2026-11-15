import { useCallback, useMemo, useState } from 'react';
import { useSweph } from '../context/SwephContext';
import {
  stringCodec,
  usePersistentState,
  type Codec,
} from '../hooks/usePersistentState';
import type { CanvasSize } from '../lib/canvasSize';
import { computeChart, drawChart } from '../lib/chart';
import {
  fromZonedInputs,
  localTimezone,
  supportedTimezones,
  toZonedInputs,
} from '../lib/dates';
import type { HouseSystem } from '../lib/sweph';
import { Button } from './Button';
import { Canvas } from './Canvas';
import { Card } from './Card';
import { Field, inputClass } from './Field';
import { MapPinIcon } from './icons';
import { PositionsModal } from './PositionsModal';

const GEOLAT_KEY = 'default.geolat';
const GEOLON_KEY = 'default.geolon';
const TIME_KEY = 'default.time';
const TIMEZONE_KEY = 'default.timezone';

const DEFAULT_GEOLAT = -19 - 55 / 60;
const DEFAULT_GEOLON = -43 - 56 / 60;

const dateCodec: Codec<Date> = {
  parse: (raw) => {
    const time = parseInt(raw);
    return Number.isNaN(time) ? undefined : new Date(time);
  },
  serialize: (date) => date.valueOf().toString(),
};

interface ChartViewProps {
  size: CanvasSize;
  houseSystem: HouseSystem;
}

export function ChartView({ size, houseSystem }: ChartViewProps) {
  const sweph = useSweph();

  const [date, setDate] = usePersistentState(
    TIME_KEY,
    () => new Date(),
    dateCodec,
  );
  const [timezone, setTimezone] = usePersistentState(
    TIMEZONE_KEY,
    localTimezone,
    stringCodec,
  );
  // The date and time inputs hold wall-clock time in the selected time zone.
  // They are kept as typed, since they can be incomplete while being edited.
  const [inputs, setInputs] = useState(() => toZonedInputs(date, timezone));
  const [lat, setLat] = usePersistentState(
    GEOLAT_KEY,
    () => DEFAULT_GEOLAT.toFixed(2),
    stringCodec,
  );
  const [lon, setLon] = usePersistentState(
    GEOLON_KEY,
    () => DEFAULT_GEOLON.toFixed(2),
    stringCodec,
  );
  const [showTable, setShowTable] = useState(false);
  const closeTable = useCallback(() => setShowTable(false), []);

  const geolat = Number(lat);
  const geolon = Number(lon);

  const chart = useMemo(() => {
    try {
      return computeChart(sweph, date, geolat, geolon, houseSystem);
    } catch (e) {
      console.error('Failed to compute chart', e);
      return null;
    }
  }, [sweph, date, geolat, geolon, houseSystem]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (chart) drawChart(ctx, chart, size);
    },
    [chart, size],
  );

  const updateDateTime = (next: typeof inputs, tz: string) => {
    setInputs(next);
    const nextDate = fromZonedInputs(next.date, next.time, tz);
    if (nextDate) setDate(nextDate);
  };

  const handleTimezoneChange = (tz: string) => {
    setTimezone(tz);
    updateDateTime(inputs, tz);
  };

  const handleCurrentPosition = () => {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setLat(coords.latitude.toFixed(2));
      setLon(coords.longitude.toFixed(2));
    });
  };

  const timezones = supportedTimezones.includes(timezone)
    ? supportedTimezones
    : [timezone, ...supportedTimezones];

  return (
    <div className="flex flex-col items-center gap-3 lg:flex-row lg:items-start lg:justify-center lg:gap-4">
      <div className="flex flex-col items-center gap-3">
        <Canvas
          className="border-slate-800 bg-slate-950/60 md:rounded-xl md:border"
          width={size.width}
          height={size.height}
          draw={draw}
        />

        <Button disabled={!chart} onClick={() => setShowTable(true)}>
          Positions table
        </Button>
      </div>

      <div className="grid w-full gap-3 px-2 sm:grid-cols-2 md:px-0 lg:w-80 lg:grid-cols-1">
        <Card
          title="Date & time"
          action={
            <Button
              size="sm"
              onClick={() =>
                updateDateTime(toZonedInputs(new Date(), timezone), timezone)
              }
            >
              Now
            </Button>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input
                type="date"
                className={inputClass}
                value={inputs.date}
                onChange={(e) =>
                  updateDateTime({ ...inputs, date: e.target.value }, timezone)
                }
              />
            </Field>
            <Field label="Time">
              <input
                type="time"
                className={inputClass}
                value={inputs.time}
                onChange={(e) =>
                  updateDateTime({ ...inputs, time: e.target.value }, timezone)
                }
              />
            </Field>
            {supportedTimezones.length > 0 && (
              <Field label="Time zone" className="col-span-2">
                <select
                  className={inputClass}
                  value={timezone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>
        </Card>

        <Card
          title="Location"
          action={
            'geolocation' in navigator && (
              <Button size="sm" onClick={handleCurrentPosition}>
                <MapPinIcon />
                Use my location
              </Button>
            )
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude (°N)">
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </Field>
            <Field label="Longitude (°E)">
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={lon}
                onChange={(e) => setLon(e.target.value)}
              />
            </Field>
          </div>
        </Card>
      </div>

      {showTable && chart && (
        <PositionsModal chart={chart} onClose={closeTable} />
      )}
    </div>
  );
}
