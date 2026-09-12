# ACTIVE CHECKLIST — LOCAL/PREVIEW REPAIR DETAIL PARITY

## Estado operativo

- **Milestone / meta funcional:** PBI-039 REPAIR DETAIL BASELINE PRESERVATION
- **Sprint:** SPRINT-03 — Active
- **PBI actual:** PBI-040 — Catalog & Pricing Core + Fast Price Lookup
- **Estado general:** Causa A/D confirmada y fixture canónico materializado; validación runtime final en progreso
- **Progreso:** 3 / 5 bloques completados
- **Trabajo actual:** ejecutar el guard runtime con el mismo read model sobre Preview y Local.
- **Siguiente bloque:** reconciliar evidencia final y dejar las dos pestañas activas para Owner.
- **Bloqueos:** ninguno confirmado
- **Última actualización:** 2026-09-12 15:03 MST

## Resultado esperado

Demostrar paridad funcional de Repair Detail entre `preview.srtaller.dev` y
`127.0.0.1:4173` con el mismo fixture sintético gobernado, añadir una protección
permanente de read model, estructura y provenance, y dejar ambas superficies
abiertas para revisión Owner lado a lado.

## Checklist

- [x] Reconciliar autoridades, branch, runtime y estado del goal.
- [x] Capturar y comparar read models y DOM efectivos; clasificar cada diferencia.
- [x] Materializar un fixture sintético determinista equivalente en ambos runtimes.
- [~] Corregir la capa causal y añadir el guard permanente de paridad.
- [ ] Ejecutar gates, reconciliar evidencia y dejar dos pestañas listas para Owner.

## Gates preservados

- WIP 1/1; PBI-041 y PBI-042 no se inician.
- PBI-040 permanece sin Owner Acceptance y no se declara `Done`.
- No se modifica Price List ni se cambia visualmente Repair Detail para ocultar
  una divergencia que pertenezca a datos, fixture, build o runtime.
- No push, PR, merge, deploy ni release.
- La prueba final usa la misma estructura de datos; no compara dos reparaciones
  operativamente distintas como si fueran equivalentes.
