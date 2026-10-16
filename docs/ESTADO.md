# Estado de trabajo

Fecha: 16/10/2026. Especificación: 1.0.

## Preparado

- Requisitos consolidados, incluidas las correcciones sobre varios voicings, crecimiento de trastes y diseño completo de aplicación.
- Instrucciones para Claude y agentes de código, plan por fases y casos de validación.
- Modelo propuesto, esquema JSON y canción de prueba.
- Referencia visual histórica, CSS y fuentes Caveat Brush y Gochi Hand de la plantilla.

## Pendiente

| Fase | Estado |
| --- | --- |
| 0. Arranque y propuesta visual | No iniciada |
| 1. Edición y persistencia | No iniciada |
| 2. Mástil y tarjetas | No iniciada |
| 3. Estructura musical | No iniciada |
| 4. Paginación y exportación | No iniciada |
| 5. Validación y guía de uso | No iniciada |

## Bloqueo observado

La última consulta al conector Claude local devolvió el error interno MCP `-32603`. No se ha podido verificar su carpeta activa ni iniciar una tarea de desarrollo. GitHub permite acceder al repositorio. El bloqueo del conector no equivale a un fallo del código de esta aplicación.

## Comprobaciones de preparación

Comprobados con Python: sintaxis JSON; restricciones de tipo, campos obligatorios, referencias de esquema y tamaños del ejemplo; IDs únicos y destinos del ejemplo existentes; rechazo de versión desconocida, propiedades inesperadas y digitación con menos de seis cuerdas. Comprobados los enlaces Markdown locales. Se ha usado una comprobación estructural del subconjunto del esquema, no un validador completo Draft 2020-12; esa validación completa queda pendiente en la fase de implementación. No hay pruebas de aplicación, capturas de interfaz ni PDF de producto porque la implementación todavía no existe.

## Registro de fases

Añadir por cada entrega: fase, fecha, archivos, comandos realmente ejecutados, resultados, revisión visual, limitaciones y siguiente tarea. No marcar una fase como completa si quedan sus condiciones de cierre sin revisar.
