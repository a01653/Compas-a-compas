# Repeticiones de compás, ajustes de tarjetas y opciones de página

Fecha: 18/10/2026. Estado: pendiente de implementar.
Repositorio: a01653/Compas-a-compas. Base revisada: aplicación 0.6.3, main 2ce9ade6fb1ea42e3602341924906fcffdbbc139.

Este documento recoge un encargo cuya primera implementación, según Claude, está en la rama `feature/repeticion-compas-y-nombres-vacios`; todavía no está validada visualmente ni integrada en `main`. Las opciones de página y la repetición de dos compases añadidas el 18/10/2026 quedan pendientes de incorporación y comprobación.

## Petición

1. Permitir representar un compás que repite el anterior con un símbolo musical grande, sin duplicar los dibujos de acordes.
2. Colocar su botón fuera de los menús, junto a Añadir tarjeta, que es el nombre vigente del antiguo botón de añadir acorde.
3. Crear las tarjetas con el nombre vacío. Al dejar vacío el nombre, la hoja no debe mostrar texto de prueba ni una raya.
4. Limitar el crecimiento horizontal de las tarjetas: una fila con uno o pocos compases no debe estirarlos para ocupar todo el ancho.
5. Permitir elegir por separado fondo y texto de cada grado; el texto será blanco por defecto. Cambiar el fondo predeterminado de «Sin grado o sin color propio» de #14183a a un gris claro.\n6. Permitir fijar un máximo de compases por línea, conservando el modo automático actual cuando no se establece un máximo.\n7. Añadir una opción global por canción para ocultar los números/etiquetas visibles de todos los compases, útil para crear una hoja de acordes que no representa una partitura.\n8. Añadir el signo de repetición de dos compases, con dos barras diagonales, para repetir como pareja los dos compases escritos inmediatamente anteriores.

## Símbolo de repetición de un compás

Usar el signo musical de repetición de un solo compás: barra oblicua con dos puntos, reconocible como un signo de porcentaje musical. No sustituirlo por barras de inicio/fin de repetición ni por símbolos de repetir dos o cuatro compases.

La acción se aplica al compás seleccionado. Botón visible junto a Añadir tarjeta, con icono y nombre accesible **Repetir compás anterior**. Su ayuda debe explicar el alcance. No crear compases adicionales de forma implícita: para añadir otro compás se conserva el control de añadir compás existente.

- En un compás vacío, activa la repetición del compás inmediatamente anterior en el orden escrito.
- En el primer compás, la acción está deshabilitada y se explica que no hay compás anterior.
- Si el compás actual contiene tarjetas, pedir confirmación antes de sustituirlas por el símbolo. Cancelar conserva todos los datos; aceptar constituye una única acción deshacible.
- Dar una acción visible para quitar la repetición y volver a un compás editable vacío. Deshacer recupera el estado anterior completo.
- Si se pulsa Añadir tarjeta en un compás de repetición, salir de ese modo de forma explícita, sin dejar simultáneamente símbolo y tarjetas ocultas. Mostrar una confirmación breve si hace falta aclarar la sustitución.

El signo repite el contenido completo del compás anterior, no solamente su último acorde. Es una decisión manual del usuario: no detectar ni convertir automáticamente acordes iguales. Se permiten varios compases de repetición consecutivos. No añadir reproducción ni expandir el recorrido musical.

## Ancho de cada compás y ajuste de línea

Añadir a cada compás un ajuste de ancho opcional, con **Automático** como valor predeterminado. El ancho manual se expresa como porcentaje del ancho útil de la línea para que responda a pantalla e impresión; afecta a la columna completa del compás y a todas sus tarjetas. No usar píxeles fijos.

El ancho definido debe permitir que quepa el contenido natural de sus tarjetas. No recortar ni comprimir mástiles, texto o notas para respetarlo. Si el contenido necesita más espacio, avisar y usar su ancho mínimo legible; permitir que la paginación coloque menos compases en esa línea, siempre respetando el máximo configurado. La propiedad de ancho ausente conserva el ajuste automático actual.

Añadir en cada línea un botón **Ajustar línea al ancho**. Al activarlo, distribuir el espacio libre hasta el margen derecho entre los compases de esa línea, manteniendo sus proporciones naturales y respetando el mínimo requerido por su contenido. Este modo puede superar el límite de expansión del 25 % para esa línea; el modo Automático sigue usando el límite existente. Si la línea cambia de composición en móvil o impresión, recalcular el reparto con los compases que realmente quepan. El botón debe poder deshacerse y ofrecer volver a Automático.

Guardar en el JSON tanto el ancho manual por compás como el modo de ajuste de línea. Omitir los campos nuevos en modo Automático. Usar valores relativos al ancho de línea, validar el tipo y el rango en modelo, importación, exportación y JSON Schema, y documentarlos en `docs/DATOS.md`. Una opción concreta es `measure.widthPercent` y un indicador `measure.fillToEdge`; fijar el contrato final durante la implementación. No guardar valores derivados de la pantalla ni el ancho medido en píxeles.

## Menús de tonalidad cuando la visualización está desactivada

Cuando la opción global `showTonalities` esté desactivada, ocultar de los menús de edición por voicing los campos que configuran la franja tonal —incluidos **Tonalidad** y **Calidad de tonalidad**—, ya que no se muestran en la página. Mantener disponible el control global **Mostrar tonalidades** para poder reactivarlas. No ocultar otros datos de tonalidad que sigan teniendo un efecto visible, como la tonalidad del título.

Ocultar esos controles no debe borrar ni modificar los valores `tonality` ya guardados en los voicings. Al reactivar la opción global, volver a mostrar los campos con sus valores anteriores. Guardar, abrir, deshacer, rehacer y recuperar deben conservarlos. Añadir esta regla y una captura/caso de uso a la documentación de la interfaz.

## Repetición de dos compases

Añadir una acción visible **Repetir dos compases anteriores**, junto a **Repetir compás anterior**. Se aplica al compás seleccionado como el primero de los dos compases de destino; el compás siguiente es el segundo destino. La acción repite como pareja los dos compases escritos inmediatamente anteriores, en el mismo orden. No comprime ambos compases fuente en un único compás ni crea acordes duplicados.

Dibujar el signo de dos barras diagonales sobre el par de compases de destino. Mantener sus dos barras de compás, etiquetas, IDs y marcas estructurales. El signo debe distinguirse claramente del símbolo de un compás (porcentaje musical). Ambos modos conservan el número de compases escritos y no expanden el recorrido.

Si falta el segundo compás de destino, explicar que la repetición necesita dos compases y ofrecer añadirlo de forma explícita antes de aplicar la marca. No añadirlo silenciosamente. Si cualquiera de los dos destinos contiene tarjetas, pedir confirmación antes de sustituirlas; cancelar conserva ambos compases y aceptar debe ser una sola acción deshacible. Quitar la repetición restaura los dos compases como vacíos y editables; Deshacer recupera el estado anterior.

En el JSON, mantener la marca en los datos del compás y enlazar por IDs estables tanto el par fuente como el par destino. Como forma sugerida, añadir `repeatPreviousTwo` al primer compás de destino con `sourceMeasureIds: ["m1", "m2"]` y `targetMeasureIds: ["m3", "m4"]`. Fijar y documentar el contrato definitivo en el modelo, el JSON Schema y `docs/DATOS.md`. Los dos compases de destino deben existir, ser consecutivos, no duplicar chordEvents y no solaparse con otra marca de repetición incompatible.

Validar que las dos fuentes sean las inmediatamente anteriores al par de destino en el orden escrito. Si se borra o mueve cualquiera de los cuatro compases y la relación deja de ser válida, conservar los IDs y mostrar un aviso; no cambiar las referencias automáticamente. Detectar IDs inexistentes, repetidos, destinos no consecutivos, solapamientos y ciclos. Ofrecer la corrección como acción explícita. Conservar títulos, anotaciones, tonalidades y marcas de navegación que ya pertenezcan a los dos compases de destino.

## Datos y referencias

Representar la repetición como información musical propia del compás, separada de chordName, textos libres y structure.repeats. No almacenar un carácter de porcentaje como nombre del acorde ni copiar sus voicings.

Para la repetición de un compás, usar un campo opcional que identifique el compás fuente mediante su ID estable; por ejemplo, `repeatPrevious: { sourceMeasureId: "m1" }`. Para la repetición de dos compases, usar la marca de pareja descrita arriba con IDs de fuente y destino. Conservar `chordEvents` vacíos en los compases de destino. Fijar y documentar el contrato final al implementar.

La referencia debe corresponder al predecesor inmediato en el orden escrito. Si se borra o mueve el origen y deja de cumplir esa condición, conservar la referencia y avisar; no redirigirla silenciosamente. Ofrecer corregirla con una acción expresa. Detectar referencias inexistentes, referencias a sí mismo y ciclos, y aplicar la política vigente de avisos/exportación para referencias musicales pendientes.

Actualizar de forma conjunta el modelo, la validación manual, JSON Schema, serialización, IDs, duplicación/borrado/movimiento de compases y recuperación. Una duplicación de compás de repetición debe mantener una semántica coherente de «compás anterior» mediante una acción explícita, sin apuntar silenciosamente a un compás arbitrario. Documentar esa decisión y cubrirla con una prueba.

Los JSON anteriores deben abrirse y guardarse sin añadir campos. No migrar toda la canción por abrirla. Documentar la compatibilidad con lectores anteriores, que rechazan campos desconocidos. No elevar schemaVersion sin una necesidad y política de compatibilidad concretas.

Conservar las marcas, etiquetas y destinos del compás actual al convertirlo. El cambio de representación afecta a sus tarjetas; no borra Coda, Fine, casillas ni repeticiones existentes.

## Dibujo y paginación

Dibujar el signo de un compás centrado en su compás y el de dos compases sobre la pareja de destino, grandes y legibles, sin mástiles ni tarjetas duplicadas. Mantener las líneas de compás y las marcas musicales. El número se puede ocultar con la opción global especificada abajo; el contexto tonal aplicable se conserva. No imponer tarjetas de color ficticias ni inventar acordes.

Usar un SVG propio o un recurso musical incluido en la aplicación, sin depender de fuentes o servicios remotos. Añadir una etiqueta accesible que explique «repite el compás anterior».

Medición, vista previa, HTML autónomo e impresión deben compartir el renderizador. La repetición de uno o dos compases conserva su extensión escrita y no se expande. Las marcas deben poder seleccionarse desde la hoja. Conservar la alineación por pistas de toda la fila y el reparto adaptativo vigente.

Preservar los ajustes de 0.6.2 y 0.6.3: no volver a introducir los problemas de altura o de anchura a escala de pantalla fraccionaria. No fijar un número de compases o filas por página.

## Tarjetas nuevas sin nombre de prueba

El nombre inicial debe ser la cadena vacía, también en los caminos de creación del modelo. Revisar al menos src/model/cards.js (addCard), src/model/song.js (addEvent), el controlador de Añadir tarjeta y los ejemplos/pruebas que dependan de ese valor predeterminado.

En src/render/card.js existe event.chordName || '—'. Retirar ese sustituto en el dibujo. Un nombre vacío o compuesto solo por espacios no debe mostrar guion, subrayado, línea de entrada ni texto como «Sin nombre» o «Acorde nuevo» en vista previa, HTML o impresión.

Puede conservarse un placeholder en el campo del editor y una etiqueta auxiliar en el selector para identificar una tarjeta sin nombre; esos textos no forman parte de la canción ni de la hoja. Mantener los nombres y textos que ya tenga un archivo, incluidos los escritos por el usuario. No limpiar automáticamente cadenas existentes que coincidan con «Acorde nuevo».

Conservar la digitación, los grados, la anotación, el título exterior, la tonalidad y el color de una tarjeta al borrar su nombre. No borrar su grado de tarjeta ni colapsar el espacio hasta desalinear la fila. No quitar líneas del mástil, bordes de tarjeta ni barras de compás: la raya a retirar es el sustituto del nombre vacío.

## Crecimiento horizontal limitado

Una fila con un solo compás, una sola tarjeta o pocas tarjetas debe mantener proporciones parecidas a las filas más llenas. Alinear el contenido a la izquierda y dejar el sobrante a la derecha cuando las tarjetas alcancen su ancho máximo. No estirar tarjetas ni separar compases de extremo a extremo para justificar la fila.

Establecer un límite de expansión respecto al ancho natural medido de cada tarjeta. Como valor inicial de implementación, permitir un máximo del 25 % de ancho adicional; concentrar ese valor en una constante documentada para poder ajustarlo tras revisar capturas. El requisito del usuario es que exista el límite y que el resultado no deforme las tarjetas; el porcentaje es una decisión inicial de implementación.

El ancho natural incluye el mástil real, su zona exterior y el relleno necesario. Una tarjeta con cuatro o más trastes puede ser más ancha por su contenido: el límite afecta a la expansión para repartir espacio sobrante, no recorta notas ni impone el ancho de una tarjeta de tres trastes. Los textos largos deben ajustar línea, sin usar el sobrante de la hoja para producir una tarjeta enorme.

Aplicar el límite a todas las filas y también al compás de repetición, no solamente a la última fila. Conservar separaciones y alineación vertical entre compases. No alterar el tamaño de papel ni el zoom para simular el resultado. Medición, reparto y renderizado deben acordar los anchos usados; considerar la altura adicional de los textos al dejar de estirarlos.

Esta petición sustituye, para el cambio encargado, cualquier instrucción anterior de rellenar todo el ancho de las filas parciales. Se conserva la paginación adaptativa, sin imponer cantidades fijas de compases o tarjetas.

## Color de texto por grado y nuevo fondo neutro

Ampliación del 18/10/2026: el usuario observa texto negro ilegible cuando usa #14183a. Reproducir el caso y revisar tanto el indicador del panel de colores como los números y letras de los puntos del mástil, en notas pisadas y cuerdas al aire.

En Colores → Notas y grados, cada grado tendrá dos valores independientes: **Fondo** y **Texto**. Ambos deben poder elegirse con selector de color y hexadecimal #RRGGBB. El color de texto predeterminado será **#ffffff**, tal como pide el usuario.

- Cubrir grados naturales, bemoles y sostenidos del 1 al 13 y cualquier etiqueta personalizada, incluidos bb7, ##4 y R.
- Las equivalencias ♭/b y ♯/# deben utilizar la misma entrada normalizada. Cambiar texto o fondo de b3 no modifica 3 ni #3.
- Respetar el color de texto elegido por el usuario. El cálculo automático de contraste no debe sobrescribir una elección explícita ni sustituir silenciosamente el blanco predeterminado solicitado.
- Mostrar la combinación real en la muestra del panel. Actualizarla al cambiar cualquiera de los dos colores.
- Permitir restaurar los valores predeterminados de forma clara y conservar Deshacer/Rehacer, guardado y recuperación.
- Incluir también un color de texto de reserva para «Sin grado o sin color propio», usado cuando una etiqueta no tenga configuración propia. Una nota sin etiqueta no debe inventar ni dibujar un grado.

Cambiar únicamente el fondo neutro predeterminado de las notas sin grado/color propio: de #14183a a **#d1d5db**, como elección inicial de gris claro. Conservar el fondo explícito que ya lleve un JSON: si el archivo guarda palette.note = "#14183a", debe seguir usándolo. Restaurar o abrir una canción sin fondo neutro personalizado debe usar el gris nuevo.

No hacer una sustitución global de #14183a: ese color también es tinta de líneas, textos y parte del cálculo de contraste. Separar el color neutro de las notas de la tinta oscura general para no aclarar el mástil, los nombres o las barras musicales. Revisar DEFAULT_DOT y DEFAULT_NOTE_COLOR, foreground(), paletteDegreeColor() y degreeDot(); el valor efectivo debe ser coherente con y sin paleta y con tarjetas de fondo oscuro. Esta ampliación se refiere al texto de los grados dentro de los puntos; no convierte el grado escrito arriba a la derecha de una tarjeta en una nota ni mezcla ambos campos.

Extender la paleta con campos opcionales de texto, sin convertir las cadenas existentes de palette.degrees en objetos ni cambiar el significado de sus fondos. Una opción es un mapa de colores de texto por grado y un valor de reserva; fijar los nombres definitivos al implementar y documentarlos. Si solo se personaliza el texto de una etiqueta, esa etiqueta debe seguir apareciendo en el panel aunque no tenga un fondo personalizado.

Actualizar conjuntamente esquema, validación manual, serialización, edición y renderizador. Los archivos anteriores conservan sus fondos personalizados y abren sin migraciones ni escritura automática de campos nuevos. Al faltar un color de texto propio, utilizar el blanco por defecto. Documentar la compatibilidad con lectores antiguos. Aceptar solo colores hexadecimales válidos y mantener el rechazo de claves reservadas y CSS arbitrario.

Aplicar las mismas combinaciones en vista previa, HTML autónomo e impresión. No cambiar fuentes, tamaño del grado ni notas musicales para corregir el color.

## Máximo de compases por línea

Añadir en las opciones generales de la canción un control **Máximo de compases por línea** con el modo **Automático** y límites numéricos. Si se deja en Automático, conservar exactamente el comportamiento de distribución vigente. El valor elegido es un tope, no una obligación de llenar cada línea: el diseño puede colocar menos compases cuando el ancho disponible, las tarjetas o la impresión lo requieran. Mantener el orden escrito y no separar un compás de sus tarjetas.

Aplicar el mismo límite en vista previa, HTML exportado e impresión, tanto en escritorio como en móvil y con el crecimiento horizontal limitado de tarjetas. Recalcular filas y paginación sin recortar contenido ni fijar un número de filas por página. Cambiar el límite no debe modificar el contenido musical.

Persistirlo como opción global del documento, por ejemplo `maxMeasuresPerRow`. Campo opcional: si no existe (modo Automático), se mantiene el comportamiento actual. Si se guarda un límite explícito, debe ser un entero positivo validado por el modelo y el esquema. No modificar automáticamente JSON antiguos.

## Ocultar los números de compás

Añadir una casilla global por canción **Mostrar números de compás**, activada por defecto. Al desactivarla, ocultar en toda la hoja los números/etiquetas visibles de los compases en vista previa, HTML exportado e impresión. Debe permitir preparar una hoja de acordes que no pretende representar una partitura.

La opción solo controla la presentación: conservar etiquetas, IDs, orden, datos de compases vacíos y relaciones internas. Al ocultar los números, retirar también las líneas verticales que separan los compases en vista previa, HTML exportado e impresión. Mantener las líneas del mástil y las tarjetas, y los signos de repetición y demás marcas musicales. Mantener visibles los símbolos y marcas independientes —repeticiones, Coda, Fine, casillas y saltos—, así como la numeración de páginas `página/total`. Al volver a activar la casilla se recuperan las etiquetas originales sin regenerarlas.

Persistirlo como opción global del documento, por ejemplo `showMeasureNumbers`. Campo opcional: si falta, equivale a `true` para que los JSON existentes sigan mostrando sus números. Validar el tipo booleano en el modelo, el guardado, la recuperación y el JSON Schema. Documentar que lectores antiguos que rechacen propiedades desconocidas no admitirán documentos guardados con esta opción.

## Comprobaciones de aceptación

- Compás 1 con uno o varios acordes; compás 2 marcado como repetición: aparece un único signo grande y no se duplican datos ni dibujos.
- Varios compases de repetición consecutivos y una repetición situada al comienzo de otra fila o página.
- Primer compás, conversión confirmada/cancelada, quitar repetición y añadir tarjeta después de quitarla.
- Editar el contenido del origen conserva la referencia, sin una copia desactualizada.
- Borrar, mover y duplicar compases no produce referencias silenciosamente incorrectas; cubrir también referencias rotas y ciclos.
- Número, Coda, Fine, casillas y barras de repetición conservados en los compases afectados.\n- Repetición doble: el signo de dos barras cubre los dos destinos y referencia los dos compases anteriores exactos, en orden. Probar creación/cancelación, quitar/deshacer, falta del segundo destino y movimientos/borrados/duplicaciones que invaliden la pareja.
- Deshacer/Rehacer, recuperación y Guardar/Abrir restauran contenido y selección.
- Tarjeta nueva sin nombre; escribir y borrar su nombre: sin texto de prueba ni raya en la hoja, conservando los demás campos.
- Apertura y guardado de JSON antiguos sin modificaciones; acuerdo entre validación manual y JSON Schema para los campos opcionales de repetición y presentación, incluidos sus valores por defecto y combinaciones incompatibles. Actualizar `docs/DATOS.md`, el JSON Schema, validación, importación/exportación, guardado, recuperación e historial al implementar; documentar que lectores antiguos rechazan campos nuevos. No elevar `schemaVersion` sin necesidad concreta.
- Vista previa y HTML autónomo coinciden, sin recursos externos. Revisar PDF A4 horizontal y ausencia de recortes.
- Probar el encuadre con los ejemplos existentes y, si están disponibles localmente, los JSON de I Fall y Havana. No incorporar archivos personales al repositorio.
- Filas con una, dos y muchas tarjetas, compás con varias tarjetas y compás de repetición: crecimiento limitado, contenido a la izquierda y sobrante a la derecha. Comparar con una fila llena; probar cuatro o más trastes y textos largos sin recortes ni desbordamiento vertical.\n- Máximo de compases por línea en Automático reproduce la distribución actual; límites de 1, 2 y otros valores disponibles nunca se superan. Verificar que en pantallas estrechas o con tarjetas anchas se permiten menos compases, sin recortes, y que HTML e impresión coinciden.\n- Ocultar/mostrar numeración afecta a todos los compases de la canción en vista previa, HTML e impresión; las etiquetas guardadas se conservan. Los símbolos de repetición, Coda, Fine, casillas y saltos, y el número de página, siguen visibles.
- Comprobar reparto a escala de pantalla 100 %, 125 %, 150 % y 175 %, además de móvil. Mantener el mástil y la lectura musical.
- Color de texto independiente para 1, b3, #5, bb7 y una etiqueta personalizada; probar valores personalizados solo de texto y solo de fondo, normalización, restauración, historial, JSON y recuperación. Comparar punto del mástil y muestra del panel.\n- Al ocultar los números de compás desaparecen también los separadores verticales entre compases en pantalla, exportación e impresión; se conservan las líneas internas del mástil/tarjetas y las marcas musicales.\n- El ancho automático reproduce el diseño actual. Un ancho manual se adapta a pantalla/impresión, nunca recorta contenido y puede hacer que quepan menos compases. **Ajustar línea al ancho** llega hasta el margen derecho, incluso si supera el 25 %, y vuelve a automático mediante Deshacer/restablecer.\n- Al desactivar `showTonalities` desaparecen de los menús por voicing **Tonalidad** y **Calidad de tonalidad**; el control global sigue visible y los valores guardados reaparecen al reactivar la opción.
- Fondo #14183a con texto blanco y con un texto elegido por el usuario; comprobar también tarjeta oscura, cuerdas al aire y exportación. Gris #d1d5db como fondo neutro sin personalización, sin alterar tintas del mástil. JSON antiguo con fondo neutro #14183a explícito conserva ese valor.
- Ejecutar npm test y el empaquetado de Pages; registrar resultados reales, entorno y límites. No afirmar que una prueba ha pasado sin ejecutarla.

## Trabajo de Claude

Leer AGENTS.md y los documentos vigentes antes de editar. Partir del main actualizado en una rama nueva; conservar cambios locales ajenos. Usar Sonnet con esfuerzo medium como punto de partida, con una fase de implementación y otra de validación, evitando lecturas repetidas y consultas continuas de estado.

No arrancar desde el worktree antiguo del conector sin sincronizar: tiene cambios pendientes y una base anterior. No hacer reset --hard ni descartar archivos para resolver la sincronización.

Actualizar documentación de datos/uso, estado y changelog cuando la implementación esté validada. Revisar la estructura del JSON en los manuales. Entregar los cambios y la evidencia; no publicar ni fusionar automáticamente como consecuencia de leer este encargo.

## Sincronizar la copia local en Windows

En PowerShell, desde la copia principal:

```powershell
cd C:\temp\Compas-a-compas
git status --short
git switch main
git pull --ff-only origin main
```

Si hay cambios locales o Git no puede actualizar, conservarlos y resolver ese estado antes de comenzar; no forzar ni copiar encima. Estos comandos actualizan la copia principal, no los worktrees separados de Claude.

Para preparar el trabajo nuevo, desde main actualizado:

```powershell
git switch -c feature/repeticion-compas-y-nombres-vacios
```

Abrir Claude Code en esa carpeta y pedirle que implemente este documento. El conector y Cloudflare solo hacen falta si se va a controlar Claude desde ChatGPT; para usar Claude Code directamente no son necesarios.
