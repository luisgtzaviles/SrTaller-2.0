# TL-05 — Branch Management V1 + Tenant Activation Readiness

## Estado

- **Work Unit:** TL-05 — Branch Management V1 + Tenant Activation.
- **Iteración:** discovery y readiness; no implementación de producto.
- **Tipo / riesgo:** `DISCOVERY` / `ARCHITECTURAL`.
- **Dependencias satisfechas:** ADR-015, Tenant Lifecycle MVP y TL-02–04
  integrados y cerrados.
- **Resultado:** `WAITING FOR LEGACY BRANCH MAPPING`; `TL5D-001–003` fueron
  aprobadas y sólo `TL5D-004` permanece pendiente antes de autorizar
  implementación.
- **Fuera de alcance:** TL-06, Station enrollment, billing, planes, Super Admin,
  hard delete y cambios de producto no descritos aquí.

Este documento prepara una extensión del agregado Branch existente. No crea
endpoints, tablas, migraciones, UI, eventos ni cambios de datos.

## 1. Auditoría de la implementación Branch actual

### 1.1 Modelo físico y ownership

Branch ya existe; no debe crearse un segundo agregado.

| Superficie | Estado material | Consecuencia TL-05 |
|---|---|---|
| Owner físico | `stations` posee `branches`, `stations`, `station_bindings` y `station_credentials` | Extender `stations`; no crear un módulo o repositorio Branch paralelo. |
| Clave | PK compuesta `(tenant_id, branch_id)` y FK `tenant_id -> tenants` con `RESTRICT` | El Tenant continúa siendo el límite padre y el Branch ID aislado nunca concede acceso. |
| Campos | `tenant_id`, `branch_id`, `time_zone`, `active`, `admission_revision`, `created_at` | Faltan nombre, versión de edición y `updated_at`. |
| Lifecycle | `active boolean NOT NULL DEFAULT true` | Ya representa `ACTIVE`/`INACTIVE`; no añadir otra columna de estado competidora. |
| Timezone | `time_zone text NOT NULL DEFAULT America/Hermosillo` | El valor actual es IANA; el default fue un fallback legacy, no una política para nuevas Branches. |
| Concurrencia operativa | `admission_revision >= 0`, incrementada por trigger cuando cambia `active` | Conservarla; una transición de lifecycle invalida snapshots de admisión anteriores. |
| Unicidad | Sólo PK `(tenant_id, branch_id)` | No existe unique por nombre, timezone ni estado. |
| Update/delete | El repositorio sólo crea, lee, lista y cambia timezone; no existe delete ni comando lifecycle | Añadir comandos owner-scoped; no implementar hard delete. |
| Proyección | `BranchRecord` omite `active` y `admission_revision` | Ampliar el record a Branch V1 sin exponer la revisión como control cliente. |

Las referencias compuestas a Branch preservan Tenant en Station bindings,
Roles branch-scoped, Customers, Repairs, folios, ubicaciones, políticas de
Repair, técnicos y precios por Branch. Las FKs relevantes usan `RESTRICT`; una
desactivación conserva todas esas relaciones y un borrado físico no es viable
ni deseado en V1.

### 1.2 Supuestos operacionales existentes

- La verificación de Station Credential exige `branches.active = true`.
- La revalidación de una Operational Session exige Branch activa y la misma
  `admission_revision`; desactivar falla cerrado y no deja válida una Session
  anterior.
- Repairs, Customers y otras superficies confían en el scope compuesto
  Tenant + Branch, no en el nombre de la sucursal.
- El runtime de health sólo verifica forma de schema; no asume que todas las
  Branches estén activas.
- La migración TL-03 hizo un backfill único de Tenant a `ACTIVE` sólo cuando ya
  coexistían Branch activa y autoridad Tenant Admin efectiva. No existe un
  caso de uso runtime para esa transición.
- La pantalla operacional `/configuracion/sucursal` modifica timezone desde
  Station + Operational Session usando `access_matrix.manage`. Esa mutación
  queda en conflicto con la nueva frontera ADR-015 y debe retirarse o
  redirigirse al control plane; la lectura operacional de timezone permanece.

### 1.3 Datos locales observados, sin writes

La inspección read-only de PostgreSQL 18.4 encontró 81 migraciones:

| Tenant | Estado | Branches | Activas | Admin efectivo |
|---|---:|---:|---:|---:|
| `SR Taller` sintético/local | `ONBOARDING` | 2 | 2 | 0 |

- Branch local `...0101`: `America/Hermosillo`, activa, una Station activa
  vinculada.
- Branch local `...0102`: `America/Tijuana`, activa, sin Station vinculada.
- Ninguna fila contiene nombre porque la columna aún no existe.
- No se mutó Tenant, Branch, Station, Role, Session ni datos operacionales.

El estado local no debe promoverse automáticamente a `ACTIVE`: carece del
starter Tenant Admin efectivo exigido por el predicado. Los nombres legacy
requieren una fuente o mapping aprobado; el código actual no contiene uno.

## 2. Mapa de reutilización

| Necesidad TL-05 | Reutilización obligatoria | Extensión mínima |
|---|---|---|
| Branch aggregate | Tabla, IDs, FK, repositorio y owner `stations` | Modelo V1, comandos, journal y eventos dentro del mismo owner. |
| Tenant authority | `AdminAuthorizationExecutor` TL-02 | Requerimientos server-owned por endpoint y commit guard dentro de la transacción. |
| Reauth | `AdminSession.reauthenticatedAt` y ventana exacta de 10 minutos | `requiresRecentReauthentication: true`; no otra password ni proof. |
| Capabilities | Catálogo y starter policy v1 TL-03 | No requiere capability ni policy version nueva. |
| Tenant lifecycle | `tenants.lifecycle_status`, `version`, `updated_at` TL-03 | Puerto Tenancy para lock y transición monotónica. |
| Atomicidad | Transaction runner y transaction context compartido | Un caso de uso Branch coordina puertos owner-scoped sin nested transactions. |
| Timezone | `parseBranchTimeZone` y contrato de `DATA_ARCHITECTURE` | Reusar validación IANA; retirar default implícito de nuevas altas. |
| Operational safety | `active` + `admission_revision` y verificador Station | Conservar trigger y revalidación; no revocar/borrar Station al desactivar. |
| UI | Design System, tokens, fields, feedback y responsive existentes | Admin Session gate/shell mínimo y páginas Branch; no reutilizar `SessionProvider` operacional. |

La composición recomendada mantiene `stations -> tenancy` y evita el ciclo
`stations -> access`. El controller en `access` resuelve Admin Context y pasa
al servicio Branch un guard opaco. `stations` inicia la transacción, modifica
su agregado y usa un puerto público de `tenancy` para la activación. Cada owner
accede sólo a sus tablas mediante el transaction context común.

## 3. Modelo Branch V1 propuesto

```text
Branch
  tenantId             server-derived, immutable
  branchId             server-generated UUID, immutable
  displayName          non-empty, trimmed
  timeZone             validated IANA identifier
  status               ACTIVE | INACTIVE (domain mapping of existing active)
  version              optimistic edit version
  admissionRevision    Stations-owned operational epoch
  createdAt            UTC instant
  updatedAt            UTC instant
```

Reglas:

- `active` continúa como única representación física del lifecycle y se vuelve
  mutable por el owner; `status` es su proyección de dominio/API.
- `version` protege ediciones administrativas; `admission_revision` protege
  admisión operacional. No son intercambiables.
- `tenantId`, IDs, lifecycle, versiones y timestamps no se aceptan como
  autoridad desde el cliente.
- No existen dirección, teléfono, horario, geocoding, jerarquía, transferencia
  ni delete en V1.
- El nombre no es identidad ni autoridad. Los nombres duplicados están
  permitidos; `branchId` permanece como identidad autoritativa.

## 4. Superficie de comandos Branch

| Operación | Ruta administrativa propuesta | Entrada cliente allowlisted | Resultado |
|---|---|---|---|
| List | `GET /api/admin/branches` | paginación/orden allowlisted si es necesaria | Branches del Tenant de la Admin Session. |
| Read | `GET /api/admin/branches/:branchId` | Branch ID candidato | Branch sólo si pertenece al Tenant efectivo. |
| Create | `POST /api/admin/branches` | `clientRequestId`, nombre, timezone | Branch server-ID `ACTIVE`; activa Tenant si completa el predicado. |
| Update | `PATCH /api/admin/branches/:branchId` | `clientRequestId`, `expectedVersion`, nombre y/o timezone | Snapshot versionado; no cambia lifecycle. |
| Deactivate | `POST /api/admin/branches/:branchId/deactivation` | `clientRequestId`, `expectedVersion` | `INACTIVE` o error tipado de última Branch. |
| Reactivate | `POST /api/admin/branches/:branchId/reactivation` | `clientRequestId`, `expectedVersion` | `ACTIVE`; puede completar activación de un Tenant `ONBOARDING`. |

Los bodies no contienen `tenantId`, actor, capability, sensitivity,
`reauthenticatedAt`, status arbitrario, timestamp ni correlation ID. El
servidor genera correlation e IDs. `clientRequestId + command kind + tenant`
identifica el journal; mismo digest reproduce el snapshot y un digest distinto
produce conflicto estable. List/read no escriben ni requieren journal.

No se propone un `DELETE` ni un endpoint genérico que acepte una transición
libre. La mutación operacional antigua de timezone debe dejar de ser un path
alternativo; el runtime operacional conserva sólo lectura/presentación.

## 5. Capabilities y autorización

El catálogo y `STARTER_TENANT_ADMIN_POLICY` v1 ya contienen exactamente:

| Operación | Capability | Control adicional |
|---|---|---|
| list/read | `branches.read` | Admin Session válida. |
| create/update | `branches.manage` | Admin Session + CSRF/origin + commit guard. |
| reactivate | `branches.deactivate` | Level 2 + reauth reciente obligatoria. |
| deactivate | `branches.deactivate` | Level 2 + reauth reciente obligatoria. |

No se requiere bump de policy ni nuevas capabilities. No hay `isAdmin`, Role
name bypass ni confianza en UI. El starter Tenant Admin obtiene el bundle
server-owned; un Role futuro sólo obtiene estas facultades mediante capability
explícita.

En toda mutación el commit guard revalida, dentro de la misma transacción:

1. Admin Session vigente y perteneciente al mismo Tenant;
2. User/Identity/Credential vigentes y revisiones actuales;
3. assignment/Role/capability tenant-wide actuales;
4. reauth vigente cuando el requirement lo exige;
5. Branch cargada por `(context.tenantId, branchId)`.

Una Operational Session, PIN, Station cookie o `access_matrix.manage` no
autoriza estos endpoints.

## 6. Diseño de activación del Tenant

El owner `stations` inicia una transacción `SERIALIZABLE` para create/reactivate
y coordina puertos transaccionales estrechos:

```text
Admin Context autorizado
  -> lock Tenant row FOR UPDATE
  -> replay/idempotency check
  -> commit guard de Session + branches.manage
  -> confirmar Tenant Admin efectivo mediante owner Access
  -> crear/reactivar Branch ACTIVE mediante owner Stations
  -> si Tenant = ONBOARDING y existe Admin efectivo + Branch ACTIVE:
       owner Tenancy actualiza Tenant a ACTIVE, version + 1, updatedAt
  -> Branch event + Tenant event cuando aplica
  -> journal result
  -> commit único
```

- La primera Branch y la transición a `ACTIVE` quedan en el mismo commit.
- `ACTIVE` es monotónico en MVP; no existe comando `ACTIVE -> ONBOARDING`.
- Agregar Branches posteriores no vuelve a modificar el lifecycle del Tenant.
- Dos altas distintas concurrentes se serializan por el lock del Tenant. La
  primera puede activar; la segunda crea otra Branch sobre Tenant ya `ACTIVE`.
- Dos replays con el mismo request/digest convergen al mismo resultado; una
  reutilización contradictoria falla cerrada.
- El frontend nunca envía `ACTIVE` para el Tenant.
- Una Station no participa en el predicado.

La autoridad Tenant Admin efectiva debe conservar la semántica ya usada por
TL-03: User activo, Admin Identity activa/verificada, credential activa,
starter Role `SYSTEM_MANAGED` en policy vigente y assignment tenant-wide
activo. Poseer sólo una capability Branch en un Role parcial no equivale al
predicado de activación.

## 7. Invariante de última Branch activa

Todas las mutaciones de lifecycle Branch deben adquirir primero el mismo lock
`FOR UPDATE` sobre la fila padre Tenant. Después se bloquea la Branch objetivo
y se cuenta el estado actual dentro de la transacción.

Para dos Branches `A` y `B` y dos deactivations simultáneas:

1. Tx-A toma el lock Tenant; Tx-B espera.
2. Tx-A confirma dos activas, desactiva A, incrementa versiones/evento y hace
   commit.
3. Tx-B obtiene el lock y observa sólo B activa.
4. Tx-B devuelve `LAST_ACTIVE_BRANCH_REQUIRED` sin efectos.

La disciplina aplica también a create/reactivate para que ningún escritor del
owner eluda el mutex. `SERIALIZABLE` aporta detección adicional, pero el lock
padre define el orden determinista; no se confía en dos pre-checks separados.
No se introduce un contador duplicado de Branches activas.

El error es de regla de negocio, no `404` ni SQL crudo. El journal no registra
como aplicada una denegación. Tenant permanece `ACTIVE`; la Branch final y sus
relaciones permanecen intactas.

## 8. Reauth y acciones sensibles

- **Deactivate:** Level 2 ya aprobado; `branches.deactivate`, Admin Session y
  password reauth con edad `< 10 minutos`.
- El `AdminAuthorizationExecutor` actual ya valida transport/CSRF y la ventana;
  su commit guard revalida Session, reauth y capability durante el efecto.
- No se recibe password en el comando de Branch. La reauth ocurre sólo en
  `/api/admin/session/reauthentication`; el comando consume el timestamp
  autoritativo de la Session.
- Un timestamp exactamente en 10 minutos, futuro, ausente, expirado o ligado a
  otra Session falla.
- List/read son Level 1. Create y update se recomiendan Level 1 porque el
  contrato aprobado no los clasificó sensibles y no restauran confianza
  existente.
- Reactivate puede volver elegibles Station Credentials preexistentes para un
  contexto nuevo. Es Level 2 y reutiliza `branches.deactivate`, la capability
  lifecycle sensible existente, sin crear otra capability.

No se crea otro esquema de password, PIN, approval, timeout o token.

## 9. Contrato timezone

- La autoridad persistida es un identificador IANA validado por
  `parseBranchTimeZone`.
- Nuevas Branches deben enviar una zona IANA explícita; el servidor no deriva
  autoridad del browser, Node, PostgreSQL ni un offset.
- Puede mostrarse una sugerencia UX local, pero el administrador debe
  seleccionarla o confirmarla explícitamente antes de crear. No existe default
  silencioso de producto.
- Update incrementa `version` y `updatedAt`; no reescribe `created_at`, Repairs,
  Sessions, audit ni otros instantes.
- Todos los instantes se almacenan/comparan en UTC. Presentación y límites de
  fecha usan Branch.timeZone conforme a `DATA_ARCHITECTURE.md`.
- La migración debe retirar el default físico `America/Hermosillo` después del
  backfill, para que ningún alta nueva lo herede accidentalmente.

## 10. Migración y backfill

La migración es aditiva sobre `branches`:

1. añadir `display_name` temporalmente nullable;
2. añadir `version integer NOT NULL DEFAULT 0`;
3. añadir `updated_at`, backfill exacto desde `created_at` y volverlo NOT NULL;
4. mantener `active` y mapearlo a `ACTIVE`/`INACTIVE` sin columna duplicada;
5. mantener `admission_revision` y su trigger;
6. conservar `time_zone`; validar filas existentes y retirar su default;
7. backfill de nombre sólo desde mapping Owner aprobado;
8. después del mapping, aplicar nombre no vacío/trimmed, versión no negativa y
   `updated_at >= created_at`;
9. crear journal/eventos owner-scoped con FKs compuestas y sin cascade;
10. actualizar types, migration registry, seed local y pruebas materiales.

No se cambia lifecycle, timezone, Branch ID, binding ni timestamps históricos
durante el backfill. No se activa un Tenant por el simple hecho de migrar.

La base local demuestra que hay filas sin fuente de nombre. `TL5D-004` debe
proveer/autorizar el mapping por Branch y ambiente antes de un NOT NULL. Si un
ambiente compartido contiene IDs no mapeados, la migración falla con un código
explícito; no genera `Sucursal 1`, no usa el UUID como copy y no infiere desde
timezone o Station.

## 11. Eventos de auditoría y seguridad

### Owner Stations, append-only y atómicos con Branch

- `BRANCH_CREATED`
- `BRANCH_UPDATED` con flags allowlisted `NAME_CHANGED` y/o
  `TIME_ZONE_CHANGED`
- `BRANCH_DEACTIVATED`
- `BRANCH_REACTIVATED`

Evidencia mínima: event ID, Tenant, Branch, actor User, Admin Session ID,
capability, sensitivity level, reauth timestamp cuando aplica, versión before/
after, status before/after, correlation ID y `occurredAt`. El evento no guarda
un payload libre.

### Owner Tenancy, append-only y atómico con activación

- `TENANT_ACTIVATED`, con Tenant, actor, Branch que completó el predicado,
  versión before/after, correlation y timestamp.

Ningún journal/evento contiene password, PIN, session token, CSRF, reauth
secret, cookie, header, request body ni datos de otro Tenant. Denegaciones
pueden producir security telemetry allowlisted fuera de la transacción, pero
nunca un evento de negocio exitoso ni un resultado aplicado.

## 12. Scope de Admin UI y onboarding

TL-05 necesita backend y una UI administrativa mínima en el mismo candidato:
TL-02 sólo materializó API/cookies de Admin Session y hoy no existe Admin shell
ni login UI. El handoff TL-04 apunta a `admin.srtaller.com/login`, que el
frontend actual todavía enviaría al gate operacional.

Scope mínimo:

1. `/login`: email/password, estados y recuperación ya soportados por TL-02;
2. Admin Session gate separado de `SessionProvider` operacional;
3. Admin shell mínimo con Tenant y navegación `Sucursales`;
4. Tenant `ONBOARDING` sin Branch válida: setup obligatorio de nombre + zona;
5. creación exitosa: Branch `ACTIVE`, Tenant `ACTIVE`, confirmación y lista;
6. lista/read/edit/deactivate/reactivate con estados loading/empty/error/denied;
7. prompt de reauth antes de deactivate y, si se aprueba, reactivate;
8. home mínima posterior con próximo paso informativo, sin construir Users,
   Stations, billing ni dashboard futuro.

El setup y la administración general usan los mismos endpoints/casos de uso.
Se reutilizan controles, dialogs, feedback, focus trap, tokens, tema y CSS
Modules. La antigua mutación operacional de timezone se retira de navegación y
backend; la operación existente sigue leyendo timezone para presentar fechas.

## 13. Bloques de implementación propuestos

1. **Decisiones y contrato:** incorporar `TL5D-001–003`, resolver el mapping
   `TL5D-004` y fijar el contrato migratorio.
2. **Dominio/schema:** ampliar Branch existente, journal/eventos, migration
   segura y mapping legacy sin alterar relaciones.
3. **Puertos/transacción:** comandos owner `stations`, lock Tenant, optimistic
   versioning, idempotency y puerto Tenancy de activación.
4. **Autoridad:** AdminAuthorization requirements/commit guards, predicado de
   Admin efectivo y negativos cross-tenant.
5. **HTTP:** rutas `/api/admin/branches`, shapes exactos, errores sanitizados,
   correlation y retiro del update operacional alternativo.
6. **Admin UI foundation:** login/session gate y shell mínimo por host/contexto,
   sin Station ni PIN.
7. **Branch UI/onboarding:** setup inicial y lista/create/edit/status/reauth.
8. **Materialidad:** PostgreSQL/concurrencia, browser responsive/a11y,
   regresiones TL-02–04 y operación Station/Repairs/Catalog.
9. **Evidencia/candidato:** docs canónicas, checklist y gates de promoción
   según riesgo; detenerse antes de TL-06.

## 14. Plan de pruebas

### Creación y modelo

- primera y siguientes Branches; IDs/timestamps server-side;
- nombre vacío/whitespace/límite y duplicados permitidos;
- timezone IANA válida, inválida, fixed offset y valor no explícito;
- optimistic version, replay, digest conflict y response-loss retry.

### Activación y concurrencia

- `ONBOARDING -> ACTIVE` sólo con Branch activa + Admin efectivo;
- sin Admin efectivo o con Branch inactiva no activa;
- create concurrente, mismo/diferente client request y rollback total;
- Tenant `ACTIVE` no regresa a `ONBOARDING`; Branches adicionales no cambian
  su versión/lifecycle innecesariamente.

### Lifecycle

- desactivar Branch no final; final rechazada;
- dos deactivations concurrentes prueban un ganador y una denegación;
- reactivate e idempotencia; status/version/eventos coherentes;
- no delete ni pérdida de relaciones/historia.

### Autorización y tenancy

- capabilities exactas; ordinary Admin Session insuficiente para Level 2;
- reauth ausente, expirado, futuro, de otra Session o revocado denegado;
- Alfa no lista/lee/edita/desactiva/reactiva Beta por path/body/query/ID;
- body/query con `tenantId` rechazado; guessed IDs devuelven respuesta
  anti-enumeration;
- Operational cookie/PIN no autoriza Admin API y Admin cookie no autoriza API
  operacional.

### Regresión temporal y operacional

- update timezone cambia sólo representación/límites futuros, no instantes;
- dos IANA y casos cerca de medianoche UTC;
- Station binding permanece; Branch inactiva deniega nuevos contextos;
- Sessions con admission revision anterior fallan; reactivación no revive la
  Session vieja;
- Repairs, Customers, Catalog, TL-02 login, TL-03 bootstrap y TL-04 handoff sin
  regresión.

### PostgreSQL y UI

- PostgreSQL 18.4, primera migración, rollback y rerun `0 pending`;
- constraints, FKs, locks reales, two-tenant fixtures y eventos append-only;
- onboarding, list/create/edit/status/reauth en Chrome;
- teclado, focus, errors, denied, light/dark, desktop/768/640, touch targets y
  sin horizontal overflow ni duplicación del Design System.

## 15. Decisiones Owner

| ID | Estado | Contrato |
|---|---|---|
| `TL5D-001` | **APPROVED** | Nombres duplicados permitidos. `branchId` es identidad; `displayName` es sólo presentación y nunca autoridad, routing ni tenancy boundary. |
| `TL5D-002` | **APPROVED** | Zona IANA explícitamente seleccionada/confirmada. Sugerencia UX permitida; default silencioso y fixed offsets prohibidos. El cambio no reescribe timestamps históricos. |
| `TL5D-003` | **APPROVED** | Reactivación Level 2 con Admin Session, `branches.deactivate` y la ventana de password reauth de 10 minutos de TL-02. El primitivo vigente expira al alcanzar `600000 ms`; no se crea otro mecanismo. |
| `TL5D-004` | **PENDING** | El Owner debe asignar un `displayName` verdadero a cada Branch legacy por su `branchId`. No se permite fallback, placeholder ni inferencia desde timezone, Station o fixtures. |

La inspección local read-only delimitó el input pendiente:

| Branch | Tenant | Timezone | Estado | Creada | Identificación material no nominal |
|---|---|---|---|---|---|
| `00000000-0000-4000-8000-000000000101` | `00000000-0000-4000-8000-000000000001` (`SR Taller`) | `America/Hermosillo` | ACTIVE | `2026-01-01T00:00:00Z` | Una Station activa actualmente vinculada: `00000000-0000-4000-8000-000000000401`; es la Branch operacional usada por fixtures locales. |
| `00000000-0000-4000-8000-000000000102` | `00000000-0000-4000-8000-000000000001` (`SR Taller`) | `America/Tijuana` | ACTIVE | `2026-01-01T00:00:00Z` | Cero Stations vinculadas; no existe otra pista nominal autoritativa. |

Los términos `Centro` y `Centenario` encontrados en ADRs son ejemplos de
dominio, no mappings de estas filas. No se detectó conflicto que requiera un
ADR nuevo.

## 16. ACTIVE_CHECKLIST

- Work Unit iniciada desde `main` cerrado y sincronizado.
- Auditorías de schema, datos locales, ownership, autorización, lifecycle,
  timezone, UI y relaciones operacionales completas.
- Modelo, comandos, transacción, mutex de última Branch, migración, eventos,
  bloques y pruebas definidos.
- Producto, schema y datos permanecen sin cambios.
- `TL5D-001–003` aprobadas y registradas.
- `TL5D-004` bloquea únicamente autorización de implementación.
- TL-06 no está iniciado.

## 17. Readiness

TL-05 es compatible con ADR-015 y puede extender los owners existentes sin un
nuevo agregado, capability bundle o mecanismo de autenticación. El diseño
protege activación, aislamiento y última Branch en una transacción material.
Antes de implementar, el Owner debe proporcionar únicamente el mapping de
nombres legacy `TL5D-004`.

**TL-05 READINESS: `WAITING FOR LEGACY BRANCH MAPPING`.**
