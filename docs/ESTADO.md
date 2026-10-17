# Estado de trabajo

## Propuesta de interfaz compacta — 17/10/2026

Rama `design/editor-sin-scroll`, desde `main` `e33d87c`. Propuesta solicitada por el usuario, pendiente de su revisión visual. Sin fusión en `main`, sin release ni despliegue. Aplicación 0.1.3; sin cambios de modelo, esquema, geometría de hoja ni exportador.

Implementación: dos columnas, navegación de compases por selector, edición de acorde y posición siempre a mano, pestañas de digitación/grados y textos, datos de canción y estructura en diálogos, operaciones secundarias en menús e iconos etiquetados. Archivos y evidencia en [la ficha de diseño](diseno/editor-compacto/README.md), con capturas a 1440×900 y 1280×720.

Comprobado en Chromium 153 sobre Linux: seis tamaños de escritorio, entrada de notas y grados sin perder foco, JSON, selección, textos personalizados, altas, duplicado y borrado de posición con cancelar/confirmar, diálogos y menús; 40 posiciones y 30 compases sin crecimiento vertical del editor; móvil a 390×844 sin desbordamiento horizontal. Editor habitual y posición vacía sin scroll a 1280×720 y 800×600. HTML exportado del ejemplo idéntico byte a byte a `main`; 126 pruebas Node pasan. Pendientes la aprobación visual y las comprobaciones nativas de Windows y otros navegadores. Los PDF no se regeneran para una propuesta aún no aceptada.

## Documentación de usuario y DTS — 17/10/2026

Preparada directamente por el supervisor, sin invocar Claude. Aplicación 0.1.3 sin cambios funcionales. Archivos: `docs/manuals/USO.md`, `INSTALACION.md` y `README.md`; `docs/DTS.md`; dos capturas en `docs/manuals/capturas`; `docs/latex/document-template.tex`; tres PDF con sus fuentes `.tex` y manifiestos `.build.json`; `scripts/build_docs.py`; enlaces y aclaración del intervalo de 32 trastes en README; registro en CHANGELOG.

El estilo sigue los manuales de Drop Route: portada azul con motivo de mástil, índice y tipografía editorial. Las capturas muestran la aplicación real 0.1.3 en Chromium 153 sobre Linux a 1440×960, con el ejemplo del repositorio. No se presentan como capturas de Windows.

Validación de esta entrega: construcción completa con Pandoc 3.1.3 y XeLaTeX, tres pasadas por documento; sin cajas desbordadas, glifos ausentes ni referencias sin resolver. PDF A4 vertical: uso 7 páginas, instalación 5 y DTS 10 (incluyen portada e índice). Todas las páginas renderizadas a PNG y revisadas; corregido el fondo de portada antes de la entrega. Enlaces locales, ejemplo JSON del DTS y SHA-256 de los manifiestos comprobados. No se repite la batería funcional por esta entrega documental; las 126 pruebas registradas debajo corresponden a la validación de producto anterior. Las comprobaciones nativas pendientes de Windows, Firefox y Safari permanecen pendientes.

---

Fecha: 16/10/2026. Especificación: 1.0. Versión de la aplicación: 0.1.3 (validado por el supervisor).

Parche 0.1.3 (proporciones de la plantilla; **validado por el supervisor**; Claude no ejecutó nada): `src/geometry/fretboard.js` (`GEOM.zone` 26, `GEOM.gap` 17; `cell` 28, `padTop` 10 y `padBottom` 18 sin cambio), `src/layout/spec.js` y fallback CSS (`GAPS.row` 12), `styles/sheet.css` (`.compas` padding-left 4; `.eventos` y `.evento` gap 4; `.evento` y `.tarjeta` `flex: 1 0 auto`; `.tarjeta` padding `3px 6px 4px`; `.mastil` `flex: none`; `.t-txt` 9px/1.1, `letter-spacing` .3px, `min-height` 15px), `src/render/card.js` (números de cuerda 1–6 en x 2, y = cuerda + 3.5, tamaño 11; líneas 1,3/1,5; puntos de radio 8; números de traste 10), `index.html`, `package.json`, README, CHANGELOG y `docs/DISENO.md`. Margen 5, columna 6 y cabecera 14 sin cambio. Objetivo medido por el supervisor en la plantilla: primera fila 128 × 161 px y rejilla de 3 trastes 84 × 85 px; con los textos de familia originales el prototipo del supervisor dio 128 × 161 px y 2 hojas (12 + 7 compases). Esas cifras son del prototipo, no de una comprobación mía. Las 3 hojas de la exportación anterior se debieron a los textos «Escala» y «Tiempos» que el supervisor añadió al primer JSON, no a textos del usuario; el JSON se corrige por separado y la aplicación no lo cambia. Validación del supervisor en Linux: 126 pruebas Node pasan; Chromium 153 importó JSON de 19 compases y 36 posiciones en 2 hojas (1–12 y 13–19); primeras 8 tarjetas 128×161 px, rejilla 3 trastes 84×85 px; JSON guardado idéntico, medidas app/exportación idénticas, sin recortes ni peticiones externas; páginas exportadas revisadas visualmente; JSON anterior con textos largos se conserva íntegro y crece de 3 a 4 y 8 trastes; 30 posiciones con continuaciones y repeticiones pasan. Windows real pendiente.

Lanzador de doble clic (sin cambio de versión): implementado, validado en Linux (Node y stubs); **doble clic real en Windows pendiente**; Claude no ejecutó nada. Archivos: `Abrir-Compas.cmd` (raíz, `cd /d "%~dp0"`, `where node.exe`, `node.exe scripts\launch.mjs`, `pause` solo en error), `scripts/launch.mjs` (helpers exportados `probeServer`, `waitForServer`, `openBrowser`, `main`; reutiliza el servidor si `GET /package.json` devuelve `name` `compas-a-compas`; puerto ocupado por otra cosa: mensaje y salida sin matar procesos; si no hay servidor, lanza `scripts/serve.mjs` con stdio heredado, espera HTTP hasta 10 s, abre el navegador con `rundll32.exe url.dll,FileProtocolHandler`), `.gitattributes` (`*.cmd` con CRLF) y README. Revisión posterior (sin ejecutar; pendiente de pruebas externas): `openBrowser` devuelve `Promise<boolean>` (resuelve en `spawn`/`error`, `unref` tras éxito); `main` espera la apertura y, si falla o lanza, indica la URL a mano; con servidor propio listo mantiene la consola aunque el navegador falle; si reutiliza un servidor y el navegador falla devuelve 1 (el `.cmd` hace `pause`); si el hijo ya terminó cuando el sondeo ve `compas` se trata como reutilización (salida 0); `try/finally` retira manejadores de señal y mata al hijo vivo; el punto de entrada captura errores; el `.cmd` usa `setlocal`, `title` y comprueba Node 18+ con `node.exe -e` antes de lanzar. Pendiente: doble clic real en Windows, Node ausente, puerto ocupado por otra aplicación.

Parche 0.1.2 (proporciones de hoja compartidas por vista previa, medición y exportación): implementado y validado supervisor. Cambios en `src/layout/spec.js` (margen 5 mm; separaciones columna 6, fila 18, cabecera 14 px), `src/geometry/fretboard.js` (traste 28 px, zona 22 px; `maxFrets` 32), `styles/sheet.css` (tipografías y alturas mínimas), `src/ui/exporter.js` (texto de márgenes), `index.html`, `package.json`, README, CHANGELOG, `docs/DISENO.md` y pruebas `tests/geometry.test.js` y `tests/layout-misc.test.js` (valores ajustados, sin pruebas nuevas). Sin cambios de modelo, esquema, controles ni scroll. Validación real del supervisor sobre la copia 0.1.2 (informe del supervisor; Claude no ejecutó comprobaciones): 126 pruebas Node pasan; Chromium 153 en Linux importó el JSON corregido de 19 compases y 36 posiciones en 2 hojas (1–12 y 13–19), con JSON guardado idéntico, dimensiones de vista previa y exportación idénticas, sin recortes ni peticiones externas; el JSON anterior con textos largos se conserva y crece de 3 a 4 y 8 trastes; 30 posiciones con continuaciones y repeticiones y el scroll a 8 resoluciones (360–1440) pasan. Llenado final de filas parciales (validado supervisor): `src/render/sheet.js` añade `flex-grow` proporcional a compases (`to - from`) y acordes (nº de tarjetas); `styles/sheet.css` pasa filas, eventos y tarjetas a `stretch`/`flex` con mástil centrado y pegado abajo (`margin-top: auto`), sin cambiar la geometría (28 px/traste). El medidor usa filas `max-content` sin crecer: las alturas medidas son conservadoras. Se retiró una aserción de holgura de `maxFrets` en `geometry.test.js` porque con el margen de 5 mm ya no es ajustada.

Parche 0.1.1 (UX del editor de acordes y scroll independiente en ancho ≥761 px): implementado en `src/ui/chord.js`, `src/ui/measures.js`, `src/ui/scrollRegions.js`, `src/render/sheet.js`, `index.html` y `styles/app.css`; sin cambios de modelo, esquema, paginación ni exportación.

Validación del parche 0.1.1 (realizada por el supervisor, según su informe; Claude no ejecutó comprobaciones):

- Node: 126 pruebas pasan.
- Chromium 153 en Linux, a 1440×900, 1280×720, 1181×600, 1180×600, 1024×768, 800×600, 761×600 y 360×800. La rueda sobre el editor mueve solo el editor: la posición superior del visor no cambia y `window.scrollY` es 0. Escribir grados conserva el foco, funciona PageDown con teclado y el último botón es accesible en móvil.
- Grupos de 2 acordes y de 2+1 posiciones claros. Añadir posición suma solo al acorde seleccionado; añadir acorde crea un grupo. Contadores, foco, selección desde la hoja y JSON intactos.
- HTML exportado de control idéntico byte a byte al original 0.1.0: las guías del editor no afectan al papel.
- Aviso de 99 trastes: ocultaba el visor a 800×600. Corregido en `styles/app.css` (`warn-vista` con `max-height: min(22vh, 130px)` y scroll propio); validado a 1440, 800 y 761×600, con exportación bloqueada y diálogo cerrable.
- Captura en Windows: no se declara todavía; falta la captura final.

Accesibilidad: el `aria-label` de `.posiciones` se actualiza al cambiar el nombre del acorde, sin reconstruir inputs (`src/ui/chord.js`). Implementado; el supervisor dará la última prueba.

## Estado actual

| Fase | Estado |
| --- | --- |
| 0. Propuesta de interfaz | Validada por el supervisor |
| 1. Edición y persistencia | Validada por el supervisor |
| 2. Mástil, tarjetas y grados | Validada por el supervisor |
| 3. Estructura musical | Validada por el supervisor |
| 4. Paginación y exportación | Validada por el supervisor |
| 5. Cierre y guía de uso | Validada por el supervisor |

La aplicación edita canciones por compases, guarda y abre JSON, pagina en hojas A4 apaisadas, exporta HTML autónomo e imprime desde el navegador. Se sirve con `npm start` (127.0.0.1:5174 por defecto, `--port` para otro).


**Limitaciones conocidas:** Firefox y Safari no probados; el diálogo de impresión nativo del sistema no está automatizado; sin deshacer, OCR, reproducción, teoría o generación de acordes ni alojamiento.

## Evidencia del supervisor (fases 0 a 4)

Aportada por el supervisor; quien implementó no tenía terminal ni navegador y no la ha repetido.

- Node 24: `npm test` con 126 pruebas superadas.
- Validador manual contra AJV 2020: 1575 casos de paridad.
- Chromium 153 en Linux: sin errores JS. Capturas a 1440 y 390 px generadas por conector; también ancho 360, 430, 1280 px en pruebas de navegador.
- Navegador: CRUD, JSON corrupto, versión, IDs, destinos, listas, recuperación, textos por voicing, grados, geometría, etiquetas, foco y móvil.
- Paginación: 24 compases × 2 tarjetas = 6 páginas; 48 × 2 = 12; un compás con 45 voicings = 5 páginas, con todas las tarjetas conservadas.
- HTML exportado (72 tarjetas, 6 páginas): abierto por `file://` sin conexión, fuentes incluidas, sin HTTP, sin JS, sin selección; `<script>` y `</title>` en textos escapados.
- PDF en Chromium headless de 1, 2, 3 y 6 hojas: el conteo coincide con la vista, sin hoja final vacía, A4 apaisado 841,92 × 594,96 pt; seis páginas revisadas en PNG.
- Continuaciones multipliego: Segno, Coda y barras de primer/último fragmento sin duplicados. Títulos largos ajustados.
- Exportación bloqueada con 99 trastes y datos intactos; destino pendiente con confirmar/cancelar; exportar tras editar usa el último título.
- Imprimir abre el marco y llama a `print` (comprobado con un stub); el diálogo nativo no se automatizó.
- Diferencia de 4 px entre títulos de la app y de la exportación, corregida con un reinicio de `box-sizing` en el CSS compartido; la comparación de 72 tarjetas se repitió y las medidas son idénticas.
- Las pruebas de navegador independientes se ejecutaron sobre una copia exacta de la revisión. No se ejecutó `run_check` (checks del conector vacíos).

## Registro por fase

### Fase 0: propuesta de interfaz

Cabecera con icono, datos de canción, lista de compases, edición de acorde y digitación con vista previa, hoja A4 con zoom, fuentes locales y adaptación a 390 px. Archivos principales: `index.html`, `assets/icon.svg`, `styles/`, `src/main.js`, `src/store.js`, `src/model/frets.js`, `src/geometry/fretboard.js`, `src/render/`, `src/ui/`. `frets.js` ya no admite punto ni guion como separadores. Validada con capturas a 1440 y 390 px sin errores JS.

### Fase 1: edición y persistencia

Alta, inserción, duplicado, movimiento y borrado de compases con IDs estables; varios acordes y voicings; textos heredados, personalizados u ocultos; validación de forma y `schemaVersion` 1; Nuevo, Abrir y Guardar JSON; cambios pendientes y recuperación en `localStorage`; importación por lista todo o nada. Archivos nuevos: `src/model/{ids,song,structure,validate,serialize,listImport}.js`, `src/persist/recovery.js`, `src/ui/{dialog,notify,textOverride,file,importList}.js`, `tests/`. Los campos desconocidos bloquean la apertura. Validada: 45 pruebas Node, 1575 casos de paridad con AJV y Chromium 153.

### Fase 2: mástil, tarjetas y grados

Seis grados manuales opcionales con los colores de la plantilla, también en cuerdas al aire; geometría con mínimo de tres trastes y crecimiento; por encima de 32 trastes (`GEOM.maxFrets`) la tarjeta avisa y los datos se conservan. Leyenda de grados abreviados bajo el mástil. Archivos: `src/model/degrees.js`, `src/geometry/fretboard.js`, `src/render/card.js`, `tests/{geometry,degrees,frets}.test.js`. Validada: 76 pruebas Node y navegador (leyenda, cuerda al aire, herencia sin perder foco, 16 trastes, aviso con 99).

### Fase 3: estructura musical

Alta, edición y borrado de repeticiones, casillas, Segno, Coda, Fine y siete saltos; destinos por etiqueta, referencias pendientes conservadas con aviso, consecuencias al borrar, IDs de marcas borradas no reutilizados. Dibujo en la hoja (SVG de Segno y Coda, barras, ×N, corchetes). Archivos: `src/model/{marks,marksProjection}.js`, `src/render/marks.js`, `src/ui/marks.js`, `tests/marks*.test.js`. Validada: 97 pruebas Node y Chromium 153.

### Fase 4: paginación y exportación

Un renderizador único para medir, mostrar y exportar; reparto puro en filas y hojas A4 (297 × 210 mm, márgenes de 10 mm); fragmentos con continuación; bloqueo de exportación con más de 32 trastes o piezas que no caben; Exportar HTML autónomo; Imprimir / PDF desde un marco oculto con guía de ajustes; aviso de referencias pendientes. Archivos: `src/layout/`, `src/export/document.js`, `src/ui/{paginator,exporter,preview}.js`, `src/render/sheet.js`, `styles/{tokens,export,sheet,app}.css`, `tests/`. Validada con la evidencia de arriba (126 pruebas, exportación y PDF reales).

### Fase 5: cierre y guía de uso

Fecha 16/10/2026. Versión 0.1.0 en `package.json` e `index.html` (se retira «Prototipo · fase 4»); `CHANGELOG.md`; `scripts/serve.mjs` (Node sin dependencias, 127.0.0.1:5174, `--port`, rutas confinadas a la raíz, MIME de HTML/JS/CSS/JSON/SVG, errores 400/403/404/405, HEAD) y `npm start`; campo opcional «Versión del documento» en `src/ui/song.js`, que solo escribe al teclear; README como guía de uso. Validada: servidor arranca, puertos rechazados, URL malformada retorna 400 sin cerrar, GET posterior 200; navegador muestra 0.1.0, f-version edita/guarda, JSON carga sin documentVersion, voicing y selección de tarjeta correctos, cero errores JS; `npm test` 126 pruebas.

Lanzador de doble clic (sin cambio de versión): implementado. Archivos: `Abrir-Compas.cmd` (raíz, `cd /d "%~dp0"`, `where node.exe`, `node.exe scripts\launch.mjs`, `pause` solo en error), `scripts/launch.mjs` (helpers exportados `probeServer`, `waitForServer`, `openBrowser`, `main`; reutiliza el servidor si `GET /package.json` devuelve `name` `compas-a-compas`; puerto ocupado por otra cosa: mensaje y salida sin matar procesos; si no hay servidor, lanza `scripts/serve.mjs` con stdio heredado, espera HTTP hasta 10 s, abre el navegador con `rundll32.exe url.dll,FileProtocolHandler`), `.gitattributes` (`*.cmd` con CRLF) y README. Validación del supervisor: Node `--check` correcto en copia exacta en Linux; sondeo HTTP (app correcta, otra app, puerto libre, JSON inválido, timeout, abort); spawn navegador Windows con EventEmitter (stub éxito/error asíncrono); arranque real del servidor y segundo llamador sin crear segundo servidor; Ctrl+C retira manejadores de señal y servidor propio queda en 5174 libre. Pendiente: doble clic real en Windows, Node ausente o antiguo, CRLF en Windows, cierre de ventana sin procesos huérfanos.
