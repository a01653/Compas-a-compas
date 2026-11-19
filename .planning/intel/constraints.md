# Restricciones (SPEC)

Fuentes SPEC: `docs/DISENO.md` (precedencia 3), `docs/DATOS.md` (precedencia 4), `docs/diseno/textos-y-tonalidades.md` (precedencia 5). Todo lo descrito aquí está implementado y validado salvo indicación expresa de la fuente (contexto de la ingesta: aplicación existente, versión 0.10.1). El contenido se cita de las fuentes; cuando se abrevia, se indica "extracto".

---

# A. docs/DATOS.md (contrato de datos, precedencia 4)

## DATOS: Jerarquía de la canción
- source: docs/DATOS.md
- type: schema
- content:
`schemas/song.schema.json` define la forma del JSON. Se trata de una propuesta técnica inicial para cumplir los requisitos, no de un formato histórico que haya que soportar.

`Song → measures[] → chordEvents[] → voicings[]`.
- Un compás tiene `id` estable y `label` visible. Editar o mover el compás no cambia su ID.
- Un evento es una aparición escrita de un acorde, con nombre y textos propios.
- Un evento puede contener varios voicings del mismo acorde. Otro acorde dentro del compás es otro evento, aunque comparta nombre con uno anterior.
- `aboveText` y `insideText` del evento actúan como valores de sus tarjetas. Un voicing puede sobrescribirlos; ausencia significa heredar y cadena vacía significa ocultar ese texto en esa tarjeta.
- Un acorde sin digitación puede guardarse como evento con lista vacía de voicings. La interfaz lo muestra como pendiente; no debe desaparecer en una exportación ni recibir notas inventadas.

## DATOS: Digitación
- source: docs/DATOS.md
- type: schema
- content:
`frets` es un array de seis valores en orden sexta→primera: entero ≥ 0 o `null` para muda. El 0 es cuerda al aire. La entrada textual x/X se convierte a null, nunca a 0.

Formato compacto válido para seis caracteres: `x35343`. Para dos cifras: `x 10 12 10 11 10`, o una letra por traste de 10 a 24 (`a` = 10 … `o` = 24, sin distinguir mayúsculas; `x` sigue siendo muda), de modo que `xa9axa` equivale a `x 10 9 10 x 10`. Las letras también valen entre separadores. El JSON guarda siempre números. No interpretar un bloque ambiguo de más de seis caracteres como trastes de dos cifras; solicitar separadores. Validar entrada antes de modificar el voicing anterior.

## DATOS: Grados, anchorFret y familia
- source: docs/DATOS.md
- type: schema
- content:
`degrees`, si existe, contiene seis etiquetas en el mismo orden; null indica ausencia. `anchorFret`, si aparece, es un entero positivo que resalta esa columna del mástil como referencia; el rango visible se amplía para incluirla aunque ninguna nota caiga en ese traste. No almacenar coordenadas, colores calculados ni rango de trastes: se derivan de los datos. Las etiquetas manuales deben conservarse aunque el nombre del acorde no esté en un catálogo.

`family` selecciona una paleta: `major`, `minor`, `dominant`, `half-diminished`, `diminished` u `other`. Es una elección editable, no una promesa de análisis musical automático. Sin selección, usar `other`.

## DATOS: Marcas de navegación (structure)
- source: docs/DATOS.md
- type: schema
- content:
`structure` reúne objetos con IDs estables:
- `repeats`: `id`, `startMeasureId`, `endMeasureId`, `times` (pasadas totales, mínimo 2)
- `endings`: `id`, `startMeasureId`, `endMeasureId`, `passes` (lista de pasadas), `repeatId` opcional
- `markers`: `id`, `type` (`segno`, `coda`, `fine`), `measureId`, `edge` (`before` o `after`)
- `jumps`: `id`, `type`, `measureId`, `edge`, destinos por ID cuando correspondan

Tipos de salto: `dc`, `ds`, `dc-al-coda`, `ds-al-coda`, `dc-al-fine`, `ds-al-fine`, `to-coda`.

`segnoMarkerId` identifica el destino de D.S.; `codaMarkerId`, el destino Coda; `fineMarkerId`, el Fine. D.C. vuelve al inicio escrito y no necesita un ID de compás de destino. Puede haber varios símbolos de un tipo, por eso la asociación se guarda mediante ID.

## DATOS: Validación semántica de la estructura
- source: docs/DATOS.md
- type: schema
- content:
El esquema controla forma y tipos. La validación semántica adicional debe comprobar:
- IDs únicos en todo el documento y referencias a objetos existentes del tipo correcto.
- Inicio de tramo no posterior a su final según el orden actual de `measures`.
- Pasadas de casilla únicas, positivas y compatibles con su repetición cuando exista `repeatId`.
- D.S. necesita Segno; saltos al Coda y To Coda necesitan Coda; saltos al Fine necesitan Fine. Un D.S. al Coda necesita ambos destinos.
- No deducir estructura de una cadena de texto libre. Los símbolos estructurados y sus destinos se conservan en JSON.

## DATOS: Marcas incompletas, importación y borrado de compases
- source: docs/DATOS.md
- type: protocol
- content:
Editar una canción puede dejar una marca incompleta de forma temporal. Mostrar el problema sin perder la marca. Al importar, la estructura JSON inválida bloquea la apertura; las referencias musicales incompletas pueden abrirse con avisos visibles para permitir corregirlas. La exportación advierte de destinos pendientes y no afirma que el recorrido esté validado.

Al borrar un compás con marcas o destinos, presentar las consecuencias antes de aplicar y permitir cancelar. No redirigir saltos silenciosamente. No implementar un intérprete de reproducción en esta versión.

## DATOS: Archivo y evolución
- source: docs/DATOS.md
- type: schema
- content:
`schemaVersion` es 1; `documentVersion` es texto editable independiente de la versión de aplicación. Guardar UTF-8 con extensión `.json`. Una carga seguida de guardado conserva valores, IDs y orden; se permite variar espacios y orden de claves. Un esquema futuro exige migración explícita y casos de prueba. No descartar datos desconocidos fingiendo compatibilidad.

## DATOS: Entrada por lista
- source: docs/DATOS.md
- type: protocol
- content:
Primera versión: una línea por compás. Formato documentado: `etiqueta | acorde @ digitación ; acorde @ digitación`. Otro voicing del mismo evento se separa con ` / ` dentro de la parte de digitación. Ejemplo:

```text
1 | Cm7 @ x 3 5 3 4 3 / 8 10 8 8 8 8
2 | F7 @ 1 3 1 2 1 1 ; Bbmaj7 @ x 1 3 2 3 1
3 |
```

La barra de un nombre como `C/E` no es un separador de voicings: solo se analiza ` / ` en la digitación, después de `@`. Rechazar una línea inválida con número y motivo; no importar una mitad sin avisar. Previsualizar el lote antes de añadirlo a la canción. Los campos libres y marcas se completan desde el editor. Este formato puede simplificarse si se conserva la capacidad de introducir listas sin ambigüedad.

## DATOS: Paleta opcional (0.3.0, ampliada en 0.7.0)
- source: docs/DATOS.md
- type: schema
- content:
`palette` es una extensión opcional del esquema 1. Desde 0.7.0 admite además `degreeText` (mapa etiqueta → color de texto del grado, con la misma normalización ♭/b y ♯/# que `degrees`) y `noteText` (texto de las notas sin grado o sin color propio). Sin `degreeText`, el texto de un grado con fondo personalizado es blanco (`#ffffff`); un grado sin ninguna personalización conserva el de la plantilla (blanco, salvo los grados dorados: `#3d2f00` sobre `#EDBC07`). Sin `noteText`, el texto neutro es tinta oscura sobre el gris de serie `#d1d5db` y blanco si `note` lo fija el usuario (p. ej. el antiguo `#14183a`, que se respeta). Los lectores anteriores a 0.7.0 rechazan estos campos. `families` asigna colores a las seis claves de familia; `degrees` asigna colores a etiquetas de 1 a 32 caracteres; `note` cambia el color de las notas sin grado o sin color específico. Solo se admiten colores `#RRGGBB`. Se rechazan propiedades desconocidas y las etiquetas reservadas `__proto__`, `constructor` y `prototype`.

Los documentos previos siguen siendo válidos y no reciben el campo al abrirlos o guardarlos sin personalizar. Un documento que incluya `palette` requiere la aplicación 0.3.0 o posterior: los lectores antiguos lo rechazan por campo desconocido, conservando así la regla de no descartar datos. El estado de selección, las notas, IDs y referencias musicales son independientes de la paleta. Restaurar toda la paleta elimina el campo opcional.

## DATOS: Edición e historial (0.4.0)
- source: docs/DATOS.md
- type: nfr
- content:
El formulario muestra el texto efectivo de cada tarjeta; la representación de herencia en JSON no cambia. El modo de todas las posiciones sustituye el campo común y retira las excepciones de ese campo. Deshacer y Rehacer pertenecen a la sesión de edición: no añaden campos al contrato ni se escriben en el archivo.

(Nota de procedencia: la parte sobre el "modo de todas las posiciones" quedó retirada por 0.6.0; ver INGEST-CONFLICTS.md, INFO.)

## DATOS: Campos de tonalidad, grado y presentación (0.5.0)
- source: docs/DATOS.md
- type: schema
- content:
Se amplía el esquema 1 con campos opcionales. Los JSON anteriores siguen siendo válidos sin añadirlos al abrir o guardar. Los archivos que los incluyen requieren la aplicación 0.5.0 o posterior; lectores antiguos rechazan esos campos, sin descartarlos.
- Canción `keyFamily`: una de las seis familias; ausente equivale a `other` para el color del contexto inicial.
- Canción `showMeasureNumbers`: booleano; ausente equivale a `true`. Solo `false` oculta las etiquetas de compás y las líneas verticales que separan los compases en la hoja (vista previa, HTML e impresión); no borra ni regenera las etiquetas, y conserva las líneas de las tarjetas, las barras y signos de repetición, Coda, Fine, casillas, saltos y la numeración de páginas.
- Canción `maxMeasuresPerRow`: entero de 1 a 16; ausente = modo automático (reparto vigente). Es un tope, no una obligación de llenar la línea; la pareja de destino de una repetición de dos compases no se separa y puede ocupar una línea aunque el tope sea 1.
- Canción `fretboardScalePercent`: entero de 60 a 100; escala uniforme de los diagramas de mástil. Ausente o 100 = tamaño normal. Cambia solo la presentación, no las digitaciones ni las notas.
- Canción `showTonalities`: booleano; ausente equivale a visible. Oculta las franjas, conservando la tonalidad del título y los datos.
- Posición `voicingDegree`: texto visible opcional, independiente de `degrees`; al vaciarlo se retira el campo.
- Posición `tonality`: objeto con `text` visible y `family` válida. No admite otras propiedades. Vacío se representa retirando el objeto completo.

(Nota de procedencia: la atribución de versión de `showMeasureNumbers`, `maxMeasuresPerRow` y `fretboardScalePercent` es inconsistente dentro de DATOS.md; ver INGEST-CONFLICTS.md, INFO.)

## DATOS: Herencia de tonalidad y color (0.5.0)
- source: docs/DATOS.md
- type: schema
- content:
La tonalidad general `key` inicia el contexto; no se deduce su calidad del texto. Cada `tonality` establece un cambio en su posición. La ausencia hereda el último contexto según el orden escrito, cruzando acordes y compases. Se deriva de nuevo después de mover, borrar o duplicar entidades. No se guarda un contexto efectivo por tarjeta, ni se resuelve un recorrido con repeticiones.

Las franjas heredan el color de la familia de tonalidad desde la paleta de canción. El nombre y la familia del acorde no afectan a ese contexto. `voicingDegree` y `tonality` pertenecen siempre a una posición; el alcance de edición conjunta de `aboveText` e `insideText` no se aplica a ellos. Deshacer/Rehacer conserva estos datos y la casilla global como cualquier otra edición.

## DATOS: Edición por tarjetas (0.6.0)
- source: docs/DATOS.md
- type: schema
- content:
La interfaz presenta una lista plana de tarjetas por compás. El formato histórico conserva `chordEvents` y `voicings` para abrir y guardar archivos sin una conversión silenciosa. Un evento con varias posiciones aporta varias tarjetas; un evento sin posiciones aporta una tarjeta pendiente.

Los campos se editan de forma individual. Cambiar el nombre o la calidad de una tarjeta que compartía evento separa únicamente las partes necesarias, conservando el orden, los IDs de posición y los textos efectivos. El primer fragmento retiene el ID del evento y los nuevos fragmentos reciben IDs propios. Las referencias musicales siguen ligadas al compás. La separación y la edición se deshacen juntas.

Añadir o duplicar crea una tarjeta independiente. Duplicar materializa los textos efectivos para que el contenido no dependa del evento original; quitar borra solo la tarjeta elegida. Abrir, seleccionar o guardar sin editar no modifica el documento. No cambian `schemaVersion`, la validación ni las digitaciones manuales.

## DATOS: Compás que repite el anterior (repeatPrevious, 0.7.0)
- source: docs/DATOS.md
- type: schema
- content:
`measures[].repeatPrevious` es un objeto opcional `{ "sourceMeasureId": "<id de compás>" }`. Representa el signo de repetición de un compás y es independiente de `chordName`, de los textos y de `structure.repeats`. Reglas:
- Un compás con `repeatPrevious` debe tener `chordEvents: []` (validación manual y JSON Schema, `if/then`). No se copian tarjetas ni voicings; el contenido se lee del origen.
- El origen debe ser el predecesor inmediato en el orden escrito. Si se borra o mueve el origen, la referencia se conserva y `checkStructure` emite un aviso (`kind: 'repeat'`): origen inexistente, a sí mismo, no inmediato o ciclo. Se abre con avisos; la acción «Corregir referencia» apunta al compás anterior.
- Duplicar un compás de repetición crea la copia justo después con `sourceMeasureId` igual al ID del original (su «compás anterior»).
- Los archivos sin el campo no se modifican al abrirlos ni guardarlos. `schemaVersion` sigue siendo 1; los lectores anteriores rechazan el campo por desconocido.
- `chordEvents[].chordName` admite cadena vacía: la hoja no dibuja nada en su lugar.

## DATOS: Repetición de dos compases (repeatPreviousTwo, 0.7.0)
- source: docs/DATOS.md
- type: schema
- content:
`measures[].repeatPreviousTwo` es un objeto opcional que se escribe solo en el primer compás de destino:

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

## DATOS: Compatibilidad de 0.7.0
- source: docs/DATOS.md
- type: protocol
- content:
`schemaVersion` sigue siendo 1. Los lectores anteriores a 0.7.0 rechazan `repeatPrevious`, `repeatPreviousTwo`, `widthPercent`, `fillToEdge`, `showMeasureNumbers`, `maxMeasuresPerRow`, `palette.degreeText`, `palette.noteText` y `chordName` vacío; los archivos que no los usan se abren y guardan sin cambios. Las versiones anteriores a la incorporación de `fretboardScalePercent` rechazan ese campo.

## DATOS: Ancho de compás y ajuste de línea (0.7.0)
- source: docs/DATOS.md
- type: schema
- content:
Dos campos opcionales de `measures[]`, solo de presentación y siempre relativos (nunca píxeles ni valores medidos):
- `widthPercent` (entero 10–100): ancho del compás como porcentaje del ancho útil de la línea. Ausente = ancho automático (reparto vigente, con el límite de expansión del 25 % por tarjeta). Afecta a toda la columna del compás. Nunca baja del ancho que necesita su contenido: si el porcentaje no basta, se usa el ancho mínimo, se avisa en la vista previa y la paginación coloca menos compases en la línea (siempre respetando `maxMeasuresPerRow`). Solo se aplica al compás entero, no a sus fragmentos de continuación.
- `fillToEdge` (booleano): `true` ajusta la línea del compás al margen derecho. Se guarda solo `true`; automático = campo ausente. Una línea se ajusta si cualquiera de sus compases lo lleva. El botón de la línea marca el primer compás y, al volver a automático, quita la marca de todos los de la línea. Si varias filas ajustadas de una misma página tienen la misma estructura, sus tarjetas comparten anchos de columna para alinear sus bordes verticales; ninguna columna se comprime por debajo de su contenido.

Si la composición de la línea cambia (otro máximo por línea, otro ancho, edición), la marca sigue en su compás y el reparto se recalcula con los compases que realmente caben. Los archivos sin estos campos no cambian al abrirse ni guardarse; las versiones anteriores a 0.7.0 rechazan los campos nuevos.

## DATOS: Saltos de línea forzados (0.9.0 y 0.10.0)
- source: docs/DATOS.md
- type: schema
- content:
- `breakBefore` (booleano, 0.9.0): `true` hace que el compás empiece una línea nueva aunque quepa en la anterior. Se guarda solo `true`; automático = campo ausente. No tiene efecto en el primer compás de una hoja ni en el segundo destino de una repetición de dos compases, que va siempre junto al primero. Si la línea nueva no cabe, el reparto sigue sus reglas habituales (partir entre tarjetas, otra hoja). Las copias, pegados y duplicados no lo heredan; sustituir no lo cambia.
- `breakAfter` (booleano, 0.10.0): `true` hace que el compás termine su línea y el siguiente empiece otra aunque quepa. Mismas reglas que `breakBefore`: solo `true`, sin efecto en el último compás ni en el primer destino de una repetición de dos compases, no lo heredan las copias y sustituir no lo cambia. Un salto después de un compás y otro antes del siguiente dan una sola línea nueva.

Compatibilidad: `schemaVersion` sigue siendo 1. Los archivos sin estos campos no cambian al abrirse ni guardarse; las versiones anteriores a 0.9.0 rechazan `breakBefore`, y las anteriores a 0.10.0 rechazan `breakAfter`, por desconocidos. Las filas compactas (0.10.0) no se guardan: el reparto las decide en cada paginación a partir de las medidas.

## DATOS: Colores predeterminados, config/palette-defaults.json (0.7.0)
- source: docs/DATOS.md
- type: schema
- content:
Los colores que se usan cuando una canción no define los suyos están en un único fichero, `config/palette-defaults.json`, y no se repiten en el código. Es configuración de la aplicación, no parte del formato de canción: no se copia al JSON de la canción.

Claves: `version` (debe ser `1`); `ink` (tinta oscura general y base del cálculo de contraste de las calidades); `muted` (tinta atenuada de las etiquetas del mástil); `text` (`default`, `light` y `fallback`); `families` (para cada calidad: `bg`, `bd` y `accent`); `degrees` (etiqueta de grado → `{ bg, fg }`: 1, b3, 3, 5, b5, b7, 7, 13, b13, 9, b9, 11, #9 y #11); `naturalDegrees` (para los números 1 a 13, el grado de `degrees` cuyo color usan los grados naturales y alterados no listados, p. ej. `6` → `13`); `note` (`bg`, `text` y `textOnCustomBg`).

Reglas:
- Carga y validación: la aplicación lo carga y valida al iniciarse. Todo valor es `#RRGGBB`; deben estar todas las calidades, `naturalDegrees` completo y apuntando a grados definidos, y no se admiten claves desconocidas. Si el fichero falta, no es JSON o tiene valores incorrectos, la aplicación no arranca y muestra el motivo (por ejemplo «no se encuentra el archivo (HTTP 404)» o «ink debe ser un color #RRGGBB»), sin dibujar con colores inventados.
- Prioridad: `palette` de la canción (`families`, `degrees`, `degreeText`, `note`, `noteText`) siempre manda sobre el fichero, campo a campo. Abrir y guardar una canción no copia valores del fichero a su `palette` ni modifica los que tiene. Los documentos nuevos nacen sin `palette` y usan el fichero; «Restaurar paleta original» quita la `palette` de la canción y vuelve a él.
- Cambiarlo: editar el fichero cambia los colores de todas las canciones que no los personalicen. Para empaquetar la aplicación (`scripts/build-pages.mjs`) se copia la carpeta `config/`.
- Fuera del fichero: los colores generales de la interfaz (barras, paneles, botones, `styles/tokens.css`) no son parte de la paleta de la canción y no se configuran aquí.
- Las pruebas instalan el fichero real antes de ejecutarse (`tests/setup.mjs`) y comprueban que sus valores se aplican, que la paleta de un JSON se conserva y que no quedan duplicados en `src/`.

## DATOS: Edición estructural de compases (0.8.0)
- source: docs/DATOS.md
- type: protocol
- content:
Las operaciones de `src/model/measureOps.js` mutan la canción y no añaden datos de sesión al JSON: la selección múltiple, el modo selección y el portapapeles no se guardan. El único campo nuevo es opcional: canción `renumberMeasures`, booleano; ausente equivale a `true`. Solo se guarda `false`, que conserva las etiquetas originales al editar la estructura.

Reglas de identidad y referencias:
- Mover e intercambiar reordenan `measures` sin cambiar ningún ID. Las marcas de `structure` siguen a su compás; un tramo invertido o una repetición cuyo origen deja de ser inmediato se avisan (`newInversions`, `newRepeatWarnings`) y no se corrigen solos. «Corregir referencias» (`fixRepeatReferences`) es una acción expresa; en una pareja solo se aplica si con ello desaparece su aviso.
- Unidades: los dos destinos de una repetición de dos compases dibujable forman una unidad. Mover, intercambiar y cortar la tratan entera. Insertar o pegar en medio de la pareja se desplaza fuera de ella, hacia el lado pedido.
- Copiar, pegar, duplicar: copia profunda de compases completos en orden escrito, sin `structure`. Compases, acordes y voicings reciben IDs nuevos de `createIdFactory`, que reserva también los IDs referenciados por marcas y repeticiones. `repeatPrevious` de una copia apunta al compás que queda delante; `repeatPreviousTwo` solo se conserva si el segundo destino también se copia justo detrás y hay dos compases delante, con fuentes y destinos nuevos; si no, el compás queda vacío y se avisa. Las copias no heredan `fillToEdge` ni `breakBefore`. Los datos de otra canción se pegan igual, con IDs nuevos.
- Cortar y pegar en la misma canción (misma sesión de documento): se conservan los IDs que sigan libres, de modo que las marcas pendientes vuelven a encontrar su compás, como en un movimiento. Un segundo pegado ya crea copias.
- Sustituir cambia `chordEvents` (IDs nuevos), `widthPercent` y `repeatPrevious` del destino por los de la fuente; conserva `id`, `label`, `fillToEdge` y las marcas. Una fuente sirve para varios destinos; varias fuentes, para el mismo número de destinos en orden. Si el destino estaba en una pareja, la pareja se quita.
- Borrar varios compases enumera las consecuencias del bloque completo (`measureConsequences` admite una lista) sin repetir las relaciones internas; nada se redirige.
- Etiquetas: con renumeración, `runStructural` numera en orden las etiquetas `^\d+$` desde el número del primer compás numerado antes de la operación; las no numéricas se conservan y no consumen número. Sin renumeración, un compás nuevo recibe el mayor número más uno y una copia la etiqueta original seguida de « (copia)».
- Tarjetas: `copyCard` guarda los datos del acorde y su voicing; `pasteCard` inserta una tarjeta independiente con IDs nuevos; `pasteFingering` sustituye solo `frets`, `degrees` y `anchorFret` (ausentes en la fuente se retiran); `moveCard` reordena voicings dentro de un acorde o, entre acordes, separa ambas tarjetas (`isolateCard`) e intercambia los acordes sin cambiar textos efectivos. `swapCards` (0.9.0) hace lo mismo con dos tarjetas cualesquiera, también de compases distintos: exige exactamente dos claves distintas y conserva IDs y textos efectivos.

Compatibilidad: `schemaVersion` sigue siendo 1. Los archivos sin `renumberMeasures` no cambian al abrirse ni guardarse; las versiones anteriores a 0.8.0 rechazan ese campo por desconocido.

---

# B. docs/DISENO.md (diseño, precedencia 3)

## DISENO: Dos superficies, una identidad musical
- source: docs/DISENO.md
- type: nfr
- content:
La aplicación completa debe parecer una herramienta musical terminada. Cabecera con icono y nombre a la izquierda; acciones de archivo y exportación visibles; editor de compases, controles claros y vista previa. Evitar una colección de formularios sin jerarquía.

Dirección visual propuesta: fondo neutro, tinta azul de las hojas, acentos pastel por familia, espacio entre grupos y controles con estados de foco y selección reconocibles. La interfaz sigue esta dirección visual y se ha revisado en escritorio y móvil; la evidencia está en ESTADO.md.

## DISENO: Tipografía e icono
- source: docs/DISENO.md
- type: nfr
- content:
Usar Caveat Brush para títulos y nombres de acorde, Gochi Hand para anotaciones de hoja. Están en `references/fonts.css`. Los controles densos pueden usar una fuente de sistema legible. El usuario debe poder reconocer el estilo de las plantillas en la salida; no sustituirlo por una estética genérica de partitura.

El icono debe ser una pieza vectorial original y sencilla, legible a tamaño de cabecera y favicon. Integrarlo en toda la aplicación. No hace falta una imagen generada ni copiar marcas de terceros.

## DISENO: Editor vigente desde 0.6.0
- source: docs/DISENO.md
- type: nfr
- content:
1. Cabecera con icono, canción activa, Nuevo, Abrir, menú Ejemplos, Guardar JSON y menú Exportar. El nombre abre el diálogo de datos; el menú de tres puntos contiene Datos de la canción. Desde 0.9.0 la aplicación arranca con la hoja de ejemplo de `examples/index.json` y, entre 761 y 1240 px, la barra de archivo baja a una segunda fila para que la canción activa siga legible.
2. Bloque Compás: selector, anterior/siguiente, añadir, opciones y acceso Marcas. Desde 0.8.0 el menú de opciones agrupa etiqueta, ancho, renumeración y las acciones estructurales (compás, copiar y pegar, selección de varios); una barra bajo el selector muestra la selección múltiple. El clic derecho sobre un compás de la hoja abre un menú contextual con las mismas acciones.
3. Editor con un selector plano de tarjetas del compás y acciones Añadir tarjeta, Duplicar tarjeta y un menú de tarjeta (copiar, cortar, pegar, sustituir la tarjeta o su digitación, mover, marcar y quitar), el mismo que abre el clic derecho sobre una tarjeta de la hoja. No hay dos niveles visibles de acorde y posición.
4. Digitación y grados encima de textos y tonalidad, siempre visibles y sin pestañas. Cada campo modifica solo la tarjeta seleccionada, incluido nombre y calidad.
5. Panel de marcas ligado al compás activo, con selector de contexto y Ver todas las marcas. Incluye tramos que atraviesan el compás. La selección solo cambia la vista y el punto de partida de nuevas marcas; no mueve las ya guardadas.
6. Vista previa más ancha a la derecha. El editor habitual cabe sin scroll en las ventanas de escritorio comprobadas; contenido extenso y móvil conservan desplazamiento cuando hace falta.

En móvil, apilar paneles; no encoger controles hasta volverlos ilegibles. La vista previa puede desplazarse o ajustarse con zoom. Reservar la barra inferior del navegador y comprobar que el último botón se puede pulsar.

## DISENO: Tarjetas
- source: docs/DISENO.md
- type: nfr
- content:
- Tomar proporciones, bordes redondeados, tinta y colores de `referencia-tarjetas.html` y `diseno.css`.
- Cada voicing tiene su tarjeta, con título exterior opcional enmarcado, nombre del acorde, grado propio arriba a la derecha, texto interior y mástil. El título queda por encima y fuera de la línea del compás, alineado con el borde izquierdo de su tarjeta. Su ancho disponible es el del compás, no el de la tarjeta: puede extenderse sobre las tarjetas siguientes del mismo compás hasta la próxima que tenga título propio o el final del compás (o del fragmento, si el compás continúa en otra fila). Solo ajusta línea cuando no cabe en ese espacio y nunca ensancha las tarjetas.
- Una franja rectangular opcional sobre cada tarjeta muestra los cambios explícitos de tonalidad. Lleva un fondo tenue y una línea inferior de 3 px, con esquinas rectas como la plantilla; los segmentos contiguos cubren el hueco entre tarjetas. Las posiciones sin cambio mantienen el contexto y el color anteriores, sin repetir etiqueta. La calidad se elige por separado de la del acorde y respeta la paleta de la canción. La casilla global de datos de canción oculta todas las franjas, sin borrar información.
- El grado del voicing, las anotaciones y las tonalidades se escriben manualmente. No generar función romana ni familia/inversión obligatoria.
- No dibujar agrupaciones por acorde, líneas de color bajo las tarjetas ni separadores verticales entre tarjetas de un mismo compás. Las barras de compás y de repetición conservan su función musical.
- El relleno lateral de las tarjetas es de 5 px desde 0.6.3, con holgura para el redondeo de bordes a escalas fraccionarias. En una fila compacta (0.10.0) baja a 1 px para que quepa un compás más: el límite inferior es el mástil con sus números de cuerda y de traste, que no se reduce; nombre, grado y leyenda conservan 3 px.
- El compás de repetición (signo de un compás o pareja de dos) ocupa lo mismo que un compás de una tarjeta con el mástil más estrecho (tres trastes), a la escala de mástiles de la canción y también en una fila compacta. Sustituir un compás así por el signo nunca alarga la línea ni la hace saltar.
- El ancho crece al añadir trastes; la fila y la página se reorganizan. No estrechar indefinidamente cada celda para mantener cuatro compases por fila.

## DISENO: Geometría del mástil
- source: docs/DISENO.md
- type: nfr
- content:
Sea P la lista de trastes positivos. Si hay cuerdas al aire, `inicio = 1`; en otro caso, `inicio = min(P)` o 1 si P está vacía. `cantidad = max(3, max(P) - inicio + 1)`, usando 0 como máximo cuando P está vacía. El último traste es `inicio + cantidad - 1`.

Para una nota en el traste f: `x = (f - inicio + 0.5) * anchoCelda`. Las divisiones quedan en múltiplos de `anchoCelda`; los puntos, en el centro. La orientación gráfica de las cuerdas invierte el orden de entrada sexta→primera. No invertir las digitaciones almacenadas.

Ejemplos geométricos, sin atribuir nombres de acorde (entrada sexta→primera → trastes visibles):
- x 3 5 3 4 3 → 3–5
- x 3 6 4 5 3 → 3–6
- 0 2 2 1 0 0 → 1–3, con cejuela
- 0 2 2 4 0 0 → 1–4, con cejuela
- x 10 12 10 11 10 → 10–12
- x x x x x x → 1–3, todas mudas

Una posición muy extendida puede obligar a dedicarle una fila o una página. Si ni así cabe de forma legible, informar del conflicto y conservar los datos; no ocultar notas ni simular que se exportó correctamente.

## DISENO: Paginación e impresión
- source: docs/DISENO.md
- type: nfr
- content:
- A4 apaisado: 297 × 210 mm. Definir márgenes y área útil de forma explícita. Desde 0.1.3: margen de 5 mm (área útil 287 × 200 mm); separaciones de columna 6 px, fila 8 px y cabecera 10 px (desde 0.6.2); huecos de 4 px entre compases, acordes y posiciones; traste de 28 px, separación entre cuerdas de 17 px y zona exterior de 26 px (números de cuerda 1–6, cuerdas al aire y mudas). Referencia medida en la plantilla: tarjetas de la primera fila de 128 × 161 px y rejilla de 3 trastes de 84 × 85 px; no hay altura fija ni límite de 3 trastes. Trazos del mástil: horizontales 1,3, verticales 1,5, puntos de radio 8, números de traste de 10 px. Las mismas medidas (`src/layout/spec.js`, `GEOM`) rigen vista previa, medición y exportación. La paginación sigue siendo adaptativa por espacio disponible, sin cupo fijo de compases por fila.
- Cabecera de cada hoja con canción seguida de tonalidad en la misma línea cuando quepa; número `actual/total` en la esquina superior derecha, sin colisiones con títulos largos.
- Agrupar tarjetas por compás. Empezar otra fila o página cuando falte espacio, salvo que la fila quepa compacta. Los saltos de línea antes y después los marca en la vista previa un botón ↵ (margen izquierdo de la línea o abajo a la derecha del compás) que no aparece en la salida.
- Un compás con muchas tarjetas puede continuar en otra fila o página, con el mismo número y la etiqueta «continuación». No imponer un máximo oculto de tarjetas.
- Esperar a `document.fonts.ready` antes de medir, paginar o exportar. Recalcular si cambian textos o digitaciones.
- Compartir las pistas de marcas, títulos, franjas y zona del compás mediante subgrid entre todos los compases de cada fila, evitando offsets de altura fijos. Medir esas pistas por fragmento y sumar sus máximos al calcular la altura de una fila; el máximo de alturas individuales puede ser insuficiente. Mantener título exterior y tarjeta juntos. Evitar cortes de dibujos y barras musicales. Repetir o continuar los corchetes de casilla de manera reconocible al cruzar una fila.
- Usar el mismo renderizador para la vista previa y la exportación. El HTML exportado contiene solo las hojas y los recursos necesarios; no lleva herramientas de edición ni necesita servidor.
- El total se obtiene de las páginas reales, sin páginas vacías al final. Usar numeración propia de la hoja; recomendar desactivar los encabezados y pies automáticos del navegador al imprimir.

El HTML histórico incluye lógica, datos de una obra y análisis ajenos a este producto. No copiar textos de esa canción ni ejecutar ese código dentro de la aplicación.

## DISENO: Historial y selección en la vista previa
- source: docs/DISENO.md
- type: nfr
- content:
Las flechas Deshacer y Rehacer permanecen en cabecera y en los diálogos de edición. El historial restaura la canción y la selección, sin guardar pasos en el JSON.

En la vista previa se selecciona lo señalado: el recuadro de una tarjeta señala la tarjeta; el número, el título, la franja y los huecos señalan el compás. Lo señalado se resalta con más fuerza (con una tarjeta señalada, el compás activo queda con un tinte tenue, y al revés). La selección múltiple se marca en ámbar: los compases con fondo y contorno discontinuo, las tarjetas con un anillo que sigue su redondeo. El modo selección añade una casilla dibujada como fondo en la esquina de cada compás. Son solo estilos de la vista previa: no cambian dimensiones, paginación ni el HTML exportado.

---

# C. docs/diseno/textos-y-tonalidades.md (encargo implementado en 0.5.0, precedencia 5)

Estado según la fuente: "implementada y comprobada en 0.5.0. El usuario ha autorizado integrarla en main. Este documento conserva el encargo y sus decisiones de implementación." Cabecera: "Actualización 0.6.0: la interfaz edita tarjetas independientes con un selector único. Se elimina el alcance para todas las posiciones. La banda tonal es rectangular y se retiran las barras y separadores de grupos. El formato de datos anterior se conserva." Fecha de solicitud: 17/10/2026. Referencia visual: `EJEMPLO.html`.

## TEXTOS: Cambios pedidos
- source: docs/diseno/textos-y-tonalidades.md
- type: nfr
- content:
- Cabecera de canción: colocar la tonalidad inmediatamente a continuación del nombre de la canción. Nombre y tonalidad siguen teniendo campos de edición separados. Mantener la versión del documento.
- Título sobre la tarjeta: texto opcional dentro de un recuadro con borde, como «Intro · Joe Pass». Situarlo encima, alineado con el acorde o voicing al que pertenece.
- Línea vertical del compás: comienza junto al número de compás y llega hasta la parte inferior de las tarjetas. El título enmarcado queda por encima y fuera de esa línea, aunque pertenezca a una tarjeta intermedia.
- Anotación dentro: conservar su función y posición actuales, dentro de la tarjeta y debajo del nombre del acorde.
- Grado del voicing: nuevo campo opcional para texto como `ii`, `V7/ii` o `subV7/iii`, arriba a la derecha de la tarjeta, junto al nombre del acorde. Es distinto de los seis grados de las notas sobre las cuerdas.
- Tonalidad del voicing: nuevo campo opcional, asociado a cada voicing, para colocar una indicación sobre su posición, con franja de color como en la plantilla. Varios voicings de un mismo acorde pueden tener tonalidades diferentes.
- Calidad de la tonalidad: selector propio, similar al de calidad/familia del acorde. Determina el color de la tonalidad y es independiente de la calidad del acorde que se está tocando.
- Visibilidad global: una casilla permite mostrar u ocultar las tonalidades en toda la hoja/documento. Ocultar no borra textos, calidades ni colores guardados.

## TEXTOS: Alineación y espacio
- source: docs/diseno/textos-y-tonalidades.md
- type: nfr
- content:
En la plantilla, `.rehearsal` es un rótulo con borde situado antes de la franja `.tonal-row`. La línea izquierda pertenece a `.compas`; comienza debajo de esa franja. Dentro de la tarjeta, `.t-nom` y `.t-rn` comparten la fila superior y `.t-fam` ocupa la línea inferior.

Heredar esa relación visual, con una diferencia solicitada: el rótulo puede pertenecer a cualquier tarjeta, no solo al comienzo de una sección o fila. Su alineación debe seguir al voicing al reordenar, cambiar de fila o pasar de página. Reservar espacio para que títulos, franjas, números de compás, repeticiones, casillas, Coda y Segno no se superpongan. Los textos largos deben poder crecer sin recortes ni desplazarse a otra tarjeta.

## TEXTOS: Herencia de tonalidad y color
- source: docs/diseno/textos-y-tonalidades.md
- type: nfr
- content:
- Escribir una tonalidad en un voicing establece el contexto desde esa posición.
- Dejar el campo vacío significa que no se imprime otra etiqueta de cambio y sigue vigente la tonalidad anterior, con su mismo color. La franja conserva ese contexto.
- La herencia recorre los voicings en su orden escrito: dentro del acorde, entre acordes y entre compases. No se reinicia por un salto de fila o de página.
- El siguiente valor explícito cambia el contexto desde su propia posición. Vaciarlo elimina ese cambio y vuelve a heredar del contexto anterior.
- La casilla global afecta a la presentación en vista previa, HTML e impresión; al volver a activarla se recupera la presentación con los valores guardados.
- No calcular tonalidades ni grados por análisis automático del nombre del acorde. No expandir las repeticiones para resolver la herencia.

Ejemplo de comportamiento: voicing A, campo «Mi♭ mayor», calidad Mayor → etiqueta «Mi♭ mayor» e inicio de su color. Voicing B, vacío, Heredada → sin nueva etiqueta; conserva Mi♭ mayor y su color. Voicing C, «Do menor», Menor → etiqueta «Do menor» y cambio al color de menor. Voicing D, en el compás siguiente, vacío, Heredada → sin nueva etiqueta; conserva Do menor y su color.

## TEXTOS: Calidad y paleta
- source: docs/diseno/textos-y-tonalidades.md
- type: nfr
- content:
El texto de tonalidad y su calidad deben poder seleccionarse por separado, igual que el nombre y la familia de un acorde. Reutilizar las familias disponibles cuando corresponda: Mayor, Menor, Dominante, Semidisminuido, Disminuido y Otro. La calidad elegida es un criterio de color; no implica validar teóricamente el texto introducido.

La selección pertenece a la tonalidad, no al acorde: un acorde dominante puede estar bajo una franja de tonalidad menor. Los colores deben respetar la configuración de la canción, conservarse al guardar y ser legibles también con fondos oscuros. No codificar un color por nombre concreto de tonalidad. La plantilla contiene también etiquetas de escalas, como «menor armónica» o «mixolidia»; conservar la posibilidad de escribirlas sin convertirlas automáticamente en nuevos tipos de acorde.

## TEXTOS: Decisiones de implementación
- source: docs/diseno/textos-y-tonalidades.md
- type: nfr
- content:
Decisiones reversibles adoptadas al comenzar el desarrollo y comunicadas al usuario cuando afectan a la presentación:
1. La casilla «Mostrar tonalidades de las tarjetas» oculta las franjas en todas las páginas; conserva la tonalidad general junto al título. No elimina datos.
2. La tonalidad general inicia el contexto. Se añade una selección explícita de su calidad; si no se ha elegido, se usa el color neutro de Otro. No se infiere una calidad leyendo el texto. Sin tonalidad general ni un cambio local previo, no se dibuja franja.
3. No se repiten etiquetas heredadas al comenzar fila o página. El color continúa; solo se escribe una etiqueta al establecer un cambio explícito o al presentar por primera vez el contexto general.

## TEXTOS: Criterios de entrega
- source: docs/diseno/textos-y-tonalidades.md
- type: nfr
- content:
- Mostrar título de canción seguido de tonalidad y conservar versión y numeración `valor/total`.
- Comprobar rótulos enmarcados tanto en la primera tarjeta como en tarjetas intermedias, con varios acordes/voicings por compás y continuaciones en otra fila o página.
- Editar por separado título exterior, anotación interior, grado del voicing y grados de cuerda. Los campos vacíos no deben dejar etiquetas ni recuadros impresos.
- Verificar el ejemplo de herencia anterior, borrar un cambio, reordenar/duplicar/borrar posiciones, cambios de fila/página y casilla global, sin perder el color vigente.
- Guardar y reabrir todos los datos nuevos en JSON, validar las entradas antes de reemplazar la canción y mantener compatibilidad con documentos anteriores. Definir y documentar la evolución del esquema; no asumir que el validador actual acepta campos nuevos.
- Incluir todas las ediciones y la casilla en Deshacer/Rehacer y recuperación de la canción.
- Mantener el editor compacto y los campos frecuentes accesibles. Usar el mismo renderizado en vista previa, HTML autónomo e impresión.
- Revisar casos sin datos nuevos para conservar el resto del contenido y la geometría de los mástiles. Las nuevas cabeceras pueden exigir más altura; no escalar cada página de forma diferente ni recortar tarjetas para compensarlo.
- Manual, DTS y capturas actualizados para 0.5.0. Ver la evidencia registrada en `docs/ESTADO.md`.

## TEXTOS: Relación con los requisitos anteriores
- source: docs/diseno/textos-y-tonalidades.md
- type: nfr
- content:
Esta solicitud amplía R01, R07 y R08. Para la próxima implementación sustituye la parte de R24 que excluía la franja de tonalidad/escala. No solicita páginas de análisis armónico ni cálculo automático de funciones. Se conservan los demás requisitos, incluido el crecimiento automático del mástil a cuatro o más trastes cuando haga falta.
