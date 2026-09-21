# TL-03 — Atomic Tenant Bootstrap + Starter Authority Readiness

## Estado

- **Work Unit:** TL-03 — Atomic Tenant Bootstrap + Starter Authority.
- **Tipo / riesgo:** `DISCOVERY` / `ARCHITECTURAL`.
- **Resultado:** `OWNER DECISIONS REQUIRED`.
- **Implementación de producto:** no iniciada.
- **Dependencia satisfecha:** TL-02 está integrada y cerrada; su identidad,
  password credential y Admin Session son reutilizables.
- **Dependencias abiertas:** bundle exacto de autoridad inicial, moneda inicial
  y tratamiento del nombre visible de Tenants ya existentes.

Este documento define el candidato de implementación. No crea endpoints,
migraciones, datos, sesiones, Tenants ni autoridad.

## 1. Contrato de salida

Un grant interno procedente de un Registration Attempt verificado debe poder
producir exactamente una vez:

```text
Verified Registration Grant
  -> Tenant ONBOARDING
  -> first active Tenant User
  -> verified Admin Identity + active password credential
  -> protected/versioned starter Tenant Admin Role
  -> tenant-wide active assignment
  -> durable bootstrap journal/result
  -> sanitized security event
```

El commit es único. Si falla cualquier write, no queda ningún Tenant, User,
credential, Role, assignment, journal ni evento parcial. Un resultado exitoso
no crea Admin Session, Branch, Station, PIN ni autoridad operativa.

## 2. Auditoría de implementación actual

| Superficie | Estado material | Reutilización / gap TL-03 |
|---|---|---|
| `tenants` | Sólo `tenant_id`, `operating_currency`, `created_at` | Reutilizar owner `tenancy`; faltan nombre visible, lifecycle, versión y `updated_at`. |
| `users` | Tenant-scoped, status, versión, admission revision y timestamps | Reutilizar User activo como primera identidad humana. El bootstrap actual presupone que el Tenant ya existe y no cubre la operación completa. |
| `user_provisioning_bootstraps` | Gate durable por `tenant_id` para el primer User | No puede ser la idempotency authority pre-tenant. Se conserva por compatibilidad hasta una decisión de migración posterior; TL-03 no debe encadenar su transacción autónoma. |
| Roles/capabilities | Roles tenant-scoped, capability catalog, assignment tenant-wide/Branch y permisos efectivos por unión | Reutilizar modelo sin permisos directos. Faltan metadatos system-managed/policy version y capabilities de Tenant/Branch/Station. |
| TL-02 Admin Identity | Email global normalizado, identidad verificada, password Argon2id versionado y sesiones separadas | Reutilizar tablas/tipos/KDF. El provisioner actual abre su propia transacción y no puede usarse directamente dentro del bootstrap. |
| Transaction runner | Contexto explícito, misma conexión y owners tipados; prohíbe nested transaction | Base correcta. Faltan factories transaccionales para Users, Roles y Admin Identity. |
| Idempotency | Journals por comando tenant-scoped y resultados reproducibles | Patrón reutilizable; falta una llave pre-tenant ligada al Registration Attempt verificado. |
| Audit | `access_admin_security_events` append-only y sanitizado | Extender allowlist para bootstrap exitoso. Los intentos pre-tenant/denegados pertenecen al audit de Registration en TL-04. |

Baseline físico auditado: 76 migraciones registradas. TL-03 requerirá una
migración aditiva; no se creó ni ejecutó durante esta Work Unit.

## 3. Ownership y orquestación propuestos

No se crea un módulo raíz nuevo.

- `tenancy` sigue siendo único owner de Tenant y del journal que liga el grant
  verificado con el Tenant creado.
- `users` sigue siendo único owner del primer User.
- `access` sigue siendo único owner de capability catalog, starter Role,
  assignment, Admin Identity, credential y security event.
- el caso de uso cross-module vive en la capa de aplicación de `access`, porque
  el grafo vigente ya permite `access -> tenancy, users` y Access compone la
  autoridad inicial;
- cada owner publica un puerto estrecho transaccional. El orquestador recibe un
  solo `DatabaseTransactionContext` y ningún repositorio participante abre una
  transacción interior;
- no se permite que el orquestador escriba directamente tablas ajenas ni que
  un repositorio genérico cruce owners.

La alternativa de un repositorio de bootstrap con acceso directo a todas las
tablas se rechaza: haría co-ownership de persistencia y contradice DEC-049.

## 4. Grant y command internos

TL-03 no expone endpoint público. Su entrada es un objeto interno creado sólo
por el futuro owner de Registration:

```ts
type VerifiedRegistrationBootstrapGrant = Readonly<{
  verifiedRegistrationId: string;
  registrationRevision: number;
  approvedInputDigest: Uint8Array;
  tenantId: string;
  firstUserId: string;
  adminIdentityId: string;
  personDisplayName: string;
  workshopDisplayName: string;
  normalizedEmail: string;
  emailDisplay: string;
  verifiedAt: string;
  passwordVerifier: AdminPasswordStoredVerifier;
  termsAcceptanceEvidenceId: string;
}>;
```

Los IDs del Tenant, User e identidad administrativa se reservan server-side
en el Registration Attempt. Su mera existencia antes de verification no crea
autoridad. Esto permite que TL-04 proteja el password una sola vez con el
purpose TL-02, que está ligado a `tenantId + adminIdentityId`, sin persistir
plaintext ni intentar convertir un verifier en otro.

El borde HTTP futuro sólo recibirá los campos públicos de registro. Nunca
aceptará `tenantId`, IDs internos, lifecycle, Role, capabilities, status,
policy version, verifier ni timestamps desde el cliente.

## 5. Resultado estable

El comando devuelve una proyección allowlisted:

```ts
type TenantBootstrapResult = Readonly<{
  verifiedRegistrationId: string;
  tenantId: string;
  tenantStatus: 'ONBOARDING';
  firstUserId: string;
  adminIdentityId: string;
  starterRoleId: string;
  starterRolePolicyVersion: number;
  starterAssignmentId: string;
  completedAt: string;
}>;
```

No devuelve password, verifier, salt, email de lookup, terms payload, token,
cookie, Session ni material de recovery.

## 6. Frontera transaccional e idempotencia

### 6.1 Transacción

Una sola transacción PostgreSQL `SERIALIZABLE`, iniciada por aplicación:

1. validar forma, revisión y digest del grant confiable;
2. reservar/inserir el journal por `verified_registration_id` con IDs
   server-owned y fingerprint estable;
3. crear Tenant `ONBOARDING`;
4. crear primer User `active`;
5. crear Admin Identity verificada y credential activa TL-02;
6. crear el Role protegido en policy version seleccionada;
7. asignar sus capabilities allowlisted;
8. crear assignment `TENANT_WIDE` activo;
9. registrar evento de seguridad exitoso sanitizado;
10. finalizar el snapshot de resultado y commit.

No hay I/O remoto, envío de email, hashing Argon2, interacción humana ni
creación de Session dentro de la transacción.

### 6.2 Llave autoritativa

- authority key: `verified_registration_id`;
- scope: global pre-tenant;
- el Registration Attempt es inmutable después de verification;
- `approved_input_digest` y `registration_revision` detectan reutilización
  contradictoria;
- el journal conserva el resultado completo necesario para replay, no secretos.

Mismo ID + mismo digest devuelve exactamente el snapshot comprometido. Mismo ID
con digest/revisión diferentes falla con conflicto estable. Otro Registration
Attempt para el mismo email normalizado falla por la unique global de TL-02 y
no deja Tenant huérfano. El nombre del taller no funciona como identidad.

### 6.3 Concurrencia y timeout ambiguo

La unique del journal y la transacción serializable deciden un solo ganador.
`40001`/deadlock pueden reintentarse únicamente en aplicación, con política
acotada y el mismo grant idempotente. Si el cliente pierde la respuesta después
del commit, TL-04 vuelve a ejecutar el mismo grant y obtiene el resultado
persistido. No hay segundo Tenant ni reparación manual.

## 7. Cambios de schema propuestos

### 7.1 `tenants` — owner `tenancy`

Añadir:

- `display_name varchar(160)` no vacío;
- `lifecycle_status varchar` allowlisted a `ONBOARDING | ACTIVE`;
- `version integer >= 0`;
- `updated_at timestamptz >= created_at`.

No se añade suspensión, plan, billing, subdomain ni fixed offset. Un slug no es
necesario en TL-03 y no será autoridad aunque se añada después.

### 7.2 `tenant_bootstrap_commands` — owner `tenancy`

Tabla append-only con:

- `verified_registration_id` PK global;
- `registration_revision` y `approved_input_digest`;
- IDs resultado: Tenant, User, Admin Identity, starter Role y assignment;
- `starter_policy_version`, status resultado `ONBOARDING` y `completed_at`;
- FKs compuestas cross-owner sólo si su revisión demuestra compatibilidad; las
  constraints no crean co-ownership.

No contiene password, verifier, salt, email, token, cookies, IP, user-agent ni
payload genérico.

### 7.3 `access_roles` — owner `access`

Añadir:

- `management_mode = TENANT_MANAGED | SYSTEM_MANAGED`;
- `policy_version integer nullable`, obligatorio y positivo sólo para
  `SYSTEM_MANAGED`;
- partial unique `(tenant_id, role_key)` ya protege la identidad del Role; el
  key reservado recomendado es `tenant_admin`.

Los use cases ordinarios no pueden crear, editar, deshabilitar, archivar,
renombrar, cambiar capabilities ni borrar un Role `SYSTEM_MANAGED`. Sólo un
upgrader server-owned y versionado puede cambiar su policy.

### 7.4 Capability catalog y audit

Se requiere una migración allowlisted para el bundle aprobado y extender el
tipo/event allowlist con `TENANT_BOOTSTRAP_COMPLETED`. No se agregan capacidades
operacionales de Repairs, Catalog, Caja ni PIN al starter Role.

## 8. Starter Tenant Admin authority

Propiedades cerradas:

- key server-owned `tenant_admin`;
- nombre visible server-owned `Administrador del tenant`;
- `SYSTEM_MANAGED`, policy version explícita y estado activo;
- assignment inicial tenant-wide;
- User activo + Admin Identity/credential activas;
- no `isAdmin`, no permisos directos y no elevación por email/orden de alta;
- effective capabilities siguen siendo la unión de Roles vigentes;
- ninguna autoridad operativa se deriva del starter Role.

El predicado de “Tenant Admin efectivo” se define como User activo con
identidad/credential administrativas activas y assignment tenant-wide activo al
Role de policy `tenant_admin`, cuya versión/bundle son válidos. Un custom Role
que copie capabilities no se convierte silenciosamente en la autoridad de
recovery/último Admin.

La protección del Role debe materializarse con TL-03. El guard que impide
retirar al último Admin debe quedar listo antes de exponer mutaciones de Users,
identities o assignments en TL-06; no se considera sustituido por UI oculta.

## 9. Integración con TL-02

Se reutilizan sin duplicar:

- normalización global de email;
- `AdminPasswordStoredVerifier` y profile Argon2id;
- identidad, credential, status y revisiones;
- login posterior, rate limiting, Sessions, recovery y reauth;
- redacción y audit append-only.

No se llama `ProvisionAdminIdentityUseCase` desde la transacción porque hoy
valida un User ya persistido, genera otro ID, ejecuta Argon2 y abre una
transacción autónoma. Se extrae una primitive interna para persistir una
identidad ya aprobada dentro del contexto compartido, preservando la ruta TL-02
ordinaria.

Tras commit, el email/password del primer User puede autenticarse mediante el
login TL-02 existente. TL-03 no crea automáticamente Admin Session y una Admin
Session nunca sirve como Operational Session.

## 10. Audit y seguridad

| Amenaza | Control propuesto |
|---|---|
| Public bootstrap sin verification | No existe endpoint TL-03; exige grant interno verificado, revisado y digest-bound. |
| Elevación elegida por cliente | Role, bundle, policy version, status e IDs de autoridad son server-owned. |
| Tenant/User/credential huérfanos | Una transacción compartida; failure injection después de cada write demuestra rollback total. |
| Retry crea dos Tenants | Journal global + unique email + serialización + replay del snapshot. |
| Conflicting replay | Digest/revisión distintos producen error de idempotencia, nunca overwrite. |
| Cross-tenant references | FKs compuestas, scopes owner-specific y pruebas Alfa/Beta. |
| Password exposure | TL-03 recibe sólo verifier ya protegido; DTO/error/log/audit no lo serializan. |
| System Role mutado | Management mode protegido y mutation paths fail-closed. |
| Privilege drift | Bundle allowlisted/versionado; cambio sólo por upgrader explícito. |
| Timeout después de commit | Reejecución obtiene resultado durable, sin compensación destructiva. |

Los eventos fallidos antes de existir Tenant pertenecen al owner de Registration
en TL-04. TL-03 escribe dentro del commit sólo el éxito tenant-scoped; un evento
que se revierte junto con la operación nunca pretende demostrar un efecto que
no ocurrió.

## 11. Migración y compatibilidad

La implementación requiere una migración forward-only y actualización de:

- `DatabaseSchema` y ownership registry;
- repositorios/ports de Tenancy, Users y Access con factories transaccionales;
- capability type/constraint/seed;
- role mutation contracts y tests de Role protegido;
- Admin Security Event allowlist;
- fixtures y SQL de tests que hoy insertan `tenants` con tres columnas.

La migración debe ser expand/backfill/constrain. Tenants operativos existentes
se recomiendan `ACTIVE`, `version = 0` y `updated_at = created_at`; el nombre
visible necesita decisión Owner porque no existe una fuente autoritativa común
en el schema actual. No se ejecutará migración hasta resolverla.

## 12. Bloques futuros de implementación

1. **Schema de Tenant y journal:** migración, tipos, compatibilidad y tests de
   primera/segunda ejecución.
2. **System-managed Role policy:** metadata, bundle allowlisted, protection de
   mutation paths y policy reader/upgrader.
3. **Transaction-aware owner ports:** Tenancy, Users y Access sobre un contexto
   único, sin nested transactions.
4. **Bootstrap domain/application contract:** grant parsing, server-owned
   policy, resultado/error types y redacción.
5. **Atomic persistence orchestration:** journal, Tenant, User, TL-02 identity,
   Role, capabilities, assignment y event.
6. **Idempotency/concurrency/failure injection:** replay, conflictos y rollback
   por cada corte.
7. **TL-02 regression and isolation:** login posterior, Admin/Operational
   separation, Alfa/Beta y no Session automática.
8. **Evidence and promotion:** PostgreSQL 18.4 material, verification completa,
   revisión arquitectónica/security y handoff; sin iniciar TL-04.

Cada bloque conserva el mismo Work Unit y requiere checklist/evidencia antes de
promoción. No implica autorización de implementación.

## 13. Plan de pruebas

### Unit/contract

- grant válido, campos extra, IDs/status/Role/capabilities inyectados y
  serialización segura;
- policy Role v1 exacta y orden determinista;
- replay mismo digest, conflicto distinto digest/revisión;
- errores públicos estables sin existencia de email/Tenant ni secretos;
- ningún Admin Session/PIN/Operational Session creado.

### PostgreSQL 18.4 material

- migración primera ejecución y segunda `0 pending`;
- bootstrap completo con todas las FKs/scopes y Tenant `ONBOARDING`;
- failure injection después de journal, Tenant, User, credential, Role,
  capabilities, assignment y audit: conteos vuelven a cero;
- dos transacciones simultáneas del mismo grant: un solo resultado;
- dos grants con mismo email normalizado: uno gana, el otro no deja orphan;
- nombres de taller iguales con IDs/email distintos según decisión Owner;
- conflicto de fingerprint y retry post-timeout;
- Tenant Alfa no referencia User/Role/identity de Beta;
- system Role no editable por commands ordinarios;
- audit append-only y sin material sensible.

### Regresión

- login TL-02 del primer Admin después del commit;
- revocación/recovery TL-02 conservan comportamiento;
- Roles ordinarios y unión de capabilities no cambian;
- PIN y Operational Sessions existentes permanecen separados;
- todos los inserts existentes de Tenant y fixtures quedan compatibles;
- arquitectura DEC-005/DEC-049 y ownership registry pasan.

## 14. Decisiones Owner requeridas

### TL3D-001 — Bundle exacto del starter Role

**Recomendación:** autorizar policy v1 con:

- `tenant.profile.read`, `tenant.profile.manage`;
- `branches.read`, `branches.manage`, `branches.deactivate`;
- `users.read`, `users.manage`;
- `access_matrix.read`, `access_matrix.manage`;
- `stations.read`, `stations.manage`;
- `stations.enrollment.issue`, `stations.enrollment.cancel`;
- `stations.revoke`, `stations.relink`.

Las capacidades nuevas se asignan inicialmente sólo al Role protegido; no se
asignan automáticamente a Roles existentes. Level 2 sigue siendo un
factor adicional para Branch deactivation y Station issue/revoke/relink, no una
capability sustitutiva.

### TL3D-002 — Moneda inicial

`operating_currency` es obligatorio pero no forma parte del registro público
aprobado. **Recomendación:** bootstrap server-owned en `MXN` para MVP; no aceptar
currency del cliente y diferir selección/cambio a un Work Unit autorizado.

### TL3D-003 — Nombre de Tenants existentes

El schema actual no tiene workshop/display name. **Recomendación:** para datos
sintéticos/local/Preview usar mapping explícito de seed; para cualquier Tenant
no sintético exigir un backfill administrado antes del `NOT NULL`. No inventar
un nombre genérico ni derivarlo de Branch/email. Los Tenants existentes se
marcan `ACTIVE`; los nuevos de TL-03 nacen `ONBOARDING`.

### TL3D-004 — Unicidad del nombre visible

**Recomendación:** permitir nombres de taller duplicados. `tenant_id` es
identidad y `normalized_email` conserva la restricción V1; el nombre visible no
autoriza ni deduplica.

## 15. Readiness

No se identificó conflicto que requiera un ADR nuevo: ADR-015 define los
contextos/lifecycle y DEC-049 permite la coordinación cross-module mediante
puertos owner-specific en una transacción dirigida por aplicación.

La forma de implementación, transacción, idempotencia, integración TL-02,
threat model y plan de pruebas quedan definidos. El Work Unit permanece
`BLOCKED` y fail-closed hasta que el Owner resuelva `TL3D-001–004`. Después de
esas decisiones puede pasar directamente a autorización de implementación; no
requiere rehacer discovery ni iniciar TL-04.
