# Estado de trabajo

Fecha: 16/10/2026. Especificación: 1.0.

## Preparado

- Requisitos consolidados, incluidas las correcciones sobre varios voicings, crecimiento de trastes y diseño completo de aplicación.
- Instrucciones para Claude y agentes de código, plan por fases y casos de validación.
- Modelo propuesto, esquema JSON y canción de prueba.
- Referencia visual histórica, CSS y fuentes Caveat Brush y Gochi Hand de la plantilla.

## Pendiente

| Fase | Estado |
| --- | --- |
| 0. Arranque y propuesta visual | Validada por el supervisor (ver registro) |
| 1. Edición y persistencia | Implementada; pendiente de validación del supervisor |
| 2. Mástil y tarjetas | No iniciada (la geometría reutilizable existe desde la fase 0, sin validar) |
| 3. Estructura musical | No iniciada |
| 4. Paginación y exportación | No iniciada |
| 5. Validación y guía de uso | No iniciada |

## Conexión

La conexión con el conector local está restablecida; el error `-32603` anterior ya no bloquea el trabajo. Esta fase se ha desarrollado en el worktree `supervisor/fase-0-interfaz`.

## Comprobaciones de preparación

Comprobados con Python: sintaxis JSON; restricciones de tipo, campos obligatorios, referencias de esquema y tamaños del ejemplo; IDs únicos y destinos del ejemplo existentes; rechazo de versión desconocida, propiedades inesperadas y digitación con menos de seis cuerdas. Comprobados los enlaces Markdown locales. Se ha usado una comprobación estructural del subconjunto del esquema, no un validador completo Draft 2020-12; esa validación completa queda pendiente en la fase de implementación.

## Registro de fases

Añadir por cada entrega: fase, fecha, archivos, comandos realmente ejecutados, resultados, revisión visual, limitaciones y siguiente tarea. No marcar una fase como completa si quedan sus condiciones de cierre sin revisar.

### Fase 0: propuesta de interfaz (16/10/2026)

- Estado: **validada por el supervisor**. Evidencia aportada por el supervisor: capturas reales a 1440 px (escritorio) y 390 px (móvil) sin errores JS; pruebas locales Node/DOM de montaje, selección, edición de título y acorde, texto `<script>` mostrado como texto, zoom y entrada inválida sin pérdida; geometría comprobada con los seis casos de `DISENO.md` y con los centros de traste. Alcance de esa evidencia: las pruebas DOM no se ejecutaron en un navegador real, y la captura móvil solo revisa el estado inicial. `src/model/frets.js` fue corregido en otra tarea: ya no admite punto ni guion como separadores.
- Nota: el texto original de esta entrada (escrito antes de la validación) decía que no se había ejecutado ninguna prueba; esa afirmación se refiere al momento de la implementación.
- Archivos: `index.html`; `assets/icon.svg`; `styles/base.css`, `styles/app.css`, `styles/sheet.css`; `src/main.js`, `src/store.js`; `src/model/frets.js`, `src/model/families.js`; `src/geometry/fretboard.js`; `src/render/dom.js`, `card.js`, `sheet.js`; `src/ui/song.js`, `measures.js`, `chord.js`, `marks.js`, `preview.js`, `disabled.js`; `README.md`; este documento.
- Implementado: cabecera con icono y versión discreta; datos de canción; lista de compases con selección; edición de etiqueta, acorde, textos, familia y digitación con vista previa en vivo; panel de marcas en solo lectura; hoja A4 apaisada con zoom y desplazamiento propios; varias tarjetas por compás, título exterior, texto interior y mástil horizontal con crecimiento de trastes; adaptación a 390 px; fuentes locales mediante `references/fonts.css`.
- Deshabilitado con explicación (fases posteriores): nuevo, abrir/guardar JSON, exportar HTML, imprimir/PDF, añadir/duplicar/mover/borrar compases, añadir marcas.
- Limitaciones: la hoja es única (muestra `1/1`) y crece si hay muchos compases, sin paginación; las marcas musicales no se dibujan; los cambios no se guardan; sin pruebas automáticas; geometría del mástil sin validar frente a los casos de `DISENO.md`.
- Pendiente de revisar por el supervisor: apertura sin errores en consola, legibilidad y ausencia de desbordamiento lateral en escritorio y 390 px, icono a la izquierda del nombre, fuentes originales en la hoja.
- Siguiente tarea: fase 1.

### Fase 1: edición y persistencia (16/10/2026)

- Estado: implementada, **pendiente de validación del supervisor**. No se ha ejecutado ninguna prueba ni se ha abierto la aplicación en esta entrega (sin terminal); las pruebas de `tests/` están escritas y por ejecutar con `npm test`.
- Archivos nuevos: `package.json`; `src/model/ids.js`, `song.js`, `structure.js`, `validate.js`, `serialize.js`, `listImport.js`; `src/persist/recovery.js`; `src/ui/dialog.js`, `notify.js`, `textOverride.js`, `file.js`, `importList.js`; `tests/helpers.js`, `validate.test.js`, `structure.test.js`, `song-ops.test.js`, `list-import.test.js`, `store.test.js`.
- Archivos modificados: `index.html`, `styles/app.css`, `styles/sheet.css`, `src/main.js`, `src/store.js`, `src/render/card.js`, `src/render/sheet.js`, `src/ui/song.js`, `measures.js`, `chord.js`, `marks.js`, `preview.js`, `disabled.js`; `README.md`; este documento.
- Implementado: alta, inserción, duplicado, movimiento y borrado de compases con IDs estables; varios acordes y voicings; edición de cada tarjeta con título encima y texto dentro heredados, personalizados u ocultos (cadena vacía) por voicing, más valores por defecto del acorde; los editores no se reconstruyen al escribir (ámbito `text` del estado); selección de tarjeta desde la hoja; validación de forma, `schemaVersion` 1, seis cuerdas, IDs únicos y campos permitidos; avisos de referencias musicales incompletas sin perder las marcas; Nuevo, Abrir y Guardar JSON; cambios pendientes con diálogo y `beforeunload`; copia de recuperación en `localStorage` explicada en la interfaz; entrada por lista con previsualización, errores por línea y aplicación todo o nada; consecuencias al borrar compases y aviso de tramos invertidos al mover.
- Deshabilitado con explicación: Exportar HTML, Imprimir/PDF, edición de marcas.
- Decisiones de implementación: los campos no permitidos bloquean la apertura en vez de descartarse; no se guarda con nombre de acorde o etiqueta vacíos; el borrado de un compás conserva las marcas con referencias pendientes; las listas se añaden al final.
- Limitaciones: sin comprobar en navegador (diálogos `<dialog>`, selector de archivos, `localStorage`, `beforeunload`); la hoja sigue siendo una sola y sin paginación; la descripción «se muestra el valor del acorde» de una tarjeta que hereda no se refresca hasta volver a seleccionarla si se edita el valor por defecto; no hay deshacer.
- Siguiente tarea: validación de la fase 1 por el supervisor; después, fase 2.
