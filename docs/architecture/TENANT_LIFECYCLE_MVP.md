# Tenant Lifecycle MVP — Control Plane, Lifecycle and Security Contract

## Estado del documento

- **Estado:** contrato arquitectónico propuesto para Owner Review; no autoriza
  implementación.
- **Work Unit:** TL-01 — Owner Decisions + Lifecycle Contract.
- **Dirección de producto:** TL-001 a TL-016 aprobadas por el Owner el
  2026-09-20.
- **Decisión arquitectónica relacionada:**
  [ADR-015](../decisions/proposed/ADR-015-tenant-administrative-control-plane.md),
  `Proposed`.
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
perder la última Branch/Admin requiere las decisiones residuales `TLD-004` y
`TLD-005` antes de implementar esas mutaciones.

## 4. Identidad y Session administrativas

### 4.1 Separación obligatoria

- El Tenant User conserva una sola identidad tenant-scoped.
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
- Se conserva mediante un verifier resistente y parámetros versionados; la
  selección concreta se realiza en TL-02 después del threat model.
- Comparación, cambio y recovery son server-side y anti-enumeración.
- No existe password default, recuperable o compartido.
- Cambio/recovery invalida las Admin Sessions afectadas antes de otra operación
  protegida.

### 4.3 Admin Session

El contrato propuesto exige Session stateful/revocable con bearer opaco,
cookies seguras, protección CSRF/origin para mutaciones, expiración idle y
absoluta, rotación en login/recovery y no-store en respuestas sensibles. Los
tiempos y política de concurrencia no se fijan sin `TLD-002`.

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
reactiva silenciosamente un User `revoked`.

El control exacto del último Tenant Admin se mantiene bloqueado por `TLD-003`:
el sistema debe demostrar que una mutación no deja cero autoridad efectiva o
que existe un recovery explícitamente aprobado capaz de restaurarla.

### 4.5 Threat model administrativo

Activos protegidos: password verifier, control del email verificado, Admin
Session, recovery proof, Tenant/User binding, Roles/assignments/capabilities y
evidencia de seguridad. Límites de confianza: navegador público, navegador
administrativo, proveedor de correo, API, repositorios tenant-scoped,
PostgreSQL y observabilidad.

| Amenaza | Invariante/control requerido | Decisión todavía abierta |
|---|---|---|
| Enumeración de emails o Tenants | respuestas públicas uniformes, tiempos razonablemente homogéneos y correlación opaca | mensajes UX y rate limits concretos |
| Credential stuffing/brute force | rate limit por señales combinadas, lock/cooldown proporcional, audit sin password | umbrales y duración |
| Robo de base de datos | verifier resistente, salt único y parámetros versionados; ningún password reversible | algoritmo/parámetros |
| Session fixation o hijack | bearer opaco rotado al autenticar/recover, cookie segura y revocación server-side | idle/absolute TTL y concurrencia (`TLD-002`) |
| CSRF/origin confusion | cookie de Admin aislada por audiencia, protección CSRF y validación de origen para mutaciones | mecanismo exacto según topología |
| Confusión entre planos | guards/audiencias distintos; Admin Session rechazada por API operacional y viceversa | nombres de cookies/routes internos |
| Tenant confusion/IDOR | Tenant deriva de Session/User; recursos se cargan dentro de ese scope; pruebas Alfa/Beta | cardinalidad de email (`TLD-001`) |
| Capabilities obsoletas | recalcular autoridad vigente en cada operación protegida; revocación efectiva sin confiar en claims largos | cache/invalidation técnica |
| Account recovery takeover | token de alta entropía, un uso, expiración, anti-enumeración, rotación de sesiones y audit | TTL/provider/retención |
| Pérdida del último Admin | invariant transaccional antes de retirar autoridad; recovery no eleva ni revive por defecto | política exacta (`TLD-003`) |
| Reauth replay o confused deputy | proof acotada a actor, Session, acción/recurso, cambio material y ventana; consumo de un uso | nivel/factor/TTL por acción (`TLD-006`) |

Un login reciente no satisface automáticamente una acción ADR-013. Cada
acción sensible publica su nivel, factor, ventana y evidencia; mientras falte
esa política permanece denegada (nivel 4). El threat model de TL-02 debe
seleccionar mecanismos concretos y demostrar los controles anteriores antes de
habilitar endpoints públicos o administrativos.

## 5. Starter Tenant Admin authority

La elevación inicial es server-owned:

- el bundle de capabilities se identifica por una versión interna;
- el cliente nunca envía nombre de Role, Role ID o capabilities;
- Role, assignment y User pertenecen al nuevo Tenant;
- el assignment inicial es tenant-wide;
- capacidades administrativas no incluyen automáticamente capacidades de
  Repairs, Catalog, caja u otra operación cotidiana;
- `isAdmin`, email, posición de primer registro o nombre visible no conceden
  autoridad;
- cualquier modificación futura revalida que no se pierda el último Admin
  efectivo;
- historia/audit conserva actor, operación, alcance, resultado y versión del
  bundle sin copiar secretos.

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
- el estado inicial de una Branch nueva no se presume; `TLD-009` debe definir
  si onboarding la crea `ACTIVE` o exige activación explícita;
- `INACTIVE` no puede recibir nuevos enrollments ni aportar contexto operativo;
- desactivar no borra Branch ni historia;
- Station bindings/Sessions afectadas fallan cerradas conforme a ADR-010/014;
- reglas para la última Branch activa permanecen en `TLD-004`.

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
| Session revocada entre emisión y canje | política pendiente `TLD-006`; fail-closed cuando corresponda |
| Station huérfana por fallo parcial | transacción única de Station + binding + credential + consume |
| Relink silencioso | revoke/unlink explícito, motivo, reauth y nueva vinculación |
| Equipo perdido | revoke server-side e invalidación de Sessions antes de otra operación |

TTL aprobado: **10 minutos**, calculado con reloj server-side. La clasificación
ADR-013 exacta de issue/revoke/relink y el efecto de terminar la Admin Session
quedan en `TLD-006`.

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
| 1 | **TL-02 — Administrative Identity and Session Foundation** | Credencial password no reversible, Admin Session revocable, login/logout/recovery internos, guards y pruebas de abuso; todavía sin registro público. | ADR-015 aceptado; `TLD-001–003` y parámetros de seguridad resueltos. |
| 2 | **TL-03 — Atomic Tenant Bootstrap + Starter Authority** | Caso de uso interno crea Tenant `ONBOARDING`, primer User, credencial, starter Role/assignment, journal y audit en una frontera idempotente/atómica. | TL-02; catálogo de capabilities y guard de último Admin aprobados. |
| 3 | **TL-04 — Public Registration + Email Verification** | Registration Attempt público, aceptación versionada, entrega/verificación de email, antiabuso y handoff idempotente a TL-03. | TL-02–03; provider/retención/TTL aprobados. |
| 4 | **TL-05 — Branch Management V1 + Tenant Activation** | Admin crea/lista/edita/activa/inactiva Branches; primera Branch activa transiciona Tenant a `ACTIVE`; timezone conserva contrato UTC/IANA. | TL-03; `TLD-004–005` y `TLD-009` resueltos. |
| 5 | **TL-06 — Tenant Administration Users/Roles Integration** | Superficies actuales de User/Role/PIN se exponen desde Admin Context sin Station, con capabilities equivalentes y sin permisos directos. | TL-02, TL-03, TL-05; onboarding de Admin adicional decidido. |
| 6 | **TL-07 — Station Inventory + Enrollment Authority** | Admin lista Stations y ejecuta issue/cancel/revoke/unlink/relink con capabilities, ADR-013 y audit; challenge de 10 minutos. | TL-05–06; `TLD-006` resuelto; PBI-031 reconciliado. |
| 7 | **TL-08 — Device Redemption + Operational Handoff** | Equipo nuevo canjea challenge, obtiene credencial opaca, resuelve Station/Branch y llega al PIN login existente. | TL-07; threat model de transporte y credencial materializado. |
| 8 | **TL-09 — Tenant Lifecycle E2E Isolation + Owner Acceptance** | Browser/API/PostgreSQL prueban dos Tenants, varias Branches/Users/Stations, recovery, revocación y ataques cross-tenant; documentación/evidencia completas. | TL-02–08 integrados; ambiente autorizado. |

Cada Work Unit requiere su propia autorización, rama, checklist, riesgo, tests,
review y delivery. Ninguna hereda autorización de TL-01.

## 11. Decisiones Owner residuales

Estas decisiones no contradicen TL-001–016; concretan puntos que no quedaron
autorizados. La implementación dependiente falla cerrada hasta resolverlas.

| ID | Decisión | Alternativas/recomendación | Bloquea |
|---|---|---|---|
| TLD-001 | Cardinalidad del email administrativo | ¿Un email puede administrar más de un Tenant? Recomendación MVP: un email normalizado corresponde a un solo Tenant User/Tenant; multi-tenant membership futura requiere ADR propio. | TL-02/04 |
| TLD-002 | Política de Admin Session | Definir concurrencia, idle timeout, lifetime absoluto y “remember me”. Recomendación: Sessions stateful independientes, sin remember-me V1; tiempos aprobados por Seguridad/Owner. | TL-02 |
| TLD-003 | Último Tenant Admin | Elegir si siempre debe quedar otro Admin efectivo o si recovery del mismo User satisface la salvaguarda; definir efecto de `inactive`/`revoked`. Recomendación: no permitir cero Admins efectivos; recovery sólo repara credencial, no revive User revocado. | TL-02/03/06 |
| TLD-004 | Pérdida de la última Branch activa | ¿Se impide inactivarla o Tenant vuelve a `ONBOARDING`? Recomendación: impedirla en V1; `ACTIVE` no retrocede silenciosamente. | TL-05 |
| TLD-005 | Starter Tenant Admin Role | ¿Role protegido/system-managed o Role tenant-editable sujeto al guard de último Admin? Recomendación: bundle starter versionado y protegido; delegación mediante Roles adicionales. | TL-03/06 |
| TLD-006 | Niveles ADR-013 de Station y Branch | Clasificar issue/cancel/revoke/relink y desactivar Branch; decidir si un challenge sobrevive logout/revocation de la Admin Session emisora. Recomendación: emisión/revoke/relink requieren nivel 2 y revalidación al consumo; operaciones sin política permanecen nivel 4. | TL-05/07 |
| TLD-007 | Alta de Administradores adicionales | Invitación por email verificado, promoción de User existente u ambas; nunca password temporal conocido. Recomendación: invitación verificada + assignment explícito. | TL-06 |
| TLD-008 | Evidencia de términos/privacidad | Definir autoridad de versión y si se conserva IP/user-agent. Recomendación: versión + timestamp + Attempt/User; no persistir IP/user-agent sin necesidad legal aprobada. | TL-04 |
| TLD-009 | Estado inicial de la primera Branch | ¿El create de onboarding produce una Branch `ACTIVE` o una Branch que requiere activación explícita? Recomendación MVP: crearla `ACTIVE` dentro del mismo comando autorizado si sus invariantes son válidas; no aceptar estado arbitrario del cliente. | TL-05 |

Además, TL-02 debe cerrar como decisiones técnicas del threat model —sin
convertirlas en política Owner inventada— algoritmo/parámetros de password,
TTL de verification/recovery, rate limits, transporte de email, cookies/CSRF,
rotación, revocación, redacción y retención de intentos incompletos.

## 12. Conflictos y compatibilidad arquitectónica

| Fuente vigente | Resultado de reconciliación |
|---|---|
| ADR-004 | Compatible: Tenant sigue siendo frontera y esquema compartido. Registration Attempt es dato pre-tenant de plataforma; no crea “supertenant”. |
| ADR-008 | No se acepta ni requiere. `admin.srtaller.com` puede ser host común y slug interno nunca es autoridad. |
| ADR-010 | Compatible para operación; ya reserva contextos administrativos separados. Admin Context no modifica el contexto operativo. |
| ADR-011/014 | Compatibles: sólo gobiernan PIN y Operational Sessions. Password/Admin Session son otra audiencia. |
| ADR-012 | **Conflicto de alcance real:** sus invariantes universales de Station/Operational Session no cubren administración previa a Station. ADR-015 debe calificarlo sin cambiar roles/capabilities/deny-by-default. |
| ADR-013 | Compatible, pero cada acción administrativa sensible debe clasificar su nivel y factor; una Admin Session ordinaria no satisface reauth automáticamente. |
| PBI-031 | Compatible y todavía Draft; TL-07 debe reconciliarlo con Admin Context, challenge de 10 minutos y capabilities aprobadas. |

## 13. Criterio de salida de TL-01

TL-01 queda listo para Owner Review cuando este contrato, ADR-015,
QUESTION-005, documentos transversales, roadmap y checklist son coherentes;
`TLD-001–009` están visibles; links/consistency/secrets/diff y el gate
proporcional pasan; y no existe cambio de producto.
