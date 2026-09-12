# ACTIVE CHECKLIST — PBI-040 RUNTIME PROVENANCE

## Estado operativo

- **Milestone / meta funcional:** PRICE LIST FOUNDATION
- **Sprint:** SPRINT-03 — Active
- **PBI actual:** PBI-040 — Catalog & Pricing Core + Fast Price Lookup
- **Estado general:** Auditoría de provenance en curso; trabajo de producto detenido
- **Progreso:** 0 / 5 bloques de auditoría completados
- **Trabajo actual:** reconciliar autoridad, runtimes y builds reales de Preview/local.
- **Siguiente bloque:** comparar Repair Detail runtime a runtime con datos controlados.
- **Bloqueos:** ninguno confirmado; discrepancia visual Owner bajo investigación
- **Última actualización:** 2026-09-12 00:00 MST

## Resultado esperado

Determinar qué SHA, worktree, procesos, backend y assets ejecutan Preview y
local; materializar localmente la versión funcional aceptada de PBI-039 con las
adiciones válidas de PBI-040, sin modificar producto.

## Checklist

- [~] Reconciliar autoridades, branch, baseline PBI-039 y estado de PBI-040.
- [ ] Identificar SHA/proceso/build real de Preview y frontend/backend local.
- [ ] Comparar Repair Detail runtime a runtime con datos equivalentes.
- [ ] Remediar únicamente runtime/build stale o autoridad de provenance.
- [ ] Añadir guard permanente, ejecutar gates y reconciliar evidencia final.

## Gates preservados

- WIP 1/1; PBI-041 y PBI-042 no se inician.
- Branch: `feature/pbi-040-catalog-pricing-core`, desde `40684d7554…`.
- PBI-040 no está Owner Accepted; la iteración de producto está detenida.
- La auditoría previa de blobs sigue como evidencia histórica, no como prueba
  suficiente de runtime: `docs/quality/evidence/pbi-040/BASELINE_PRESERVATION_AUDIT.md`.
- El Master Goal vigente exige provenance material de build/runtime antes de
  volver a Owner Review.
- No merge, push, deploy, release o Production sin autoridad posterior.
- No ownership de Inventory, Procurement, Repair, Payments o Cash.
- No se debilitan assertions, scopes, capabilities ni aislamiento.
- La revisión Chrome humana anterior produjo esta iteración; la nueva aceptación
  permanece exclusivamente con Owner y no se infiere de tests.
