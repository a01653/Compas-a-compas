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
| 1. Edición y persistencia | Validada por el supervisor (ver registro) |
| 2. Mástil y tarjetas | Validada por el supervisor (ver registro) |
| 3. Estructura musical | Validada por el supervisor (ver registro) |
| 4. Paginación y exportación | Implementada; pendiente de validación del supervisor (pruebas escritas, no ejecutadas por quien implementa) |
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

- Estado: **validada por el supervisor**. Evidencia aportada por el supervisor: 45 pruebas Node superadas; 1575 casos de paridad entre AJV 2020 y la validación manual; navegador Chromium 153 con archivo, listas y recuperación; anchuras 360, 390, 430, 1280 y 1440 px. El texto siguiente de esta entrada describe la entrega original (escrita sin terminal ni navegador).
- Entrega original: implementada sin ejecutar pruebas ni abrir la aplicación; las pruebas de `tests/` se ejecutaron después por el supervisor con `npm test`.
- Archivos nuevos: `package.json`; `src/model/ids.js`, `song.js`, `structure.js`, `validate.js`, `serialize.js`, `listImport.js`; `src/persist/recovery.js`; `src/ui/dialog.js`, `notify.js`, `textOverride.js`, `file.js`, `importList.js`; `tests/helpers.js`, `validate.test.js`, `structure.test.js`, `song-ops.test.js`, `list-import.test.js`, `store.test.js`.
- Archivos modificados: `index.html`, `styles/app.css`, `styles/sheet.css`, `src/main.js`, `src/store.js`, `src/render/card.js`, `src/render/sheet.js`, `src/ui/song.js`, `measures.js`, `chord.js`, `marks.js`, `preview.js`, `disabled.js`; `README.md`; este documento.
- Implementado: alta, inserción, duplicado, movimiento y borrado de compases con IDs estables; varios acordes y voicings; edición de cada tarjeta con título encima y texto dentro heredados, personalizados u ocultos (cadena vacía) por voicing, más valores por defecto del acorde; los editores no se reconstruyen al escribir (ámbito `text` del estado); selección de tarjeta desde la hoja; validación de forma, `schemaVersion` 1, seis cuerdas, IDs únicos y campos permitidos; avisos de referencias musicales incompletas sin perder las marcas; Nuevo, Abrir y Guardar JSON; cambios pendientes con diálogo y `beforeunload`; copia de recuperación en `localStorage` explicada en la interfaz; entrada por lista con previsualización, errores por línea y aplicación todo o nada; consecuencias al borrar compases y aviso de tramos invertidos al mover.
- Deshabilitado con explicación en esa entrega: Exportar HTML, Imprimir/PDF, edición de marcas (la edición de marcas se implementó después, en la fase 3).
- Decisiones de implementación: los campos no permitidos bloquean la apertura en vez de descartarse; no se guarda con nombre de acorde o etiqueta vacíos; el borrado de un compás conserva las marcas con referencias pendientes; las listas se añaden al final.
- Limitaciones: sin comprobar en navegador (diálogos `<dialog>`, selector de archivos, `localStorage`, `beforeunload`); la hoja sigue siendo una sola y sin paginación; la descripción «se muestra el valor del acorde» de una tarjeta que hereda no se refresca hasta volver a seleccionarla si se edita el valor por defecto; no hay deshacer.
- Siguiente tarea: validación de la fase 1 por el supervisor; después, fase 2.

### Fase 2: mástil, tarjetas y grados manuales (16/10/2026)

Distinción entre lo implementado y lo validado:

- **Implementado:** todo lo listado a continuación (escrito sin terminal ni navegador).
- **Validado por el supervisor.** Evidencia aportada por el supervisor: 76 pruebas Node superadas; en navegador, grados manuales con leyenda completa, cuerda al aire, herencia de texto sin perder el foco, 16 trastes y aviso de 99 trastes sin perder datos. Esta evidencia es la del supervisor; los puntos de «Limitaciones» que no menciona (p. ej. revisión visual de cejuela o grados muy largos) siguen sin revisar.

Archivos nuevos: `src/model/degrees.js`; `tests/geometry.test.js`, `tests/degrees.test.js`, `tests/frets.test.js`.
Archivos modificados: `src/geometry/fretboard.js`, `src/render/card.js`, `src/model/song.js`, `src/model/structure.js`, `src/ui/chord.js`, `src/ui/textOverride.js`, `src/ui/preview.js`, `styles/app.css`, `styles/sheet.css`, `README.md`, este documento. No se han tocado el esquema ni `references/`.

Implementado:
- Edición opcional de los seis grados por cuerda (sexta→primera). Campo vacío o solo espacios = `null`; si los seis están vacíos se elimina `degrees`. No se infiere ningún grado. Se conservan `frets`, textos e IDs.
- Color de cada nota según su grado manual con los colores de la plantilla (acepta ♭ y ♯), también en cuerdas al aire (círculo relleno con la etiqueta). Un grado sin color definido usa la tinta; en cuerdas mudas el grado se conserva y no se dibuja. Las etiquetas de más de 3 caracteres se abrevian solo en el dibujo (el dato y el título del punto conservan el texto completo).
- Geometría: primera cuerda arriba, centrado entre divisiones, mínimo tres trastes, crecimiento automático, con notas al aire comienza en el traste 1 con cejuela. `fretRange` recorre las seis notas una sola vez, sin copias ni spread.
- Spans muy grandes: por encima de 32 trastes (`GEOM.maxFrets`, capacidad de una fila A4 a 30 px por traste) la geometría devuelve `drawable: false` y un motivo, sin construir listas por traste; la tarjeta muestra un aviso en lugar del mástil, el editor avisa bajo la digitación y la vista previa lista las tarjetas afectadas. Los datos no se modifican. `findUndrawableVoicings(song)` queda como punto de enganche para que la fase 4 bloquee una exportación incompleta; **ese bloqueo aún no existe**.
- Ayuda de herencia de texto: al editar el valor por defecto del acorde se actualiza el texto de ayuda de la tarjeta sin reconstruir ningún input (no se pierde foco ni cursor).
- Ayuda de la etiqueta del compás sin identificadores internos; los avisos de marcas incompletas ya no muestran IDs técnicos.

Limitaciones y pendiente real:
- El límite de 32 trastes sale del ancho útil de una fila A4 (`GEOM.maxFrets`); un mástil así de ancho ocupa toda la fila y debe revisarse con la paginación de la fase 4.
- Corrección posterior a la revisión del supervisor: se retiró de `src/geometry/fretboard.js` un `require` que rompía los módulos ES; la geometría vuelve a ser pura y sin imports. La leyenda de grados abreviados (cuerda → grado completo) se calcula ahora en `src/render/card.js` y se muestra bajo el mástil solo si `degreeDisplay` abrevia alguna etiqueta de una cuerda dibujada. Implementado, sin validar.
- Sin revisión visual de grados largos, notas al aire con grado, cejuela ni tarjetas ilegibles; sin comprobar en navegador la actualización de la ayuda de herencia.
- Las tarjetas con aviso ocupan ancho fijo; la reorganización de filas por ancho real llega con la paginación (fase 4).
- En el momento de esta entrega la fase 3 y la fase 4 estaban pendientes; ahora la fase 3 está implementada (ver su entrada) y la fase 4 sigue pendiente, con exportar HTML e imprimir deshabilitados.

### Fase 3: estructura musical (16/10/2026)

- Estado: **validada por el supervisor**. Evidencia aportada por el supervisor (no repetida por quien implementó la fase 4): 97 pruebas Node superadas; en Chromium 153, alta/edición/borrado de marcas ×3, casillas 1 y 2 sobre varios compases, SVG de Segno y Coda, D.S. al Coda, destino eliminado conservado como pendiente, guardado y anchura móvil de 360 px. Correcciones del supervisor posteriores a la implementación: la fábrica de IDs reserva ahora también las referencias colgantes; `src/ui/marks.js` usa `replaceChildren` con arrays y `null` de forma segura, las pasadas admiten texto y atajos (máximo 8) y las etiquetas se actualizan sin perder el foco.
- Entrega original: quien la escribió no tenía terminal ni navegador; las pruebas se ejecutaron después por el supervisor con `npm test`.
- Archivos nuevos: `src/model/marks.js` (alta, edición, borrado, validación, consecuencias, etiquetas y opciones pendientes); `src/model/marksProjection.js` (proyección pura de marcas por compás y por fragmento, pensada para que la fase 4 la reutilice al paginar y partir un compás); `src/render/marks.js` (SVG de Segno y Coda, barras de repetición, ×N y corchetes); `tests/marks.test.js`, `tests/marks-projection.test.js`.
- Archivos modificados: `src/ui/marks.js` (panel reescrito), `src/render/sheet.js`, `src/model/structure.js` (solo exporta `JUMP_NEEDS`), `styles/sheet.css`, `styles/app.css`, `README.md`, este documento. No se han tocado el esquema, `references/` ni la geometría del mástil.
- Implementado:
  - Panel con lista, **Editar**/**Borrar** por marca y formulario único para repeticiones ×N (entero ≥ 2), casillas (casillas de pasadas, varias a la vez, únicas y enteras; con repetición asociada no pueden superar sus pasadas), Segno/Coda/Fine y los siete saltos (cada uno pide exactamente sus destinos). Opciones cerradas por el esquema; tramos invertidos bloqueados.
  - Compases y destinos se eligen por ID con etiqueta legible («Compás 3 (posición 3) · Cm7, F7»). Un compás, repetición o destino ausente se muestra como opción pendiente seleccionada y se conserva al guardar, con aviso; nunca se sustituye por la primera opción. Un destino sin elegir se guarda como salto incompleto con aviso.
  - Un formulario inválido no aplica nada ni borra lo escrito; la marca original queda intacta. Al cambiar el tipo de salto solo se escriben los destinos que ese tipo usa.
  - Borrar una marca presenta las consecuencias con Cancelar y Borrar; las referencias a ella quedan pendientes. Los IDs de marcas borradas con referencias pendientes no se reutilizan, para que un destino pendiente no se enlace en silencio a una marca nueva.
  - Hoja: bloque de marcas propio sobre las tarjetas (no ocupa el espacio de los títulos), con varias marcas apiladas o en varias líneas sin ocultarse; Segno y Coda como SVG propio; barras de repetición con puntos y ×N; corchete de casilla con etiqueta («1., 2.», «1.–3.»); fine con doble barra; saltos como texto. Una casilla o repetición que atraviesa compases sigue identificable («cont. 1.», «cont. ×3», corchete abierto a los lados). La numeración escrita no cambia y no se expande ningún recorrido.
  - Proyección (`projectMarks` + `fragmentMarks`): para un fragmento de compás, el inicio de repetición y las marcas «antes» solo van en el primer fragmento, el final y las marcas «después» solo en el último; los fragmentos intermedios solo llevan continuidad.
- Pruebas escritas (por ejecutar): CRUD, IDs únicos y sin reutilización, pasadas y tramos, tipos cerrados, requisitos de cada salto, destinos pendientes, consecuencias de borrado, etiquetas, proyección con bordes y continuidad, marcas múltiples y tramos no dibujables.
- Limitaciones y pendiente real:
  - Sin revisión visual en navegador: no se ha comprobado el aspecto de las barras de repetición, el corchete al cruzar fila, la altura reservada ni el panel a 390 px.
  - La hoja sigue siendo única, sin paginación; la continuidad al cruzar fila es la de la maquetación actual de la hoja. La fase 4 deberá llamar a `fragmentMarks` con `isFirst`/`isLast` reales.
  - Las marcas no pueden seleccionarse desde la hoja. No hay deshacer. Las marcas aún no se incluyen en ninguna exportación (Exportar HTML e Imprimir/PDF siguen deshabilitados).
  - La exportación (fase 4) deberá advertir de destinos pendientes; esa advertencia todavía no existe (resuelto en la fase 4, ver abajo).

### Fase 4: paginación y exportación (16/10/2026)

- Estado: **implementada, pendiente de validación del supervisor**. Quien la escribió no tiene terminal ni navegador: no se ha ejecutado ninguna prueba ni se ha visto la interfaz, la exportación ni la impresión. Las pruebas están escritas y por ejecutar con `npm test`. La evidencia de las fases 0 a 3 es la registrada arriba, aportada por el supervisor.
- Archivos nuevos: `src/layout/spec.js` (A4 en mm, márgenes, separaciones), `atoms.js` (unidades y fragmentos), `paginate.js` (reparto puro), `problems.js` (bloqueos), `zoom.js`, `fonts.js`, `measurer.js` (medición DOM), `compute.js`; `src/export/document.js` (ensamblado y escape); `src/ui/paginator.js` (paginación asíncrona), `src/ui/exporter.js` (Exportar HTML e Imprimir / PDF); `styles/tokens.css`, `styles/export.css`; `tests/paginate.test.js`, `atoms.test.js`, `export-document.test.js`, `layout-misc.test.js`.
- Archivos modificados: `src/render/sheet.js` (renderizador único: fragmentos, cabecera, hoja, selección sin reconstruir), `src/render/card.js` (atributos `data-event-id`/`data-voicing-id`), `src/ui/preview.js` (vista previa multihoja), `src/main.js`, `index.html` (botones activos, hoja de estilos `tokens.css`), `styles/sheet.css` (sin reglas de edición, mm exactos, texto que ajusta línea), `styles/base.css` (las variables pasan a `tokens.css`), `styles/app.css` (reglas de edición sobre la hoja, `scrollbar-gutter`, marco de impresión, `@media print`), `README.md`, este documento. No se han tocado el esquema, `references/`, la geometría del mástil ni `src/ui/marks.js`.
- Implementado:
  - Un solo renderizador (`src/render/sheet.js`) para medir, mostrar y exportar. Sin `onSelect` los nodos no llevan manejadores: es lo que se serializa.
  - Separación entre proyección de marcas (`marksProjection.js`, sin cambios), medición (`measurer.js`, DOM tras `document.fonts.load` con el texto real de la canción y `fonts.ready`) y reparto (`paginate.js`, puro).
  - Hoja A4 apaisada 297 × 210 mm, márgenes de 10 mm (área útil 277 × 190 mm), medidas en mm vía variables CSS; cabecera con canción y tonalidad y `actual/total` arriba a la derecha en columna propia (`min-width: 6em`), sin colisión con títulos largos.
  - Reparto: compás entero si cabe en la fila, si no otra fila, si falta altura otra hoja; un compás que no cabe ni en una fila vacía se parte entre tarjetas (misma etiqueta, «continuación»), sin máximo oculto; título exterior y tarjeta no se separan; `fragmentMarks` recibe `isFirst`/`isLast` reales; casillas y repeticiones muestran continuidad; los voicings de un acorde partido se marcan con un trazo de puntos.
  - Título, nombre y texto interior ajustan línea al ancho del mástil; etiquetas de compás en el flujo (altura medida).
  - Bloqueo de Exportar HTML e Imprimir / PDF si una digitación supera `GEOM.maxFrets` (32) o si algo no cabe ni solo (error de ancho, alto o cabecera); los datos no se tocan. El aviso aparece también en la vista previa.
  - Exportar HTML: documento único con `references/fonts.css`, `tokens.css`, `sheet.css` y `export.css` leídos con `fetch` en ejecución; solo hojas; sin JavaScript ni peticiones externas; título escapado y rechazo de etiquetas activas sin escapar en el cuerpo. Descarga con el selector de archivos si existe o enlace de descarga.
  - Imprimir / PDF: imprime ese mismo HTML desde un marco oculto con `@page { size: 297mm 210mm; margin: 0 }`, `break-after` en todas las hojas menos la última, `print-color-adjust: exact` y sin selección. Antes se muestra la guía (destino, A4 horizontal, márgenes «Ninguno», desactivar encabezados y pies). No hay descarga de PDF nativa. Ctrl+P sobre el editor no imprime la interfaz.
  - Exportar e imprimir esperan a la última paginación y comprueban de nuevo que la canción no cambió (firma del JSON); si cambió, repiten hasta 3 veces y, si no se estabiliza, no exportan.
  - Referencias musicales pendientes (`checkStructure`): diálogo visible con la lista antes de exportar o imprimir; se conservan tal cual y no se afirma que el recorrido esté validado.
  - Seleccionar solo aplica clases a los nodos existentes (sin repaginar). El zoom solo escala. Mínimo de zoom 10 % y «Ajustar al ancho» sin suelo del 30 %; `scrollbar-gutter: stable` y umbral de 1 px en el `ResizeObserver` para evitar bucles.
- Pruebas escritas (por ejecutar): reparto (filas, hojas, compases poblados, orden, cobertura exacta, errores de ancho/alto/cabecera, margen de seguridad, medidas sin repetir y 300 casos aleatorios con invariantes); átomos, fragmentos y marcas de borde por fragmento; documento exportado (escape de título, `</style>`, rechazo de etiquetas activas, nombre de archivo); bloqueos, zoom de ajuste a 304 px, milímetros de la hoja y muestra de fuentes.
- Validación pendiente (no hecha por quien implementa): `npm test`; en navegador, que las medidas del DOM coinciden con la hoja final (sin desbordes), una, dos y tres o más hojas, un compás con muchas tarjetas, título largo, textos largos del mástil, casillas y repeticiones al cruzar fila/hoja, `1/1`…`3/3`; que el HTML exportado se abre sin conexión con fuentes y colores; que la impresión A4 apaisada no genera hoja final vacía ni muestra selección (el redondeo de 210 mm en Chromium es la parte más delicada); que la guía de encabezados/pies es suficiente; la misma comprobación en 360 px; `scrollbar-gutter` en el navegador objetivo.
- Limitaciones conocidas: la medición ocurre en el hilo principal (la vista previa se actualiza tras una breve espera tras cada edición; mientras tanto marca `aria-busy`); el texto de la leyenda de grados y el aviso de una tarjeta no dibujable se miden como el resto; un compás cuyo símbolo de marcas, por sí solo, sea más ancho que el área útil se informa como error de ancho; no se ha comprobado el comportamiento de Firefox ni Safari; no hay descarga de PDF nativa ni deshacer.
- Siguiente tarea: validación de la fase 4 por el supervisor; después, fase 5.
