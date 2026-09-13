# Concurrent Operational Sessions — Architecture

## Estado

- **Estado:** arquitectura aceptada; candidato PBI-043 materializado localmente.
- **Autoridad:** ASC-001 a ASC-008 y
  [ADR-014](../decisions/proposed/ADR-014-concurrent-operational-sessions.md).
- **PBI de materialización:** [PBI-043](../backlog/pbis/PBI-043.md), `In review`.
- **Riesgo:** Critical, sin downgrade.
- **Baseline de diseño:** `main`/`origin/main`
  `40684d7554cdf02551f941e5e3f0beabbe563125`.
- **Fuera de alcance:** endpoints administrativos, Device/Session Admin, audit
  global, PBI-040 y Production.

## Resultado

```text
ANTES
Station 1 ── 0..1 Operational Session activa

DESPUÉS
Station 1 ── 0..N Operational Sessions activas independientes
                     │
                     └─ cada request resuelve una sola Session solicitante
```

La unidad de actor deja de ser “el usuario activo de la Station” y pasa a ser
“el User autenticado por la Session solicitante”. Station continúa aportando
el contexto confiable; Session aporta actor y periodo autenticado.

## Auditoría del runtime integrado

La incompatibilidad no está en Chrome, el PIN del User ni el reconocimiento de
la Station. Está materializada en Access:

| Superficie actual | Supuesto encontrado | Delta futuro |
|---|---|---|
| `20260907120000_access_create_operational_sessions.ts` | unique parcial `access_operational_sessions_one_active_station_uq` sobre Tenant+Station activa | remover unique; crear índices parciales no únicos |
| `operational-session-repository.port.ts` | operación `createReplacingActive` combina admission y replacement | separar semántica create/switch o renombrar el contrato sin ampliar API HTTP |
| `kysely-operational-session.repository.ts` | crea/bloquea `access_operational_session_station_guards`, lee una activa y actualiza todas las activas de la Station | create no usa lock global; switch bloquea y actualiza sólo X |
| `access-session.controller.ts` | `expectedSessionId=null` usa challenge inicial, pero el comentario/flujo presupone Station sin Session activa | conservar challenge y reinterpretar null como create independiente |
| `access-session-application.test.mjs` | double en memoria conserva una sola activa y compara contra ella | modelar conjunto y probar create/switch por Session exacta |
| `access-session-contract.test.mjs` | exige por nombre el unique station-wide | sustituir por contrato de índices y ausencia del unique |
| `access-session-postgresql.test.mjs` | llama `createReplacingActive`, consulta una activa y espera replacement/contención global | materializar COS-01…COS-22 con filas y carreras exactas |
| `operational-session-ui-contract.test.mjs` | preserva `expectedSessionId` y coordinación entre tabs del mismo perfil | conservar; agregar prueba de perfiles/cookie jars independientes |

Los guards de PIN por Station/principal son rate limiting y no deben eliminarse
por confundirse con el guard de admisión de Session. Los commit guards de
autorización ya bloquean/revalidan la Session solicitante y son la base que se
preserva para atribución y revocación efectiva.

## Contexto autoritativo

Cada Session persiste y revalida:

```text
Tenant
  └─ Branch
      └─ Station
          └─ StationCredential
              └─ OperationalSession
                  ├─ User
                  └─ SessionId
```

- `sr_station` permite resolver server-side StationCredential, Station,
  Branch y Tenant.
- `sr_session` identifica mediante digest una Session concreta.
- El User no selecciona Tenant, Branch, Station o Session.
- La autorización opera sobre esa Session y revalida User, Station, binding,
  assignment, role/capabilities, PIN credential y epochs.

## Admission y switch

### Login independiente

`expectedSessionId = null` expresa que el perfil no pretende reemplazar una
Session que posea. Después de PIN válido y revalidación transaccional, el
servidor inserta una Session nueva sin consultar o cerrar otras Sessions de la
Station.

### Switch del perfil solicitante

`expectedSessionId = X` continúa siendo un contrato adecuado si se documenta
como precondición session-local:

1. bearer y CSRF deben resolver X en el contexto exacto;
2. se autentica el PIN nuevo sin cerrar X;
3. dentro del commit se bloquea y compara únicamente X;
4. si X sigue activa/current, pasa a `replaced` y se inserta la nueva Session;
5. si falla cualquier precondición, X permanece activa;
6. ninguna otra Session de la Station cambia.

La API no cambia en PBI-043 salvo precisión contractual; no se acepta un
SessionId desnudo como autoridad.

## Transaction boundary y races

### Create independiente

Una transacción Access-owned debe:

1. consumir una proof PIN de un solo uso;
2. revalidar Station/binding/Branch/credential y sus revisions;
3. revalidar User, assignment y PIN credential/version;
4. insertar un SessionId y verificadores generados server-side;
5. confirmar una sola Session por request.

No toma lock station-wide. La PK de Session y la unicidad del token verifier
protegen colisiones; dos requests independientes pueden confirmar dos filas.

### Switch

La transacción bloquea la fila X, aplica compare-and-set por scope/status/
version y crea la nueva Session sólo si puede marcar X `replaced`. Un switch y
logout simultáneos sobre X producen un solo ganador y ningún efecto parcial.

### Revoke/login

La admisión y el punto autoritativo de cada operación revalidan epochs. Si
Station/User/credential cambian antes del commit, el login falla. Si cambian
después, la nueva Session no puede ejecutar la siguiente operación.

No se introduce idempotencia de login ni retry ciego ante outcome desconocido.
Cada login independiente genera una Session distinta. La coordinación browser
existente espera el `Set-Cookie` de una mutación admitida.

## Persistencia y migración PBI-043

### Estado conservado

- PK `(tenant_id, session_id)`.
- Unique `token_verifier`.
- Tenant/Branch/Station/StationCredential/User.
- admission revisions y PIN credential version.
- `active|expired|invalidated|logged_out|replaced`.
- optimistic `version`.
- issued/last activity/expiry/ended timestamps.
- idle 60 minutos y absolute 12 horas.

### Delta materializado en el candidato

```text
DROP partial UNIQUE (tenant_id, station_id) WHERE status = 'active'
ADD partial INDEX  (tenant_id, station_id) WHERE status = 'active'
ADD partial INDEX  (tenant_id, user_id)    WHERE status = 'active'
ADD partial INDEX  (tenant_id, station_credential_id)
    WHERE status = 'active'  -- sólo si EXPLAIN/operaciones lo justifican
```

La tabla guard por Station puede permanecer para compatibilidad o revocaciones,
pero un login independiente no debe bloquearla. El diseño de la migración debe
usar nombres únicos, ownership Access y PostgreSQL 18.x real.

### Deploy compatible

1. Código de transición tolera N Sessions activas aun si la restricción única
   todavía existe.
2. Se agregan índices de consulta/revocación.
3. Se remueve la restricción única mediante migración one-shot.
4. Se habilita el comportamiento concurrente sólo con código y schema
   compatibles.
5. Se verifican filas anteriores sin backfill ni rotación de cookies.

No se debe volver a una versión que asuma una sola fila después de admitir N.
El camino preferido ante defecto es roll-forward.

### Guard de rollback

`down` o la operación compensatoria debe consultar agrupaciones activas por
Tenant/Station. Si alguna tiene `count > 1`, aborta con diagnóstico sanitizado.
Sólo una acción explícita, autorizada y auditada puede terminar Sessions hasta
dejar una; después se recrea el unique. Nunca se elige “la más nueva” ni otra
ganadora silenciosamente.

## Revocación efectiva y materialización

| Evento | Efecto autoritativo | Materialización permitida |
|---|---|---|
| Logout normal | cierra bearer+CSRF exactos | inmediata sobre una fila |
| Switch | reemplaza X exacta | inmediata sobre X |
| Invalidar una Session | SessionId scoped deja de autorizar | inmediata cuando exista comando autorizado |
| User disable/revoke | ninguna Session del User autoriza | puede marcarse al resolver; epoch impide revival |
| Station unlink/revoke | ninguna Session de la Station autoriza | puede marcarse después; epoch impide revival |
| Credential revoke/replace | Sessions dependientes no autorizan | trigger/contrato Access puede materializar conjunto |
| PIN lockout | impide login nuevo | no modifica Sessions activas |

Puertos internos futuros mínimos:

- `invalidateSession(scope, sessionId, expectedVersion, reason)`;
- `invalidateSessionsByUser(tenantId, userId, reason)`;
- `invalidateSessionsByStation(tenantId, stationId, reason)`;
- `invalidateSessionsByCredential(tenantId, userId, credentialVersion, reason)`.

PBI-043 sólo incorpora los contratos necesarios para preservar invariantes y
tests. No expone administración HTTP/UI. La coordinación cross-owner respeta
DEC-005/DEC-049 mediante contratos públicos; no crea writes directos sobre
tablas ajenas.

## Cookies y navegador

No cambian nombres ni atributos:

- `sr_station` identifica el contexto confiable;
- `sr_session` sigue host-only, HttpOnly, Strict y Secure fuera de HTTP local;
- `sr_session_csrf` sigue separado por cookie jar;
- `sr_session_login_csrf` sigue acotado al endpoint de login;
- Origin, Fetch Metadata, JSON-only, no CORS y `no-store` permanecen.

Dos perfiles usan cookie jars independientes. Varias pestañas del mismo perfil
comparten una Session y continúan coordinándose con Web Locks y
BroadcastChannel. No se soportan dos actores simultáneos dentro del mismo
perfil.

## PIN y rate limiting

La tasa durable continúa separada por Tenant/Station/principal opaco y el
contador/lockout de credencial sigue ligado al User del Tenant. Dos perfiles de
la misma Station agregan intentos en el mismo control; dos Stations conservan
controles station-scoped y comparten el estado de la credencial del User.

Un acierto consume sólo su propia reserva. El quinto fallo y cooldown actuales
no se modifican. Lockout no invalida Sessions existentes para impedir que un
tercero cause logout mediante intentos fallidos.

## Autorización y atribución

Toda operación protegida mantiene:

```text
Trusted Station Context
+ Session solicitante vigente
+ User habilitado
+ capability y scope vigentes
+ pertenencia del recurso
→ permitir y atribuir
```

Los hechos de negocio cubiertos conservan Tenant, Branch, Station, User,
SessionId, acción, tiempo y correlation. PBI-043 no crea un audit global de
Access. Future Device/Session Admin deberá decidir sus lifecycle events y
retención.

## Compatibilidad

New Repair, Repair Detail, Price List, User Preferences y otros consumidores no
cambian contrato funcional: cada request continúa recibiendo un solo contexto
autorizado. Trusted Station, PIN, cookies y UI shell se conservan; sólo deja de
existir el reemplazo station-wide.

## Owner/QA proof obligatorio

1. Perfil Owner inicia sesión y permanece en una ruta autenticada.
2. Perfil QA/Codex reconocido para la misma Station inicia sesión de forma
   independiente, sin conocer ni usar el bearer Owner.
3. Ambos hacen reload y conservan SessionIds diferentes.
4. QA ejecuta logout y Owner continúa autenticado.
5. Owner ejecuta una operación permitida y su atribución contiene su propio
   SessionId.
6. Se repite con Users distintos y se verifica consola/network sin secretos.

La evidencia registra build/SHA, ambiente, Station sintética, IDs opacos y
resultados; nunca PIN, bearer o CSRF.

## Relación con Device/Session Admin

Trabajo posterior podrá proyectar Sessions activas, User, Station, Branch,
issued/last activity/expiry, naming de dispositivo, revocación individual,
logout-all, Station revoke/unlink y lifecycle events. Sus capabilities y
controles ADR-013 son propios. No forma parte de PBI-043.

## Reanudación de PBI-040

PBI-040 permanece congelado en su rama no integrada. Tras merge autorizado de
PBI-043, CI exacta de `main` y validación Preview de dos perfiles:

1. eliminar las ramas ya integradas conforme a Branch Policy;
2. actualizar `main` y ejecutar `fetch --prune`;
3. reconciliar la rama PBI-040 desde el nuevo `main` sin reutilizar una rama
   mergeada;
4. comprobar baseline ancestry y runtime provenance;
5. reejecutar gates afectados de PBI-040;
6. continuar Owner Review sin declarar aceptación por inferencia.
