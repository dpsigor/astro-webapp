# Swiss Ephemeris (vendored)

The C sources that `astro.wasm`, at the repository root, is built from.

- `src/` — files copied unmodified from
  [aloistr/swisseph](https://github.com/aloistr/swisseph) at the commit in
  `UPSTREAM`. Do not edit them; everything specific to this app lives in the
  `Makefile`.
- `Makefile` — the WebAssembly build: compiler flags and the list of exported
  functions.
- `update.sh` — compares or refreshes `src/` against upstream.

Only the library's source is here. The ephemeris data files (upstream's
`ephe/`) are not: the app asks for the built-in Moshier ephemeris
(`SEFLG_MOSEPH` in `src/lib/sweph.ts`), which needs no files.

## Rebuilding

Needs Docker; the compiler runs inside the wasi-sdk image.

```sh
npm run sweph:build   # builds and overwrites ../../astro.wasm
npm run test          # checks real positions against the new binary
```

`make` alone builds `build/astro.wasm` without replacing the shipped binary.

## Exporting another function

Add its name to `EXPORTS` in the `Makefile`, rebuild, and declare it in the
`Astro` interface in `src/lib/sweph.ts`.

## Following upstream

```sh
npm run sweph:check                # exits non-zero if upstream changed a vendored file
./vendor/swisseph/update.sh update # copy the new files and bump UPSTREAM
```

After an update, rebuild and run the tests. If the build fails on a missing
header, upstream added a file: copy it into `src/` (and into `SRC` in the
`Makefile` if it is a `.c` file) and run the update again.

## Licence

Swiss Ephemeris is dual-licensed: AGPL-3.0 or a commercial licence from
Astrodienst. See `LICENSE` and `agpl-3.0.txt`.
