# PBI-028 — Definition of Ready

## Resultado

- **Fecha:** 2026-09-07.
- **Estado:** PASS.
- **PBI:** [PBI-028](../../../backlog/pbis/PBI-028.md).
- **Sprint:** SPRINT-02 — Operational Authentication & Authorization.
- **Tamaño:** Large, mediante T-shirt sizing.
- **Riesgo:** High, preservado sin downgrade.
- **Owner Start:** autorizado para el alcance acotado descrito aquí.
- **Released / deploy:** NO / NO.

## Dependencias

PBI-024, PBI-027, PBI-029, PBI-034 y PBI-026 están `Done` efectivos. En
particular, PBI-026 cerró mediante PR #36, merge
`0b39e3794a97c22d5471c0b6dfa278026f237b03` y CI exacto de `main`
`34161029937`, GREEN en run-1, run-2 y comparison. G4 está `PASS`.

## Alcance listo

- Auditoría autoritativa mínima y separada de logs técnicos y timeline.
- Primera prueba integral exclusivamente sobre `repairs.add_note`.
- Actor y contexto derivados server-side de `AuthorizedOperationalContext`:
  Tenant, Branch, Station, User y Operational Session.
- Correlation ID opaco generado por servidor, nunca usado como identidad,
  autorización o idempotency key.
- Un hecho de auditoría por efecto de negocio confirmado, con acción, recurso,
  timestamp, resultado y contexto allowlisted.
- Nota operacional y hecho de auditoría confirmados de forma atómica.
- Atribución histórica inmutable; el payload no decide actor ni contexto.

## Decisión acotada de auditoría

Para este slice, la autoridad Owner de inicio ratifica el mínimo de DEC-046:

1. Repairs es owner tanto del timeline como del store de auditoría acotado a
   `repairs.add_note`. Son representaciones semánticamente separadas y este
   slice no crea un módulo Audit global.
2. La nota y su hecho de auditoría se escriben en una misma transacción. Si la
   auditoría obligatoria falla, el efecto de negocio se revierte.
3. Sólo se persiste el resultado de negocio confirmado. Intentos denegados o
   fallidos pertenecen a seguridad/logging y no se presentan como hechos
   exitosos.
4. El hecho es append-only en la superficie de aplicación. No se crean puertos
   de update/delete.
5. En este MVP no existe eliminación automática, consulta/exportación de
   producto ni UI para el store acotado de Repairs. Retención legal, acceso
   productivo e integridad criptográfica siguen diferidos.
6. El registro usa allowlist y no contiene body de nota, PIN, credenciales,
   tokens, cookies, SQL, payload crudo ni PII innecesaria.

Esta decisión cierra DEC-046 sólo para el mínimo H1 demostrado por PBI-028; no
cierra DEC-056 ni observabilidad extendida.

## Exclusiones

- Métricas, tracing, dashboards, proveedor, SIEM y PBI-036.
- Política legal completa de retención, exportación o acceso administrativo.
- Auditoría de módulos o writes distintos de `repairs.add_note`.
- Retrofit general de D5/D6, Customers, Intake, finanzas o entrega.
- Enrollment productivo, deploy o infraestructura remota.

## Gates de entrada

- [x] Alcance y exclusiones explícitos.
- [x] Dependencias y G4 efectivos.
- [x] Tamaño `Large`.
- [x] Riesgo `High` aceptado para inicio, sin downgrade.
- [x] Threat model documentado.
- [x] Contrato de auditoría/correlación documentado.
- [x] Estrategia PostgreSQL, transaccional, idempotente y de aislamiento definida.
- [x] Owner Start explícito.
- [x] WIP=1; PBI-028 es el único PBI actual.

## Definition of Done esperada

La implementación deberá pasar pruebas unitarias, HTTP/security, arquitectura,
PostgreSQL material, concurrencia, idempotencia, aislamiento tenant/Branch y UI
focalizada; `pnpm run verify`; focused review; merge autorizado; CI exacto de
`main`; Owner Acceptance y cierre documental canónico. `Done` no significa
`Released`.
