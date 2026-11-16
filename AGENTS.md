# Agent guide

Instructions for any coding agent working in this repository.

## Project

A browser-only astrology app: it draws charts and ephemeris graphs on a canvas
and lists conjunctions. Positions come from the Swiss Ephemeris, compiled to
WebAssembly (`astro.wasm`) and run through a WASI shim. There is no backend.

Stack: React 19, TypeScript (strict), Vite, Tailwind CSS 4, dayjs, zod.
Deployed to GitHub Pages under `/astro-webapp/` on every push to `master`.

## Commands

| Command            | Purpose                                 |
| ------------------ | --------------------------------------- |
| `npm run dev`      | Dev server on http://localhost:4200     |
| `npm run build`    | Type-check (`tsc`) and production build |
| `npm run lint`     | ESLint                                  |
| `npm run test`     | Unit tests (Vitest)                     |
| `npm run prettier` | Format the whole repo                   |

Tests live in `test/`, outside `src`, so `tsc` does not type-check them: they
read `astro.wasm` from disk and there is no `@types/node`. Shared helpers,
including the loader for the WASM module, are in `test/helpers.ts`.

## Before calling a change done

Run all four and fix whatever they report:

1. `npm run prettier`
2. `npm run lint`
3. `npm run test`
4. `npm run build`

Say so plainly if any of them still fails, or if a UI change was not checked in
a browser.

## Layout

- `src/lib/` — pure logic: chart and graph math, drawing, dates, conjunctions,
  the Swiss Ephemeris bindings.
- `src/components/` — React components.
- `src/context/` — the provider that loads the WASM module.
- `src/hooks/` — shared hooks, including `usePersistentState` (localStorage).

## Design

The app is mobile-first: design for a phone in portrait, then adapt upwards
with Tailwind's `sm:`/`lg:` variants.

- **The chart comes first.** On a phone the canvas sits directly under the
  header and spans the full viewport width, with no padding, border or other
  chrome around it. Controls and tables go below it. Do not add anything above
  the canvas or beside it on a phone, and keep the header to a single compact
  row.
- The canvas size comes from `getCanvasSize` in `src/lib/canvasSize.ts`. A
  layout change that affects the room available to the canvas must be
  reflected there.
- Check UI changes at a phone width (about 380px) before a desktop one: no
  horizontal scrolling, and the whole chart visible without scrolling.

## Code style

- **Keep logic out of components.** Astrology math, canvas drawing and data
  shaping live as pure functions in `src/lib`. Components wire state to those
  functions and render; they should stay thin.
- **Tailwind only.** Style with utility classes. Do not add CSS files, CSS
  modules or inline `style` objects unless a value is truly dynamic (for
  example a computed canvas size).
- **Few comments.** Comment only the non-obvious _why_. No narration of what
  the code does, and no docstrings on self-explanatory functions.
- Formatting is Prettier's job (`.prettierrc.json`); do not hand-format against
  it.

## Dependencies

Ask before adding, removing or upgrading any npm dependency. Say what it is for
and what the alternative without it would be, then wait for approval.

## Version control

This repository uses GitButler. Do version-control work with the `but` CLI, not
with `git`.

- **Never run a `git` command that changes anything**: the working tree, the
  index, history, branches, tags, stashes, configuration or a remote. That
  rules out, among others, `add`, `commit`, `restore`, `checkout`, `switch`,
  `reset`, `stash`, `merge`, `rebase`, `cherry-pick`, `revert`, `clean`,
  `fetch`, `pull` and `push`.
- **Read-only `git` commands are fine**: `git status`, `git log`, `git show`,
  `git diff`, `git blame` and the like. So are read-only `but` commands such as
  `but status` and `but diff`.
- **Ask before every `but` write.** Committing, amending, squashing, creating
  or moving branches, discarding changes, pushing and anything else that
  changes state needs the user's permission first. Ask a direct question that
  says what you are about to do, and wait for a yes. Permission covers only
  what was asked; ask again for the next write.

Until permission is given, leave changes uncommitted in the working tree. To
undo your own edit, edit the file back instead of using version control.

## Do not touch unless asked

- **`astro.wasm`** — the compiled Swiss Ephemeris binary. Treat it as
  read-only. Its TypeScript bindings in `src/lib/sweph.ts` are normal code and
  can be edited.
- **`.github/workflows/main.yml` and `base` in `vite.config.js`** — the GitHub
  Pages deploy depends on both. The workflow also copies `astro.wasm` and the
  glyph font into `dist`, and the app fetches them by relative path, so do not
  move or rename those assets either.

If a task seems to need a change in one of these, stop and explain why instead
of making it.
