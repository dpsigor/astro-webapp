import { Planet, SwEph, signGlyph } from "./sweph";

export interface EphGraphConfig {
  range: [Date, Date];
  planet: Planet;
  width: number;
  height: number;
  radius: number;
}

export class EphGraph {
  pts = new Map<number , [[number,number],Date,number]>();
  hasDescription = false;

  constructor(
    private ctx: CanvasRenderingContext2D,
    private sweph: SwEph,
    private cfg: EphGraphConfig
  ) {}

  // pointDescription displays on a floating square the date and angle of the
  // point at (x, y).
  pointDescription(x: number, y: number) {
    const hash = this.hashXY(x, y);
    const point = this.pts.get(hash);
    if (!point) {
      if (this.hasDescription) {
        this.hasDescription = false;
        this.render();
      }
      return;
    }

    this.hasDescription = true;
    this.render();

    const [[pX,pY],time, lon] = point;

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

  render() {
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

    const n = 200;
    this.pts.clear();
    const step = (this.cfg.width - 2 * pad) / n;
    const t0 = this.cfg.range[0].getTime();
    const t1 = this.cfg.range[1].getTime();
    const dt = (t1 - t0) / n;
    for (let i = 0; i < n; i++) {
      const t = t0 + i * dt;
      const date = new Date(t);
      const { jd, err } = this.sweph.jd(date);
      if (err) throw err; // TODO: handle this error
      const { lon, err: err2 } = this.sweph.planetPos(jd, this.cfg.planet);
      if (err2) throw err2; // TODO: handle this error
      const x = originX + i * step;
      const y = originY - (lon * (this.cfg.height - 2 * pad)) / 360;
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.strokeStyle = "#FFFFFF";
      this.ctx.beginPath();
      this.ctx.arc(x, y, 1, 0, 2 * Math.PI);
      this.ctx.stroke();
      this.ctx.fill();
      this.pts.set(this.hashXY(x, y), [[x, y], date, lon]);
    }
  }
}
