import { HouseSystem, SwEph, planetSign, planets, signs } from "./sweph";

export class Chart {
  date = new Date();
  private geolat = -19 - 55 / 60;
  private geolon = -43 - 56 / 60;

  constructor(
    private ctx: CanvasRenderingContext2D,
    private sweph: SwEph,
    private width: number,
    private height: number,
    private radius: number
  ) {}

  setGeopos(lat: number, lon: number) {
    this.geolat = lat;
    this.geolon = lon;
    this.render(this.date);
  }

  render(date: Date) {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.date = date;
    const { jd, err } = this.sweph.jd(date);
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

    const angleOffset = 180 + houses[0];

    this.ctx.font = "20px Arial";
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.textAlign = "center";

    // draw house lines
    for (let i = 0; i < houses.length; i++) {
      const rads = ((angleOffset - houses[i]) * Math.PI) / 180;
      this.ctx.moveTo(this.width / 2, this.height / 2);
      const x = this.width / 2 + this.radius * Math.cos(rads);
      const y = this.height / 2 + this.radius * Math.sin(rads);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    }

    // write planets
    const radiusPlanets = this.radius + 20;
    for (const planet of planets) {
      const sign = planetSign[planet];
      const { lon, err } = this.sweph.planetPos(jd, planet);
      if (err) throw err;
      const rads = ((angleOffset - lon) * Math.PI) / 180;
      const x = this.width / 2 + radiusPlanets * Math.cos(rads);
      const y = this.height / 2 + radiusPlanets * Math.sin(rads);
      this.ctx.fillText(sign, x, y);
    }

    // draw sign lines and write sign symbols
    const radiusSign = this.radius + 35;
    for (let i = 0; i < signs.length; i++) {
      const signRads = ((angleOffset - i * 30 - 15) * Math.PI) / 180;
      const x = this.width / 2 + radiusSign * Math.cos(signRads);
      const y = this.height / 2 + radiusSign * Math.sin(signRads);
      this.ctx.fillText(signs[i], x, y);
      const strokeRads = ((angleOffset - i * 30) * Math.PI) / 180;
      const x0 = this.width / 2 + this.radius * Math.cos(strokeRads);
      const y0 = this.height / 2 + this.radius * Math.sin(strokeRads);
      const x1 = this.width / 2 + (this.radius + 30) * Math.cos(strokeRads);
      const y1 = this.height / 2 + (this.radius + 30) * Math.sin(strokeRads);
      this.ctx.moveTo(x0, y0);
      this.ctx.lineTo(x1, y1);
      this.ctx.stroke();
    }
  }
}
