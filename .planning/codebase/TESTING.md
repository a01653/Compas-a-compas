---
last_mapped_commit: 830301874da94daf3049ae0b8e8ae45994cea38b
last_mapped_at: 2026-11-19
---
# Testing Patterns

**Analysis Date:** 2026-11-19

## Test Framework

**Runner:**
- Node.js built-in test runner (`node:test`). No Jest, Vitest, or other third-party framework.
- Node 24 is the version used in CI (`.github/workflows/pages.yml`, `actions/setup-node` with `node-version: '24'`).
- Config: none as a separate file. The runner is configured in `package.json`:
  ```json
  "test": "node --import ./tests/setup.mjs --test"
  ```
- `tests/setup.mjs` runs before every test file. It loads `config/palette-defaults.json` and calls `installPaletteDefaults` from `src/model/paletteDefaults.js`, so tests start with the same colors the app uses at startup.

**Assertion Library:**
- `node:assert/strict`, imported in every test as `import assert from 'node:assert/strict';`. The strict variant means `assert.equal` is `strictEqual` and `assert.deepEqual` is `deepStrictEqual`.
- Matchers in use: `assert.equal`, `assert.deepEqual`, `assert.ok`, `assert.match`, `assert.doesNotMatch`, `assert.throws`, `assert.rejects`.
- Custom messages are passed as the last argument to explain intent, for example `assert.deepEqual(units[1].atoms, [], 'compás vacío: sin tarjetas');` (`tests/atoms.test.js`).

**Run Commands:**
```bash
npm test                                        # Run the full suite (319 tests, 30 files, about 1.5 s)
node --import ./tests/setup.mjs --test tests/store.test.js   # Run one file (setup is still required)
node --import ./tests/setup.mjs --test --test-name-pattern="deshacer" # Run tests whose name matches
node scripts/build-pages.mjs                    # Build the Pages artifact (AGENTS.md requires this with npm test)
```
- Watch mode and coverage are not configured. Node's `--test-watch` and `--experimental-test-coverage` flags are not used by any script.
- Run a single file while developing, and the full `npm test` once the scope is closed. `AGENTS.md` asks for the same: targeted tests during development, one final full run before integration.

## Test File Organization

**Location:**
- All tests are in one flat directory: `tests/`. There are no co-located `*.test.js` files next to source.
- Source files are in `src/`, and tests import them by relative path: `import { createStore } from '../src/store.js';`.

**Naming:**
- File name: `tests/<topic>.test.js`, kebab-case, named after the module or behavior under test.
  - Module-centric: `tests/store.test.js`, `tests/validate.test.js`, `tests/paginate.test.js`, `tests/geometry.test.js`, `tests/palette.test.js`, `tests/structure.test.js`, `tests/tonality.test.js`.
  - Behavior-centric for feature areas: `tests/repeat-previous.test.js`, `tests/repeat-two.test.js`, `tests/compact-break-after.test.js`, `tests/line-break-swap.test.js`, `tests/anchor-fret.test.js`, `tests/manual-link.test.js`, `tests/card-selection.test.js`.
- Helpers: `tests/helpers.js` (data helpers) and `tests/setup.mjs` (global setup).

**Structure:**
- No `describe` blocks. Every test is a top-level `test('...', () => { ... })` call.
- Test names are full Spanish sentences describing the expected behavior, not the function name. Examples:
  - `test('la selección inicial apunta al primer compás, acorde y voicing', ...)` in `tests/store.test.js`
  - `test('JSON corrupto: error legible, sin excepción', ...)` in `tests/validate.test.js`
  - `test('IDs duplicados en cualquier parte del documento bloquean la apertura', ...)`
- Keep names in Spanish and describe the outcome. Avoid names such as `works` or `test 1`.
- Section comments inside a file separate groups with a banner: `/* ---------- Recuperación en almacenamiento ---------- */` (`tests/store.test.js`).

**Test file template** (as used in the repository):
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { thing } from '../src/model/thing.js';
import { clone, loadDemo } from './helpers.js';

test('comportamiento esperado en una frase', () => {
  const data = clone(loadDemo());
  // arrange, act, assert
  assert.equal(thing(data), expected);
});
```

## Test Structure

**Suite Organization:**
- Each file imports `node:test`, `node:assert/strict`, the code under test, and the helpers it needs. Local fixture builders sit at the top of the file, before the first `test(...)`.

Example from `tests/atoms.test.js` (local fixture builders):
```javascript
const voicing = (id) => ({ id, frets: [null, 3, 5, 3, 4, 3] });
const event = (id, voicings) => ({ id, chordName: id.toUpperCase(), voicings: voicings.map(voicing) });

function song() {
  return {
    measures: [
      { id: 'm1', label: '1', chordEvents: [event('ea', ['a1', 'a2', 'a3']), event('eb', ['b1']), event('ec', [])] },
      { id: 'm2', label: '2', chordEvents: [] },
    ],
    structure: { repeats: [], endings: [], markers: [], jumps: [] },
  };
}
```

**Patterns:**
- **Setup:** a helper that returns a fresh object each time, so tests do not share state. Example in `tests/store.test.js`: `function demoStore() { return createStore(clone(loadDemo())); }`.
- **Teardown:** none is defined. Tests that replace a global restore it in `finally`. Example in `tests/palette-defaults.test.js`:
  ```javascript
  const realFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('', { status: 404 });
    await assert.rejects(loadPaletteDefaults(), /no se encuentra el archivo \(HTTP 404\)/);
    // ...
  } finally {
    globalThis.fetch = realFetch;
  }
  ```
- **Assertion:** compare whole structures with `assert.deepEqual`, and check a single outcome with `assert.equal`. Prefer `deepEqual` on the full result over checking individual fields when the shape matters.
- **Path assertions for validation:** collect error paths and check membership with `.includes` or `assert.ok(paths.includes(...))`, rather than matching full messages (`tests/validate.test.js`).
- **Matrix tests:** loop over input cases inside one `test` and pass the case as the assertion message, for example `assert.ok(validateSong(data).errors.length > 0, JSON.stringify(frets));`.

## Fixtures and Test Data

**Demo song:**
- `examples/cancion-demo.json` is the canonical valid song. `tests/helpers.js` loads it through `loadDemo()`:
  ```javascript
  export function loadDemo() {
    return JSON.parse(readFileSync(new URL('../examples/cancion-demo.json', import.meta.url), 'utf8'));
  }
  export const clone = (value) => JSON.parse(JSON.stringify(value));
  ```
- Always call `clone(loadDemo())` before mutating. Mutating the parsed object is safe, but the clone guarantees a fresh copy per test. Several tests (for example "el ejemplo del repositorio es válido") rely on the demo staying valid.
- Known ids in the demo are stable and used in assertions: measures `m1`–`m4`, events `e1`–`e3`, voicings `v1`–`v3`, structure ids `coda1`, `jump1`. Changing the demo changes many tests.

**Inline fixtures:**
- Small hand-built songs are written inside the test file with local helpers such as `event(id, voicings)` and `unit(id, atoms, size)`. Use this for layout and structure logic where a realistic song would hide the case.
- Fixture ids follow the same convention as the app (`m1`, `e1`, `v1`) when they stand in for real objects, and descriptive ids (`'ea'`, `'a1'`) when a test is about distinct items.

**Example and catalog data:**
- `examples/index.json` and `examples/*.json` are real songs. `tests/examples.test.js` validates them, and `tests/list-import.test.js` covers list import.
- `examples/Catalogo_Drop_voicings_Compas_a_compas.json` is the voicing catalog used by the examples menu.

**Location:**
- There is no `fixtures/` or `__mocks__/` directory. Fixtures are either in `examples/` (real files, read by tests) or defined inline in the test file.

## Mocking

**Framework:** None. No mocking library. Mock by replacing a value or passing a fake.

**Patterns:**

Fake storage passed as a factory (`tests/store.test.js`):
```javascript
function fakeStorage() {
  const data = new Map();
  return {
    setItem: (k, v) => data.set(k, v),
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    removeItem: (k) => data.delete(k),
  };
}

const recovery = createRecovery(() => fakeStorage());
```
This works because `createRecovery` takes a storage factory. Keep modules that touch the outside world accepting their dependency as a parameter, so tests can replace it without patching globals.

Replacing a global function (`tests/palette-defaults.test.js`):
```javascript
const realFetch = globalThis.fetch;
try {
  globalThis.fetch = async () => new Response('{ no json', { status: 200 });
  await assert.rejects(loadPaletteDefaults(), /no es un JSON válido/);
} finally {
  globalThis.fetch = realFetch;
}
```
Always restore in `finally`. Use the built-in `Response` class for HTTP fakes.

**What to Mock:**
- Browser-only I/O such as `fetch` and `localStorage` through factories or temporary global replacement (see the two patterns above).
- Time-based behavior is not mocked. The store is synchronous, and the autosave timer in `src/main.js` is not covered by tests.

**What NOT to Mock:**
- The validator, serializer, and layout engine. Tests run the real `validateSong`, `parseSongJson`, `serializeSong`, `paginate`, and `layoutFretboard` against real data. For example, "guardar y abrir conserva datos, IDs, orden y estructura" in `tests/validate.test.js` round-trips the real demo through the real serializer.
- The palette defaults. `tests/setup.mjs` installs the real `config/palette-defaults.json` before every test.

## Coverage

**Requirements:** None enforced. No coverage threshold is set, and no coverage command exists in `package.json`.

**View Coverage:**
```bash
node --import ./tests/setup.mjs --test --experimental-test-coverage
```
This flag is available in Node 24 but is not part of the project scripts. Use it ad hoc only.

## Test Types

**Unit Tests (the majority):**
- Pure model and layout logic: `tests/validate.test.js`, `tests/dangling-ids.test.js`, `tests/structure.test.js`, `tests/tonality.test.js`, `tests/degrees.test.js`, `tests/palette.test.js`, `tests/frets.test.js`, `tests/geometry.test.js`, `tests/atoms.test.js`, `tests/paginate.test.js`.
- Editing operations on the song model: `tests/measure-ops.test.js` (28 tests, the largest file), `tests/cards.test.js`, `tests/song-ops.test.js`, `tests/history.test.js`.
- Export document assembly as a string: `tests/export-document.test.js` checks the HTML produced by `buildExportDocument` (no script, no external link, escaping of `</title>` and `</style>`).

**Integration-style Tests (store and workflow):**
- `tests/store.test.js` drives the real `createStore` with subscribers and checks the scopes emitted, dirty tracking, selection normalization, and recovery storage through the fake storage above.
- `tests/history.test.js` and `tests/repeat-*.test.js` exercise an operation through the store and then check undo or derived state.
- These tests do not construct DOM. They call store methods (`selectMeasure`, `selectVoicing`, `commit`, `emit`, `replaceSong`) and assert on `store.state`.

**UI and DOM Tests:**
- None. No test imports `src/ui/*`, `src/render/*`, or `src/main.js`. No DOM library (jsdom, happy-dom) is installed.
- The only DOM-adjacent check is text-based: `tests/export-document.test.js` asserts on the string produced by the exporter, and the layout tests assert on numbers from `src/layout/` (no SVG or DOM is rendered).
- Behavior that depends on the DOM (focus, toasts, dialogs, `contenteditable`-style editing, drag and drop, keyboard shortcuts) is not automatically tested. Validate it manually in a browser, as `AGENTS.md` requires, and record the result in `docs/ESTADO.md`. Do not claim a visual or browser check that was not performed.

**E2E Tests:**
- Not used. `AGENTS.md` says no E2E suite is configured in this repository. Do not describe one as run.

**Build check:**
- `node scripts/build-pages.mjs` is not a test, but it is part of the closing check (`AGENTS.md`). It copies `index.html`, `src`, `styles`, `assets`, `examples`, `config`, `ayuda`, `references/fonts.css`, and the user manual PDF into `_site/`.

**Documentation checks:**
- For documentation-only changes: `git diff --check`. For the manuals and technical document, `python scripts/build_docs.py` regenerates the PDFs and LaTeX, which must be reviewed visually.

## Common Patterns

**Async Testing:**
Use `async` with `await assert.rejects` for a promise that must reject (`tests/palette-defaults.test.js`):
```javascript
test('carga: archivo ausente, ilegible o con JSON roto dan un error comprensible', async () => {
  globalThis.fetch = async () => new Response('', { status: 404 });
  await assert.rejects(loadPaletteDefaults(), /no se encuentra el archivo \(HTTP 404\)/);
});
```
The codebase uses `async` in only three test files (`tests/palette-defaults.test.js`, `tests/tonality.test.js`, `tests/geometry.test.js`). Most model tests are synchronous.

**Error Testing:**
Synchronous throws use `assert.throws` with a regex or a predicate (`tests/export-document.test.js`):
```javascript
assert.throws(() => buildExportDocument({ title: 't', css: '', bodyHtml: bad }), /no permitidas/, bad);
```
Predicate form to check the error class and content (`tests/palette-defaults.test.js`):
```javascript
assert.throws(() => installPaletteDefaults(broken), (error) => error instanceof PaletteDefaultsError && /ink/.test(error.message));
```

Validation errors are returned, not thrown, so test them as data:
```javascript
const result = parseSongJson('{ no json');
assert.equal(result.ok, false);
assert.match(result.errors[0].message, /no es un JSON válido/);
```

**Invariant checks:**
- Duplicate ids, dangling references, and finite numbers are checked across the whole document. `tests/dangling-ids.test.js` and `tests/geometry.test.js` (the `assertFinite` helper walks any layout result and asserts every number is finite) are the models.

**Regression tests:**
- Each feature area has a test file named after the behavior it protects. When fixing a bug, add a test to the file that owns the behavior (for example `tests/compact-break-after.test.js` for the compact line break rule) and name it after the observable outcome.
- Reference the source design document where a rule comes from. `tests/geometry.test.js` begins its geometry cases with "casos geométricos de DISENO.md: trastes visibles". Keep such citations accurate.

## Writing a New Test: Checklist

1. Put it in the file that owns the behavior. Create `tests/<topic>.test.js` only when no existing file fits.
2. Import `test` and `assert` from `node:test` and `node:assert/strict`.
3. Build data with `clone(loadDemo())` for realistic songs, or an inline fixture for a focused case.
4. Name the test in a Spanish sentence describing the outcome.
5. Assert with `deepEqual` for whole results and `match` for messages. Add a message argument when a loop or case table could hide which input failed.
6. If you replace a global (`fetch`, storage), restore it in `finally`.
7. Run it alone with `node --import ./tests/setup.mjs --test tests/<file>.test.js`, then run `npm test` before integration.

## Known Gaps

- No tests for `src/ui/*`, `src/render/*`, or `src/main.js`. The DOM layer, dialogs, toasts, autosave timer, and keyboard shortcuts are untested in code.
- No coverage measurement. The number of tests does not show how much of `src/` is exercised.
- Modules with no direct test import by file name include `src/layout/compute.js`, `src/layout/measurer.js`, `src/model/families.js`, and `src/render/sheet.js`. Some are covered indirectly through the layout and store tests, but this has not been measured.
- Browser behavior is verified manually only. Record manual checks in `docs/ESTADO.md` and do not present them as automated results.

---

*Testing analysis: 2026-11-19*
