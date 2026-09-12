# ACTIVE CHECKLIST — PBI-040 BASELINE PRESERVATION

## Estado operativo

- **Milestone / meta funcional:** PRICE LIST FOUNDATION
- **Sprint:** SPRINT-03 — Active
- **PBI actual:** PBI-040 — Catalog & Pricing Core + Fast Price Lookup
- **Estado general:** Gate de preservación PASS — listo para Owner Review
- **Progreso:** 5 / 5 bloques de auditoría completados
- **Trabajo actual:** checkpoint detenido para revisión Owner.
- **Siguiente bloque:** Owner Review; no iniciar otro PBI automáticamente.
- **Bloqueos:** ninguno; D/regresión = 0 y E/desconocida = 0
- **Última actualización:** 2026-09-11 21:33 MST

## Resultado esperado

Demostrar con Git, código, persistencia y pruebas que PBI-040 extiende el
baseline integrado `40684d7554…` sin degradar PBI-039, o mantener el PBI
bloqueado hasta remediar cualquier regresión o decisión fuera de autoridad.

## Checklist

- [x] Reconstruir genealogía, merge-base, ancestry y commits exclusivos.
- [x] Clasificar el diff funcional de superficies PBI-039 protegidas.
- [x] Auditar Detail, linkage canónico, Uso, safe delete y fixtures.
- [x] Remediar ambigüedad de fixtures/Uso y añadir guard permanente.
- [x] Ejecutar gates, repetir auditoría y reconciliar evidencia final.

## Gates preservados

- WIP 1/1; PBI-041 y PBI-042 no se inician.
- Branch: `feature/pbi-040-catalog-pricing-core`, desde `40684d7554…`.
- PBI-040 no está Owner Accepted; la iteración de producto está detenida.
- Auditoría canónica: `docs/quality/evidence/pbi-040/BASELINE_PRESERVATION_AUDIT.md`.
- Full Verification: `13/13 PASS` sobre código `453eeb0`; Stage 0 confirmó
  baseline `40684d7…`, `origin/main` actual y 16 superficies protegidas.
- No merge, push, deploy, release o Production sin autoridad posterior.
- No ownership de Inventory, Procurement, Repair, Payments o Cash.
- No se debilitan assertions, scopes, capabilities ni aislamiento.
- La revisión Chrome humana anterior produjo esta iteración; la nueva aceptación
  permanece exclusivamente con Owner y no se infiere de tests.
