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

`degrees`, si existe, contiene seis etiquetas en el mismo orden; null indica ausencia. `anchorFret`, si aparece, es un entero positivo que resalta esa columna del mástil como referencia; el rango visible se amplía para incluirla aunque ninguna nota caiga en ese traste. No almacenar coordenadas, colores calculados ni rango de trastes: se derivan de los datos. Las etiquetas manuales deben conservarse aunque el nombre del acorde no esté en un catálogo.

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

`palette` es una extensión opcional del esquema 1. Desde 0.7.0 admite además `degreeText` (mapa etiqueta → color de texto del grado, con la misma normalización ♭/b y ♯/# que `degrees`) y `noteText` (texto de las notas sin grado o sin color propio). Sin `degreeText`, el texto de un grado con fondo personalizado es blanco (`#ffffff`); un grado sin ninguna personalización conserva el de la plantilla (blanco, salvo los grados dorados: `#3d2f00` sobre `#EDBC07`). Sin `noteText`, el texto neutro es tinta oscura sobre el gris de serie `#d1d5db` y blanco si `note` lo fija el usuario (p. ej. el antiguo `#14183a`, que se respeta). Los lectores anteriores a 0.7.0 rechazan estos campos. `families` asigna colores a las seis claves de familia; `degrees` asigna colores a etiquetas de 1 a 32 caracteres; `note` cambia el color de las notas sin grado o sin color específico. Solo se admiten colores `#RRGGBB`. Se rechazan propiedades desconocidas y las etiquetas reservadas `__proto__`, `constructor` y `prototype`.

Los documentos previos siguen siendo válidos y no reciben el campo al abrirlos o guardarlos sin personalizar. Un documento que incluya `palette` requiere la aplicación 0.3.0 o posterior: los lectores antiguos lo rechazan por campo desconocido, conservando así la regla de no descartar datos. El estado de selección, las notas, IDs y referencias musicales son independientes de la paleta. Restaurar toda la paleta elimina el campo opcional.

## Edición e historial desde 0.4.0

El formulario muestra el texto efectivo de cada tarjeta; la representación de herencia en JSON no cambia. El modo de todas las posiciones sustituye el campo común y retira las excepciones de ese campo. Deshacer y Rehacer pertenecen a la sesión de edición: no añaden campos al contrato ni se escriben en el archivo.

## Tonalidad y grado por posición desde 0.5.0

Se amplía el esquema 1 con campos opcionales. Los JSON anteriores siguen siendo válidos sin añadirlos al abrir o guardar. Los archivos que los incluyen requieren la aplicación 0.5.0 o posterior; lectores antiguos rechazan esos campos, sin descartarlos.

| Entidad | Campo | Contrato |
| --- | --- | --- |
| Canción | `keyFamily` | Una de las seis familias; ausente equivale a `other` para el color del contexto inicial. |
| Canción | `showMeasureNumbers` | Booleano; ausente equivale a `true`. Solo `false` oculta las etiquetas de compás y las líneas verticales que separan los compases en la hoja (vista previa, HTML e impresión); no borra ni regenera las etiquetas, y conserva las líneas de las tarjetas, las barras y signos de repetición, Coda, Fine, casillas, saltos y la numeración de páginas. |
| Canción | `maxMeasuresPerRow` | Entero de 1 a 16; ausente = modo automático (reparto vigente). Es un tope, no una obligación de llenar la línea; la pareja de destino de una repetición de dos compases no se separa y puede ocupar una línea aunque el tope sea 1. |
| Canción | `fretboardScalePercent` | Entero de 60 a 100; escala uniforme de los diagramas de mástil. Ausente o 100 = tamaño normal. Cambia solo la presentación, no las digitaciones ni las notas. |
| Canción | `showTonalities` | Booleano; ausente equivale a visible. Oculta las franjas, conservando la tonalidad del título y los datos. |
| Posición | `voicingDegree` | Texto visible opcional, independiente de `degrees`; al vaciarlo se retira el campo. |
| Posición | `tonality` | Objeto con `text` visible y `family` válida. No admite otras propiedades. Vacío se representa retirando el objeto completo. |

La tonalidad general `key` inicia el contexto; no se deduce su calidad del texto. Cada `tonality` establece un cambio en su posición. La ausencia hereda el último contexto según el orden escrito, cruzando acordes y compases. Se deriva de nuevo después de mover, borrar o duplicar entidades. No se guarda un contexto efectivo por tarjeta, ni se resuelve un recorrido con repeticiones.

Las franjas heredan el color de la familia de tonalidad desde la paleta de canción. El nombre y la familia del acorde no afectan a ese contexto. `voicingDegree` y `tonality` pertenecen siempre a una posición; el alcance de edición conjunta de `aboveText` e `insideText` no se aplica a ellos. Deshacer/Rehacer conserva estos datos y la casilla global como cualquier otra edición.

## Edición por tarjetas desde 0.6.0

La interfaz presenta una lista plana de tarjetas por compás. El formato histórico conserva `chordEvents` y `voicings` para abrir y guardar archivos sin una conversión silenciosa. Un evento con varias posiciones aporta varias tarjetas; un evento sin posiciones aporta una tarjeta pendiente.

Los campos se editan de forma individual. Cambiar el nombre o la calidad de una tarjeta que compartía evento separa únicamente las partes necesarias, conservando el orden, los IDs de posición y los textos efectivos. El primer fragmento retiene el ID del evento y los nuevos fragmentos reciben IDs propios. Las referencias musicales siguen ligadas al compás. La separación y la edición se deshacen juntas.

Añadir o duplicar crea una tarjeta independiente. Duplicar materializa los textos efectivos para que el contenido no dependa del evento original; quitar borra solo la tarjeta elegida. Abrir, seleccionar o guardar sin editar no modifica el documento. No cambian `schemaVersion`, la validación ni las digitaciones manuales.


## Compás que repite el anterior (0.7.0)

`measures[].repeatPrevious` es un objeto opcional `{ "sourceMeasureId": "<id de compás>" }`. Representa el signo de repetición de un compás y es independiente de `chordName`, de los textos y de `structure.repeats`. Reglas:

- Un compás con `repeatPrevious` debe tener `chordEvents: []` (validación manual y JSON Schema, `if/then`). No se copian tarjetas ni voicings; el contenido se lee del origen.
- El origen debe ser el predecesor inmediato en el orden escrito. Si se borra o mueve el origen, la referencia se conserva y `checkStructure` emite un aviso (`kind: 'repeat'`): origen inexistente, a sí mismo, no inmediato o ciclo. Se abre con avisos; la acción «Corregir referencia» apunta al compás anterior.
- Duplicar un compás de repetición crea la copia justo después con `sourceMeasureId` igual al ID del original (su «compás anterior»).
- Los archivos sin el campo no se modifican al abrirlos ni guardarlos. `schemaVersion` sigue siendo 1; los lectores anteriores rechazan el campo por desconocido.
- `chordEvents[].chordName` admite cadena vacía: la hoja no dibuja nada en su lugar.

### Repetición de dos compases (0.7.0)

`measures[].repeatPreviousTwo` es un objeto opcional que se escribe **solo en el primer compás de destino**:

```json
{ "id": "m3", "label": "3", "chordEvents": [],
  "repeatPreviousTwo": { "sourceMeasureIds": ["m1", "m2"], "targetMeasureIds": ["m3", "m4"] } }
```

- `sourceMeasureIds` (los dos compases repetidos, en orden) y `targetMeasureIds` (la pareja de destino) tienen exactamente dos IDs distintos cada uno; `targetMeasureIds[0]` es el propio compás.
- Ambos destinos tienen `chordEvents` vacíos (el esquema lo exige para el que lleva la marca; el segundo se comprueba como aviso) y no llevan `repeatPrevious`. `repeatPrevious` y `repeatPreviousTwo` no pueden coexistir en un mismo compás (error de forma).
- Las fuentes deben ser los dos compases inmediatamente anteriores al primer destino, y los destinos, consecutivos. Si se borra o mueve cualquiera de los cuatro, los IDs se conservan y `checkStructure` emite avisos de tipo `repeat` (inexistente, repetido o ciclo, no consecutivos, fuentes no inmediatas, solapamiento, contenido propio en el segundo destino). El archivo se abre y la acción «Corregir referencia» recoloca las fuentes de forma expresa.
- Una pareja que no cumple las condiciones de dibujo (destinos no consecutivos o con contenido) no se dibuja como pareja: aparece como compás vacío junto al aviso.
- Duplicar un destino no copia la marca: la copia es un compás vacío. Los IDs de fuentes y destinos cuentan como usados al crear IDs nuevos.
- La marca no expande el recorrido ni añade reproducción: la pareja cuenta como dos compases escritos.

Compatibilidad: `schemaVersion` sigue siendo 1. Los lectores anteriores a 0.7.0 rechazan `repeatPrevious`, `repeatPreviousTwo`, `widthPercent`, `fillToEdge`, `showMeasureNumbers`, `maxMeasuresPerRow`, `palette.degreeText`, `palette.noteText` y `chordName` vacío; los archivos que no los usan se abren y guardan sin cambios. Las versiones anteriores a la incorporación de `fretboardScalePercent` rechazan ese campo.

### Ancho de compás y ajuste de línea (0.7.0)

Dos campos opcionales de `measures[]`, solo de presentación y siempre relativos (nunca píxeles ni valores medidos):

| Campo | Tipo | Significado |
|-------|------|-------------|
| `widthPercent` | entero 10–100 | Ancho del compás como porcentaje del ancho útil de la línea. Ausente = ancho automático (reparto vigente, con el límite de expansión del 25 % por tarjeta). Afecta a toda la columna del compás. Nunca baja del ancho que necesita su contenido: si el porcentaje no basta, se usa el ancho mínimo, se avisa en la vista previa y la paginación coloca menos compases en la línea (siempre respetando `maxMeasuresPerRow`). Solo se aplica al compás entero, no a sus fragmentos de continuación. |
| `fillToEdge` | booleano | `true` ajusta la línea del compás al margen derecho. Se guarda solo `true`; automático = campo ausente. Una línea se ajusta si cualquiera de sus compases lo lleva. El botón de la línea marca el primer compás y, al volver a automático, quita la marca de todos los de la línea. Si varias filas ajustadas de una misma página tienen la misma estructura, sus tarjetas comparten anchos de columna para alinear sus bordes verticales; ninguna columna se comprime por debajo de su contenido. |

Si la composición de la línea cambia (otro máximo por línea, otro ancho, edición), la marca sigue en su compás y el reparto se recalcula con los compases que realmente caben. Los archivos sin estos campos no cambian al abrirse ni guardarse; las versiones anteriores a 0.7.0 rechazan los campos nuevos.

## Colores predeterminados: `config/palette-defaults.json` (0.7.0)

Los colores que se usan cuando una canción **no** define los suyos están en un único fichero, `config/palette-defaults.json`, y no se repiten en el código. Es configuración de la aplicación, no parte del formato de canción: no se copia al JSON de la canción.

| Clave | Contenido |
|-------|-----------|
| `version` | Debe ser `1`. |
| `ink` | Tinta oscura general (líneas, textos, barras) y base del cálculo de contraste de las calidades. |
| `muted` | Tinta atenuada de las etiquetas del mástil (números de traste y de cuerda de la tarjeta) cuando la tarjeta no fuerza otro color. |
| `text` | `default` (texto predeterminado de un grado con fondo propio), `light` y `fallback` (resultados del contraste automático de las calidades). |
| `families` | Para cada calidad (`major`, `minor`, `dominant`, `half-diminished`, `diminished`, `other`): `bg` (fondo de tarjeta), `bd` (borde) y `accent` (franja de tonalidad). |
| `degrees` | Etiqueta de grado → `{ bg, fg }` (fondo y texto de plantilla): 1, b3, 3, 5, b5, b7, 7, 13, b13, 9, b9, 11, #9 y #11. |
| `naturalDegrees` | Para los números 1 a 13, el grado de `degrees` cuyo color usan los grados naturales y alterados no listados (p. ej. `6` → `13`). |
| `note` | `bg` (fondo neutro de las notas sin grado o sin color propio), `text` (texto sobre ese fondo de serie) y `textOnCustomBg` (texto cuando el usuario fija el fondo neutro). |

Reglas:

- **Carga y validación**: la aplicación lo carga y valida al iniciarse. Todo valor es `#RRGGBB`; deben estar todas las calidades, `naturalDegrees` completo y apuntando a grados definidos, y no se admiten claves desconocidas. Si el fichero falta, no es JSON o tiene valores incorrectos, la aplicación no arranca y muestra el motivo (por ejemplo «no se encuentra el archivo (HTTP 404)» o «ink debe ser un color #RRGGBB»), sin dibujar con colores inventados.
- **Prioridad**: `palette` de la canción (`families`, `degrees`, `degreeText`, `note`, `noteText`) siempre manda sobre el fichero, campo a campo. Abrir y guardar una canción no copia valores del fichero a su `palette` ni modifica los que tiene. Los documentos nuevos nacen sin `palette` y usan el fichero; «Restaurar paleta original» quita la `palette` de la canción y vuelve a él.
- **Cambiarlo**: editar el fichero cambia los colores de todas las canciones que no los personalicen. Para empaquetar la aplicación (`scripts/build-pages.mjs`) se copia la carpeta `config/`.
- **Fuera del fichero**: los colores generales de la interfaz (barras, paneles, botones, `styles/tokens.css`) no son parte de la paleta de la canción y no se configuran aquí.
- Las pruebas instalan el fichero real antes de ejecutarse (`tests/setup.mjs`) y comprueban que sus valores se aplican, que la paleta de un JSON se conserva y que no quedan duplicados en `src/`.
