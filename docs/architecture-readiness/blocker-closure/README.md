# Cierre y priorización de bloqueantes arquitectónicos

## Propósito

Este paquete convierte los bloqueantes de preparación arquitectónica en una secuencia verificable de decisiones. No sustituye las fuentes de dominio, no acepta ADRs, no autoriza prototipos y no habilita implementación por sí mismo.

## Veredicto actual

**El alcance y contrato de salida de R0 están aprobados, pero R0 no está listo para programación funcional. [PBI-022](../../backlog/pbis/PBI-022.md) quedó `Done` y no amplía la autorización; [PBI-021](../../backlog/pbis/PBI-021.md) conserva únicamente su alcance técnico de DEC-004. Ninguno permite scaffolding funcional del producto.**

La documentación permite preparar ADRs, criterios, escenarios y spikes para
autorización. `DEC-002` y `DEC-062` quedaron cerradas por el Responsable de
Producto el 2026-07-21. La selección de plataforma de `DEC-004` fue aceptada
el 2026-07-22 y su
[verificación formal VC-024](../dec-004-linux-verification/vc-024/FORMAL_VERIFICATION.md)
obtuvo `PASS` el 2026-07-24. DEC-005 quedó materializada y formalmente
verificada el 2026-07-23. DEC-044, DEC-049, DEC-051 y
[DEC-063](../../decisions/dec-063-definition-of-done/FORMAL_REVIEW.md) fueron
aceptadas el 2026-07-24. VC-024 satisface DEC051-C01/C07/C09 y
DEC063-C01/C03/C04; las demás condiciones permanecen pendientes. H0 queda
completo en 9/0. El primer cambio funcional de R0 continúa bloqueado por
autorización organizacional y contratos transversales H1. R1 añade decisiones
de folio, recepción, custodia, política, tiempo, evidencia e identificación
física.

| Declaración | Estado actual | Evidencia faltante principal |
| --- | --- | --- |
| R0 listo para diseñar | Sí, con alcance y contrato de salida aprobados | Cerrar diseño técnico pendiente sin convertir propuestas en implementación |
| R0 listo para programar | No | H0 y H1 cerrados, ADRs aceptados y autorización explícita |
| R1 listo para diseñar | Parcialmente | Cerrar preguntas de producto de recepción y folio |
| R1 listo para programar | No | R0 demostrado y H2 cerrado |
| MVP listo para piloto | No | R1–R5 integradas y H3 cerrado |
| MVP listo para producción | No | H4 cerrado y riesgos residuales aceptados |

## Release gate reevaluado

Tras cerrar `DEC-002`, `DEC-004`, `DEC-005`, `DEC-044`, `DEC-049`, `DEC-051`,
`DEC-062` y `DEC-063` para H0, el hito queda completo:

- `DEC-004`: selección aceptada y [VC-024](../dec-004-linux-verification/vc-024/FORMAL_VERIFICATION.md) `Closed / PASS`;
- `DEC-005`: `Accepted — Materialized / Formally Verified`; [PBI-022](../../backlog/pbis/PBI-022.md) `Done`; ya no bloquea H0;
- [DEC-044](../../decisions/dec-044-error-strategy/FORMAL_REVIEW.md):
  `Accepted`; DEC044-C01 a C08 vigentes para materialización; ya no bloquea H0
  por estado;
- `DEC-049`: `Accepted`; DEC049-C01 a C08 vigentes para materialización; ya no bloquea H0 por estado;
- [DEC-051](../../decisions/dec-051-testing-ci-strategy/FORMAL_REVIEW.md):
  `Accepted`; DEC051-C01/C07/C09 `Satisfied`; C02–C06/C08/C10 `Pending`;
- [DEC-063](../../decisions/dec-063-definition-of-done/FORMAL_REVIEW.md):
  `Accepted with conditions`; C01/C03/C04 `Satisfied`; C02/C05–C08 `Pending`.

También siguen pendientes la autorización organizacional funcional (`B-21`) y
todos los cierres H1 aplicables antes de declarar R0 programable. La sexta
reverificación formal de PBI-022 obtuvo `PASS` y cerró sus hallazgos
históricos. VC-024 obtuvo `PASS` mediante dos jobs Linux independientes,
artefactos validados y comparación semántica reproducible. Las condiciones de
[DEC-044](../../decisions/dec-044-error-strategy/FORMAL_REVIEW.md),
[DEC-049](../../decisions/dec-049-persistence-ownership/DECISION_PROPOSAL.md) y
DEC-051/063 no satisfechas por VC-024 permanecen pendientes de materialización.

ADR-001, ADR-003 y ADR-009 fueron aceptados el 2026-07-21 por Arquitectura + Ingeniería; ADR-005 fue aceptado con condiciones el 2026-07-22 tras la revisión aprobada de SPIKE-009. TypeScript y Node.js `24.x` forman la baseline de lenguaje/runtime; PostgreSQL 18.x es el motor transaccional; NestJS `11.x`, Express y REST/HTTP JSON mínima forman el shell inicial; y el repositorio único conserva una aplicación/artefacto sin workspaces obligatorios. `DEC-004` selecciona el toolchain y VC-024 verifica su evidencia Linux; `DEC-005` tiene organización modular materializada y formalmente verificada.

## Respuestas rectoras

1. **Primer cambio de implementación de R0:** lo bloquean únicamente decisiones estructurales difíciles de revertir; se excluyen proveedores y capacidades futuras.
2. **R0:** ADR-004 fija multitenancy, ADR-010 contexto, ADR-011 identidad/sesión, ADR-012 autorización ordinaria y ADR-013 refuerzo; siguen bloqueando su aplicación y pruebas, composición/clasificación por rebanada, mecanismos técnicos, configuración, tiempo, auditoría y persistencia segura.
3. **R1:** lo bloquean folio, recepción mínima, custodia, estados/ubicación inicial, política efectiva, archivos e identificación física.
4. **Durante implementación:** pueden cerrarse detalles locales que no cambien invariantes, ownership, seguridad ni contratos públicos.
5. **Piloto:** exige operación recuperable, soporte, copias, restauración, monitoreo, rollback y convivencia decidida.
6. **Producción:** exige seguridad endurecida, retención, cumplimiento, capacidad, alertas, recuperación y gobierno SaaS.
7. **ADRs:** sólo las decisiones durables, transversales o costosas de revertir se promueven a ADR.
8. **Orden:** producto y contexto preceden identidad; identidad precede persistencia; la fundación precede recepción; operación recuperable precede piloto.
9. **Evidencia:** cada promoción requiere decisión registrada, autoridad, escenarios, pruebas y trazabilidad; una implementación no cierra una decisión por sí sola.

## Hitos

| Hito | Significado |
| --- | --- |
| H0 | Antes del primer cambio de implementación de R0 |
| H1 | Antes de programar R0 — Fundación Ejecutable |
| H2 | Antes de programar R1 — Recepción |
| H3 | Antes del piloto controlado |
| H4 | Antes de producción general |
| H5 | Diferible después del MVP |

## Inventario consolidado

Se evaluaron **82 decisiones**: las 70 del inventario base y 12 decisiones diferibles explícitas. La [matriz maestra](INVENTARIO_DE_BLOQUEANTES.md) es la fuente de IDs `DEC-001` a `DEC-082`; los demás documentos agrupan esas filas sin crear estados paralelos.

**Actualizaciones posteriores:** [ADR-001](../../decisions/proposed/ADR-001-typescript-as-primary-language.md) cierra lenguaje/runtime inicial; [ADR-003](../../decisions/proposed/ADR-003-postgresql-primary-database.md) cierra el motor y fija PostgreSQL 18.x como baseline de R0; [ADR-004](../../decisions/proposed/ADR-004-shared-schema-multitenancy.md) topología/propiedad; [ADR-005](../../decisions/proposed/ADR-005-nestjs-backend.md) acepta con condiciones NestJS como shell, Express y REST/HTTP JSON mínima; [ADR-009](../../decisions/proposed/ADR-009-monorepo-strategy.md) repositorio único y workspaces bajo demanda; [ADR-010](../../decisions/proposed/ADR-010-station-bound-operational-context.md) contexto/vinculación; [ADR-011](../../decisions/proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md) identidad/PIN/sesión; [ADR-012](../../decisions/proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md) autorización ordinaria; [ADR-013](../../decisions/proposed/ADR-013-sensitive-actions-and-reinforced-authorization.md) sensibilidad/refuerzo; [DEC-002 y DEC-062](CRITERIOS_DE_SALIDA_DE_R0.md) cierran alcance y contrato de salida de R0; [DEC-004](DEC-004_BASELINE_TECNICA.md) acepta la selección del toolchain y su VC-024 aporta evidencia Linux reproducible; [DEC-005](../../decisions/dec-005-modular-monolith-organization/DECISION_PROPOSAL.md) está materializada y formalmente verificada. No cierran implementación funcional, composición y clasificación por rebanada, mecanismos de acceso/migración, RLS ni evidencia funcional H1.

## Ruta de lectura

1. [Inventario de bloqueantes](INVENTARIO_DE_BLOQUEANTES.md)
2. [Baseline técnica de DEC-004](DEC-004_BASELINE_TECNICA.md)
3. [Clasificación por hito](CLASIFICACION_POR_HITO.md)
4. [Bloqueantes del primer cambio de implementación de R0](BLOQUEANTES_DEL_PRIMER_COMMIT.md)
5. [Bloqueantes de R0](BLOQUEANTES_DE_R0.md)
6. [Bloqueantes de R1](BLOQUEANTES_DE_R1.md)
7. [Bloqueantes del piloto](BLOQUEANTES_DEL_PILOTO.md)
8. [Bloqueantes de producción](BLOQUEANTES_DE_PRODUCCION.md)
9. [Decisiones diferibles](DECISIONES_DIFERIBLES.md)
10. [Secuencia de decisiones](SECUENCIA_DE_DECISIONES.md)
11. [Mapa de ADRs requeridos](MAPA_DE_ADRS_REQUERIDOS.md)
12. [Dependencias entre decisiones](DEPENDENCIAS_ENTRE_DECISIONES.md)
13. [Criterios de salida de R0](CRITERIOS_DE_SALIDA_DE_R0.md)
14. [Criterios de entrada de R1](CRITERIOS_DE_ENTRADA_DE_R1.md)
15. [Criterios de piloto](CRITERIOS_DE_PILOTO.md)
16. [Criterios de producción](CRITERIOS_DE_PRODUCCION.md)
17. [Plan de cierre](PLAN_DE_CIERRE.md)
18. [Riesgos de decidir tarde](RIESGOS_DE_DECIDIR_TARDE.md)
19. [Preguntas para el Responsable de Producto](PREGUNTAS_PARA_PRODUCT_OWNER.md)
20. [Preguntas para spikes técnicos](PREGUNTAS_PARA_SPIKES_TECNICOS.md)
21. [Trazabilidad](TRAZABILIDAD.md)

## Autoridad y reglas

- [ADR-001 a ADR-005](../../decisions/README.md) y [ADR-009 a ADR-013](../../decisions/README.md) están `Accepted`; ADR-006 a ADR-008 conservan su estado registrado.
- Las decisiones de dominio validadas conservan autoridad sobre propuestas arquitectónicas.
- `Requiere Responsable de Producto` nunca se cierra por preferencia técnica.
- `Requiere spike` produce evidencia, no aceptación automática.
- El cierre exige actualizar la matriz, la fuente autoritativa y la evidencia enlazada.
- No se diseñan carpetas definitivas, tablas, migraciones, APIs, interfaces, configuración ejecutable de runtime ni despliegues.

## Próxima promoción posible

La siguiente promoción válida es **R0 listo para programar**. H0 está
completo; todavía requiere cerrar H1 y obtener autorización organizacional
explícita. No requiere resolver H2–H5 ni diseñar R2–R5 por anticipación.

El siguiente gate concreto es resolver el gate organizacional y los contratos
transversales H1 aplicables. VC-024 no autoriza R0, no cierra Sprint 00 y no
declara satisfechas las condiciones de DEC-051/063 que permanecen `Pending`.
