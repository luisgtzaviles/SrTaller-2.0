# Gestión de sprints

Los sprints hacen visible una selección de resultados, sus dependencias, revisión y aprendizaje. La existencia de una carpeta no implica aprobación de alcance, fecha ni capacidad.

## Estado del documento

**Estado:** SPRINT-00, SPRINT-01 y SPRINT-02 `Closed`.
**Sprints documentados:** [SPRINT-00](sprint-00/SPRINT_GOAL.md) `Closed`,
[SPRINT-01](sprint-01/SPRINT_GOAL.md) `Closed` y
[SPRINT-02](sprint-02/SPRINT_GOAL.md) `Closed` y
[SPRINT-03](sprint-03/SPRINT_GOAL.md) `Active`.
**Sprint activo:** SPRINT-03 — Price List Foundation. PBI-040 es `Done
candidate`; no existe Current PBI. PBI-041 está Candidate/Ready sin selección
ni autorización; WIP `0/1`.

## Reglas propuestas

1. Un PBI debe cumplir la [Definition of Ready](../delivery/DEFINITION_OF_READY.md) aplicable antes de aprobar un compromiso de ejecución.
2. Objetivo, capacidad, fechas y responsables deben acordarse; si faltan, usar `TBD`.
3. El Sprint Backlog distingue `Committed`, `Candidate`, `Blocked` y `Requires product input`. En SPRINT-00 son buckets preliminares solicitados para ordenar revisión; sólo la planificación aprobada convierte `Committed` en compromiso efectivo.
4. Cambiar clasificación exige registrar motivo e impacto en el objetivo.
5. Review evalúa resultados/evidencia; retrospectiva mejora el proceso sin reemplazar decisiones de producto.
6. Cerrar un sprint no cambia automáticamente ADRs ni autoriza un release.
7. El MVP Operativo usa WIP=1: máximo un PBI actual en ejecución o cierre.
8. El PR documental de cierre selecciona el PBI siguiente, pero no autoriza su
   implementación.

## SPRINT-00

SPRINT-00 funciona como etapa de fundación documental. Fue ejecutado,
reconciliado y [cerrado formalmente](../reviews/sprint-00/SPRINT_00_CLOSURE.md).
Sus documentos son:

- [Objetivo y criterio de salida](sprint-00/SPRINT_GOAL.md)
- [Sprint Backlog](sprint-00/SPRINT_BACKLOG.md)
- [Riesgos y bloqueos](sprint-00/RISKS_AND_BLOCKERS.md)
- [Review](sprint-00/REVIEW.md)
- [Retrospectiva](sprint-00/RETROSPECTIVE.md)

## SPRINT-01

SPRINT-01 ejecutó Identity & Context Foundation y está cerrado. Su
backlog ordena PBI-027, PBI-029, PBI-024, PBI-032 y PBI-033, uno a la vez.
Los cinco PBIs están `Done` y ninguno está `Released`.

- [Objetivo](sprint-01/SPRINT_GOAL.md)
- [Backlog](sprint-01/SPRINT_BACKLOG.md)
- [Riesgos y bloqueos](sprint-01/RISKS_AND_BLOCKERS.md)
- [Review](sprint-01/REVIEW.md)
- [Retrospectiva](sprint-01/RETROSPECTIVE.md)

## SPRINT-02

SPRINT-02 ejecutó Operational Authentication & Authorization con WIP=1.
PBI-025/PBI-034/PBI-026/PBI-028/PBI-038 están `Done`; G3–G5 son `PASS`.
PBI-039 quedó `Done` en `40684d7` con CI exacta `34623060504`. El Sprint se
extendió para PBI-043, remediación Access gobernada por ASC-001…ASC-008 y
ADR-014. PR #47/#48, CI candidata/exact-main y Preview quedaron PASS; PBI-043
está `Done` y el Sprint `Closed`. Production sigue sin autorización.

- [Objetivo](sprint-02/SPRINT_GOAL.md)
- [Backlog](sprint-02/SPRINT_BACKLOG.md)
- [Riesgos y bloqueos](sprint-02/RISKS_AND_BLOCKERS.md)
- [Review](sprint-02/REVIEW.md)
- [Retrospectiva](sprint-02/RETROSPECTIVE.md)

## SPRINT-03

SPRINT-03 ejecuta Price List Foundation. PBI-040 es `Done candidate` después de
Owner Acceptance, integración y Preview PASS; no existe Current PBI. PBI-041
permanece Candidate/Ready sin seleccionar ni iniciar. PBI-042 no pertenece al
compromiso inicial.

- [Objetivo](sprint-03/SPRINT_GOAL.md)
- [Backlog](sprint-03/SPRINT_BACKLOG.md)
- [Riesgos](sprint-03/RISKS_AND_BLOCKERS.md)
- [Review](sprint-03/REVIEW.md)
- [Retrospectiva](sprint-03/RETROSPECTIVE.md)

## Próxima revisión

Al resolver Owner Review de PBI-040 o cambiar su alcance/autoridad.
