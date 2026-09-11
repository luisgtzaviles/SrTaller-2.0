# Gestión de sprints

Los sprints hacen visible una selección de resultados, sus dependencias, revisión y aprendizaje. La existencia de una carpeta no implica aprobación de alcance, fecha ni capacidad.

## Estado del documento

**Estado:** Sprint 00 `Closed`.
**Sprints documentados:** [SPRINT-00](sprint-00/SPRINT_GOAL.md) `Closed`,
[SPRINT-01](sprint-01/SPRINT_GOAL.md) `Closed` y
[SPRINT-02](sprint-02/SPRINT_GOAL.md) `Active`.
**Sprint activo:** SPRINT-02 — Operational Authentication & Authorization;
PBI-025/PBI-034/PBI-026/PBI-028/PBI-038 están `Done`; G5 es `PASS`, Current
PBI es PBI-039 y WIP es `1/1`; Functional Slice Frozen / Owner Accepted y
Formal UI Verification, Hardening, Full Verification, CI / PR Readiness y PR
CI están en `PASS`; la revisión independiente anterior concluyó `CHANGES
REQUIRED`, sus findings están remediados y el gate vigente es la re-review
independiente.

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

SPRINT-02 ejecuta Operational Authentication & Authorization con WIP=1.
PBI-025/PBI-034 están `Done`; cierre PR #34 y CI exacto de main dejan G3
`PASS`. PBI-026 está `Done` y G4 `PASS`; PBI-028 está `Done`, G5 `PASS` tras
PR #39 y su CI exacta; PBI-038 está `Done` tras PR #40 y CI `34280510716`
GREEN. PBI-039 es el PBI actual: permanece `In progress` y no integrado en PR
#42. La CI `34564110272` dejó verde el candidato previo a la revisión que
concluyó `CHANGES REQUIRED`; la remediación y su CI exact-head `34567516069`
attempt 3 pasaron, y el head documental posterior `c7835f3…` conservó run-1,
run-2 y comparison verdes en `34574461352`. Cada commit documental posterior
debe conservar CI exact-head verde antes del handoff. El candidato está listo
para re-review independiente; merge y deploy siguen sin autorización.

- [Objetivo](sprint-02/SPRINT_GOAL.md)
- [Backlog](sprint-02/SPRINT_BACKLOG.md)
- [Riesgos y bloqueos](sprint-02/RISKS_AND_BLOCKERS.md)
- [Review](sprint-02/REVIEW.md)
- [Retrospectiva](sprint-02/RETROSPECTIVE.md)

## Próxima revisión

Al concluir la re-review de PBI-039 o al cambiar su gate.
