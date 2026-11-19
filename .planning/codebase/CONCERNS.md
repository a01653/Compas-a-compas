---
last_mapped_commit: 830301874da94daf3049ae0b8e8ae45994cea38b
last_mapped_at: 2026-11-19
---
# Codebase Concerns

**Analysis Date:** 2026-11-19

## Tech Debt

**Duplicated file-save fallback logic:**
- Issue: The File System Access API branch and the Blob download fallback are written twice, once for the song JSON and once for the HTML export. The two copies differ only in the picker `types` and MIME type.
- Files: `src/ui/file.js` (`writeFile`), `src/ui/exporter.js` (`saveHtml`)
- Impact: A fix to the save path (for example, handling `AbortError` or the revocation timeout) has to be applied twice and may drift.
- Fix approach: Extract one `saveText(text, { suggestedName, description, extension, mime })` helper into a shared module (for example `src/persist/saveFile.js`) and call it from both places.

**Model functions that appear to be dead in production code:**
- Issue: `src/model/song.js` defines single-measure operations that the UI no longer calls. Their multi-measure counterparts live in `src/model/measureOps.js`. Only tests exercise `duplicateMeasure`, `moveMeasure` and `deleteMeasure`, and `removeEvent` has no caller under `src/`.
- Files: `src/model/song.js` (`duplicateMeasure`, `moveMeasure`, `deleteMeasure`, `removeEvent`); `src/model/measureOps.js` (`duplicateMeasures`, `moveMeasures`, `deleteMeasures`)
- Impact: Two code paths for the same concept. Structural rules (warnings, relabel, repeat fixes) are applied only in the `measureOps` path, so a future caller that picks the old function would skip them silently.
- Fix approach: Confirm with `grep -rn` that nothing in `src/` uses them, then delete them and move any test coverage to the `measureOps` equivalents.

**Unused UI module:**
- Issue: `src/ui/scrollRegions.js` has no imports anywhere in `src/`, `tests/` or `index.html`.
- Files: `src/ui/scrollRegions.js`
- Impact: Dead code that still reads as part of the design.
- Fix approach: Delete it, or wire it in if it was meant to replace existing scroll handling in `src/ui/preview.js`.

**No-op schema property:**
- Issue: `schemaVersion` is validated with `schemaVersion: () => {}` inside the property table. The real check lives in `validateSongShape`, so the table entry is misleading.
- Files: `src/model/validate.js` (`song` object, `validateSongShape`)
- Impact: A reader can take the no-op as the validation rule for that field.
- Fix approach: Remove the table entry and keep the explicit check in `validateSongShape`, or add a comment pointing to it.

**Schema and validator are maintained by hand:**
- Issue: `schemas/song.schema.json` and `src/model/validate.js` describe the same format. They agree today (top-level keys, `measure`, `voicing`, `chordEvent`, `ending`, `jump` and `palette` all match), but nothing enforces it. `tests/repeat-previous.test.js` checks only one `$defs` entry.
- Files: `schemas/song.schema.json`, `src/model/validate.js`, `tests/repeat-previous.test.js`
- Impact: The next field added to one side and not the other would make the published schema and the app disagree, and external tools would accept or reject files the app does not.
- Fix approach: Add a test that loads the schema and checks each property table key set against `$defs`, as done for `examples/` in `tests/examples.test.js`.

**Redundant full-document serialization on every edit:**
- Issue: One edit causes several full `JSON.stringify(song)` calls. `store.emit` runs `record()` (stringify, then a dirty comparison), and then `state.dirty` is computed with another stringify. The paginator run then stringifies, parses, and re-stringifies in `signatureNow()`. The autosave debounce stringifies again.
- Files: `src/store.js` (`record`, `emit`), `src/ui/paginator.js` (`run`, `signatureNow`), `src/persist/recovery.js` (`save`)
- Impact: Cost grows linearly with song size on every keystroke. Long songs (several pages of measures with voicings) may cause visible lag. No measurement exists in the repo to show where the time goes.
- Fix approach: Keep a cached serialization of the current song, updated once per emit, and reuse it for history, dirty state, paginator signature and recovery. Measure with a large example before and after.

## Known Bugs

**Recovery copy fails silently when localStorage is full:**
- Symptoms: For large songs the recovery write can exceed the origin quota (typically about 5 MB). `createRecovery.save` swallows the error and returns `false`, and the user sees only a hint in the song panel. The copy in `localStorage` is stale or missing without any dialog.
- Files: `src/persist/recovery.js` (`attempt`, `save`), `src/main.js` (`mountAutosave`), `src/ui/song.js` (`setRecoveryHint`)
- Trigger: Edit a song whose serialized JSON is near or above the storage quota, then close the tab without saving.
- Workaround: Save the JSON file with «Guardar JSON» regularly. The `beforeunload` prompt still appears when there are unsaved changes.

**Save fallback reports success without confirmation:**
- Symptoms: When `window.showSaveFilePicker` is not available (Firefox and Safari, see the browser notes in `docs/ESTADO.md`), `writeFile` triggers a download and returns the name. The app then marks the song as saved and clears recovery, even if the user cancels the browser's download dialog.
- Files: `src/ui/file.js` (`writeFile`, `save`), `src/ui/exporter.js` (`saveHtml`)
- Trigger: Use «Guardar JSON» in a browser without the File System Access API and cancel or fail the download.
- Workaround: None in the app. The code comment acknowledges the browser cannot confirm the download.

**Reference warnings can persist after a deletion:**
- Symptoms: Deleting a measure leaves structure references (repeats, endings, markers, jumps) pointing at the removed ID. The file keeps them, and `checkStructure` reports them as warnings. The export is blocked until the user confirms.
- Files: `src/model/song.js` (`deleteMeasure`), `src/model/measureOps.js` (`deleteMeasures`), `src/model/structure.js` (`checkStructure`)
- Trigger: Delete a measure that is the start or end of a repeat, ending, or jump target.
- Workaround: Edit the structure items manually, or use undo. This is intended behavior per `docs/DTS.md`, but it creates a state that the user must notice.

## Security Considerations

**Local static server exposes the whole project directory:**
- Risk: `scripts/serve.mjs` serves every file under the project root, including dotfiles and `.git/`. `resolveInside` only blocks paths that leave the root. Any file placed in the folder, such as a local `.env` or a credential file, is readable at `http://127.0.0.1:5174/`.
- Files: `scripts/serve.mjs` (`resolveInside`, `createServer` handler)
- Current mitigation: The server binds to `127.0.0.1` only and sends `Cache-Control: no-store`. Cross-origin reads from other sites are blocked by default CORS rules.
- Recommendations: Restrict served paths to an allowlist (`index.html`, `src/`, `styles/`, `references/`, `config/`, `examples/`, `assets/`, `ayuda/`), and refuse any path whose segments start with `.`.

**No Content Security Policy:**
- Risk: `index.html` and `ayuda/index.html` load scripts and styles without a CSP meta tag. The app does not render untrusted HTML today (it builds nodes with `h()` in `src/render/dom.js`, and the exporter rejects `<script>` and similar tags), but a future `innerHTML` change would have no backstop.
- Files: `index.html`, `ayuda/index.html`, `src/export/document.js` (`buildExportDocument`)
- Current mitigation: Text is always inserted as text nodes. `buildExportDocument` throws if the body contains `script`, `link`, `iframe`, `object`, `embed`, `base` or `meta` tags. `neutralizeStyle` escapes `</style`.
- Recommendations: Add a `<meta http-equiv="Content-Security-Policy">` to `index.html` that allows only `'self'` for scripts and styles and `data:` for fonts. Check that the exported HTML works with the same policy.

**Untrusted JSON opened without size or depth limits:**
- Risk: «Abrir JSON» and the examples menu read whole files and call `JSON.parse` on the main thread. A very large or deeply nested file freezes the tab. The validator recurses over the whole structure.
- Files: `src/ui/file.js` (`picker` change handler), `src/model/serialize.js` (`parseSongJson`), `src/model/validate.js` (`validateSongShape`)
- Current mitigation: Unknown fields are rejected, and `validateSong` runs before the song replaces the open one.
- Recommendations: Reject files above a documented size (for example 5 MB) before parsing, with a readable error.

**Possible commit of personal songs:**
- Risk: `ESTADO.md` mentions a personal song JSON kept in the repository root and not versioned. `.gitignore` does not exclude `*.json` at the root, so a future `git add .` could commit it.
- Files: `.gitignore`, `docs/ESTADO.md`
- Current mitigation: No such file is currently tracked (`git status` is clean outside `.planning/`).
- Recommendations: Add a root-level ignore pattern for user songs (for example `/*.json`) or keep personal songs outside the repository.

## Performance Bottlenecks

**Full re-pagination on every content change:**
- Problem: Each change that is not selection, zoom or status schedules a full layout after 80 ms (`createPaginator`). Each layout reads the whole song, measures every chord card in the DOM (`createMeasurer`), and rebuilds all preview pages with `replaceChildren`.
- Files: `src/ui/paginator.js` (`schedule`, `run`), `src/layout/compute.js`, `src/layout/measurer.js` (`fragment`), `src/ui/preview.js` (`showResult`)
- Cause: The layout depends on real DOM measurement, so it cannot be computed purely from data. Text edits in the card editor therefore pay for a full measurement each time.
- Improvement path: Cache per-measure measurements keyed by the measure's serialized JSON and invalidate only the changed measure, or throttle text-scope updates more aggressively than structural ones.

**Layout cache is local to each run:**
- Problem: `paginate` builds its `cache` map per call, so measurements of unchanged measures are repeated on every run.
- Files: `src/layout/paginate.js` (`paginate`, `measure`), `src/layout/compute.js`
- Cause: No persistent cache keyed by measure content.
- Improvement path: Keep a `Map` keyed by `JSON.stringify(measure)` plus the layout spec, reset only when fonts or the scale change.

**Large embedded font data:**
- Problem: `references/fonts.css` is about 159 KB and embeds the fonts as base64 `data:` URIs (three `@font-face` rules). It is loaded by every page, including the help page and the export.
- Files: `references/fonts.css`, `ayuda/index.html`, `index.html`
- Cause: Offline-first design, so no network font is used.
- Improvement path: Keep the offline guarantee but serve the font files as separate `.woff2` assets, so the browser caches them and the CSS stays small. `scripts/serve.mjs` already has a `font/woff2` MIME entry.

## Fragile Areas

**Layout depends on measured pixel constants:**
- Files: `src/geometry/fretboard.js` (`GEOM`, `maxFrets: 32`, `MIN_FRETBOARD_WIDTH`), `src/layout/spec.js`, `src/layout/paginate.js`
- Why fragile: The maximum readable fret count (32) is justified by a comment about A4 pixel arithmetic (1123 - 38 - 48 - 26 ... / 28). A change to the margins, bar width or font in `styles/sheet.css` or `styles/tokens.css` changes the real capacity without any failing test.
- Safe modification: Change the CSS and the constants together, then run `tests/geometry.test.js` (the `maxFrets` test) and check a long example in the preview and the exported HTML.
- Test coverage: Geometry limits are tested. The visual result is verified only by manual checks recorded in `docs/ESTADO.md`.

**Repeat-measure width tied to a fixed CSS minimum:**
- Files: `src/render/sheet.js` (`--mastil-min`), `styles/sheet.css` (`.t-pos-repite`, `.fila-compacta`), `src/geometry/fretboard.js` (`MIN_FRETBOARD_WIDTH`)
- Why fragile: The repeat sign width is copied from `MIN_FRETBOARD_WIDTH` through a CSS variable. Changing one without the other shifts line breaks, as shown in the 0.10.1 change in `CHANGELOG.md`.
- Safe modification: Change `MIN_FRETBOARD_WIDTH` and the CSS together, then check the example «Havana» line breaks as described in `docs/ESTADO.md`.
- Test coverage: `tests/geometry.test.js` covers the constant, not the rendered line breaks.

**Structure and measure IDs share one namespace with fragile rules:**
- Files: `src/model/ids.js` (`createIdFactory`), `src/model/marks.js` (ID generation near line 196), `src/model/measureOps.js` (`pasteMeasures`, `reuseIds`)
- Why fragile: `createIdFactory` picks `prefix + (used.size + 1)`, and skips used IDs. Several separate places must add every reference type to `used`. A reference type that is missing from the list (for example a new field in `structure`) can produce a duplicate ID on paste or duplication, which `validateSong` then rejects at open time.
- Safe modification: When adding a field that stores an ID, add it to `createIdFactory` and to `listIds`, and extend `tests/dangling-ids.test.js`.
- Test coverage: `tests/dangling-ids.test.js` and `tests/cards.test.js` cover the current fields.

**Clipboard and cut/paste identity:**
- Files: `src/ui/clipboard.js`, `src/model/measureOps.js` (`copyMeasures`, `pasteMeasures`)
- Why fragile: `documentId` and `cut` decide whether pasting keeps original IDs. If `documentId` is not updated in every path that replaces the song (`store.replaceSong` in `src/store.js`), a paste into a newly opened file may reuse IDs from another document.
- Safe modification: Keep `replaceSong` as the only place that changes the document, and test pasting across two songs.
- Test coverage: `tests/measure-ops.test.js` covers paste within a document. Cross-document paste is not clearly covered.

## Scaling Limits

**Undo history memory:**
- Current capacity: `historyLimit` 100 steps and a byte budget of 8 MB (`createStore`, `historyBudget`). Each step stores two full JSON strings (before and after).
- Limit: A large song with frequent edits can use the whole budget and drop older steps earlier than the step count suggests. The budget counts JSON characters, not real heap size, so actual memory can be larger.
- Scaling path: Store inverse patches instead of full snapshots, or share the `before` string with the previous step's `after`.

**Preview size:**
- Current capacity: Layout runs over every measure in one pass, and the whole preview is replaced on each run (`src/ui/preview.js`, `pagesEl.replaceChildren`).
- Limit: Not measured in this repository. `docs/ESTADO.md` records checks with song examples, but not with large sizes.
- Scaling path: Render only visible pages (virtualize the page list) and measure lazily.

## Dependencies at Risk

**No lockfile and no dev tooling:**
- Risk: `package.json` declares no dependencies, and there is no `package-lock.json`, linter, formatter or type checker. Tests use the Node built-in runner (`node --test`), and CI runs on Node 24 (`.github/workflows/pages.yml`) while `Abrir-Compas.cmd` requires Node 18 or later.
- Impact: Low for runtime (there are no packages to update), but the two Node versions are not tested against each other, and style problems are not caught automatically.
- Migration plan: Add a CI matrix for Node 18 and 24, and add a basic lint step for unused exports and imports (this would have caught `src/ui/scrollRegions.js`).

**Build script depends on external tools:**
- Risk: `scripts/build_docs.py` needs `pandoc` and a LaTeX engine on the developer machine. The output PDFs are committed (for example `docs/latex/Manual_Uso_Compas_a_compas.pdf`, about 2 MB).
- Impact: Documentation builds fail on machines without these tools, and each rebuild changes binary files in git.
- Migration plan: Document the tool versions in `docs/manuals/INSTALACION.md`, or stop committing the generated PDFs and publish them only from CI.

## Missing Critical Features

**Browser coverage is incomplete:**
- Problem: Chromium is the only browser tested. Firefox, Safari, real print-to-PDF of compact lines, touch devices and screen readers are listed as pending in `docs/ESTADO.md` and `docs/DTS.md`.
- Blocks: Claims of cross-browser support, and reliable printing through the hidden iframe in `src/ui/exporter.js` (`printHtml`) on browsers other than Chromium.

**No automatic migration path:**
- Problem: `validateSongShape` rejects any `schemaVersion` other than 1 and states that a migration would need to be explicit. No migration code or versioned reader exists yet.
- Blocks: Releasing a schema 2 without breaking older files.

## Test Coverage Gaps

**UI modules have no tests:**
- What's not tested: Modules under `src/ui/` are not imported by any test. These include `src/ui/preview.js`, `src/ui/paginator.js`, `src/ui/file.js`, `src/ui/exporter.js`, `src/ui/dialog.js`, `src/ui/measureActions.js`, `src/ui/cardActions.js`, `src/ui/importList.js`, `src/ui/contextMenu.js`, `src/ui/clipboard.js`, `src/ui/workspace.js`, and `src/main.js`. Tests import only the model, layout, render and persistence logic.
- Files: `src/ui/*.js`, `src/main.js`, `src/layout/compute.js`
- Risk: Changes to saving, opening, recovery prompts, paginator invalidation and keyboard shortcuts can break without a failing test.
- Priority: High for `src/ui/file.js` (save and open).

**Recovery quota and file-save paths are not covered:**
- What's not tested: `tests/store.test.js` covers `createRecovery` with fake, missing and throwing storage, but not a quota error on `setItem` for a large song, nor the invalid-stored-JSON path in `offerRecovery`. The save and open flows in `src/ui/file.js` have no test.
- Files: `src/persist/recovery.js`, `src/ui/file.js`, `src/main.js` (`offerRecovery`)
- Risk: Data-loss scenarios (see the recovery and fallback bugs above) can regress silently.
- Priority: High. Adding a quota-throwing fake storage to `tests/store.test.js` covers the recovery case.

**Browser-only rendering paths:**
- What's not tested: Real DOM measurement in `src/layout/measurer.js` and `src/ui/paginator.js` runs only in a browser. `tests/` contains no browser-based test, so the layout is verified by manual checks recorded in `docs/ESTADO.md`.
- Files: `src/layout/measurer.js`, `src/ui/paginator.js`
- Risk: Font or layout differences between browsers can change line breaks or overflow unnoticed.
- Priority: Medium. A small headless browser check for two or three reference songs would give repeatable evidence.

---

*Concerns audit: 2026-11-19*
