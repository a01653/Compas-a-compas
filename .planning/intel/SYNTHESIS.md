# Síntesis de la ingesta de documentos

Modo: new. Proyecto: Compás a compás, aplicación existente y publicada (versión 0.10.1 según el encargo de la ingesta). Todo lo sintetizado describe funcionalidad ya implementada y validada, salvo indicación expresa de una fuente. No se ha inventado ningún requisito pendiente.

Este archivo es el punto de entrada para `gsd-roadmapper`.

## Documentos por tipo (6)

- DOC (2): `AGENTS.md` (precedencia 0), `CLAUDE.md` (precedencia 1)
- PRD (1): `docs/REQUISITOS.md` (precedencia 2)
- SPEC (3): `docs/DISENO.md` (precedencia 3), `docs/DATOS.md` (precedencia 4), `docs/diseno/textos-y-tonalidades.md` (precedencia 5)
- ADR (0)

Se usan las precedencias enteras del manifest (menor número gana), no el orden por tipo.

## Decisiones bloqueadas

0. No hay ADR en el conjunto. Ver `.planning/intel/decisions.md`.

## Requisitos

47 entradas en `.planning/intel/requirements.md`, todas de `docs/REQUISITOS.md`:
- REQ-R01 a REQ-R41 (41 requisitos). R31–R36 (0.8.0), R37–R39 (0.9.0), R40–R41 (0.10.0); R29–R30 de la ampliación 0.6.0.
- REQ-ampliacion-0-6-0
- REQ-fuera-de-alcance-primera-version
- REQ-sustitucion-tres-trastes, REQ-sustitucion-voicings-por-compas, REQ-sustitucion-titulo-por-tarjeta, REQ-sustitucion-diseno-moderno

Las fuentes no separan criterios de aceptación; el campo `acceptance` figura como ausente.

## Restricciones

34 entradas en `.planning/intel/constraints.md`:
- schema: 15 (DATOS.md)
- protocol: 4 (DATOS.md: marcas incompletas, entrada por lista, compatibilidad 0.7.0, edición estructural 0.8.0)
- nfr: 15 (DATOS.md 1, DISENO.md 7, textos-y-tonalidades.md 7)
- api-contract: 0

Por documento: DATOS.md 20, DISENO.md 7, textos-y-tonalidades.md 7.

## Temas de contexto

12 temas en `.planning/intel/context.md` (AGENTS.md y CLAUDE.md, más el contexto de la ingesta y la lista de referencias fuera del conjunto).

## Conflictos

- Bloqueos: 0
- Variantes competidoras (competing-variants): 0 (solo hay un PRD)
- Avisos (WARNING): 2, ambos de estado desactualizado en las fuentes de mayor precedencia: AGENTS.md declara pendiente el encargo del 18/10/2026 (implementado en 0.7.0–0.7.1), y CLAUDE.md declara versión 0.1.0 (la vigente es 0.10.1)
- Resueltos automáticamente (INFO): 10 entradas, incluidas "preparada para desarrollo" frente a implementada, "publicación de una web" fuera de alcance frente a GitHub Pages, R02 frente a R34, R24 frente a 0.5.0, y "modo de todas las posiciones" frente a 0.6.0

Detalle: `.planning/INGEST-CONFLICTS.md`

## Instrucciones para el consumidor

- No generar trabajo pendiente a partir de los pasajes históricos señalados en los WARNING (encargo del 18/10/2026, versión 0.1.0, cabecera "preparada para desarrollo").
- Los documentos referenciados fuera del conjunto (docs/ESTADO.md, docs/PLAN.md, docs/DTS.md, etc.) no se han leído; la evidencia de validación que las fuentes delegan en ellos no está verificada por esta ingesta.
- `.planning/codebase/` es un mapa del código independiente y no forma parte de esta síntesis.

## Archivos de intel

- `.planning/intel/decisions.md`
- `.planning/intel/requirements.md`
- `.planning/intel/constraints.md`
- `.planning/intel/context.md`
- `.planning/INGEST-CONFLICTS.md`
