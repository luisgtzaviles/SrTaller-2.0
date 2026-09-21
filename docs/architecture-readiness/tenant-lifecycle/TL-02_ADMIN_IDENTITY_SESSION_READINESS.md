# TL-02 — Administrative Identity + Session Foundation Readiness

## Estado

- **Work Unit:** TL-02 — Administrative Identity + Session Foundation.
- **Fase:** implementación local completa; candidato pendiente de promoción.
- **Riesgo:** `SENSITIVE`; identidad, credenciales, sesiones, multitenancy y
  persistencia.
- **Resultado del audit:** `IMPLEMENTED — READY FOR PROMOTION`.
- **Implementación de producto:** materializada localmente conforme a este plan;
  no integrada, desplegada ni cerrada.
- **Autoridad:** ADR-015 `Accepted`, contrato Tenant Lifecycle MVP y decisiones
  Owner `TLD-001–003`, `TLD-006`, `TLD-008`.

## 1. Alcance confirmado

TL-02 debe materializar exclusivamente la foundation administrativa previa a
registro público y bootstrap:

- identidad administrativa de email verificado ligada a un Tenant User;
- password no reversible y separado del PIN;
- Admin Sessions stateful concurrentes;
- idle de 30 minutos, lifetime absoluto de 12 horas y sin `remember me`;
- logout, revocación individual y revocación global;
- reautenticación por password vigente durante 10 minutos para Level 2;
- recovery interno de un solo uso para Users activos;
- aislamiento tenant y separación absoluta frente a Station/PIN/Operational
  Session;
- auditoría de seguridad durable sin secretos.

No incluye registro público, verificación de email pública, Tenant bootstrap,
starter Role, Branch/Station UI, enrollment, operación por PIN, Super Admin,
billing, MFA, SSO, passkeys ni TL-03.

## 2. Audit del estado materializado

### 2.1 Reutilizable

| Superficie | Estado actual | Reutilización en TL-02 |
|---|---|---|
| `users` | User tenant-scoped; `active/inactive/revoked`; `version` y `admission_revision` | User continúa siendo la identidad humana. Admin auth lee estado y revisiones mediante un puerto estrecho; no duplica lifecycle. |
| `tenancy` | Tenant persistido y repositorio tenant-scoped | Validar existencia del Tenant. TL-02 no crea Tenant ni agrega lifecycle; ONBOARDING/ACTIVE pertenece a TL-03. |
| Roles/capabilities | Roles tenant-scoped, asignaciones tenant-wide/branch y unión server-side | Admin Session no concede permisos. Cada operación futura recalcula capabilities tenant-wide vigentes. |
| PIN credential | Argon2id versionado, salt único, pepper externo, comparación constante, dummy work, bounded work y rate-limit durable | Reutilizar el patrón y, si se extrae código, sólo una primitive criptográfica privada con purpose separado. Nunca reutilizar PIN, lookup digest ni pepper. |
| Operational Session | bearer/CSRF opacos, sólo digests persistidos, concurrencia, expiración, revocación y commit guards | Reutilizar patrones de diseño. Crear tipos, tablas, cookies, rutas y guards exclusivos de Admin Session. |
| HTTP | same-origin, Fetch Metadata, JSON-only, `SameSite=Strict`, `HttpOnly`, `Secure` fuera de local, `no-store`, errores estables y correlación server-side | Mantener controles con nombres/path/audiencia administrativos distintos. |
| PostgreSQL | Kysely, owners explícitos, transacciones serializables disponibles, constraints y tests PostgreSQL materiales | Migración aditiva owner `access`; aislamiento y carreras se prueban con PostgreSQL real. |
| Configuración | secretos tipados y fail-closed; local runtime explícito | Añadir pepper administrativo separado. El proof sintético usa CLI local, nunca un endpoint/backdoor productivo. |

### 2.2 Faltante

No existen actualmente:

- identidad administrativa o email verificado persistido;
- normalización/uniqueness global V1 de email administrativo;
- password credential administrativa;
- Admin Session ni su audience/cookies/guard;
- rate-limit de login administrativo;
- logout-all o revocación individual administrativa;
- reauth administrativa de 10 minutos;
- recovery proof administrativo;
- audit trail de seguridad administrativa;
- endpoint o UI de Tenant Administration;
- tests Alfa/Beta de esta nueva frontera.

La UI actual de Configuración usa Station + PIN + Operational Session. Es
administración de producto existente, no el Tenant Admin Context de ADR-015 y
no debe adaptarse fingiendo que ambos contextos son equivalentes.

## 3. Ownership y frontera de módulos

No se crea un módulo raíz nuevo.

- `access` posee identidad administrativa, password credential, Admin Session,
  recovery, rate-limit, reauth y security audit.
- `users` posee User, status, version y admission revision; publica sólo el
  lector/validador necesario.
- `tenancy` posee Tenant y publica la validación de existencia/admisión.
- consumidores futuros reciben un `AdminAuthorizationExecutor` público mínimo;
  no leen tablas de Access ni cookies directamente.
- `admin.srtaller.com` es una superficie lógica compartible en el mismo
  deployment V1. El `Host`, email o slug nunca determina Tenant authority.

`architecture/dec-005-policy.json` deberá ampliarse sólo para los nuevos
contratos públicos y tablas owner `access`; no para crear una raíz global.

## 4. Modelo de datos propuesto

Todos los instantes son `timestamptz`/UTC. Ninguna tabla almacena password,
token, cookie, CSRF o recovery proof en plaintext.

### `access_admin_identities`

- PK tenant-scoped: `(tenant_id, admin_identity_id)`.
- FK compuesta a `(tenant_id, user_id)`.
- `normalized_email` con unicidad global V1 y `email_display` para presentación.
- `verified_at`, `status`, `identity_version`, `created_at`, `updated_at`.
- una identidad administrativa por User en MVP.

La normalización V1 valida un addr-spec ASCII, elimina whitespace exterior,
aplica NFC y lower-case para la clave canónica. El password no se normaliza ni
se recorta: se verifica por sus bytes UTF-8 exactos.

### `access_admin_password_credentials`

- FK a la identidad y User del mismo Tenant.
- Argon2id profile versionado, salt único, verifier y pepper version.
- `credential_version` y `session_revision` monotónicos.
- estado, counters/cooldown, timestamps y revocación.
- ninguna columna reversible o apta para recuperar el password.

### `access_admin_sessions`

- PK `(tenant_id, session_id)` y `token_verifier` globalmente único.
- User/identity/credential y sus revisiones capturadas al emitir.
- `csrf_verifier`, lifecycle, versión, `issued_at`, `last_activity_at`,
  `expires_at`, `reauthenticated_at`, `ended_at`.
- `expires_at = issued_at + 12 hours`; idle se evalúa a 30 minutos.
- el lookup inicial por digest es una capability interna global y estrecha; el
  Tenant se deriva de la fila y se revalida antes de producir contexto.

### `access_admin_auth_attempt_limits`

- principal opaco derivado mediante HMAC de email normalizado y pepper
  administrativo; nunca guarda email en el registro de abuso.
- ventana/counter/cooldown y cleanup acotado.
- serialización que evita bypass por concurrencia y crecimiento sin límite.

### `access_admin_recovery_challenges`

- token digest único, identidad/credential revisions, estado
  `active/consumed/expired/cancelled`, `expires_at`, `consumed_at` y versión.
- un solo uso; TTL técnico de 30 minutos.
- completar recovery reemplaza el verifier, incrementa revisiones e invalida
  todas las Admin Sessions en la misma transacción.
- TL-02 expone el caso de uso interno, no un endpoint público ni transporte de
  email. TL-04 conectará solicitud y entrega verificadas.

### `access_admin_security_events`

- append-only, tenant/user/session/resource/result/correlation/time y reason
  code allowlisted.
- registra login exitoso, logout, revocación, bloqueo, reauth, cambio de
  credencial y recovery completado; fallos se agregan al alcanzar controles de
  abuso para evitar crecimiento atacante no acotado.
- no contiene email, password, verifier, challenge, token, cookie, CSRF,
  headers, payload libre, IP ni user-agent.

## 5. Threat model y decisiones técnicas

| Amenaza | Selección TL-02 |
|---|---|
| Robo de DB | Argon2id nativo de Node 24, profile V1: 64 MiB, 3 passes, parallelism 4, salt 16 bytes, tag 32 bytes y pepper de 32 bytes separado en `SR_ADMIN_PASSWORD_PEPPER`. Profile/version se persisten para rotación futura. |
| Password débil o payload abusivo | 12–128 caracteres, máximo 512 bytes UTF-8, sin reglas de composición; no trim/normalización silenciosa. Inputs fuera del contrato fallan antes del KDF. |
| Enumeración | Login y recovery usan respuestas públicas genéricas, dummy Argon2 equivalente y no revelan email, Tenant, User, lifecycle ni verificación. |
| Credential stuffing / DoS KDF | máximo 5 fallos por principal en 15 minutos, cooldown de 15 minutos; limiter de Argon2 máximo 2 activos/8 en cola; rechazo fail-closed al saturarse. No bloquea Tenant ni termina Sessions válidas. |
| Session fixation/hijack | bearer y CSRF aleatorios independientes de 32 bytes, sólo SHA-256 digests persistidos, rotación completa al login/recovery y cookies administrativas separadas. |
| CSRF/origin confusion | `SameSite=Strict`, bearer `HttpOnly`, `Secure` fuera de localhost explícito, same-origin + Fetch Metadata + token CSRF doble para mutaciones, JSON-only y `Cache-Control: no-store`. |
| Confusión de contextos | cookie names, routes, domain types, resolvers y executors distintos. Admin cookies se rechazan en Operational APIs y viceversa. No se acepta Tenant/Branch/Station desde cliente. |
| Session obsoleta | cada request revalida User activo, identity/credential status y revisiones; capacidades se consultan server-side, no via claims largos. |
| Carrera login/revoke/change | locks y commit guards dentro de transacción; `session_revision` y `credential_version` monotónicos. La revocación vence antes de la siguiente operación. |
| Recovery takeover/replay | token de 32 bytes, sólo digest, TTL 30 minutos, single-use y compare-and-set; User inactivo/revocado siempre denegado. |
| Reauth replay | `reauthenticated_at` pertenece a la Admin Session y actor actuales, dura como máximo 10 minutos y se revalida dentro del commit sensible; cambio/recovery/revoke/session end la invalida. |
| Fuga por logs/audit | DTOs allowlisted, errores tipados, correlation UUID server-side y tests negativos sobre serialización/stderr/HTTP. |

La selección criptográfica reutiliza una baseline ya materializada en el
repositorio, pero mantiene separación de secreto y purpose. Un benchmark
material del KDF y los límites de capacidad forma parte de la implementación;
si no satisface disponibilidad en la toolchain objetivo, se versiona un nuevo
profile antes de persistirlo, nunca se degrada silenciosamente.

## 6. Flujo administrativo propuesto

### Login

1. `GET /api/admin/session` entrega snapshot no autenticado y login CSRF; no
   necesita Station.
2. `POST /api/admin/session` valida origin/Fetch Metadata/JSON/CSRF y email +
   password.
3. Access resuelve email globalmente, hace trabajo real o dummy, y revalida
   identidad, credential, User y Tenant.
4. En transacción crea una nueva Admin Session concurrente sin terminar otras.
5. Responde sólo User/Tenant IDs, display name, timestamps, capabilities
   tenant-wide y CSRF; nunca password/email de lookup/verifiers.

### Resolución y autorización

1. Leer cookie admin y derivar digest.
2. Resolver Session por digest, derivar Tenant/User server-side.
3. Revalidar idle/absolute, User, identidad, credential y revisiones.
4. Resolver capabilities vigentes para el Tenant.
5. Autorizar la capability exacta; no existe `isAdmin`.
6. Para una escritura, repetir autoridad en commit guard.

### Logout y revocación

- logout cierra sólo la Session solicitante y expira cookies;
- revocación individual propia cierra la Session elegida del mismo User;
- revocación global incrementa `session_revision` y cierra todas las Sessions
  de esa identidad en una transacción;
- logout inválido es idempotente hacia el cliente y nunca conserva cookies;
- ninguna de estas acciones toca Operational Sessions.

### Reautenticación Level 2

`POST /api/admin/session/reauthentication` exige Admin Session, CSRF y password
del mismo actor. Actualiza `reauthenticated_at` sólo tras revalidar todas las
revisiones. El consumidor sensible exige además capability ordinaria y confirma
en su transacción que la ventana no excede 10 minutos.

### Recovery foundation

Los use cases internos `issueRecovery` y `completeRecovery` implementan
anti-enumeración, TTL, single-use, User activo, rotación de credential y
revocación global. La entrega por email y sus endpoints públicos pertenecen a
TL-04; TL-02 los prueba con adapters sintéticos que nunca escriben secretos en
repositorio, logs o fixtures.

## 7. Superficie HTTP mínima

| Método/ruta | Propósito | Autoridad |
|---|---|---|
| `GET /api/admin/session` | snapshot/login challenge o Session vigente | cookie admin opcional; no Station |
| `POST /api/admin/session` | login email/password | login CSRF + same-origin; credencial server-side |
| `DELETE /api/admin/session` | logout actual | Admin Session + CSRF |
| `POST /api/admin/session/reauthentication` | renovar evidencia Level 2 | Admin Session + CSRF + password del actor |
| `GET /api/admin/sessions` | listar Sessions propias con metadata mínima | Admin Session; self-service |
| `DELETE /api/admin/sessions/:sessionId` | revocar Session propia | Admin Session + CSRF; mismo User/Tenant |
| `DELETE /api/admin/sessions` | revocación global propia | Admin Session + CSRF + password reciente |

No se expone endpoint público de provision, recovery o elección de Tenant en
TL-02. Las operaciones de otro User esperan capacidades y UX de TL-06.

## 8. Migración y compatibilidad

1. Añadir una sola migración cohesiva posterior a las 75 actuales.
2. Crear las seis tablas Access y sus constraints/FKs/indexes/triggers
   append-only/monotónicos.
3. Ampliar `DatabaseSchema`, owner map y tests del provider.
4. No alterar ni backfillear `users`, `tenants`, PIN credentials u Operational
   Sessions; no existe identidad admin por default.
5. El runtime continúa arrancando sin identidades admin. Sólo un provisioner
   local explícito o TL-03/04 puede crearlas.
6. Rollout expand-only: el código viejo ignora tablas nuevas; el código nuevo
   falla cerrado si falta configuración/tabla. Rollback de código no destruye
   datos; el `down` se prueba sólo en DB efímera conforme a la policy.
7. Primera ejecución aplica una migración y la segunda reporta `0 pending`.

## 9. Mecanismo sintético/local seguro

Se propone `local:admin:provision` como CLI no HTTP:

- sólo funciona con `SR_LOCAL_RUNTIME=true`, `NODE_ENV=development`, DB de
  development y host `127.0.0.1`;
- exige User/Tenant sintéticos existentes y email verificado sintético;
- lee password desde TTY con entrada oculta y confirmación, no de argv;
- no imprime, guarda ni registra el password;
- llama el mismo caso de uso y KDF productivos;
- no asigna Role/capability ni elige Tenant por payload de navegador;
- no se compila como bypass de autenticación y no funciona en Preview/
  Production.

Tests generan secretos aleatorios dentro del proceso y conservan sólo
verifiers/digests en PostgreSQL. No habrá password demo fijo en Git.

## 10. Plan de implementación incremental

1. **Contratos y dominio:** email/password/session/recovery value objects,
   errores tipados, puertos y constantes temporales.
2. **Criptografía/configuración:** primitive Argon2 con purpose administrativo,
   pepper separado, dummy verification, work limiter y tokens opacos.
3. **Persistencia:** migración, schema types y repositories con aislamiento,
   races, revisions, audit y recovery atomicity.
4. **Casos de uso:** provision sintético, login, resolve/touch, logout,
   revocación individual/global, reauth y recovery interno.
5. **HTTP:** cookies/rutas/DTOs separados, origin/CSRF/JSON/no-store y error
   mapping sin enumeración.
6. **Autorización:** `AdminAuthorizationExecutor` y commit guard tenant-wide;
   pruebas de que no concede operación ni acepta scope cliente.
7. **Proof local:** provisioner local, dos Sessions concurrentes, idle/absolute
   con reloj controlado, revocación, reauth y separación de cookies.
8. **Hardening/evidencia:** PostgreSQL material, abuso, logs, secret scan,
   docs/architecture y gates de promoción del riesgo real.

Cada bloque termina con pruebas focalizadas y un commit lógico. No se inicia
TL-03 al completar TL-02.

## 11. Estrategia de pruebas

### Dominio/aplicación

- email/password válidos e inválidos; password exacto sin trim;
- unknown/wrong/unverified/inactive/revoked indistinguibles públicamente;
- login crea Sessions concurrentes con 30m/12h exactos;
- idle/absolute boundary, touch acotado y reloj adversarial;
- logout actual, revoke one, revoke all y carreras login/revoke;
- recovery single-use/expiry/concurrency y no reactivación;
- reauth mismo actor, 10m boundary, invalidación y no elevación;
- capabilities recalculadas y ausencia de `isAdmin`.

### HTTP/security

- cookie flags/names/path/audience; malformed/duplicate cookies;
- origin, Fetch Metadata, CSRF, JSON-only y `no-store`;
- Admin cookie rechazada por Operational endpoint y viceversa;
- ningún tenantId/branchId/role/capability del cliente se vuelve autoridad;
- error/correlation estable sin email, password, token, cookie o headers;
- rate limit, dummy work y limiter bajo concurrencia.

### PostgreSQL material

- migration up/rerun/down efímero, constraints e índices;
- unicidad global V1 del email normalizado;
- FK tenant/User impide mezcla Alfa/Beta;
- verifier/digests sin plaintext y eventos append-only;
- dos Tenants con emails/IDs manipulados y denegaciones cross-tenant;
- serialización de login/revoke/recovery/reauth y rollback sin efectos parciales;
- sesión/credential revisions monotónicas y stale session denied.

### Gates de desarrollo y promoción

- durante iteración: tests TL-02 unit/contract/PostgreSQL, typecheck, build,
  architecture, work-unit check y `git diff --check`;
- antes de promoción: clasificación vigente + shadow, `verify`, `verify:full`,
  secret scan, migrations materiales, review de seguridad/multitenancy y
  cualquier gate adicional que exijan DEC-051/063 sobre el HEAD exacto.

## 12. Riesgos residuales y límites

- Edge/distributed rate limiting depende de la topología futura; TL-02 deja
  defensa application/DB y capacidad KDF acotada, sin afirmar protección DDoS.
- Entrega de recovery/verification por email, sender/provider y retención de
  Registration Attempts pertenecen a TL-04.
- Protección del último Tenant Admin se materializa con starter authority y
  mutaciones administrativas en TL-03/TL-06; TL-02 sólo garantiza que recovery
  no eleva ni reactiva.
- Tenant lifecycle ONBOARDING/ACTIVE se materializa en TL-03. TL-02 sólo exige
  Tenant existente para las identidades sintéticas internas.
- No existe UI administrativa final en este Work Unit; el proof puede ser API
  y browser mínimo sin construir el shell de TL-05/TL-06.

## 13. Decisiones Owner pendientes

**Ninguna bloqueante para iniciar implementación de TL-02.**

ADR-015 delegó algoritmo/parámetros, cookies/CSRF, rate limits, rotación,
revocación, recovery TTL, retención y errores al threat model técnico. Este
documento fija esas selecciones sin cambiar `TLD-001–009`.

Requeriría nueva decisión Owner sólo una desviación material: identidad
multi-Tenant, proveedor/email público dentro de TL-02, remember-me, otro
timeout, recuperación que reactive Users, Station/PIN para administración,
MFA/SSO/passkeys o autoridad administrativa sin Roles/capabilities.

## 14. Resultado de implementación

Los ocho bloques fueron materializados dentro de TL-02:

- contratos de identidad administrativa, password, Admin Session y recovery;
- Argon2id administrativo con pepper y purpose separados del PIN;
- seis tablas Access aditivas y repositorio PostgreSQL tenant-safe;
- login/resolve/logout/revocación/reauth/recovery internos;
- rutas y cookies `/api/admin` con audiencia, CSRF y `no-store` propios;
- autorización tenant-wide server-side y commit guard;
- provisioner exclusivamente local/dev sin secreto en argv o logs;
- hardening, pruebas materiales y evidencia de implementación.

La evidencia detallada y los límites del candidato están en
[TL-02 Implementation Evidence](../../quality/evidence/tl-02/IMPLEMENTATION_EVIDENCE.md).
El resultado no crea Tenant bootstrap, registro público, UI administrativa ni
autoridad para TL-03.

## Criterio de readiness histórico

El checkpoint fue aprobado por el Owner y la implementación local autorizada
fue completada. La promoción remota, review, merge, deploy y TL-03 conservan
sus autorizaciones y gates independientes.
