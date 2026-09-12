# ACTIVE CHECKLIST — PRICE LIST DOMAIN DISCOVERY

## Estado operativo

- **Milestone / meta funcional:** PRICE LIST DOMAIN DISCOVERY
- **Sprint:** SPRINT-02 continuó como referencia canónica; no se seleccionó ni inició otro Sprint
- **PBI actual:** ninguno para Lista de precios; PBI-039 materializó su cierre en `main`
- **Estado general:** discovery profundo terminado; entregado para Owner Review
- **Progreso:** 6 / 6 bloques de discovery completados
- **Trabajo actual al archivar:** Owner Review del documento de discovery
- **Siguiente bloque registrado:** decisiones Owner PLD-001 a PLD-008 y PLD-018; sin implementación automática
- **Bloqueos:** ninguno
- **Última actualización:** 2026-09-11 15:16 MST
- **Archivado:** 2026-09-11 por inicio autorizado de `PRICE LIST ARCHITECTURE + PBI READINESS`

## Resultado visible alcanzado

Se entregó un documento Owner-readable que permite decidir la frontera del
catálogo, precios, costos, sucursales e importación masiva antes de abrir un PBI
de implementación.

## Checklist

- [x] Reconciliar `main`, el estado Git y la documentación canónica vigente.
- [x] Auditar la implementación equivalente de SR Taller 1.0.
- [x] Auditar la implementación equivalente de ENL.
- [x] Mapear el modelo actual y los contratos de integración de SR Taller 2.0.
- [x] Comparar los antecedentes y formular el modelo recomendado.
- [x] Redactar, verificar y entregar el discovery para Owner Review.

## Evidencia de verificación

- `main` y `origin/main`: `40684d7554cdf02551f941e5e3f0beabbe563125`.
- Authoritative Linux CI exacta: run `34623060504`, `SUCCESS`.
- Cobertura editorial: 21 secciones solicitadas presentes.
- Documento: 1,000+ líneas, 17 notas de fuente y cortes Git explícitos.
- `git diff --check`: PASS.
- `verify:structure`: PASS.
- `verify:architecture`: PASS; policy 8.

## Límites preservados

- No se escribió código de producto.
- No se crearon migraciones.
- No se modificó arquitectura.
- No se abrió ni declaró `Ready` un PBI de implementación.
- No se seleccionó automáticamente el siguiente Sprint.
- Sólo `Lista de precios` quedó en alcance inmediato; `Pedidos` y
  `Solicitudes de clientes` permanecieron como contextos futuros.
