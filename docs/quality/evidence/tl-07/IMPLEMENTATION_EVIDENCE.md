# TL-07 — Implementation Evidence

## Resultado

La implementación materializa Station Inventory V1 y la autoridad de
enrollment administrativa sin crear una vía alternativa de confianza. La
redemption productiva permanece reservada a TL-08.

## Implementación

| Frontera | Resultado |
|---|---|
| Inventario | List/read tenant-scoped y branch-scoped, nombre visible, lifecycle `ACTIVE | UNLINKED | REVOKED`, estado seguro de Branch/credential, versión, admission revision e historial. |
| Enrollment | Issue Level 2 y cancel Level 1; Branch/nombre inmutables, TTL 10 minutos, secreto de 32 bytes, QR + código manual, digest-only y one-time response. |
| Lifecycle | Rename Level 1; unlink, relink y revoke Level 2. Unlink/relink cortan trust antes de recovery; revoke es terminal. |
| Trust | Credencial vigente única, binding abierto único, verifier de estado actual y revocación material de Operational Sessions. |
| Autorización | Capabilities existentes, Tenant desde Admin Context y scope exacto de todas las Branches afectadas; sin `isAdmin`. |
| HTTP/UI | `/api/admin/stations`, acciones allowlisted y superficie `Administración -> Dispositivos`; no existe endpoint ni UI de redemption. |

## Persistencia y migración

Una migración aditiva eleva el manifest a 89:

- `20260922130000_stations_create_inventory_enrollment_authority`.

Materializa nombre/versión/lifecycle de Station, historial append-only de
bindings, constraints de credential actual, challenges, journal idempotente y
audit allowlisted. El backfill aplica únicamente:

`00000000-0000-4000-8000-000000000401`
-> `SR Taller Fixture — Dispositivo 1`.

Cualquier otro legacy sin nombre falla cerrado. La Station fixture conserva
su Branch, credencial, estado y timestamps históricos. La segunda ejecución de
migraciones devuelve `0 pending`.

## Seguridad y audit

- inventory/audit nunca devuelven secreto o digest de Station, PIN, password,
  Session bearer, cookie ni enrollment token;
- issue genera autoridad server-owned de alta entropía y persiste sólo digest;
- cancel, replay, request ID con payload distinto, challenge vencido y
  authority stale fallan cerrado;
- unlink/relink/revoke cierran binding, revocan credential y Operational
  Sessions, avanzan admission revision y preservan historia;
- audit allowlisted registra issue/cancel, rename, unlink, relink, revoke,
  credential revoke, invalidación de Sessions y cambio de revision con una
  correlation server-owned, sin payload libre;
- Alfa/Beta y guessed Station/Branch/challenge IDs están aislados.

## Proof material PostgreSQL

- TL-07 PostgreSQL 18.4: `3/3` PASS;
- migraciones: 89; rerun: `0 pending`;
- exact legacy mapping y trust preservado: PASS;
- list/read/rename, issue/cancel, TTL, replay e idempotencia: PASS;
- Branch scope tenant-wide/restricted y A+B exactos para relink: PASS;
- unlink/relink/revoke invalidan credential, binding, Sessions y PIN/trusted
  context: PASS;
- Branch inactiva y cross-Tenant: DENIED;
- concurrencia y audit correlacionado: PASS.

## UI y accesibilidad

Chrome material PASS en desktop, 768 y 640, temas claro/oscuro, Tab/Shift+Tab,
Escape y restore focus. No existe overflow horizontal. Se emitió y canceló una
autoridad sintética local; QR y código manual representaron la misma autoridad
y el plaintext dejó de ser recuperable al cerrar. No se alteró la Station
existente ni se transmitió una credencial productiva.

## Verificación local

- Node.js `24.18.0` y pnpm `11.15.1`: PASS;
- build, typecheck, arquitectura/ownership, workflow y contratos HTTP/UI: PASS;
- regresiones focalizadas estáticas: `49/49` PASS;
- TL-07 PostgreSQL 18.4: `3/3` PASS;
- `/livez`, `/readyz` y frontend local: `200`;
- `git diff --check`: PASS;
- `verify` y `verify:full`: requeridos sobre el candidato final antes de
  promoción; el reporte local final conserva la evidencia exacta del HEAD.

Estos resultados no sustituyen CI remota, review deliberado, merge,
exact-main CI ni deploy.
