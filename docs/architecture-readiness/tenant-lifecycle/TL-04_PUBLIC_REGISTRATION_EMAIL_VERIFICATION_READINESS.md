# TL-04 — Public Registration + Email Verification Readiness

## Estado

- **Work Unit:** TL-04 — Public Registration + Email Verification.
- **Iteración:** contrato aprobado y plan de implementación.
- **Tipo / riesgo:** `IMPLEMENTATION` / `ARCHITECTURAL`.
- **Resultado:** `IMPLEMENTATION AUTHORIZED`; la materialización y sus gates
  viven en el Work Unit TL-04.
- **Dependencias satisfechas:** ADR-015, contrato Tenant Lifecycle MVP, TL-02 y
  TL-03 están integrados y cerrados.
- **Bloqueo de implementación:** ninguno; `TL4D-001–007` fueron resueltos por
  el Owner conforme a la sección 15.

Este documento diseña la conversión segura de un visitante anónimo en la
autoridad interna e inmutable que TL-03 puede consumir. No crea endpoints,
tablas, email, UI, Tenant, Branch, Station ni Session.

## 1. Auditoría de implementación actual

| Superficie | Estado material | Consecuencia TL-04 |
|---|---|---|
| HTTP público | NestJS sirve health, API operacional y API administrativa; no existe controller de registro | Crear una frontera pública separada, con DTOs pequeños y errores anti-enumeration. |
| UI pública | `App.tsx` está completamente dentro de `SessionProvider` y `ApplicationShell` operacional | Las rutas de registro deben resolverse antes del gate Station/PIN y no reutilizar una Operational Session. |
| Tenant Administration | Admin Session email/password existe en `/api/admin/session`; todavía no existe shell público/admin completo | El éxito de registro entrega un handoff al login administrativo, nunca una Admin Session automática. |
| Registration owner | No existe módulo físico ni ownership ejecutable de Registration Attempt | Crear `src/modules/registration/` y añadirlo a DEC-005; es dato de plataforma pre-tenant. |
| Email | No hay dependencia, port, adapter, secret, sender, template ni proveedor transaccional | El provider y dominio remitente son decisiones abiertas; la integración debe quedar detrás de un port. |
| TL-02 | Email global normalizado, password Argon2id, limiter, identidad y Admin Sessions materializados | Reutilizar exactamente normalización, parseo, KDF y límites; no crear un segundo password scheme. |
| TL-03 | Grant validado, bootstrap `SERIALIZABLE`, journal/idempotencia y writers owner-scoped materializados | Reutilizar el caso de uso; falta composición de runtime porque intencionalmente no tiene endpoint ni source real de grants. |
| PostgreSQL | 79 migraciones registradas en la baseline integrada | TL-04 requiere migración aditiva owner `registration`; no se ejecuta en esta iteración. |
| Design System | Tokens, controles, feedback, formularios, tema y responsive ya existen | Reutilizar componentes; no construir Landing ni otro design system. |

No se encontró arquitectura de salida de correo que pueda considerarse
baseline. `QUESTION-019` continúa abierta para mensajería general; seleccionar
un proveedor transaccional para identidad requiere una decisión de integración
acotada y no decide CRM/WhatsApp.

## 2. Mapa de reutilización TL-02 / TL-03

| Necesidad | Reutilización | Extensión mínima |
|---|---|---|
| Email canónico | `normalizeAdminEmail` TL-02 | Publicarlo sólo como primitive server-side de Access. |
| Password | `parseAdminPassword` + `NodeArgon2AdminPasswordHasher` TL-02 | Access publica un factory/servicio estrecho; Registration nunca conoce el pepper. |
| Rate principal | HMAC con purpose separation del patrón TL-02 | Usar un pepper propio de Registration para buckets públicos; no reutilizar el pepper de password. |
| IDs del grant | Contrato TL-03 | Reservar `tenantId`, `firstUserId`, `adminIdentityId` y evidence ID server-side antes de hashear. |
| Bootstrap | `BootstrapTenantUseCase` y journal TL-03 | Access publica un executor/factory interno para Registration; no publica writers ni grant HTTP. |
| Login posterior | Admin Session TL-02 | Redirigir al login sólo después de bootstrap; no iniciar sesión durante verification. |
| Atomicidad tenant | Transacción `SERIALIZABLE` TL-03 | Registration no implementa un segundo bootstrap ni journal competidor. |

El grafo propuesto es `registration -> access -> tenancy/users`. `registration`
posee attempts, challenges, acceptance, delivery y audit pre-tenant. `access`
continúa siendo dueño del bootstrap cross-owner y de la credencial final. La
superficie pública nueva de Access debe ser un `TenantBootstrapExecutorFactory`
o equivalente que acepte un `VerifiedRegistrationBootstrapGrantSourcePort`
server-side. El módulo Registration importa ese contrato y suministra el
source; Access no importa Registration, por lo que no se introduce ciclo.

## 3. Modelo de Registration Attempt

### 3.1 Estados

```text
PENDING_VERIFICATION
  -> VERIFIED       token válido consumido; input queda congelado
  -> EXPIRED        vence el attempt sin verificación

VERIFIED
  -> CONSUMED       TL-03 confirmó su resultado durable
  -> EXPIRED        sólo si se agota la ventana de bootstrap sin resultado

CONSUMED            terminal; replay devuelve el mismo resultado público
EXPIRED             terminal; un alta posterior crea otro attempt server-side
```

`SUPERSEDED` no es necesario para el attempt V1. La rotación ocurre en el
challenge. Un attempt expirado nunca revive; un registro posterior crea otro.

### 3.2 Autoridad e inmutabilidad

El servidor genera y conserva:

- `registrationAttemptId`, `registrationRevision` y versión optimista;
- IDs reservados de Tenant, primer User e Admin Identity;
- nombre normalizado/visible de persona y taller;
- email normalizado y valor visible validado;
- password verifier TL-02 y su metadata versionada;
- `approvedInputDigest` HMAC con purpose separation;
- expiración, estado y timestamps UTC;
- referencias a evidencia de terms/privacy;
- correlación y reason codes allowlisted.

El request público nunca acepta IDs internos, `verified`, lifecycle, Role,
capabilities, moneda, Branch, Station ni status de Tenant. Nombres de taller
duplicados son válidos. Después de `VERIFIED` los datos que forman el grant son
inmutables.

### 3.3 Duplicado y reemplazo

- Existe como máximo un attempt activo por email normalizado.
- Repetir `register` mientras existe uno activo devuelve la misma respuesta
  pública genérica y no reemplaza nombres, password ni acceptance.
- `resend` rota sólo el challenge del mismo attempt; no modifica el grant.
- Tras expirar, una nueva solicitud puede crear un nuevo attempt y deja el
  anterior terminal.
- Si ya existe una Admin Identity TL-02, la respuesta sigue siendo genérica y
  no se crea otro Tenant.
- Constraints y locks, no checks previos de UI, deciden las carreras.

## 4. Diseño del handoff de password

1. Registration valida nombre/taller/email/acceptance y reserva los tres IDs
   que TL-03 necesita.
2. Access aplica `normalizeAdminEmail`, `parseAdminPassword` y el hasher TL-02
   con `tenantId + adminIdentityId` reservados.
3. El plaintext vive sólo durante el request y el KDF; no se persiste, serializa,
   audita ni entrega al provider.
4. Registration persiste el `AdminPasswordStoredVerifier` ya derivado. No
   vuelve a hashear al verificar ni pide el password al cliente otra vez.
5. El grant interno entrega esa representación exacta a TL-03, que la inserta
   como credential final dentro del bootstrap atómico.
6. Cuando TL-03 devuelve resultado durable y Registration marca `CONSUMED`, se
   limpian del attempt salt/verifier/KDF metadata. El registro terminal conserva
   sólo identificadores, digest, lifecycle y timestamps requeridos.

Si TL-03 confirma y el proceso cae antes de limpiar, el attempt permanece
`VERIFIED`: un replay vuelve a invocar TL-03 con el mismo grant, obtiene su
journal y completa el CAS a `CONSUMED`. No se borra el verifier antes de poder
demostrar el resultado durable. Un cleanup posterior puede resolver esta misma
condición consultando el resultado autoritativo, sin crear otro Tenant.

Esto duplica material derivado sólo durante la ventana necesaria; nunca
duplica plaintext ni inventa un KDF incompatible.

## 5. Verification challenge

- Token: 32 bytes aleatorios criptográficos, codificados base64url.
- Persistencia: sólo SHA-256/verifier; el plaintext existe durante la entrega.
- Estado: `ACTIVE | CONSUMED | SUPERSEDED | EXPIRED` con versión/CAS.
- Scope: un único attempt; no contiene Tenant authority.
- Resend: dentro de una transacción supersede el challenge activo y crea otro;
  sólo el nuevo puede verificar.
- Consumo: lock/CAS atómico valida attempt, challenge, expiración y estado; un
  ganador cambia attempt a `VERIFIED` y congela revision/digest.
- Replay: un challenge ya consumido no verifica otra vez. Puede localizar el
  mismo attempt para devolver/reintentar su resultado idempotente; nunca crea
  otro grant.
- Token incorrecto, expirado, superseded o de un attempt terminal carece de
  efectos y usa respuesta pública sanitizada.
- Si otro attempt consumió el mismo email, la unique global TL-02/TL-03 decide
  un solo Tenant; el perdedor no deja autoridad parcial.

La recomendación UX es entregar el token en el fragment de una URL pública,
mostrar una confirmación y ejecutar un `POST` explícito. Así el token no llega
en el request inicial, Referer o access log y los link scanners no disparan un
GET mutante. La página no carga terceros y usa `Referrer-Policy: no-referrer`.

## 6. Email delivery

### 6.1 Port reemplazable

Registration declara un `RegistrationEmailDeliveryPort` con entrada allowlisted:
delivery ID, destino, template key/version, URL de verificación y expiración.
No recibe password, verifier, Tenant ID, Role, headers ni payload libre.

Adapters previstos:

- **test:** capture in-memory accesible sólo al harness;
- **local/dev:** mailbox explícito local, sin imprimir tokens en logs ni
  habilitar un endpoint productivo;
- **production/Preview:** provider aprobado y configuración externa fail-closed.

Resend es el provider transaccional V1 aprobado detrás del port reemplazable,
con sender `SR Taller <no-reply@srtaller.com>`. Su API key es configuración
externa; verificación DNS/dominio es prerequisito operacional, nunca autoridad
de aplicación. Esta selección acotada no decide mensajería general.

### 6.2 Entrega y fallos

- Persistir attempt, challenge y un dispatch durable antes del I/O externo.
- Enviar fuera de la transacción PostgreSQL con `deliveryId` estable.
- Semántica de entrega `at least once`; duplicar el mismo mensaje no duplica
  verificación ni bootstrap.
- Fallo/timeout del provider no revierte el attempt; queda reintentable y la
  respuesta pública no revela si el email existe ni si el provider aceptó.
- Resend sujeto a límites rota challenge y crea un nuevo dispatch.
- Audit/telemetría conserva provider reason codes allowlisted, intento,
  template/version y tiempos, nunca token, URL completa, email, body o headers.
- Producción falla cerrada al iniciar si el adapter seleccionado carece de
  secrets/sender requeridos. El adapter local requiere `SR_LOCAL_RUNTIME=1`.

Webhooks de marketing, campañas, CRM, SMS, WhatsApp y una plataforma general
de Notifications quedan fuera. Bounce/complaint puede añadirse como integración
de seguridad/entregabilidad si el provider aprobado lo exige.

## 7. Handoff a TL-03

```text
POST verify
  -> lock/consume challenge + mark attempt VERIFIED
  -> commit verification
  -> load immutable grant server-side
  -> invoke TL-03 with only verifiedRegistrationId + correlationId
  -> TL-03 journal returns one durable bootstrap result
  -> CAS attempt VERIFIED -> CONSUMED and redact temporary verifier
  -> return generic completion + admin-login handoff
```

- Verification y bootstrap no se fuerzan dentro de una transacción que abarque
  email/I/O externo.
- Si verification commit sucede y bootstrap falla, queda `VERIFIED`; el mismo
  token consumido o un retry interno reintenta el mismo TL-03 command.
- Si bootstrap commit sucede y se pierde HTTP, TL-03 devuelve el journal en el
  replay; Registration completa o reencuentra `CONSUMED`.
- Dos verify concurrentes consumen un challenge una vez y convergen al mismo
  `verifiedRegistrationId`.
- `approvedInputDigest + registrationRevision` son los mismos que TL-03 usa
  para detectar un grant contradictorio.
- `CONSUMED` no sustituye el journal TL-03 y no crea una segunda idempotency
  authority.
- El resultado no inicia Admin Session. El usuario autentica normalmente con
  email/password TL-02.

El source interno sólo entrega grants cuando attempt=`VERIFIED`, token ya fue
consumido, expiración no venció y todos los IDs/digest/revision coinciden. No
existe endpoint que acepte o devuelva `VerifiedRegistrationBootstrapGrant`.

## 8. Frontera HTTP pública

| Método/ruta propuesta | Entrada | Salida pública |
|---|---|---|
| `GET /api/public/registration-policy` | ninguna | metadata allowlisted de terms/privacy vigentes |
| `POST /api/public/registrations` | nombre, taller, email, password y aceptación de versiones vigentes | `202` genérico: revisar email |
| `POST /api/public/registrations/resend` | email | `202` genérico idéntico exista o no attempt/identity |
| `POST /api/public/registrations/verify` | token | resultado `completed`, `retryable` o `invalid_or_expired`, sin Tenant/User IDs |

No se requiere status endpoint V1: el replay seguro de `verify` resuelve
timeouts y retries. Si observación posterior demuestra que polling es
necesario, usaría un receipt opaco separado; el token de verificación no se
convertiría en bearer administrativo.

Todos los POST exigen JSON exacto, same-origin/Fetch Metadata, body límite
específico muy inferior a los 20 MB globales del Composer, `Cache-Control:
no-store`, correlación UUID server-side, campos/longitudes allowlisted y errores
sin eco de secretos. El cliente nunca aporta correlation, status ni scope.

## 9. Abuse, replay y concurrencia

| Amenaza | Control requerido |
|---|---|
| Enumeración | respuestas/status/copy uniformes; no revelar attempt, identidad, Tenant, provider o bootstrap interno; dummy KDF equivalente cuando aplique. |
| Spam de altas | bucket durable por HMAC(email) y señal de red efímera sólo si se aprueba; límites globales/provider; bounded KDF. |
| Resend abuse | cooldown y ventana durable; no enviar por cada register duplicado; challenge previo superseded. |
| Guessing de token | 256 bits, digest-only, expiración, rate limit por verifier/request y compare-and-set. |
| Payload/KDF DoS | DTO exacto, longitudes/bytes máximos, body limit pequeño y limiter Argon2 TL-02. |
| CSRF/origin | no hay ambient auth, pero las mutaciones conservan same-origin, JSON-only y Fetch Metadata para impedir confused delivery. |
| Link scanner | GET no muta; token en fragment y POST explícito. |
| Duplicate email | unique de attempt activo + unique global TL-02; generic response; no overwrite de datos activos. |
| Concurrent verify | row lock/version CAS; un challenge consumido, un attempt verificado. |
| Bootstrap race | journal/transaction TL-03; mismo ID+digest converge, contradicción falla cerrada. |
| Provider retry | dispatch ID estable y token/challenge idempotente; entrega duplicada no duplica autoridad. |
| Secret leakage | serializers allowlisted, inspect redacted, negative log/audit/HTTP tests y secret scan. |

CAPTCHA no se adopta por defecto. Puede añadirse detrás de un port sólo si
métricas reales muestran que rate limits y protección perimetral no bastan.

## 10. Evidencia de términos y privacidad

- El servidor publica documento, versión y URL/label vigentes.
- El cliente confirma explícitamente las versiones mostradas; no puede elegir
  una versión arbitraria o antigua.
- Se genera un `acceptanceEvidenceId` server-side compartido por una fila
  immutable por documento (`terms`, `privacy`), cada una con `acceptedAt`
  server-side y attempt ID. Ese bundle es el
  `termsAcceptanceEvidenceId` singular consumido por TL-03.
- La asociación al User eventual se deriva sin ambigüedad del attempt reservado
  y del journal TL-03; no requiere que el cliente vuelva a aceptar ni envíe ID.
- No se retiene IP ni user-agent por defecto.
- El contenido, jurisdicción, textos, URLs y versiones iniciales son
  responsabilidad Owner/legal, no de ingeniería.

## 11. Scope de frontend público

TL-04 debe incluir la UI pública mínima en el mismo integration candidate que
backend y delivery, porque sólo el flujo completo prueba el boundary anónimo.
No se recomienda otro Work Unit para una UI incapaz de verificarse contra el
provider real.

Rutas mínimas recomendadas en el host aprobado:

- `/registro`: formulario accesible;
- `/registro/revisa-tu-correo`: estado pending + resend;
- `/registro/verificar`: confirmación, loading, result/retry y handoff;
- `/admin/iniciar-sesion`: login administrativo existente presentado fuera del
  shell operacional o su ruta final equivalente.

Estas rutas se resuelven antes de `SessionProvider`. Reutilizan theme, tokens,
`Button`, fields, `Alert`, `Spinner`, feedback y layout responsive. Deben cubrir
loading, invalid input, provider failure genérico, invalid/expired token,
success, teclado, focus, light/dark, 640/768/desktop y ausencia de overflow.
Landing/marketing, planes, billing, Branch, Station y PIN quedan fuera.

## 12. Schema y migraciones

Una migración aditiva owner `registration` debe crear, como mínimo:

1. `registration_attempts`: lifecycle, IDs reservados, input normalizado,
   verifier TL-02 temporal, digest/revision, expiración/versión/timestamps.
2. `registration_verification_challenges`: digest único, lifecycle, expiración,
   consume/supersede y CAS.
3. `registration_acceptance_documents`: bundle/evidence ID, attempt, document
   key/version y timestamp immutable; PK compuesta protege una aceptación por
   documento y el bundle satisface el `termsAcceptanceEvidenceId` de TL-03; sin
   IP/user-agent.
4. `registration_email_dispatches`: template/version, estado, attempts y
   provider reason/reference sanitizada; nunca token/body/headers.
5. `registration_public_action_limits`: principal HMAC, action, window,
   counters/cooldown y cleanup acotado.
6. `registration_security_events`: append-only, allowlisted y pre-tenant.

Los datos pre-tenant no llevan `tenant_id` como autoridad. Los IDs de Tenant y
User reservados no crean FKs utilizables hasta bootstrap. Constraints parciales
protegen un attempt activo por email; la unique global de Admin Identity sigue
siendo el último guard contra dos Tenants. Todos los instantes son
`timestamptz` UTC.

La implementación debe actualizar database types, migration provider, DEC-005,
external configuration y tests PostgreSQL 18.4. Primera ejecución y rerun `0
pending` son gates; no se ejecuta migración en esta readiness.

## 13. Bloques de implementación

1. **Contrato y módulo:** aprobar decisiones, añadir `registration` a DEC-005,
   ports/domain/errors y factory de bootstrap Access sin endpoint privilegiado.
2. **Persistencia:** migración aditiva, repositories owner-scoped, lifecycle,
   locks/CAS, cleanup y audit.
3. **Password/grant:** reutilizar TL-02, reservar IDs, construir digest/revision
   y source interno TL-03.
4. **Challenge/abuse:** create, resend, verify, supersession, rate limits y
   concurrencia material.
5. **Delivery:** port, adapter test/local y provider aprobado; templates,
   config fail-closed y observabilidad sanitizada.
6. **HTTP:** policy/register/resend/verify con DTOs exactos, anti-enumeration,
   origin, body limits, cache/error/correlation.
7. **UI:** registro/pending/verification/result/admin-login handoff fuera del
   operational gate.
8. **Integration:** TL-04 -> TL-03 -> TL-02 login, two-tenant isolation,
   evidence, canonical docs and full promotion verification.

No se inicia TL-05 ni se crea Branch durante estos bloques.

## 14. Plan de pruebas

### Dominio y contratos

- intento válido, transición/expiración, payload inválido y nombres de taller
  duplicados permitidos;
- email equivalente normaliza a la misma authority; no puede crear dos Tenants;
- acceptance vigente requerida y evidencia exacta/immutable;
- plaintext ausente de DB, DTO, errors, audit, inspect y logs;
- hasher/KDF TL-02 reutilizado con IDs reservados y bounded capacity.

### Verification y abuso

- token válido, incorrecto, expirado, consumed replay y superseded;
- resend rota un solo challenge y aplica cooldown/window;
- verification concurrente produce un único `VERIFIED`;
- registration/resend/verify conservan anti-enumeration y timing razonable;
- payload oversized/malformed, KDF saturation y limiter unavailable fallan
  cerrados sin side effects.

### Bootstrap y tenancy

- sólo attempt verificado produce grant; el cliente no puede forjarlo;
- bootstrap failure queda retryable; lost response/replay devuelve el mismo
  Tenant; grant contradictorio falla;
- dos requests concurrentes y duplicate email no crean orphans;
- Alfa/Beta con mismo workshop name permanecen aislados;
- Admin login TL-02 funciona después de TL-04 -> TL-03;
- TL-03 atomicidad/idempotencia y Station/PIN operacional no cambian.

### Provider, HTTP y UI

- adapter contract, failure/timeout, at-least-once y redaction;
- local adapter imposible fuera de local; production config missing falla;
- HTTP exact shapes, cache headers, correlation, origin/Fetch Metadata y body
  bounds;
- UI keyboard/focus/a11y, 640/768/desktop, light/dark, reload/retry and no
  horizontal overflow.

### Materialidad y promoción

- PostgreSQL 18.4: migrate/rerun, constraints, locks, races, rollback y cleanup;
- arquitectura/module policy, external config, typecheck, build, focused suites,
  secret scan y `git diff --check`;
- `verify:full`, review `ARCHITECTURAL`, PR CI y exact-main sólo en fases
  posteriores autorizadas.

## 15. Decisiones Owner aprobadas

| ID | Dirección aprobada |
|---|---|
| TL4D-001 | Resend detrás de `EmailDeliveryPort`; sender `SR Taller <no-reply@srtaller.com>`; secretos sólo externos y fallo de delivery sin corrupción del Attempt. |
| TL4D-002 | Challenge 60 minutos; Attempt pendiente 24 horas; resend genera un challenge nuevo y supersede todos los anteriores. |
| TL4D-003 | Attempt expirado/no consumido retenible hasta 30 días; material temporal se elimina cuando deja de ser necesario; aceptación durable sobrevive por su asociación eventual. |
| TL4D-004 | Resend mínimo cada 60 segundos y máximo 5 por hora por Attempt/email normalizado; señal de red sólo HMAC/efímera; verify acotado; sin CAPTCHA V1. |
| TL4D-005 | Superficie canónica `https://srtaller.com/registro` y `https://srtaller.com/verificar`; handoff `https://admin.srtaller.com/login`; hostname nunca es autoridad Tenant. |
| TL4D-006 | Terms y Privacy son documentos versionados separados; una aceptación UI puede cubrir ambos, pero la evidencia durable registra cada versión; Production falla cerrado sin bundle publicado. |
| TL4D-007 | Backend y UI pública mínima viajan en un único Work Unit TL-04; Landing permanece fuera de alcance. |

Las decisiones criptográficas, locks, DTOs, redacción y reutilización TL-02/03
son ingeniería dentro de contratos aceptados. No requieren reabrir ADR-015.
Seleccionar provider sí requiere una DEC de integración; no se detectó conflicto
arquitectónico que exija otro ADR.

## 16. Checklist de readiness

- [x] Baseline Git/Work Unit y dependencias TL-02/TL-03 auditadas.
- [x] HTTP, UI, email, configuración y módulos existentes auditados.
- [x] Registration Attempt, password handoff y challenge diseñados.
- [x] Bootstrap handoff, replay y concurrencia definidos.
- [x] Abuse, terms/privacy, schema, UI y tests delimitados.
- [x] Bloques de implementación preparados.
- [x] Provider, TTL/retención, red/network signal, host y documentos legales
  resueltos por `TL4D-001–007`.
- [x] Autorización de implementación TL-04.
- [~] Implementación y verificación local en curso; review, promoción e
  integración requieren fases y autoridad posteriores.

## 17. Readiness

TL-04 es técnicamente coherente con ADR-015 y no necesita reabrir TL-02/TL-03.
`TL4D-001–007` están aprobadas y el Work Unit puede materializar el contrato;
Production sigue fail-closed sin bundle legal, secreto Resend y sender/dominio
operacionalmente válidos.

**TL-04 READINESS: `IMPLEMENTATION AUTHORIZED`.**
