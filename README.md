# astro-webapp

## Licence

- The app's own code (everything outside `vendor/`) is licensed under the MIT
  License.
- The Swiss Ephemeris sources in `vendor/swisseph` and `astro.wasm`, which is
  compiled from them, are licensed under the
  [GNU AGPL-3.0](vendor/swisseph/agpl-3.0.txt). See
  [`vendor/swisseph/LICENSE`](vendor/swisseph/LICENSE).

The deployed app combines the two, so as a whole it is distributed under the
AGPL-3.0. Its complete source, including the exact Swiss Ephemeris files and
the build recipe for `astro.wasm`, is this repository.

## Dependencies

- [Swiss Ephemeris](https://www.astro.com/swisseph/swephinfo_e.htm), vendored
  in [`vendor/swisseph`](vendor/swisseph/README.md) and compiled to `astro.wasm`
- [WASI](https://wasi.dev/)

### Videos

https://youtu.be/soL8nvKB7ko

TODO: responsive on wide screen is hiding the buttons and so on

### Font

https://www.fontspace.com/astro-dot-basic-font-f54374
