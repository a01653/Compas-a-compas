# Próxima mejora: textos y tonalidades por voicing

Fecha de solicitud: 17/10/2026. **Estado: implementada y comprobada en 0.5.0.** El usuario ha autorizado integrarla en main. Este documento conserva el encargo y sus decisiones de implementación.

Referencia visual: `EJEMPLO.html`, plantilla aportada por el usuario y revisada en navegador. Se han comprobado el rótulo «Intro · Joe Pass», los grados de la esquina superior derecha y las franjas de tonalidad sobre las tarjetas. La plantilla sirve como referencia de estas funciones; se mantienen las digitaciones de tamaño variable y la paginación adaptable de la aplicación.

## Cambios pedidos

| Elemento | Resultado solicitado |
| --- | --- |
| Cabecera de canción | Colocar la tonalidad inmediatamente a continuación del nombre de la canción. Nombre y tonalidad siguen teniendo campos de edición separados. Mantener la versión del documento. |
| Título sobre la tarjeta | Texto opcional dentro de un recuadro con borde, como «Intro · Joe Pass». Situarlo encima, alineado con el acorde o voicing al que pertenece. |
| Línea vertical del compás | Comienza junto al número de compás y llega hasta la parte inferior de las tarjetas. El título enmarcado queda por encima y fuera de esa línea, aunque pertenezca a una tarjeta intermedia. |
| Anotación dentro | Conservar su función y posición actuales, dentro de la tarjeta y debajo del nombre del acorde. |
| Grado del voicing | Nuevo campo opcional para texto como `ii`, `V7/ii` o `subV7/iii`, arriba a la derecha de la tarjeta, junto al nombre del acorde. Es distinto de los seis grados de las notas sobre las cuerdas. |
| Tonalidad del voicing | Nuevo campo opcional, asociado a cada voicing, para colocar una indicación sobre su posición, con franja de color como en la plantilla. Varios voicings de un mismo acorde pueden tener tonalidades diferentes. |
| Calidad de la tonalidad | Selector propio, similar al de calidad/familia del acorde. Determina el color de la tonalidad y es independiente de la calidad del acorde que se está tocando. |
| Visibilidad global | Una casilla permite mostrar u ocultar las tonalidades en toda la hoja/documento. Ocultar no borra textos, calidades ni colores guardados. |

## Alineación y espacio

En la plantilla, `.rehearsal` es un rótulo con borde situado antes de la franja `.tonal-row`. La línea izquierda pertenece a `.compas`; comienza debajo de esa franja. Dentro de la tarjeta, `.t-nom` y `.t-rn` comparten la fila superior y `.t-fam` ocupa la línea inferior.

Heredar esa relación visual, con una diferencia solicitada: el rótulo puede pertenecer a **cualquier tarjeta**, no solo al comienzo de una sección o fila. Su alineación debe seguir al voicing al reordenar, cambiar de fila o pasar de página. Reservar espacio para que títulos, franjas, números de compás, repeticiones, casillas, Coda y Segno no se superpongan. Los textos largos deben poder crecer sin recortes ni desplazarse a otra tarjeta.

## Herencia de tonalidad y color

- Escribir una tonalidad en un voicing establece el contexto desde esa posición.
- Dejar el campo vacío significa que no se imprime otra etiqueta de cambio y sigue vigente la tonalidad anterior, **con su mismo color**. La franja conserva ese contexto.
- La herencia recorre los voicings en su orden escrito: dentro del acorde, entre acordes y entre compases. No se reinicia por un salto de fila o de página.
- El siguiente valor explícito cambia el contexto desde su propia posición. Vaciarlo elimina ese cambio y vuelve a heredar del contexto anterior.
- La casilla global afecta a la presentación en vista previa, HTML e impresión; al volver a activarla se recupera la presentación con los valores guardados.
- No calcular tonalidades ni grados por análisis automático del nombre del acorde. No expandir las repeticiones para resolver la herencia.

Ejemplo de comportamiento:

| Voicing | Campo de tonalidad | Calidad | Presentación |
| --- | --- | --- | --- |
| A | Mi♭ mayor | Mayor | Etiqueta «Mi♭ mayor» e inicio de su color. |
| B | Vacío | Heredada | Sin nueva etiqueta; conserva Mi♭ mayor y su color. |
| C | Do menor | Menor | Etiqueta «Do menor» y cambio al color de menor. |
| D, en el compás siguiente | Vacío | Heredada | Sin nueva etiqueta; conserva Do menor y su color. |

## Calidad y paleta

El texto de tonalidad y su calidad deben poder seleccionarse por separado, igual que el nombre y la familia de un acorde. Reutilizar las familias disponibles cuando corresponda: Mayor, Menor, Dominante, Semidisminuido, Disminuido y Otro. La calidad elegida es un criterio de color; no implica validar teóricamente el texto introducido.

La selección pertenece a la tonalidad, no al acorde: un acorde dominante puede estar bajo una franja de tonalidad menor. Los colores deben respetar la configuración de la canción, conservarse al guardar y ser legibles también con fondos oscuros. No codificar un color por nombre concreto de tonalidad. La plantilla contiene también etiquetas de escalas, como «menor armónica» o «mixolidia»; conservar la posibilidad de escribirlas sin convertirlas automáticamente en nuevos tipos de acorde.

## Decisiones de implementación

Decisiones reversibles adoptadas al comenzar el desarrollo y comunicadas al usuario cuando afectan a la presentación:

1. La casilla **Mostrar tonalidades de las tarjetas** oculta las franjas en todas las páginas; conserva la tonalidad general junto al título. No elimina datos.
2. La tonalidad general inicia el contexto. Se añade una selección explícita de su calidad; si no se ha elegido, se usa el color neutro de Otro. No se infiere una calidad leyendo el texto. Sin tonalidad general ni un cambio local previo, no se dibuja franja.
3. No se repiten etiquetas heredadas al comenzar fila o página. El color continúa; solo se escribe una etiqueta al establecer un cambio explícito o al presentar por primera vez el contexto general.

## Criterios de entrega

- Mostrar título de canción seguido de tonalidad y conservar versión y numeración `valor/total`.
- Comprobar rótulos enmarcados tanto en la primera tarjeta como en tarjetas intermedias, con varios acordes/voicings por compás y continuaciones en otra fila o página.
- Editar por separado título exterior, anotación interior, grado del voicing y grados de cuerda. Los campos vacíos no deben dejar etiquetas ni recuadros impresos.
- Verificar el ejemplo de herencia anterior, borrar un cambio, reordenar/duplicar/borrar posiciones, cambios de fila/página y casilla global, sin perder el color vigente.
- Guardar y reabrir todos los datos nuevos en JSON, validar las entradas antes de reemplazar la canción y mantener compatibilidad con documentos anteriores. Definir y documentar la evolución del esquema; no asumir que el validador actual acepta campos nuevos.
- Incluir todas las ediciones y la casilla en Deshacer/Rehacer y recuperación de la canción.
- Mantener el editor compacto y los campos frecuentes accesibles. Usar el mismo renderizado en vista previa, HTML autónomo e impresión.
- Revisar casos sin datos nuevos para conservar el resto del contenido y la geometría de los mástiles. Las nuevas cabeceras pueden exigir más altura; no escalar cada página de forma diferente ni recortar tarjetas para compensarlo.
- Manual, DTS y capturas actualizados para 0.5.0. Ver la evidencia registrada en `docs/ESTADO.md`.

## Relación con los requisitos anteriores

Esta solicitud amplía R01, R07 y R08. Para la próxima implementación **sustituye la parte de R24 que excluía la franja de tonalidad/escala**. No solicita páginas de análisis armónico ni cálculo automático de funciones. Se conservan los demás requisitos, incluido el crecimiento automático del mástil a cuatro o más trastes cuando haga falta.
