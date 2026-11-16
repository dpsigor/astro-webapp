import { WASI, File, OpenFile } from '@bjorn3/browser_wasi_shim';

export const northNodeGlyph = 'L';
export const southNodeGlyph = 'M';
export const partFortuneGlyph = 'O';
export const ACGlyph = 'P';
export const MCGlyph = 'Q';

export const signGlyph = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
];

export const signGlyphUnicode = [
  '♈︎',
  '♉︎',
  '♊︎',
  '♋︎',
  '♌︎',
  '♍︎',
  '♎︎',
  '♏︎',
  '♐︎',
  '♑︎',
  '♒︎',
  '♓︎',
];

/** House systems, identified by their Swiss Ephemeris letter. */
export enum HouseSystem {
  Placidus = 'P',
  Koch = 'K',
  Regiomontanus = 'R',
  Campanus = 'C',
  Porphyry = 'O',
  Equal = 'A',
  WholeSign = 'W',
}

export const houseSystems: { value: HouseSystem; label: string }[] = [
  { value: HouseSystem.Placidus, label: 'Placidus' },
  { value: HouseSystem.Koch, label: 'Koch' },
  { value: HouseSystem.Regiomontanus, label: 'Regiomontanus' },
  { value: HouseSystem.Campanus, label: 'Campanus' },
  { value: HouseSystem.Porphyry, label: 'Porphyry' },
  { value: HouseSystem.Equal, label: 'Equal' },
  { value: HouseSystem.WholeSign, label: 'Whole sign' },
];

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
  [Planet.Sun]: 'A',
  [Planet.Moon]: 'B',
  [Planet.Mercury]: 'C',
  [Planet.Venus]: 'D',
  [Planet.Mars]: 'E',
  [Planet.Jupiter]: 'F',
  [Planet.Saturn]: 'G',
};

export const planetGlyphUnicode = {
  [Planet.Sun]: '☉',
  [Planet.Moon]: '☽',
  [Planet.Mercury]: '☿',
  [Planet.Venus]: '♀︎',
  [Planet.Mars]: '♂︎',
  [Planet.Jupiter]: '♃',
  [Planet.Saturn]: '♄',
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
  Sign.Aries,
  Sign.Taurus,
  Sign.Gemini,
  Sign.Cancer,
  Sign.Leo,
  Sign.Virgo,
  Sign.Libra,
  Sign.Scorpio,
  Sign.Sagittarius,
  Sign.Capricorn,
  Sign.Aquarius,
  Sign.Pisces,
];

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
      if (sign === Sign.Taurus || sign === Sign.Libra) return Dignity.Domicile;
      if (sign === Sign.Scorpio || sign === Sign.Aries)
        return Dignity.Detriment;
      if (sign === Sign.Pisces) return Dignity.Exaltation;
      if (sign === Sign.Virgo) return Dignity.Fall;
      return;
    case Planet.Mars:
      if (sign === Sign.Aries || sign === Sign.Scorpio) return Dignity.Domicile;
      if (sign === Sign.Libra || sign === Sign.Taurus) return Dignity.Detriment;
      if (sign === Sign.Capricorn) return Dignity.Exaltation;
      if (sign === Sign.Cancer) return Dignity.Fall;
      return;
    case Planet.Jupiter:
      if (sign === Sign.Sagittarius || sign === Sign.Pisces)
        return Dignity.Domicile;
      if (sign === Sign.Gemini || sign === Sign.Virgo) return Dignity.Detriment;
      if (sign === Sign.Cancer) return Dignity.Exaltation;
      if (sign === Sign.Capricorn) return Dignity.Fall;
      return;
    case Planet.Saturn:
      if (sign === Sign.Capricorn || sign === Sign.Aquarius)
        return Dignity.Domicile;
      if (sign === Sign.Cancer || sign === Sign.Leo) return Dignity.Detriment;
      if (sign === Sign.Libra) return Dignity.Exaltation;
      if (sign === Sign.Aries) return Dignity.Fall;
      return;
  }
}

interface Astro {
  memory: WebAssembly.Memory;
  malloc: (size: number) => number;
  swe_utc_to_jd: (
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number,
    gregflag: number,
    dret: number, // Float64Array, idx1 = universal time
    serr: number, // Uint8Array
  ) => number;
  swe_calc_ut: (
    tjd_ut: number,
    ipl: number,
    iflag: number,
    xxPtr: number,
    serrPtr: number,
  ) => number;
  swe_houses_ex: (
    tjd_ut: number,
    iflag: number,
    lat: number,
    lon: number,
    hsys: number,
    cuspPtr: number, // Float64Array, houses at indexes 1..12
    ascmcPtr: number, // Float64Array of 10
  ) => number;
}

// No ephemeris files are shipped, so the library would fall back to its
// built-in Moshier ephemeris anyway; asking for it skips the file lookup.
const SEFLG_MOSEPH = 4;
// The old speed flag, 128 (SEFLG_SPEED3), gave the same result five times
// slower.
const SEFLG_SPEED = 256;

const SE_MEAN_NODE = 10;

const SERR_SIZE = 256;

export class SwEph {
  // Scratch buffers in the module's memory, allocated once and reused.
  private readonly f64Ptr: number; // 13 doubles: dret, xx or cusps
  private readonly ascmcPtr: number;
  private readonly serrPtr: number;

  constructor(private astro: Astro) {
    this.f64Ptr = astro.malloc(13 * 8);
    this.ascmcPtr = astro.malloc(10 * 8);
    this.serrPtr = astro.malloc(SERR_SIZE);
    if (!this.f64Ptr || !this.ascmcPtr || !this.serrPtr)
      throw new Error('Swiss Ephemeris: out of memory');
  }

  private f64(ptr: number, length: number): Float64Array {
    return new Float64Array(this.astro.memory.buffer, ptr, length);
  }

  private serr(): string {
    const bytes = new Uint8Array(
      this.astro.memory.buffer,
      this.serrPtr,
      SERR_SIZE,
    );
    const end = bytes.indexOf(0);
    return new TextDecoder().decode(
      bytes.subarray(0, end < 0 ? SERR_SIZE : end),
    );
  }

  jd(date: Date): { jd: number; err?: string } {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds() + date.getUTCMilliseconds() / 1000;
    const gregflag = 1;
    const jdCode = this.astro.swe_utc_to_jd(
      year,
      month,
      day,
      hour,
      minute,
      second,
      gregflag,
      this.f64Ptr,
      this.serrPtr,
    );
    if (jdCode < 0) return { jd: 0, err: this.serr() };
    return { jd: this.f64(this.f64Ptr, 2)[1] };
  }

  /** Longitude and its daily speed. */
  planetPos(
    jd: number,
    planet: Planet,
  ): { lon: number; slon: number; err?: string } {
    const code = this.astro.swe_calc_ut(
      jd,
      planet,
      SEFLG_MOSEPH | SEFLG_SPEED,
      this.f64Ptr,
      this.serrPtr,
    );
    if (code < 0) return { lon: 0, slon: 0, err: this.serr() };
    const xx = this.f64(this.f64Ptr, 6);
    return { lon: xx[0], slon: xx[3] };
  }

  /**
   * Longitude only, about twice as fast as `planetPos`. When sampling several
   * planets over time, loop over the times first and the planets inside: the
   * library reuses its work for consecutive calls at the same instant.
   */
  planetLon(jd: number, planet: Planet): { lon: number; err?: string } {
    return this.bodyLon(jd, planet);
  }

  /** Longitude of the mean north node; the south node is opposite to it. */
  northNodeLon(jd: number): { lon: number; err?: string } {
    return this.bodyLon(jd, SE_MEAN_NODE);
  }

  private bodyLon(jd: number, ipl: number): { lon: number; err?: string } {
    const code = this.astro.swe_calc_ut(
      jd,
      ipl,
      SEFLG_MOSEPH,
      this.f64Ptr,
      this.serrPtr,
    );
    if (code < 0) return { lon: 0, err: this.serr() };
    return { lon: this.f64(this.f64Ptr, 1)[0] };
  }

  /**
   * House cusps (index 0 is the first house) plus the ascendant and the
   * midheaven, which are not cusps in every house system.
   */
  houses(
    jd: number,
    geolat: number,
    geolon: number,
    hsys: HouseSystem,
  ): { cusps: number[]; asc: number; mc: number } {
    this.astro.swe_houses_ex(
      jd,
      0,
      geolat,
      geolon,
      hsys.charCodeAt(0),
      this.f64Ptr,
      this.ascmcPtr,
    );
    const cusps = this.f64(this.f64Ptr, 13);
    const ascmc = this.f64(this.ascmcPtr, 2);
    return { cusps: Array.from(cusps).slice(1), asc: ascmc[0], mc: ascmc[1] };
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

  const wasm = await WebAssembly.compileStreaming(fetch('astro.wasm'));
  const inst = await WebAssembly.instantiate(wasm, {
    wasi_snapshot_preview1: wasi.wasiImport,
  });
  // The module is a WASI reactor: a library with no main().
  wasi.initialize(inst as unknown as Parameters<WASI['initialize']>[0]);
  const sweph = new SwEph(inst.exports as unknown as Astro);
  return sweph;
}
