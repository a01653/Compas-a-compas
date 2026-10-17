# Cambios

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
