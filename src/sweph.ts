import { WASI, File, OpenFile } from "@bjorn3/browser_wasi_shim";

export const nodeGlyphs = [
  "L", // north
  "M",
];

export const partFortuneGlyph = 'O'
export const ACGlyph = 'P'
export const MCGlyph = 'Q'

export const signGlyph = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
];

export enum HouseSystem {
  Placidus = "P".charCodeAt(0),
  Regiomontanus = "R".charCodeAt(0),
}

export enum Planet {
  Sun = 0,
  Moon = 1,
  Mercury = 2,
  Venus = 3,
  Mars = 4,
  Jupiter = 5,
  Saturn = 6,
}

export const planets = [
  Planet.Sun,
  Planet.Moon,
  Planet.Mercury,
  Planet.Venus,
  Planet.Mars,
  Planet.Jupiter,
  Planet.Saturn,
];

export const planetGlyph = {
  [Planet.Sun]: "A",
  [Planet.Moon]: "B",
  [Planet.Mercury]: "C",
  [Planet.Venus]: "D",
  [Planet.Mars]: "E",
  [Planet.Jupiter]: "F",
  [Planet.Saturn]: "G",
};

export enum Sign {
  Aries = 0,
  Taurus = 1,
  Gemini = 2,
  Cancer = 3,
  Leo = 4,
  Virgo = 5,
  Libra = 6,
  Scorpio = 7,
  Sagittarius = 8,
  Capricorn = 9,
  Aquarius = 10,
  Pisces = 11,
}

export const signs = [
  Sign.Aries ,
  Sign.Taurus ,
  Sign.Gemini ,
  Sign.Cancer ,
  Sign.Leo ,
  Sign.Virgo ,
  Sign.Libra ,
  Sign.Scorpio ,
  Sign.Sagittarius ,
  Sign.Capricorn ,
  Sign.Aquarius ,
  Sign.Pisces ,
]

export enum Dignity {
  Domicile = 1,
  Detriment = 2,
  Exaltation = 3,
  Fall = 4,
}

export function dignity(p: Planet, lon: number): Dignity | undefined {
  const sign = signs[Math.floor(lon / 30)];
  if (sign === undefined) throw new Error(`sign not found at lon ${lon}`);
  switch (p) {
    case Planet.Sun:
      if (sign === Sign.Leo) return Dignity.Domicile;
      if (sign === Sign.Aquarius) return Dignity.Detriment;
      if (sign === Sign.Aries) return Dignity.Exaltation;
      if (sign === Sign.Libra) return Dignity.Fall;
      return;
    case Planet.Moon:
      if (sign === Sign.Cancer) return Dignity.Domicile;
      if (sign === Sign.Capricorn) return Dignity.Detriment;
      if (sign === Sign.Taurus) return Dignity.Exaltation;
      if (sign === Sign.Scorpio) return Dignity.Fall;
      return;
    case Planet.Mercury:
      if (sign === Sign.Gemini) return Dignity.Domicile;
      if (sign === Sign.Sagittarius) return Dignity.Detriment;
      if (sign === Sign.Virgo) return Dignity.Domicile;
      if (sign === Sign.Pisces) return Dignity.Detriment;
      return;
    case Planet.Venus:
      if (sign === Sign.Taurus||sign === Sign.Libra) return Dignity.Domicile;
      if (sign === Sign.Scorpio || sign === Sign.Aries) return Dignity.Detriment;
      if (sign === Sign.Pisces) return Dignity.Exaltation;
      if (sign === Sign.Virgo) return Dignity.Fall;
      return;
    case Planet.Mars:
      if (sign === Sign.Aries||sign === Sign.Scorpio) return Dignity.Domicile;
      if (sign === Sign.Libra || sign === Sign.Taurus) return Dignity.Detriment;
      if (sign === Sign.Capricorn) return Dignity.Exaltation;
      if (sign === Sign.Cancer) return Dignity.Fall;
      return;
    case Planet.Jupiter:
      if (sign === Sign.Sagittarius||sign === Sign.Pisces) return Dignity.Domicile;
      if (sign === Sign.Gemini || sign === Sign.Virgo) return Dignity.Detriment;
      if (sign === Sign.Cancer) return Dignity.Exaltation;
      if (sign === Sign.Capricorn) return Dignity.Fall;
      return;
    case Planet.Saturn:
      if (sign === Sign.Capricorn||sign === Sign.Aquarius) return Dignity.Domicile;
      if (sign === Sign.Cancer || sign === Sign.Leo) return Dignity.Detriment;
      if (sign === Sign.Libra) return Dignity.Exaltation;
      if (sign === Sign.Aries) return Dignity.Fall;
      return;
  }
}

interface Astro {
  memory: WebAssembly.Memory;
  swe_utc_to_jd: (
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    gregflag: number,
    dret: number, // Float64Array, idx1 = universal time
    serr: number // Uint8Array
  ) => number;
  swe_calc_ut: (
    tjd_ut: number,
    ipl: number,
    iflag: number,
    xxPtr: number,
    serrPtr: number
  ) => number;
  swe_houses: (
    tjd_ut: number,
    lat: number,
    lon: number,
    hsys: number,
    cuspPtr: number, // Float64Array, houses at indexes 1..12
    ascmcPtr: number
  ) => number;
}

export class SwEph {
  constructor(private astro: Astro) {}

  jd(date: Date): { jd: number; err?: string } {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds() + date.getUTCMilliseconds() / 1000;
    const gregflag = 1;
    const dretPtr = 0;
    const serrPtr = 2 * 8;
    const jdCode = this.astro.swe_utc_to_jd(
      year,
      month,
      day,
      hour,
      minute,
      second,
      gregflag,
      dretPtr,
      serrPtr
    );
    if (jdCode < 0) {
      const serr = new Uint8Array(this.astro.memory.buffer, serrPtr, 256);
      return { jd: 0, err: new TextDecoder().decode(serr) };
    }
    const dret = new Float64Array(this.astro.memory.buffer, dretPtr, 2);
    return { jd: dret[1] };
  }

  planetPos(
    jd: number,
    planet: Planet
  ): { lon: number; slon: number; err?: string } {
    const iflag = 128; // no flags
    const xxPtr = 0;
    const serrPtr = 6 * 8;
    const calcCode = this.astro.swe_calc_ut(jd, planet, iflag, xxPtr, serrPtr);
    if (calcCode < 0) {
      const serr2 = new Uint8Array(this.astro.memory.buffer, serrPtr, 256);
      const err = new TextDecoder().decode(serr2);
      return { lon: 0, slon: 0, err };
    }
    const xx = new Float64Array(this.astro.memory.buffer, xxPtr, 6);
    const lon = xx[0];
    return { lon, slon: xx[3] };
  }

  houses(jd: number, geolat: number, geolon: number, hsys: HouseSystem) {
    const cuspsPtr = 0;
    const ascmcPtr = 13 * 8;
    this.astro.swe_houses(jd, geolat, geolon, hsys, cuspsPtr, ascmcPtr);
    const cusps = new Float64Array(this.astro.memory.buffer, cuspsPtr, 13);
    return Array.from(cusps).slice(1);
  }
}

export async function swephInit(): Promise<SwEph> {
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
  const sweph = new SwEph(inst.exports as unknown as any);
  return sweph;
}
