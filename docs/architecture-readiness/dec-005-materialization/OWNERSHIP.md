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
| `stations` | Frontera del contexto operativo confiable y módulo Nest de composición | Arquitectura | Autoridad de dominio sobre contexto operativo y sucursales; persona pendiente de asignación | Ingeniería; persona pendiente | `StationsModuleContract`, `TrustedStationContext`, `isTrustedStationContext` — contrato estructural público y guard que no filtran el contrato nominal interno | `access` | `tenancy` | `access`, internals de `tenancy` y todo módulo no aprobado |
| `access` | Frontera consumidora de contexto e identidad aprobados, credencial PIN owner-scoped y módulo Nest de composición | Arquitectura | Autoridad de dominio de Identity and Access con participación de Seguridad; persona pendiente de asignación | Ingeniería; persona pendiente | `AccessModuleContract` — único export público; el proof de PIN permanece interno al módulo | `AppModule` para verificación de composición | `stations`, `tenancy`, `users` por sus superficies públicas | Internals de productores y todo módulo no aprobado |
| `repairs` | Worklist, detalle read model, evidencia y nota operativa del slice funcional local; módulo Nest propietario | Arquitectura | Autoridad de dominio de Reparaciones; persona pendiente de asignación | Ingeniería; persona pendiente | `RepairsModuleContract`; controller HTTP exacto registrado en `presentation` y compuesto por `RepairsModule` | `AppModule` para composición; frontend local vía HTTP | `tenancy` por superficie pública permitida | Internals de `tenancy`, DB/adapters desde presentation, pagos, clientes y todo módulo no aprobado |
| `users` | Directorio tenant-scoped y lifecycle de identidad; sin roles, PIN ni sesión | Arquitectura | Identity Foundation; persona pendiente de asignación | Ingeniería; persona pendiente | `UsersModuleContract`, `AuthenticationUserReader`, `AuthenticationUserRecord`, `AuthenticationUserScope` — lectura mínima server-side para composición de autenticación | `access` para elegibilidad de User y `AppModule` para composición | `tenancy` por superficie pública permitida | Roles, PIN, sesión, autorización e internals de tenancy |

## Superficies Nest separadas

`TenancyModule`, `StationsModule` y `AccessModule` son superficies exclusivas
de composición. Sólo `AppModule` las importa y no forman parte del contrato
funcional público de los módulos.

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
sus contratos públicos registrados.

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
