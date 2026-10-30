# Estado de trabajo

## Compás de repetición en líneas compactas y repeticiones como en una partitura (0.10.1) — 30/10/2026

Rama `fix/repeticion-ancho-compacto`. Petición del usuario con su canción «Havana · Acordes completos 2» (JSON aportado para la revisión en la raíz, sin versionar): al sustituir por el signo de repetición el último compás (97), este salta de línea y no debería.

- **Diagnóstico** (Edge sin cabeza, servidor local): la última línea, 92–97, solo cabe compacta (1062 px de 1083,7 px útiles). El compás de repetición medía 146 px en cualquier línea (`min-width: 140px` del signo más la barra), frente a 132 px de un compás de una tarjeta de tres trastes (124 px compacto), y no se estrechaba en las líneas compactas. Con el 97 como signo la línea pasaba a 1084 px y el 97 se iba solo a una sexta hoja.
- **Corrección**: el compás de repetición ocupa lo mismo que un compás de una tarjeta con el mástil más estrecho. `render/sheet.js` pone `--mastil-min` (`MIN_FRETBOARD_WIDTH`, nuevo en `geometry/fretboard.js`, por la escala de mástiles) en `.t-pos-repite`; `sheet.css` le suma relleno y borde de la tarjeta (12 px, 4 px en `.fila-compacta`) y quita el relleno lateral propio del signo, que va centrado.
- **Efecto secundario**: el signo es más estrecho que antes (132 px y 124 px compacto, frente a 146 px), así que algunas líneas con signos admiten un compás más. En «Havana» la segunda línea pasa de 29–34 a 29–35, 68–71 sube a la hoja 3 y la hoja 5 queda en dos líneas; la canción sigue en 5 hojas.
- **Archivos**: `styles/sheet.css`, `src/render/sheet.js`, `src/geometry/fretboard.js`, `tests/geometry.test.js` (prueba de `MIN_FRETBOARD_WIDTH`); DISEÑO, DTS y CHANGELOG.
- **Revisión en navegador**: anchos medidos con el medidor real; compás de una tarjeta de tres trastes frente a compás de repetición, normal y compacto, a escala 100, 90, 80, 70 y 60 %: iguales en todos los casos (132/124 px a 100 %; 86,4/78,4 px a 60 %). Con el 97 como signo, la línea 92–97 sigue entera y compacta (1062 px). Captura de las hojas 1 y 5 revisada.
- **Pruebas**: `node --test tests/geometry.test.js`, 16 superadas; `npm test`, 319 superadas.

### Sin «cont. ×N» en los compases intermedios de una repetición

Segunda petición de la misma revisión: en la repetición ×5 de 88–91 aparecía «cont. ×5» sobre 89 y 90, pero no sobre 88 ni 91. El usuario indica que en una partitura solo aparece el ×5 del final y el lector vuelve a la barra de inicio anterior.

- **Causa**: desde la fase de marcas (`327e59d`), `marksParts` escribía «cont. ×N» en todo compás de la repetición que no fuera el primero (que lleva la barra de inicio) ni el último (que lleva ×N). No dependía de cruzar fila u hoja.
- **Corrección**: `src/render/marks.js` deja de dibujar ese texto y `styles/sheet.css` pierde la regla `.m-cont`. Las casillas conservan su «cont.» al continuar en otra fila. La proyección (`spans` con `continuesBefore`/`continuesAfter`) no cambia; tras la tercera petición ya no se dibuja.
- **Revisión en navegador**: hoja 5 de «Havana» redibujada: 88–91 con barras de inicio y fin y ×5 solo al final; 92–93 con ×3 al final.
- **Documentación**: DTS (repeticiones y saltos), manual de uso (tabla de marcas) y CHANGELOG.

### ×N encima de la barra de fin y sin línea de tramo

Tercera petición: quitar también la línea tenue sobre los compases de una repetición y bajar el ×N, que salía en el bloque de marcas de lo alto de la fila, pegado a la línea de arriba y engañoso; debe ir sobre la barra final con los dos puntos.

- **Línea**: era la sombra interior de `.compas.en-rep`. Se quitan la clase (`render/marks.js`), su regla en `sheet.css` y las dos reglas de selección que solo existían para taparla (`app.css`, `workspace.css`).
- **×N**: `marksParts` lo devuelve aparte (`times`) y `fragmentNode` lo añade al compás; `.rep-veces` lo coloca en las pistas de título y franja de la última columna, al pie y alineado con el borde exterior de la barra de fin, dentro del relleno de 24 px de `rep-fin`, sin ensanchar la columna. Si la fila no tiene títulos ni franjas, esas pistas crecen lo justo. Con dos cifras entra unos píxeles sobre la franja de la última tarjeta y se pinta por encima (`z-index`) para que se lea.
- **Revisión en navegador**: «Havana» hoja 5 (88–91 ×5 y 92–93 ×3, con título de sección y sin franjas) y `examples/cancion-demo.json` (con franjas, casillas, To Coda y D.S. al Coda) con ×3 y con ×12, ampliados: el ×N queda justo encima de la barra fina y gruesa; vista previa con los botones ↵ y ↔, que no lo tapan. El reparto de «Havana» no cambia.
- **Pruebas**: `npm test`, 319 superadas.

### Cierre de la 0.10.1

- **Versión** 0.10.1 en `package.json`, pie de `index.html`, cabeceras de manuales y DTS, plantilla LaTeX y manifiesto de construcción (edición 30/10/2026).
- **Capturas retomadas** (Edge sin cabeza en Windows, 1440 × 960 px, escala 1,5, servidor local, JSON abierto por el selector de archivo de la aplicación): `textos-deshacer`, `menu-contextual`, `seleccion-compases`, `seleccion-tarjetas` y `aviso-corregir` (1440 × 560 px), que mostraban el ×3 en lo alto de la fila o «cont. ×3»; `fila-compacta` pasa a la línea compacta 92–97 de «Havana» con la repetición 92–93 ×3, porque el JSON de «Oh Christmas Tree» ya no está. `marcas-compas` es el diálogo de marcas y no cambia.
- **Documentación**: además de lo indicado arriba, README (continuaciones), VALIDACIÓN (V45–V46), tabla de comprobaciones del DTS, índice de manuales y pie de la captura de línea compacta. Los tres documentos regenerados con `python scripts/build_docs.py --engine xelatex`; revisadas las páginas 7–11, 14, 18 y 21 del manual de uso, 10 y 13 del DTS y la portada del de instalación.
- **Batería final**: `npm test`, 319 superadas; `node scripts/build-pages.mjs` correcto; `git diff --check` sin avisos.

Pendiente: Firefox y Safari.

Integrado en `main` con el merge `5cc2c4e` (commit `d459c86`), con autorización expresa del usuario, y publicado por GitHub Actions (ejecución 41068713567, `build` y `deploy` correctos; 319 pruebas superadas en el ejecutor). El árbol de `main` tras la fusión es idéntico al validado en la rama. La web de Pages muestra «Versión 0.10.1», sirve `styles/sheet.css` con la regla `rep-veces` y el manual de uso en PDF; abierta en Edge sin cabeza con `examples/cancion-demo.json`, el ×3 queda justo encima de la barra de fin (mismo borde derecho, 2 px por encima) y la hoja no tiene «cont. ×» ni clase `en-rep`. El JSON «Havana» del usuario se borró de la carpeta a petición suya; nunca se versionó.

## Filas compactas y salto de línea después (0.10.0) — 28/10/2026

Rama `feature/tarjetas-compactas-salto-despues`. Peticiones del usuario sobre su canción «Oh Christmas Tree» (JSON aportado para la revisión; se borró a petición suya y no está en el repositorio):

1. Los compases 21–24 (hoja 3) deben caber en una línea; en general, cuatro compases de dos tarjetas deben caber, estrechando las tarjetas hasta el ancho del mástil con sus números como mínimo.
2. **Salto de línea después**, como el de antes, con un símbolo que se vea fácilmente.

- **Diagnóstico**: la línea 21–24 necesitaba unos 1120 px (ocho tarjetas de 127 px más barras de repetición) para 1084 px de área útil. El relleno lateral de 5 px por lado de cada tarjeta es lo que sobra: sin él, unos 1056 px.
- **Decisiones**: compactar es automático y por línea, solo cuando un compás no cabe a lo ancho y la línea entera sí cabe compacta; respeta el máximo por línea y no se guarda en el JSON. Relleno lateral de 1 px (3 px para nombre, grado y leyenda); el mástil SVG no cambia, de acuerdo con «no alterar el dibujo». Separaciones entre tarjetas y compases sin cambios. Con sitio libre o ajuste al ancho, las tarjetas de la línea compacta crecen y el mástil queda centrado. El salto después es un campo propio (`breakAfter`) y no un salto antes en el compás siguiente, para que siga al compás al moverlo. Su marca ↵ va dentro del compás, abajo a la derecha (arriba en el margen derecho está el botón ↔ de la línea); la de antes no cambia de sitio. Con dos opciones, la etiqueta activa de la de antes pasa a «Quitar salto de línea antes».
- **Fallo previo corregido**: las pistas de las filas no ajustadas eran `minmax(min-content, tope)`, pero el min-content de una columna de tarjeta es 0 (`minmax(0, 1fr)` interno) y, en una fila justa, el navegador repartía a partes iguales: la columna con la barra de inicio de repetición quedaba 2 px más estrecha que su mástil. Ahora el mínimo es el ancho medido.
- **Archivos**: `src/layout/paginate.js` (`measureCompact`, `fitsCompact`, `compactRow`, `place`, salto después), `src/layout/compute.js`, `src/layout/measurer.js`, `src/layout/atoms.js`, `src/render/sheet.js` (`fila-compacta`, `rowColumns`, `breakAfterButton`), `styles/sheet.css`, `styles/app.css`, `src/model/song.js` (`toggleBreakAfter`), `src/model/validate.js`, `schemas/song.schema.json`, `src/model/measureOps.js`, `src/ui/measureActions.js`, `src/ui/measures.js`, `src/ui/preview.js`; prueba nueva `tests/compact-break-after.test.js`. Versión 0.10.0 en `package.json`, pie de `index.html`, cabeceras de manuales y DTS, plantilla LaTeX y manifiesto de construcción.
- **Pruebas**: `npm test`, 318 superadas (15 nuevas). `node scripts/build-pages.mjs` correcto.
- **Revisión en navegador** (Edge sin cabeza en Windows, servidor local en el puerto 5191): con «Oh Christmas Tree» la hoja 3 pasa de «20 · 21,22,23 · 24» a «20 · 21,22,23,24 (compacta) · 25,26,27,28» y la canción sigue en 4 hojas; tarjetas de la línea compacta de 124 px con ajuste al ancho y de 123 px sin él, con mástil de 114 px; ninguna tarjeta más estrecha que su mástil en ninguna fila. Menú contextual con **Salto de línea antes** y **Salto de línea después** (desactivado en el último compás), aviso con Deshacer, etiqueta «Quitar salto de línea después» en el menú del compás, marca ↵ tras el compás 22 y quitarla con ella. HTML exportado (interceptando `showSaveFilePicker`) con el mismo reparto, la clase `fila-compacta` y su regla CSS, saltos después respetados, sin marcas ni scripts.
- **Documentación**: manual de uso (filas compactas, salto de línea antes y después, problemas frecuentes), README, ayuda, DISEÑO, DATOS, DTS (sección nueva y tabla de comprobaciones), REQUISITOS (R40–R41), VALIDACIÓN (V43–V44), CHANGELOG e índice de manuales. Capturas retomadas: `opciones-compas` y `menu-contextual`; nuevas: `salto-linea-despues` y `fila-compacta`. Los tres documentos regenerados con `python scripts/build_docs.py --engine xelatex`; revisadas las páginas 17–19 y 23 del manual de uso, 16–19 del DTS y la portada del de instalación.

Pendiente: Firefox y Safari; impresión real a PDF de una línea compacta (el HTML exportado sí se revisó).

Integrado en `main` con el merge `fcc52ff` (commit `27bb74a`), con autorización expresa del usuario, y publicado por GitHub Actions (ejecución 40681587813, `build` y `deploy` correctos; 318 pruebas superadas en el ejecutor). El árbol de `main` tras la fusión es idéntico al validado en la rama. La web de Pages muestra «Versión 0.10.0» y sirve `styles/sheet.css` con la regla `fila-compacta` y el manual de uso en PDF; abierta en Edge sin cabeza con `examples/cancion-demo.json`, el menú contextual del compás 2 ofrece **Salto de línea antes** y **Salto de línea después**, y al elegir el segundo aparece la marca ↵ junto al compás. El JSON «Oh Christmas Tree» del usuario se borró de la carpeta a petición suya; nunca se versionó.

## Hoja de ejemplo, Ejemplos, Nuevo, salto de línea e intercambio de tarjetas (0.9.0) — 27/10/2026

Rama `feature/ejemplo-inicial`. Tres peticiones del usuario en la misma sesión:

1. **Hoja de ejemplo por defecto** con título «Nombre del tema», tonalidad «Tonalidad» y sin marcas: II–V–I mayor en Do en cuatro compases (Dm7 y G7 | Cmaj7 | Dm7 y G7 | Cmaj7), todo Drop 2 set 1, grados 1/3/5/7 (♭3 y ♭7 en los menores y dominantes) con sus colores y anotación «Drop 2 Set 1 · <inversión>». Se usan las rutas 3 (Dm7 2ª inv., G7 fundamental, Cmaj7 2ª inv., trastes 5–8) y 2 (Dm7 1ª inv., G7 3ª inv., Cmaj7 1ª inv., trastes 1–5) de `examples/ii-v-i/II-V-I_mayores_Drop2_Set1_Do.json`, sin `anchorFret`. Menú **Ejemplos** con las páginas de `examples/` y botón **Nuevo** con solo título, tonalidad y un compás con una tarjeta vacía.
2. **Salto de línea forzado** en un compás seleccionado.
3. **Intercambiar** dos tarjetas seleccionadas, solo con exactamente dos.
4. Añadir al menú Ejemplos `examples/Catalogo_Drop_voicings_Compas_a_compas.json`, aportado por el usuario.

- **Decisiones**: el catálogo `examples/index.json` es necesario porque una web estática no puede listar una carpeta; una prueba lo mantiene igual que la carpeta. El ejemplo abierto conserva el nombre de su archivo (como Abrir). **Nuevo** pone `showTonalities: false` para que la primera tarjeta no repita «Tonalidad» en su franja; el usuario la activa en los datos de la canción. `createEmptySong` no cambia (lo usan las pruebas). El salto de línea es `breakBefore` («empieza línea nueva»), sin efecto en el primer compás ni en el segundo destino de una pareja; las copias no lo heredan, como `fillToEdge`. Intercambiar se oculta (no solo se desactiva) con una cantidad distinta de dos, según la petición. La cabecera necesitaba sitio para los dos botones: Nuevo y Abrir pasan a icono por debajo de 1540 px y entre 761 y 1240 px la barra de archivo baja a una segunda fila; esto corrige además el desbordamiento que ya existía entre 761 y 1000 px (medido con la versión publicada: 953 px de contenido en una ventana de 900).
- **Catálogo de voicings Drop**: el archivo del usuario valida sin cambios (31 compases, 124 voicings). Antes de incluirlo se comprobó con un guion que cada nota de cada tarjeta corresponde a su grado en Do y que las cuerdas usadas coinciden con las del título («cuerdas 4–3–2–1», etc.): 0 discrepancias. No se modificó el archivo; entra en el catálogo como «Catálogo de voicings Drop · Do». En Edge sin cabeza se abre desde Ejemplos con 8 hojas, 124 tarjetas, sin desplazamiento horizontal y sin errores JavaScript. `menu-ejemplos.png` retomada con las ocho entradas.
- **Archivos**: `examples/ii-v-i-mayor-do.json`, `examples/Catalogo_Drop_voicings_Compas_a_compas.json` (del usuario), `examples/index.json`, `src/model/examples.js`, `src/ui/examples.js` (nuevos); `src/main.js`, `src/ui/file.js`, `src/model/song.js` (`createStarterSong`, `toggleBreakBefore`), `src/model/cards.js` (`canSwapCards`, `swapCards`), `src/model/measureOps.js`, `src/model/validate.js`, `schemas/song.schema.json`, `src/layout/atoms.js`, `src/layout/paginate.js`, `src/render/sheet.js` (marca ↵ solo en vista previa), `src/ui/preview.js`, `src/ui/measureActions.js`, `src/ui/measures.js`, `src/ui/cardActions.js`, `src/ui/chord.js`, `src/ui/icons.js`, `index.html`, `styles/app.css`, `styles/workspace.css`; pruebas `tests/examples.test.js` y `tests/line-break-swap.test.js`. Versión 0.9.0 en `package.json`, pie de `index.html`, README y cabeceras de manuales y DTS.
- **Pruebas**: `npm test`, 303 superadas en Windows con Node 24.14.1 (15 nuevas). `node scripts/build-pages.mjs` correcto.
- **Revisión en navegador** (Edge sin cabeza en Windows, servidor local en el puerto 5177): arranque con la hoja de ejemplo sin errores JavaScript (tarjetas, anotaciones y colores de grado revisados en una captura ampliada); menú Ejemplos (abre la demostración; con cambios sin guardar pide decidir y Cancelar conserva la canción), Nuevo con Descartar cambios (un compás, tarjeta vacía seleccionada, sin franjas) y vuelta al ejemplo inicial, en 1440×960 y 390×844; cabecera medida en 390, 600, 760, 761, 900, 1001, 1100, 1201, 1240, 1241, 1280, 1440, 1541 y 1600 px sin desplazamiento horizontal y con el título de la canción entero; en 390 px el menú de ejemplos cabe en la pantalla. Salto de línea en el compás 3 desde el menú contextual (filas «1,2» y «3,4»), etiqueta «Quitar salto de línea» en el menú del compás, Deshacer, Rehacer y quitarlo con la marca ↵; HTML exportado (interceptando `showSaveFilePicker`) con las filas «1,2» y «3,4», sin marca ni scripts. Intercambio de Dm7 (compás 1) y Cmaj7 (compás 4) con Ctrl+clic y menú contextual; con una tarjeta la opción no aparece en el menú contextual ni en el de la tarjeta.
- **Documentación**: manual de uso (secciones «Hoja de ejemplo, Nuevo y Ejemplos» y «Salto de línea forzado», intercambio en «Copiar, pegar y ordenar tarjetas», guardado y problemas frecuentes), manual de instalación (tabla de archivos y cabecera), índice de manuales, ayuda (`ayuda/index.html`), README, DISEÑO, DATOS, DTS, REQUISITOS (R37–R39), VALIDACIÓN (V40–V42) y CHANGELOG. Capturas retomadas: `editor-general`, `opciones-compas`, `menu-contextual` y `textos-deshacer`; nuevas: `menu-ejemplos`, `salto-linea` e `intercambiar-tarjetas`. Los tres documentos regenerados con `python scripts/build_docs.py --engine xelatex`; revisadas las páginas 3–7 y 17–19 del manual de uso y la 17 del DTS.

Pendiente: Firefox y Safari; impresión real a PDF con salto de línea (el HTML exportado sí se revisó); pantalla táctil real; no se ha probado abrir la aplicación con `examples/index.json` ausente o dañado más allá de las pruebas de `readCatalog`.

Integrado en `main` con el merge `e9ab1e6` (commit `2e3bbaa`), con autorización expresa del usuario, y publicado por GitHub Actions (ejecución 40601546505, `build` y `deploy` correctos; 303 pruebas superadas en el ejecutor). El árbol de `main` tras la fusión es idéntico al validado en la rama. La web de Pages muestra «Versión 0.9.0»; abierta en Edge sin cabeza, arranca con la hoja de ejemplo (4 compases, 6 tarjetas), el menú Ejemplos tiene ocho entradas y el catálogo de voicings Drop abre 31 compases y 124 tarjetas, sin errores JavaScript.

## Digitación con letras (0.8.1) — 27/10/2026

Rama `feature/digitacion-letras`. A petición del usuario, el campo **Digitación** admite pegar `xa9axa`: una letra de `a` a `o` vale un traste de 10 a 24, sin distinguir mayúsculas (`x` sigue siendo muda), así que `xa9axa` equivale a `x 10 9 10 x 10`. Las letras valen también entre separadores y en **Importar lista**, que usa el mismo lector. El JSON guarda números como siempre; al volver a la tarjeta el campo muestra `x 10 9 10 x 10`. Más de seis caracteres seguidos siguen siendo ambiguos; el aviso propone ahora separadores o letras.

- **Archivos**: `src/model/frets.js` (`parseFrets`), ayuda del campo en `src/ui/chord.js`, `tests/frets.test.js`; versión 0.8.1 en `package.json`, pie de `index.html` y cabeceras de `docs/manuals/USO.md`, `docs/manuals/README.md` y `docs/DTS.md`.
- **Pruebas**: `npm test`, 288 superadas en Windows con Node 24 (una nueva: letras en minúscula y mayúscula, con separadores, `o` = 24, rechazo de `p`, `z`, `?` y `aa`, aviso de ambigüedad y lista con letras). `node scripts/build-pages.mjs` correcto.
- **Revisión en navegador**: Edge sin cabeza en Windows, servidor local en el puerto 5175, `examples/cancion-demo.json`, 1440 × 960 y 390 × 844: pegar `xa9axa` (con `Input.insertText`) en la digitación de Cm7 dibuja la tarjeta en los trastes 9–11 y, al volver a ella, el campo muestra `x 10 9 10 x 10`; `xp9axa` y `x1012101110` muestran su aviso y conservan la digitación anterior; la ayuda cabe en una línea en ambos anchos; sin desplazamiento horizontal en 390 px y sin errores JavaScript.
- **Documentación**: manual de uso (Digitación e Importar lista), DATOS, REQUISITOS (R09), VALIDACIÓN (V39), README, CHANGELOG, DTS (evidencia de pruebas) e índice de manuales. Capturas retomadas: `editor-general`, `editor-posiciones` y `textos-deshacer` (ayuda nueva y versión del pie). Los tres documentos regenerados con `python scripts/build_docs.py --engine xelatex`; revisadas las páginas 10 y 16 del manual de uso y 12 del DTS.

Pendiente: no se ha probado con un pegado real desde el portapapeles del sistema (se simula con `Input.insertText`, que genera el mismo evento `input`), ni en Firefox o Safari.

Integrado en `main` con el merge `4010432` (commit `c0b3b54`) y publicado por GitHub Actions (ejecución 40556452595, `build` y `deploy` correctos). Tras la fusión, `npm test` (288) y `node scripts/build-pages.mjs` pasan también en `main`. La web de Pages muestra «Versión 0.8.1» y sirve el `src/model/frets.js` nuevo; no se abrió la web publicada en un navegador.

## Edición estructural de compases (0.8.0) — 27/10/2026

Rama `feature/edicion-estructural-compases`. Encargo del usuario en cuatro bloques: selección y acciones básicas, copiar y pegar, sustitución y ordenación, y seguridad (deshacer, referencias, JSON, pruebas y documentación).

- **Modelo**: nuevo `src/model/measureOps.js` (insertar, borrar, mover bloques no contiguos, intercambiar, copiar, pegar, duplicar, sustituir, renumerar y corregir referencias de repetición). `createIdFactory` admite IDs reservados (`src/model/ids.js`); `measureConsequences` acepta una lista de compases (`src/model/structure.js`); `src/model/cards.js` añade `copyCard`, `pasteCard`, `pasteFingering`, `canMoveCard` y `moveCard`. Campo opcional `renumberMeasures` en `schemas/song.schema.json` y `src/model/validate.js`.
- **Interfaz**: `src/ui/measureActions.js` (acciones comunes y atajos), `src/ui/contextMenu.js`, `src/ui/clipboard.js`; menú del compás y barra de selección en `src/ui/measures.js`; Ctrl+clic, Mayús+clic, modo selección y menú contextual en `src/ui/preview.js`; clase `marcado` en `applySelection` (`src/render/sheet.js`); menú de tarjeta en `src/ui/chord.js` (**Quitar tarjeta** pasa a ese menú para no estrechar el selector); aviso con botón en `src/ui/notify.js`; selección múltiple en `src/store.js`; estilos en `styles/workspace.css`; icono `check`; conexión en `src/main.js`.
- **Decisiones**: las marcas siguen a su compás por ID y no se redirigen; mover, intercambiar y cortar tratan los dos destinos de una repetición de dos compases como una unidad, e insertar o pegar en medio de la pareja se coloca fuera; las copias rehacen sus repeticiones según su nueva posición (como el duplicado de 0.7.0) y no heredan `fillToEdge`; cortar y pegar en la misma canción conserva los IDs libres para que las marcas vuelvan a encontrar el compás; «Corregir referencias» es una acción expresa del aviso. La renumeración está activada por defecto (amplía R02), se anuncia en cada aviso y se desactiva por canción.
- **Selección de tarjetas** (a petición del usuario tras probarlo: con Ctrl+clic se marcaba siempre el compás entero y no se podían copiar dos voicings salteados de un compás de tres): en la hoja, el recuadro de una tarjeta señala la tarjeta y el resto del compás señala el compás; Ctrl+clic, Mayús+clic y el modo selección marcan tarjetas o compases, nunca ambos a la vez. Nuevo `src/ui/cardActions.js` (copiar, cortar, pegar antes/después o al principio/final del compás, sustituir la tarjeta entera, sustituir la digitación, duplicar, mover, marcar y quitar, sobre todas las tarjetas marcadas); menú contextual de tarjeta; el menú de tarjeta del editor usa las mismas acciones. También a petición del usuario, **Sustituir tarjeta por la copiada** junto a **Sustituir digitación por la copiada**. Modelo en `src/model/cards.js` (`songCards`, `copyCards`, `pasteCards`, `removeCards`, `replaceCards`, `replaceFingerings`, `duplicateCards`); `markedCards` y `selectionKind` en `src/store.js`; el portapapeles guarda varias tarjetas y lo último copiado; `mountEditShortcuts` sustituye a `mountMeasureShortcuts`.
- **Pruebas**: `tests/measure-ops.test.js` (28 casos) y `tests/card-selection.test.js` (11 casos). `npm test`: 287 superadas en Windows con Node 24.14.1.
- **Revisión en navegador**: Edge 156 sin cabeza en Windows, servidor local, `examples/cancion-demo.json`, 1440 × 960 y 390 × 844: Ctrl+clic y modo selección; menú contextual y su cierre con Esc; Ctrl+C y Ctrl+V con renumeración; Alt+↓; Supr con confirmación, aviso con Deshacer y Ctrl+Z; duplicar un bloque desde el menú contextual; copiar tarjeta, sustituir digitación (nombre y anotación intactos), pegar y mover tarjeta; cortar el compás 4 con Coda y Fine (avisa antes) y pegarlo (las marcas vuelven sin avisos); mover el origen de una repetición y «Corregir referencias». Selección de tarjetas, con el servidor del lanzador (puerto 5174): clic simple en una tarjeta y Ctrl+C/Ctrl+V tras otra (el compás 2 pasa a tener tres tarjetas); Ctrl+clic en la primera y la tercera (solo esas dos marcadas, barra «2 tarjetas seleccionadas»); Ctrl+C, clic en el compás 4 vacío y Ctrl+V (las dos se pegan en orden y quedan marcadas); Ctrl+clic en el número del compás 2 (se desmarcan las tarjetas y se marca el compás); menú contextual de una tarjeta; Sustituir tarjeta por la copiada (Cm7 pasa a E5 con sus textos); menú contextual de compás con «Pegar tarjeta al final del compás»; Supr sobre dos tarjetas marcadas, con confirmación, y Deshacer desde el aviso. Sin errores JavaScript. En 390 px no hay desplazamiento horizontal.
- **Documentación**: manual de uso (sección «Organizar compases», opciones de tarjeta, atajos, problemas frecuentes), DATOS, DTS, REQUISITOS (R31–R36), DISEÑO, VALIDACIÓN (V30–V36), README, CHANGELOG e índice de manuales. Capturas retomadas: `editor-general`, `editor-posiciones`, `opciones-compas` y `textos-deshacer`; nuevas: `menu-tarjeta` (retomada con las opciones nuevas y una tarjeta copiada), `menu-contextual`, `seleccion-compases`, `seleccion-tarjetas` y `aviso-corregir`. PDF y LaTeX regenerados con `python scripts/build_docs.py --engine xelatex` (Pandoc 3.12.1, MiKTeX XeTeX); fecha de edición 27/10/2026 en `scripts/build_docs.py` y en la plantilla. Revisadas visualmente las páginas 4–9 del manual de uso y 14–15 del DTS. Tras la selección de tarjetas se regeneraron otra vez (manual, instalación y DTS) y se revisaron las páginas 4–7 del manual de uso.
- **Versión**: 0.8.0 en `package.json`, pie de `index.html`, README y manuales.

Integrado en `main` con el merge `f8789cb` (commit `1f08ff5`) y publicado por GitHub Actions (ejecución 40512310197, `build` y `deploy` correctos). Tras la fusión, `npm test` (287) y `node scripts/build-pages.mjs` pasan también en `main`. La web de Pages muestra «Versión 0.8.0» y sirve el código nuevo (`src/ui/cardActions.js`, `replaceCards`); no se abrió la web publicada en un navegador.

Pendiente: Firefox y Safari; pulsación larga en un dispositivo táctil real (en táctil se usa el menú del compás y el modo selección); Cmd en Mac; lector de pantalla; impresión y HTML exportado tras estas operaciones (el renderizador de hojas no cambia salvo la clase de selección de la vista previa, que no se exporta); canciones extensas como I Fall in Love Too Easily; validación del esquema con AJV.

## Lanzador `.cmd` sin falso «modificado» — 26/10/2026

Rama `fix/cmd-crlf`. `Abrir-Compas.cmd` estaba guardado en Git con CRLF, pero `.gitattributes` (`*.cmd text eol=crlf`) pedía LF en el repositorio, así que Git lo marcaba siempre como modificado aunque el archivo fuese idéntico al publicado. `.gitattributes` pasa a `*.cmd -text`: el lanzador se guarda y se entrega tal cual, con CRLF, también al descargarlo suelto desde GitHub. El contenido de `Abrir-Compas.cmd` no cambia (comprobado byte a byte con `main`). Sin cambios de aplicación, versión ni documentación generada.

## Nombres de archivo como el título (0.7.4) — 26/10/2026

Rama `fix/nombres-exportacion`, sobre `feature/titulo-sobre-compas`. A petición del usuario, **Exportar HTML** propone el título de la canción tal como se escribe, como el PDF (`I Fall in Love Too Easily.html`; antes `i-fall-in-love-too-easily.html`). Nueva función `titleFileName` en `src/model/serialize.js`, usada por `htmlFileName` (`src/export/document.js`) y por `suggestFileName`. Por decisión del usuario, **Guardar JSON** sigue usando el nombre del archivo abierto; solo una canción nueva propone el título. Se sustituyen por `_` los caracteres no válidos en Windows y se quitan puntos y espacios finales; sin título, el HTML se llama «Hojas de acordes.html» y el JSON «cancion.json». Pruebas actualizadas en `tests/export-document.test.js` y `tests/validate.test.js`. Documentación: `docs/manuals/USO.md`, `README.md`, `docs/DTS.md` y `CHANGELOG.md`.

Comprobado en Edge sin cabeza abriendo `I_Fall_in_Love_Too_Easily_completo_1-39.json` con el selector de la aplicación y forzando la descarga normal: Exportar HTML descarga `I Fall in Love Too Easily.html` y Guardar JSON descarga `I_Fall_in_Love_Too_Easily_completo_1-39.json`. No se ha probado el selector nativo de guardado de Chrome/Edge con ventana.

## Versión 0.7.4: «Título sobre compás» — 26/10/2026

Rama `feature/titulo-sobre-compas`. A petición del usuario, el campo **Título sobre la tarjeta** pasa a llamarse **Título sobre compás** (`src/ui/chord.js`), con la ayuda «Encima del compás, desde esta tarjeta». El dato sigue siendo `aboveText` de cada tarjeta y el dibujo no cambia. Versión 0.7.4 en `package.json`, pie de `index.html`, `README.md`, `CHANGELOG.md` y cabeceras de `docs/manuals/USO.md` y `docs/manuals/README.md`. Textos del manual de uso y README actualizados. Capturas `editor-general.png`, `editor-posiciones.png` y `textos-deshacer.png` retomadas con Edge sin cabeza (1440 × 960, escala 1,5); los tres documentos se regeneran porque llevan la versión en el pie. Los registros históricos (este archivo y `docs/diseno/textos-y-tonalidades.md`) conservan el nombre anterior.

La 0.7.3 quedó publicada antes de este cambio: merge `87c8bed`, GitHub Actions ejecución 40328927722 correcta y la web muestra «Versión 0.7.3».

## Versión 0.7.3 — 26/10/2026

Rama `chore/version-0-7-3`. Sube la versión a 0.7.3 para los dos cambios visibles publicados tras la 0.7.2: título sobre la tarjeta al ancho del compás y nombre del PDF al imprimir. Archivos: `package.json`, pie de `index.html`, `README.md`, `CHANGELOG.md`, cabeceras de `docs/manuals/USO.md`, `docs/manuals/README.md` y `docs/DTS.md`, fecha de edición del pie en `docs/latex/document-template.tex` y en el manifiesto de `scripts/build_docs.py`. Los tres documentos (PDF, `.tex` y `.build.json`) se regeneran porque llevan la versión en el pie. Sin cambios en el JSON.

## Título sobre la tarjeta al ancho del compás — 26/10/2026

Rama `fix/titulo-ancho-tarjeta-compas`. El título exterior se limitaba al ancho de la columna de su tarjeta: en *I Fall in Love Too Easily*, compás 29, «B Final · combinación libre» ocupaba dos líneas aunque el compás tiene dos tarjetas. Ahora el título se dibuja en la pista de títulos del compás (`titleNodes` en `src/render/sheet.js`), desde la columna de su tarjeta hasta la siguiente tarjeta con título o el final del fragmento (`titleSpans` en `src/layout/atoms.js`); sigue alineado a la izquierda con su tarjeta y no ensancha columnas. `src/render/card.js` deja de dibujar el título dentro de la columna; `styles/sheet.css` coloca `.compas > .t-titulo`; `styles/app.css` hace que en la vista previa solo el recuadro reciba el clic (selecciona su tarjeta) por encima de las columnas que cruza. Prueba nueva en `tests/atoms.test.js`. Sin cambios en el JSON; publicado primero como 0.7.2 y recogido después en la 0.7.3.

Documentación: `docs/DISENO.md`, `docs/DTS.md`, `docs/manuals/USO.md` y `README.md`; manual de uso y DTS regenerados (PDF, `.tex` y `.build.json`) con `python scripts/build_docs.py --engine xelatex` y revisadas sus páginas afectadas (uso p. 7, DTS p. 10). El manual de instalación no cambia y se conserva su derivado anterior.

Comprobado en Edge sin cabeza con el JSON del usuario y variantes en la carpeta temporal: compás 29 en una línea sobre las dos tarjetas (la fila baja de altura); dos títulos en un compás (el primero termina donde empieza el segundo); título más largo que el compás (ajusta línea al ancho del compás, sin invadir el siguiente); compás partido en dos filas (cada fragmento con sus títulos); barras de repetición del ejemplo demo; clic en la parte del título que cruza la segunda tarjeta selecciona la primera y el hueco libre selecciona la segunda; documento con solo los estilos de exportación. No se ha revisado la impresión/PDF real ni móvil.

Integrado en `main` con el merge `5c84d6a` (commit `1bd6123`) y publicado por GitHub Actions (ejecución 40327477020, `build` y `deploy` correctos). La web de Pages sirve el código nuevo (`titleSpans` y `.compas > .t-titulo`); no se abrió la web publicada en un navegador.

## Nombre del PDF al imprimir — 21/10/2026

Rama `fix/nombre-pdf-impresion`. Al usar **Imprimir / PDF** y elegir «Guardar como PDF», Chromium proponía `Compás a compás.pdf`, porque toma el nombre del título de la página principal y no del marco que se imprime. Ahora `src/ui/exporter.js` pone en la pestaña el título de la canción justo antes de `print()` y devuelve el de la aplicación en `afterprint` (o al limpiar el marco). El título sale de `exportTitle` en `src/export/document.js`, el mismo que lleva el HTML exportado («Hojas de acordes» si la canción no tiene título). Prueba nueva en `tests/export-document.test.js`. Documentación: `docs/manuals/USO.md`, `README.md` y `docs/DTS.md`; manual de uso y DTS regenerados (PDF, `.tex` y `.build.json`) con `python scripts/build_docs.py --engine xelatex` y revisadas visualmente sus páginas afectadas. El manual de instalación no cambia.

Comprobaciones: `npm test` (247 pruebas) y `node scripts/build-pages.mjs` correctos. No se ha comprobado con un clic real el diálogo de impresión de Chrome/Edge ni de otros navegadores; Firefox y Safari pueden usar otra regla para el nombre propuesto.

## Traste de referencia y rutas II–V–I — 18/10/2026

En la rama local `feature/anchor-fret-iivi` se añadió `anchorFret` opcional por posición: resalta una columna del mástil y la incluye en el rango visible. El editor, el render, la validación y `schemas/song.schema.json` ya lo admiten; `docs/DATOS.md`, `docs/DTS.md` y el manual de uso lo describen. `npm test` pasa con 246 pruebas. La revisión visual en navegador y la actualización de versión/publicación siguen pendientes. La rama no está fusionada ni publicada.

Los cinco JSON derivados de la lámina Drop 2 están en `examples/ii-v-i/`: cuatro archivos con cuatro rutas completas (ii–V–I) por set y modalidad, más uno con variantes C6. Cada ruta conserva su traste de referencia en los tres acordes. La marca gráfica de nota guía fantasma de C6 del HTML original no tiene campo equivalente en la aplicación y no se ha simulado.

## Estado del encargo: repetición de compás y ajustes de tarjetas — 18/10/2026

La versión 0.7.1 está integrada en `main`. Incluye repetición de uno y dos compases, nombres nuevos vacíos, crecimiento limitado, colores configurables, máximo de compases por línea, ocultación de números y separadores, ancho manual por compás, ajuste de línea con alineación compartida entre filas, controles tonales y botón Manual con página de ayuda. El esquema JSON no cambia en 0.7.1. `npm test` pasa con 242 pruebas y `node scripts/build-pages.mjs` termina correctamente.

La versión 0.7.1 incorpora a la vista de hojas la alineación vertical de las tarjetas de filas ajustadas con la misma estructura. La regla se deriva del diseño y no añade campos al JSON. Si la cuadrícula común no cabe sin comprimir tarjetas, se conservan los anchos individuales. Documentación y manuales regenerados. `npm test`: 242 pruebas; empaquetado y publicación de Pages correctos.

GitHub Actions publicó la versión desde el commit `f39d88c` (ejecución 39135701530, correcta). En la web publicada, el botón Manual abre una pestaña nueva con `ayuda/index.html`; la página de ayuda aparece correctamente y enlaza al PDF, que responde 200 con `application/pdf`. Las capturas parciales de Edge sin cabeza cubren las opciones principales de compás. Siguen sin constar como revisados en esta entrega la impresión/PDF de la aplicación, el HTML exportado, las escalas 100–175 %, móvil, I Fall, Havana y una validación completa con AJV.

## Versión 0.7.0: repetición del compás anterior y ajustes de tarjetas — 18/10/2026

Implementado el encargo [repeticion-compas-y-ajustes-tarjetas](encargos/repeticion-compas-y-ajustes-tarjetas.md) en 0.7.0 y fusionado en `main` mediante el PR #11.

Archivos: `src/model/{song,cards,structure,validate,ids,palette,degrees}.js`, `src/layout/{atoms,paginate,compute,spec}.js`, `src/render/{card,sheet,repeat}.js`, `src/ui/{chord,measures,colors,icons}.js`, `styles/{sheet,workspace}.css`, `schemas/song.schema.json`, `tests/{repeat-previous,palette,validate,cards}.test.js`, documentación.

Decisiones: campo `repeatPrevious.sourceMeasureId`; duplicar una repetición apunta al original; expansión máxima del 25 % **por columna/tarjeta** (`MAX_ROW_EXPANSION`; tope individual, sobrante a la derecha); texto de grado blanco por defecto salvo los grados dorados, que conservan el `#3d2f00` de la plantilla sobre `#EDBC07` (con fondo propio pasan a blanco); el neutro gris de serie lleva tinta oscura por legibilidad (blanco si el usuario fija el fondo).

Ampliación (misma versión 0.7.0): repetición de dos compases (`repeatPreviousTwo`, signo `render/repeat.js`, pareja indivisible en `layout/paginate.js`), `maxMeasuresPerRow`, `showMeasureNumbers`, y ocultar Tonalidad/Calidad de tonalidad por tarjeta cuando `showTonalities` es `false`. Archivos añadidos: `tests/repeat-two.test.js`; modificados además `src/ui/song.js`, `src/ui/chord.js`, `src/layout/{atoms,paginate,compute}.js`, `src/render/{sheet,card,repeat}.js`, esquema, `docs/{DATOS,DTS}.md`, `docs/manuals/USO.md` y `docs/latex/Manual_Uso_Compas_a_compas.tex`. Los tres PDF de los manuales se regeneraron junto con sus fuentes LaTeX y metadatos de construcción.

Segunda ampliación: líneas verticales ocultas con `showMeasureNumbers: false`, `measure.widthPercent` (10–100 %), `measure.fillToEdge` y botón `↔` por línea en la vista previa, créditos en el pie (izquierda) con la versión a la derecha y estado del archivo junto a Deshacer/Rehacer. Archivos: `src/layout/{atoms,paginate}.js`, `src/render/sheet.js`, `src/ui/{preview,measures}.js`, `src/model/{song,validate}.js`, esquema, estilos, `index.html`, `tests/repeat-two.test.js`, documentación.

Colores predeterminados centralizados en `config/palette-defaults.json` (incluida la tinta atenuada `muted` de `render/card.js`) (`src/model/paletteDefaults.js`, `tests/palette-defaults.test.js`, `tests/setup.mjs`; `npm test` precarga el fichero). Comprobado en navegador: la aplicación arranca con el fichero y muestra «no se encuentra el archivo (HTTP 404)» si falta.

Botón Manual en la barra superior: abre `ayuda/index.html` (página estática con enlace al PDF; `index.html`, `ayuda/`, `scripts/build-pages.mjs`, `scripts/serve.mjs` con MIME de PDF, `tests/manual-link.test.js`). Capturas de `docs/manuals/capturas/` retomadas de la aplicación 0.7.0 con Edge sin cabeza; nuevas: `datos-cancion`, `opciones-compas` y `colores-grados`. Los tres PDF (`docs/latex/*.pdf`, `.tex` y `.build.json`) se regeneraron con `python scripts/build_docs.py --engine xelatex` usando Pandoc 3.12.1 (descargado en una carpeta temporal, no instalado) y XeLaTeX de MiKTeX; la plantilla incorpora `\pandocbounded` para Pandoc 3.2+.

Comprobaciones reportadas en el commit 3b561f6: `npm test` (239 pruebas) y `node scripts/build-pages.mjs` pasan. Las capturas de Edge sin cabeza muestran compases sin numeración, 2 y 4 compases por línea, anchos 45/30/10 %, ajuste de línea, repeticiones de uno y dos compases y la aplicación a 1440×900. La página de ayuda y el PDF se comprobaron bajo una subruta local de Pages; falta el clic con ventana y el despliegue real de GitHub Pages. Esta evidencia no sustituye la revisión completa de impresión/PDF de la aplicación, HTML exportado, escalas 100–175 %, móvil ni los JSON de I Fall y Havana; esos casos y la validación global con AJV no constan como ejecutados para esta entrega.

## Versión 0.6.3: reparto estable con escala fraccionaria — 18/10/2026

El usuario aporta aplicación.html exportado con 0.6.2. Confirmado el reparto 1–3, 4–6, 7–9 y 10–12, en lugar de 1–4, 5–8 y 9–12 de la plantilla. Las 37 tarjetas, sus textos, IDs y SVG coinciden con la exportación de control; las reglas CSS son las mismas. La comprobación anterior al 100 % no cubría este caso.

Reproducción real con Chromium 153 y --force-device-scale-factor=1.25: el borde de tarjeta de 1.6 px se resuelve a 1.6 px frente a 1 px al 100 %. Cada compás de dos tarjetas mide 268 px frente a 266 px. Cuatro compases con las separaciones suman 1090 px y superan el ancho útil, por lo que el compás 4 pasa a la segunda fila y el 5 queda segundo.

Se reduce únicamente el relleno lateral de tarjeta de 6 a 5 px. El mismo fragmento mide 264 px al 125 % y cabe con holgura. No se modifica la geometría del mástil, la fuente de los textos, los datos musicales, el esquema JSON ni la regla adaptativa de reparto.

Validación mediante Abrir, Guardar JSON y Exportar HTML de la aplicación con los dos JSON completos: Chromium 153 al 100 %, 125 %, 150 % y 175 % en escritorio, y al 200 % en móvil 390×844; Chromium 130 al 125 % en escritorio. I Fall mantiene dos hojas, tres filas en la primera (1–4, 5–8 y 9–12) y dos en la segunda. Havana mantiene seis hojas. Datos guardados idénticos, 37 y 108 tarjetas en orden, SVG con las mismas dimensiones, sin recursos externos en HTML, sin recortes ni desniveles entre números y tarjetas. HTML autónomo y PDF A4 horizontal generados en esas comprobaciones. Primera hoja del PDF de I Fall revisada visualmente en PNG.

La prueba adicional de 24 compases y 86 tarjetas con textos largos, cuatro trastes, repeticiones, casilla y continuaciones vuelve a pasar sin pérdidas ni desbordamientos. Las 196 pruebas Node, el empaquetado de Pages y git diff --check pasan. No se ha probado el móvil físico del usuario ni Firefox, Safari o el diálogo nativo de impresión. Archivos: styles/sheet.css, package.json, index.html, README.md, CHANGELOG.md, docs/DISENO.md y este registro. Los archivos personales no se incorporan al repositorio.

## Versión 0.6.2: recuperar la tercera fila de I Fall — 18/10/2026

Revisión directa del repositorio, sin usar el conector local. Reproducido en Chromium 153 con el JSON aportado: la primera hoja contenía los compases 1–8 y el documento ocupaba tres páginas. Las tres primeras filas necesitaban 734,06 px frente a los 703,20 px disponibles bajo la cabecera. La alineación de 0.6.1 era correcta, pero el espacio vertical impedía colocar la tercera fila.

Se compactan los números de compás de 14 a 12 px, su separación inferior de 4 a 2 px, el espacio entre filas de 12 a 8 px y el de cabecera de 14 a 10 px. Se retira el margen inferior de 4 px de cada columna porque ya existe separación entre filas. Se conservan los márgenes de página de 5 mm, las fuentes de tarjeta, los textos y la geometría del mástil. No se impone un número fijo de filas: los contenidos altos siguen pasando a otra página.

Validación realizada sobre los dos JSON completos mediante los controles reales de la aplicación: I Fall tiene dos hojas, con tres filas (1–12) y dos filas (13–19), y conserva sus 37 tarjetas. Havana mantiene seis hojas y sus 108 tarjetas. Guardar JSON produce los mismos datos, IDs y orden que el archivo abierto. La exportación HTML coincide con la vista previa en tarjetas, dimensiones SVG, filas y numeración; no solicita recursos externos. Desnivel de 0 px entre números y tarjetas de cada fila y ningún elemento fuera de la página. PDF generado por Chromium: dos y seis páginas A4 horizontales, sin hoja vacía final; primera página de I Fall revisada visualmente en PNG.

Caso adicional: 24 compases, 40 tarjetas en el primero, 86 tarjetas en total, títulos y anotaciones de varias líneas, repeticiones, casilla, cuerdas al aire y cuatro trastes. Se conservan todas las tarjetas en nueve hojas, con seis continuaciones, sin errores de reparto, recortes ni solapamientos de filas. Primera hoja revisada visualmente. Las 196 pruebas Node pasan; el empaquetado de GitHub Pages y git diff --check pasan. No se han probado Firefox, Safari ni el diálogo nativo de impresión de Windows en esta revisión.

Archivos modificados: src/layout/spec.js, styles/sheet.css, package.json, index.html, README.md, CHANGELOG.md, docs/DISENO.md y este registro. Los JSON personales y los archivos de comprobación quedan fuera del repositorio.

## Versión 0.6.1: encuadre y alineación entre compases — 17/10/2026

El usuario aporta una captura y los JSON de I Fall in Love Too Easily y Havana. Reproducción en Chromium 153: un título como «Intro · Joe Pass», «Jim Hall» o «B · Tema» desplazaba solo su compás. El desnivel máximo era 31,56 px tanto en vista previa como en exportación.

Claude Sonnet, esfuerzo medium, corrige estilos, renderizador, medidor DOM y reparto. La rejilla se comparte a lo largo de toda la fila: marcas, títulos, tonalidades y zona del compás. Cada tarjeta conserva su ancho natural y participa en el reparto del espacio libre. El medidor informa de las pistas; la paginación suma sus máximos por fila para no infravalorar alturas complementarias de distintos compases. Sin cambios de esquema, digitaciones ni geometría del mástil.

Validación: 196 pruebas Node superadas en Windows mediante el conector, con seis pruebas nuevas de alturas combinadas, salto de página, compás vacío, continuaciones y compatibilidad del medidor. Chromium 153 en Linux con los dos JSON completos: guardado idéntico al original, mismas tarjetas e IDs en orden, desnivel de 0 px en bandas y bordes de tarjetas en todas las filas de vista previa y HTML. Se mantienen 3 páginas para los 19 compases de I Fall y 6 para los 78 de Havana. HTML autónomo sin peticiones externas y PDF A4 horizontal de todas las hojas revisado.

Casos adicionales: títulos y tonalidades de varias líneas, anotaciones altas en otro compás, franjas visibles y ocultas, compás vacío, repeticiones y casillas; sin solapamientos ni desbordamiento vertical. Caso extenso anterior de 40 tarjetas en un compás y 24 compases en total, continuaciones y trastes variables: correcto, con PDF de 6 hojas. No se incorporan los JSON personales al repositorio. Firefox, Safari e impresión nativa en Windows siguen pendientes; las comprobaciones visuales son en Linux.

## Versión 0.6.0: tarjetas independientes y bandas rectangulares — 17/10/2026

Claude Sonnet, esfuerzo medium, implementa el selector plano y la edición independiente en el worktree del PC. El supervisor incorpora el ajuste visual de la plantilla, revisa la integración y comprueba la interfaz. El formato sigue siendo esquema 1: no se migra al abrir o guardar. Cambiar nombre o calidad separa solo la tarjeta afectada; añadir, duplicar y quitar operan inmediatamente junto a la tarjeta activa.

La hoja elimina barras inferiores, separadores y contornos de grupos. Mantiene las barras de compás y las repeticiones. Las bandas tonales son rectangulares, con fondo tenue y línea inferior de 3 px; conservan herencia, calidad y paleta, con contraste mínimo de texto de 4,5:1.

Validación: 190 pruebas Node superadas en Windows mediante el conector. Chromium 153 en Linux: guardado de un JSON antiguo sin cambios; selector único; edición del nombre con foco y escritura continua; separación individual con IDs, orden y marcas conservados; deshacer/rehacer; textos, duplicar, añadir y quitar; tarjeta pendiente que solo se completa con digitación válida. Editor sin scroll interno con el ejemplo en 1440×900, 1366×768 y 1280×720; móvil 390×844 sin desbordamiento horizontal. Franjas y títulos alineados con textos de distinta altura. HTML autónomo sin peticiones externas, mismas etiquetas y colores; 40 tarjetas en un compás y 24 compases en total, con continuaciones y trastes variables. Impresión de 1 y 6 hojas A4 horizontal en Chromium sin interfaz. Sin errores JavaScript.

Manuales y DTS actualizados con capturas del editor de tarjetas. Firefox, Safari, impresión nativa y doble clic reales en Windows continúan pendientes. Las comprobaciones de navegador usan la copia de revisión en Linux; las pruebas Node se ejecutan en el worktree del PC. La carpeta principal de Windows se actualiza con git pull después de integrar en main.

## Versión 0.5.0: títulos, grado y tonalidad por posición — 17/10/2026

Implementación realizada con Claude Sonnet, esfuerzo medium, en el worktree aislado del PC; el supervisor revisa y valida una copia independiente antes de integrar. Se conservan los cambios aprobados de 0.4.1. La especificación de [textos y tonalidades por voicing](diseno/textos-y-tonalidades.md) pasa de pendiente a implementada.

La tonalidad general aparece a continuación del título. Los rótulos de tarjeta tienen recuadro y están por encima de la línea del compás; grado del voicing arriba a la derecha, sin cambiar los seis grados de cuerda. Cada posición admite tonalidad y calidad independientes de la del acorde. El contexto inicial usa la tonalidad general y su calidad, o Otro si falta. Vacío hereda el contexto y el color anteriores sin repetir etiqueta, cruzando compases y páginas en orden escrito. La casilla global oculta las franjas y conserva la tonalidad del título. No se infieren funciones ni se expanden repeticiones.

El esquema 1 incorpora los campos opcionales keyFamily, showTonalities, voicingDegree y tonality, con validación estricta. Los documentos anteriores se abren y guardan sin añadir esos campos. Los lectores anteriores rechazan los archivos con datos nuevos en vez de descartarlos. El historial, la recuperación, la duplicación y el orden conservan los valores. Títulos y franjas también seleccionan su posición al pulsarlos en la vista previa.

El renderizador usa tres filas compartidas mediante subgrid por fragmento: título, tonalidad y zona del compás. Revisión y corrección de un fallo inicial de anclaje inferior: una tarjeta con anotación/leyenda larga ya no sitúa el título de otra debajo del inicio de la línea. La medición, la vista previa y la exportación comparten esta composición. La geometría del mástil no cambia.

Validación: 171 pruebas Node superadas en Windows por el conector y 1751 casos de paridad manual/AJV en Linux. Chromium 153 en Linux: edición individual aunque el alcance de otros textos esté en todas; calidad preparada con campo vacío sin cambiar datos, herencia, borrar cambio, deshacer/rehacer, JSON, reapertura y recuperación. Títulos largos, anotaciones/leyendas de altura distinta, casillas y barras de repetición conservan alineación; cuatro trastes no se reducen. Prueba extensa con 40 posiciones en un compás y 24 compases en total, sin recortes ni errores JavaScript. HTML autónomo sin peticiones externas; etiquetas y color compartidos con vista previa, paleta oscura con contraste, franjas heredadas iguales y casilla global en exportación. Impresión en Chromium sin interfaz produce 1 y 6 hojas A4 horizontal, revisadas sin página vacía final. Regresión del historial y las marcas Coda/Fine superada.

Editor sin scroll interno con el ejemplo en 1440×900 (651/651), 1366×768 (573/573) y 1280×720 (525/525), valores de alto útil/alto de contenido. En 800×600 (406/499) usa desplazamiento interno; móvil 390×844 conserva todos los campos y no desborda horizontalmente. La captura de la vista previa en el PC confirma 0.5.0, los nuevos controles y cero errores JavaScript. El servidor de vista previa iniciado para esa captura se detiene después.

Manuales y DTS actualizados, con capturas nuevas, fuentes y PDF regenerados. Continúan pendientes Firefox, Safari y el diálogo de impresión nativo de Windows. Se necesita soporte CSS subgrid para la nueva composición.

## Registro original del encargo de textos y tonalidades — 17/10/2026

Petición documentada en [textos y tonalidades por voicing](diseno/textos-y-tonalidades.md), con revisión del archivo aportado `EJEMPLO.html` en Chromium. Incluye tonalidad junto al título de canción, rótulos enmarcados fuera de la línea del compás, grado propio del voicing y franjas de tonalidad con calidad, color heredado y visibilidad global. En ese momento se señalaron decisiones abiertas y quedó pendiente. La entrega 0.5.0 descrita arriba resuelve e implementa este encargo; 0.4.1 no contenía estas funciones.

## Versión 0.4.1: digitación, grados y textos sin pestañas — 17/10/2026

Claude trabaja en un worktree nuevo del PC desde main 0.4.0; se conserva el espacio antiguo con sus cambios. Se retiran la navegación de pestañas del editor de acordes y sus atributos ARIA asociados. Digitación/grados y los dos textos se muestran siempre en secciones apiladas con títulos discretos. Se mantienen el selector de alcance por posición y Deshacer/Rehacer. Las pestañas de Colores conservan sus reglas compartidas.

Validación final: 150 pruebas Node superadas en Windows mediante el conector. Chromium en Linux comprueba secciones siempre visibles, edición de textos, guardar/abrir, Deshacer/Rehacer, marcas, recuperación, colores, seis ventanas de escritorio y móvil, con 40 posiciones y 30 compases. El editor habitual cabe sin scroll en 1440×900, 1366×768 y 1280×720; en 800×600 necesita desplazamiento interno y conserva todos los campos. Sin desbordamiento horizontal ni scroll de página en escritorio. La captura del PC confirma 0.4.1 sin errores JavaScript. El HTML del ejemplo sin editar sigue idéntico al control anterior.

El desarrollo se ha realizado con Sonnet, esfuerzo medium. El supervisor revisa el diff, copia los archivos para comprobación independiente y mide el ajuste con Chromium. La versión se publica desde GitHub; no es necesario integrar cada paso intermedio en main para que Claude continúe en su rama.

## Versión 0.4.0: textos claros e historial de acciones — 17/10/2026

La pestaña de textos muestra solo Título sobre la tarjeta y Anotación dentro de la tarjeta, con el valor efectivo visible de cada posición. Se retiran los bloques de texto común y sobrescritura y el controlador ui/textOverride.js. El selector permite aplicar cada campo a esta posición o a todas las posiciones del acorde; la opción de todas retira las excepciones de ese campo, conservando el otro. Cambiar de posición vuelve a la edición individual. Los JSON anteriores conservan sus datos y se mantiene el esquema 1.

createStore registra los cambios de canción y restaura contenido y selección con Deshacer y Rehacer. Agrupa la escritura por campo, limita el historial a 100 pasos y un presupuesto de tamaño, conserva los pasos al guardar y los reinicia al abrir, crear o recuperar otra canción. Selección y zoom no crean pasos. No se serializa el historial. Hay botones en la cabecera y los diálogos de datos, marcas y colores. Los atajos operan fuera de campos y se respeta el deshacer nativo dentro de ellos. No actúan sobre confirmaciones ni importaciones pendientes.

Validación: 150 pruebas Node superadas. Chromium en Linux: texto propio visible frente a común, edición individual y conjunta, agrupación de escritura, deshacer/rehacer desde cabecera y diálogos, Coda/Fine añadida/editada/borrada/restaurada, IDs, selección, pendientes frente al último guardado, apertura, datos de canción, digitación válida e inválida, grados, paleta, teclado y recuperación tras recargar con historial vacío. La regresión adicional comprueba seis ventanas de escritorio, móvil, 40 posiciones y 30 compases. El HTML del ejemplo sin editar permanece idéntico al control anterior. No hay desplazamiento horizontal ni de página en escritorio. Sin errores JavaScript. No se declara revisión de Firefox, Safari ni impresión nativa de Windows.

Archivos: src/store.js, src/ui/history.js, src/ui/chord.js, src/model/song.js, suscripciones de datos/marcas/colores, iconos, cabecera, estilos, versión y pruebas de historial. Manuales y DTS actualizados con capturas y PDF. La geometría, el contrato JSON y el renderizador de hoja permanecen sin cambios.

## GitHub Pages publicado — 17/10/2026

GitHub confirma Pages activado. El propietario ha cambiado la visibilidad del repositorio a público. Reintentada la ejecución 39053339056: build y deploy completados correctamente, con URL confirmada por el trabajo de despliegue https://a01653.github.io/Compas-a-compas/. Aplicación 0.3.0, código sin cambios respecto a la revisión preparada. README.md y docs/WEB.md actualizados con el enlace definitivo y la configuración vigente. El arranque local mediante Abrir-Compas.cmd se conserva. No se ha realizado una nueva prueba de interacción en navegador sobre el sitio publicado.

## Preparación de GitHub Pages — 17/10/2026

El usuario solicita que el alojamiento sea GitHub Pages. Se añade .github/workflows/pages.yml con pruebas, empaquetado de archivos de ejecución y despliegue desde main; scripts/build-pages.mjs prepara _site/ con rutas relativas y sin documentación ni scripts locales. README.md y docs/WEB.md sustituyen el enlace principal de Sites por el procedimiento de GitHub Pages. El repositorio sigue privado. Pages todavía no está activado: requiere seleccionar GitHub Actions en Settings → Pages y disponer de un plan compatible. No se declara publicación correcta ni URL activa hasta comprobar el despliegue. El conector no ofrece la operación de administración para activarlo. Validación local: 138 pruebas Node superadas, paquete con 58 archivos, 128 referencias relativas sin destinos ausentes y sintaxis YAML comprobada. El contenido de ejecución coincide con el origen; el paquete excluye docs/ y scripts/.

## Acceso web público — 17/10/2026

Acceso de Sites cambiado a público por petición expresa del usuario. La política devuelta y una lectura posterior confirman `public`, revisión 2. Se conserva la misma URL, versión 0.3.0 y repositorio privado. README.md y docs/WEB.md actualizados para indicar que no hace falta iniciar sesión. Sin cambios de código ni nueva publicación de la aplicación.

## Acceso web privado — 17/10/2026

Aplicación 0.3.0 publicada en Sites: https://compas-a-compas.a01653.chatgpt.site. Despliegue confirmado como correcto por Sites. Los 57 archivos de ejecución coinciden con main en ed65dceb86d149572bd5444ff111574279650be8; 133 referencias de recursos comprobadas y 138 pruebas Node superadas. Sin cambios de código de aplicación ni de acceso al repositorio. No se realizó una nueva sesión de navegador sobre la URL publicada porque el navegador compatible con Sites no estaba disponible. GitHub y la publicación web se actualizan por separado. Enlace y procedimiento en README.md y docs/WEB.md.

## Versión 0.3.0: colores por familia y grado — 17/10/2026

Panel **Colores** añadido a la cabecera, con fondos para las seis familias, grados naturales, bemoles y sostenidos del 1 al 13, etiquetas personalizadas de hasta 32 caracteres y notas sin grado o sin color propio. Hay restauración individual y completa con confirmación. Los cambios se aplican a toda la canción y permanecen en su JSON, vista previa, HTML e impresión.

Campo opcional `palette` añadido al esquema 1 y al validador manual. Los JSON anteriores siguen abriendo y guardándose sin añadir datos por defecto; los archivos con paleta necesitan 0.3.0 o posterior. Solo se aceptan colores `#RRGGBB`, familias conocidas y etiquetas válidas; se rechazan campos desconocidos y claves reservadas. Los datos musicales permanecen separados de los colores. La paleta se pasa al renderizador compartido y adapta textos y trazos interiores a fondos oscuros sin cambiar los títulos exteriores ni las digitaciones.

Archivos: `src/model/palette.js`, `src/ui/colors.js`, pruebas de paleta, `src/model/{degrees,validate}.js`, `src/render/{card,sheet}.js`, `src/ui/{workspace,icons}.js`, `src/main.js`, `index.html`, `styles/workspace.css`, esquema, versión y documentación. Sin cambios en las referencias originales.

Validación: 138 pruebas Node superadas y 1685 casos de paridad manual/AJV con paleta. Chromium 153 en Linux: color por familia y grado, etiqueta bb7, JSON, reapertura y recuperación tras recargar, fondo oscuro con nombre y rejilla legibles, títulos exteriores intactos, colores en HTML y estilos de impresión, cancelar/restaurar, entrada hexadecimal inválida y panel en móvil. La regresión del editor pasa en seis tamaños de escritorio y 390×844, con 40 posiciones y 30 compases. El HTML del ejemplo sin paleta permanece idéntico al control anterior. No se declara prueba del diálogo de impresión nativo de Windows.

Manuales, DTS y capturas actualizados a 0.3.0. PDF regenerados y revisados; manifiestos SHA-256 y enlaces locales comprobados. Rama de implementación `feature/colores-acordes-grados`; entrega 0.3.0 validada para `main`.

## Versión 0.2.0: interfaz aprobada y marcas por compás — 17/10/2026

El usuario aprobó la propuesta y autorizó integrarla en `main`. Se conserva la rama `design/editor-sin-scroll` como origen del cambio. Sin creación de release, tag ni despliegue.

Acceso **Marcas** trasladado al bloque Compás. El panel lleva el compás activo en el título, muestra símbolos y saltos escritos allí y todos los tramos que lo incluyen. **Ver todas las marcas** mantiene la revisión global, con avisos pendientes siempre visibles. El selector del panel cambia también el compás del editor. Cambiar de compás prepara un borrador nuevo; no modifica marcas guardadas. Editar un tramo desde un compás intermedio conserva sus extremos. Cambiar solo de acorde o posición mantiene el borrador.

Archivos: `src/model/marksContext.js` y cuatro pruebas nuevas, `src/ui/{marks,measures,workspace}.js`, `src/main.js`, `index.html`, `styles/workspace.css`, `package.json`, README, CHANGELOG, manuales, DTS, generador y plantilla de PDF, capturas y esta ficha. Versión de aplicación 0.2.0; esquema JSON sigue en 1. El generador documental toma la versión de `package.json`.

Validación en Linux: 130 pruebas Node superadas. Chromium 153: seis tamaños de escritorio entre 800×600 y 1440×900 y móvil 390×844; JSON, notas, grados, textos, altas, duplicado, cancelación/borrado, 40 posiciones y 30 compases; sin errores JS. HTML exportado del ejemplo idéntico byte a byte al de `main` 0.1.3. Prueba específica del contexto: filtro local/global, extremos e interior, edición sin mover destinos, alta de salto al Coda y repetición desde el compás elegido, borrador conservado al cambiar de voicing y etiqueta visible actualizada. Los avisos y referencias pendientes se conservan.

Manual de uso, instalación y DTS regenerados con Pandoc/XeLaTeX para 0.2.0; capturas reales actualizadas. Validación documental: enlaces locales y manifiestos SHA-256, sin desbordamientos ni caracteres ausentes en LaTeX; PDF renderizados y revisados. Siguen pendientes Windows nativo y otros navegadores. La integración final se verifica leyendo la rama por defecto en GitHub.

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
