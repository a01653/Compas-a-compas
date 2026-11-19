---
last_mapped_commit: 830301874da94daf3049ae0b8e8ae45994cea38b
last_mapped_at: 2026-11-19
---
# Coding Conventions

**Analysis Date:** 2026-11-19

## Naming Patterns

**Files:**
- Source modules are camelCase `.js` under `src/`, grouped by layer: `src/model/`, `src/layout/`, `src/render/`, `src/ui/`, `src/export/`, `src/persist/`, `src/geometry/`. Examples: `src/model/serialize.js`, `src/layout/paginate.js`, `src/ui/measureActions.js`, `src/render/repeat.js`.
- Exception: `src/store.js` sits at the top of `src/` and `src/main.js` is the entry point.
- Tests are kebab-case `.test.js` under `tests/`, named after the behavior they cover: `tests/measure-ops.test.js`, `tests/compact-break-after.test.js`, `tests/repeat-two.test.js`. Shared helpers live in `tests/helpers.js` and `tests/setup.mjs`.
- Build and maintenance scripts are `.mjs` (`scripts/serve.mjs`, `scripts/launch.mjs`, `scripts/build-pages.mjs`) except `scripts/build_docs.py` (snake_case, Python 3).
- Stylesheets are kebab-case under `styles/`: `styles/tokens.css`, `styles/workspace.css`, `styles/export.css`.
- Config JSON is kebab-case: `config/palette-defaults.json`. Example songs use kebab-case or snake case: `examples/cancion-demo.json`, `examples/ii-v-i-mayor-do.json`.

**Functions:**
- camelCase, named by the verb-first action: `createStore`, `parseSongJson`, `serializeSong`, `validateSong`, `titleFileName`, `buildExportDocument`, `installPaletteDefaults`, `mountSongPanel`, `mountFileControls`.
- Factories return an object of methods: `createStore(song)` in `src/store.js`, `createRecovery(...)` in `src/persist/recovery.js`, `createClipboard()` in `src/ui/clipboard.js`, `createMeasureActions(...)` in `src/ui/measureActions.js`.
- UI panels use the `mount*` prefix and receive `store` plus their dependencies: `mountMarksPanel`, `mountPreviewPanel`, `mountHistoryControls`, `mountExamplesMenu`.
- Predicates start with `is` or `has`: `isColor`, `isPaletteLabel`, `isObject`, `hasOwn`, `paletteDefaultsLoaded`.
- Async functions are rare (5 exported) and sit at I/O edges: `fetchCatalog`, `fetchExample` in `src/ui/examples.js`, `loadPaletteDefaults` in `src/model/paletteDefaults.js`, `writeFile` and `save` in `src/ui/file.js`.

**Variables:**
- camelCase for locals and state fields (`measureId`, `chordEvents`, `markedCards`, `selectionKind`, `documentId`).
- Module-level constants are SCREAMING_SNAKE_CASE: `AUTOSAVE_MS` in `src/main.js`, `SCHEMA_VERSION` and `FAMILY_KEYS` in `src/model/validate.js`, `SVG_NS` in `src/render/dom.js`, `PALETTE_DEFAULTS_PATH` in `src/model/paletteDefaults.js`, `MIN_FRETBOARD_WIDTH` and `GEOM` in `src/geometry/fretboard.js`.
- Module-level mutable state is a plain `let` (`let timer = null;` in `src/ui/notify.js`, `let active = null;` in `src/model/paletteDefaults.js`). Keep these to a minimum; see the module-state note under Function Design.
- Short single-letter names are used only in tiny callbacks (`(m) => m.id`, `(v, p, e) => ...`, `(_, i) => ...`). Use descriptive names in anything longer than a line.

**Types and identifiers:**
- Domain identifiers are stable strings and never array indexes. Prefixes: `m` for measures (`m1`), `e` for chord events (`e1`), `v` for voicings (`v1`), and descriptive ids for structure objects (`coda1`, `jump1`). See `src/model/ids.js`.
- Identifiers across the document share one namespace. Duplicate ids are a blocking validation error (`findDuplicateIds` in `src/model/ids.js`).
- Typedefs are not used. Shape is documented with JSDoc `@param` inline types (see `src/layout/paginate.js` lines 50-55) and enforced at runtime by `src/model/validate.js`.

**Language of identifiers and text:**
- Domain names, comments, UI strings, and error messages are in Spanish. Examples: `measureActions`, `chordEvents`, `voicings`, `estado-archivo`, `toast`, and the message `'No se puede guardar todavía'` in `src/ui/file.js`.
- Code-level keywords and library names are in English (`export`, `async`, `Map`, `Set`, `JSON`).
- Do not translate existing Spanish identifiers. Do not introduce English domain nouns (for example `measure`) in new code when the codebase already uses `compas` or `measureId` style names.

## Code Style

**Formatting:**
- No formatter is configured. No `.prettierrc`, `.editorconfig`, or `biome.json` exists in the repository.
- Observed style, to match in new code:
  - Two-space indentation (observed in every file read).
  - Single quotes for strings (roughly 1,600 single-quote occurrences in `src/` versus a few dozen double-quote occurrences, mostly inside template strings or where the text contains an apostrophe).
  - Semicolons at the end of statements.
  - Template literals for interpolation (`` `${state.fileName || 'Sin archivo'} · ${state.dirty ? ... }` ``).
  - Trailing commas are used in multi-line object and array literals.
  - Several short statements are often packed onto one line, for example `const x = ...; const y = ...;` and inline `if (...) return ...;` (see `src/store.js`, `src/model/validate.js`).
- Keep the same density as the surrounding file. Do not reflow untouched code.

**Linting:**
- No linter is configured and `AGENTS.md` states this explicitly: there is no lint command, and no E2E suite. Do not claim a lint step was run.
- Module format is ES modules only. `package.json` sets `"type": "module"`. Use `import`/`export`, never `require` or `module.exports`.
- Use `node:` prefixed imports for built-ins: `import { readFileSync } from 'node:fs';`, `import test from 'node:test';`, `import assert from 'node:assert/strict';`.
- Import relative paths with explicit `.js` extensions: `import { h, s } from './dom.js';`, `import { validateSong } from '../model/validate.js';`. There are no path aliases.
- Use `const` by default. `var` does not appear anywhere in `src/` and must not be introduced.

**Import Organization:**

Observed order in `src/main.js` and `src/store.js`:
1. Local model and state modules first (`./store.js`, `./model/cards.js`).
2. Persistence and model helpers (`./persist/recovery.js`, `./model/serialize.js`).
3. UI mounts (`./ui/song.js`, `./ui/measures.js`, ...).
4. Render and DOM helpers last (`./render/dom.js`).

Test files follow this order:
1. `node:test`.
2. `node:assert/strict`.
3. Code under test.
4. Helpers (`./helpers.js`).

**Path Aliases:**
- Not used. Use relative paths.

## Dependencies and Runtime

- No runtime dependencies. `package.json` has no `dependencies` or `devDependencies`. Do not add a framework or library without a concrete documented need, which is the rule in `AGENTS.md`.
- Use the platform APIs directly: `document.createElement`, `document.createElementNS` (wrapped in `src/render/dom.js`), `fetch`, `JSON`, `URL`, `Blob`, `window.showSaveFilePicker`.

## DOM and Rendering

- Build DOM only through the helpers `h(tag, attrs, ...children)` (HTML) and `s(tag, attrs, ...children)` (SVG) in `src/render/dom.js`. They create nodes and append user text as `Text` nodes, which makes injection safe by construction.
- Event handlers are passed as `on*` attributes in the attribute object: `h('button', { type: 'button', onclick: () => ... }, label)`. The helper maps `onclick` to `addEventListener('click', ...)` (see `apply` in `src/render/dom.js`).
- Attribute values `null`, `undefined`, or `false` are skipped. `true` becomes an empty attribute.
- Children arrays are flattened, and `null`, `undefined`, and `false` children are dropped. Use the `cond && node` idiom with confidence.
- Replace panel content with `element.replaceChildren(...)` (see `src/ui/notify.js`) rather than building HTML strings.
- `innerHTML` is used in exactly one place: `src/ui/exporter.js` line 43, where the holder is an element that the app itself rendered. Do not add `innerHTML` with user text. Use `h`/`s` or `textContent`.
- Element lookup is by id: `document.getElementById('estado-archivo')`, `document.getElementById('toast')`. Ids are defined in `index.html` and kept in Spanish with kebab-case.

**Example** (from `src/ui/notify.js`):
```javascript
toast.append(h('button', { type: 'button', class: 'toast-action', onclick: () => { toast.hidden = true; action.run(); } }, action.label));
```

## Error Handling

**Validation returns data, it does not throw.** The pattern is `{ ok, errors, warnings }` or `{ errors, warnings }`:
- `parseSongJson` in `src/model/serialize.js` returns `{ ok: false, errors }` for bad JSON and for validation errors, and `{ ok: true, song, warnings }` otherwise. It catches the `JSON.parse` failure and converts it into a path-tagged error: `{ path: '(archivo)', message: ... }`.
- `validateSong` in `src/model/validate.js` returns `{ errors, warnings }` arrays of `{ path, message }`. Validators are small functions with the signature `(value, path, errors)` that call `fail(errors, path, message)`. Messages are Spanish and describe the required shape: `'debe ser un entero ≥ 0 o null (cuerda muda)'`.
- Format with `formatError` from `src/model/validate.js` before showing it in a dialog.

**Throw only for programmer or environment errors.** Throws are limited to 15 places in `src/`:
- `throw new PaletteDefaultsError(problems)` in `src/model/paletteDefaults.js` for invalid config. The class extends `Error` and carries the list of problems.
- `throw new Error(...)` for an unknown action id in `src/ui/measureActions.js` (line 344, inside a `default:` branch).
- `throw new Error(...)` for HTTP failures in `src/ui/examples.js`, so the caller can show the message.
- `throw new Error('El cuerpo de la exportación contiene etiquetas no permitidas.')` in `src/export/document.js`. This is a defensive check against unsafe markup.

**Catch at the boundary and show the user a message.** UI code wraps async work in `try`/`catch` (19 occurrences in `src/`), then calls `errorDialog` from `src/ui/dialog.js` or `notify` from `src/ui/notify.js`:
```javascript
try {
  const name = await writeFile(serializeSong(song), store.state.fileName || suggestFileName(song));
  // ...
} catch (error) {
  await errorDialog({ title: 'No se pudo guardar', intro: 'La canción sigue abierta y con sus cambios.', errors: [error.message || String(error)] });
}
```
- Treat `AbortError` from `showSaveFilePicker` as user cancellation and return `null`, not an error (`src/ui/file.js`).
- Prefer `error.message || String(error)` when displaying an unknown caught value.

**Guard against invalid input before it changes state.** Open, paste, and import validate first, and the song currently open is never touched on failure (`parseSongJson` documents "No toca la canción abierta"). Follow that pattern: validate, then mutate.

## Logging

- No logging framework. The application (browser) code does not call `console` at all.
- Only the Node scripts write to the console: `scripts/serve.mjs` and `scripts/launch.mjs` use `console.log` for status and `console.error` for failures. They print Spanish messages with a concrete next step, for example `'El puerto ${port} ya está en uso. Prueba con: npm start -- --port ${port + 1}'`.
- User-visible status goes through `notify(message)` in `src/ui/notify.js` (a toast plus an `aria-live` region) or `errorDialog` in `src/ui/dialog.js`. Use these, not `console`, for anything the user should see.

## Comments and Documentation

**Language:** Comments are in Spanish, written as complete sentences and explaining *why* or the invariant, not restating code. Examples from `src/store.js`: `/** Deja la selección apuntando a objetos que existen. */`.

**Module header comments:**
- Each non-trivial module opens with a block comment describing its role, often as a `/** ... */` above the first export. Examples: `src/export/document.js` ("Puro: recibe estilos y hojas ya serializadas; no lleva JavaScript ni peticiones externas.") and `src/model/ids.js`.
- Long module contracts (the store) list each scope or event and what it means. Keep that style when extending a contract.

**JSDoc/TSDoc:**
- Used sparingly: 4 source files carry `@param` or `@returns` blocks, mostly `src/layout/paginate.js`. Use JSDoc only when a parameter shape is non-obvious (nested object or callback signature). Do not add JSDoc to every function.
- Single-line `/** ... */` above an exported function is the usual form.

**Explanatory comments:**
- Inline `//` comments are used for constraints that are not visible from code. Example: `// Número de cuerda 1–6 (primera arriba), en la zona exterior; es solo rotulación, no un dato.` in `src/render/card.js` (see `fretboardSvg`).
- Comments may mention the design document, for example "casos geométricos de DISENO.md" in `tests/geometry.test.js`. Keep such references accurate.

## Function Design

**Size:** Most functions are short. Long functions exist where state is being assembled (`createStore` in `src/store.js` is one closure of several hundred lines that returns the public API). Prefer splitting pure helpers out of closures. Keep pure logic in `src/model/` and `src/layout/` so tests can import it without a DOM.

**Parameters:**
- Use a trailing options object with destructured defaults for optional settings: `createStore(song, { fileName = null, historyLimit = 100, historyBudget = 8 * 1024 * 1024 } = {})`, `fretboardSvg(voicing, { palette, ink = inkColor(), muted = mutedColor(), scalePercent = 100 } = {})`, `notify(message, { duration = 5000, action = null } = {})`.
- Pass dependencies as parameters rather than importing singletons into a module (for example `mountFileControls(store, { recovery, recoveryHint })`).
- Use the curried-validator style for schema code: `integer(min)`, `oneOf(list)`, `list(itemCheck, { min, exact, unique })` in `src/model/validate.js` return validators with signature `(value, path, errors)`.

**Return values:**
- Pure functions return data (arrays, objects, or `{ ok, ... }` results). They do not return `undefined` for valid cases.
- Mutating functions on the store go through `store.commit(scope, ...)` or `store.emit(scope)` so subscribers and history are updated. Do not mutate `store.state.song` and forget to emit. The store checks for changes by comparing JSON snapshots (`currentJson`, `record(scope)`).
- Return `null` for "no result" when a caller needs to distinguish cancellation, as `writeFile` does in `src/ui/file.js`.

**Module-level state:** A few modules keep a single `let` at module level (`src/ui/notify.js` timer, `src/model/paletteDefaults.js` active defaults). Keep this to singletons that are truly app-wide. New feature state belongs in the store.

## Module Design

**Exports:**
- Named exports only. `export default` does not appear in `src/`.
- Export the functions the tests or other modules need, and no more. Helpers that are only used within a file stay unexported (`function degreeDot(...)` in `src/render/card.js` is private).

**Barrel files:** Not used. Import from the file that defines the symbol, for example `import { createStore } from './store.js';`, not from an `index.js`.

**Stores and state:**
- A single editable state object: `store.state` holds `song`, `selection`, `marked`, `markedCards`, `selectionKind`, `dirty`, and `zoom`. Panels derive their DOM from it. See `src/store.js`.
- Subscribe with `store.subscribe((state, scope) => ...)` and branch on `scope` (`'text'`, `'structure'`, `'document'`, `'history'`, `'selection'`, `'zoom'`, `'status'`). Each panel decides whether to rebuild. See `mountStatus` in `src/main.js`.
- Do not write view state into the song. Selection, zoom, and marking are not part of the saved JSON.

**Schema and data:**
- The JSON song is versioned with `SCHEMA_VERSION = 1` in `src/model/validate.js`. Unknown fields block opening rather than being dropped silently, and unknown `schemaVersion` values are rejected.
- Keep `schemas/song.schema.json` and the runtime validator in step. A test asserts that the schema declares the same new fields as the validator (see the test "el esquema JSON declara los mismos campos nuevos que el validador" in the suite).

## Accessibility and Localization

- Interactive DOM uses native elements with `type="button"` and labelled controls. Live announcements use `role` and `aria-*` attributes: `role: 'note'` on the fretboard warning, `role: 'img'` plus `aria-label` on the fretboard SVG (`src/render/card.js`), `aria-live` text in `estado-vivo` (`src/ui/notify.js`).
- User-visible text is Spanish. Do not add English UI strings.
- Use `lang="es"` on exported HTML (`src/export/document.js`).

## Security Conventions

- Do not add remote resources to exported HTML: no `<script>`, `<link>`, `<iframe>`, or external `src`/`href`. `buildExportDocument` rejects them.
- Escape text placed into a raw HTML string with `escapeHtml` from `src/export/document.js`. Use `neutralizeStyle` for CSS that goes into a `<style>` block.
- Validate JSON before replacing the open song. Do not bypass `parseSongJson` or `validateSong` when loading data.

## Examples to Copy

**Adding a validator to `src/model/validate.js`:**
```javascript
const fret = (v, p, e) => { if (v !== null && (!Number.isInteger(v) || v < 0)) fail(e, p, 'debe ser un entero ≥ 0 o null (cuerda muda)'); };
```

**Adding a panel that follows the store contract (`src/main.js` pattern):**
```javascript
store.subscribe((state, scope) => { if (scope !== 'zoom' && scope !== 'selection') render(state); });
```

**Building a DOM node safely (`src/render/dom.js`):**
```javascript
const el = h('div', { class: 'mastil-aviso', role: 'note' }, `No se puede dibujar: ${g.reason}`);
```

## Where to Look for Conventions

- Module style and invariants: `src/store.js`, `src/model/validate.js`, `src/model/ids.js`.
- DOM and rendering: `src/render/dom.js`, `src/render/card.js`, `src/render/sheet.js`.
- UI wiring and dialogs: `src/main.js`, `src/ui/file.js`, `src/ui/notify.js`, `src/ui/dialog.js`.
- Scripts and build: `scripts/serve.mjs`, `scripts/build-pages.mjs`, `scripts/build_docs.py`.
- Project rules that affect code style: `AGENTS.md` (Spanish UI and docs, no framework, stable identifiers, safe text rendering).

---

*Convention analysis: 2026-11-19*
