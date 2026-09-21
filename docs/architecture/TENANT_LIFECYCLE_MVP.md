# Tenant Lifecycle MVP — Control Plane, Lifecycle and Security Contract

## Estado del documento

- **Estado:** contrato arquitectónico aprobado para Tenant Lifecycle MVP; no
  autoriza implementación.
- **Work Unit:** TL-01 — Owner Decisions + Lifecycle Contract.
- **Dirección de producto:** TL-001 a TL-016 aprobadas por el Owner el
  2026-09-20.
- **Decisión arquitectónica relacionada:**
  [ADR-015](../decisions/proposed/ADR-015-tenant-administrative-control-plane.md),
  `Accepted`.
- **Alcance:** registro público, identidad administrativa, bootstrap de Tenant,
  Branch V1, administración de Tenant, enrollment de Station y handoff a la
  operación existente.
- **Fuera de alcance:** billing, planes, Super Admin, suspensión comercial,
  Production, migración desde 1.0 y cambios al login PIN operativo.

## 1. Dirección Owner aprobada

| ID | Decisión aprobada |
|---|---|
| TL-001 | Registro público autoservicio con email verificado. |
| TL-002 | Autenticación administrativa V1 con email verificado y password, precedida por threat model. |
| TL-003 | No existe agregado Owner comercial en MVP; la persona inicial es el primer Tenant User con el Role inicial Tenant Admin. |
| TL-004 | Registration Attempt precede la verificación; el Tenant durable nace después de verificar email mediante bootstrap atómico/idempotente. |
| TL-005 | Estados V1 del Tenant: `ONBOARDING` y `ACTIVE`. |
| TL-006 | No se requiere subdominio elegido por el usuario; cualquier slug interno es routing auxiliar, nunca autoridad. |
| TL-007 | La primera Branch es obligatoria durante onboarding. |
| TL-008 | Branch V1 conserva nombre, timezone IANA, `ACTIVE`/`INACTIVE`, versión y timestamps. |
| TL-009 | Enrollment usa challenge de alta entropía, un solo uso y TTL de 10 minutos; reauth/session se resuelve por threat model. |
| TL-010 | Administración de Branch y Station usa capabilities explícitas, nunca `isAdmin`. |
| TL-011 | Sesión administrativa y Operational Session PIN permanecen separadas. Tenant Admin sólo opera una Branch con User/PIN/Role operativo. |
| TL-012 | Recovery administrativo usa email verificado y no puede perderse el último Tenant Admin efectivo sin reemplazo/recovery seguro. |
| TL-013 | Registro mínimo: nombre de persona, taller, email, password y aceptación versionada de términos/privacidad; teléfono no es identidad obligatoria. |
| TL-014 | Eventos de seguridad/lifecycle son durables cuando corresponde y nunca contienen secretos. |
| TL-015 | Tenant Administration vive lógicamente en `admin.srtaller.com`; despliegue y componentes pueden ser compartidos en V1. |
| TL-016 | Suspensión comercial queda fuera; `ONBOARDING`/`ACTIVE` bastan para MVP. |

Reglas adicionales aprobadas:

- el bootstrap exitoso crea el Tenant en `ONBOARDING`;
- el Tenant pasa a `ACTIVE` al tener autoridad Tenant Admin efectiva y una
  primera Branch válida;
- una Station no es requisito de activación del Tenant;
- SR Taller 1.0 es referencia conductual, no de arquitectura o seguridad.

## 2. Fronteras de confianza

El MVP distingue tres contextos. No son intercambiables.

| Contexto | Autoridad mínima | Puede hacer | Nunca puede hacer |
|---|---|---|---|
| **Registro público** | Registration Attempt opaco + prueba de verificación emitida por servidor | solicitar alta, verificar email y reintentar bootstrap idempotente | elegir Tenant ID, Role, capability, Branch ID o crear una Session operativa |
| **Tenant Administration** | Admin Session vigente + Tenant User elegible + Tenant derivado server-side + capabilities efectivas | completar onboarding y administrar recursos tenant-scoped autorizados | operar Repairs/Catalog como si fuera una Station, elegir otro Tenant o convertir password en PIN |
| **Operación de Branch** | Station/Branch/Tenant confiables + Operational Session PIN + capabilities contextuales | ejecutar el sistema operacional existente | administrar otro Tenant, cambiar Branch libremente o reutilizar la Admin Session como actor operativo |

### 2.1 Registro público

Antes del bootstrap no existe Tenant efectivo. El Registration Attempt es dato
de plataforma pendiente y no concede autoridad tenant. Su identificador,
email, token de verificación o host no sustituyen una autenticación.

### 2.2 Tenant Administration

La Admin Session representa una identidad administrativa autenticada y
revocable. El Tenant se obtiene de una relación autoritativa mantenida por el
servidor; no se acepta desde body, path, query, header, host o local storage.

Una Branch mencionada por una orden administrativa es un **recurso objetivo**:
se carga dentro del Tenant administrativo ya resuelto y se autoriza por
capability. No se convierte en Branch ambiental ni requiere Station.

### 2.3 Operación de Branch

ADR-010, ADR-011 y ADR-014 permanecen sin cambios: la Station vinculada deriva
Tenant/Branch y el PIN crea una Operational Session independiente por perfil.
El control plane sólo entrega una Station confiable a ese recorrido.

## 3. Lifecycle de Registration Attempt y Tenant

```text
REGISTRATION ATTEMPT
  PENDING_VERIFICATION
    → email verificado
  VERIFIED
    → atomic bootstrap idempotente
  CONSUMED

Errores/retries antes de CONSUMED no crean dos Tenants ni autoridad parcial.

TENANT
  ONBOARDING
    → effective Tenant Admin authority
    + first valid ACTIVE Branch
  ACTIVE
```

### 3.1 Registration Attempt

El intento conserva únicamente lo necesario para completar o abandonar el
alta:

- identificador opaco generado por servidor;
- nombre de persona y nombre del taller;
- email normalizado y estado de verificación;
- verifier no reversible de password, nunca password plaintext;
- versión de términos/privacidad aceptada y timestamp autoritativo;
- expiración, estado, intentos/rate-limit e idempotency identity;
- timestamps/correlation necesarios para seguridad.

La evidencia de aceptación conserva documento/versión, timestamp,
Registration Attempt y, después del bootstrap, su asociación al User eventual.
No retiene IP ni user-agent por defecto.

El token/código de verificación se entrega una vez, se persiste sólo mediante
verifier no reversible, expira y se consume atómicamente. Respuestas públicas
no confirman si un email o Tenant ya existe.

### 3.2 Verificación

Verificar demuestra control del email para ese Registration Attempt. No crea
por sí sola una Admin Session, no concede capabilities y no acepta cambios de
Tenant/Role/Branch desde el cliente. Replays deben devolver el mismo resultado
seguro o una denegación estable, nunca otro Tenant.

### 3.3 Atomic Bootstrap

Un único boundary transaccional/idempotente crea como conjunto:

1. Tenant `ONBOARDING` con ID y tiempo server-side;
2. primer Tenant User activo;
3. credencial administrativa ligada a ese User y al email verificado;
4. starter Role Tenant Admin con composición server-owned/versionada;
5. assignment tenant-wide del Role al primer User;
6. journal de comando/respuesta para replay;
7. eventos de lifecycle/auditoría exigidos.

El request no aporta Tenant ID, User ID, Role ID, capability list, estado,
timestamps ni actor. Un fallo no deja ninguna autoridad utilizable. Si los
owners físicos futuros impiden una sola transacción, la alternativa exige una
saga durable, compensable y fail-closed mediante ADR/DEC adicional; no se
acepta consistencia accidental.

La primera Branch se crea **después** del bootstrap desde Tenant
Administration. El formulario público mínimo no solicita Branch.

### 3.4 Activación

El servidor evalúa la transición a `ACTIVE` dentro del commit que materializa
el último requisito:

```text
exists effective Tenant Admin authority
AND exists valid ACTIVE Branch
```

El frontend no envía `ACTIVE`. Crear una Station, configurar PIN o abrir una
Operational Session no forma parte del predicado. La semántica posterior de
perder la última Branch/Admin falla cerrada: un Tenant nunca puede quedar con
cero Tenant Admins efectivos activos y un Tenant `ACTIVE` nunca puede quedar
sin al menos una Branch `ACTIVE`. El servidor bloquea esas mutaciones; no
retrocede silenciosamente el Tenant a `ONBOARDING`.

## 4. Identidad y Session administrativas

### 4.1 Separación obligatoria

- El Tenant User conserva una sola identidad tenant-scoped.
- En MVP, un email/identidad administrativa pertenece a un solo Tenant; una
  identidad multi-Tenant futura requiere su propia decisión.
- Password y PIN son credenciales diferentes con propósitos diferentes.
- Admin Session y Operational Session son tipos distintos, con cookies,
  audiencia, guards y revocación independientes.
- Autenticarse en `admin.srtaller.com` no crea Station, Branch context,
  Operational Session ni permiso de negocio.
- Configurar un PIN no concede Role/capability.
- Un Tenant Admin puede no tener PIN; sin User/PIN/Role operativo no entra a la
  superficie de Branch.

### 4.2 Invariantes de password

- Sólo se acepta por transporte protegido.
- Nunca se persiste, devuelve, registra, audita, analiza o replica en plaintext.
- Se conserva mediante un verifier Argon2id resistente, con salt, profile y
  pepper administrativo versionados conforme a la selección material de TL-02.
- Comparación, cambio y recovery son server-side y anti-enumeración.
- No existe password default, recuperable o compartido.
- Cambio/recovery invalida las Admin Sessions afectadas antes de otra operación
  protegida.

### 4.3 Admin Session

La Admin Session es stateful y revocable, con bearer opaco, cookies seguras,
protección CSRF/origin para mutaciones, rotación en login/recovery y `no-store`
en respuestas sensibles. Permite sesiones concurrentes, cada una revocable de
forma individual y todas revocables globalmente. No existe `remember me` en
MVP; el idle timeout es **30 minutos** y el lifetime absoluto **12 horas**.

Cada request administrativo resuelve nuevamente:

```text
Admin Session
→ Tenant User activo/elegible
→ Tenant del User
→ estado Tenant permitido
→ Roles/assignments/capabilities vigentes
→ recurso objetivo dentro del Tenant
→ sensibilidad/reauth aplicable
```

### 4.4 Recovery

Recovery sólo puede iniciarse y completarse mediante email verificado. Usa
prueba temporal, de un uso y no reversible; mantiene respuestas públicas
anti-enumeración. No cambia Tenant, Roles, capabilities ni User lifecycle y no
reactiva un User inactivo o revocado. Sólo puede restaurar credenciales de un
User válido y activo. Toda desactivación, revocación, eliminación o cambio de
assignment debe demostrar transaccionalmente que permanece al menos un Tenant
Admin efectivo activo; de lo contrario se bloquea.

### 4.5 Threat model administrativo

Activos protegidos: password verifier, control del email verificado, Admin
Session, recovery proof, Tenant/User binding, Roles/assignments/capabilities y
evidencia de seguridad. Límites de confianza: navegador público, navegador
administrativo, proveedor de correo, API, repositorios tenant-scoped,
PostgreSQL y observabilidad.

| Amenaza | Invariante/control requerido | Mecanismo técnico a cerrar |
|---|---|---|
| Enumeración de emails o Tenants | respuestas públicas uniformes, tiempos razonablemente homogéneos y correlación opaca | mensajes UX y rate limits concretos |
| Credential stuffing/brute force | rate limit por señales combinadas, lock/cooldown proporcional, audit sin password | umbrales y duración |
| Robo de base de datos | verifier resistente, salt único y parámetros versionados; ningún password reversible | algoritmo/parámetros |
| Session fixation o hijack | bearer opaco rotado al autenticar/recover, cookie segura, idle 30 minutos, absoluto 12 horas, revocación individual/global y concurrencia permitida | mecanismo de cookie, rotación e invalidación |
| CSRF/origin confusion | cookie de Admin aislada por audiencia, protección CSRF y validación de origen para mutaciones | mecanismo exacto según topología |
| Confusión entre planos | guards/audiencias distintos; Admin Session rechazada por API operacional y viceversa | nombres de cookies/routes internos |
| Tenant confusion/IDOR | Tenant deriva de Session/User; un email administrativo pertenece a un Tenant en MVP; recursos se cargan dentro de ese scope; pruebas Alfa/Beta | normalización, uniqueness y mensajes anti-enumeración |
| Capabilities obsoletas | recalcular autoridad vigente en cada operación protegida; revocación efectiva sin confiar en claims largos | cache/invalidation técnica |
| Account recovery takeover | token de alta entropía, un uso, expiración, anti-enumeración, rotación de sesiones y audit | TTL/provider/retención |
| Pérdida del último Admin | invariant transaccional antes de retirar autoridad; recovery sólo repara credencial de User activo, nunca eleva ni revive | estrategia de concurrencia y error tipado |
| Reauth replay o confused deputy | password reauth Level 2 acotada a actor/Admin Session y ventana de 10 minutos; revalidación dentro del commit sensible | representación y consumo del proof |

Station issue/revoke/relink y Branch deactivation son acciones Level 2: exigen
Admin Session válida más password reauthentication de no más de 10 minutos.
Otras acciones sensibles deben publicar su nivel, factor, ventana y evidencia;
mientras falte esa política permanecen denegadas (nivel 4). El threat model de
TL-02 seleccionó y demostró los mecanismos concretos para su frontera de
Session administrativa. Registro, verification/recovery públicos y sus
proveedores continúan fuera de alcance hasta sus Work Units propias.

## 5. Starter Tenant Admin authority

La elevación inicial es server-owned:

- el bundle de capabilities se identifica por una versión interna;
- el cliente nunca envía nombre de Role, Role ID o capabilities;
- Role, assignment y User pertenecen al nuevo Tenant;
- el assignment inicial es tenant-wide;
- el starter Tenant Admin Role es `system-managed`, protegido y versionado; no
  puede ser editado ni eliminado por Tenant Users;
- capacidades administrativas no incluyen automáticamente capacidades de
  Repairs, Catalog, caja u otra operación cotidiana;
- `isAdmin`, email, posición de primer registro o nombre visible no conceden
  autoridad;
- cualquier modificación futura revalida que no se pierda el último Admin
  efectivo;
- historia/audit conserva actor, operación, alcance, resultado y versión del
  bundle sin copiar secretos.
- Administradores adicionales se incorporan mediante invitación a email
  verificado, aceptación explícita y Role assignment autorizado; ningún
  request cliente selecciona elevación.

El set exacto de capabilities se publica en el Work Unit dueño de su catálogo.
Como mínimo semántico debe separar Tenant profile, Branch lifecycle, User,
Role/assignment y Station/enrollment; leer no implica mutar y mutar no implica
revocar.

## 6. Branch V1

### 6.1 Datos y ownership

Branch pertenece exactamente a un Tenant y contiene:

- ID server-side y `tenantId` obligatorio;
- nombre visible no vacío;
- timezone IANA válida;
- estado `ACTIVE` o `INACTIVE`;
- versión optimista;
- `createdAt` y `updatedAt` autoritativos.

No se almacena fixed offset como autoridad. Cambiar timezone no reescribe
instantes históricos. Dirección, teléfono, horario, geocoding, jerarquías y
transferencias quedan fuera de Branch V1.

### 6.2 Operaciones

- list/read/create/update/status requieren Admin Session y capability exacta;
- Tenant se deriva de la Session administrativa;
- Branch ID aportado sólo identifica un candidato que debe cargarse dentro de
  ese Tenant;
- la primera Branch se crea `ACTIVE` cuando el comando autorizado satisface
  todas sus invariantes;
- `INACTIVE` no puede recibir nuevos enrollments ni aportar contexto operativo;
- desactivar no borra Branch ni historia;
- Station bindings/Sessions afectadas fallan cerradas conforme a ADR-010/014;
- desactivar la última Branch `ACTIVE` de un Tenant `ACTIVE` se bloquea; nunca
  causa transición silenciosa a `ONBOARDING`.

La primera Branch válida completa el predicado de activación si la autoridad
Tenant Admin efectiva ya existe.

## 7. Station enrollment threat model

### 7.1 Activos y límites

Activos: autoridad de vinculación, challenge, StationCredential, Branch
binding, Admin Session, Operational Sessions y evidencia de actor. Los límites
son navegador administrativo, canal de entrega del challenge, equipo nuevo,
API y PostgreSQL.

### 7.2 Challenge lifecycle

```text
Admin autorizado selecciona una Branch del Tenant
  → reauth/control ADR-013 requerido
  → servidor genera challenge aleatorio de alta entropía
  → persiste sólo verifier + Tenant + Branch + actor/session + expiración
  → entrega el valor una sola vez
  → equipo nuevo lo canjea antes de 10 minutos
  → consumo atómico crea/activa Station, binding y credencial opaca
  → challenge CONSUMED
```

Expirado, cancelado, reemplazado, consumido o de otro Tenant/Branch siempre se
rechaza sin efectos. Dos canjes concurrentes producen como máximo una Station
con una credencial válida. El valor plaintext no aparece en DB, audit, logs,
URL durable, analytics, screenshots automáticos ni respuestas posteriores.

La Branch la selecciona el Admin dentro de su Tenant; el equipo nuevo no puede
cambiarla. El Station ID, credential, timestamps y estado los genera el
servidor. Hardware fingerprint puede ser señal, nunca autoridad.

### 7.3 Amenazas y controles requeridos

| Amenaza | Control requerido |
|---|---|
| Emisión por usuario sin autoridad | capability exacta + política ADR-013 + revalidación en commit |
| Challenge adivinado | entropía criptográfica, rate limit y respuesta no enumerante |
| Filtración en persistencia/log | verifier no reversible, redacción y allowlists |
| Replay/concurrencia | consume atómico single-use con journal/idempotencia |
| Canje en otro Tenant/Branch | binding server-side exacto y constraints scoped |
| Session/autoridad revocada entre emisión y canje | revalidar Admin Session, issuer authority y revisions al consumir; fail-closed |
| Station huérfana por fallo parcial | transacción única de Station + binding + credential + consume |
| Relink silencioso | revoke/unlink explícito, motivo, reauth y nueva vinculación |
| Equipo perdido | revoke server-side e invalidación de Sessions antes de otra operación |

TTL aprobado: **10 minutos**, calculado con reloj server-side. Issue, revoke y
relink son Level 2 y exigen password reauthentication vigente por 10 minutos.
El canje no pide de nuevo el password al equipo: dentro de una única frontera
atómica revalida challenge, expiración, single-use, Tenant, Branch, autoridad
del issuer y revisiones de autorización relevantes.

## 8. Auditoría y secretos

Eventos durables mínimos, cuando la operación produce autoridad o cambia su
vigencia:

- registration requested, email verification succeeded/failed y bootstrap
  succeeded/failed;
- admin login/logout/failure, credential changed y recovery completed;
- Tenant transitioned to `ONBOARDING`/`ACTIVE`;
- starter authority created; Role/assignment/Admin authority changed;
- Branch created/updated/activated/inactivated;
- Station enrollment issued/expired/consumed/rejected/cancelled;
- Station linked/unlinked/relinked/revoked;
- decisiones sensibles permitidas/denegadas relevantes.

La evidencia conserva según aplique: event ID, tenant después de existir,
actor/User, Admin Session o Station/Operational Session, action, resource,
Branch, capability, sensitivity level, correlation, authoritative timestamp,
resultado, razón tipada y versión. Antes del Tenant puede usar Registration
Attempt ID opaco.

Nunca conserva:

- password, PIN o sus verifiers;
- verification/recovery/enrollment challenges o tokens;
- cookies, bearer values, CSRF values o headers completos;
- request bodies genéricos;
- secrets/configuration values;
- contenido operacional no requerido para explicar el evento.

Los logs diagnósticos no sustituyen el audit durable. Un error o denegación no
puede revelar existencia de otro Tenant, email, User, Branch o Station.

## 9. Invariantes cross-tenant y pruebas mínimas

Cada implementación debe usar al menos Tenant Alfa y Tenant Beta con datos e
identificadores deliberadamente similares y comprobar:

1. Registration Attempt no obtiene Tenant authority antes del bootstrap.
2. Verificación/bootstrap concurrentes crean un solo Tenant y ningún orphan.
3. Admin Alfa no puede leer/mutar User, Role, Branch o Station Beta mediante
   path, body, query, host, cookie o IDs.
4. Email/password, PIN y Sessions nunca cambian libremente de Tenant.
5. Admin Session no autoriza API operacional; Operational Session no autoriza
   control plane sólo por existir.
6. Role/capabilities de otro Tenant no participan en autoridad efectiva.
7. Challenge Alfa no activa Station Beta ni otra Branch.
8. Replays, expiración y revocación no crean efectos parciales.
9. Branch/Station/User/Admin revocados fallan cerrados en la siguiente acción.
10. Auditoría y errores permanecen libres de secretos y datos ajenos.

## 10. Work Units futuras refinadas

Ninguna queda iniciada por este documento.

| Orden | Work Unit | Alcance y salida observable | Dependencias / gate de entrada |
|---:|---|---|---|
| 1 | **TL-02 — Administrative Identity and Session Foundation** | Credencial password no reversible, Admin Sessions stateful concurrentes con idle 30 minutos/lifetime 12 horas, revocación individual/global, login/logout/recovery internos, reauth Level 2 y pruebas de abuso; todavía sin registro público. | ADR-015 aceptado; threat model selecciona algoritmos, cookies/CSRF, rate limits, rotación e invalidación sin reabrir `TLD-001–003`. |
| 2 | **TL-03 — Atomic Tenant Bootstrap + Starter Authority** | Caso de uso interno crea Tenant `ONBOARDING`, primer User, credencial, starter Role/assignment, journal y audit en una frontera idempotente/atómica. | TL-02; catálogo de capabilities y guard de último Admin aprobados. |
| 3 | **TL-04 — Public Registration + Email Verification** | Registration Attempt público, aceptación versionada sin IP/user-agent por defecto, entrega/verificación de email, antiabuso y handoff idempotente a TL-03. | TL-02–03; provider, retención y TTL técnicos aprobados. |
| 4 | **TL-05 — Branch Management V1 + Tenant Activation** | Admin crea/lista/edita/activa/inactiva Branches; primera Branch nace `ACTIVE` y activa Tenant cuando existe Admin efectivo; última Branch activa protegida; timezone conserva UTC/IANA. | TL-03; catálogo de capabilities y diseño transaccional/Level 2 materializados. |
| 5 | **TL-06 — Tenant Administration Users/Roles Integration** | Superficies actuales de User/Role/PIN se exponen desde Admin Context sin Station; Admins adicionales usan invitación verificada + aceptación/Role assignment; starter Role protegido y no hay permisos directos. | TL-02, TL-03, TL-05; entrega de invitación y guard transaccional de último Admin materializados. |
| 6 | **TL-07 — Station Inventory + Enrollment Authority** | Admin lista Stations y ejecuta issue/cancel/revoke/unlink/relink con capabilities, Level 2, reauth 10 minutos y audit; challenge de 10 minutos. | TL-05–06; PBI-031 reconciliado y revisiones de autorización definidas. |
| 7 | **TL-08 — Device Redemption + Operational Handoff** | Equipo nuevo canjea challenge sin password, revalida atómicamente autoridad/estado/revisions, obtiene credencial opaca, resuelve Station/Branch y llega al PIN login existente. | TL-07; threat model de transporte y credencial materializado. |
| 8 | **TL-09 — Tenant Lifecycle E2E Isolation + Owner Acceptance** | Browser/API/PostgreSQL prueban dos Tenants, varias Branches/Users/Stations, recovery, revocación y ataques cross-tenant; documentación/evidencia completas. | TL-02–08 integrados; ambiente autorizado. |

Cada Work Unit requiere su propia autorización, rama, checklist, riesgo, tests,
review y delivery. Ninguna hereda autorización de TL-01.

## 11. Decisiones Owner finales

El Owner aprobó `TLD-001–009` el 2026-09-20. No queda una decisión Owner
material pendiente para aceptar ADR-015 o promover TL-01.

| ID | Decisión aprobada |
|---|---|
| TLD-001 | En MVP, un email/identidad administrativa pertenece a un solo Tenant. Es una restricción V1, no una prohibición permanente de identidades multi-Tenant. |
| TLD-002 | Admin Sessions stateful, concurrentes, revocables individual y globalmente; sin remember-me; idle 30 minutos y absoluto 12 horas. |
| TLD-003 | Nunca cero Tenant Admins efectivos activos. Se bloquea retirar al último; recovery sólo restaura credencial de User activo y nunca revive un User inactivo/revocado. |
| TLD-004 | Un Tenant `ACTIVE` retiene al menos una Branch `ACTIVE`; se bloquea desactivar la última y no hay retorno silencioso a `ONBOARDING`. |
| TLD-005 | Starter Tenant Admin Role system-managed, protegido y versionado; Tenant Users no lo editan/eliminan y sus assignments respetan el guard de último Admin. |
| TLD-006 | Station issue/revoke/relink y Branch deactivation son Level 2: Admin Session + password reauth vigente 10 minutos. Redemption revalida atómicamente challenge, expiración, single-use, Tenant/Branch, issuer authority y authorization revisions; el equipo no vuelve a pedir password. |
| TLD-007 | Admins adicionales entran por invitación de email verificado, aceptación explícita y Role assignment; nunca por elevación elegida por cliente. |
| TLD-008 | Evidencia de aceptación conserva documento/versión, timestamp, Registration Attempt y User eventual cuando aplica; no IP/user-agent por defecto. |
| TLD-009 | La primera Branch se crea `ACTIVE` cuando el comando autorizado satisface sus invariantes. |

TL-02 cerró las decisiones técnicas que pertenecen a su frontera —sin
convertirlas en nueva política Owner—: password, recovery interno, rate limit,
cookies/CSRF, rotación, revocación y redacción. Verification pública,
transporte de email y retención de Registration Attempts permanecen en TL-04.

## 12. Conflictos y compatibilidad arquitectónica

| Fuente vigente | Resultado de reconciliación |
|---|---|
| ADR-004 | Compatible: Tenant sigue siendo frontera y esquema compartido. Registration Attempt es dato pre-tenant de plataforma; no crea “supertenant”. |
| ADR-008 | No se acepta ni requiere. `admin.srtaller.com` puede ser host común y slug interno nunca es autoridad. |
| ADR-010 | Compatible para operación; ya reserva contextos administrativos separados. Admin Context no modifica el contexto operativo. |
| ADR-011/014 | Compatibles: sólo gobiernan PIN y Operational Sessions. Password/Admin Session son otra audiencia. |
| ADR-012 | **Resuelto por ADR-015 Accepted:** Registration Context y Tenant Admin Context son contextos protegidos distintos. Station + PIN/Operational Session siguen obligatorios en Operational Context; roles/capabilities, deny-by-default y autoridad server-side permanecen vigentes. |
| ADR-013 | Compatible, pero cada acción administrativa sensible debe clasificar su nivel y factor; una Admin Session ordinaria no satisface reauth automáticamente. |
| PBI-031 | Compatible y todavía Draft; TL-07 debe reconciliarlo con Admin Context, challenge de 10 minutos y capabilities aprobadas. |

## 13. Criterio de salida de TL-01

TL-01 queda `READY_FOR_PROMOTION` cuando este contrato, ADR-015 Accepted,
QUESTION-005, documentos transversales, roadmap y checklist son coherentes;
`TLD-001–009` están materializadas; el pipeline local exigido por su
clasificación pasa sobre el candidato exacto; y no existe cambio de producto.
Esto no inicia TL-02 ni autoriza push, PR, merge o deploy.
