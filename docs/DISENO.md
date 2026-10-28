# Diseño de aplicación y hojas

## Dos superficies, una identidad musical

La aplicación completa debe parecer una herramienta musical terminada. Cabecera con icono y nombre a la izquierda; acciones de archivo y exportación visibles; editor de compases, controles claros y vista previa. Evitar una colección de formularios sin jerarquía.

Dirección visual propuesta: fondo neutro, tinta azul de las hojas, acentos pastel por familia, espacio entre grupos y controles con estados de foco y selección reconocibles. La interfaz sigue esta dirección visual y se ha revisado en escritorio y móvil; la evidencia está en ESTADO.md.

Usar Caveat Brush para títulos y nombres de acorde, Gochi Hand para anotaciones de hoja. Están en `references/fonts.css`. Los controles densos pueden usar una fuente de sistema legible. El usuario debe poder reconocer el estilo de las plantillas en la salida; no sustituirlo por una estética genérica de partitura.

El icono debe ser una pieza vectorial original y sencilla, legible a tamaño de cabecera y favicon. Integrarlo en toda la aplicación. No hace falta una imagen generada ni copiar marcas de terceros.

## Editor vigente desde 0.6.0

1. Cabecera con icono, canción activa, Nuevo, Abrir, menú Ejemplos, Guardar JSON y menú Exportar. El nombre abre el diálogo de datos; el menú de tres puntos contiene Datos de la canción. Desde 0.9.0 la aplicación arranca con la hoja de ejemplo de `examples/index.json` y, entre 761 y 1240 px, la barra de archivo baja a una segunda fila para que la canción activa siga legible.
2. Bloque Compás: selector, anterior/siguiente, añadir, opciones y acceso Marcas. Desde 0.8.0 el menú de opciones agrupa etiqueta, ancho, renumeración y las acciones estructurales (compás, copiar y pegar, selección de varios); una barra bajo el selector muestra la selección múltiple. El clic derecho sobre un compás de la hoja abre un menú contextual con las mismas acciones.
3. Editor con un selector plano de tarjetas del compás y acciones Añadir tarjeta, Duplicar tarjeta y un menú de tarjeta (copiar, cortar, pegar, sustituir la tarjeta o su digitación, mover, marcar y quitar), el mismo que abre el clic derecho sobre una tarjeta de la hoja. No hay dos niveles visibles de acorde y posición.
4. Digitación y grados encima de textos y tonalidad, siempre visibles y sin pestañas. Cada campo modifica solo la tarjeta seleccionada, incluido nombre y calidad.
5. Panel de marcas ligado al compás activo, con selector de contexto y Ver todas las marcas. Incluye tramos que atraviesan el compás. La selección solo cambia la vista y el punto de partida de nuevas marcas; no mueve las ya guardadas.
6. Vista previa más ancha a la derecha. El editor habitual cabe sin scroll en las ventanas de escritorio comprobadas; contenido extenso y móvil conservan desplazamiento cuando hace falta.

En móvil, apilar paneles; no encoger controles hasta volverlos ilegibles. La vista previa puede desplazarse o ajustarse con zoom. Reservar la barra inferior del navegador y comprobar que el último botón se puede pulsar.

## Tarjetas

- Tomar proporciones, bordes redondeados, tinta y colores de `referencia-tarjetas.html` y `diseno.css`.
- Cada voicing tiene su tarjeta, con título exterior opcional enmarcado, nombre del acorde, grado propio arriba a la derecha, texto interior y mástil. El título queda por encima y fuera de la línea del compás, alineado con el borde izquierdo de su tarjeta. Su ancho disponible es el del compás, no el de la tarjeta: puede extenderse sobre las tarjetas siguientes del mismo compás hasta la próxima que tenga título propio o el final del compás (o del fragmento, si el compás continúa en otra fila). Solo ajusta línea cuando no cabe en ese espacio y nunca ensancha las tarjetas.
- Una franja rectangular opcional sobre cada tarjeta muestra los cambios explícitos de tonalidad. Lleva un fondo tenue y una línea inferior de 3 px, con esquinas rectas como la plantilla; los segmentos contiguos cubren el hueco entre tarjetas. Las posiciones sin cambio mantienen el contexto y el color anteriores, sin repetir etiqueta. La calidad se elige por separado de la del acorde y respeta la paleta de la canción. La casilla global de datos de canción oculta todas las franjas, sin borrar información.
- El grado del voicing, las anotaciones y las tonalidades se escriben manualmente. No generar función romana ni familia/inversión obligatoria.
- No dibujar agrupaciones por acorde, líneas de color bajo las tarjetas ni separadores verticales entre tarjetas de un mismo compás. Las barras de compás y de repetición conservan su función musical.
- El relleno lateral de las tarjetas es de 5 px desde 0.6.3, con holgura para el redondeo de bordes a escalas fraccionarias. En una fila compacta (0.10.0) baja a 1 px para que quepa un compás más: el límite inferior es el mástil con sus números de cuerda y de traste, que no se reduce; nombre, grado y leyenda conservan 3 px.
- El ancho crece al añadir trastes; la fila y la página se reorganizan. No estrechar indefinidamente cada celda para mantener cuatro compases por fila.

## Geometría del mástil

Sea P la lista de trastes positivos. Si hay cuerdas al aire, `inicio = 1`; en otro caso, `inicio = min(P)` o 1 si P está vacía. `cantidad = max(3, max(P) - inicio + 1)`, usando 0 como máximo cuando P está vacía. El último traste es `inicio + cantidad - 1`.

Para una nota en el traste f: `x = (f - inicio + 0.5) * anchoCelda`. Las divisiones quedan en múltiplos de `anchoCelda`; los puntos, en el centro. La orientación gráfica de las cuerdas invierte el orden de entrada sexta→primera. No invertir las digitaciones almacenadas.

Ejemplos geométricos, sin atribuir nombres de acorde:

| Entrada sexta→primera | Trastes visibles |
| --- | --- |
| x 3 5 3 4 3 | 3–5 |
| x 3 6 4 5 3 | 3–6 |
| 0 2 2 1 0 0 | 1–3, con cejuela |
| 0 2 2 4 0 0 | 1–4, con cejuela |
| x 10 12 10 11 10 | 10–12 |
| x x x x x x | 1–3, todas mudas |

Una posición muy extendida puede obligar a dedicarle una fila o una página. Si ni así cabe de forma legible, informar del conflicto y conservar los datos; no ocultar notas ni simular que se exportó correctamente.

## Paginación e impresión

- A4 apaisado: 297 × 210 mm. Definir márgenes y área útil de forma explícita. Desde 0.1.3: margen de 5 mm (área útil 287 × 200 mm); separaciones de columna 6 px, fila 8 px y cabecera 10 px (desde 0.6.2); huecos de 4 px entre compases, acordes y posiciones; traste de 28 px, separación entre cuerdas de 17 px y zona exterior de 26 px (números de cuerda 1–6, cuerdas al aire y mudas). Referencia medida en la plantilla: tarjetas de la primera fila de 128 × 161 px y rejilla de 3 trastes de 84 × 85 px; no hay altura fija ni límite de 3 trastes. Trazos del mástil: horizontales 1,3, verticales 1,5, puntos de radio 8, números de traste de 10 px. Las mismas medidas (`src/layout/spec.js`, `GEOM`) rigen vista previa, medición y exportación. La paginación sigue siendo adaptativa por espacio disponible, sin cupo fijo de compases por fila.
- Cabecera de cada hoja con canción seguida de tonalidad en la misma línea cuando quepa; número `actual/total` en la esquina superior derecha, sin colisiones con títulos largos.
- Agrupar tarjetas por compás. Empezar otra fila o página cuando falte espacio, salvo que la fila quepa compacta. Los saltos de línea antes y después los marca en la vista previa un botón ↵ (margen izquierdo de la línea o abajo a la derecha del compás) que no aparece en la salida.
- Un compás con muchas tarjetas puede continuar en otra fila o página, con el mismo número y la etiqueta «continuación». No imponer un máximo oculto de tarjetas.
- Esperar a `document.fonts.ready` antes de medir, paginar o exportar. Recalcular si cambian textos o digitaciones.
- Compartir las pistas de marcas, títulos, franjas y zona del compás mediante subgrid entre todos los compases de cada fila, evitando offsets de altura fijos. Medir esas pistas por fragmento y sumar sus máximos al calcular la altura de una fila; el máximo de alturas individuales puede ser insuficiente. Mantener título exterior y tarjeta juntos. Evitar cortes de dibujos y barras musicales. Repetir o continuar los corchetes de casilla de manera reconocible al cruzar una fila.
- Usar el mismo renderizador para la vista previa y la exportación. El HTML exportado contiene solo las hojas y los recursos necesarios; no lleva herramientas de edición ni necesita servidor.
- El total se obtiene de las páginas reales, sin páginas vacías al final. Usar numeración propia de la hoja; recomendar desactivar los encabezados y pies automáticos del navegador al imprimir.

El HTML histórico incluye lógica, datos de una obra y análisis ajenos a este producto. No copiar textos de esa canción ni ejecutar ese código dentro de la aplicación.

Las flechas Deshacer y Rehacer permanecen en cabecera y en los diálogos de edición. El historial restaura la canción y la selección, sin guardar pasos en el JSON.

En la vista previa se selecciona lo señalado: el recuadro de una tarjeta señala la tarjeta; el número, el título, la franja y los huecos señalan el compás. Lo señalado se resalta con más fuerza (con una tarjeta señalada, el compás activo queda con un tinte tenue, y al revés). La selección múltiple se marca en ámbar: los compases con fondo y contorno discontinuo, las tarjetas con un anillo que sigue su redondeo. El modo selección añade una casilla dibujada como fondo en la esquina de cada compás. Son solo estilos de la vista previa: no cambian dimensiones, paginación ni el HTML exportado.
