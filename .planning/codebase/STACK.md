---
last_mapped_commit: 830301874da94daf3049ae0b8e8ae45994cea38b
last_mapped_at: 2026-11-19
---
# Technology Stack

**Analysis Date:** 2026-11-19

## Languages

**Primary:**
- JavaScript (ES modules, browser and Node) - all application code in `src/`, `scripts/`, `tests/`
- HTML5 - `index.html` (editor entry point), `ayuda/index.html` (help page)
- CSS3 - `styles/tokens.css`, `styles/base.css`, `styles/app.css`, `styles/sheet.css`, `styles/workspace.css`, `styles/export.css`

**Secondary:**
- JSON - song documents and examples in `examples/`, schema in `schemas/song.schema.json`, palette defaults in `config/palette-defaults.json`
- Python 3 - documentation build only, `scripts/build_docs.py` (not needed to run the app)
- LaTeX (via pandoc) - PDF manuals and technical design document, `docs/latex/*.tex`, `docs/latex/document-template.tex`
- Markdown - project documentation in `docs/`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `CHANGELOG.md`
- Windows batch - `Abrir-Compas.cmd` (double-click launcher, CRLF enforced by `.gitattributes`)

## Runtime

**Environment:**
- Node.js 18 or higher required by the user-facing launcher (`Abrir-Compas.cmd` checks `process.versions.node` against 18)
- Node.js 24 used in CI (`.github/workflows/pages.yml`, `actions/setup-node` with `node-version: '24'`) and in the Windows test runs recorded in `docs/DTS.md`
- Browser: native ES modules, CSS subgrid, `localStorage`; verified on Chromium 153 (`docs/DTS.md`). `showSaveFilePicker` is used when available, with a download-link fallback

**Package Manager:**
- npm (implied by `package.json` scripts; no runtime dependencies)
- Lockfile: missing (no `package-lock.json` in repository; not needed because there are no dependencies)

## Frameworks

**Core:**
- None. The app is built with native HTML, CSS and ES modules; `docs/DTS.md` states "No tiene framework, backend de negocio, base de datos ni dependencias npm de ejecución".
- Custom DOM rendering: `src/render/dom.js`, `src/render/sheet.js`, `src/render/card.js`, `src/render/marks.js`, `src/render/repeat.js`
- Custom state store: `src/store.js`
- Custom layout/pagination engine: `src/layout/compute.js`, `src/layout/paginate.js`, `src/layout/measurer.js`

**Testing:**
- Node built-in test runner (`node:test`) with `node:assert/strict` - 30 test files in `tests/`
- Test preload: `tests/setup.mjs` (installs palette defaults from `config/palette-defaults.json` before tests run)
- Run command: `npm test` runs `node --import ./tests/setup.mjs --test`

**Build/Dev:**
- No bundler, transpiler or dev server. Source files are served as-is.
- Local static server: `scripts/serve.mjs` (Node `node:http`, no dependencies, default port 5174, bound to 127.0.0.1)
- Windows launcher: `scripts/launch.mjs` (starts/reuses `serve.mjs`, opens browser)
- Pages packager: `scripts/build-pages.mjs` (copies runtime files into `_site/` with `.nojekyll`)
- Documentation builder: `scripts/build_docs.py` (pandoc `--from=gfm --to=latex`, then `lualatex` or `xelatex`; `--engine auto|lualatex|xelatex`)
- Fonts: `references/fonts.css` embeds Caveat Brush and Gochi Hand as base64 WOFF2 (`data:` URLs); `references/README.md` documents origin

## Key Dependencies

**Critical:**
- None at runtime. `package.json` has no `dependencies` or `devDependencies`.

**Infrastructure:**
- GitHub Actions: `actions/checkout@v6`, `actions/setup-node@v6`, `actions/upload-pages-artifact@v4`, `actions/configure-pages@v5`, `actions/deploy-pages@v4` in `.github/workflows/pages.yml`
- External tools only for documentation build: `pandoc`, `lualatex` or `xelatex` (checked by `scripts/build_docs.py`)

## Configuration

**Application:**
- App version: `package.json` field `version` (currently `0.10.1`); the script reads it for document builds
- Module type: `"type": "module"` in `package.json`
- Default palette: `config/palette-defaults.json`, loaded by `src/model/paletteDefaults.js` (browser `fetch`) and by `tests/setup.mjs` (Node `readFileSync`)
- Song data schema: `schemas/song.schema.json` (schemaVersion 1, see `docs/DATOS.md`)
- Startup example: `examples/ii-v-i-mayor-do.json`; catalog index `examples/index.json`
- Local recovery storage key: `compas-a-compas:recuperacion:v1` in `localStorage` (`src/persist/recovery.js`)
- No `.env` files present; the application reads no environment variables

**Build and tooling:**
- `.gitignore`: `node_modules/`, `coverage/`, `test-results/`, `playwright-report/`, `_site/`, `.env*`, `*.log`
- `.gitattributes`: `*.cmd -text` (keeps CRLF in Windows launcher)
- No `tsconfig.json`, ESLint, Prettier, Biome, Vite or Webpack configuration detected
- No `.nvmrc` or `.node-version` detected

**Entry points:**
- `index.html` loads `src/main.js` as `type="module"` and stylesheets in this order: `references/fonts.css`, `styles/tokens.css`, `styles/base.css`, `styles/app.css`, `styles/sheet.css`, `styles/workspace.css`
- `ayuda/index.html` loads `references/fonts.css`, `styles/tokens.css`, `styles/base.css` from parent paths

## Platform Requirements

**Development:**
- Node.js 18+ (24 recommended, matching CI) to run `npm start` and `npm test`
- A modern Chromium-based browser (Chromium 153 used for verification) or any browser with CSS subgrid and ES modules
- Optional for document rebuild: Python 3, pandoc, lualatex or xelatex

**Production:**
- Static hosting only. Deployed to GitHub Pages from `main` via `.github/workflows/pages.yml` (build artifact `_site/`)
- Local use: `scripts/serve.mjs` on `http://127.0.0.1:5174`, or double-click `Abrir-Compas.cmd` on Windows

---

*Stack analysis: 2026-11-19*
