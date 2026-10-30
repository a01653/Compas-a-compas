# Cambios

## 0.10.1 — 30/10/2026

- Corregido: el compás de repetición medía 146 px en cualquier línea, más que un compás de una tarjeta (132 px; 124 px en una línea compacta), y no se estrechaba en las líneas compactas. Sustituir por el signo el último compás de una línea justa podía mandarlo solo a la línea o la hoja siguiente. Ahora ocupa lo mismo que un compás de una tarjeta con el mástil más estrecho, también con los mástiles reducidos y en las líneas compactas; como es algo más estrecho que antes, algunas líneas con signos de repetición admiten un compás más.
- Las repeticiones se dibujan como en una partitura: el ×N va justo encima de la barra de fin con los dos puntos (antes salía en lo alto de la línea, pegado a la de arriba), y los compases intermedios ya no llevan «cont. ×N» ni la línea tenue superior.
- Manual de uso con las capturas de repeticiones retomadas; README, DTS y validación (V45–V46) actualizados.

## 0.10.0 — 28/10/2026

- **Filas compactas**: si un compás no cabe a lo ancho en la línea, se prueba la línea entera con las tarjetas estrechadas hasta el ancho de su mástil con los números de cuerda y de traste; si así cabe, la línea se compacta en lugar de pasar el compás a la siguiente o partirlo. Cuatro compases de dos tarjetas de tres trastes caben ahora en una línea aunque lleven barras de repetición. El mástil no cambia y el máximo de compases por línea se respeta. Se ve igual en la vista previa, el HTML y la impresión.
- **Salto de línea después** (menú del compás y clic derecho): el compás termina su línea y el siguiente empieza otra aunque quepa. Una marca ↵ abajo a la derecha del compás lo indica en la vista previa y lo quita al pulsarla. Nuevo campo opcional `breakAfter`; sin cambio de `schemaVersion`. La opción de antes pasa a decir **Quitar salto de línea antes** cuando está activa.
- Corregido: en una línea sin ajustar al ancho que iba justa, una columna más ancha que las demás (por ejemplo la que lleva la barra de inicio de repetición) podía quedar más estrecha que su tarjeta, con el mástil asomando por el borde. Cada columna parte ahora de su ancho medido.
- Manual de uso (filas compactas, salto de línea antes y después) con capturas nuevas; DTS, DATOS, requisitos (R40–R41) y validación (V43–V44) actualizados.

## 0.9.0 — 27/10/2026

- **Hoja de ejemplo al arrancar**: un II–V–I mayor en Do en cuatro compases (Dm7 y G7 | Cmaj7 | Dm7 y G7 | Cmaj7) con voicings Drop 2 del set 1, grados 1, 3, 5 y 7 en sus colores y la inversión en la anotación («Drop 2 Set 1 · 2ª inversión»). Título «Nombre del tema», tonalidad «Tonalidad» y sin marcas (`examples/ii-v-i-mayor-do.json`).
- **Menú Ejemplos** en la cabecera con las páginas de la carpeta `examples/`, enumeradas en `examples/index.json`. Pide confirmación si hay cambios sin guardar. Incluye el nuevo **Catálogo de voicings Drop · Do** (Drop 2, Drop 3, Drop 2+4 y Cdim7; `examples/Catalogo_Drop_voicings_Compas_a_compas.json`).
- **Nuevo** pasa del menú de tres puntos a la cabecera y crea una hoja con solo «Nombre del tema», «Tonalidad» y un compás con una tarjeta vacía, con las franjas de tonalidad ocultas.
- **Salto de línea antes** (menú del compás y clic derecho): el compás empieza una línea nueva aunque quepa en la anterior. Una marca ↵ en el margen de la vista previa lo indica y lo quita. Se respeta en el HTML y en la impresión. Nuevo campo opcional `breakBefore`; sin cambio de `schemaVersion`.
- **Intercambiar las dos tarjetas**: con exactamente dos tarjetas seleccionadas, el menú de la tarjeta y el clic derecho las cambian de sitio con todos sus datos, también entre compases distintos.
- Cabecera más compacta en pantallas medianas: Nuevo y Abrir pasan a icono y, entre 761 y 1240 px, la barra de archivo baja a una segunda fila (antes se salía de la ventana entre 761 y 1000 px).
- Manual de uso con las secciones «Hoja de ejemplo, Nuevo y Ejemplos» y «Salto de línea forzado» y capturas nuevas; DTS, DATOS, requisitos (R37–R39) y validación (V40–V42) actualizados.

## 0.8.1 — 27/10/2026

- **Digitación con letras** para los trastes de dos cifras: `a` = 10, `b` = 11… hasta `o` = 24, sin distinguir mayúsculas (`x` sigue siendo muda). Se puede escribir o pegar `xa9axa`, que equivale a `x 10 9 10 x 10`; también en **Importar lista** (`G7 @ xa9axa`). El JSON guarda los números de siempre.
- Capturas del editor retomadas con la ayuda nueva del campo de digitación.

## 0.8.0 — 27/10/2026

- **Edición estructural de compases.** El menú de tres puntos del bloque Compás y un nuevo menú contextual (clic derecho sobre un compás de la hoja, o Mayús+F10) ofrecen: insertar compás antes o después, copiar, cortar, pegar antes o después, sustituir por lo copiado, duplicar, subir, bajar, intercambiar y borrar. Cada acción es un paso de Deshacer.
- **Selección de varios compases o varias tarjetas**: Ctrl+clic, Mayús+clic o **Modo selección** (casillas en la hoja), con una barra que indica la selección. En la hoja, pulsar dentro del recuadro de una tarjeta señala la tarjeta y pulsar en el resto del compás señala el compás entero; una selección es de tarjetas o de compases, nunca de ambos. Así se pueden marcar tarjetas salteadas (la primera y la tercera de un compás). Las acciones se aplican en orden escrito; mover bloques no contiguos de compases conserva su orden.
- **Identificadores y referencias**: las copias reciben IDs nuevos sin repetidos; las marcas siguen a su compás y no se redirigen; las repeticiones copiadas se rehacen según su nueva posición; la pareja de una repetición de dos compases se mueve entera y no se separa al insertar. Cortar y pegar en la misma canción conserva los IDs, de modo que las marcas vuelven a encontrar su compás. Los avisos de repetición tras mover ofrecen **Corregir referencias**.
- **Renumeración automática** de las etiquetas numéricas tras insertar, pegar, duplicar, mover o borrar, desde el número del primer compás. Se puede desactivar por canción para conservar la numeración original (`renumberMeasures: false`); **Renumerar ahora** la aplica en el momento.
- **Tarjetas**: nuevo menú de tarjeta, también con clic derecho sobre una tarjeta de la hoja: **Copiar**, **Cortar**, **Pegar antes/después**, **Sustituir tarjeta por la copiada** (la tarjeta entera, con nombre, calidad, textos, grado, tonalidad y digitación), **Sustituir digitación por la copiada** (solo trastes, grados por cuerda y traste de referencia), **Mover tarjeta antes/después**, **Añadir tarjeta a la selección** y **Quitar tarjeta** (que sale de la fila de botones). Copiar, cortar, pegar, sustituir, duplicar y quitar actúan sobre todas las tarjetas marcadas. Con tarjetas copiadas, el menú de un compás ofrece pegarlas al final.
- **Atajos** fuera de los campos: Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+Mayús+V, Alt+↑, Alt+↓, Supr y Esc, además de Ctrl+Z y Ctrl+Y. Actúan sobre lo señalado (tarjetas o compases); Ctrl+V pega lo último copiado. Borrar siempre pide confirmación y el aviso posterior incluye **Deshacer**.
- Formato: campo opcional `renumberMeasures`; sin cambio de `schemaVersion`. Manual de uso con la sección «Organizar compases» y capturas nuevas; DTS, DATOS, requisitos y validación actualizados.

## 0.7.4 — 26/10/2026

- El campo **Título sobre la tarjeta** pasa a llamarse **Título sobre compás**, porque el título se dibuja encima del compás y puede ocupar su ancho. Sigue empezando en la tarjeta donde se escribe; el dato (`aboveText`) y su comportamiento no cambian.
- **Exportar HTML** propone como nombre el título de la canción tal como se escribe, igual que el PDF (`I Fall in Love Too Easily.html` en lugar de `i-fall-in-love-too-easily.html`). **Guardar JSON** mantiene el nombre del archivo abierto; una canción nueva también propone su título. Solo se sustituyen por `_` los caracteres no válidos en Windows.
- Capturas del manual con el editor actualizadas (vista general, textos y selector de tarjetas).

## 0.7.3 — 26/10/2026

- El **Título sobre la tarjeta** puede ocupar el ancho del compás y no solo el de su tarjeta: empieza en su tarjeta y se extiende sobre las siguientes del mismo compás hasta la próxima con título propio o el final del compás (o de la fila, si el compás continúa en otra). Solo ajusta línea cuando no cabe en ese espacio y nunca ensancha las tarjetas. En la vista previa, pulsar el recuadro selecciona su tarjeta.
- Al usar **Imprimir / PDF**, el navegador propone como nombre del PDF el título de la canción en lugar de «Compás a compás».
- Sin cambios en el JSON. Manual de uso, DTS y README actualizados.

## 0.7.2 — 18/10/2026

- Cada voicing admite `anchorFret`, un traste de referencia cuya columna se resalta y que amplía el rango visible del mástil.
- Se añaden ejemplos de cuatro recorridos completos ii–V–I Drop 2 por archivo, con el anclaje compartido entre los tres acordes de cada ruta.

## 0.7.1 — 18/10/2026

- Las filas ajustadas con la misma estructura de compases comparten anchos de columna para alinear verticalmente las tarjetas. Si la cuadrícula común no cabe sin comprimir contenido, se mantienen los anchos individuales.
- Sin cambios en el JSON. Manual de uso y DTS actualizados.

## 0.7.0 — 18/10/2026

- Nuevo botón **Repetir compás anterior** junto a Añadir tarjeta: el compás seleccionado muestra el signo de repetición de un compás (barra oblicua con dos puntos), sin duplicar tarjetas. Pide confirmación si sustituye tarjetas, se deshace de una vez y se quita con «Quitar repetición». Deshabilitado en el primer compás. Añadir tarjeta en un compás de repetición sale de ese modo avisando.
- Formato: campo opcional `measures[].repeatPrevious: { sourceMeasureId }` (con `chordEvents` vacío). Si el origen se borra o se mueve, la referencia se conserva y se avisa; «Corregir referencia» la apunta al compás anterior. Duplicar un compás de repetición hace que la copia repita el original. Sin cambio de `schemaVersion`.
- Las tarjetas nuevas se crean sin nombre. Un nombre vacío no dibuja guion ni texto de prueba (`chordName` admite cadena vacía). Los nombres existentes, también «Acorde nuevo», no se tocan.
- Las filas ya no se estiran a todo el ancho: cada tarjeta crece como mucho un 25 % sobre su ancho natural (`MAX_ROW_EXPANSION`), sin que ninguna lo supere, y el sobrante queda a la derecha.
- La paleta de grados conserva sus colores de siempre: fondos como antes y texto blanco por defecto, salvo los grados dorados (b7, 7, 13, b13 y los naturales 6 y 13), que mantienen el fondo `#EDBC07` y el texto `#3d2f00` de la plantilla. Si personalizas el fondo de un grado dorado sin elegir texto, el texto pasa a blanco. Los archivos con colores propios no cambian.
- Colores: cada grado tiene **Fondo** y **Texto** independientes (texto blanco por defecto salvo el dorado de la plantilla, y respetado sin ajuste automático). Campos opcionales `palette.degreeText` y `palette.noteText`. El fondo neutro de las notas sin grado pasa de #14183a a #d1d5db; un `palette.note` explícito se conserva y la tinta general (#14183a) no cambia.
- Repetición de dos compases: botón **Repetir dos compases anteriores** y signo de dos barras oblicuas sobre la pareja de destino (`repeatPreviousTwo` en el primer destino, con IDs de fuentes y destinos). Los dos destinos nunca se separan de línea; si falta el segundo, se pregunta antes de añadirlo. Referencias rotas, no consecutivas, solapadas o cíclicas avisan sin redirigirse.
- Opciones de canción: **Máximo de compases por línea** (Automático o 1–16, `maxMeasuresPerRow`) y **Mostrar números de compás** (`showMeasureNumbers`; ocultar no borra etiquetas).
- Nuevo ajuste de canción **Tamaño de los mástiles** (`fretboardScalePercent`, 60–100 %): escala proporcionalmente los diagramas para mostrar más filas por página, sin cambiar digitaciones. Ausente o 100 % = tamaño normal.
- Ancho por compás (`widthPercent`, 10–100 %, nunca por debajo del contenido) y botón **Ajustar línea al ancho** por línea (`fillToEdge`), reversible con el mismo botón o con Deshacer. Con **Mostrar números de compás** desactivado se ocultan también las líneas verticales entre compases.
- Pie de la aplicación: créditos a la izquierda, versión a la derecha; el estado del archivo pasa junto a Deshacer/Rehacer. Nada de esto entra en el HTML ni el PDF exportados.
- Con **Mostrar tonalidades** desactivado, los campos Tonalidad y Calidad de tonalidad de cada tarjeta se ocultan del editor; los valores se conservan.
- Los colores predeterminados (calidades de acorde, grados y notas, fondos y textos) están en `config/palette-defaults.json`: se cargan y validan al iniciar la aplicación (error claro si falta o es incorrecto) y no se duplican en el código (incluida la tinta atenuada `muted` de las etiquetas del mástil; los colores generales de la interfaz quedan fuera). La paleta de cada JSON sigue teniendo prioridad y no se modifica al abrir o guardar.
- Botón **Manual** (icono de libro) en la barra superior: abre la página de ayuda `ayuda/index.html` en otra pestaña (ruta relativa, local y GitHub Pages), con un resumen y un enlace al manual en PDF, que algunos navegadores descargarían al abrirlo directamente. El empaquetado de Pages incluye la ayuda y el PDF. No aparece en los HTML ni PDF exportados.
- Capturas de los manuales actualizadas con la interfaz 0.7.0 (botón Manual, repetir compases, opciones de página, ancho del compás y colores de grado) y los tres PDF de documentación regenerados.
- Compatibilidad: los JSON anteriores se abren y guardan sin cambios. Un archivo con `repeatPrevious`, `repeatPreviousTwo`, `widthPercent`, `fillToEdge`, `showMeasureNumbers`, `maxMeasuresPerRow`, `fretboardScalePercent`, `degreeText`, `noteText` o `chordName` vacío lo rechazan las versiones anteriores (campo desconocido o nombre vacío).

## 0.6.3 — 18/10/2026

- Se reduce de 6 a 5 px el relleno lateral de las tarjetas para evitar que el redondeo de los bordes a escalas fraccionarias cambie el reparto. Al 125 %, I Fall quedaba en filas 1–3 y 4–6; ahora mantiene 1–4 y 5–8 como al 100 %.
- Se conservan el tamaño del mástil, los textos, la alineación y el formato JSON. El reparto sigue adaptándose a la anchura de los trastes y al contenido.

## 0.6.2 — 18/10/2026

- Se reduce el espacio vertical de los números de compás y las separaciones entre filas y cabecera. I Fall in Love Too Easily vuelve a tener tres filas (compases 1–12) en su primera página y dos (13–19) en la segunda.
- Se conserva el tamaño de las tarjetas y los mástiles, junto con todos los textos, digitaciones y franjas. La paginación sigue adaptándose al contenido; las filas altas pasan a otra hoja cuando hace falta.
- Comprobados los JSON de I Fall y Havana en vista previa, guardado, HTML autónomo y PDF A4 horizontal. Havana mantiene seis páginas.

## 0.6.1 — 17/10/2026

- Alineación de títulos, bandas de tonalidad, números y tarjetas en toda la fila, incluso cuando solo un compás tiene título o marcas.
- La paginación suma los máximos de las pistas compartidas, en vez de tomar solo el fragmento más alto. Así reserva la altura real necesaria antes de repartir las hojas.
- Verificados los dos JSON aportados: I Fall in Love Too Easily (19 compases, 3 páginas) y Havana (78 compases, 6 páginas), sin cambios en sus datos.

## 0.6.0 — 17/10/2026

- Un solo selector de tarjetas con Añadir, Duplicar y Quitar. Nombre, calidad y textos se editan de forma independiente. Se eliminan el selector de posiciones y el alcance para todas.
- Compatibilidad con JSON anteriores: abrir y guardar conserva los grupos originales. Cambiar nombre o calidad separa solo la tarjeta editada, manteniendo orden, identificadores y textos.
- Se retiran las barras inferiores de color, los separadores y los contornos de agrupación. Las líneas de compás y las repeticiones se conservan.
- Bandas de tonalidad rectangulares como en la plantilla, con fondo tenue y línea inferior. Color por calidad y paleta; texto con contraste sobre el fondo.
- Manuales, DTS y capturas actualizados para el editor de tarjetas.

## 0.5.0 — 17/10/2026

- Tonalidad general a continuación del nombre de canción en la cabecera de cada hoja.
- Títulos de tarjeta enmarcados, por encima de la línea vertical del compás y alineados con su posición.
- Grado manual propio del voicing en la esquina superior derecha, separado de los grados de cuerda.
- Tonalidad y calidad por posición, con franjas que heredan contexto y color cuando el campo está vacío. Casilla global para ocultar las franjas sin borrar datos.
- Campos opcionales en esquema 1, conservando documentos anteriores y rechazando datos desconocidos. Nuevo ejemplo de textos y tonalidades.
- Manuales y DTS actualizados con las nuevas funciones.

## 0.4.1 — 17/10/2026

- Digitación, grados y textos siempre visibles en dos secciones apiladas. Se eliminan las dos pestañas del editor de acordes.
- Ajustes de espacio según la altura disponible, con los campos de texto en una fila en escritorio y apilados en móvil. Se conservan Deshacer/Rehacer y el selector de las posiciones a las que aplicar los textos.

## 0.4.0 — 17/10/2026

- Textos de tarjeta sin bloques duplicados: edición del título y la anotación que realmente aparecen, con elección entre esta posición y todas las posiciones del acorde. Se conservan los datos de los JSON anteriores.
- Deshacer y Rehacer para los cambios de canción, con botones en cabecera y diálogos. Escritura agrupada por campo, selección restaurada e historial limitado a la sesión. Guardar conserva los pasos; abrir otra canción los reinicia.
- Atajos fuera de los campos: Ctrl+Z, Ctrl+Y y Ctrl+Mayús+Z. Los campos conservan la edición nativa del navegador. Sin cambios en el esquema JSON ni en la geometría de las hojas.

## 0.3.0 — 17/10/2026

- Panel Colores en cabecera: fondos por familia, notas por grado natural, bemol o sostenido del 1 al 13, etiquetas personalizadas y notas sin grado. Restauración individual y completa.
- Paleta opcional guardada en JSON y aplicada a vista previa, HTML e impresión. Contraste de texto y trazos para fondos oscuros. Los JSON antiguos siguen válidos; los archivos con paleta requieren 0.3.0 o posterior.

## 0.2.0 — 17/10/2026

- Interfaz compacta de dos columnas, selectores de compás, acorde y posición, digitación y grados visibles, textos en pestaña, menús e iconos para operaciones secundarias.
- Datos de canción en un diálogo y acceso a Marcas dentro del bloque Compás. El panel muestra símbolos del compás y tramos que lo incluyen; Ver todas conserva la revisión global. Cambiar de compás prepara las nuevas marcas sin mover las guardadas.
- Manuales, DTS y capturas actualizados. Esquema JSON 1 y salida de las hojas conservados.

## Documentación — 17/10/2026

- Manual breve de uso e instalación y DTS de la aplicación 0.1.3, en Markdown, LaTeX y PDF. Incluyen capturas reales, arranque desde la carpeta principal, guardado JSON, impresión, arquitectura y límites de la evidencia.
- Generador `scripts/build_docs.py`, plantilla compartida, manifiestos SHA-256 y enlaces desde README. Sin cambios de comportamiento ni de versión de la aplicación.

## 0.1.3

- Proporciones ajustadas a la plantilla medida (primera fila de tarjetas de 128 × 161 px; rejilla de 3 trastes de 84 × 85 px): separación entre cuerdas 17 px, zona exterior 26 px, separación entre filas 12 px, huecos de 4 px entre compases, acordes y posiciones, y tarjeta con menos relleno inferior. El texto interior pasa a 9 px con interlineado 1,1 y espaciado de 0,3 px. Los textos de usuario no se recortan; no hay altura fija ni límite de 3 trastes.
- Mástil: números de cuerda 1–6 en la zona exterior, líneas horizontales de 1,3 y verticales de 1,5, puntos de 8 px de radio y números de traste de 10 px. Solo cambia el dibujo; no se tocan datos ni grados, y las cuerdas al aire y mudas se conservan.
- Aclaración sobre la comparación anterior: las 3 hojas del HTML exportado se debían a los textos «Escala» y «Tiempos» que el supervisor añadió al primer JSON, no a textos del usuario. El JSON se corrige por separado; la aplicación no lo modifica automáticamente.

## 0.1.2

- Proporciones de hoja más cercanas a la plantilla: márgenes de 5 mm, separaciones menores (columna 6 px, fila 18 px, cabecera 14 px), mástil con traste de 28 px y zona exterior de 22 px, y tipografías de cabecera y tarjeta más compactas. Una hoja admite más compases; la paginación sigue siendo adaptativa por espacio disponible, sin cupo fijo. Medida, vista previa y exportación comparten las mismas medidas. Sin cambios de datos, controles ni scroll.
- Igualación de filas: los compases, acordes y tarjetas crecen en proporción para llenar el ancho de las filas parciales y se alinean por abajo; el mástil conserva 28 px por traste y se centra. Sin límite fijo de compases por fila.

## 0.1.1

- Editor de acordes: cada acorde del compás es un grupo con sus posiciones anidadas (número y digitación en miniatura); «voicing» pasa a llamarse «posición» en los textos visibles. Botones «Añadir otro acorde» y «Añadir otra posición».
- Vista previa: contorno de cada acorde y marca del acorde seleccionado (solo en el editor; no afecta a la exportación).
- Disposición en pantallas de 761 px o más: la página no se desplaza; la zona de edición tiene scroll propio y la hoja queda siempre visible. En pantallas estrechas se conserva la disposición apilada.

## 0.1.0 (16/10/2026)

Primera versión usable.

- Edición de canciones por compases: varios acordes y voicings, digitación, grados manuales, textos heredados, personalizados u ocultos, y entrada por lista.
- Marcas musicales: repeticiones, casillas, Segno, Coda, Fine y saltos.
- Guardar y abrir JSON, con validación y copia de recuperación local.
- Hojas A4 apaisadas con paginación, exportación a HTML autónomo e impresión / PDF desde el navegador.
- Campo opcional «Versión del documento».
- Servidor local sin dependencias: `npm start`.
