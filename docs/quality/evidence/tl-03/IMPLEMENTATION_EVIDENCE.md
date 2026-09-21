# TL-03 — Implementation Evidence

## Resultado

Los ocho bloques autorizados están materializados y el candidato local queda
`READY_FOR_PROMOTION`. No existe autorización remota. No se implementaron
registro público, email, Branch lifecycle, Station enrollment, PIN,
Operational Session, UI administrativa ni TL-04.

## Implementación

| Frontera | Resultado |
|---|---|
| Tenant | Nombre visible, lifecycle `ONBOARDING | ACTIVE`, moneda server-owned `MXN`, versión y timestamps. |
| Backfill | Mapping explícito para `SR Taller`; cualquier Tenant legado no reconocido falla cerrado. |
| Idempotencia | Guard serializado por `verified_registration_id`, digest/revisión inmutables y journal append-only con resultado estable. |
| Atomicidad | Una transacción PostgreSQL `SERIALIZABLE` cubre Tenant, primer User, identidad/credential TL-02, Role, bundle, assignment, audit y journal. |
| Autoridad | Role `tenant_admin` system-managed, protegido, policy v1 y assignment tenant-wide; no existe `isAdmin` ni permiso directo. |
| Entrada | El command público interno acepta sólo `verifiedRegistrationId` y `correlationId`; el grant confiable aporta IDs y verifier server-owned. |
| Salida | Proyección allowlisted sin password, verifier, salt, email de lookup, terms payload, token, cookie ni Session. |
| Separación | Bootstrap no crea Admin Session, PIN ni Operational Session. El login administrativo posterior reutiliza TL-02. |

## Capability bundle v1

- `tenant.profile.read`, `tenant.profile.manage`;
- `branches.read`, `branches.manage`, `branches.deactivate`;
- `users.read`, `users.manage`;
- `access_matrix.read`, `access_matrix.manage`;
- `stations.read`, `stations.manage`;
- `stations.enrollment.issue`, `stations.enrollment.cancel`;
- `stations.revoke`, `stations.relink`.

El bundle contiene exactamente 15 capabilities administrativas. No contiene
capabilities de Repairs, Catalog, Caja, PIN ni otra operación del taller.

## Persistencia

Tres migraciones forward-only elevan el manifest a 79 migraciones:

- `20260921120000_tenancy_create_bootstrap_foundation`;
- `20260921121000_access_create_starter_tenant_admin_policy`;
- `20260921122000_tenancy_create_bootstrap_guards`.

PostgreSQL 18.4 probó primera aplicación, segunda ejecución con `0 pending`,
constraints, FKs/scopes, protección del Role y journal, y compatibilidad con
los suites materiales existentes.

## Proof material

- failure injection en los nueve límites durables: rollback completo;
- retry exitoso, replay tras timeout ambiguo y dos llamadas concurrentes:
  exactamente un bootstrap y un resultado durable;
- digest/revisión contradictorios: conflicto estable sin mutación;
- email normalizado duplicado: rechazo determinista sin Tenant huérfano;
- nombres de taller duplicados entre Tenants distintos: permitidos;
- Alfa/Beta: recursos, identity, Role y assignment permanecen aislados;
- Role system-managed: las rutas ordinarias de mutación fallan cerrado;
- audit allowlisted y append-only sin secretos ni payload genérico;
- login TL-02 posterior: PASS; Session implícita administrativa u operacional:
  ninguna.

## Verificación local

- typecheck y build: PASS;
- base `verify`: PASS con 999 pruebas, 35 skips PostgreSQL gobernados y cero
  fallos;
- arquitectura DEC-005, ownership DEC-049, estructura, configuración externa
  y UI foundation: PASS;
- PostgreSQL owner-scoped composite: 17/17 PASS;
- PBI-039: 2/2 PASS; PBI-040: 1/1 PASS; PBI-041: 10/10 PASS;
- TL-02 PostgreSQL: 2/2 PASS;
- TL-03 PostgreSQL: 3/3 PASS;
- Preview-like runtime, compiled backend y compiled UI smoke: PASS;
- `verify:full`: stages 0–15 PASS, cleanup y final fingerprint PASS;
- `git diff --check`: PASS.

Estos resultados locales no sustituyen CI remota, review independiente, merge,
exact-main CI ni deploy.
