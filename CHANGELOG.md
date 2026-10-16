# Cambios

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
