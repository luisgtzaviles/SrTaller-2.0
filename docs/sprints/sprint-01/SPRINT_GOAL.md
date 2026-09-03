# SPRINT-01 — Identity & Context Foundation

## Estado del documento

- **Estado:** Planned — ready for activation after roadmap reconciliation.
- **Sprint:** SPRINT-01.
- **Periodo:** TBD.
- **Estado del sprint:** Planned; no activo.
- **Gate de activación:** reconciliación del roadmap integrada en `main`,
  PBI-027 con DoR/estimación completas y decisión Owner separada.
- **PBI actual:** ninguno mientras el Sprint permanezca Planned.
- **Siguiente candidato:** PBI-027, pendiente de DoR/estimación y no iniciado.

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

- [ ] PBI-027 `Done`.
- [ ] PBI-029 `Done`.
- [ ] PBI-024 `Done` con recuperación selectiva, no merge de la rama histórica.
- [ ] PBI-032 `Done`.
- [ ] PBI-033 `Done`.
- [ ] No existe más de un PBI en ejecución/cierre.
- [ ] El siguiente PBI de autenticación queda seleccionado, no iniciado.

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** integración de la reconciliación y revisión DoR/estimación de PBI-027.
