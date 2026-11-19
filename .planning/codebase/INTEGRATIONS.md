---
last_mapped_commit: 830301874da94daf3049ae0b8e8ae45994cea38b
last_mapped_at: 2026-11-19
---
# External Integrations

**Analysis Date:** 2026-11-19

## APIs & External Services

**Third-party APIs:**
- None detected. No SDK imports, API keys, or remote service calls exist in `src/`, `scripts/`, or `index.html`.
- Only `http://` string in application code is the SVG namespace `http://www.w3.org/2000/svg` in `src/render/dom.js` (not a network call).

**Same-origin network requests (fetch):**
- `src/model/paletteDefaults.js` `loadPaletteDefaults()` - fetches `config/palette-defaults.json` (relative to module)
- `src/ui/examples.js` `fetchText()` / `fetchCatalog()` / `fetchExample()` - fetches `examples/index.json` and example song files
- `src/ui/exporter.js` `loadAssets()` - fetches `references/fonts.css`, `styles/tokens.css`, `styles/sheet.css`, `styles/export.css` to inline into exported HTML

All fetches are same-origin static file reads; no remote hosts are contacted.

## Data Storage

**Databases:**
- Not applicable. No database client, ORM, or database server.

**File Storage:**
- User-owned local JSON files. Song documents are UTF-8 `.json` (schema in `schemas/song.schema.json`, format in `docs/DATOS.md`).
- Save path: `src/ui/file.js` uses `window.showSaveFilePicker` when available (File System Access API), otherwise `URL.createObjectURL` + `<a download>`.
- HTML export: `src/ui/exporter.js` builds a standalone HTML sheet, same save strategy (`text/html;charset=utf-8`).
- Print: browser print dialog for PDF output (`src/ui/exporter.js` print tips; no `window.print` automation detected in code path beyond user action).
- Bundled examples: `examples/*.json`, `examples/ii-v-i/*.json`, catalog `examples/index.json`.

**Browser storage:**
- `localStorage` key `compas-a-compas:recuperacion:v1`, implemented in `src/persist/recovery.js` (default `globalThis.localStorage`). Holds a recovery copy of the serialized song with save date; failures are tolerated.
- Scope: per origin (`docs/DTS.md`).
- No `sessionStorage`, `IndexedDB`, or cookies detected.

**Caching:**
- None. The local server sends `Cache-Control: no-store` (`scripts/serve.mjs`).

## Authentication & Identity

**Auth Provider:**
- Not applicable. No users, accounts, sessions, or tokens.

## Monitoring & Observability

**Error Tracking:**
- None detected.

**Logs:**
- Console output only: `scripts/serve.mjs` logs the server URL; `scripts/launch.mjs` logs launcher status. No logging library.
- Browser unsaved-changes warning (`beforeunload`) used when supported, per `docs/DTS.md`.

## CI/CD & Deployment

**Hosting:**
- GitHub Pages, deployed by `.github/workflows/pages.yml` on push to `main` or manual dispatch.
- Published artifact is built by `scripts/build-pages.mjs` into `_site/` (copies `index.html`, `src`, `styles`, `assets`, `examples`, `config`, `ayuda`, `references/fonts.css`, `docs/latex/Manual_Uso_Compas_a_compas.pdf`, and writes `.nojekyll`).
- Local hosting: `scripts/serve.mjs` on `127.0.0.1:5174`; Windows double-click via `Abrir-Compas.cmd` -> `scripts/launch.mjs`, which opens the default browser through `cmd`-free spawn.

**CI Pipeline:**
- GitHub Actions, workflow `Publicar en GitHub Pages` in `.github/workflows/pages.yml`.
- Jobs: `build` (checkout with `persist-credentials: false`, Node 24, `npm test`, `node scripts/build-pages.mjs`, upload artifact) and `deploy` (`actions/deploy-pages@v4`, environment `github-pages`).
- Permissions: `contents: read` at top level; `pages: write` and `id-token: write` only on deploy job.
- Concurrency group `github-pages`, `cancel-in-progress: false`.

## Environment Configuration

**Required env vars:**
- None. The application and scripts do not read `process.env`.

**Local runtime requirements:**
- Node.js 18+ on the PATH (`Abrir-Compas.cmd` checks `node.exe`)
- Port 5174 on loopback (`URL_APP` in `scripts/launch.mjs`; overridable for `serve.mjs` with `--port N`)

**Secrets location:**
- No secrets are used or stored. `.env` and `.env.*` are git-ignored (`.gitignore`); none present.

## Webhooks & Callbacks

**Incoming:**
- None. The local HTTP server (`scripts/serve.mjs`) only serves GET/HEAD for static files and rejects other methods with 405; it has no API routes.

**Outgoing:**
- None.

## Font and Asset Licensing

- Embedded fonts: Caveat Brush and Gochi Hand, base64 WOFF2 inside `references/fonts.css`. `references/README.md` notes original licence and provenance should be verified before distributing the app outside this repository.
- Remote font or CDN requests: none. `references/README.md` warns that the legacy reference HTML (`references/referencia-tarjetas.html`) contains remote font requests that must not be carried into the product.

---

*Integration audit: 2026-11-19*
