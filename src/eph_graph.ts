import { Planet, SwEph, signGlyph } from "./sweph";

export interface EphGraphConfig {
  range: [Date, Date];
  planets: Planet[];
  width: number;
  height: number;
  radius: number;
}

export class EphGraph {
  colors: Map<Planet, string> = new Map([
    [Planet.Sun, "#FFA500"],
    [Planet.Moon, "#5555FF"],
    [Planet.Mercury, "#AAAAAA"],
    [Planet.Venus, "#00CCFF"],
    [Planet.Mars, "#AA0000"],
    [Planet.Jupiter, "#FFFF00"],
    [Planet.Saturn, "#800080"],
  ]);
  pts = new Map<number, [[number, number], Date, number, string][]>();
  hasDescription = false;

  constructor(
    private ctx: CanvasRenderingContext2D,
    private sweph: SwEph,
    private cfg: EphGraphConfig
  ) {}

  setCfg(cfg: Partial<EphGraphConfig>) {
    if (cfg.range) this.cfg.range = cfg.range;
    if (cfg.planets) this.cfg.planets = cfg.planets;
    if (cfg.width) this.cfg.width = cfg.width;
    if (cfg.height) this.cfg.height = cfg.height;
    if (cfg.radius) this.cfg.radius = cfg.radius;
  }

  // pointDescription displays on a floating square the date and angle of the
  // point at (x, y).
  pointDescription(x: number, y: number) {
    const hash = this.hashXY(x, y);
    const points = this.pts.get(hash);
    if (!points) {
      if (this.hasDescription) {
        this.hasDescription = false;
        this.render(true);
      }
      return;
    }

    this.hasDescription = true;
    this.render(true);

    const [[pX, pY], time, lon] = points[0];

    this.ctx.strokeStyle = "#00CCCC";
    this.ctx.beginPath();
    this.ctx.arc(pX, pY, 4, 0, 2 * Math.PI);
    this.ctx.closePath();
    this.ctx.stroke();

    const w = 75;
    const h = 30;
    const pad = 20;
    let x0 = x + pad;
    let y0 = y - pad / 2;
    if (x0 + 75 > this.cfg.width) {
      x0 = x - w - pad;
    }
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.strokeStyle = "#FFFFFF";
    this.ctx.fillRect(x0, y0, w, h);
    this.ctx.strokeRect(x0, y0, w, h);
    this.ctx.fillStyle = "#000000";
    this.ctx.textAlign = "left";
    this.ctx.font = "20px glyphsFont";
    this.ctx.fillText(signGlyph[Math.floor(lon / 30)], x0 + 2, y0 + 2 + 12);
    this.ctx.font = "12px Arial";
    const fullAng = lon % 30;
    const ang = Math.floor(fullAng);
    const min = Math.floor((fullAng - ang) * 60);
    this.ctx.fillText(`${ang}°${min}'`, x0 + 2 + 20, y0 + 2 + 12);
    const d = new Date(time);
    this.ctx.fillText(d.toISOString().slice(0, 10), x0 + 2, y0 + 2 + 24);
  }

  private hashXY(x: number, y: number): number {
    const pad = 10;
    const x5 = Math.round(x / pad) * pad;
    const y5 = Math.round(y / pad) * pad;
    return x5 * 1000 + y5;
  }

  render(noNewCfg = false) {
    // reset canvas
    (this.ctx as unknown as any).reset();
    const pad = 20;
    const originX = pad;
    const originY = this.cfg.height - pad;
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.strokeStyle = "#FFFFFF";
    this.ctx.moveTo(originX, originY);
    this.ctx.lineTo(originX, pad);
    this.ctx.moveTo(originX, originY);
    this.ctx.lineTo(this.cfg.width - pad, originY);
    this.ctx.stroke();

    this.ctx.font = "12px sans-serif";
    this.ctx.textAlign = "right";
    this.ctx.fillText("Time", this.cfg.width - pad, originY + pad);
    this.ctx.textAlign = "left";
    this.ctx.fillText("Angle", originX - pad, pad / 2);

    const args = this.cfg.planets.map((planet) => {
      const color = this.colors.get(planet);
      if (!color) throw new Error(`no color for planet ${planet}`);
      return { planet, color };
    });
    if (!noNewCfg) {
      this.pts.clear();
      for (const { planet, color } of args) {
        const n = 200;
        const step = (this.cfg.width - 2 * pad) / n;
        const t0 = this.cfg.range[0].getTime();
        const t1 = this.cfg.range[1].getTime();
        const dt = (t1 - t0) / n;
        for (let i = 0; i < n; i++) {
          const t = t0 + i * dt;
          const date = new Date(t);
          const { jd, err } = this.sweph.jd(date);
          if (err) throw err; // TODO: handle this error
          const { lon, err: err2 } = this.sweph.planetPos(jd, planet);
          if (err2) throw err2; // TODO: handle this error
          const x = originX + i * step;
          const y = originY - (lon * (this.cfg.height - 2 * pad)) / 360;
          const hash = this.hashXY(x, y);
          const exists = this.pts.get(hash);
          if (exists) {
            exists.push([[x, y], date, lon, color]);
          } else {
            this.pts.set(this.hashXY(x, y), [[[x, y], date, lon, color]]);
          }
        }
      }
    }
    for (const [_, points] of this.pts) {
      for (const v of points) {
        const [[x, y], _d, _lon, color] = v;
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 1, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.fill();
      }
    }
  }
}
