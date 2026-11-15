import { Planet, SwEph, signGlyph } from './sweph';
import type { CanvasSize } from './canvasSize';

const STEPS = 200;
const PAD = 20;
const BUCKET_SIZE = 10;

/** Color of each planet's line in the graph. */
export const planetColors: Record<Planet, string> = {
  [Planet.Sun]: '#FFA500',
  [Planet.Moon]: '#5555FF',
  [Planet.Mercury]: '#AAAAAA',
  [Planet.Venus]: '#00CCFF',
  [Planet.Mars]: '#AA0000',
  [Planet.Jupiter]: '#FFFF00',
  [Planet.Saturn]: '#800080',
};

export interface GraphPoint {
  x: number;
  y: number;
  date: Date;
  lon: number;
  color: string;
}

/** Plotted points, bucketed by canvas position so they can be found on hover. */
export type GraphPoints = Map<number, GraphPoint[]>;

function bucketOf(x: number, y: number): number {
  const bx = Math.round(x / BUCKET_SIZE) * BUCKET_SIZE;
  const by = Math.round(y / BUCKET_SIZE) * BUCKET_SIZE;
  return bx * 1000 + by;
}

/** Samples the longitude of each planet over the range, as canvas points. */
export function computeGraphPoints(
  sweph: SwEph,
  planets: Planet[],
  [start, end]: [Date, Date],
  { width, height }: CanvasSize,
): GraphPoints {
  const points: GraphPoints = new Map();
  const originX = PAD;
  const originY = height - PAD;
  const step = (width - 2 * PAD) / STEPS;
  const t0 = start.getTime();
  const dt = (end.getTime() - t0) / STEPS;
  for (const planet of planets) {
    const color = planetColors[planet];
    if (!color) throw new Error(`no color for planet ${planet}`);
    for (let i = 0; i < STEPS; i++) {
      const date = new Date(t0 + i * dt);
      const { jd, err } = sweph.jd(date);
      if (err) throw new Error(err);
      const { lon, err: err2 } = sweph.planetPos(jd, planet);
      if (err2) throw new Error(err2);
      const x = originX + i * step;
      const y = originY - (lon * (height - 2 * PAD)) / 360;
      const point = { x, y, date, lon, color };
      const bucket = points.get(bucketOf(x, y));
      if (bucket) {
        bucket.push(point);
      } else {
        points.set(bucketOf(x, y), [point]);
      }
    }
  }
  return points;
}

/** Finds a plotted point near the canvas position (x, y). */
export function findGraphPoint(
  points: GraphPoints,
  x: number,
  y: number,
): GraphPoint | undefined {
  return points.get(bucketOf(x, y))?.[0];
}

/** Draws the axes and the plotted points on a cleared canvas. */
export function drawEphGraph(
  ctx: CanvasRenderingContext2D,
  points: GraphPoints,
  { width, height }: CanvasSize,
) {
  const originX = PAD;
  const originY = height - PAD;
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(originX, PAD);
  ctx.moveTo(originX, originY);
  ctx.lineTo(width - PAD, originY);
  ctx.stroke();

  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Time', width - PAD, originY + PAD);
  ctx.textAlign = 'left';
  ctx.fillText('Angle', originX - PAD, PAD / 2);

  for (const bucket of points.values()) {
    for (const { x, y, color } of bucket) {
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fill();
    }
  }
}

/**
 * Highlights a point and draws a floating box with its date and angle next to
 * the pointer position (x, y).
 */
export function drawPointDescription(
  ctx: CanvasRenderingContext2D,
  point: GraphPoint,
  x: number,
  y: number,
  { width }: CanvasSize,
) {
  ctx.strokeStyle = '#00CCCC';
  ctx.beginPath();
  ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.stroke();

  const w = 75;
  const h = 30;
  const pad = 20;
  let x0 = x + pad;
  const y0 = y - pad / 2;
  if (x0 + w > width) {
    x0 = x - w - pad;
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FFFFFF';
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeRect(x0, y0, w, h);
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.font = '20px glyphsFont';
  ctx.fillText(signGlyph[Math.floor(point.lon / 30)], x0 + 2, y0 + 2 + 12);
  ctx.font = '12px Arial';
  const fullAng = point.lon % 30;
  const ang = Math.floor(fullAng);
  const min = Math.floor((fullAng - ang) * 60);
  ctx.fillText(`${ang}°${min}'`, x0 + 2 + 20, y0 + 2 + 12);
  ctx.fillText(point.date.toISOString().slice(0, 10), x0 + 2, y0 + 2 + 24);
}
