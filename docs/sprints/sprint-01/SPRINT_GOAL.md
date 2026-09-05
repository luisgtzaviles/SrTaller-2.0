# SPRINT-01 — Identity & Context Foundation

## Estado del documento

- **Estado:** Active — PBI-027 es el único trabajo en ejecución.
- **Sprint:** SPRINT-01.
- **Periodo:** TBD.
- **Estado del sprint:** Active.
- **Gate de activación:** PASS — DoR, estimación Small / riesgo Medium y
  autorización Owner condicional de PBI-027 (2026-09-04).
- **PBI actual:** PBI-027 — Branch Timezone Minimum (`In review`; Draft PR
  #19, CI GREEN; Owner Review pendiente).
- **Siguiente candidato:** PBI-029; sólo seleccionado, no iniciado.

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
- **Disparador:** Owner Review de PBI-027 con Draft PR y CI GREEN.
