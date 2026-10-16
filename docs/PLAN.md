# Plan de desarrollo

Las fases 0 a 4 están validadas y la 5 cierra la versión 0.1.0 (ver `ESTADO.md`). Cada fase deja una entrega pequeña, revisable y comprobada. El cierre exige los resultados descritos, no solo que Claude termine de responder.

## Fase 0. Arranque y propuesta visual

Leer instrucciones y referencias; comprobar repositorio, rama y cambios existentes. Preparar HTML/CSS/JS local y una propuesta de la interfaz completa con datos de ejemplo, icono vectorial y comportamiento adaptable. Documentar cómo abrirla; si los módulos necesitan HTTP local, incluir un procedimiento sencillo sin backend de aplicación.

Entrega: estructura de proyecto, comandos reales y primera pantalla. Cierre: abre sin errores, controles legibles en escritorio y móvil, icono a la izquierda del nombre y hojas con fuentes originales. No presentar botones todavía inactivos como funcionalidades terminadas.

## Fase 1. Estado, compases y edición

Implementar modelo y validación, datos de canción, CRUD y orden de compases, varios eventos por compás y varios voicings por evento. Añadir campos de nombre, texto interior y título exterior. Completar entrada por lista con validación y previsualización. Incluir cambios pendientes y una forma de evitar perderlos al abrir otra canción.

Entrega: edición funcional. Cierre: modificar una tarjeta conserva todas las demás, sus IDs y su orden; la entrada por lista distingue bajo con barra y voicings alternativos. Guardado y apertura mínimos deben estar disponibles para no depender de datos efímeros durante las fases siguientes.

## Fase 2. Mástil y tarjetas

Implementar geometría de seis cuerdas, trastes variables, cejuela, cuerdas al aire, mudas, nombres, textos y grados manuales. Adaptar ancho de tarjeta y fila al número real de trastes. Aplicar fuentes y paleta de referencia sin copiar análisis ni límites antiguos.

Entrega: tarjetas fieles a los datos. Cierre: casos geométricos de `DISENO.md`, notas centradas, trastes de dos cifras, cuatro o más trastes completos y ausencia de cambios automáticos de digitación.

## Fase 3. Estructura de partitura

Implementar edición y dibujo de repeticiones, número de pasadas, casillas, Segno, Coda, Fine y saltos. Destinos por ID, selección visible y avisos por referencias incompletas. Tratar casillas que atraviesan filas. Mantener numeración escrita sin expandir recorridos.

Entrega: estructura musical editable y persistida. Cierre: todas las marcas sobreviven al guardado; borrar o mover un compás no produce redirecciones silenciosas. Sin motor de reproducción.

## Fase 4. Paginación y exportación

Compartir renderizador de hojas entre vista previa y exportación. Medir con fuentes cargadas, distribuir filas y páginas A4 apaisadas, continuar compases muy poblados de forma identificable y calcular `actual/total`. Incluir cabecera de canción y tonalidad. Exportar un único HTML con recursos incluidos y abrir impresión para PDF.

Entrega: HTML autónomo y flujo PDF desde navegador. Cierre: abrir la exportación sin conexión y comprobar impresión de una, dos y tres o más hojas; sin recortes, páginas finales vacías, franjas tonales ni análisis. Revisar títulos largos y símbolos musicales.

## Fase 5. Cierre y documentación de uso

Completar los casos de `VALIDACION.md`, corregir fallos y documentar formato de entrada, guardado, edición, marcas y exportación. Añadir versión de aplicación visible y `CHANGELOG.md`; la versión inicial se fija al entregar la primera aplicación utilizable. No añadir un crédito con un nombre supuesto.

Entrega: aplicación utilizable y resultados de validación. Cierre: revisión visual de escritorio y móvil, pruebas de persistencia, exportación sin conexión y lista honesta de limitaciones. No crear un despliegue como parte de esta fase.

## Criterio de cambios

Se pueden agrupar tareas técnicas pequeñas si no se pierde la revisión por fases. Si cambia el esquema, actualizar documentación, ejemplo y pruebas en el mismo cambio. No ampliar alcance con herramientas de generación o teoría musical antes de terminar la edición y la exportación.
