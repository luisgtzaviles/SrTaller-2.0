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
- AD-05A/B, AD-07A/B y AD-11A/B/C con categoría interna única;
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
- elegibilidad de branch consultada sólo por contrato público tenant-scoped de
  `tenancy`;
- dos tenants con branch lógica coincidente;
- compare-and-swap y lost update;
- link/revoke concurrentes con lock común de station;
- efecto/revoke con ambos órdenes de adquisición controlados;
- commit/rollback en la misma conexión;
- `23505`, `23503`, `23514`, `40001`, `40P01`, `57014`;
- cleanup allowlisted sin objetos residuales.

## Arquitectura

- sólo `stations` accede `stations`/`station_bindings`;
- sólo `tenancy` posee identidad/elegibilidad de branch y su persistencia;
- `stations` consume branch sólo por `tenancy/index.ts`;
- el port/adapter temporal de branch queda reconciliado físicamente hacia
  `tenancy`;
- dominio/aplicación sin NestJS, Kysely o `pg`;
- otros módulos consumen sólo `stations/index.ts`;
- no entidad/repository/adapter exportado;
- no `BaseRepository`, query global, wildcard o raw SQL libre;
- no `RequestContext`, ALS, `@Global`, `ModuleRef` o service locator;
- no controller construye contexto;
- no raw station ID es fuente de confianza;
- graph `access → stations → tenancy` sin ciclo.

## Seguridad y contratos

- ejecutar AD-01–AD-20 y cada subcaso con sufijo;
- comparar envelope de unknown/unlinked/revoked/other-tenant;
- no exponer SQL, stack, path, constraint, IDs ajenos o evidence;
- no registrar credential/fingerprint/payload;
- no enumeración por code/details/header;
- context source sólo se produce internamente;
- retry sólo para unidad completa idempotente.

## Concurrencia

| Caso | Resultado |
| --- | --- |
| efecto adquiere station lock antes de revoke | efecto y commit confirman; revoke espera y confirma después |
| revoke adquiere station lock antes del efecto | revoke confirma; efecto observa Revoked/stale y no se ejecuta |
| contexto con revision stale | `STATION_CONTEXT_STALE` / Concurrency |
| revoke con binding abierto | binding cerrado, status Revoked y revision incrementada atómicamente |
| relink concurrente | sólo la secuencia con lock/revision vigente confirma |
| dos operaciones en la misma station | se serializan por el mismo row lock |
| operaciones en stations distintas | no se bloquean innecesariamente |
| rollback después de adquirir lock | libera lock y no conserva efecto ni cambios de lifecycle |
| fallo del efecto | rollback revierte la unidad completa |
| lock/revalidation con dos tenants | lookup permanece tenant-scoped y nunca bloquea/lee station ajena |
| deadlock detectado | retry acotado sólo para unidad completa idempotente |

Los tests usan barreras y dos conexiones reales sólo para ordenar adquisición,
nunca como sustituto de atomicidad. Deben registrar orden de adquisición,
callback ejecutado/no ejecutado, estado final, revision, binding y rollback.
No se usan sleeps como única sincronización.

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
