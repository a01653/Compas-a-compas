# Contrato de datos propuesto, versión 1

`schemas/song.schema.json` define la forma del JSON. Se trata de una propuesta técnica inicial para cumplir los requisitos, no de un formato histórico que haya que soportar.

## Jerarquía

`Song → measures[] → chordEvents[] → voicings[]`.

- Un compás tiene `id` estable y `label` visible. Editar o mover el compás no cambia su ID.
- Un evento es una aparición escrita de un acorde, con nombre y textos propios.
- Un evento puede contener varios voicings del mismo acorde. Otro acorde dentro del compás es otro evento, aunque comparta nombre con uno anterior.
- `aboveText` y `insideText` del evento actúan como valores de sus tarjetas. Un voicing puede sobrescribirlos; ausencia significa heredar y cadena vacía significa ocultar ese texto en esa tarjeta.
- Un acorde sin digitación puede guardarse como evento con lista vacía de voicings. La interfaz lo muestra como pendiente; no debe desaparecer en una exportación ni recibir notas inventadas.

## Digitación

`frets` es un array de seis valores en orden sexta→primera: entero ≥ 0 o `null` para muda. El 0 es cuerda al aire. La entrada textual x/X se convierte a null, nunca a 0.

Formato compacto válido para seis caracteres: `x35343`. Para dos cifras: `x 10 12 10 11 10`. No interpretar un bloque ambiguo de más de seis caracteres como trastes de dos cifras; solicitar separadores. Validar entrada antes de modificar el voicing anterior.

`degrees`, si existe, contiene seis etiquetas en el mismo orden; null indica ausencia. No almacenar coordenadas, colores calculados ni rango de trastes: se derivan de los datos. Las etiquetas manuales deben conservarse aunque el nombre del acorde no esté en un catálogo.

`family` selecciona una paleta: `major`, `minor`, `dominant`, `half-diminished`, `diminished` u `other`. Es una elección editable, no una promesa de análisis musical automático. Sin selección, usar `other`.

## Marcas de navegación

`structure` reúne objetos con IDs estables:

| Colección | Campos |
| --- | --- |
| `repeats` | `id`, `startMeasureId`, `endMeasureId`, `times` (pasadas totales, mínimo 2) |
| `endings` | `id`, `startMeasureId`, `endMeasureId`, `passes` (lista de pasadas), `repeatId` opcional |
| `markers` | `id`, `type` (`segno`, `coda`, `fine`), `measureId`, `edge` (`before` o `after`) |
| `jumps` | `id`, `type`, `measureId`, `edge`, destinos por ID cuando correspondan |

Tipos de salto: `dc`, `ds`, `dc-al-coda`, `ds-al-coda`, `dc-al-fine`, `ds-al-fine`, `to-coda`.

`segnoMarkerId` identifica el destino de D.S.; `codaMarkerId`, el destino Coda; `fineMarkerId`, el Fine. D.C. vuelve al inicio escrito y no necesita un ID de compás de destino. Puede haber varios símbolos de un tipo, por eso la asociación se guarda mediante ID.

El esquema controla forma y tipos. La validación semántica adicional debe comprobar:

- IDs únicos en todo el documento y referencias a objetos existentes del tipo correcto.
- Inicio de tramo no posterior a su final según el orden actual de `measures`.
- Pasadas de casilla únicas, positivas y compatibles con su repetición cuando exista `repeatId`.
- D.S. necesita Segno; saltos al Coda y To Coda necesitan Coda; saltos al Fine necesitan Fine. Un D.S. al Coda necesita ambos destinos.
- No deducir estructura de una cadena de texto libre. Los símbolos estructurados y sus destinos se conservan en JSON.

Editar una canción puede dejar una marca incompleta de forma temporal. Mostrar el problema sin perder la marca. Al importar, la estructura JSON inválida bloquea la apertura; las referencias musicales incompletas pueden abrirse con avisos visibles para permitir corregirlas. La exportación advierte de destinos pendientes y no afirma que el recorrido esté validado.

Al borrar un compás con marcas o destinos, presentar las consecuencias antes de aplicar y permitir cancelar. No redirigir saltos silenciosamente. No implementar un intérprete de reproducción en esta versión.

## Archivo y evolución

`schemaVersion` es 1; `documentVersion` es texto editable independiente de la versión de aplicación. Guardar UTF-8 con extensión `.json`. Una carga seguida de guardado conserva valores, IDs y orden; se permite variar espacios y orden de claves. Un esquema futuro exige migración explícita y casos de prueba. No descartar datos desconocidos fingiendo compatibilidad.

## Entrada por lista propuesta

Primera versión: una línea por compás. Formato documentado: `etiqueta | acorde @ digitación ; acorde @ digitación`. Otro voicing del mismo evento se separa con ` / ` dentro de la parte de digitación. Ejemplo:

```text
1 | Cm7 @ x 3 5 3 4 3 / 8 10 8 8 8 8
2 | F7 @ 1 3 1 2 1 1 ; Bbmaj7 @ x 1 3 2 3 1
3 |
```

La barra de un nombre como `C/E` no es un separador de voicings: solo se analiza ` / ` en la digitación, después de `@`. Rechazar una línea inválida con número y motivo; no importar una mitad sin avisar. Previsualizar el lote antes de añadirlo a la canción. Los campos libres y marcas se completan desde el editor. Este formato puede simplificarse si se conserva la capacidad de introducir listas sin ambigüedad.

## Paleta opcional desde 0.3.0

`palette` es una extensión opcional del esquema 1. `families` asigna colores a las seis claves de familia; `degrees` asigna colores a etiquetas de 1 a 32 caracteres; `note` cambia el color de las notas sin grado o sin color específico. Solo se admiten colores `#RRGGBB`. Se rechazan propiedades desconocidas y las etiquetas reservadas `__proto__`, `constructor` y `prototype`.

Los documentos previos siguen siendo válidos y no reciben el campo al abrirlos o guardarlos sin personalizar. Un documento que incluya `palette` requiere la aplicación 0.3.0 o posterior: los lectores antiguos lo rechazan por campo desconocido, conservando así la regla de no descartar datos. El estado de selección, las notas, IDs y referencias musicales son independientes de la paleta. Restaurar toda la paleta elimina el campo opcional.

## Edición e historial desde 0.4.0

El formulario muestra el texto efectivo de cada tarjeta; la representación de herencia en JSON no cambia. El modo de todas las posiciones sustituye el campo común y retira las excepciones de ese campo. Deshacer y Rehacer pertenecen a la sesión de edición: no añaden campos al contrato ni se escriben en el archivo.

## Tonalidad y grado por posición desde 0.5.0

Se amplía el esquema 1 con campos opcionales. Los JSON anteriores siguen siendo válidos sin añadirlos al abrir o guardar. Los archivos que los incluyen requieren la aplicación 0.5.0 o posterior; lectores antiguos rechazan esos campos, sin descartarlos.

| Entidad | Campo | Contrato |
| --- | --- | --- |
| Canción | `keyFamily` | Una de las seis familias; ausente equivale a `other` para el color del contexto inicial. |
| Canción | `showTonalities` | Booleano; ausente equivale a visible. Oculta las franjas, conservando la tonalidad del título y los datos. |
| Posición | `voicingDegree` | Texto visible opcional, independiente de `degrees`; al vaciarlo se retira el campo. |
| Posición | `tonality` | Objeto con `text` visible y `family` válida. No admite otras propiedades. Vacío se representa retirando el objeto completo. |

La tonalidad general `key` inicia el contexto; no se deduce su calidad del texto. Cada `tonality` establece un cambio en su posición. La ausencia hereda el último contexto según el orden escrito, cruzando acordes y compases. Se deriva de nuevo después de mover, borrar o duplicar entidades. No se guarda un contexto efectivo por tarjeta, ni se resuelve un recorrido con repeticiones.

Las franjas heredan el color de la familia de tonalidad desde la paleta de canción. El nombre y la familia del acorde no afectan a ese contexto. `voicingDegree` y `tonality` pertenecen siempre a una posición; el alcance de edición conjunta de `aboveText` e `insideText` no se aplica a ellos. Deshacer/Rehacer conserva estos datos y la casilla global como cualquier otra edición.
