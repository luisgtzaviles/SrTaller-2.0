# Ownership de módulos materializados

## Regla

Este registro asigna fronteras y contratos de código. No decide ownership de
tablas, repositorios, transacciones ni datos; esos asuntos permanecen en
DEC-049. Una función no equivale a una persona y no se inventan asignaciones
individuales.

## Registro canónico

| Módulo | Propósito técnico provisional | Owner arquitectónico | Owner funcional | Mantenedores | Superficie pública | Consumidores reales | Dependencias permitidas | Dependencias prohibidas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `tenancy` | Frontera raíz type-only y módulo Nest de composición | Arquitectura | Autoridad de dominio sobre configuración organizacional; persona pendiente de asignación | Ingeniería; persona pendiente | `TenancyModuleContract`, `TenantId`, `parseTenantId` — marcador de frontera e identidad nominal consumida por los módulos dependientes | `stations`, `access`, `users` | Ninguna | `stations`, `access`, `users`, internals ajenos y todo módulo no aprobado |
| `stations` | Frontera del contexto operativo confiable y módulo Nest de composición | Arquitectura | Autoridad de dominio sobre contexto operativo y sucursales; persona pendiente de asignación | Ingeniería; persona pendiente | `StationsModuleContract`, `TrustedStationContext`, `TrustedStationContextError`, `TrustedStationContextResolver`, `TRUSTED_STATION_CONTEXT_RESOLVER`, `TrustedStationAdmissionSnapshot`, `TrustedStationAdmissionValidator`, `TRUSTED_STATION_ADMISSION_VALIDATOR`, `isTrustedStationContext` — resolución pública y validación owner-scoped dentro de una transacción compuesta sin exponer tablas ni driver | `access` | `tenancy` | `access`, internals de `tenancy` y todo módulo no aprobado |
| `access` | Frontera consumidora de contexto e identidad aprobados, credencial PIN, sesión y autorización contextual owner-scoped; módulo Nest de composición | Arquitectura | Autoridad de dominio de Identity and Access con participación de Seguridad; persona pendiente de asignación | Ingeniería; persona pendiente | `AccessModuleContract`, `AuthorizedOperationalContext`, `ContextualAuthorizationExecutor`, `CONTEXTUAL_AUTHORIZATION_EXECUTOR`, `ContextualAuthorizationError`, `ContextualAuthorizationErrorCode`, `ProtectedOperationKind`, `ProtectedOperationRequirement`, `ProtectedRequestEvidence` — boundary framework-free; el proof de PIN y los internals de sesión permanecen privados | `repairs` mediante token/contrato dirigido; `AppModule` para composición exterior | `stations`, `tenancy`, `users` por sus superficies públicas | Internals de productores y todo módulo no aprobado |
| `repairs` | Worklist, detalle read model, evidencia y nota operativa del slice funcional local; módulo Nest propietario | Arquitectura | Autoridad de dominio de Reparaciones; persona pendiente de asignación | Ingeniería; persona pendiente | `RepairsModuleContract`; controller HTTP exacto registrado en `presentation` y compuesto por `RepairsModule` | `AppModule` para composición; frontend local vía HTTP | `access` por su executor público de autorización contextual y `tenancy` por superficie pública | Internals de `access`/`tenancy`, DB/adapters desde presentation, pagos, clientes y todo módulo no aprobado |
| `users` | Directorio tenant-scoped y lifecycle de identidad; sin roles, PIN ni sesión | Arquitectura | Identity Foundation; persona pendiente de asignación | Ingeniería; persona pendiente | `UsersModuleContract`, `AuthenticationUserReader`, `AUTHENTICATION_USER_READER`, `AuthenticationUserRecord`, `AuthenticationUserScope`, `AuthenticationUserAdmissionSnapshot`, `AuthenticationUserAdmissionValidator`, `AUTHENTICATION_USER_ADMISSION_VALIDATOR` — lectura mínima y validación owner-scoped dentro de una transacción compuesta | `access` para elegibilidad de User y `AppModule` para composición | `tenancy` por superficie pública permitida | Roles, PIN, sesión, autorización e internals de tenancy |

## Superficies Nest separadas

`TenancyModule`, `StationsModule`, `UsersModule`, `AccessModule` y
`RepairsModule` son
superficies exclusivas de composición. `AppModule` conserva la composición
exterior. Option A permite además que `AccessModule` importe exactamente
`StationsModule` y `UsersModule`, mediante los edges y bindings registrados en
policy v5, y que `RepairsModule` importe exactamente `AccessModule` mediante
`CONTEXTUAL_AUTHORIZATION_EXECUTOR`/`ContextualAuthorizationExecutor`;
ninguna otra importación de módulo queda implícitamente autorizada.
Las clases Nest no forman parte del contrato funcional público.

`RepairsModule` compone su controller registrado. Ese controller pertenece
únicamente a `repairs`, delega en casos de uso de su propia aplicación y no
constituye una superficie pública intermodular. Health conserva su contrato
técnico exacto separado.

La persistencia de PIN queda detrás de `PinCredentialRepositoryPort`, con
`PinCredentialTenantScope` y `PinCredentialStationScope`, y se materializa en
`KyselyPinCredentialRepository`. La lectura de identidad para autenticación
queda detrás de `AuthenticationUserReaderPort`, con
`AuthenticationUserPersistenceScope`, y se materializa en
`KyselyAuthenticationUserReader`. Ninguno de esos ports o adapters amplía la
superficie pública del módulo; `access` sólo cruza a `stations` y `users` por
sus contratos y tokens públicos registrados. `StationsModule` conserva el
binding y export únicos de `TRUSTED_STATION_CONTEXT_RESOLVER` y
`TRUSTED_STATION_ADMISSION_VALIDATOR`; `UsersModule` conserva los bindings y
exports únicos de `AUTHENTICATION_USER_READER` y
`AUTHENTICATION_USER_ADMISSION_VALIDATOR`; `AccessModule` los inyecta sin
adquirir ownership sobre Station o User y conserva el binding/export único de
`CONTEXTUAL_AUTHORIZATION_EXECUTOR`; `RepairsModule` lo inyecta una sola vez
sin adquirir internals de Access. Los validadores reciben sólo un
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
