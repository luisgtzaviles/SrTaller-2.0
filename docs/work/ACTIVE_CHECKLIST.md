# ACTIVE CHECKLIST — PBI-040 RUNTIME PROVENANCE

## Estado operativo

- **Milestone / meta funcional:** PRICE LIST FOUNDATION
- **Sprint:** SPRINT-03 — Active
- **PBI actual:** PBI-040 — Catalog & Pricing Core + Fast Price Lookup
- **Estado general:** Runtime provenance PASS; listo para revisión Owner
- **Progreso:** 5 / 5 bloques de auditoría completados
- **Trabajo actual:** checkpoint entregable; producto permanece congelado.
- **Siguiente bloque:** Owner Review; no iniciar PBI-041 ni otro trabajo sin autoridad.
- **Bloqueos:** ninguno
- **Última actualización:** 2026-09-12 14:23 MST

## Resultado esperado

Determinar qué SHA, worktree, procesos, backend y assets ejecutan Preview y
local; materializar localmente la versión funcional aceptada de PBI-039 con las
adiciones válidas de PBI-040, sin modificar producto.

## Checklist

- [x] Reconciliar autoridades, branch, baseline PBI-039 y estado de PBI-040.
- [x] Identificar SHA/proceso/build real de Preview y frontend/backend local.
- [x] Comparar Repair Detail runtime a runtime con datos equivalentes.
- [x] Remediar únicamente runtime/build stale o autoridad de provenance.
- [x] Añadir guard permanente, ejecutar gates y reconciliar evidencia final.

## Gates preservados

- WIP 1/1; PBI-041 y PBI-042 no se inician.
- Branch: `feature/pbi-040-catalog-pricing-core`, desde `40684d7554…`.
- PBI-040 no está Owner Accepted; la iteración de producto está detenida.
- La auditoría previa de blobs sigue como evidencia histórica, no como prueba
  suficiente de runtime: `docs/quality/evidence/pbi-040/BASELINE_PRESERVATION_AUDIT.md`.
- El Master Goal vigente exige provenance material de build/runtime antes de
  volver a Owner Review.
- Preview exacto: `0d1c5760ce962d17a8292b841f5de43a8cb453a7`, demostrado
  por checkout/imagen/assets y rebuild byte-identical.
- Full Verification del guard: `13/13 PASS` sobre `52679c2`; imagen OCI local
  también PASS. El SHA final de frontend/backend se consulta en runtime.
- No merge, push, deploy, release o Production sin autoridad posterior.
- No ownership de Inventory, Procurement, Repair, Payments o Cash.
- No se debilitan assertions, scopes, capabilities ni aislamiento.
- La revisión Chrome humana anterior produjo esta iteración; la nueva aceptación
  permanece exclusivamente con Owner y no se infiere de tests.
