# ACTIVE CHECKLIST — PBI-040 IMPLEMENTATION

## Estado operativo

- **Milestone / meta funcional:** PRICE LIST FOUNDATION
- **Sprint:** SPRINT-03 — Active
- **PBI actual:** PBI-040 — Catalog & Pricing Core + Fast Price Lookup
- **Estado general:** Owner Review — checkpoint funcional preparado
- **Progreso:** 6 / 6 bloques de implementación completados
- **Trabajo actual:** revisión funcional Owner de `/listas/precios`
- **Siguiente bloque:** Owner Acceptance o remediación de feedback; los gates de
  PR/CI/merge continúan separados
- **Bloqueos:** ninguno
- **Última actualización:** 2026-09-11 18:17 MST

## Resultado visible esperado

Un administrador registra un artículo y sus precios; un empleado autorizado lo
encuentra por nombre, SKU o código y ve el precio efectivo de su Branch. El
costo sólo viaja con capability y preferencia personal explícita.

## Checklist

- [x] Revalidar baseline, autoridades, branch y alcance PBI-040.
- [x] Materializar módulo, contratos, migraciones, ownership y pruebas de datos.
- [x] Implementar autorización, preferencias, casos de uso y APIs.
- [x] Implementar alta/edición y Lista de precios en el shell.
- [x] Verificar aislamiento, concurrencia, migración, contratos UI, rendimiento y full verify.
- [x] Remediar, reconciliar evidencia/PBI/estado y entregar Owner Review.

## Gates preservados

- WIP 1/1; PBI-041 y PBI-042 no se inician.
- Branch: `feature/pbi-040-catalog-pricing-core`, desde `40684d7554…`.
- No merge, push, deploy, release o Production sin autoridad posterior.
- No ownership de Inventory, Procurement, Repair, Payments o Cash.
- No se debilitan assertions, scopes, capabilities ni aislamiento.
- La matriz visual Chrome real queda para Owner Review: la superficie browser
  nativa no estuvo disponible y no se fabricó evidencia.
