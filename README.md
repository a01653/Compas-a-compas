# Compás a compás

Interfaz compacta: acordes, posiciones, digitación y grados a mano; datos de canción y marcas musicales en paneles. [Capturas y comprobaciones](docs/diseno/editor-compacto/README.md).

Editor local de hojas de acordes de guitarra, organizado por compases. Permite preparar una canción, corregir sus tarjetas, guardar el proyecto editable en JSON y exportar una hoja HTML autónoma para imprimir o guardar como PDF desde el navegador.

Versión 0.2.0 ([CHANGELOG](CHANGELOG.md)). La evidencia de cada fase está en [docs/ESTADO.md](docs/ESTADO.md).

## Empezar

Requiere Node.js 18 o superior. No hay dependencias que instalar.

**En Windows, doble clic en `Abrir-Compas.cmd`.** Arranca el servidor en esa ventana y abre el navegador en <http://127.0.0.1:5174>. Si la aplicación ya estaba en marcha, solo abre el navegador. Si el puerto 5174 lo usa otra aplicación, avisa y no cierra nada. La ventana es el servidor: cierra la ventana o pulsa Ctrl+C para detenerlo, y la aplicación deja de responder. Si falta Node.js, la ventana lo indica y espera una tecla.

**Opción manual:**

```text
npm start
```

Abre <http://127.0.0.1:5174>. Para otro puerto: `npm start -- --port 8080`. El servidor solo escucha en 127.0.0.1 y solo sirve archivos de la carpeta del proyecto. Los módulos JavaScript necesitan HTTP; no funciona abriendo `index.html` con `file://`.

Pruebas:

```text
npm test
```

## Guía de uso

### Compases, acordes y voicings

- **Compases:** selector con anterior/siguiente y botón + para añadir. El menú de tres puntos permite insertar, duplicar, subir, bajar y borrar. La etiqueta visible es editable y no se renumera sola. Al borrar se listan las consecuencias para las marcas y se puede cancelar.
- **Acordes y voicings:** cada compás admite varios acordes y cada acorde varios voicings (digitaciones). Un acorde sin digitación se conserva como pendiente; un voicing nuevo empieza con todas las cuerdas mudas.
- **Digitación:** seis valores de sexta a primera cuerda: traste, `0` al aire, `x` muda. Compacto (`x35343`) o con espacios (`x 10 12 10 11 10`). Una entrada inválida muestra el error y no cambia el voicing.
- **Mástil:** mínimo tres trastes visibles; crece solo cuando la digitación lo necesita.
- **Límite de 32 trastes visibles:** es un límite conservador del intervalo que se dibuja, no del número de traste más alto. Una digitación más ancha no se dibuja, se avisa, los datos se conservan y Exportar HTML e Imprimir / PDF quedan bloqueados hasta corregirla.
- **Grados:** seis campos opcionales de la sexta a la primera cuerda. Vacío = sin grado. Colorean la nota según la plantilla, también en cuerdas al aire. No se calculan solos.

### Textos de la tarjeta

Se editan en la pestaña **Textos de la tarjeta**. Los datos generales se abren pulsando el nombre de canción en la cabecera. **Exportar** agrupa HTML e impresión; el menú superior de tres puntos contiene **Nueva canción**.

El acorde define valores por defecto de «título encima» y «texto dentro». Cada voicing puede **heredarlos**, **personalizarlos** (sustituir el valor) u **ocultarlos** (cadena vacía). Cambiar una tarjeta no toca las demás.

### Importar lista

Una línea por compás: `etiqueta | acorde @ digitación ; acorde @ digitación`. Otro voicing del mismo acorde se separa con ` / ` (con espacios) después de `@`, así que `C/E` sigue siendo un acorde con bajo. Se previsualiza y se añade al final solo si no hay errores; no hay importación parcial.

### Marcas y destinos

El botón **Marcas**, dentro del bloque Compás, abre **Marcas del compás seleccionado**: muestra las que se escriben allí y los tramos que lo incluyen. **Ver todas las marcas** permite revisar la canción completa. Las nuevas parten del compás activo y las guardadas conservan su ubicación al cambiar de selección. Desde este panel se añaden, editan y borran repeticiones ×N, casillas de una o varias pasadas, Segno, Coda, Fine y los siete saltos (D.C., D.S., To Coda y variantes). Compases y destinos se eligen por etiqueta legible. Un destino que ya no existe se conserva como pendiente y se avisa; nunca se redirige a otro compás. Las marcas se dibujan, pero la aplicación no expande ni valida el recorrido.

### Continuaciones

Un compás que no cabe en una fila pasa a la siguiente; si no cabe ni así, se parte entre tarjetas en fragmentos con la misma etiqueta y la marca «continuación». Inicio y fin de repetición solo aparecen en el primer y último fragmento; casillas y repeticiones se muestran como continuación al cruzar fila u hoja. Todas las tarjetas se conservan en orden.

### Guardar, exportar e imprimir

| Acción | Resultado |
| --- | --- |
| **Guardar JSON** | El proyecto editable completo. Es la única copia que permite seguir editando. Usa el selector de archivos del navegador si existe; si no, una descarga normal. |
| **Exportar HTML** | Un archivo único con las hojas, fuentes y estilos incluidos. Sin editor, sin JavaScript y sin peticiones externas; se abre sin conexión. No se puede volver a editar. |
| **Imprimir / PDF** | Abre el diálogo de impresión del navegador sobre ese mismo HTML. No hay descarga de PDF nativa. |

- **Impresión A4:** en el diálogo elige «Guardar como PDF» (o la impresora), A4 horizontal, márgenes «Ninguno» y desactiva «Encabezados y pies de página». La hoja mide 297 × 210 mm con márgenes de 5 mm y `actual/total` arriba a la derecha. Ctrl+P sobre el editor no imprime la interfaz.
- Si hay referencias musicales pendientes, se muestran y se pide confirmar antes de exportar o imprimir.
- **Archivo:** Nuevo, Abrir JSON y Guardar JSON. Un archivo inválido o de otra versión se rechaza con errores legibles y la canción abierta queda intacta. Los campos desconocidos bloquean la apertura en vez de descartarse.
- **Versión del documento:** campo opcional de texto libre para tus revisiones. No es la versión de la aplicación ni la del formato del archivo; abrir un archivo no la modifica.
- **Cambios sin guardar:** el encabezado los indica y Nuevo y Abrir piden decidir.
- **Recuperación local:** los cambios pendientes se copian en `localStorage` del navegador y se ofrecen al volver a abrir la aplicación. Es una red de seguridad, no un guardado; se borra al guardar, abrir o crear una canción.

## Navegadores

Comprobado en Chromium. Firefox y Safari no se han probado. El diálogo de impresión nativo del sistema depende del navegador.

## Documentación

Manuales en PDF, con fuentes editables: [uso](docs/latex/Manual_Uso_Compas_a_compas.pdf), [instalación y arranque](docs/latex/Manual_Instalacion_Compas_a_compas.pdf) y [DTS](docs/latex/DTS_Compas_a_compas.pdf). El [índice de manuales](docs/manuals/README.md) explica cómo regenerarlos.

| Archivo | Contenido |
| --- | --- |
| [Manual de uso](docs/manuals/USO.md) | Primeros pasos, acordes y posiciones, marcas, guardado e impresión |
| [Instalación y arranque](docs/manuals/INSTALACION.md) | Doble clic en Windows, actualización y resolución de problemas |
| [DTS](docs/DTS.md) | Arquitectura, contrato JSON, geometría, paginación y evidencia técnica |
| [Requisitos](docs/REQUISITOS.md) | Funciones acordadas y límites de alcance |
| [Diseño](docs/DISENO.md) | Aplicación completa, tarjetas e impresión |
| [Modelo de datos](docs/DATOS.md) | Canción, compases, acordes, voicings y navegación musical |
| [Esquema JSON](schemas/song.schema.json) | Contrato para guardar canciones |
| [Ejemplo editable](examples/cancion-demo.json) | Datos de prueba; no es una transcripción de una obra |
| [Plan](docs/PLAN.md) | Fases, entregables y condiciones de cierre |
| [Validación](docs/VALIDACION.md) | Casos que debe superar la aplicación |
| [Estado](docs/ESTADO.md) | Estado actual y registro por fase |
| [Referencias](references/README.md) | Procedencia y diferencias frente a las plantillas |

## Alcance

Sin deshacer, OCR, reproducción de audio, teoría o generación automática de acordes, ni alojamiento web. La planificación no autoriza publicar ni desplegar.
