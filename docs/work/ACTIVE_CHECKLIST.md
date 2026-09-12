# ACTIVE CHECKLIST — LOCAL/PREVIEW REPAIR DETAIL PARITY

## Estado operativo

- **Milestone / meta funcional:** PBI-039 REPAIR DETAIL BASELINE PRESERVATION
- **Sprint:** SPRINT-03 — Active
- **PBI actual:** PBI-040 — Catalog & Pricing Core + Fast Price Lookup
- **Estado general:** Paridad material PASS; preparación final de pestañas Owner en progreso
- **Progreso:** 5 / 5 bloques completados
- **Trabajo actual:** mantener Preview y Local abiertos con el fixture canónico idéntico.
- **Siguiente bloque:** revisión visual lado a lado por Owner; sin inferir aceptación.
- **Bloqueos:** ninguno confirmado
- **Última actualización:** 2026-09-12 15:10 MST

## Resultado esperado

Demostrar paridad funcional de Repair Detail entre `preview.srtaller.dev` y
`127.0.0.1:4173` con el mismo fixture sintético gobernado, añadir una protección
permanente de read model, estructura y provenance, y dejar ambas superficies
abiertas para revisión Owner lado a lado.

## Checklist

- [x] Reconciliar autoridades, branch, runtime y estado del goal.
- [x] Capturar y comparar read models y DOM efectivos; clasificar cada diferencia.
- [x] Materializar un fixture sintético determinista equivalente en ambos runtimes.
- [x] Corregir la capa causal y añadir el guard permanente de paridad.
- [x] Ejecutar gates, reconciliar evidencia y dejar dos pestañas listas para Owner.

## Gates preservados

- WIP 1/1; PBI-041 y PBI-042 no se inician.
- PBI-040 permanece sin Owner Acceptance y no se declara `Done`.
- No se modifica Price List ni se cambia visualmente Repair Detail para ocultar
  una divergencia que pertenezca a datos, fixture, build o runtime.
- No push, PR, merge, deploy ni release.
- La prueba final usa la misma estructura de datos; no compara dos reparaciones
  operativamente distintas como si fueran equivalentes.
