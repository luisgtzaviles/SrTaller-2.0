# ACTIVE CHECKLIST — PBI-040 IMPLEMENTATION

## Estado operativo

- **Milestone / meta funcional:** PRICE LIST FOUNDATION
- **Sprint:** SPRINT-03 — Active
- **PBI actual:** PBI-040 — Catalog & Pricing Core + Fast Price Lookup
- **Estado general:** Checkpoint preparado — Owner Review pendiente
- **Progreso:** 5 / 5 bloques de la iteración completados
- **Trabajo actual:** ninguno de ingeniería; esperando revisión Owner
- **Siguiente bloque:** Owner evalúa la cascada real y acepta o devuelve feedback
- **Bloqueos:** ninguno
- **Última actualización:** 2026-09-11 20:15 MST

## Resultado visible esperado

Un administrador registra un artículo y sus precios; un empleado autorizado lo
encuentra por nombre, SKU o código y ve el precio efectivo de su Branch. El
costo sólo viaja con capability y preferencia personal explícita.

## Checklist

- [x] Revalidar feedback Owner, autoridades, baseline y patrones existentes.
- [x] Exponer sólo compatibilidades comerciales conocidas y filtrar la búsqueda server-side por Tipo.
- [x] Integrar Buscar | Tipo | Categoría | Marca con URL y resets deterministas.
- [x] Verificar cascada, búsqueda combinada, cero resultados, autorización de costo y regresiones.
- [x] Reconciliar evidencia/documentación y dejar Chrome listo para Owner Review.

## Gates preservados

- WIP 1/1; PBI-041 y PBI-042 no se inician.
- Branch: `feature/pbi-040-catalog-pricing-core`, desde `40684d7554…`.
- No merge, push, deploy, release o Production sin autoridad posterior.
- No ownership de Inventory, Procurement, Repair, Payments o Cash.
- No se debilitan assertions, scopes, capabilities ni aislamiento.
- La revisión Chrome humana anterior produjo esta iteración; la nueva aceptación
  permanece exclusivamente con Owner y no se infiere de tests.
