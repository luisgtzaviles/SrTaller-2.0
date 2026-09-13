# SPRINT-02 — Retrospectiva

- **Estado:** Complete candidate; Sprint Closed candidate.
- **Fecha:** 2026-09-12.

La fricción Owner demostró que una restricción técnicamente consistente puede
ser operativamente incorrecta. La corrección preservó atribución por Session y
convirtió la prueba multi-perfil real en gate material. La revisión
independiente también obligó a reemplazar timers por locks PostgreSQL
observables y a endurecer la telemetría Chrome antes de aceptar evidencia.

El despliegue confirmó que runtime y migraciones son gates separados: el nuevo
container falló cerrado ante esquema pendiente, el anterior siguió sano y una
migración one-shot exacta/idempotente permitió promover sin ocultar el error.
PBI-040 permanece congelado para reconciliación posterior, evitando mezclar
Access con Price List.

## Próxima revisión

- **Fecha:** al integrar este cierre documental.
- **Disparador:** CI exacta verde sobre su merge; no iniciar otro PBI por ese
  solo hecho.
