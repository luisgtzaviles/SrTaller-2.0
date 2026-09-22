# TL-07 — Station Inventory + Enrollment Authority Readiness

## Estado

- **Work Unit:** TL-07 — Station Inventory + Enrollment Authority.
- **Iteración:** implementación autorizada y candidata local.
- **Tipo / riesgo:** `PRODUCT` / `ARCHITECTURAL`.
- **Base autoritativa:** `74fe2b5fd5b66ee48428953f3e027f2815c839ca`.
- **Dependencias satisfechas:** ADR-010–013/015 y TL-02–06 integrados y
  cerrados mediante el lifecycle gobernado.
- **Resultado:** las decisiones Owner `TL7D-001`–`TL7D-006` están resueltas y
  la implementación materializa el contrato sin iniciar redemption TL-08.
- **Fuera de alcance:** redemption/activation/handoff TL-08, MDM, fingerprints,
  offline, billing, Super Admin, hard delete y telemetría inventada.

TL-07 administra inventario y autoridad de enrollment desde Admin Context.
No crea otro agregado Station y no convierte una Admin Session en confianza
operacional. TL-08 será el único consumidor público del challenge para crear o
volver a vincular confianza en un equipo.

## 1. Auditoría de la implementación Station actual

### 1.1 Dominio y persistencia

| Aspecto | Estado material | Consecuencia TL-07 |
|---|---|---|
| Identidad | `StationId` UUID server-owned y PK compuesta `(tenant_id, station_id)` | Un ID aislado nunca concede acceso; toda carga permanece tenant-scoped. |
| Tenant | `stations.tenant_id` tiene FK a `tenants` | La Station pertenece exactamente a un Tenant y nunca cambia de Tenant. |
| Estado | Tabla: `active | revoked`; dominio público mínimo: `active | revoked` | El estado `Unlinked` aceptado por PBI-024 todavía no está materializado como valor de Station. |
| Binding | `station_bindings` guarda Branch, `created_at`, `revoked_at` y `admission_revision` | La FK compuesta impide cross-tenant; la PK actual permite sólo una fila por Station. |
| Credencial | `station_credentials` guarda `credential_id`, SHA-256 hexadecimal del secreto aleatorio, Tenant/Station, timestamps de alta/revocación y revision | El dispositivo posee el valor opaco; inventario nunca devuelve valor ni digest. |
| Revisions | Branch, Station, binding y credential tienen `admission_revision >= 0`; triggers la incrementan al cambiar autoridad | Un revoke/restore o relink nunca hace vigente un snapshot anterior. |
| Timestamps | UTC `timestamptz`; Station ya tiene `created_at`, `updated_at`, `revoked_at` | No se cambia el contrato temporal ni se deriva tiempo del browser. |
| Nombre | No existe `display_name` ni otro nombre físico de Station | Requiere campo y backfill explícito/nullable para legacy; no se inventa. |
| Versionado de edición | No existe `version` de producto | Debe separarse de `admission_revision`: optimistic editing no es autoridad operacional. |
| Última actividad | No existe un `last_seen_at` Station confiable | No pertenece a Inventory V1. `OperationalSession.last_activity_at` no equivale a telemetría del equipo. |

La migración original no coincide plenamente con el diseño aceptado de
PBI-024: sobrescribir `station_bindings.branch_id` pierde historia y su PK
impide varias vinculaciones históricas. TL-07 debe reconciliar la tabla
existente hacia historial append-only; no crear un agregado paralelo.

### 1.2 Resolución de confianza

El único resolver productivo actual recibe la cookie `sr_station` y:

1. valida un secreto base64url opaco de 43–128 caracteres;
2. calcula SHA-256 y busca la credencial activa;
3. une por Tenant la Station, su binding y Branch;
4. exige Station `active`, `revoked_at IS NULL`, binding vigente, credencial
   vigente y Branch activa;
5. produce un `TrustedStationContext` opaco con Tenant, Branch, Station,
   credential ID no secreto y las cuatro admission revisions;
6. al confirmar efectos protegidos, vuelve a bloquear/revalidar ese snapshot
   dentro de la transacción.

El request no puede aportar Tenant, Branch o Station por body, query, host,
local storage o header alterno. Ausencia o inconsistencia falla cerrada.

### 1.3 PIN y Operational Sessions

- PIN login recibe primero un `TrustedStationContext`; por tanto no funciona
  sin Station, binding, Branch y credencial vigentes.
- Cada Operational Session captura Tenant, Branch, Station, credential y las
  admission revisions observadas.
- La resolución de Session revalida Station y User dentro de la transacción.
  Un snapshot stale se marca `invalidated` cuando alcanza esa frontera.
- Si la Station credential ya no permite resolver contexto, el request se
  deniega antes de leer la Session. La fila puede conservar temporalmente
  estado `active`, pero no concede operación. TL-07 debe además solicitar a
  Access la invalidación material de las Sessions afectadas para que lifecycle
  y evidencia coincidan con el resultado de seguridad.

### 1.4 Escritores y superficies existentes

No existe hoy una autoridad productiva para crear, renombrar, vincular,
desvincular, relinkear o revocar Stations.

Los únicos paths que alteran o establecen confianza son:

- migraciones iniciales, al crear las tablas y revisions;
- `scripts/local-db-seed.mjs`, exclusivamente local, que upserta una Station,
  binding y credential sintéticas;
- fixtures PostgreSQL de test, no runtime;
- Branch deactivation/reactivation TL-05, que cambia indirectamente la
  elegibilidad operacional de Stations vinculadas.

`POST /api/stations/local-bootstrap` es sólo desarrollo local: valida origen y
host local, deriva la credencial desde configuración sintética y establece la
cookie. No crea ni muta registros y no es enrollment productivo.

El Admin shell actual expone Sucursales, Usuarios y Roles. No contiene
Dispositivos, cliente API Station ni controller `/api/admin/stations`.

## 2. Inventario legacy local

Inspección read-only en PostgreSQL 18.4, sin mostrar hashes/secretos y sin
writes:

| Campo | Valor observado |
|---|---|
| `station_id` | `00000000-0000-4000-8000-000000000401` |
| `tenant_id` / Tenant | `00000000-0000-4000-8000-000000000001` / `SR Taller` |
| Station lifecycle | `active`, revision `0`, no `revoked_at` |
| Branch | `00000000-0000-4000-8000-000000000101` / `SR Taller Fixture — Hermosillo` |
| Branch state/timezone | activa / `America/Hermosillo` |
| Binding | vigente, revision `0`, creado `2026-01-01T00:00:00Z` |
| Credentials | 1 vigente, 0 revocadas |
| Station timestamps | creada/actualizada `2026-01-01T00:00:00Z` |
| Operational Sessions | 33 expiradas, 5 invalidadas, 5 cerradas; 0 activas |
| Display name | no existe campo ni dato autoritativo |

La única pista no inventada es que es la Station fixture local vinculada a la
Branch operacional de Hermosillo. El Owner debe proporcionar su nombre visible
si desea un backfill nominal. El repositorio contiene 88 migraciones; esta DB
local tenía 87 aplicadas durante la inspección. No se ejecutó la pendiente.

## 3. Station Inventory V1

### 3.1 Record administrativo mínimo

```text
StationInventoryItem
  tenantId                 server-derived; nunca input/authority cliente
  stationId                UUID server-owned, immutable
  displayName              nombre visible; requerido para nuevas Stations
  lifecycleStatus          UNLINKED | ACTIVE | REVOKED
  branchId                 current binding o null
  branchDisplayName        proyección de lectura, nunca autoridad
  branchStatus             ACTIVE | INACTIVE cuando existe binding
  credentialState          CURRENT | ABSENT | REVOKED
  version                   optimistic product version
  admissionRevision        epoch técnico server-owned, sólo informativo
  createdAt                UTC instant
  updatedAt                UTC instant
  revokedAt                UTC instant o null
```

- `displayName` no es identidad, routing ni autorización. Duplicados son
  admisibles; la UI siempre conserva un ID técnico copiable en detalle.
- `branchDisplayName` se deriva de la Branch actual y no se duplica en Station.
- `credentialState` es una proyección segura; no contiene `credential_id`, hash,
  cookie, token ni material de rotación.
- `lastSeenAt` queda fuera hasta tener un evento Station-owned confiable.
- Un legacy sin nombre puede proyectar `displayName: null` y “Nombre pendiente”
  sólo en UI hasta recibir mapping; nuevas altas no aceptan null.
- `version` cambia al renombrar o transicionar producto. La
  `admissionRevision` cambia sólo cuando varía confianza operacional.

### 3.2 Invariantes

- `ACTIVE`: exactamente un binding abierto, exactamente una credencial
  vigente y Station no revocada.
- `UNLINKED`: ningún binding abierto y ninguna credencial vigente; no opera.
- `REVOKED`: terminal, sin binding abierto ni credencial vigente; no opera.
- Una Branch inactiva no cambia automáticamente Station lifecycle; cambia su
  elegibilidad operacional y se muestra como bloqueada por Branch.
- Cualquier combinación estructural distinta falla cerrada y requiere
  diagnóstico, nunca reparación implícita.

## 4. Superficie administrativa de comandos

| Operación | Ruta propuesta | Capability | Sensibilidad / efecto |
|---|---|---|---|
| List | `GET /api/admin/stations` | `stations.read` | Read; filtra por scopes efectivos. |
| Read | `GET /api/admin/stations/:stationId` | `stations.read` | Read tenant-scoped y branch-scoped. |
| Rename | `POST /api/admin/stations/:stationId/rename` | `stations.manage` | Level 1; sólo nombre + expected version + request ID. |
| Issue enrollment | `POST /api/admin/station-enrollments` | `stations.enrollment.issue` | Level 2; Branch y nombre quedan fijados. |
| Cancel enrollment | `POST /api/admin/station-enrollments/:challengeId/revocation` | `stations.enrollment.cancel` | Level 1; Admin Session, capability, Tenant scope, CSRF y audit, sin reauth. |
| Unlink | `POST /api/admin/stations/:stationId/unlink` | `stations.relink` | Level 2; cierra binding, revoca credenciales/Sessions y deja `UNLINKED`. |
| Initiate relink | `POST /api/admin/stations/:stationId/relink` | `stations.relink` | Level 2; source + target authority y challenge TL-08. |
| Revoke Station | `POST /api/admin/stations/:stationId/revocation` | `stations.revoke` | Level 2; terminal y fail-closed. |

No hay `DELETE`, transición genérica ni `PATCH status`. Reactivation de una
Station `REVOKED` permanece rechazada por el contrato PBI-024. Si el producto
requiere una pausa temporal distinta de Branch deactivation o unlink, será una
decisión y Work Unit posterior, no un alias de revoke.

Todos los comandos aceptan sólo campos allowlisted. Tenant, actor, capability,
nivel, timestamps, revisions resultantes y status resultante son server-owned.
Los comandos mutantes usan journal/idempotencia y optimistic version donde
aplica; un request ID con digest distinto falla con conflicto.

## 5. Enrollment Challenge/Grant

El challenge es un bearer de autoridad estrecha, no una Station credential.
TL-07 emite/cancela; TL-08 consume.

```text
StationEnrollmentChallenge
  tenantId
  challengeId
  targetBranchId
  intendedStationId       null para alta; Station existente para relink
  intendedDisplayName
  kind                    NEW_STATION | RELINK_STATION
  tokenDigest             SHA-256/allowlisted digest del secreto aleatorio
  status                  ACTIVE | CONSUMED | REVOKED | SUPERSEDED | EXPIRED
  issuerUserId
  issuerAdminIdentityId
  issuerAdminSessionId
  issuerAuthorityRevision snapshot(s) necesarios para revalidación
  createdAt
  expiresAt               createdAt + 10 minutos
  consumedAt/revokedAt/supersededAt
  version
```

Reglas:

- token generado con CSPRNG y al menos 256 bits; persistencia digest-only;
- plaintext se devuelve una vez al emitir y nunca vuelve a leerse;
- Tenant, target Branch, kind, intended Station/name y política de credencial
  quedan inmutables después de issue;
- un challenge no autoriza elegir otra Branch ni otro Tenant;
- múltiples challenges son válidos sólo cuando representan dispositivos
  distintos; reissue explícito del mismo intento supersede el anterior;
- cancelado, expirado, superseded o consumed no produce efectos;
- replay y dos consumes concurrentes producen un solo resultado;
- consume TL-08 revalida dentro de una transacción challenge, TTL, single use,
  Tenant/Branch activos, issuer User/Identity/Admin Session, capability/scopes
  y todas las revisions de autoridad relevantes;
- la respuesta a fallos no enumera Tenant, Branch, Station o challenge;
- rate limit no convierte IP, fingerprint o device metadata en autoridad.

Un token reenviado o robado puede usarse mientras esté vigente; por eso el
scope fijo, alta entropía, TTL corto, redacción, single use, cancelación y
consume atómico son controles obligatorios. Fingerprint no se añade como
autoridad. QR, código o copia manual sólo son representaciones del mismo
secreto.

## 6. Autoridad de Branch y nombre

Recomendación: **opción A**.

El Tenant Admin selecciona target Branch y Station display name al emitir. El
servidor deriva Tenant de la Admin Session, carga Branch dentro de ese Tenant y
persiste ambos datos en el challenge. TL-08 sólo presenta/canjea el secreto; no
puede cambiar Branch, nombre, Tenant ni kind.

Esto minimiza autoridad mutable durante redemption y coincide con ADR-015: el
equipo nuevo nunca elige Tenant/Branch. La elección de nombre en TL-08 también
queda rechazada porque permitiría modificar la intención administrativa sin
Admin Context.

## 7. TTL y reauthentication

- TTL: **10 minutos exactos**, ya aprobado por TLD-006/ADR-015 y medido con
  reloj server-side.
- Issue: Level 2, `stations.enrollment.issue`, Admin Session y password reauth
  con edad estrictamente menor a 10 minutos.
- Relink/unlink/revoke: Level 2 con el mismo mecanismo TL-02; no se pide PIN ni
  password dentro del comando.
- Consume: no vuelve a solicitar Admin password al equipo, pero revalida la
  autoridad y estado vigentes del issuer.
- Cancel challenge: Level 1 con `stations.enrollment.cancel`; elimina una
  autoridad pendiente y no requiere reauth reciente.

No se introduce remember-me, segundo reauth, OTP, aprobación de supervisor ni
token long-lived.

## 8. Modelo de Station Credential

- El dispositivo conserva un secreto aleatorio de 32 bytes en cookie
  `HttpOnly`, `SameSite=Strict`, `Path=/` y `Secure` fuera de local.
- El servidor conserva sólo el digest y metadata no secreta tenant/station.
- La credencial no contiene ni selecciona Branch; la Branch vigente se resuelve
  desde el binding server-side.
- V1 exige como máximo una credencial vigente por Station mediante unique
  parcial `(tenant_id, station_id) WHERE revoked_at IS NULL`.
- Initial enrollment TL-08 crea Station + binding + credential + consume en un
  commit. TL-07 no entrega credenciales permanentes.
- Unlink/relink/revoke revocan la credencial vigente y avanzan revisions.
- Relink exitoso emite una credencial nueva; la cookie antigua no sigue al
  nuevo Branch.
- Raw credential, digest y IDs internos de credencial no aparecen en Admin UI,
  API inventory, audit o logs.

## 9. Semántica de relink

Recomendación fail-closed:

```text
Station ACTIVE en Branch A
  -> Admin Level 2 con stations.relink
  -> autoridad efectiva sobre A y B
  -> lock Station + binding + credential
  -> cerrar binding A
  -> revocar credencial y Operational Sessions
  -> Station UNLINKED
  -> emitir challenge RELINK_STATION fijado a Station + Branch B
  -> TL-08 canjea desde el equipo
  -> nuevo binding histórico B + credencial nueva
  -> Station ACTIVE con revision nueva
```

- Branch B debe pertenecer al mismo Tenant y estar activa.
- Una Station revocada no puede relinkearse.
- Durante el intervalo no existe contexto operacional válido.
- Dos relinks, revoke contra relink o replay se serializan con lock de Station,
  expected version/revision y journal.
- Nunca se actualiza silenciosamente `branch_id`; A y B quedan en historia.
- Mover entre Tenants no es relink: la Station se revoca y un alta futura usa
  identidad nueva.

La necesidad de redemption en el dispositivo y el momento de corte requieren
confirmación Owner porque cambian la experiencia visible y el downtime.

## 10. Revoke, deactivate y unlink

| Concepto | Semántica propuesta |
|---|---|
| Unlink / “Desvincular dispositivo” | Cierra binding vigente, revoca todas las credenciales vigentes, invalida Sessions, conserva Station/historia y deja `UNLINKED`. Para operar exige enrollment/relink nuevo. |
| Revoke credential | Invalida un material técnico concreto; la Station no puede quedar `ACTIVE` sin otra credencial vigente. En V1 ocurre dentro de rotation/unlink/revoke, no como botón ambiguo. |
| Revoke Station | Terminal: cierra binding, revoca credenciales/Sessions, marca `REVOKED`, conserva historia y no admite reactivate. |
| Deactivate Station | No existe en el lifecycle aceptado y no se añade como sinónimo. Branch deactivation ya pausa elegibilidad sin destruir trust. |
| Reactivate Station | No permitida para `REVOKED`. `UNLINKED -> ACTIVE` requiere nuevo enrollment y credencial. |

El Owner debe confirmar que “Desvincular dispositivo” significa exactamente
unlink fail-closed y no revoke terminal ni pausa reversible.

## 11. Interacción con Branch lifecycle

Estado actual y contrato V1:

- al desactivar una Branch, sus Stations permanecen inventariadas y sus
  credentials/bindings permanecen almacenados;
- el verifier exige Branch activa, por lo que trusted context, PIN login y
  cualquier operación se deniegan inmediatamente;
- `branch.admission_revision` cambia y hace stale todas las Operational
  Sessions anteriores;
- reactivar la Branch puede restaurar elegibilidad para una Station todavía
  `ACTIVE`, con binding/credential nunca revocados; el siguiente login crea
  contexto/Session nuevos;
- ninguna Operational Session anterior revive porque conserva revision vieja;
- reactivar Branch nunca restaura una Station `REVOKED`, un binding cerrado o
  una credential revocada.

Esta distinción permite una pausa administrativa de Branch sin inventar
Station `INACTIVE` y sin preservar trust revocado.

## 12. Capabilities y autorización

El catálogo y starter Tenant Admin policy v1 ya contienen exactamente:

| Necesidad | Capability existente |
|---|---|
| Inventario read | `stations.read` |
| Rename/metadata no sensible | `stations.manage` |
| Issue enrollment | `stations.enrollment.issue` |
| Cancel enrollment | `stations.enrollment.cancel` |
| Revoke/unlink terminal | `stations.revoke` según efecto; unlink para relink usa `stations.relink` |
| Initiate/complete Branch move | `stations.relink` |

No hay nuevos códigos, `isAdmin`, Role-name bypass ni autoridad proveniente de
UI.

TL-06 permite capabilities Branch/Station tenant-wide o branch-restricted,
pero el `AdminAuthorizationExecutor` actual sólo compone assignments
`TENANT_WIDE`. TL-07 debe extender la frontera de Access para autorización
scope-aware:

- list devuelve Stations de Branches permitidas o todas si existe grant
  tenant-wide;
- issue/cancel/rename/revoke exige grant tenant-wide o del Branch objetivo;
- relink exige autoridad efectiva sobre Branch origen **y** destino, salvo un
  grant tenant-wide;
- una Station `UNLINKED`/`REVOKED` sólo puede administrarse con grant
  tenant-wide porque ya no tiene Branch vigente;
- el commit guard vuelve a comprobar Session, User/Identity/Credential, Role,
  assignment, capability, Branch scope y reauth dentro de la transacción.

Stations no importa tablas Access. El controller/orquestador Access resuelve
Admin Context y pasa un guard opaco; Stations conserva ownership de sus tablas.

## 13. Aislamiento multitenant

Toda lectura/escritura usa `context.tenantId` derivado de Admin Session:

- list filtra por Tenant y scopes de Branch efectivos;
- read/mutate carga por `(tenantId, stationId)`;
- challenge se carga por `(tenantId, challengeId)`;
- target Branch se carga por `(tenantId, branchId)`;
- FKs compuestas impiden binding cross-tenant;
- IDs Beta enviados por Admin Alfa producen ausencia/denegación sanitizada;
- ni path, body, query, host, cookie Station ni payload challenge pueden
  sustituir el Tenant administrativo;
- TL-08 consume por digest globalmente único, pero el resultado obtiene scope
  sólo del challenge persistido y nunca del equipo.

Las pruebas usan Alfa/Beta con UUIDs y nombres similares para cubrir list,
read, issue, cancel, unlink, revoke, relink y consume/modify.

## 14. Migración y backfill

Implementación mínima prevista:

1. Extender `stations` con `display_name` nullable para legacy y `version`;
   hacer mutable `updated_at` y ampliar status a `unlinked | active | revoked`.
2. Mantener la Station legacy activa sin rotar/revocar su credential.
3. Reconciliar `station_bindings` a PK histórica
   `(tenant_id, station_id, binding_sequence)` o ID equivalente, con
   `linked_at/unlinked_at` y unique parcial para un solo binding abierto.
   Backfill: `created_at -> linked_at`, `revoked_at -> unlinked_at`.
4. Añadir unique parcial de una credential vigente por Station sin exponer ni
   rehashar el secreto existente.
5. Crear tablas owner `stations` para enrollment challenges, Station/enrollment
   command journals y audit events allowlisted.
6. Actualizar verifier para seleccionar sólo el binding abierto exacto y
   rechazar multiplicidad/corrupción.
7. Mantener `display_name` nullable sólo para legacy hasta mapping aprobado;
   aplicación exige nombre no vacío para todo alta nueva.
8. Aplicar constraints/FKs tenant-scoped, optimistic versions, TTL/status
   checks e índices sin default de autoridad.

La migración no inventa nombre, no cambia Branch, no cambia cookie/credential,
no invalida la Station local y no toca timestamps históricos. El mapping local
exacto queda pendiente del Owner.

## 15. Auditoría y seguridad

Eventos allowlisted mínimos:

- `STATION_ENROLLMENT_ISSUED`, `..._REVOKED`, `..._EXPIRED`,
  `..._SUPERSEDED`, `..._CONSUMED` (consume lo publica TL-08);
- `STATION_RENAMED`, `STATION_UNLINKED`, `STATION_REVOKED`;
- `STATION_RELINK_INITIATED`, `STATION_RELINK_COMPLETED`;
- `STATION_CREDENTIAL_ISSUED`, `..._ROTATED`, `..._REVOKED`;
- `STATION_OPERATIONAL_SESSIONS_INVALIDATED` cuando corresponda;
- denegaciones sensibles relevantes con reason code tipado y no enumerante.

Cada evento conserva IDs opacos necesarios, Tenant, Branch, Station/challenge,
actor User/Admin Identity/Admin Session, acción, resultado, sensitivity level,
correlation, versiones/revisions resultantes y timestamp UTC.

Nunca conserva token enrollment, Station credential/digest, PIN/password,
cookies, Session bearer/CSRF, headers completos, payload libre, fingerprint o
datos de otro Tenant. Logs diagnósticos no sustituyen audit durable.

## 16. Admin UI V1

Agregar **Dispositivos** al shell administrativo, visible por
`stations.read`:

- lista filtrada con nombre, Branch, lifecycle/operability y timestamps;
- detalle con ID técnico, Branch actual, estado de credential sin secreto e
  historia de bindings;
- rename para `stations.manage`;
- “Vincular nuevo dispositivo” para emitir challenge;
- challenges activos con expiración y cancelación;
- acciones explícitas y separadas: iniciar cambio de sucursal, desvincular y
  revocar Station;
- diálogo de reauth TL-02 para acciones Level 2, sin password en el comando;
- confirmaciones que expliquen invalidación de Sessions y necesidad de nuevo
  enrollment.

Representación recomendada: QR más código de alta entropía copiable, ambos del
mismo secreto mostrado una sola vez. QR no añade confianza ni contiene Tenant,
Branch o privilege elegidos por el cliente. Evitar URL durable para reducir
historial/referrer/log leakage.

Reusar Design System y validar desktop/768/640, teclado/foco, lectores,
light/dark y sin overflow. Ocultar controles no sustituye deny server-side.
TL-08 y su pantalla de redemption no se implementan aquí.

## 17. Bloques futuros de implementación

1. **Decisiones y contrato:** resolver TL7D, reconciliar PBI-031 y actualizar
   las fuentes canónicas afectadas.
2. **Dominio/schema:** Station V1, historial de bindings, versions, constraints,
   challenge/journals/audit y backfill seguro.
3. **Authorization scope:** extensión Access tenant-wide/Branch-restricted y
   commit guards Level 2.
4. **Inventory reads:** repositorio/snapshot tenant-scoped y no-secret.
5. **Enrollment authority:** issue/cancel/supersession/expiry digest-only; sin
   redemption.
6. **Lifecycle commands:** rename, unlink, revoke e initiate relink con locks,
   idempotencia e invalidación mediante puerto Access.
7. **HTTP:** controllers administrativos allowlisted y errores sanitizados.
8. **Admin UI:** Dispositivos, detalle, challenge one-time y acciones sensibles.
9. **Verification/evidence:** unitarias, aplicación, PostgreSQL, API, browser,
   regresiones, arquitectura y pipeline gobernado.

Ningún bloque inicia TL-08 ni habilita consume público.

## 18. Plan de pruebas

| Área | Cobertura material obligatoria |
|---|---|
| Inventory | list/read/rename; null legacy name; no secrets/digests/credential IDs; history ordered; scope filtering. |
| Enrollment | issue, exact 10-minute expiry, cancel, supersede, replay, forwarded token, wrong Tenant/Branch, inactive Branch, issuer/session/Role/revision changed. |
| Concurrency | two consumes (preparado para TL-08), cancel-vs-consume, relink-vs-revoke, duplicate request IDs/digests and row-lock ordering. |
| Level 2 | issue/relink/unlink/revoke and the approved cancel level with valid, absent, future, exact-10-minute and expired reauth. |
| Credential | random secret only once, digest-only DB, one current credential, rotation, revoke and no response/log/audit leakage. |
| Relink | A→B history, same Tenant, inactive/cross-Tenant B denied, stale authority denied, old credential/session denied, new redemption required if approved. |
| Revoke/unlink | next trusted-context request denied; PIN login denied; Sessions immediately ineffective and materially invalidated; no reactivation of revoked trust. |
| Branch lifecycle | inactive Branch blocks use; reactivation permits only never-revoked trust and never revives old Sessions. |
| Tenancy | Alfa cannot list/read/issue/cancel/revoke/unlink/relink/consume Beta via guessed IDs or token. |
| PostgreSQL | migration/backfill, 88+ expected manifest, rerun 0 pending, constraints/FKs, SERIALIZABLE/row-lock races and cleanup. |
| Regression | local bootstrap, PIN flow, Operational Sessions, Branches, Users/Roles, Repairs and Catalog unchanged. |
| UI | desktop/768/640, keyboard/focus, native controls, screen-reader names, light/dark, no page overflow and direct API/UI agreement. |
| Security | secret scan plus negative assertions for token, credential, PIN, password, cookies, headers and unrestricted payload. |

## 19. Decisiones Owner resueltas

| ID | Decisión aprobada |
|---|---|
| TL7D-001 | Modelo A: el Admin fija Branch y nombre al emitir; TL-08 no puede sustituirlos. |
| TL7D-002 | QR y código manual representan la misma autoridad fuerte, single-use y digest-only. |
| TL7D-003 | Unlink corta credencial, Sessions y binding; conserva la Station `UNLINKED` recuperable sólo por enrollment nuevo. |
| TL7D-004 | Relink corta inmediatamente A, deja `UNLINKED` y emite autoridad fijada a B para redemption TL-08. |
| TL7D-005 | Cancelar challenge sin consumir es Level 1, capability-gated y sin reauth. |
| TL7D-006 | Sólo `...0401` recibe `SR Taller Fixture — Dispositivo 1`; cualquier otro legacy sin nombre falla cerrado. |

No requieren una decisión nueva: TTL 10 minutos, issue/relink/unlink/revoke
Level 2, revoke terminal, Branch reactivation sin resurrección de Sessions o
trust revocado, capabilities existentes, Tenant server-derived, digest-only y
separación Admin/Operational.

## 20. ACTIVE_CHECKLIST

El checklist activo registra TL-07, riesgo arquitectónico, implementación,
proof material y gates locales. Las decisiones Owner están resueltas; TL-08,
push, PR, merge y deploy permanecen fuera de alcance.

## 21. Criterio de salida de implementación

El candidato local queda listo para promoción cuando:

- el audit coincide con código, schema y datos locales actuales;
- no existe segundo agregado ni segunda autoridad productiva;
- inventory, challenge, credential, relink, revoke, Branch interaction,
  authorization, tenancy, migration, audit, UI y tests tienen fronteras
  implementables;
- links, arquitectura, secretos, diff y lifecycle Work Unit pasan;
- las decisiones TL7D aprobadas están materializadas sin ampliar TL-08;
- pruebas focalizadas, PostgreSQL material, UI responsive/accesible y
  `verify:full` pasan sobre el candidato final.

El resultado local es **READY_FOR_PROMOTION** sólo después de esos gates. No se
autoriza iniciar TL-08, push, PR, merge ni deploy.
