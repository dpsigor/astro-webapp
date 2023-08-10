import "./style.css";
// import { WASI, File, OpenFile } from "@bjorn3/browser_wasi_shim";
import { init, WASI } from '@wasmer/wasi';

enum Planet {
  Sun = 0,
  Moon = 1,
  Mercury = 2,
  Venus = 3,
  Mars = 4,
  Jupiter = 5,
  Saturn = 6,
}

interface AstroExports {
  memory: WebAssembly.Memory;
  swe_calc_ut: (
    tjd_ut: number,
    ipl: number,
    iflag: number,
    xx: Float64Array,
    serr: Uint8Array
  ) => number;
  swe_utc_to_jd: (
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    gregflag: number,
    dret: Float64Array,
    serr: Uint8Array
  ) => number;
}

class PlanetPosition {
  xx: Float64Array = new Float64Array(6);
  constructor(xx?: Float64Array) {
    if (xx) this.xx = xx;
  }

  get longitude(): number {
    return this.xx[0];
  }
  get latitude(): number {
    return this.xx[1];
  }
  get distance(): number {
    return this.xx[2];
  }
  get speedLongitude(): number {
    return this.xx[3];
  }
  get speedLatitude(): number {
    return this.xx[4];
  }
  get speedDistance(): number {
    return this.xx[5];
  }
}

class SwEph {
  mem: WebAssembly.Memory;

  constructor(private exports: AstroExports, private iflag: number) {
    this.mem = exports.memory;
  }

  tjdUt(date: Date): { ok: true; tjd_ut: number } | { ok: false; err: string } {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds() + date.getUTCMilliseconds() / 1000;
    const gregflag = 1;
    const dret = new Float64Array(this.mem.buffer, 0, 2);
    const serr = new Uint8Array(this.mem.buffer, 2 * 8, 256);
    const code = this.exports.swe_utc_to_jd(
      year,
      month,
      day,
      hour,
      minute,
      second,
      gregflag,
      dret,
      serr
    );
    if (code < 0) return { ok: false, err: new TextDecoder().decode(serr) };
    return { ok: true, tjd_ut: dret[1] };
  }

  calc_ut(date: Date, ipl: Planet): { pos: PlanetPosition; err?: string } {
    const tjdUtRes = this.tjdUt(date);
    if (tjdUtRes.ok === false) {
      const err = `getting julian date: ${tjdUtRes.err}`;
      return { err, pos: new PlanetPosition() };
    }
    const tjd_ut = tjdUtRes.tjd_ut;
    const xx = new Float64Array(this.mem.buffer, 0, 6);
    const serr = new Uint8Array(this.mem.buffer, 6 * 8, 256);
    const code = this.exports.swe_calc_ut(tjd_ut, ipl, this.iflag, xx, serr);
    if (code < 0) {
      const err = `calculating: ${new TextDecoder().decode(serr)}`;
      return { err, pos: new PlanetPosition() };
    }
    return { pos: new PlanetPosition(xx) };
  }
}

async function newSweph(iflag: number): Promise<SwEph> {
  const args: string[] = [];
  const env: string[] = [];
  const fds = [
    new OpenFile(new File([])), // stdin
    new OpenFile(new File([])), // stdout
    new OpenFile(new File([])), // stderr
    // new PreopenDirectory(".", {
    //     "example.c": new File(new TextEncoder("utf-8").encode(`#include "a"`)),
    //     "hello.rs": new File(new TextEncoder("utf-8").encode(`fn main() { println!("Hello World!"); }`)),
    // }),
  ];
  const wasi = new WASI(args, env, fds);

  const wasm = await WebAssembly.compileStreaming(fetch("astro.wasm"));
  const inst = await WebAssembly.instantiate(wasm, {
    wasi_snapshot_preview1: wasi.wasiImport,
  });
  wasi.start(inst as unknown as any);
  const { memory, swe_calc_ut, swe_utc_to_jd } = inst.exports as unknown as any;
  if (!(memory instanceof WebAssembly.Memory)) throw new Error("No memory");
  if (typeof swe_calc_ut !== "function") throw new Error("No swe_calc_ut");
  if (typeof swe_utc_to_jd !== "function") throw new Error("No swe_utc_to_jd");

  return new SwEph({ memory, swe_calc_ut, swe_utc_to_jd }, iflag);
}

function offsetAngle(base: number, angle: number): number {
  const a = base + angle;
  return a - Math.floor(a / 360) * 360;
}

async function main() {
  const sweph = await newSweph(0);
  const app = document.getElementById("app");
  if (!app) throw new Error("No app element");
  // draw canvas
  const canvas = document.createElement("canvas");
  const width = 600;
  const height = 600;
  canvas.width = width;
  canvas.height = height;
  app.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");
  const r = (0.8 * width) / 2;
  ctx.arc(width / 2, height / 2, r, 0, 2 * Math.PI);
  ctx.stroke();

  // const baseAngle = 90+84;
  const baseAngle = 180+84;
  const date = new Date();

  const planets = [
    { nm: "Sun", p: Planet.Sun },
    { nm: "Moon", p: Planet.Moon },
    { nm: "Mercury", p: Planet.Mercury },
    { nm: "Venus", p: Planet.Venus },
    { nm: "Mars", p: Planet.Mars },
    { nm: "Jupiter", p: Planet.Jupiter },
    { nm: "Saturn", p: Planet.Saturn },
    { nm: "Ref", p: 10 },
  ];
  for (const { nm, p } of planets) {
    let lon = 0;
    if (p !== 10) {
      const calcUt = sweph.calc_ut(date, p);
      if (calcUt.err) throw new Error(calcUt.err);
      lon = -calcUt.pos.longitude;
    }

    const angle = offsetAngle(baseAngle, lon) * (Math.PI / 180);

    console.log({ nm, angle: angle * (180 / Math.PI) });

    const x = width / 2 + Math.cos(angle) * r;
    const y = height / 2 + Math.sin(angle) * r;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.font = "20px serif";
    ctx.fillText(nm, x + 10, y);
  }
}

main().catch(console.error);
