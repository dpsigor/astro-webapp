import {
  Dignity,
  HouseSystem,
  Planet,
  SwEph,
  dignity,
  northNodeGlyph,
  partFortuneGlyph,
  planetGlyph,
  planets,
  signGlyph,
  southNodeGlyph,
} from './sweph';
import type { CanvasSize } from './canvasSize';

export interface ChartData {
  /** House cusps, in degrees. Index 0 is the first house. */
  houses: number[];
  /** Ascendant, in degrees. */
  asc: number;
  /** Midheaven, in degrees. */
  mc: number;
  positions: Map<Planet, { lon: number; slon: number }>;
  /** Optional non-planet points, such as the nodes. They form no aspects. */
  points: ChartPoint[];
}

export interface ChartPoint {
  /** Character in the glyph font. */
  glyph: string;
  /** Plain-text name for tables. */
  label: string;
  lon: number;
}

export interface ChartOptions {
  houseSystem: HouseSystem;
  partOfFortune: boolean;
  nodes: boolean;
}

const norm360 = (lon: number) => ((lon % 360) + 360) % 360;

/** Asc + Moon - Sun by day, Asc + Sun - Moon by night. */
export function partOfFortune(asc: number, sun: number, moon: number) {
  // houses 7 to 12, the half of the ecliptic after the descendant, are above
  // the horizon
  const isDay = norm360(sun - asc) >= 180;
  return norm360(isDay ? asc + moon - sun : asc + sun - moon);
}

export function computeChart(
  sweph: SwEph,
  date: Date,
  geolat: number,
  geolon: number,
  { houseSystem, partOfFortune: showFortune, nodes: showNodes }: ChartOptions,
): ChartData {
  const { jd, err } = sweph.jd(date);
  if (err) throw new Error(err);
  const {
    cusps: houses,
    asc,
    mc,
  } = sweph.houses(jd, geolat, geolon, houseSystem);
  const positions: ChartData['positions'] = new Map();
  for (const planet of planets) {
    const { lon, slon, err } = sweph.planetPos(jd, planet);
    if (err) throw new Error(err);
    positions.set(planet, { lon, slon });
  }
  const points: ChartPoint[] = [];
  if (showNodes) {
    const { lon, err } = sweph.northNodeLon(jd);
    if (err) throw new Error(err);
    points.push(
      { glyph: northNodeGlyph, label: 'North node', lon },
      { glyph: southNodeGlyph, label: 'South node', lon: norm360(lon + 180) },
    );
  }
  const sun = positions.get(Planet.Sun);
  const moon = positions.get(Planet.Moon);
  if (showFortune && sun && moon) {
    points.push({
      glyph: partFortuneGlyph,
      label: 'Part of Fortune',
      lon: partOfFortune(asc, sun.lon, moon.lon),
    });
  }
  return { houses, asc, mc, positions, points };
}

function dignityColor(d?: Dignity) {
  if (!d) return '#00CCFF';
  switch (d) {
    case Dignity.Domicile:
      return '#00FF00';
    case Dignity.Exaltation:
      return '#FFFF00';
    case Dignity.Fall:
      return '#CD5C5C';
    case Dignity.Detriment:
      return '#FF0000';
    default:
      throw new Error(`Unknown dignity: ${d}`);
  }
}

/** Draws the chart wheel on a cleared canvas. */
export function drawChart(
  ctx: CanvasRenderingContext2D,
  { houses, asc, mc, positions, points }: ChartData,
  { width, height, radius }: CanvasSize,
) {
  const cx = width / 2;
  const cy = height / 2;

  ctx.strokeStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.stroke();

  // the ascendant points left
  const angleOffset = 180 + asc;

  // draw house lines, and the ASC-DSC and MC-IC axes over them
  {
    const innerCircleRadius = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, innerCircleRadius, 0, 2 * Math.PI);
    ctx.lineWidth = 3;
    ctx.stroke();
    const drawLine = (lon: number, length: number, arrow = false) => {
      const rads = ((angleOffset - lon) * Math.PI) / 180;
      const x1 = cx + length * Math.cos(rads);
      const y1 = cy + length * Math.sin(rads);
      ctx.beginPath();
      ctx.moveTo(
        cx + innerCircleRadius * Math.cos(rads),
        cy + innerCircleRadius * Math.sin(rads),
      );
      ctx.lineTo(x1, y1);
      ctx.stroke();
      if (!arrow) return;
      const arrowSize = 15;
      [1, -1].forEach((v) => {
        const arrowRads = rads + v * Math.PI * 1.15;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(
          x1 + arrowSize * Math.cos(arrowRads),
          y1 + arrowSize * Math.sin(arrowRads),
        );
        ctx.stroke();
      });
    };
    ctx.lineWidth = 1;
    for (const cusp of houses) drawLine(cusp, radius);
    ctx.lineWidth = 3;
    for (const angle of [asc, mc]) {
      drawLine(angle, radius + 20, true);
      drawLine(angle + 180, radius + 20);
    }
    ctx.lineWidth = 1;
  }

  // write planets
  const planetRads = new Map<Planet, number>();
  {
    ctx.font = '20px glyphsFont';
    ctx.textAlign = 'center';
    const metrics = ctx.measureText('M');
    const fontHeight =
      metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
    const radiusPlanets = radius + 20;
    const drawBody = (
      glyph: string,
      lon: number,
      color: string,
      retrograde: boolean,
    ) => {
      ctx.fillStyle = color;
      const rads = ((angleOffset - lon) * Math.PI) / 180;
      const x = cx + radiusPlanets * Math.cos(rads);
      const y = cy + radiusPlanets * Math.sin(rads);
      ctx.fillText(glyph, x, y + fontHeight / 4);
      if (retrograde) {
        ctx.textAlign = 'left';
        ctx.font = '10px Arial';
        ctx.fillText(
          'R',
          x + metrics.width / 2,
          y - metrics.fontBoundingBoxAscent / 2,
        );
        ctx.font = '20px glyphsFont';
        ctx.textAlign = 'center';
      }
      // small line from the planet to the circle
      const x0 = cx + radius * Math.cos(rads);
      const y0 = cy + radius * Math.sin(rads);
      let x1 = x;
      let y1 = y;
      const lineSize = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
      if (lineSize > 5) {
        const ftr = 8 / lineSize;
        x1 = x0 + (x1 - x0) * ftr;
        y1 = y0 + (y1 - y0) * ftr;
      }
      ctx.beginPath();
      ctx.strokeStyle = '#00CCFF';
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      return rads;
    };
    for (const [planet, { lon, slon }] of positions) {
      const color = dignityColor(dignity(planet, lon));
      planetRads.set(
        planet,
        drawBody(planetGlyph[planet], lon, color, slon < 0),
      );
    }
    for (const { glyph, lon } of points)
      drawBody(glyph, lon, dignityColor(), false);
  }

  // draw aspects
  {
    const arad = radius - 4;
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const p1 = positions.get(planets[i]);
        const p2 = positions.get(planets[j]);
        const rads1 = planetRads.get(planets[i]);
        const rads2 = planetRads.get(planets[j]);
        if (!p1 || rads1 === undefined)
          throw new Error(`planet at index ${i} not found`);
        if (!p2 || rads2 === undefined)
          throw new Error(`planet at index ${j} not found`);
        const color = aspectColor(
          (Math.abs(rads1 - rads2) * 180) / Math.PI,
          Math.floor(p1.lon / 30),
          Math.floor(p2.lon / 30),
        );
        if (!color) continue;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.moveTo(cx + arad * Math.cos(rads1), cy + arad * Math.sin(rads1));
        ctx.lineTo(cx + arad * Math.cos(rads2), cy + arad * Math.sin(rads2));
        ctx.stroke();
      }
    }
  }

  // draw sign lines and write sign symbols
  {
    ctx.font = '20px glyphsFont';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#FFFFFF';
    const metrics = ctx.measureText('M');
    const fontHeight =
      metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
    const radiusSign = radius + 40;
    for (let i = 0; i < signGlyph.length; i++) {
      const signRads = ((angleOffset - i * 30 - 15) * Math.PI) / 180;
      const x = cx + radiusSign * Math.cos(signRads);
      const y = cy + radiusSign * Math.sin(signRads);
      ctx.fillText(signGlyph[i], x, y + fontHeight / 4);
      const strokeRads = ((angleOffset - i * 30) * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(
        cx + radius * Math.cos(strokeRads),
        cy + radius * Math.sin(strokeRads),
      );
      ctx.lineTo(
        cx + (radius + 30) * Math.cos(strokeRads),
        cy + (radius + 30) * Math.sin(strokeRads),
      );
      ctx.stroke();
    }
  }
}

/** Color of the aspect between two planets, or '' when they form none. */
export function aspectColor(
  angle: number,
  sign1: number,
  sign2: number,
): string {
  const orb = 5;
  const near = (target: number) => angle > target - orb && angle < target + orb;
  const signDiff = sign1 - sign2;
  if (sign1 === sign2 && angle < orb) return '#FFFF00'; // conjunction
  if (!(signDiff % 2) && (near(60) || near(300))) return '#00FFFF'; // sextile
  if (!(signDiff % 3) && (near(90) || near(270))) return '#FF0000'; // square
  if (!(signDiff % 4) && (near(120) || near(240))) return '#00FF00'; // trine
  if (!(signDiff % 6) && near(180)) return '#FF00FF'; // opposition
  return '';
}
