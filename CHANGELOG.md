# Cambios

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
