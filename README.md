# Compás a compás

Editor local de hojas de acordes de guitarra, organizado por compases. Permite preparar canciones, corregir sus tarjetas, guardar el proyecto editable en JSON y exportar una hoja HTML autónoma para imprimir o guardar como PDF desde el navegador.

**Estado: especificación preparada; aplicación pendiente de desarrollar.** Este repositorio todavía no contiene un editor funcional. No se han ejecutado pruebas de una aplicación.

## Empezar con Claude

Leer [CLAUDE.md](CLAUDE.md), [AGENTS.md](AGENTS.md) y [docs/INICIO_CLAUDE.md](docs/INICIO_CLAUDE.md). Ejecutar las fases de [docs/PLAN.md](docs/PLAN.md) y registrar resultados reales en [docs/ESTADO.md](docs/ESTADO.md).

## Documentación

| Archivo | Contenido |
| --- | --- |
| [Requisitos](docs/REQUISITOS.md) | Funciones acordadas y límites de alcance |
| [Diseño](docs/DISENO.md) | Aplicación completa, tarjetas e impresión |
| [Modelo de datos](docs/DATOS.md) | Canción, compases, acordes, voicings y navegación musical |
| [Esquema JSON](schemas/song.schema.json) | Contrato inicial propuesto para guardar canciones |
| [Ejemplo editable](examples/cancion-demo.json) | Datos de prueba; no es una transcripción de una obra |
| [Plan](docs/PLAN.md) | Fases, entregables y condiciones de cierre |
| [Validación](docs/VALIDACION.md) | Casos que debe superar la aplicación |
| [Referencias](references/README.md) | Procedencia y diferencias frente a las plantillas |

## Decisiones ya tomadas

- HTML, CSS y JavaScript; funcionamiento local, sin servidor de aplicación ni cuenta.
- Varios acordes y varios voicings del mismo acorde por compás.
- Tres trastes visibles por defecto; crecimiento automático cuando se necesiten más.
- Nombre del acorde, texto libre dentro y título opcional fuera de cada tarjeta.
- Nombre de canción y tonalidad en la cabecera; páginas `actual/total` arriba a la derecha.
- Exportación A4 apaisada con la tipografía de las plantillas y sin franja tonal ni análisis armónico.
- Diseño moderno, musical y profesional para toda la aplicación; icono a la izquierda del nombre.
- Repeticiones, casillas, Segno, Coda, D.C., D.S., To Coda y Fine.

La planificación no autoriza publicar una web ni activar alojamiento. El encargo actual consiste en preparar este repositorio para el desarrollo.
