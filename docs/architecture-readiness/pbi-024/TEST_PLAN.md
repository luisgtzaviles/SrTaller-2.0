# Plan de pruebas de PBI-024

## Fixtures

- tenants A y B;
- branches A1/A2 y B1/B2;
- A1 y B1 comparten un `branchId` lógico cuando el schema lo permita;
- stations `Unlinked`, `Active` y `Revoked` por tenant;
- una station relinked con dos bindings históricos;
- revision actual y stale;
- evidencias trusted, ausente, inválida y manipulada;
- cero PII, secretos o datos reales.

UUIDs, instantes y barreras de concurrencia deben ser deterministas.

## Unitarias

- parse/brand de `StationId`;
- invariantes por estado;
- create/link/unlink/relink/revoke;
- transiciones prohibidas;
- revision monotónica;
- freeze y ausencia de mutación;
- códigos/categorías estables;
- mapping de señales conocidas/desconocidas.

## Aplicación

- resolve positivo;
- evidence ausente/inválida/manipulada;
- unknown/unlinked/revoked indistinguibles;
- payload tenant/branch contradictorio;
- binding/branch/tenant incoherentes;
- guard current y stale;
- relink invalida contexto anterior;
- revoke invalida resoluciones siguientes;
- background envelope parcial/stale;
- cero efectos cuando falla cualquier precondición.

## PostgreSQL `18.4`

- migración desde vacío, `down`, reapply y drift;
- PK/FK/check/nullability exactos;
- un solo binding abierto;
- historial no sobrescrito;
- CRUD owner-scoped mínimo;
- branch cross-tenant rechazada;
- dos tenants con branch lógica coincidente;
- compare-and-swap y lost update;
- link/revoke concurrentes;
- resolve/revoke con barreras controladas;
- commit/rollback en la misma conexión;
- `23505`, `23503`, `23514`, `40001`, `40P01`, `57014`;
- cleanup allowlisted sin objetos residuales.

## Arquitectura

- sólo `stations` accede `stations`/`station_bindings`;
- dominio/aplicación sin NestJS, Kysely o `pg`;
- otros módulos consumen sólo `stations/index.ts`;
- no entidad/repository/adapter exportado;
- no `BaseRepository`, query global, wildcard o raw SQL libre;
- no `RequestContext`, ALS, `@Global`, `ModuleRef` o service locator;
- no controller construye contexto;
- no raw station ID es fuente de confianza;
- graph `access → stations → tenancy` sin ciclo.

## Seguridad y contratos

- ejecutar AD-01–AD-20;
- comparar envelope de unknown/unlinked/revoked/other-tenant;
- no exponer SQL, stack, path, constraint, IDs ajenos o evidence;
- no registrar credential/fingerprint/payload;
- no enumeración por code/details/header;
- context source sólo se produce internamente;
- retry sólo para unidad completa idempotente.

## Concurrencia

| Caso | Resultado |
| --- | --- |
| dos links con misma revision | uno confirma; otro Concurrency |
| unlink y revoke simultáneos | una transición confirma; otra stale |
| resolve antes de revoke | contexto válido sólo para unidad ya revalidada |
| resolve después de revoke | Authentication genérica |
| relink y guard de revision anterior | guard stale |
| deadlock/serialization | retry acotado sólo en harness idempotente |

No se usan sleeps como única sincronización; se emplean barreras y dos
conexiones reales.

## CI

El cambio de contexto/persistencia es riesgo alto y activa:

1. frozen install;
2. architecture;
3. typecheck;
4. build;
5. unit/contract/application;
6. PostgreSQL real;
7. negativos multitenant;
8. mutaciones críticas;
9. smoke compilado;
10. cleanup;
11. `run-1`;
12. `run-2`;
13. `comparison`;
14. artifacts y manifest sanitizados.

## Criterio de PASS

- cero fallos;
- cero skips en suites críticas;
- todas las mutaciones muertas;
- PostgreSQL exacto;
- cleanup PASS;
- run-1/run-2 equivalentes;
- cada criterio enlaza evidencia.

Un solo acceso cross-tenant, contexto producido desde input cliente, revision
stale aceptada o error sensible expuesto produce `FAIL`.
