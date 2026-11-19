---
last_mapped_commit: 830301874da94daf3049ae0b8e8ae45994cea38b
last_mapped_at: 2026-11-19
---
# Codebase Structure

**Analysis Date:** 2026-11-19

## Directory Layout

```
Compas-a-compas/
├── index.html              # Página única de la aplicación
├── package.json            # Metadatos (v0.10.1), scripts start y test; sin dependencias
├── AGENTS.md / CLAUDE.md   # Instrucciones para agentes de desarrollo
├── README.md / CHANGELOG.md
├── Abrir-Compas.cmd        # Lanzador de Windows (doble clic)
├── assets/                 # Icono vectorial (icon.svg)
├── ayuda/                  # Manual de uso en HTML (index.html)
├── config/                 # palette-defaults.json (colores de serie)
├── docs/                   # Documentación de producto, estado, manuales y LaTeX
├── examples/               # Canciones de ejemplo y index.json (catálogo)
├── references/             # fonts.css, diseno.css, referencia-tarjetas.html
├── schemas/                # song.schema.json
├── scripts/                # serve.mjs, launch.mjs, build-pages.mjs, build_docs.py
├── src/                    # Código fuente de la aplicación (ES modules)
│   ├── main.js             # Arranque y composición
│   ├── store.js            # Estado único, historial, selección
│   ├── model/              # Dominio: canción, tarjetas, marcas, paleta, validación
│   ├── geometry/           # Geometría del mástil (pura)
│   ├── layout/             # Medida y paginación A4
│   ├── render/             # DOM y SVG de tarjetas, hojas, marcas
│   ├── ui/                 # Paneles, diálogos, menús, vista previa
│   ├── export/             # HTML autónomo de hojas
│   └── persist/            # Copia de recuperación en localStorage
├── styles/                 # CSS de la app, hojas y exportación
├── tests/                  # Pruebas con node:test
├── .github/workflows/      # pages.yml: npm test y publicación
├── .planning/codebase/     # Documentos de mapeo (generados)
└── .gitignore              # node_modules, _site, coverage, .env*
```

## Directory Purposes

**`src/model/`** (18 archivos):
- Purpose: estructura y reglas de la canción; sin DOM.
- Contains: operaciones sobre compases y tarjetas, marcas, tonalidad, grados, paleta, validación, serialización, importación de listas, ejemplos.
- Key files: `src/model/song.js` (operaciones principales), `src/model/cards.js` (selección de tarjetas), `src/model/validate.js` (esquema), `src/model/serialize.js` (JSON), `src/model/palette.js`, `src/model/marksProjection.js`.

**`src/ui/`** (26 archivos):
- Purpose: paneles y controles, todos montados con `mount*(root, store, …)`.
- Contains: paneles de canción, compases, tarjetas, marcas, colores; vista previa y paginador; menús; diálogos; atajos.
- Key files: `src/ui/preview.js` (vista previa), `src/ui/paginator.js` (ciclo de paginación), `src/ui/chord.js` (editor de tarjeta), `src/ui/measures.js` (editor de compás), `src/ui/cardActions.js`, `src/ui/measureActions.js`, `src/ui/exporter.js`, `src/ui/file.js`.

**`src/layout/`** (8 archivos):
- Purpose: cálculo de hojas A4 a partir de medidas reales.
- Contains: constantes de página, unidades de reparto, medidor, algoritmo de paginación, problemas.
- Key files: `src/layout/spec.js` (medidas de página y `GAPS`), `src/layout/paginate.js` (reparto), `src/layout/measurer.js` (medida en DOM), `src/layout/atoms.js`.

**`src/render/`** (6 archivos):
- Purpose: nodos DOM/SVG; el mismo código sirve vista previa y exportación.
- Key files: `src/render/sheet.js`, `src/render/card.js`, `src/render/marks.js`, `src/render/repeat.js`, `src/render/dom.js`.

**`src/geometry/`** (1 archivo):
- Key files: `src/geometry/fretboard.js` (cálculo de trastes y `GEOM`).

**`src/export/`** (1 archivo):
- Key files: `src/export/document.js` (plantilla HTML y escape).

**`src/persist/`** (1 archivo):
- Key files: `src/persist/recovery.js`.

**`styles/`**:
- `tokens.css`: variables de diseño.
- `base.css`: reset y tipografía.
- `app.css`: interfaz general; `workspace.css`: disposición del editor.
- `sheet.css`: hojas en pantalla; `export.css`: estilos de la exportación.

**`tests/`** (39 archivos `*.test.js` más `helpers.js` y `setup.mjs`):
- Pruebas unitarias del modelo, layout, render, store y ejemplos. Ejecutan con `npm test`.

**`examples/`**:
- `index.json`: catálogo (`default`, lista de `{ file, title }`).
- `cancion-demo.json`, `ii-v-i-mayor-do.json`, `textos-tonalidades.json`, `Catalogo_Drop_voicings_Compas_a_compas.json`.
- `ii-v-i/`: variantes II–V–I mayores y menores, Drop 2, Set 1 y Set 2.

**`docs/`**:
- Documentación de producto: `REQUISITOS.md`, `DISENO.md`, `DATOS.md`, `PLAN.md`, `VALIDACION.md`, `ESTADO.md`, `WEB.md`, `DTS.md`, `INICIO_CLAUDE.md`.
- `manuals/`: manual de instalación y uso en Markdown, con `capturas/` (PNG).
- `latex/`: fuentes `.tex`, `.build.json` y PDF generados.
- `diseno/editor-compacto/`: propuestas visuales (PNG y README).
- `encargos/`: encargos por fase.

**`references/`**:
- `fonts.css`, `diseno.css`, `referencia-tarjetas.html`, `README.md`. Son recursos de diseño y de exportación; `fonts.css` se carga en `index.html`.

## Key File Locations

**Entry Points:**
- `index.html`: página principal, con `<script type="module" src="src/main.js">`.
- `src/main.js`: arranque de la aplicación.
- `scripts/serve.mjs`: servidor local.
- `scripts/launch.mjs`: lanzador que reutiliza o arranca el servidor.
- `ayuda/index.html`: manual enlazado desde la cabecera.

**Configuration:**
- `config/palette-defaults.json`: paleta predeterminada (obligatoria para arrancar).
- `schemas/song.schema.json`: esquema de la canción.
- `package.json`: scripts.
- `.github/workflows/pages.yml`: publicación en GitHub Pages.
- `.gitattributes`, `.gitignore`.

**Core Logic:**
- `src/store.js`: estado y historial.
- `src/model/song.js`: operaciones de canción.
- `src/layout/paginate.js`: reparto de hojas.
- `src/render/sheet.js`: construcción de hojas.
- `src/export/document.js`: HTML exportado.

**Testing:**
- `tests/*.test.js`: pruebas por módulo; `tests/setup.mjs` configura el entorno; `tests/helpers.js` comparte utilidades.
- Pruebas recientes siguen el nombre de la funcionalidad (p. ej. `tests/repeat-two.test.js`, `tests/compact-break-after.test.js`).

## Naming Conventions

**Files:**
- Módulos JavaScript en `camelCase` (`measureActions.js`, `marksContext.js`, `paletteDefaults.js`) dentro de `src/`.
- Pruebas en `kebab-case` con sufijo `.test.js` (`tests/line-break-swap.test.js`).
- Documentos de producto en `MAYÚSCULAS.md` (`docs/DISENO.md`, `docs/ESTADO.md`).
- Canciones de ejemplo en `kebab-case` o con el nombre del catálogo (`examples/ii-v-i/II-V-I_mayores_Drop2_Set1_Do.json`).
- Excepciones: `scripts/build_docs.py` (snake_case, Python) y `scripts/build-pages.mjs` / `serve.mjs` (kebab-case).

**Directories:**
- Minúsculas, un sustantivo por capa (`model`, `ui`, `layout`, `render`, `export`, `persist`, `geometry`).
- Documentación en `docs/` con subcarpetas en minúsculas (`manuals`, `latex`, `diseno`, `encargos`).

**Identifiers (dentro de la canción):**
- `id` generados por `createIdFactory` en `src/model/ids.js`; no reutilizar ids al duplicar.

**Exports:**
- Funciones con nombre (`export function`), sin export por defecto. Los `mount*` son los únicos puntos de entrada de paneles.
- Constantes en `MAYÚSCULAS` (`MAX_ROW_EXPANSION`, `PAGE_PX`, `GEOM`).

## Where to Add New Code

**Nueva operación de edición sobre la canción:**
- Función pura en `src/model/song.js` (o `src/model/measureOps.js` / `src/model/cards.js` si es de compás o tarjeta).
- Acción de UI en `src/ui/measureActions.js` o `src/ui/cardActions.js`, y control en el panel correspondiente.
- Pruebas en `tests/song-ops.test.js` o un archivo nuevo `tests/<tema>.test.js`.

**Nuevo panel o diálogo:**
- Implementación en `src/ui/<nombre>.js` con `export function mount<Nombre>(root, store, …)`.
- Montaje en `src/main.js` dentro de `boot()`.
- Marcado del contenedor en `index.html`, con clases de `styles/app.css` o `styles/workspace.css`.

**Nueva regla musical o cálculo sin DOM:**
- `src/model/<tema>.js`. No importar de `ui/`, `render/`, `layout/` ni `store.js`.

**Nueva forma de dibujar tarjeta, mástil o hoja:**
- Geometría en `src/geometry/`; nodos en `src/render/card.js` o `src/render/sheet.js`.
- Medidas de página en `src/layout/spec.js` y geometría de mástil en `src/geometry/fretboard.js`, nunca literales dispersos.

**Cambio en paginación:**
- `src/layout/paginate.js`, `src/layout/atoms.js`, `src/layout/measurer.js`; probar con `tests/paginate.test.js`, `tests/atoms.test.js`, `tests/layout-misc.test.js`.

**Nuevo campo de la canción:**
- Actualizar `schemas/song.schema.json`, `src/model/validate.js`, `src/model/serialize.js` si aplica, y `docs/DATOS.md`.

**Nuevo ejemplo:**
- Archivo JSON en `examples/` (o subcarpeta) y entrada en `examples/index.json`; `tests/examples.test.js` valida el catálogo.

**Estilos:**
- Variables en `styles/tokens.css`; interfaz en `styles/app.css`; hojas en `styles/sheet.css`; exportación en `styles/export.css`.

**Utilidades compartidas:**
- Helpers de DOM en `src/render/dom.js`; de notificación en `src/ui/notify.js`; de diálogo en `src/ui/dialog.js`.

## Special Directories

**`.planning/`:**
- Purpose: documentos de planificación y mapeo.
- Generated: sí (por herramientas GSD).
- Committed: según el flujo del proyecto; `.planning/codebase/` contiene estos documentos.

**`_site/`:**
- Purpose: salida de `scripts/build-pages.mjs`.
- Generated: sí.
- Committed: no (listado en `.gitignore`).

**`node_modules/`, `coverage/`, `test-results/`, `playwright-report/`:**
- Generated: sí; ignorados por `.gitignore`. No hay `node_modules` necesario porque el proyecto no tiene dependencias.

**`docs/latex/`:**
- Purpose: PDF de manual y DTS compilados, con su fuente `.tex` y `.build.json`.
- Generated: parcialmente (PDF y build generados por `scripts/build_docs.py`).
- Committed: sí.

**`examples/`:**
- Purpose: datos de ejemplo cargados por la aplicación en tiempo de ejecución (`fetch`); forman parte del despliegue en Pages.
- Committed: sí.

---

*Structure analysis: 2026-11-19*
