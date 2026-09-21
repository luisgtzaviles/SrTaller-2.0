# Tenant Lifecycle MVP — Discovery & Planning

## Estado del documento

- **Estado:** Discovery revisado; TL-001–016 aceptadas por el Owner y promovidas
  al [contrato Tenant Lifecycle MVP](../architecture/TENANT_LIFECYCLE_MVP.md).
  No autoriza implementación.
- **Work Unit:** `Tenant Lifecycle MVP — Discovery & Planning`.
- **Fecha de corte:** 2026-09-20.
- **Autoridad:** los contratos y ADR aceptados enlazados prevalecen sobre las
  propuestas de este documento.
- **Referencia legacy:** SR Taller 1.0 se usa sólo para observar comportamiento;
  su arquitectura, persistencia y seguridad no son diseño para 2.0.
- **Fuera de alcance:** SaaS Super Admin, billing, planes, suscripciones,
  Production y migración de datos legacy.

## 1. Resultado ejecutivo

SR Taller 2.0 ya puede operar de forma segura **después** de que existen un
Tenant, una Branch, una Station vinculada, un User activo, sus Roles, un PIN y
una Operational Session. La foundation integrada cubre persistencia
tenant-scoped, contexto confiable de Station, Users, Roles/Capabilities,
autenticación PIN, Sessions concurrentes y autorización server-side.

El lifecycle no está completo porque falta el camino productivo que crea y
conecta esas piezas. En particular, no existe registro público, identidad
administrativa previa a una Station, bootstrap atómico de Tenant/Owner/Admin,
administración de Branches ni enrollment productivo de Stations. El bootstrap
actual de Station es exclusivamente local/development.

La dependencia principal es un problema de orden:

```text
La administración actual requiere Station + PIN Session
                         pero
la primera Station todavía requiere administración para ser vinculada.
```

El MVP coherente necesita separar dos contextos de acceso:

1. **Administración del Tenant:** autenticación administrativa fuera del PIN
   operativo, suficiente para completar onboarding, Branches, Users/Roles y
   Stations.
2. **Operación de sucursal:** Station ya vinculada que deriva Tenant + Branch,
   seguida del login PIN existente.

Esta separación no concede autoridad de plataforma ni convierte una identidad
administrativa en operador automático. Si el Tenant Admin también opera el
taller, debe tener User, Role(s) y PIN propios.

## 2. Alcance auditado

### SR Taller 2.0

- Contratos de producto, multitenancy, identidad/acceso, Branch/Station,
  seguridad, datos, UI y pruebas.
- ADR-004 y ADR-010 a ADR-014.
- Persistencia y puertos de Tenant, Branch, Station, User, Role, PIN y Session.
- Controladores y rutas del runtime y de la web actual.
- PBIs 024, 025, 026, 031, 032, 033, 034 y 043.
- Pruebas PostgreSQL y contractuales relevantes.

### SR Taller 1.0

Se inspeccionó en modo read-only el checkout local
`/Users/luisantoniogutierrez/Documents/GitHub/srtaller`, branch `staging`:

- registro público y creación de taller;
- login del administrador SaaS y checklist de primeros pasos;
- administración de sucursales;
- selección de sucursal y vinculación inicial de dispositivo;
- login por PIN;
- administración de roles y usuarios;
- listado y desvinculación de dispositivos.

No se ejecutó ni modificó 1.0. Sus archivos no versionados preexistentes se
preservaron.

## 3. Regla de composición vigente en 2.0

Los contratos aceptados fijan estas invariantes:

- un User ordinario pertenece exactamente a un Tenant;
- un User no pertenece permanentemente a una Branch;
- la Station vinculada determina la Branch efectiva y de ella deriva el
  Tenant; el cliente no elige esos identificadores en una operación ordinaria;
- un Role agrupa Capabilities y pertenece al Tenant;
- un User obtiene permisos por la unión de Roles tenant-wide y Roles
  restringidos a la Branch efectiva; no recibe permisos directos;
- el PIN identifica a un User sólo dentro del Tenant ya resuelto por la
  Station;
- una Session identifica al actor de cada request, pero no sustituye la
  autorización;
- revocación o cambio de User, Role, assignment, PIN, Station o binding debe
  invalidar la autoridad futura correspondiente;
- los secretos no se guardan ni se devuelven en texto plano.

Fuentes principales:
[MULTITENANCY_MODEL](../architecture/MULTITENANCY_MODEL.md),
[IDENTITY_ACCESS_AND_PERMISSIONS](../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md),
[BRANCH_AND_DEVICE_MODEL](../architecture/BRANCH_AND_DEVICE_MODEL.md),
[SECURITY_BASELINE](../architecture/SECURITY_BASELINE.md) y
[MULTITENANT_ISOLATION_TESTING](../quality/MULTITENANT_ISOLATION_TESTING.md).

## 4. Matriz del lifecycle: existente vs. faltante

| Etapa | Estado 2.0 | Evidencia material | Brecha para MVP |
|---|---|---|---|
| Registro público | **Faltante** | La web actual sólo declara rutas operativas y de configuración en [`App.tsx`](../../apps/dev-preview-web/src/App.tsx). | Formulario, validación, abuso/rate limit, verificación de contacto, idempotencia y estados de registro. |
| Creación de Tenant | **Parcial** | `TenantRepositoryPort` crea/lee Tenant; `tenants` conserva UUID, moneda y fecha. | Nombre/handle/estado de lifecycle, caso de uso público autorizado, unicidad y orquestación transaccional. |
| Owner / primer Tenant Admin | **Parcial** | `ProvisionFirstUserUseCase` y `user_provisioning_bootstraps` permiten un primer User server-only, único e idempotente. | Identidad administrativa, método de login/recuperación, relación Owner/Admin y starter authority atómica. |
| Tenant Admin | **Parcial** | Users/Roles/Branch timezone tienen UI/API protegida por capacidad tenant-wide. | El acceso actual exige primero Station + PIN Session; no sirve para bootstrap ni administración previa a la primera Station. |
| Branch management | **Parcial** | Branch repository soporta create/list/find y timezone; FK compuesta preserva Tenant. UI sólo gestiona timezone de la Branch vinculada. | Nombre/estado/lifecycle, listar/crear/editar/desactivar Branches y autoridad administrativa sin depender de la Branch que se está creando. |
| Usuarios administrativos/operativos | **Existente después del bootstrap** | Configuración → Usuarios crea, edita, activa/desactiva, asigna Roles y reemplaza PIN sin devolverlo. | Decidir si la misma superficie vive también en contexto administrativo no-Station y cómo se crea el primer Admin sin autoelevación. |
| Roles y Capabilities | **Existente después del bootstrap** | Roles tenant-scoped, múltiples assignments, unión tenant/Branch, edición y enforcement server-side. | Capabilities específicas para Tenant, Branch y Station; starter Role de Tenant Admin y clasificación sensible. |
| Device/Station management | **Foundation** | Station, binding, credential hash, estados/revisiones y resolver fail-closed existen. | API/UI productivas de create/link/relink/unlink/revoke, inventario visible, nombre de Station, historia y auditoría. |
| New-device enrollment | **Faltante en producto** | `/api/stations/local-bootstrap` sólo funciona en development y usa secreto local; [PBI-031](../backlog/pbis/PBI-031.md) reserva la administración productiva. | Desafío temporal de un uso, emisión segura de credencial, expiración, replay protection y confirmación administrativa. |
| Selección de Branch | **Faltante en producto** | La Station existente ya conserva un binding único. | La Branch debe elegirla un Admin durante enrollment/relink; no debe ser selector libre del operador ni parámetro confiable del frontend. |
| Identificación de Station | **Existente** | Cookie opaca, hash server-side, Station/Binding/Branch activas y revisiones monotónicas resuelven `TrustedStationContext`. | Integrarlo con el enrollment productivo y mostrar nombre/estado no sensible. |
| Login PIN existente | **Existente** | PIN de cuatro dígitos protegido con Argon2id/pepper, límites de intentos, anti-enumeración, Session/CSRF y revocación. | Ninguna brecha funcional para el login diario; no usarlo como autenticación administrativa pública. |
| Sistema operacional | **Existente en el alcance integrado** | Shell, Repairs, Customers/Intake, configuración y Pricing Catalog consumen contexto y capacidades existentes. | El lifecycle sólo debe entregar al usuario a esta superficie; no reabrir los módulos operativos. |
| Validación cross-tenant | **Parcial fuerte** | Constraints compuestas y pruebas owner-scoped/Station/PIN/Session/Access cubren piezas aisladas. | Escenario E2E del lifecycle completo, manipulación de IDs/host/cookies/challenges y pruebas negativas entre dos Tenants. |

### Lectura de “Parcial”

“Parcial” no significa que la seguridad pueda completarse desde frontend. Una
pieza cuenta como completa sólo cuando la autoridad server-side, persistencia,
revocación, auditoría y pruebas de aislamiento cubren el flujo productivo.

## 5. Comportamiento observado en SR Taller 1.0

### Lo útil como referencia de producto

1. Un visitante puede abrir “Crear cuenta” y capturar nombre del taller,
   subdominio, contacto y credencial administrativa.
2. Después del alta, un checklist guía: primera sucursal, primer equipo, Roles,
   Users y configuración.
3. La administración de sucursales permite crear y consultar las del Tenant.
4. En un equipo nuevo se elige sucursal, se asigna nombre al dispositivo y se
   continúa al login PIN.
5. La operación cotidiana privilegia PIN; el usuario entra al panel de
   reparaciones dentro del contexto del dispositivo.
6. El administrador puede gestionar Roles, Users y dispositivos desde
   superficies separadas.

### Lo que 2.0 debe rechazar

| Mecanismo 1.0 observado | Por qué no se copia |
|---|---|
| Creación secuencial de Tenant, admin SaaS y User en almacenes distintos, con compensación manual parcial | Puede dejar alta incompleta; 2.0 necesita una frontera transaccional/idempotente o un workflow recuperable explícito. |
| PIN inicial conocido y mostrado en onboarding | Viola secreto por usuario, no plaintext y no default compartido. |
| PIN consultado/comparado en texto plano y visible desde Users | 2.0 ya tiene verificador no recuperable y nunca debe devolver PIN. |
| Saltar verificación de dispositivo para elegir Branch y autoinsertar una Station activa | El equipo no debe concederse confianza a sí mismo; requiere desafío autorizado, temporal y de un uso. |
| Cookie de dispositivo de larga duración como único artefacto práctico | 2.0 necesita credencial rotatable/revocable con hash, revisión y política de expiración. |
| User con un solo `rol_id` y permisos de vista | Contradice Roles múltiples, capabilities operativas y autorización server-side de 2.0. |
| DELETE de User o dispositivo | Debe preservarse historia mediante inactive/revoked/retired según el contrato aprobado. |
| Tenant resuelto por subdominio y filtrado manual repetido | El routing puede ayudar a localizar, pero nunca reemplaza scope trusted, constraints y pruebas cross-tenant. |
| Dependencia del pago para activar Tenant | Billing está fuera de alcance; el MVP necesita una regla de activación independiente. |

Conclusión: conservar el **orden mental** de onboarding de 1.0 y reemplazar sus
mecanismos de confianza por los contratos de 2.0.

## 6. Decisiones Owner aprobadas

El Owner aprobó TL-001 a TL-016 y `TLD-001–009` el 2026-09-20. La versión
normativa y sus invariantes finales están en el
[contrato Tenant Lifecycle MVP](../architecture/TENANT_LIFECYCLE_MVP.md). Este
discovery conserva la pregunta y recomendación originales como trazabilidad;
ya no deben leerse como autoridad pendiente.

| ID | Dirección aprobada resumida |
|---|---|
| TL-001 | Registro público autoservicio con email verificado. |
| TL-002 | Autenticación administrativa V1 con email verificado + password y threat model previo. |
| TL-003 | Persona inicial = primer Tenant User con starter Tenant Admin Role; sin Owner comercial separado. |
| TL-004 | Attempt antes de verificar; Tenant sólo después mediante bootstrap atómico/idempotente. |
| TL-005 | Tenant V1: `ONBOARDING` y `ACTIVE`. |
| TL-006 | Sin subdominio elegido por usuario; slug/host nunca es autoridad. |
| TL-007 | Primera Branch obligatoria durante onboarding. |
| TL-008 | Branch: nombre, timezone IANA, `ACTIVE`/`INACTIVE`, versión y timestamps. |
| TL-009 | Challenge de Station de alta entropía, un uso y TTL 10 minutos. |
| TL-010 | Capabilities explícitas para Branch/Station; sin `isAdmin`. |
| TL-011 | Admin Session y Operational Session PIN separadas. |
| TL-012 | Recovery por email verificado y protección del último Admin efectivo. |
| TL-013 | Nombre de persona/taller, email, password y aceptación versionada; teléfono opcional/no identidad. |
| TL-014 | Auditoría durable proporcional y sin secretos. |
| TL-015 | Control plane lógico en `admin.srtaller.com`, con despliegue/componentes compartibles. |
| TL-016 | Billing, Super Admin y suspensión comercial fuera del MVP. |

[QUESTION-005](OPEN_QUESTIONS.md#question-005) queda reconciliada para el
alcance MVP. `TLD-001` a `TLD-009` fueron resueltas por el Owner y viven en el
contrato aceptado, no en este discovery.

## 7. Riesgos de seguridad y multitenancy

| Riesgo | Severidad | Control requerido |
|---|---|---|
| Registro automatizado, spam o agotamiento de recursos | High | rate limit, verificación, límites por principal/red, respuestas anti-enumeración y limpieza de intentos. |
| Tenant parcialmente creado | Critical | comando idempotente; transacción única cuando comparta DB o saga explícita recuperable; journal de resultado. |
| Autoelevación del primer User | Critical | starter Role/capabilities definidos server-side; no aceptar Roles/capabilities del cliente. |
| “Chicken-and-egg” resuelto saltando Station checks | Critical | contexto administrativo separado y autenticado; nunca reutilizar el bypass local en producto. |
| Branch/Tenant enviados por frontend como autoridad | Critical | resolver Tenant desde admin identity y Branch desde recurso scoped; durante operación, desde Station binding. |
| Challenge de enrollment reutilizado, filtrado o de otro Tenant | Critical | secreto de alta entropía, hash, TTL corto, single-use, binding exacto, atomic consume y auditoría. |
| Admin de Tenant A vinculando equipo o User de Tenant B | Critical | claves/FK compuestas, repositorios scoped, authorization guard y matriz negativa E2E. |
| PIN como credencial administrativa remota | Critical | prohibir; PIN sólo dentro del Tenant derivado por Station. |
| Unique email/handle que filtra existencia | High | normalización/constraints y mensajes/timing que no enumeren cuentas. |
| Único Admin desactivado o sin recovery | High | invariant/policy explícita, reauth, recovery verificado y auditoría. |
| Branch desactivada con Stations/Sessions activas | High | commit guard, invalidación monotónica y regla transaccional. |
| Station perdida que conserva Sessions | Critical | revoke credential/binding/Station e invalidar todas sus Sessions antes de otra operación. |
| Permisos administrativos demasiado amplios | High | capabilities separadas, deny-by-default y nivel ADR-013 por acción. |
| Copiar información sensible de 1.0 | Critical | no migrar PIN/password/cookies; cualquier futura migración requiere alcance y threat model propios. |

## 8. Tenant Lifecycle MVP propuesto

### Boundary mínimo

El MVP termina cuando dos talleres pueden registrarse y alcanzar operación
aislada sin intervención de Super Admin ni billing:

```text
Registro público
  → verificación administrativa
  → bootstrap idempotente de Tenant + primer Tenant Admin
  → primera Branch (nombre + IANA timezone)
  → administración de Roles/Users
  → solicitud de enrollment para una Branch
  → nuevo equipo canjea desafío y queda identificado como Station
  → PIN existente crea Operational Session
  → sistema operacional existente
  → pruebas negativas cross-tenant
```

### Incluye

- registro público protegido y estado de onboarding;
- autenticación/recovery mínima del Tenant Admin separada del PIN;
- creación coherente de Tenant, primer User, starter Role y assignment;
- Branch management V1;
- Users/Roles/PIN reutilizando los agregados existentes;
- Station inventory, enrollment, revoke y relink conforme a PBI-031;
- handoff explícito del control plane a la operación PIN;
- auditoría y E2E multitenant.

### No incluye

- Super Admin, soporte impersonado o break-glass;
- billing, plan limits, trials, pagos SaaS o paywall;
- custom domains, SSO, MFA general, invitaciones masivas u organizaciones
  multi-tenant;
- transferencia de Branch entre Tenants;
- operación offline, MDM o fingerprint como autoridad;
- cierre/eliminación legal del Tenant o migración desde 1.0;
- rediseño de los módulos operativos ya integrados.

## 9. Roadmap refinado por TL-01

El roadmap preliminar de discovery fue refinado después de las decisiones
TL-001–016. La secuencia normativa, alcances, dependencias y gates están en la
sección [Work Units futuras refinadas](../architecture/TENANT_LIFECYCLE_MVP.md#10-work-units-futuras-refinadas)
del contrato arquitectónico.

TL-01 separó Administrative Identity, Public Registration, Branch Activation,
Tenant Administration Integration, Station Enrollment y Device Redemption en
TL-02 a TL-09 para evitar mezclar fronteras de seguridad. Ninguna de esas Work
Units queda iniciada o seleccionada por este discovery; cada una requiere su
propia autorización, readiness, riesgo y gates.

### Por qué no es una sola Work Unit

- El acceso administrativo previo a Station cambia el threat model y no debe
  mezclarse con enrollment.
- El bootstrap de Tenant es una frontera atómica distinta de Branch lifecycle.
- PBI-031 ya reserva Station administration y tiene riesgo crítico.
- El E2E final debe validar el conjunto integrado, no reemplazar las pruebas
  focalizadas de cada candidato.

## 10. Escenario de aceptación E2E

### Dataset

| Tenant | Branches | Administradores/Users | Stations |
|---|---|---|---|
| **Taller Alfa** | Centro Alfa, Norte Alfa | Admin Alfa; Recepción Alfa; Técnico Alfa | Caja Alfa Centro; Taller Alfa Norte |
| **Taller Beta** | Centro Beta, Sur Beta | Admin Beta; Recepción Beta; Técnico Beta | Caja Beta Centro; Taller Beta Sur |

Los datos y credenciales son sintéticos. Los dos Tenants pueden usar
deliberadamente el mismo PIN para Users distintos: la Station debe resolver
primero el Tenant y evitar cualquier colisión cross-tenant.

### Happy path

1. Registrar públicamente Taller Alfa y Taller Beta con contactos distintos.
2. Verificar cada contacto; replay del enlace/comando no duplica Tenant ni
   primer Admin.
3. Confirmar que Admin Alfa sólo ve Alfa y Admin Beta sólo Beta.
4. Crear dos Branches por Tenant con timezones IANA explícitas.
5. Crear Roles tenant-scoped y Users operativos; asignar un Role tenant-wide y
   otro restringido a una Branch.
6. Configurar PINs sin que API/UI/persistencia los expongan en plaintext.
7. Desde Admin Alfa generar enrollment para Centro Alfa; desde Admin Beta para
   Centro Beta.
8. En cada equipo nuevo canjear el desafío una sola vez; reload conserva la
   Station; el segundo canje se rechaza.
9. La pantalla PIN muestra únicamente la Branch vinculada. Un User válido del
   mismo Tenant inicia Session y entra al sistema operacional.
10. El mismo User tenant-wide inicia sesión desde la segunda Branch de su
    Tenant; sus capabilities efectivas se recalculan. El Role restringido sólo
    aporta en su Branch.
11. Crear una Repair/Note mínima en Alfa y otra en Beta; cada Timeline conserva
    actor, Tenant, Branch, Station, Session y correlation correctos.
12. Revocar una Station y confirmar que todas sus Sessions dejan de autorizar;
    las demás Stations del Tenant continúan.

### Matriz negativa obligatoria

- contacto, handle o respuesta pública no revela si otro Tenant existe;
- Admin Alfa no puede leer/crear/editar Branch, User, Role o Station de Beta
  alterando path, body, query, host o IDs;
- challenge Alfa no puede activar una Station Beta ni elegir otra Branch;
- cookie/credential de Station Alfa presentada en host/contexto Beta se
  rechaza;
- PIN de User Beta en Station Alfa no autentica ni confirma si existe;
- assignment de Role Alfa a User/Branch Beta viola el comando/constraint;
- Session Alfa no puede leer ni mutar Repairs/Catalog de Beta;
- Branch inactiva, binding revocado, Station revocada, User inactivo o Role
  revocado fallan cerrados en la siguiente operación protegida;
- replay concurrente de registration/bootstrap/enrollment produce un solo
  resultado durable y ninguna autoridad parcial;
- logs, auditoría y errores no incluyen PIN, password, challenge, cookie ni
  tokens.

### Criterio de aprobación

El escenario pasa sólo si UI y API coinciden, PostgreSQL confirma aislamiento,
los efectos autorizados son atribuibles y todas las pruebas negativas carecen
de side effects. Ocultar una opción en frontend no cuenta como autorización.

## 11. Reconciliación documental de TL-01

TL-01 reconcilia:

- [OPEN_QUESTIONS](OPEN_QUESTIONS.md), especialmente QUESTION-005;
- [ACTORS_AND_PERSONAS](ACTORS_AND_PERSONAS.md);
- [MODULE_MAP](MODULE_MAP.md) para Tenant/Branch/Device ownership;
- [APPLICATION_ARCHITECTURE](../architecture/APPLICATION_ARCHITECTURE.md) para
  el control plane administrativo;
- [IDENTITY_ACCESS_AND_PERMISSIONS](../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md);
- [BRANCH_AND_DEVICE_MODEL](../architecture/BRANCH_AND_DEVICE_MODEL.md);
- [SECURITY_BASELINE](../architecture/SECURITY_BASELINE.md);
- roadmap/backlog/PBI que el Owner seleccione.

## 12. Estado posterior al discovery

TL-01 fue autorizado y ADR-015/`TLD-001–009` fueron aceptadas. No se inicia
registro público, PBI-031 ni otro Work Unit de implementación hasta promover e
integrar TL-01 y obtener autorización independiente para el siguiente alcance.
