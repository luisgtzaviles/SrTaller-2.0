# SPRINT-01 — Identity & Context Foundation

## Estado del documento

- **Estado:** Active — PBI-033 `In progress`; WIP 1/1.
- **Sprint:** SPRINT-01.
- **Periodo:** TBD.
- **Estado del sprint:** Active.
- **Gate de activación:** PASS — PBI-027 y PBI-029 están `Done`; PBI-029
  cuenta con merge documental integrado y CI post-cierre de `main` GREEN.
- **PBI actual:** PBI-033 — Roles, Assignments and Capability Catalog.
- **Siguiente candidato:** NONE durante la ejecución; PBI-025 permanece
  ordenado, no seleccionado.

## Objetivo

Establecer la secuencia mínima de tiempo, secretos, Station context, Users,
Roles y Capabilities que permita construir autenticación operacional sin
seguir atribuyendo nuevos writes productivos a un actor sintético.

## Resultado observable

- Las foundations se ejecutan con WIP=1 y gates explícitos.
- Cada PBI cerrado avanza documentalmente al siguiente sin autorizarlo.
- Al terminar el Sprint, PIN/Session pueden refinarse sobre contexto e
  identidades persistentes y confiables.

## Incluido

- PBI-027, PBI-029, PBI-024, PBI-032 y PBI-033, uno a la vez.

## No incluido

- PIN y Operational Session implementados.
- Nuevos writes de Customers, New Repair, Pricing o Payments.
- Más profundidad funcional de Repairs.
- Deploy o Stage 2.

## Criterios de éxito y salida

- [x] PBI-027 `Done`; `Released: NO`.
- [x] PBI-029 `Done`; `Released: NO`.
- [x] PBI-024 `Done`; `Released: NO`.
- [x] PBI-032 `Done`; cierre PR #27 y CI post-cierre `34074457695` GREEN;
  `Released: NO`.
- [ ] PBI-033 `Done`.
- [x] No existe más de un PBI en ejecución/cierre; PBI-033 ocupa WIP `1/1`.
- [ ] El siguiente PBI de autenticación queda seleccionado, no iniciado.

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** focused high-risk review de PBI-033 bajo el Master Goal o
  cierre del Sprint después de su cierre canónico.
