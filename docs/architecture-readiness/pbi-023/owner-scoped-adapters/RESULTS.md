# Resultados

## Dictamen

**PASS — PBI-023 OWNER-SCOPED PERSISTENCE VERIFIED**

## Gap analysis

Tenancy/stations tenían sólo marker/module. Los paths de ports/adapters ya
estaban `future-approved`; no había ID nominal, contrato, adapter ni forma
estrecha de ejecutar una query ordinaria o transaction-bound. El transaction
runner sí ligaba un executor a un contexto gobernado, pero sólo su capability
interna podía recuperarlo.

Se materializó una capability database interna que discrimina el schema por
owner y es consumible únicamente por connection y los dos adapters. No se
creó database service general. D5-R044 se ajustó para inspeccionar el contrato
registrado y aceptar IDs nominales string-backed.

## Implementación

| Superficie | Resultado |
|---|---|
| TenantId/BranchId | nominales, no intercambiables |
| Tenant port | create/find/exists |
| Branch port | create/find/list/exists |
| Tenant adapter | sólo `tenants` |
| Branch adapter | sólo `branches`, siempre tenant-scoped |
| Transaction mode | contexto existente, sin nesting/commit/rollback público |
| Error mapping | stable, typed, sanitized |
| Delete/update | no autorizados; ausentes |
| API pública | sólo TenantId/parser necesarios; adapters no barrel |

## PostgreSQL

- versión `18.4`, UTF8/UTC;
- imagen oficial por digest;
- migración productiva hash
  `fe90675625ea189387e5bcdb888ee6a38107a6395931b20e2873b0a83bd105e8`;
- dos runs aislados;
- comparación material `MATCH`;
- material SHA-256
  `9a765cc60dc185479a8d07825afeaa67d9c8415c95eb3d710480b49ed61a49be`;
- cleanup `PASS`.

CRUD mínimo, duplicate simple/compuesto, FK tenant, mismo branch ID entre
tenants, cross-tenant read, listas, commit, rollback, serializable, nesting,
context expiry y duplicate concurrente pasaron.

## Gates

| Gate | Resultado |
|---|---|
| unit ports/adapters | PASS — 7/7 |
| owner architecture tests | PASS — 4/4 |
| PostgreSQL adapter suite | PASS — 2 runs / MATCH |
| `pnpm install --frozen-lockfile` | PASS; package/lock sin cambio |
| `pnpm run architecture` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm test` | PASS — 330 pass, 10 gated skips, 0 fail |
| `pnpm run test:architecture` | PASS — 261/261 |
| `pnpm run verify` | PASS |
| `pnpm run smoke:start` | PASS |
| `git diff --check` | PASS |
| links/JSON/secrets | PASS |

Fixtures/mutaciones de producto permanecen en 160/40; no se agregó regla
D5 nueva porque D5-R037/R039/R040/R041/R043/R044/R045/R046/R047/R048 ya
cubren el boundary. Se fortaleció D5-R044 sin deshabilitar controles.

## Gobierno

| Elemento | Resultado |
|---|---|
| DEC-049 C01–C07 | evidencia material local de owner, write authority, repository específico, scope, errores, transacción y manifest; CI pendiente |
| DEC-050 | schema/migración intactos; migración usada realmente por suite; operación/promoción siguen pendientes |
| DEC-051 C02 | pendiente hasta primer merge funcional bajo checks requeridos |
| DEC-051 C03 | parcial: PostgreSQL real local; CI autoritativa pendiente |
| DEC-051 C04 | aislamiento adapter/query materialmente verificado local |
| DEC-051 C06 | boundaries/checker/runtime coinciden localmente |
| DEC-055 | sin cambio material |
| DEC-063 | C02/C05/C06 ganan evidencia; release/waiver gates no se cierran |
| PBI-023 | `Ready — owner-scoped persistence verified / PostgreSQL CI gate authorized` |

## Preservación

Package, lock, workflows, AppModule, bootstrap, Dockerfile, migración y módulos
ajenos conservan sus hashes de entrada. No hubo endpoints, controllers, DTO
HTTP, wiring Nest, tabla/migración nueva, RLS, repository genérico,
dependencia, merge, deploy ni SSH.

## Gate siguiente

Paso 11 — PostgreSQL `18.4` autoritativo en CI. El PR continúa Draft y PBI-023
no queda `Done`.
