import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { File, OpenFile, WASI } from '@bjorn3/browser_wasi_shim';
import { SwEph } from '../src/lib/sweph';

// swephInit() fetches the module over HTTP, so the tests instantiate it from
// disk instead.
export async function loadSwEph(): Promise<SwEph> {
  const wasi = new WASI(
    [],
    [],
    [
      new OpenFile(new File([])),
      new OpenFile(new File([])),
      new OpenFile(new File([])),
    ],
  );
  const wasm = await WebAssembly.compile(
    readFileSync(new URL('../astro.wasm', import.meta.url)),
  );
  const inst = await WebAssembly.instantiate(wasm, {
    wasi_snapshot_preview1: wasi.wasiImport,
  });
  wasi.initialize(inst as unknown as Parameters<WASI['initialize']>[0]);
  return new SwEph(
    inst.exports as unknown as ConstructorParameters<typeof SwEph>[0],
  );
}

export const utc = (...args: Parameters<typeof Date.UTC>) =>
  new Date(Date.UTC(...args));

export const ARCMIN = 1 / 60;
export const MINUTE_MS = 60_000;
export const DAY_MS = 86_400_000;

export const dms = (deg: number, min: number) => deg + min / 60;
export const norm = (deg: number) => ((deg % 360) + 360) % 360;
/** Shortest distance between two longitudes, so 359.9 and 0.1 are 0.2 apart. */
export const arc = (a: number, b: number) => {
  const d = Math.abs(norm(a) - norm(b));
  return Math.min(d, 360 - d);
};

export function assertNear(
  actual: number,
  expected: number,
  tolerance: number,
  what: string,
) {
  assert.ok(
    arc(actual, expected) <= tolerance,
    `${what}: expected ${expected} ± ${tolerance}, got ${actual}`,
  );
}
