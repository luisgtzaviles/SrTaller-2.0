# PBI-033 — Definition of Ready

## Estado del documento

- **Estado:** PASS — readiness vigente para el scope exacto de PBI-033.
- **Autoridad:** ADR-012, DEC-063 y Master Goal Owner de Identity.
- **Alcance:** readiness; no acredita implementación, review, merge o release.

## Resultado

**PASS — READY (2026-09-06).** PBI-033 puede ejecutarse bajo el Master Goal de
Identity con riesgo High y tamaño Large. Este resultado no concede review,
merge, aceptación, `Done`, release ni deploy fuera de las reglas del Goal.

## Revisión

| Campo | Resultado |
|---|---|
| Objetivo y valor | PASS — roles y assignments persistentes completan la foundation de identidad necesaria antes de PIN/autorización. |
| Alcance | PASS — catálogo mínimo, starter roles, assignments y read models server-only. |
| Exclusiones | PASS — sin PIN, Session, enforcement PBI-026, autorización reforzada, editor productivo ni deploy. |
| Dependencia | PASS — PBI-032 `Done` mediante PR #27, merge `db6637ee6902b9b0e4a40ba39d7f203cb6889352` y CI `34074457695` GREEN. |
| Decisión aplicable | PASS — ADR-012 `Accepted`; DEC-005/049/050/051/063 aplicables. |
| Catálogo y roles | PASS — cuatro capability codes y tres starter roles cerrados para el checkpoint. |
| Multitenancy/Branch | PASS — Tenant obligatorio y alcance tenant-wide/branch-restricted definidos con negativos exigidos. |
| Persistencia/migración | PASS — cambios aditivos, rollback/reapply y PostgreSQL 18.4 material requeridos. |
| Concurrencia/idempotencia | PASS — replay, conflicto y `expectedVersion` incluidos en criterios. |
| Seguridad | PASS — threat model completo; fail-closed, mínimo privilegio y ausencia de autoridad por nombre/cliente. |
| Visual | N/A — no existe superficie HTTP/UI productiva en este slice para evitar un bypass antes de PBI-026. |
| Operación/release | N/A — sólo local/test y candidate; deploy/release explícitamente excluidos. |
| Pregunta Owner bloqueante | Ninguna; el Master Goal autoriza el modelo, starter roles, riesgo High y ejecución continua. |

## Metadatos de evaluación

| Campo | Valor |
|---|---|
| PBI | `PBI-033` |
| Resultado | `Ready` |
| Elementos no aplicables y justificación | UI/rollout no aplican: el slice es server-only, local/test y no expone administración productiva. |
| Preguntas bloqueantes | Ninguna. |
| Riesgos relevantes | High; modelados en el [threat model](./THREAT_MODEL.md) y autorizados por el Master Goal Owner de Identity. |
| Revisores | Codex primary agent con revisiones independientes de arquitectura, PostgreSQL y documentación. |
| Evidencia de revisión | Este expediente, el [threat model](./THREAT_MODEL.md) y la [evidencia candidata](./README.md). |

## Catálogo cerrado para el slice

- `users.read`
- `access_matrix.read`
- `repairs.read`
- `repairs.add_note`

No se predeclaran capabilities de módulos futuros. La selección de User previa
al PIN tampoco se disfraza como `sessions.start` ni como una autorización de
negocio.

## Evidencia esperada antes del focused review

- pruebas de dominio/aplicación positivas y negativas;
- PostgreSQL real para migración, referencias compuestas, rollback/reapply,
  aislamiento, alcance, concurrencia e idempotencia;
- arquitectura DEC-005 y ownership de persistencia;
- fixtures sintéticos deterministas y sin secretos;
- typecheck, build, `pnpm run verify`, `git diff --check` y secret scan;
- Draft PR CLEAN/MERGEABLE y CI autoritativo run-1/run-2/comparison GREEN sobre
  el HEAD exacto.

## Límite de autoridad

El PASS de DoR autoriza implementar únicamente PBI-033. PBI-025, PBI-026 y el
resto del Master Goal conservan WIP separado; no se inician por este documento.

## Próxima revisión

Reabrir DoR sólo si cambia el catálogo, el modelo de scope, la superficie
productiva, el riesgo o una dependencia material antes del focused review.
