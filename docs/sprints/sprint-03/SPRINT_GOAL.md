# SPRINT-03 — Price List Foundation

## Estado del documento

- **Sprint:** SPRINT-03.
- **Estado:** Closed candidate — PBI-040 Done; PBI-041 Done candidate.
- **Periodo:** TBD.
- **PBI actual:** NONE.
- **WIP:** 0/1.
- **Autoridad:** este Master Goal autoriza architecture/readiness y la apertura
  documental del Sprint. Owner autorizó implementar PBI-040 el 2026-09-11;
  el Master Goal de reanudación del 2026-09-12 autoriza reconciliar con el
  nuevo `main` y volver a Owner Review. El Master Goal de cierre de 2026-09-13
  registra Owner Acceptance y autoriza los gates técnicos, merge y Preview;
  Production permanece fuera de alcance. El Master Goal PBI-041 del
  2026-09-14 seleccionó el único WIP. La autorización maestra de promoción
  posterior cubrió verificación, integración, Preview y cierre gobernado;
  Production permanece fuera de alcance.

## Objetivo

Entregar una Lista de precios operable: un administrador registra identidades y
precios de forma individual y un empleado encuentra en segundos el precio
efectivo de su Branch, sobre una frontera preparada para actualizaciones masivas
sin mezclar inventario, reparaciones o Caja.

## Selección

1. PBI-040 — core vertical y búsqueda rápida — `Committed / Done / Released: NO`.
2. PBI-041 — Initial Bulk Catalog Composer + Versioned Supplier Intake —
   `Committed / Done candidate / Released: NO`.

PBI-042 Images no pertenece al compromiso inicial y permanece Unassigned.

## Criterios de salida

- [x] PBI-040 Done, Owner Accepted y no Released.
- [x] Alta individual y consulta por Branch demostradas con aislamiento y costo
  protegido.
- [x] PBI-041 obtiene DoR arquitectónica propia.
- [x] PBI-041 entra al compromiso con selección y autorización de
  implementación Owner propias hasta Owner Review.
- [x] Dos versiones (~1,500 filas sintéticas) prueban
  mapping histórico, reconciliación, publicación atómica y reporte sin
  unresolved/conflict/stale.
- [x] Ningún ownership de Inventory, Procurement, Repair, Caja, Pedidos o
  Solicitudes se materializa.
- [x] PBI-041 pasa Formal Re-Verification, PR #55/#56, revisión independiente,
  exact-main CI y Preview health/provenance/smoke.
- [x] Current PBI queda `NONE`, WIP `0/1` y no se selecciona siguiente PBI.

## Próxima revisión

Cuando el Owner seleccione explícitamente un nuevo candidato. No iniciar otro
PBI automáticamente.
