# ACTIVE CHECKLIST — PBI-040 IMPLEMENTATION

## Estado operativo

- **Milestone / meta funcional:** PRICE LIST FOUNDATION
- **Sprint:** SPRINT-03 — Active
- **PBI actual:** PBI-040 — Catalog & Pricing Core + Fast Price Lookup
- **Estado general:** Checkpoint preparado — Owner Review pendiente
- **Progreso:** 5 / 5 bloques de la iteración completados
- **Trabajo actual:** ninguno de ingeniería; esperando comparación y revisión Owner.
- **Siguiente bloque:** Owner compara ambos módulos de Catálogos y confirma o devuelve feedback.
- **Bloqueos:** ninguno
- **Última actualización:** 2026-09-11 21:05 MST

## Resultado visible esperado

Un administrador registra un artículo y sus precios; un empleado autorizado lo
encuentra por nombre, SKU o código y ve el precio efectivo de su Branch. El
costo sólo viaja con capability y preferencia personal explícita.

## Checklist

- [x] Revalidar decisión Owner, autoridades, baseline y contrato vigente.
- [x] Auditar las fuentes autoritativas, scopes, queries y fixtures de Repairs.
- [x] Alinear fixtures locales sin crear una segunda fuente de catálogo.
- [x] Converger Lista de precios al patrón visual compartido de Catálogos.
- [x] Validar Repairs/New Repair, responsive, temas, gates y comparación Owner.

## Gates preservados

- WIP 1/1; PBI-041 y PBI-042 no se inician.
- Branch: `feature/pbi-040-catalog-pricing-core`, desde `40684d7554…`.
- Checkpoint local de identificadores: `a66ff4a`; no integrado ni enviado.
- No merge, push, deploy, release o Production sin autoridad posterior.
- No ownership de Inventory, Procurement, Repair, Payments o Cash.
- No se debilitan assertions, scopes, capabilities ni aislamiento.
- La revisión Chrome humana anterior produjo esta iteración; la nueva aceptación
  permanece exclusivamente con Owner y no se infiere de tests.
