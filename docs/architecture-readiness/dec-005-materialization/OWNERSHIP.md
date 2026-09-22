# Ownership de módulos materializados

## Regla

Este registro asigna fronteras y contratos de código. No decide ownership de
tablas, repositorios, transacciones ni datos; esos asuntos permanecen en
DEC-049. Una función no equivale a una persona y no se inventan asignaciones
individuales.

## Registro canónico

| Módulo | Propósito técnico provisional | Owner arquitectónico | Owner funcional | Mantenedores | Superficie pública | Consumidores reales | Dependencias permitidas | Dependencias prohibidas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `tenancy` | Frontera raíz y configuración organizacional Tenant | Arquitectura | Autoridad de dominio sobre configuración organizacional; persona pendiente de asignación | Ingeniería; persona pendiente | `TenancyModuleContract`, `TenantId`, `parseTenantId`, `OperatingCurrency`, `parseOperatingCurrency`, `TENANT_SETTINGS_RUNTIME`, `TenantSettingsRuntime`, `TENANT_BOOTSTRAP_PERSISTENCE`, `TenantBootstrapPersistence`, `TenantBootstrapWriter` — identidad nominal, moneda y persistencia atómica de bootstrap | `stations`, `access`, `users`, `customers`, `catalog` | Ninguna | Internals ajenos y todo módulo no aprobado |
| `stations` | Frontera del contexto operativo confiable, Branch IANA y módulo Nest de composición | Arquitectura | Autoridad de dominio sobre contexto operativo y sucursales; persona pendiente de asignación | Ingeniería; persona pendiente | `StationsModuleContract`, `TrustedStationContext`, `TrustedStationContextError`, `TrustedStationContextResolver`, `TRUSTED_STATION_CONTEXT_RESOLVER`, `TrustedStationAdmissionSnapshot`, `TrustedStationAdmissionValidator`, `TRUSTED_STATION_ADMISSION_VALIDATOR`, `BRANCH_SETTINGS_RUNTIME`, `BranchSettingsRuntime`, `BranchSettingsScope`, `BranchTimeZone`, `OperationalDateTime`, `branchLocalCalendarBoundaryToUtc`, `branchLocalCalendarDate`, `branchLocalDateTimeToUtc`, `parseBranchTimeZone`, `presentOperationalDateTime`, `isTrustedStationContext` — resolución pública, límites y conversión de calendario IANA y validación owner-scoped sin exponer tablas ni driver | `access`, `repairs` | `tenancy` | `access`, `repairs`, internals de `tenancy` y todo módulo no aprobado |
| `access` | Frontera consumidora de contexto e identidad aprobados, credencial PIN, sesión y autorización contextual owner-scoped; módulo Nest de composición | Arquitectura | Autoridad de dominio de Identity and Access con participación de Seguridad; persona pendiente de asignación | Ingeniería; persona pendiente | `AccessModuleContract`, `ADMIN_AUTHORIZATION_EXECUTOR`, `AdminAuthorizationCommitGuard`, `AdminAuthorizationExecutor`, `AdminAuthorizationRequirement`, `AdminPasswordVerifier`, `AuthorizedAdminContext`, `AuthorizedOperationCommitGuard`, `AuthorizedOperationalContext`, `CONTEXTUAL_AUTHORIZATION_EXECUTOR`, `ContextualAuthorizationError`, `ContextualAuthorizationErrorCode`, `ContextualAuthorizationExecutor`, `REGISTRATION_PASSWORD_PROTECTOR`, `RegistrationPasswordProtector`, `ProtectedOperationKind`, `ProtectedOperationRequirement`, `ProtectedRequestEvidence`, `ReauthenticatedOperationalContext`, `SENSITIVE_ACTION_LEVEL2_EXECUTOR`, `SensitiveActionLevel2Code`, `SensitiveActionLevel2Executor`, `SensitiveActionReauthenticationError`, `TENANT_WIDE_AUTHORIZATION_EXECUTOR`, `TENANT_BOOTSTRAP_EXECUTOR`, `TenantBootstrapExecutor`, `TenantWideAuthorizationExecutor` — autorización administrativa/operacional y handoff verificado sin selección de autoridad del cliente | `repairs`, `catalog` y `registration` mediante tokens/contratos dirigidos; `AppModule` para composición exterior | `stations`, `tenancy`, `users` por sus superficies públicas | Internals de productores y todo módulo no aprobado |
| `catalog` | Identidad comercial Tenant-wide, clasificación, identificadores y pricing efectivo por Branch | Arquitectura | Autoridad de dominio de Catalog/Pricing; persona pendiente de asignación | Ingeniería; persona pendiente | `CatalogModuleContract`, `CatalogSearch`, `CatalogItemReader`, `EffectivePriceResolver`, `CatalogSnapshotFactory` — integración mínima de consulta/snapshot sin exponer repositorios ni ownership downstream | `AppModule` para composición; frontend local vía HTTP | `access` para autorización contextual/Tenant-wide y `tenancy` para moneda operativa | Inventory, Procurement, Repair, Payments, Cash, archivos, internals de productores y todo módulo no aprobado |
| `customers` | Identidad mínima de Customer acotada a Branch y lookup por nombre/teléfono sin identidad natural | Arquitectura | Autoridad de dominio de Clientes; persona pendiente de asignación | Ingeniería; persona pendiente | `CustomersModuleContract`, `CustomerIntakeScope`, `CustomerIntakeInput`, `CustomerIntakeRecord`, `CustomerSearchCandidate`, `CustomerIntakeRuntime`, `CUSTOMER_INTAKE_RUNTIME` — selección explícita o alta dentro de Intake; teléfono no identifica ni fusiona | `repairs` durante Nueva reparación; `AppModule` para composición exterior | `tenancy` por identidad nominal | Internals de `tenancy`, CRM, autorización y persistencia ajena |
| `repairs` | Worklist, detalle, alta mínima, política versionada Branch de Nueva Reparación y catálogos Platform/Tenant de Riesgos, Marcas y Modelos; módulo Nest propietario | Arquitectura | Autoridad de dominio de Reparaciones, incluidos riesgos de intervención y referencias canónicas Brand/Model con snapshots históricos; persona pendiente de asignación | Ingeniería; persona pendiente | `RepairsModuleContract`; controller HTTP exacto registrado en `presentation` y compuesto por `RepairsModule`; registro de campos, policy y operaciones de catálogos permanecen internos al módulo | `AppModule` para composición; frontend local vía HTTP | `access` por autorización contextual y capabilities dedicadas, `customers` por selección/alta explícita, `stations` por la zona IANA de Branch ya autorizada y `tenancy` por superficie pública | `GenericCatalogModule` como owner transversal, internals de productores, DB/adapters desde presentation, pagos y todo módulo no aprobado |
| `users` | Directorio tenant-scoped, lifecycle de identidad y preferencias personales; sin roles, PIN ni sesión | Arquitectura | Identity Foundation; persona pendiente de asignación | Ingeniería; persona pendiente | `UsersModuleContract`, `AuthenticationUserReader`, `AUTHENTICATION_USER_READER`, `AuthenticationUserRecord`, `AuthenticationUserScope`, `AuthenticationUserAdmissionSnapshot`, `AuthenticationUserAdmissionValidator`, `AUTHENTICATION_USER_ADMISSION_VALIDATOR`, `TENANT_BOOTSTRAP_USER_WRITER`, `TenantBootstrapUserWriter`, `UserProductRuntime`, `USER_PRODUCT_RUNTIME`, `NewRepairFormMode`, `UserPreferencesRuntime`, `USER_PREFERENCES_RUNTIME` — lectura, lifecycle, bootstrap y preferencias owner-scoped dentro de composición | `access` para elegibilidad, bootstrap, administración product-local y preferencia self-service autenticada; `AppModule` para composición | `tenancy` por superficie pública permitida | Roles, PIN, sesión, autorización e internals de tenancy |
| `registration` | Intento público pre-Tenant y verificación de correo | Arquitectura | Tenant Lifecycle MVP; persona pendiente de asignación | Ingeniería; persona pendiente | `RegistrationModuleContract` — composición pública sin exponer challenge, password, repositorio ni autoridad de bootstrap | `AppModule` para composición exterior | `access` mediante protector de password y executor de bootstrap registrados | Internals de Access/Tenancy/Users, Station, PIN y todo módulo no aprobado |

TL-02 amplía la superficie pública de `access` con
`AdminAuthorizationCommitGuard`, `AdminAuthorizationExecutor`,
`AdminAuthorizationRequirement`, `AuthorizedAdminContext` y
`ADMIN_AUTHORIZATION_EXECUTOR`. Esos contratos mantienen la autorización
administrativa tenant-wide separada del contexto operacional; no exponen
repositorios, credenciales ni selección de Tenant desde cliente.

TL-03 añade los contratos dirigidos de bootstrap entre `access`, `tenancy` y
`users`. TL-04 añade `AdminPasswordVerifier`,
`REGISTRATION_PASSWORD_PROTECTOR`/`RegistrationPasswordProtector` y
`TENANT_BOOTSTRAP_EXECUTOR`/`TenantBootstrapExecutor`; `registration` consume
sólo esas superficies y nunca construye autoridad desde campos del cliente.

## Superficies Nest separadas

`TenancyModule`, `StationsModule`, `UsersModule`, `AccessModule`,
`CustomersModule`, `RegistrationModule`, `RepairsModule` y `CatalogModule` son
superficies exclusivas de composición. `AppModule` conserva la composición
exterior. Option A permite además que `AccessModule` importe exactamente
`StationsModule`, `TenancyModule` y `UsersModule`, mediante los edges y bindings registrados en
policy v9, que `RepairsModule` importe exactamente `AccessModule` y
`CustomersModule`, y que `CatalogModule` importe `AccessModule` y
`TenancyModule` mediante sus tokens y contratos públicos, y que
`RegistrationModule` importe `AccessModule` para el handoff verificado;
ninguna otra importación de módulo queda implícitamente autorizada.
Las clases Nest no forman parte del contrato funcional público.

`RepairsModule` y `RegistrationModule` componen sus controllers registrados. Cada controller pertenece
únicamente a `repairs`, delega en casos de uso de su propia aplicación y no
constituye una superficie pública intermodular. Health conserva su contrato
técnico exacto separado.

Los catálogos de Riesgos, Marcas y Modelos y su auditoría pertenecen
exclusivamente a `repairs`. Modelo referencia obligatoriamente una Marca
canónica, mientras Repair preserva los snapshots y puede conservar identidades
canónicas opcionales. El scope curado Platform y las extensiones Tenant no
introducen un módulo ni repositorio genérico; Branch sólo aporta contexto
autorizado para operar y no es owner del catálogo. Fallas y Estados requieren
contratos de dominio propios antes de materializarse; Técnicos permanece en
Users + Access + asignaciones de Repairs y no se modela como catálogo.

La corrección posterior de Marca/Modelo también pertenece exclusivamente a
`repairs`: modifica la proyección vigente del equipo y conserva un registro
append-only con valores anterior/nuevo, motivo y atribución confiable. Access
autoriza mediante `repairs.correct_intake`, pero no adquiere ownership sobre el
comando, su historial, Timeline ni la persistencia de Repair.

La persistencia de PIN queda detrás de `PinCredentialRepositoryPort`, con
`PinCredentialTenantScope` y `PinCredentialStationScope`, y se materializa en
`KyselyPinCredentialRepository`. La lectura de identidad para autenticación
queda detrás de `AuthenticationUserReaderPort`, con
`AuthenticationUserPersistenceScope`, y se materializa en
`KyselyAuthenticationUserReader`. Ninguno de esos ports o adapters amplía la
superficie pública del módulo; `access` sólo cruza a `stations` y `users` por
sus contratos y tokens públicos registrados. `StationsModule` conserva el
binding y export únicos de `TRUSTED_STATION_CONTEXT_RESOLVER`,
`TRUSTED_STATION_ADMISSION_VALIDATOR` y `BRANCH_SETTINGS_RUNTIME`; `UsersModule` conserva los bindings y
exports únicos de `AUTHENTICATION_USER_READER`,
`AUTHENTICATION_USER_ADMISSION_VALIDATOR`, `USER_PRODUCT_RUNTIME` y
`USER_PREFERENCES_RUNTIME`; `AccessModule` los inyecta sin
adquirir ownership sobre Station o User y conserva el binding/export único de
`CONTEXTUAL_AUTHORIZATION_EXECUTOR`, `TENANT_WIDE_AUTHORIZATION_EXECUTOR` y
`SENSITIVE_ACTION_LEVEL2_EXECUTOR`; `RepairsModule` inyecta una sola vez el
primero y `CatalogModule` los tres
executor y el runtime IANA de Stations para límites locales de Worklist
sin adquirir internals de Access. El `AuthorizedOperationCommitGuard` queda
ligado al contexto ya autorizado y revalida Station, Session, User y capability
en la misma transacción del efecto. Los validadores reciben sólo un
contexto transaccional opaco y bloquean/validan sus propias filas.

## Revisión transversal

Requieren revisión previa de Arquitectura:

- un módulo nuevo, división o fusión;
- un edge nuevo o dirección distinta;
- agregar, eliminar o cambiar un export público;
- introducir una capa interna;
- admitir contenido en `shared/`;
- crear infraestructura raíz;
- registrar una excepción, con owner, motivo, vencimiento y plan de retiro.

El owner funcional correspondiente debe revisar semántica pública. Ingeniería
mantiene el checker y la policy. Una sola persona puede ejercer funciones
distintas, pero su participación se registra por función en el dictamen futuro.
