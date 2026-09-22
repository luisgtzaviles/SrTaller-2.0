# TL-06 — Implementation Evidence

## Resultado

Los ocho bloques autorizados están materializados. El candidato conserva un
solo `User` tenant-scoped, separa Admin Session de Operational Session y no
introduce permisos directos por User, `isAdmin`, PIN automático ni email
administrativo obligatorio para Users operativos.

## Implementación

| Frontera | Resultado |
|---|---|
| Invitaciones | Lifecycle `PENDING -> ACCEPTED / EXPIRED / REVOKED`, challenge digest-only, TTL 24 h, resend con supersession, replay e idempotencia. |
| Identidad | La persona invitada establece su password; se reutilizan política, Argon2id, pepper e identidad TL-02. La aceptación no crea Admin Session. |
| Roles | Lista, creación/edición/lifecycle de `TENANT_MANAGED`, múltiples assignments y unión de capabilities; `tenant_admin` permanece `SYSTEM_MANAGED` y protegido. |
| Autorización | `users.read/manage` y `access_matrix.read/manage`, Tenant desde Admin Context, scope Branch revalidado y backend como autoridad final. |
| Último Admin | Mutaciones sensibles usan aislamiento serializable, lock común y validación post-mutación para conservar al menos un Tenant Admin efectivo. |
| Level 2 | Grants/revocations administrativas, deactivation y cambios protegidos reutilizan reauth TL-02 vigente por 10 minutos. |
| Email | Reutiliza el transporte local/test y Resend TL-04; dispatch durable, retry sanitizado y sin duplicar provider abstraction. |
| HTTP/UI | Admin Users, Roles e invitaciones en el shell TL-05; aceptación pública separada y focus-managed. |

## Persistencia y ownership

Cuatro migraciones aditivas elevan el manifest a 88:

- `20260921200000_access_create_admin_invitations`;
- `20260921201000_access_enable_admin_role_lifecycle`;
- `20260921202000_access_enforce_global_pending_invitation_email`.
- `20260922090000_access_bound_admin_invitation_challenge_expiry`.

Access conserva la transacción de aceptación, pero las comprobaciones o writes
de Tenant, User y Branch pasan por puertos owner-scoped de Tenancy, Users y
Stations. DEC-005 policy 10 verifica esos límites; no existe acceso directo
cross-owner desde el repositorio de invitaciones.

La segunda ejecución de migraciones devuelve `0 pending`. No se fabricaron
emails, PINs, Roles ni assignments para datos existentes.

## Seguridad y audit

- challenge/token se persiste únicamente como digest y nunca aparece en audit;
- password, hash, pepper, PIN, Session token, cookie, CSRF, headers y payload
  libre no forman parte de eventos ni respuestas;
- la aceptación revalida Tenant activo, issuer/User/Identity/credential,
  capabilities, revisión de autoridad, Role/version y Branch scope dentro de
  la transacción;
- los eventos lifecycle son append-only y allowlisted;
- Alpha/Beta y Branch ajeno fallan cerrado;
- invitaciones concurrentes/replay no duplican identidad ni authority.

## Proof material

- issue, resend, supersession, revoke, expiry, replay y aceptación: PASS;
- contraseña propia y Admin login posterior sin crossover de Session: PASS;
- admin-only, operational-only y User combinado: PASS;
- Roles múltiples, capability union, protected Role y ausencia de permisos
  directos: PASS;
- carrera concurrente entre dos Admins deja exactamente un Admin efectivo:
  PASS;
- reauth ausente/expirada y capability ausente: DENIED;
- cross-Tenant User/Role/Branch guesses: DENIED;
- provider failure/retry y redacción de secretos: PASS.

## UI y accesibilidad

Chrome material PASS en desktop, 768 y 640, temas claro/oscuro, Tab/Shift+Tab,
Escape, restore focus, labels y controles nativos, sin clipping, superposición
ni overflow horizontal de página. La aceptación pública retira el fragment del
URL antes de mostrar el formulario. No se transmitieron credenciales
productivas.

## Verificación local

- Node.js `24.18.0` y pnpm `11.15.1`: PASS;
- typecheck, build y arquitectura DEC-005 policy 10: PASS;
- regresión focalizada TL-02–TL-06: `48/48` PASS, skips únicamente para suites
  PostgreSQL ejecutadas por sus runners materiales;
- TL-06 PostgreSQL 18.4: `3/3` PASS;
- migraciones: 88; segunda ejecución: `0 pending`;
- `/livez`, `/readyz` y frontend local: `200`;
- `git diff --check`: PASS;
- `verify`: PASS, 1086 tests descubiertos, 0 fallos;
- `verify:full`: PASS, stages 0–18 completos, cleanup PASS;
- composite PostgreSQL material: 17/17 PASS;
- PBI-041 10k publish: 21.2 s, dentro del hard gate de 30 s; diagnóstico
  histórico de capacidad transaccional conservado;
- TL-02, TL-03, TL-04, TL-05 y TL-06 PostgreSQL: PASS;
- Preview-like runtime y compiled backend/UI smoke: PASS.

Estos resultados no sustituyen CI remota, review deliberado, merge,
exact-main CI ni deploy.
