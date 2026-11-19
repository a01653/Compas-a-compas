---
last_mapped_commit: 830301874da94daf3049ae0b8e8ae45994cea38b
last_mapped_at: 2026-11-19
---
<!-- refreshed: 2026-11-19 -->
# Architecture

**Analysis Date:** 2026-11-19

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│                     Shell de página (index.html)                      │
│  Cabecera · barra de archivo · diálogos (canción, marcas, colores)    │
└───────────────┬────────────────────────┬─────────────────────────────┘
                │                        │
                ▼                        ▼
┌───────────────────────────┐  ┌──────────────────────────────────────┐
│  Paneles de edición (ui/) │  │  Vista previa (ui/preview.js,         │
│  measures · chord · song  │  │  ui/paginator.js, layout/*)           │
│  marks · colors · history │  │  paginación → render SVG/DOM          │
└────────────┬──────────────┘  └───────────────┬──────────────────────┘
             │ acciones                          │ lectura
             ▼                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│             Store único (`src/store.js`): canción + selección         │
│             historial deshacer/rehacer · emit(scope) · suscriptores   │
└───────────────┬──────────────────────────────────────────────────────┘
                │ funciones puras sobre la canción
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│      Modelo de dominio (`src/model/*`) + validación y serialización   │
│      (`model/validate.js`, `model/serialize.js`, `schemas/`)          │
└───────────────┬──────────────────────────────────────────────────────┘
                │
     ┌──────────┴───────────────┬─────────────────────────┐
     ▼                          ▼                         ▼
┌──────────────┐   ┌──────────────────────────┐  ┌────────────────────┐
│ geometry/    │   │ export/document.js       │  │ persist/recovery.js│
│ mástil (pura)│   │ HTML autónomo de hojas   │  │ localStorage       │
└──────────────┘   └──────────────────────────┘  └────────────────────┘
```

La aplicación es una SPA sin framework ni paso de compilación: módulos ES nativos cargados desde `index.html`, con dependencias `Node` solo para pruebas y servidor local (`package.json`, versión 0.10.1). No hay backend: los datos viven en la canción en memoria, en `localStorage` como copia de recuperación y en archivos JSON que el usuario abre o guarda.

## Pattern Overview

**Overall:** Estado centralizado con paneles derivados (store + suscripción), modelo de dominio puro y render por funciones que devuelven nodos DOM o SVG.

**Key Characteristics:**
- Un único objeto de estado (`createStore` en `src/store.js`) contiene `song`, `selection`, selección múltiple (`marked`, `markedCards`), `zoom`, `fileName`, `dirty` y el historial.
- Cada cambio de estado llega a los suscriptores con un ámbito (`scope`): `text`, `structure`, `document`, `history`, `selection`, `zoom`, `status`. Así cada panel decide si reconstruirse o solo actualizar la vista previa (ver comentario en `src/store.js`).
- El modelo (`src/model/*.js`) son funciones puras que reciben una canción y devuelven una canción nueva o un resultado; no tocan el DOM. Ejemplos: `addMeasure`, `duplicateMeasure`, `setLineFill` en `src/model/song.js`.
- La misma capa de render (`src/render/sheet.js`, `src/render/card.js`) alimenta la vista previa y la exportación, según el comentario de `docs/DISENO.md`.
- Sin dependencias externas en runtime: fuentes en `references/fonts.css`, paleta en `config/palette-defaults.json`, ejemplos en `examples/`.

## Layers

**Bootstrap y composición (`src/main.js`):**
- Purpose: cargar paleta y catálogo de ejemplos, crear el store y montar todos los paneles.
- Location: `src/main.js`
- Contains: `boot()`, `mountStatus`, `mountAutosave`, `offerRecovery`.
- Depends on: todos los `mount*` de `src/ui/*`, `src/store.js`, `src/persist/recovery.js`, `src/model/serialize.js`.
- Used by: `index.html` (`<script type="module" src="src/main.js">`).

**Store (`src/store.js`):**
- Purpose: única fuente de verdad editable; gestiona historial, selección y suscripciones.
- Location: `src/store.js`
- Contains: `createStore` (`emit`, `subscribe`, `beginEdit`, `commit`, `select`, `setMarked`, `setZoom`, `replaceSong`, `markSaved`, `undo`, `redo`), y selectores `selectionTarget`, `targetMeasureIds`, `targetCardKeys`, `selectedMeasure`, `selectedEvent`, `selectedVoicing`.
- Depends on: `src/model/cards.js` (`cardSelection`, `selectionKey`, `songCards`).
- Used by: todos los módulos de `src/ui/`, `src/main.js`.
- Notas: el historial tiene límite de pasos (`historyLimit = 100`) y de memoria (`historyBudget = 8 MiB`); los pasos se agrupan por `editGroup`/`lastGroup`.

**Modelo de dominio (`src/model/`):**
- Purpose: estructura de la canción, operaciones de edición, validación y reglas musicales.
- Location: `src/model/` (18 módulos).
- Contains:
  - Canción y operaciones: `song.js` (compases, eventos, voicings, repeticiones, anchos, saltos de línea), `ids.js`, `cards.js`, `measureOps.js`.
  - Derivados musicales: `degrees.js`, `tonality.js`, `frets.js`, `families.js`, `marks.js`, `marksContext.js`, `marksProjection.js`, `structure.js`.
  - Paleta: `palette.js`, `paletteDefaults.js`.
  - Entrada/salida: `serialize.js`, `validate.js`, `listImport.js`, `examples.js`.
- Depends on: `src/model/ids.js`, `src/model/structure.js`, `src/model/validate.js` (no importa de `ui/`, `render/`, `layout/` ni `store.js`).
- Used by: store, UI, render, layout y export.

**Geometría (`src/geometry/fretboard.js`):**
- Purpose: calcular trastes visibles y posiciones de notas del mástil; función pura.
- Location: `src/geometry/fretboard.js` (`GEOM`, `MIN_FRETBOARD_WIDTH`, `fretRange`, `layoutFretboard`, `findUndrawableVoicings`).
- Used by: `src/render/card.js` (`layoutFretboard`).

**Layout y paginación (`src/layout/`):**
- Purpose: medir tarjetas y compases reales en el DOM, repartirlos en filas y hojas A4 apaisadas.
- Location: `src/layout/`
  - `spec.js`: constantes de página (`PAGE_PX`, `GAPS`, `pageStyleVars`, `SAFETY_PX`, `MAX_ROW_EXPANSION`).
  - `atoms.js`: unidades de reparto (`buildUnits`, `groupAtoms`, `titleSpans`, `fragmentFlags`).
  - `measurer.js`: mide fragmentos con el DOM real; importa `src/render/sheet.js` (`fragmentNode`, `headerNode`).
  - `paginate.js`: algoritmo de reparto de filas y páginas (`paginate`).
  - `compute.js`: coordina medida y reparto (`computeLayout`).
  - `problems.js`: detecta conflictos (mástiles no dibujables, compases que no caben).
  - `fonts.js`: `ensureFonts` y `songSample`; espera a `document.fonts.ready`.
  - `zoom.js`: límites y ajuste de zoom.
- Depends on: `src/render/sheet.js` (vía measurer), `src/model/*`.
- Used by: `src/ui/paginator.js`, `src/ui/exporter.js`.

**Render (`src/render/`):**
- Purpose: construir nodos DOM y SVG de tarjetas, mástiles, marcas, hojas y compases de repetición.
- Location: `src/render/`
  - `dom.js`: helpers `h` (HTML) y `s` (SVG).
  - `card.js`: `cardNode`, `fretboardSvg`, `degreeDot`.
  - `sheet.js`: `pageNode`, `fragmentNode`, `headerNode`, `applySelection`.
  - `marks.js`: `marksParts`; `repeat.js`: `repeatSymbol`, `repeatSymbolTwo`.
- Depends on: `src/geometry/fretboard.js`, `src/model/*` (palette, marksProjection, tonality, song).
- Used by: `src/ui/preview.js`, `src/ui/exporter.js`, `src/layout/measurer.js`.

**Paneles de UI (`src/ui/`):**
- Purpose: controles de edición y vista previa; cada `mount*` se suscribe al store.
- Location: `src/ui/` (26 módulos).
- Key modules:
  - Canción y compás: `song.js` (`mountSongPanel`), `measures.js` (`mountMeasuresPanel`), `measureActions.js` (`createMeasureActions`, `mountEditShortcuts`), `measureActions.js`.
  - Tarjetas: `chord.js` (`mountChordPanel`), `cardActions.js` (`createCardActions`).
  - Marcas y colores: `marks.js` (`mountMarksPanel`), `colors.js` (`mountColorsPanel`).
  - Vista previa: `preview.js` (`mountPreviewPanel`), `paginator.js` (`createPaginator`), `scrollRegions.js`, `contextMenu.js`.
  - Archivo y ejemplos: `file.js` (`mountFileControls`), `examples.js` (`fetchCatalog`, `fetchExample`, `mountExamplesMenu`), `exporter.js` (`mountExportControls`), `importList.js` (`openImportDialog`).
  - Transversales: `history.js` (`mountHistoryControls`), `workspace.js` (`mountWorkspace`), `clipboard.js` (`createClipboard`), `dialog.js`, `notify.js`, `icons.js`, `disabled.js`.
- Depends on: `src/store.js`, `src/model/*`, `src/render/*`, `src/layout/*`, `src/export/*`, `src/persist/*`.

**Exportación (`src/export/document.js`):**
- Purpose: ensamblar un HTML autónomo con las hojas ya serializadas, sin JavaScript ni peticiones externas.
- Location: `src/export/document.js` (`buildExportDocument`, `escapeHtml`, `neutralizeStyle`, `htmlFileName`, `exportTitle`).
- Depends on: `src/model/serialize.js` (`titleFileName`).
- Used by: `src/ui/exporter.js`, que lee `styles/*.css` y `references/fonts.css` como recursos.

**Persistencia (`src/persist/recovery.js`):**
- Purpose: copia de recuperación en `localStorage` bajo la clave `compas-a-compas:recuperacion:v1`; es red de seguridad, no guardado.
- Location: `src/persist/recovery.js` (`createRecovery`).
- Used by: `src/main.js`, `src/ui/file.js`, `src/ui/examples.js`.

## Data Flow

### Primary Request Path (edición de una tarjeta)

1. Un control de `src/ui/chord.js` o `src/ui/cardActions.js` llama a una función de `src/model/song.js` o `src/model/cards.js` sobre la canción actual.
2. El resultado se aplica con `store.commit(scope, selection, …)` (`src/store.js`), que registra el paso de historial y emite un `scope`; las ediciones agrupadas usan `beginEdit`/`endEdit`.
3. `src/main.js` (`mountAutosave`) programa la copia de recuperación (800 ms) cuando `state.dirty` es verdadero.
4. `src/ui/preview.js` y `src/ui/paginator.js` reciben el `scope`, esperan `delay` ms (80 ms por defecto) y relanzan la paginación.
5. `src/layout/compute.js` → `src/layout/paginate.js` reparte filas y hojas midiendo fragmentos con `src/layout/measurer.js`.
6. `src/render/sheet.js` construye las hojas; `applySelection` solo cambia clases, sin recalcular.

### Carga de canción

1. `boot()` en `src/main.js` carga la paleta (`loadPaletteDefaults`, de `config/palette-defaults.json`) y el catálogo (`fetchCatalog`, de `examples/index.json`).
2. `fetchExample` lee el ejemplo por defecto y `parseSongJson` (`src/model/serialize.js`) lo valida con `src/model/validate.js` contra la forma de `schemas/song.schema.json`.
3. `createStore(opened.song, …)` crea el estado; `offerRecovery` pregunta si restaurar una copia de `localStorage`.

### Exportación HTML o impresión

1. `mountExportControls` (`src/ui/exporter.js`) espera `ensureFonts()` y la última paginación del paginador.
2. `pageNode` (`src/render/sheet.js`) serializa cada hoja; `buildExportDocument` (`src/export/document.js`) las incrusta junto con los CSS leídos por `fetch`.
3. Se descarga el HTML; la impresión usa el mismo markup en una ventana.

**State Management:**
- Todo el estado editable pasa por `createStore`. Los paneles no guardan copias propias de la canción.
- Selección (`selection`), selección múltiple (`marked`, `markedCards`) y `selectMode` son estado de vista: no entran en el JSON ni crean pasos de historial.
- `documentId` cambia al sustituir la canción para que los paneles reconstruyan sus controles.

## Key Abstractions

**Canción (`song`):**
- Purpose: documento completo, serializable a JSON.
- Shape: `song.measures[]` → cada compás tiene `chordEvents[]` → cada evento tiene `voicings[]` (tarjetas) con `frets`, `degrees`, `anchorFret`, anotaciones y tonalidad. Definido en `schemas/song.schema.json` y `docs/DATOS.md`.
- Creación: `createEmptySong`, `createStarterSong` en `src/model/song.js`.
- Pattern: objetos planos con `id` generados por `createIdFactory` (`src/model/ids.js`); las referencias se hacen por id y `src/model/validate.js` detecta ids colgantes (`tests/dangling-ids.test.js`).

**Tarjeta y clave de selección:**
- Purpose: un voicing dentro de un evento; se referencia con `selectionKey`.
- Examples: `src/model/cards.js` (`songCards`, `cardSelection`, `selectionKey`).
- Pattern: la selección de tarjetas se guarda como lista de claves ordenadas, y `normalizeSelection` del store la reajusta tras cada cambio.

**Unidades de reparto:**
- Purpose: fragmentos de compás que el paginador puede colocar en una fila; permiten continuar un compás en otra fila o página con la etiqueta «continuación».
- Examples: `src/layout/atoms.js` (`buildUnits`, `groupAtoms`, `fragmentFlags`).

**Paginador:**
- Purpose: ejecutar la paginación de forma asíncrona con generación (`generation`) para descartar resultados obsoletos.
- Examples: `src/ui/paginator.js` (`createPaginator`), con `waiters` para que la exportación espere la última pasada.

**Mástil:**
- Purpose: geometría del diagrama de cuerdas; sin DOM.
- Examples: `src/geometry/fretboard.js` (`layoutFretboard`, `GEOM`, `MIN_FRETBOARD_WIDTH`). Las medidas de página están en `src/layout/spec.js`.

## Entry Points

**Aplicación en navegador:**
- Location: `index.html` → `src/main.js`.
- Triggers: carga de la página desde un servidor local o GitHub Pages.
- Responsibilities: montar paneles y arrancar con el ejemplo inicial.

**Servidor local:**
- Location: `scripts/serve.mjs` (`node scripts/serve.mjs [--port N]`, puerto por defecto 5174, solo `127.0.0.1`).
- Triggers: `npm start`, o `Abrir-Compas.cmd` a través de `scripts/launch.mjs`.
- Responsibilities: servir estáticos con tipos MIME propios; sin dependencias.

**Publicación:**
- Location: `scripts/build-pages.mjs` (copia a `_site/`) y `.github/workflows/pages.yml` (ejecuta `npm test` y publica).
- Triggers: push a `main`.

**Pruebas:**
- Location: `tests/*.test.js`, con `tests/setup.mjs` y `npm test` (`node --import ./tests/setup.mjs --test`).

**Documentación generada (opcional):**
- Location: `scripts/build_docs.py`; no es necesario para usar la aplicación.

## Architectural Constraints

- **Threading:** un único hilo de navegador; la paginación se difiere con `setTimeout` (`src/ui/paginator.js`) y la medida depende de `document.fonts.ready`.
- **Global state:** `src/store.js` no usa singletons de módulo; el estado vive en la instancia de `createStore`. Hay acceso a `globalThis.localStorage` en `src/persist/recovery.js` (con parámetro inyectable `getStorage`) y a `window` en `src/ui/contextMenu.js`, `src/ui/scrollRegions.js`, `src/ui/measureActions.js`, `src/ui/file.js` y `src/ui/exporter.js`.
- **Circular imports:** no se detectan ciclos entre `src/model/`. La capa de layout depende de render (`src/layout/measurer.js` importa `src/render/sheet.js`), y render no importa de layout ni de ui.
- **Dirección de dependencias:** `model` no importa de `ui`, `render`, `layout`, `store`, `persist` ni `export` (comprobado con búsqueda de imports). Mantener esta regla al añadir reglas musicales.
- **Límites de página:** A4 apaisado, márgenes y espacios fijos en `src/layout/spec.js`; `maxPerRow` opcional y limitado a 16 (`MAX_MEASURES_PER_ROW_LIMIT` en `src/model/song.js`).
- **Recursos externos:** la exportación no puede depender de servidor; los CSS y la fuente se leen con `fetch` solo en la aplicación (`src/ui/exporter.js`, `src/model/paletteDefaults.js`, `src/ui/examples.js`), y el HTML exportado no contiene scripts.

## Anti-Patterns

### Lectura directa del DOM para el estado de la canción

**What happens:** algunos módulos consultan `document.getElementById` (p. ej. `src/main.js` para `estado-archivo`, `aviso-carga`, paneles).
**Why it's wrong:** el montaje queda acoplado a los identificadores de `index.html`; cambiar el marcado obliga a tocar varios módulos.
**Do this instead:** recibir el contenedor como parámetro en cada `mount*` (patrón de `mountMeasuresPanel(root, store, …)` en `src/ui/measures.js`) y no buscar nodos globales dentro de los paneles.

### Mutar la canción sin pasar por el store

**What happens:** las funciones de `src/model/song.js` son puras; un control que alterara la canción sin pasar por el store saltaría el historial y la marca de cambios.
**Why it's wrong:** se pierde deshacer/rehacer y la copia de recuperación no se actualiza.
**Do this instead:** construir la canción nueva con las funciones del modelo y confirmarla con `store.commit` o `store.replaceSong` (`src/store.js`), con el `scope` adecuado.

### Repetir cálculo de paginación en cada evento

**What happens:** un cambio de selección o de zoom no debe relanzar medidas.
**Why it's wrong:** la medición con DOM real es costosa; el store ya distingue `selection` y `zoom`.
**Do this instead:** `src/main.js` ignora `zoom` y `selection` en `mountStatus` y `mountAutosave`; mantener ese filtro en cualquier nuevo suscriptor de paginación.

## Error Handling

**Strategy:** validación al entrar (JSON y forma del esquema) con mensajes en español; errores de carga visibles en `#aviso-carga`; almacenamiento y red fallan sin bloquear la edición.

**Patterns:**
- `parseSongJson` devuelve `{ ok, song, warnings }` o `{ ok: false, errors }` sin tocar la canción abierta (`src/model/serialize.js`).
- `formatError` (`src/model/validate.js`) convierte errores en texto para la UI.
- `createRecovery` captura fallos de `localStorage` y los ignora (`src/persist/recovery.js`).
- Problemas de maquetación se listan con `collectProblems` (`src/layout/problems.js`) en lugar de ocultar contenido.

## Cross-Cutting Concerns

**Logging:** no hay sistema de logs; los avisos al usuario se emiten con `notify` (`src/ui/notify.js`) y los diálogos con `confirmDialog`, `openDialog`, `errorDialog` (`src/ui/dialog.js`).
**Validation:** `src/model/validate.js` y `src/model/structure.js` (`checkStructure`, `newInversions`, `newRepeatWarnings`); esquema en `schemas/song.schema.json`.
**Authentication:** no aplica; aplicación local sin usuarios.
**Accesibilidad:** `aria-live` en el estado de archivo y resúmenes de la vista previa; atajos de teclado en `src/ui/measureActions.js` (`mountEditShortcuts`).

---

*Architecture analysis: 2026-11-19*
