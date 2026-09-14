# SPRINT-03 — Price List Foundation

## Estado del documento

- **Sprint:** SPRINT-03.
- **Estado:** Active — PBI-040 Done candidate; sin PBI actual.
- **Periodo:** TBD.
- **PBI actual:** NONE.
- **WIP:** 0/1.
- **Autoridad:** este Master Goal autoriza architecture/readiness y la apertura
  documental del Sprint. Owner autorizó implementar PBI-040 el 2026-09-11;
  el Master Goal de reanudación del 2026-09-12 autoriza reconciliar con el
  nuevo `main` y volver a Owner Review. El Master Goal de cierre de 2026-09-13
  registra Owner Acceptance y autoriza los gates técnicos, merge y Preview;
  Production permanece fuera de alcance.

## Objetivo

Entregar una Lista de precios operable: un administrador registra identidades y
precios de forma individual y un empleado encuentra en segundos el precio
efectivo de su Branch, sobre una frontera preparada para actualizaciones masivas
sin mezclar inventario, reparaciones o Caja.

## Selección

1. PBI-040 — core vertical y búsqueda rápida — `Committed / Done candidate / Released: NO`.
2. PBI-041 — Initial Bulk Catalog Composer + Versioned Supplier Intake —
   `Candidate / Ready / implementation not authorized`.

PBI-042 Images no pertenece al compromiso inicial y permanece Unassigned.

## Criterios de salida

- [x] PBI-040 Done candidate, Owner Accepted y no Released.
- [x] Alta individual y consulta por Branch demostradas con aislamiento y costo
  protegido.
- [x] PBI-041 obtiene DoR arquitectónica propia; permanece fuera del compromiso.
- [ ] PBI-041 sólo entra al compromiso con selección y autorización de
  implementación Owner propias.
- [ ] Si PBI-041 se autoriza, dos versiones (~1,500 filas sintéticas) prueban
  mapping histórico, reconciliación, publicación atómica y reporte sin
  unresolved/conflict/stale.
- [ ] Ningún ownership de Inventory, Procurement, Repair, Caja, Pedidos o
  Solicitudes se materializa.

## Próxima revisión

Al fusionar el cierre documental de PBI-040, seleccionar explícitamente otro
PBI o decidir el cierre de SPRINT-03.
