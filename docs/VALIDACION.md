# Validación de la aplicación

Este documento define pruebas por realizar. No certifica que hayan pasado. Automatizar la lógica de datos y geometría; revisar visualmente la interfaz y las hojas. Elegir herramientas de prueba pequeñas y documentar comandos reproducibles en el README cuando existan.

| Caso | Acción | Resultado esperado |
| --- | --- | --- |
| V01 | Crear canción con título y tonalidad | Campos independientes, presentes en la cabecera |
| V02 | Compás con dos acordes y otro con tres voicings de un mismo acorde | Se mantienen ambos casos sin convertir voicings en eventos distintos |
| V03 | Cinco o más tarjetas en un compás | Se distribuyen con continuidad visible y sin máximo oculto |
| V04 | Cambiar solo un voicing | No cambian los demás compases, IDs, digitaciones ni textos |
| V05 | Título exterior y texto interior distintos por tarjeta | Aparecen en su lugar y se conservan en JSON |
| V06 | Entradas geométricas de DISENO.md | Rango real correcto, puntos centrados, primera cuerda arriba |
| V07 | Digitaciones de cuatro y cinco trastes | Crece el mástil, sin recortar ni alterar notas |
| V08 | Cuerdas al aire junto a traste 4 o superior | Cejuela, traste 1 visible y extensión hasta la nota más alta |
| V09 | Mudas, todas mudas y todas al aire | No aparecen NaN, rangos negativos ni puntos falsos |
| V10 | Trastes de dos cifras separados | Seis cuerdas correctas; entrada ambigua no cambia datos anteriores |
| V11 | Lista con varios compases, acorde con bajo y voicings alternativos | Previsualización correcta y aplicación completa |
| V12 | Línea de lista inválida | Número de línea y motivo; no hay importación parcial silenciosa |
| V13 | Guardar, cerrar y abrir JSON | Igualdad semántica de todos los datos e IDs |
| V14 | Abrir JSON corrupto o schemaVersion desconocida | Mensaje legible; canción previa intacta |
| V15 | IDs duplicados o destinos incompletos | Errores/avisos localizados y posibilidad de corregir según DATOS.md |
| V16 | Repetición ×3 y casillas de varias pasadas | Símbolos y corchetes visibles; compases sin expandir |
| V17 | Segno, Coda, Fine y cada tipo de salto | Texto/símbolo correcto y destinos conservados |
| V18 | Borrar destino de salto | Se muestran consecuencias, se puede cancelar; nunca se cambia a otro destino |
| V19 | Mover un compás con marcas | Las asociaciones siguen por ID; se revisan tramos invertidos |
| V20 | Casilla y repetición cruzando fila/página | Continuidad identificable, sin cortes arbitrarios |
| V21 | Exportar una hoja y después tres hojas | Numeración 1/1 y 1/3, 2/3, 3/3 arriba a la derecha |
| V22 | Título largo, muchas tarjetas y cuatro o más trastes | Cabecera y tarjetas sin solapamientos ni recortes |
| V23 | Abrir HTML exportado sin conexión | Fuentes, colores y símbolos correctos; sin peticiones remotas necesarias |
| V24 | Imprimir A4 apaisado y guardar PDF | Mismo orden, sin página final vacía ni tarjeta cortada |
| V25 | Buscar franja tonal o páginas de análisis | No existen; la tonalidad sí aparece en cabecera |
| V26 | Editor en anchura 360–430 px y escritorio | Acciones accesibles y última fila visible; zoom de hoja independiente |
| V27 | Teclado y foco | Etiquetas, orden de tabulación y foco visible en los controles |
| V28 | Texto con <, >, comillas, tildes y símbolos | Se muestra como texto; no ejecuta scripts ni rompe exportación |
| V29 | Abrir o crear otra canción con cambios pendientes | No se pierde trabajo sin una decisión visible del usuario |
| V30 | Insertar antes y después, borrar y mover compases con renumeración | Etiquetas consecutivas desde el primer número; aviso con el número de cambios; sin renumeración se conservan |
| V31 | Seleccionar compases no contiguos y moverlos | Mantienen su orden; marcas e IDs viajan con cada compás; una pareja de repetición se mueve entera |
| V32 | Copiar, pegar y duplicar un bloque con repeticiones | Contenido idéntico, IDs nuevos sin duplicados, repeticiones rehechas respecto a su posición |
| V33 | Cortar un compás con marcas y pegarlo en la misma canción | Se avisa antes; al pegar, las marcas vuelven a encontrarlo |
| V34 | Sustituir un compás por otro copiado | Cambia el contenido; etiqueta, ID y marcas se conservan |
| V35 | Copiar una tarjeta, pegarla y sustituir solo la digitación de otra | La tarjeta pegada es independiente; la digitación cambia sin tocar nombre, textos ni tonalidad |
| V37 | Ctrl+clic en la primera y la tercera tarjeta de un compás de tres, Ctrl+C, clic en un compás vacío y Ctrl+V | Solo se marcan esas dos; se pegan al final del compás, en orden, con IDs nuevos; Ctrl+clic en el número del compás desmarca las tarjetas y marca el compás |
| V38 | Sustituir una tarjeta entera por la copiada | Cambian nombre, calidad, textos, grado, tonalidad y digitación; la tarjeta conserva su sitio y su ID, y sus vecinas de acorde no cambian |
| V39 | Pegar `xa9axa` en **Digitación**; después probar `xp9axa` y `x1012101110` | Queda `x 10 9 10 x 10` (G7 en los trastes 9–11); las otras dos entradas muestran aviso y conservan la digitación anterior |
| V40 | Abrir la aplicación; usar **Ejemplos** y **Nuevo** con cambios sin guardar | Arranca con el II–V–I en Do (Dm7 y G7, Cmaj7, Dm7 y G7, Cmaj7; Drop 2 set 1; grados 1, 3, 5 y 7 en color; sin marcas); Ejemplos lista todos los JSON de `examples/`; ambos piden decidir antes de descartar; Nuevo deja «Nombre del tema», «Tonalidad» y un compás con una tarjeta vacía |
| V41 | **Salto de línea antes** en el compás 3 de la hoja de ejemplo; exportar; pulsar la marca ↵ | Los compases 3 y 4 bajan a otra línea en la vista previa y en el HTML (sin la marca); la marca o **Quitar salto de línea antes** vuelven al reparto automático; cada cambio se deshace en un paso |
| V42 | Marcar dos tarjetas de compases distintos y elegir **Intercambiar las dos tarjetas** | Cada tarjeta ocupa el sitio de la otra con sus datos; la opción no aparece con una o tres tarjetas marcadas; Deshacer lo revierte |
| V43 | Abrir una canción con cuatro compases de dos tarjetas de tres trastes entre barras de repetición (por ejemplo, Dm7 y G7 · C6 y A7 · Dm7 y G7 · C6 y C6, con repetición de los cuatro compases) | Caben en una línea compacta; ninguna tarjeta es más estrecha que su mástil con sus números; el HTML exportado reparte igual |
| V44 | **Salto de línea después** en el compás 2 de la hoja de ejemplo; exportar; pulsar la marca ↵ | Los compases 3 y 4 bajan a otra línea y la marca ↵ queda abajo a la derecha del compás 2 (no en el HTML); en el último compás la opción está desactivada; la marca o **Quitar salto de línea después** vuelven al reparto automático; cada cambio se deshace en un paso |
| V36 | Deshacer y rehacer cada operación; guardar y abrir el JSON | Un paso por operación; el JSON reabierto es idéntico al estado editado |

Verificar la orientación A4 real del PDF y revisar todas las páginas de una exportación de varias hojas. No limitar la revisión a una captura de la primera pantalla.

Registrar navegador, tamaño de ventana, comandos, resultado y limitaciones en `ESTADO.md`. El PDF se genera desde impresión: comprobarlo en un navegador objetivo identificado; no prometer comportamiento idéntico en todos los navegadores sin probarlo.
