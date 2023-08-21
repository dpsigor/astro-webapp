import {
  Dignity,
  HouseSystem,
  Planet,
  SwEph,
  dignity,
  planetGlyph,
  planets,
  signGlyph,
} from "./sweph";

export interface Opts {
  date: Date;
  width: number;
  height: number;
  radius: number;
  geolat: number;
  geolon: number;
}

export class Chart {
  private date: Date;
  private geolat: number;
  private geolon: number;
  private width: number;
  private height: number;
  private radius: number;

  planetPositions = new Map<
    Planet,
    {
      rads: number;
      lon: number;
      slon: number;
      x: number;
      y: number;
    }
  >();
  houses = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  constructor(
    private ctx: CanvasRenderingContext2D,
    private sweph: SwEph,
    opts: Opts
  ) {
    this.date = opts.date;
    this.geolat = opts.geolat;
    this.geolon = opts.geolon;
    this.width = opts.width;
    this.height = opts.height;
    this.radius = opts.radius;
  }

  private dignityColor(d?: Dignity) {
    if (!d) return "#00CCFF";
    switch (d) {
      case Dignity.Domicile:
        return "#00FF00";
      case Dignity.Exaltation:
        return "#FFFF00";
      case Dignity.Fall:
        return "#CD5C5C";
      case Dignity.Detriment:
        return "#FF0000";
      default:
        throw new Error(`Unknown dignity: ${d}`);
    }
  }

  render(opts: Partial<Opts>) {
    if (opts.date) this.date = opts.date;
    if (opts.geolat) this.geolat = opts.geolat;
    if (opts.geolon) this.geolon = opts.geolon;
    if (opts.width) this.width = opts.width;
    if (opts.height) this.height = opts.height;
    if (opts.radius) this.radius = opts.radius;
    if (1 === 1) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    const { jd, err } = this.sweph.jd(this.date);
    if (err) throw err; // TODO: handle this error
    this.ctx.strokeStyle = "#FFFFFF";
    this.ctx.beginPath();
    this.ctx.arc(this.width / 2, this.height / 2, this.radius, 0, 2 * Math.PI);
    this.ctx.stroke();

    const houses = this.sweph.houses(
      jd,
      this.geolat,
      this.geolon,
      HouseSystem.Placidus
    );
    this.houses = houses;

    const angleOffset = 180 + houses[0];

    // draw house lines
    {
      const innerCircleRadius = 20;
      this.ctx.beginPath();
      this.ctx.arc(
        this.width / 2,
        this.height / 2,
        innerCircleRadius,
        0,
        2 * Math.PI
      );
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      for (let i = 0; i < houses.length; i++) {
        let radius = this.radius;
        this.ctx.lineWidth = 1;
        if (!(i % 6) || !((i - 3) % 6)) {
          radius += 20;
          // make the stroke thicker
          this.ctx.lineWidth = 3;
        }
        const rads = ((angleOffset - houses[i]) * Math.PI) / 180;
        const x0 = this.width / 2 + innerCircleRadius * Math.cos(rads);
        const y0 = this.width / 2 + innerCircleRadius * Math.sin(rads);
        const x1 = this.width / 2 + radius * Math.cos(rads);
        const y1 = this.height / 2 + radius * Math.sin(rads);
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
        if (i === 0 || i === 9) {
          // draw arrow point
          const arrowSize = 15;
          [1, -1].forEach((v) => {
            const arrowRads = rads + v * Math.PI * 1.15;
            const x2 = x1 + arrowSize * Math.cos(arrowRads);
            const y2 = y1 + arrowSize * Math.sin(arrowRads);
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
          });
        }
      }
    }

    // write planets
    {
      this.ctx.font = "20px glyphsFont";
      this.ctx.textAlign = "center";
      const metrics = this.ctx.measureText("M");
      const fontHeight =
        metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
      const radiusPlanets = this.radius + 20;
      for (const planet of planets) {
        const glyph = planetGlyph[planet];
        const { lon, slon, err } = this.sweph.planetPos(jd, planet);
        if (err) throw err;
        this.ctx.fillStyle = this.dignityColor(dignity(planet, lon));
        const rads = ((angleOffset - lon) * Math.PI) / 180;
        const x = this.width / 2 + radiusPlanets * Math.cos(rads);
        let y = this.height / 2 + radiusPlanets * Math.sin(rads);
        this.planetPositions.set(planet, { x, y, rads, lon, slon });
        this.ctx.fillText(glyph, x, y + fontHeight / 4);
        // if retrograde, write an R
        if (slon < 0) {
          this.ctx.textAlign = "left";
          this.ctx.font = "10px Arial";
          this.ctx.fillText(
            "R",
            x + metrics.width / 2,
            y - metrics.fontBoundingBoxAscent / 2
          );
          this.ctx.font = "20px glyphsFont";
          this.ctx.textAlign = "center";
        }
        // small line from the planet to the circle
        const x0 = this.width / 2 + this.radius * Math.cos(rads);
        const y0 = this.height / 2 + this.radius * Math.sin(rads);
        let x1 = this.width / 2 + radiusPlanets * Math.cos(rads);
        let y1 = this.height / 2 + radiusPlanets * Math.sin(rads);
        const lineSize = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
        if (lineSize > 5) {
          const ftr = 8 / lineSize;
          x1 = x0 + (x1 - x0) * ftr;
          y1 = y0 + (y1 - y0) * ftr;
        }
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#00CCFF";
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
      }
    }

    // draw aspects
    {
      const arad = this.radius - 4;
      for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
          // compare each planet to the previous one
          const p1 = this.planetPositions.get(planets[i]);
          if (!p1) throw new Error(`planet at index ${i} not found`);
          const p2 = this.planetPositions.get(planets[j]);
          if (!p2) throw new Error(`planet at index ${i} not found`);
          const angle = (Math.abs(p1.rads - p2.rads) * 180) / Math.PI;
          const p1sign = Math.floor(p1.lon / 30);
          const p2sign = Math.floor(p2.lon / 30);
          const orb = 5;
          let color = "";
          if (p1sign === p2sign && angle < orb /* conjunct*/) {
            color = "#FFFF00";
          } else if (
            !(((p1sign - p2sign) % 2) /* sextile*/) &&
            ((angle > 60 - orb && angle < 60 + orb) ||
              (angle > 300 - orb && angle < 300 + orb))
          ) {
            color = "#00FFFF";
          } else if (
            !(((p1sign - p2sign) % 3) /* square*/) &&
            ((angle > 90 - orb && angle < 90 + orb) ||
              (angle > 270 - orb && angle < 270 + orb))
          ) {
            color = "#FF0000";
          } else if (
            !(((p1sign - p2sign) % 4) /* trine*/) &&
            ((angle > 120 - orb && angle < 120 + orb) ||
              (angle > 240 - orb && angle < 240 + orb))
          ) {
            color = "#00FF00";
          } else if (
            !(((p1sign - p2sign) % 6) /* opposition*/) &&
            angle > 180 - orb &&
            angle < 180 + orb
          ) {
            color = "#FF00FF";
          }
          if (!color) continue;
          this.ctx.beginPath();
          this.ctx.strokeStyle = color;
          const x1 = this.width / 2 + arad * Math.cos(p1.rads);
          const y1 = this.height / 2 + arad * Math.sin(p1.rads);
          const x2 = this.width / 2 + arad * Math.cos(p2.rads);
          const y2 = this.height / 2 + arad * Math.sin(p2.rads);
          this.ctx.moveTo(x1, y1);
          this.ctx.lineTo(x2, y2);
          this.ctx.stroke();
        }
      }
    }

    // draw sign lines and write sign symbols
    {
      this.ctx.font = "20px glyphsFont";
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.textAlign = "center";
      this.ctx.strokeStyle = "#FFFFFF";
      const metrics = this.ctx.measureText("M");
      const fontHeight =
        metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
      const radiusSign = this.radius + 40;
      for (let i = 0; i < signGlyph.length; i++) {
        const signRads = ((angleOffset - i * 30 - 15) * Math.PI) / 180;
        const x = this.width / 2 + radiusSign * Math.cos(signRads);
        let y = this.height / 2 + radiusSign * Math.sin(signRads);
        this.ctx.fillText(signGlyph[i], x, y + fontHeight / 4);
        const strokeRads = ((angleOffset - i * 30) * Math.PI) / 180;
        const x0 = this.width / 2 + this.radius * Math.cos(strokeRads);
        const y0 = this.height / 2 + this.radius * Math.sin(strokeRads);
        const x1 = this.width / 2 + (this.radius + 30) * Math.cos(strokeRads);
        const y1 = this.height / 2 + (this.radius + 30) * Math.sin(strokeRads);
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();
      }
    }
  }
}
