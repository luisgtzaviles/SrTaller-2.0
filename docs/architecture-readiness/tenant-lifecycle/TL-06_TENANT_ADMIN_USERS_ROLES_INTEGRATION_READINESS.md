# TL-06 — Tenant Administration Users/Roles Integration Readiness

## Estado

- **Work Unit:** TL-06 — Tenant Administration Users/Roles Integration.
- **Iteración:** readiness, auditoría y diseño; sin implementación de producto.
- **Tipo / riesgo:** `PRODUCT` / `ARCHITECTURAL`.
- **Base autoritativa:** `81b57994c69ed3584776ff080253f9a772e6425b`.
- **Dependencias satisfechas:** ADR-012, ADR-015 y TL-02–05 integrados y
  cerrados mediante el lifecycle gobernado.
- **Resultado:** frontera de implementación, threat model, invariantes,
  migraciones y pruebas definidos; lista para autorización de implementación.
- **Fuera de alcance:** TL-07, Super Admin, billing, soporte cross-tenant,
  SSO/MFA/passkeys, Production Resend y cambios al login operacional.

TL-06 reutiliza el único agregado `User` del Tenant. No introduce `Person`,
`Administrator` ni un segundo directorio de personas.

## 1. Auditoría del modelo User actual

### 1.1 Agregado y persistencia

| Aspecto | Estado material | Consecuencia TL-06 |
|---|---|---|
| Identidad | PK compuesta `(tenant_id, user_id)`; UUID server-owned | `User` continúa siendo la identidad estable de la persona dentro de un Tenant. |
| Datos | `display_name`, `operational_identifier` nullable, estado, versión y timestamps UTC | Email no pertenece a `User`; el identificador operativo puede permanecer ausente para un Admin-only. |
| Tenant | FK estructural a `tenants`; repositorios y comandos reciben scope Tenant | Tenant se deriva de Admin Session, nunca de body/query/host. |
| Lifecycle | `active -> inactive/revoked`; `inactive -> active/revoked`; `revoked` terminal | No hay hard delete. Reactivar es una acción administrativa explícita; recovery no reactiva. |
| Unicidad | `operational_identifier` único sólo dentro del Tenant y sólo cuando no es null | No es email, login administrativo ni identidad global. |
| Concurrencia | `version`, command journals y `admission_revision` | Se conservan optimistic concurrency e invalidación de sesiones al cambiar admisión. |
| PIN | Tabla Access separada y opcional, una credencial por `(tenant,user)` | Crear un User no crea ni inventa PIN. |
| Admin identity | Tabla Access separada, máximo una por `(tenant,user)` y email normalizado globalmente único en V1 | Un User operativo puede adquirir identidad administrativa sin duplicarse. |
| Roles | Asignaciones tenant-scoped, múltiples, tenant-wide o branch-restricted | No existen permisos directos por User; la unión vigente sigue siendo la autoridad. |

El directorio y los casos de uso actuales ya permiten listar, crear, editar y
transicionar Users tenant-scoped. Los cambios de identidad, Roles y PIN tienen
owners separados: Users conserva el perfil/lifecycle; Access conserva
credenciales y autoridad.

### 1.2 Consumidores y supuestos legacy

- La administración local actual vive en Operational Context, exige Station +
  PIN y proyecta `pinConfigured`. Debe conservarse durante la transición, pero
  no es la superficie autoritativa de Tenant Administration.
- `UsersPage` y `RolesPage` actuales son reutilizables como referencia de
  interacción/Design System, no como guard: usan Operational Session y
  capabilities operativas.
- El listado de login PIN filtra Users que tienen PIN activo y Role aplicable;
  no presupone que todos los Users sean elegibles.
- El bootstrap TL-03 crea primer User, Admin Identity verificada, password,
  starter Role y assignment. No crea PIN.
- TL-02 login resuelve email a Admin Identity/User activos. No requiere ni
  consulta PIN, Station o Branch.
- Ningún consumidor correcto necesita que todo User sea operativo. El texto
  legacy que presenta todo User como “PIN pendiente” debe cambiar en Admin UI
  a estados independientes: identidad administrativa y acceso operativo.

### 1.3 Datos locales read-only observados

PostgreSQL 18.4 contiene 84 migraciones y un Tenant local sintético:

- 4 Users activos;
- 1 Admin Identity activa/verificada con password;
- 4 PIN credentials activas;
- 4 Roles: 3 `TENANT_MANAGED` y el `tenant_admin` `SYSTEM_MANAGED` policy v1;
- 5 assignments activos;
- Luis es un User combinado; Carlos, Jorge y María son operativos solamente;
- no existe todavía un User admin-only material en el dataset local.

No se leyó ni modificó password, PIN, verifier, token o challenge. No se
requiere mapping Owner ni backfill de email/PIN para esos registros.

## 2. Modelo de identidad y contextos V1

```text
Tenant User
  ├─ 0..1 Admin Identity (email verificado)
  │    └─ 0..1 password credential activa
  │         └─ 0..n Admin Sessions
  ├─ 0..1 PIN credential activa
  │    └─ 0..n Operational Sessions, siempre con Station/Branch
  └─ 0..n Role Assignments
       └─ Role -> capabilities
```

| Tipo de User | Permitido | Elegibilidad |
|---|---|---|
| Admin-only | Sí | User activo + Admin Identity activa/verificada + password activa; después cada acción exige capabilities tenant-wide apropiadas. |
| Operational-only | Sí | User activo + PIN activa + Role activo aplicable al Branch de la Station. |
| Combinado | Sí | Satisface ambos contratos de forma independiente. Ninguna Session se intercambia. |

- PIN es opcional hasta conceder acceso operacional.
- Email administrativo es opcional para un User sólo operacional.
- Admin login autentica identidad; no congela autorización. La operación
  posterior recalcula capabilities tenant-wide.
- PIN login autentica dentro del Tenant/Branch derivados de Station y exige
  elegibilidad operacional vigente.
- Una Admin Session nunca llama APIs operativas como autoridad, y una
  Operational Session nunca llama `/api/admin/*` como autoridad.
- Los Role names son presentación. Sólo Role assignments vigentes,
  capability codes y scope conceden acceso.

## 3. Invitation lifecycle

### 3.1 Entidades y estados

```text
AdminInvitation
  PENDING -> ACCEPTED
          -> EXPIRED
          -> REVOKED

InvitationChallenge
  ACTIVE -> CONSUMED
         -> SUPERSEDED
         -> EXPIRED
```

La invitación conserva:

- `invitation_id` UUID server-owned;
- Tenant derivado de la Admin Session;
- email normalizado + forma de presentación;
- `target_user_id` opcional y server-resolved;
- nombre propuesto sólo cuando se invita a una persona nueva;
- inviter User/Admin Identity/Admin Session;
- grants exactos: Role IDs, scope y Branch ID nullable;
- versiones/digest de Roles y revisión de autoridad del issuer;
- estado, versión, expiración, created/updated/accepted/revoked timestamps;
- `client_request_id` y fingerprint para idempotencia.

El challenge usa 32 bytes aleatorios, URL-safe; sólo se persiste SHA-256. La
invitación vence a las 24 horas. Resend conserva la invitación y rota el
challenge: supersede el anterior, crea un nuevo delivery ID y nunca amplía la
expiración original. Cambiar destinatario o grants exige revocar y emitir una
nueva invitación.

### 3.2 Emisión, duplicados y destinatarios existentes

- Crear invitación requiere Tenant `ACTIVE`, Admin Session válida,
  `users.manage` y `access_matrix.manage`; si el grant es administrativo,
  también reauth Level 2.
- Persona nueva: `target_user_id = null`; aceptación crea un User activo con
  `operational_identifier = null`, sin PIN.
- User operacional existente: el Admin debe seleccionarlo explícitamente;
  el servidor fija `target_user_id` y valida mismo Tenant. El email nunca se
  usa para fusionar silenciosamente Users.
- Email ya asociado a una Admin Identity del mismo User: no se crea otra
  identidad. Una elevación adicional todavía requiere invitación/aceptación
  cuando crea nueva autoridad Tenant Admin.
- Email asociado a otro User o Tenant, o target User distinto: denegación
  uniforme; no revela la cuenta existente.
- Sólo puede existir una invitación `PENDING` global por email normalizado.
  Mismo `client_request_id` + fingerprint reproduce resultado; diferente
  payload produce conflicto.

### 3.3 Aceptación y revalidación

La invitación es un grant server-owned, pero no una autoridad eterna. Al
aceptar, una transacción `SERIALIZABLE`:

1. localiza y bloquea challenge/invitación por digest;
2. valida `PENDING`, expiración, single-use y Tenant `ACTIVE`;
3. revalida issuer activo, Admin Identity/password vigentes, capabilities y
   revisión de autoridad;
4. revalida Roles activos, versiones/digest, scope y Branch del mismo Tenant;
5. valida unicidad global de email y target User activo/no revocado;
6. crea User si corresponde, Admin Identity verificada y password credential;
7. crea exactamente los assignments congelados por la invitación;
8. consume challenge, marca invitación `ACCEPTED`, escribe journals/audit;
9. hace commit único.

Si issuer, Tenant, Role, scope o autoridad cambiaron, la aceptación falla
cerrada y la invitación queda revocada con razón tipada. El cliente no envía
Tenant, Role, capability, scope, target User ni privilege selection durante
acceptance. Dos aceptaciones concurrentes producen un solo ganador; replay
devuelve un resultado terminal sanitizado y no crea autoridad adicional.

Forward/replay, token expirado/revocado/superseded y URL manipulada carecen de
efectos parciales. La página toma el token desde fragment, no muta por `GET`,
no carga terceros y usa `Referrer-Policy: no-referrer`.

## 4. Password y Admin Identity

- La persona invitada establece su propio password en la aceptación.
- Se reutilizan `parseAdminPassword`, Argon2id, pepper externo, parámetros,
  redacción y repositorio TL-02; no hay segundo KDF.
- El plaintext sólo existe en memoria durante el request y nunca entra en
  invitación, dispatch, audit, log o response.
- No se envían passwords, defaults ni passwords temporales por email.
- La aceptación crea Admin Identity ya verificada porque el challenge prueba
  posesión del email; la credential nace activa.
- No se crea Admin Session automáticamente. Al terminar se redirige al login
  normal TL-02 para separar verificación de establecimiento de sesión.
- Recovery TL-02 permanece separado y no reactiva User/Identity revocados.

## 5. Role Management V1

### 5.1 Recomendación

**Opción C acotada: assignments de Roles existentes + creación/edición de
Roles custom `TENANT_MANAGED`.**

Sólo asignar el starter Role permitiría delegar toda la autoridad Tenant Admin
o ninguna. La delegación granular aprobada —por ejemplo Branches sin Users o
Stations— necesita Roles custom. La infraestructura ya existe y protege Roles
`SYSTEM_MANAGED`; TL-06 no añade permisos directos por User, herencia, denies,
vigencias ni delete físico.

Incluido:

- listar/inspeccionar todos los Roles del Tenant;
- crear Role custom con capabilities del catálogo;
- editar nombre/descripción/capabilities de Role custom;
- desactivar y reactivar Role custom de forma versionada;
- asignar/revocar múltiples Roles tenant-wide o branch-restricted;
- conservar `tenant_admin` visible pero ineditable/no eliminable;
- excluir archive y delete físico de Role en esta V1.

### 5.2 Clasificación del catálogo

| Clase | Capabilities |
|---|---|
| Control plane global | `tenant.profile.*`, `users.*`, `access_matrix.*` |
| Control plane Branch/Station | `branches.*`, `stations.*` |
| Operacionales | `repairs.*`, `price_list.read`, `catalog.*` |
| Bundle protegido | Composición exacta de `STARTER_TENANT_ADMIN_POLICY` v1 |

Todos los códigos pueden participar en Roles custom, pero el alcance debe ser
coherente:

- `users.*`, `access_matrix.*` y `tenant.profile.*` sólo autorizan desde un
  assignment `TENANT_WIDE`;
- capabilities Branch/Station pueden concederse tenant-wide o con Branch
  explícito cuando el caso de uso resuelva el recurso objetivo;
- capabilities operativas sólo operan con Operational Context aun si están en
  un Role asignado a un Admin;
- copiar el bundle no convierte un Role custom en `tenant_admin` ni satisface
  el invariante de último Admin.

## 6. Capabilities y autorización

TL-06 no necesita capability codes nuevos:

| Acción | Capability vigente | Controles adicionales |
|---|---|---|
| List/read Users e invitations | `users.read` | Admin Session; Tenant server-derived. |
| Invite/resend/revoke; editar/activar/desactivar User; PIN explícito | `users.manage` | `access_matrix.manage` cuando hay grants; Level 2 según impacto. |
| List/read Roles/assignments/catalog | `access_matrix.read` | Sólo assignment tenant-wide para esta superficie global. |
| Crear/editar Role custom; assign/unassign | `access_matrix.manage` | optimistic version, commit guard y Level 2 si cambia autoridad administrativa. |

El backend usa `AdminAuthorizationExecutor`, CSRF/origin para writes, reauth
TL-02 y commit guard dentro de la transacción. No existe `isAdmin`. La UI sólo
refleja capabilities y nunca concede autoridad.

## 7. Invariante de último Tenant Admin efectivo

“Tenant Admin efectivo” conserva la semántica TL-03:

- User `active`;
- Admin Identity activa y verificada;
- password credential activa;
- Role `tenant_admin`, `SYSTEM_MANAGED`, policy v1, activo;
- assignment `TENANT_WIDE` activo.

Un Role custom con capabilities equivalentes no cuenta. Todas las rutas que
pueden perder una de esas condiciones comparten un coordinador transaccional:

```text
SERIALIZABLE transaction
  -> lock Tenant row FOR UPDATE (serialization key)
  -> lock actor/session authority and target rows
  -> revalidate actor capability + recent reauth when required
  -> apply candidate mutation
  -> count effective Tenant Admins in resulting state
  -> require count >= 1
  -> journal + audit
  -> commit
```

Aplica a User deactivation/revocation, assignment revoke, Admin Identity o
password revocation y cualquier futura mutación de la policy protegida. Dos
removals concurrentes se serializan por la misma fila Tenant: la segunda ve el
estado resultante y falla `LAST_EFFECTIVE_TENANT_ADMIN_REQUIRED`. No basta un
pre-check fuera de transacción.

Invitation acceptance sólo añade autoridad, pero revalida que el Role
protegido siga vigente. Una operación intencional puede retirar la propia
autoridad del actor si queda otro Admin efectivo: la autorización se fija y
bloquea antes de la mutación; no se exige que el actor conserve el permiso
después del commit.

## 8. Acciones Level 2

Requieren Admin Session + capability + password reauthentication vigente por
10 minutos:

- emitir o reenviar una invitación que conceda cualquier capability de
  control plane;
- asignar o revocar `tenant_admin`;
- asignar/revocar un Role custom con capabilities de control plane;
- cambiar un Role custom de modo que agregue o retire capabilities de control
  plane a assignments activos;
- desactivar/reactivar/revocar un User con Admin Identity;
- revocar Admin Identity/password o todas las Admin Sessions de otra persona;
- cambiar PIN de otra persona.

Lecturas, revocar una invitación todavía no aceptada y administrar únicamente
Roles operacionales permanecen Level 1 con capability ordinaria. La acción se
clasifica por el efecto server-side real, nunca por un flag del cliente.

## 9. Tenancy y Branch scope

- Tenant siempre procede de Admin Session.
- Repositorios cargan User/Role/Assignment/Invitation por clave compuesta
  `(tenant_id,id)`; un UUID ajeno produce not-found/denial uniforme.
- `target_user_id`, Role IDs y Branch ID se consideran candidatos, no scope.
- Un assignment `BRANCH_RESTRICTED` exige FK compuesta al mismo Tenant y
  Branch vigente del Tenant.
- Admin Context global sólo obtiene `users.*`/`access_matrix.*` desde
  assignments tenant-wide.
- Tests Alfa/Beta manipulan path/body/query, User/Role/Branch IDs e emails
  similares y comprueban cero lectura, mutación o enumeración cross-tenant.

## 10. Reutilización de email delivery TL-04

Se reutiliza Resend, sender/configuración, idempotency key, adapter local/test,
sanitización y semántica `at least once`. El port actual es específico de
Registration y su tabla de dispatch tiene FK a Registration Attempt; no debe
forzarse esa ownership.

La implementación evoluciona el port de email TL-04 existente hacia el
transporte transaccional compartido, sin introducir otro provider abstraction,
y mantiene templates allowlisted:

- `registration-verification` v1;
- `admin-invitation` v1.

Access posee sus invitation challenges y durable dispatches. La transacción
persiste challenge + dispatch antes de I/O; el envío ocurre post-commit con
`deliveryId` estable. Fallos quedan reintentables, con máximo tres intentos
del dispatcher; resend explícito rota challenge y usa nuevo delivery ID. El
adapter local conserva mensajes sólo en memoria y nunca imprime URL/token.
Production Resend/DNS no se configura en TL-06 readiness.

## 11. Migración y backfill

Se requiere persistencia aditiva Access-owned para:

1. `access_admin_invitations`;
2. grants normalizados por Role/scope/Branch;
3. challenge digests single-use;
4. durable email dispatches;
5. invitation command journal/idempotency;
6. extensiones allowlisted a `access_admin_security_events` para recursos,
   capability, sensibilidad, target y versiones.

No se requieren cambios para hacer opcionales email o PIN: ya son relaciones
opcionales. `access_role_assignments` ya soporta scope y múltiples Roles;
`access_roles` ya distingue `SYSTEM_MANAGED`; User ya tiene lifecycle/version.

Backfill:

- no fabricar emails para Carlos/Jorge/María;
- no fabricar PIN para futuros Admin-only;
- conservar Luis como User combinado;
- no reescribir Roles/assignments ni timestamps;
- no convertir `administrator` legacy en `tenant_admin`;
- verificar 84 migraciones como baseline y rerun 0 pending antes de añadir la
  migración TL-06.

## 12. Audit y seguridad

Eventos durables mínimos:

- `ADMIN_INVITATION_ISSUED|RESENT|REVOKED|ACCEPTED|EXPIRED`;
- `ADMIN_IDENTITY_ESTABLISHED|REVOKED`;
- `USER_ACTIVATED|DEACTIVATED|REVOKED`;
- `ROLE_CREATED|UPDATED|CAPABILITIES_REPLACED`;
- `ROLE_ASSIGNED|UNASSIGNED`;
- `TENANT_ADMIN_AUTHORITY_GRANTED|REVOKED`.

Cada evento registra Tenant, actor User/Admin Session, action, resource/target,
Role/Assignment/Branch cuando aplique, capability exigida, sensitivity level,
correlation UUID server-generated, resultado, razón tipada, versiones y UTC
timestamp. Es append-only.

Nunca registra password/PIN/verifier/hash/pepper, challenge/token, URL completa,
cookie/CSRF/header, body genérico, email en eventos de denegación pública ni
datos de otro Tenant. Invalid tokens sin Tenant resoluble producen sólo
telemetría sanitizada, no un evento tenant-scoped inventado.

## 13. Admin HTTP/UI V1

### Admin Context autenticado

- `GET /api/admin/users` y `GET /api/admin/users/:userId`;
- `PATCH /api/admin/users/:userId`;
- activation/deactivation explícitas;
- `GET/POST /api/admin/invitations`, resend y revocation explícitos;
- `GET /api/admin/roles`, `POST /api/admin/roles` y `PATCH` para custom Roles;
- endpoints explícitos para replace capabilities y assign/unassign;
- acción explícita de configurar/reemplazar PIN, sin retorno plaintext.

### Contexto público de aceptación

- `/admin/aceptar-invitacion` y `POST /api/admin-invitations/acceptance`;
- token sólo en fragment/memoria del browser;
- password + confirmación establecidos por la persona invitada;
- respuesta uniforme y handoff al login administrativo.

### UI

El shell TL-05 agrega navegación **Sucursales / Usuarios / Roles**. Usuarios
muestra por separado estado User, identidad administrativa, email verificado,
PIN configurado y Roles; nunca presenta “PIN pendiente” como error para un
Admin-only. Roles identifica el starter Role como protegido. Se reutilizan
Design System, Dialog, Field, feedback, focus trap, responsive y temas. No se
añaden Marketing, Finance, Stations ni billing.

## 14. Bloques de implementación

1. **Persistence + domain:** invitations/grants/challenges/dispatch/journal,
   audit allowlist y tipos de error.
2. **Email reuse:** transporte/template `admin-invitation`, adapter local/test y
   post-commit dispatcher.
3. **Acceptance:** token validation, password TL-02, existing/new User y commit
   atómico de identity + assignments.
4. **Admin authorization:** Users/Roles read models y comandos desde Admin
   Context; retirar Station/PIN como requisito de control plane.
5. **Last-admin coordinator:** serialization lock y cobertura de todos los
   authority-loss paths.
6. **Sensitive actions:** clasificación por efecto y reauth TL-02.
7. **Admin UI:** Users, invitations, Roles, assignments y PIN explícito.
8. **Material QA/evidence:** PostgreSQL, Alpha/Beta, browser, regresiones y
   verificación gobernada.

Cada bloque actualiza el checklist; no inicia TL-07.

## 15. Plan de pruebas

| Área | Pruebas obligatorias |
|---|---|
| Invitation | issue, idempotency, resend/supersession, expiry, revoke, replay, forward, concurrent accept, issuer/Role/Tenant changed, duplicate email. |
| Password | invitee sets own password; TL-02 policy/KDF; no plaintext in DB/log/response/email; normal login after acceptance. |
| User types | admin-only, operational-only, combined; PIN/email optional independently; no Session/context crossover. |
| Roles | custom create/edit; protected starter immutable; multiple Roles; union; tenant-wide/Branch restricted; branch guess denied. |
| Last admin | final assignment removal, User deactivate/revoke, identity/credential revoke and concurrent two-admin race all preserve count >=1. |
| Level 2 | valid, absent and expired reauth; ordinary capability denial; target effect cannot be spoofed. |
| Tenancy | Alfa cannot list/read/invite/assign/mutate/deactivate Beta via any input or guessed ID. |
| Email | TL-04 transport reuse, durable dispatch, retry, explicit resend, provider failure and redaction. |
| Regression | TL-02 Sessions/recovery, TL-03 starter policy, TL-04 registration, TL-05 Branches, PIN/Station/Operational Sessions. |
| PostgreSQL | real serializable concurrency, constraints/FKs, migration apply, rerun 0 pending and rollback where policy requires. |
| UI | desktop/768/640, keyboard/focus, screen-reader names, light/dark, no overflow; direct API agrees with hidden/disabled UI. |

## 16. Decisiones Owner

No queda una decisión Owner material abierta para autorizar implementación.
Las selecciones de esta readiness son la mínima materialización de decisiones
ya aceptadas:

- Role Management V1 usa opción C acotada; starter Role permanece protegido;
- invitation TTL 24 horas y resend no extiende la invitación;
- acceptance revalida issuer, Roles, scope, Tenant y revisiones; no usa grant
  irrevocable;
- User existente sólo se vincula mediante selección explícita, nunca por
  auto-merge de email;
- cambios de autoridad administrativa son Level 2 por efecto;
- email reutiliza el provider/transport TL-04 con ownership de dispatch en
  Access.

Si el Owner desea cambiar cualquiera de esos límites, debe hacerlo antes de
autorizar implementación; no hay una contradicción con ADR-012/015.

## 17. Criterio de salida de readiness

TL-06 queda listo para autorización de implementación cuando:

- esta auditoría y threat model son consistentes con ADR-012/015 y TL-02–05;
- no existe segundo agregado User ni acoplamiento password/PIN;
- invitación, last-admin, Level 2, tenancy y email tienen fronteras
  verificables;
- los bloques y tests están definidos;
- links, arquitectura, secretos y diff pasan los checks documentales;
- no existe cambio de producto, DB, runtime o datos.

La autorización de readiness no autoriza implementación, push, PR, merge,
deploy ni TL-07.
