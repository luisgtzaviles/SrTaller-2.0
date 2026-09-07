# SPRINT-01 — Identity & Context Foundation

## Estado del documento

- **Estado:** Active — PBI-032 `Done candidate`; WIP 0/1 durante el cierre
  documental.
- **Sprint:** SPRINT-01.
- **Periodo:** TBD.
- **Estado del sprint:** Active.
- **Gate de activación:** PASS — PBI-027 y PBI-029 están `Done`; PBI-029
  cuenta con merge documental integrado y CI post-cierre de `main` GREEN.
- **PBI actual:** NONE.
- **Siguiente candidato:** PBI-033 — seleccionado, no iniciado.

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
- [ ] PBI-032 `Done` — candidate completo; pendiente merge/CI del cierre
  documental.
- [ ] PBI-033 `Done`.
- [ ] No existe más de un PBI en ejecución/cierre.
- [ ] El siguiente PBI de autenticación queda seleccionado, no iniciado.

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** Owner merge review del cierre documental de PBI-032 o cierre
  del Sprint.
