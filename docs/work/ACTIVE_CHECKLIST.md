# ACTIVE CHECKLIST — PBI-040 IMPLEMENTATION

## Estado operativo

- **Milestone / meta funcional:** PRICE LIST FOUNDATION
- **Sprint:** SPRINT-03 — Active
- **PBI actual:** PBI-040 — Catalog & Pricing Core + Fast Price Lookup
- **Estado general:** In progress — Owner implementation authorization received
- **Progreso:** 0 / 6 bloques completados
- **Trabajo actual:** contratos, datos y seguridad de Catalog/Pricing
- **Siguiente bloque:** casos de uso/APIs y administración individual
- **Bloqueos:** ninguno
- **Última actualización:** 2026-09-11 17:10 MST

## Resultado visible esperado

Un administrador registra un artículo y sus precios; un empleado autorizado lo
encuentra por nombre, SKU o código y ve el precio efectivo de su Branch. El
costo sólo viaja con capability y preferencia personal explícita.

## Checklist

- [~] Revalidar baseline, autoridades, branch y alcance PBI-040.
- [ ] Materializar módulo, contratos, migraciones, ownership y pruebas de datos.
- [ ] Implementar autorización, preferencias, casos de uso y APIs.
- [ ] Implementar alta/edición y Lista de precios en el shell.
- [ ] Verificar aislamiento, concurrencia, migración, UI, rendimiento y full verify.
- [ ] Remediar, reconciliar evidencia/PBI/estado y entregar Owner Review.

## Gates preservados

- WIP 1/1; PBI-041 y PBI-042 no se inician.
- Branch: `feature/pbi-040-catalog-pricing-core`, desde `40684d7554…`.
- No merge, push, deploy, release o Production sin autoridad posterior.
- No ownership de Inventory, Procurement, Repair, Payments o Cash.
- No se debilitan assertions, scopes, capabilities ni aislamiento.
