# Diseño de aplicación y hojas

## Dos superficies, una identidad musical

La aplicación completa debe parecer una herramienta musical terminada. Cabecera con icono y nombre a la izquierda; acciones de archivo y exportación visibles; editor de compases, controles claros y vista previa. Evitar una colección de formularios sin jerarquía.

Dirección visual propuesta: fondo neutro, tinta azul de las hojas, acentos pastel por familia, espacio entre grupos y controles con estados de foco y selección reconocibles. La interfaz sigue esta dirección visual y se ha revisado en escritorio y móvil; la evidencia está en ESTADO.md.

Usar Caveat Brush para títulos y nombres de acorde, Gochi Hand para anotaciones de hoja. Están en `references/fonts.css`. Los controles densos pueden usar una fuente de sistema legible. El usuario debe poder reconocer el estilo de las plantillas en la salida; no sustituirlo por una estética genérica de partitura.

El icono debe ser una pieza vectorial original y sencilla, legible a tamaño de cabecera y favicon. Integrarlo en toda la aplicación. No hace falta una imagen generada ni copiar marcas de terceros.

## Editor propuesto

1. Cabecera de aplicación con archivo actual y acciones Nuevo, Abrir JSON, Guardar JSON, Exportar HTML e Imprimir/PDF.
2. Datos de canción: título y tonalidad.
3. Lista de compases con inserción, duplicación, movimiento y selección.
4. Acordes y voicings del compás seleccionado. Campos con etiquetas claras: nombre del acorde, texto dentro, título encima y digitación.
5. Panel de marcas musicales con selección explícita de compás, borde o tramo.
6. Vista previa paginada que se actualiza al editar.

En móvil, apilar paneles; no encoger controles hasta volverlos ilegibles. La vista previa puede desplazarse o ajustarse con zoom. Reservar la barra inferior del navegador y comprobar que el último botón se puede pulsar.

## Tarjetas

- Tomar proporciones, bordes redondeados, tinta y colores de `referencia-tarjetas.html` y `diseno.css`.
- Cada voicing tiene su tarjeta, con título exterior opcional, nombre del acorde, texto interior y mástil.
- No generar función romana ni familia/inversión obligatoria. El texto libre puede contenerlas si el usuario las escribe.
- Los voicings del mismo acorde deben reconocerse como pertenecientes al mismo evento, sin añadir duraciones que el usuario no ha indicado.
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

- A4 apaisado: 297 × 210 mm. Definir márgenes y área útil de forma explícita. Desde 0.1.3: margen de 5 mm (área útil 287 × 200 mm); separaciones de columna 6 px, fila 12 px y cabecera 14 px; huecos de 4 px entre compases, acordes y posiciones; traste de 28 px, separación entre cuerdas de 17 px y zona exterior de 26 px (números de cuerda 1–6, cuerdas al aire y mudas). Referencia medida en la plantilla: tarjetas de la primera fila de 128 × 161 px y rejilla de 3 trastes de 84 × 85 px; no hay altura fija ni límite de 3 trastes. Trazos del mástil: horizontales 1,3, verticales 1,5, puntos de radio 8, números de traste de 10 px. Las mismas medidas (`src/layout/spec.js`, `GEOM`) rigen vista previa, medición y exportación. La paginación sigue siendo adaptativa por espacio disponible, sin cupo fijo de compases por fila.
- Cabecera de cada hoja con canción y tonalidad; número `actual/total` en la esquina superior derecha, sin colisiones con títulos largos.
- Agrupar tarjetas por compás. Empezar otra fila o página cuando falte espacio.
- Un compás con muchas tarjetas puede continuar en otra fila o página, con el mismo número y la etiqueta «continuación». No imponer un máximo oculto de tarjetas.
- Esperar a `document.fonts.ready` antes de medir, paginar o exportar. Recalcular si cambian textos o digitaciones.
- Mantener título exterior y tarjeta juntos. Evitar cortes de dibujos y barras musicales. Repetir o continuar los corchetes de casilla de manera reconocible al cruzar una fila.
- Usar el mismo renderizador para la vista previa y la exportación. El HTML exportado contiene solo las hojas y los recursos necesarios; no lleva herramientas de edición ni necesita servidor.
- El total se obtiene de las páginas reales, sin páginas vacías al final. Usar numeración propia de la hoja; recomendar desactivar los encabezados y pies automáticos del navegador al imprimir.

El HTML histórico incluye lógica, datos de una obra y análisis ajenos a este producto. No copiar textos de esa canción ni ejecutar ese código dentro de la aplicación.
