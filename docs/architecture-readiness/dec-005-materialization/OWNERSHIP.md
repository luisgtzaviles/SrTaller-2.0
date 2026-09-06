# Ownership de módulos materializados

## Regla

Este registro asigna fronteras y contratos de código. No decide ownership de
tablas, repositorios, transacciones ni datos; esos asuntos permanecen en
DEC-049. Una función no equivale a una persona y no se inventan asignaciones
individuales.

## Registro canónico

| Módulo | Propósito técnico provisional | Owner arquitectónico | Owner funcional | Mantenedores | Superficie pública | Consumidores reales | Dependencias permitidas | Dependencias prohibidas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `tenancy` | Frontera raíz type-only y módulo Nest de composición | Arquitectura | Autoridad de dominio sobre configuración organizacional; persona pendiente de asignación | Ingeniería; persona pendiente | `TenancyModuleContract`, `TenantId`, `parseTenantId` — marcador de frontera e identidad nominal consumida por `stations` | `stations`, `access` | Ninguna | `stations`, `access`, internals ajenos y todo módulo no aprobado |
| `stations` | Frontera type-only del contexto operativo y módulo Nest de composición | Arquitectura | Autoridad de dominio sobre contexto operativo y sucursales; persona pendiente de asignación | Ingeniería; persona pendiente | `StationsModuleContract` — marcador type-only que declara dependencia de tenancy | `access` | `tenancy` | `access`, internals de `tenancy` y todo módulo no aprobado |
| `access` | Frontera type-only consumidora del contexto aprobado y módulo Nest de composición | Arquitectura | Autoridad de dominio de Identity and Access con participación de Seguridad; persona pendiente de asignación | Ingeniería; persona pendiente | `AccessModuleContract` — marcador type-only que declara contexto organizacional/operativo | `AppModule` para verificación de composición | `stations`, `tenancy` | Internals de productores y todo módulo no aprobado |
| `repairs` | Worklist, detalle read model, evidencia y nota operativa del slice funcional local; módulo Nest propietario | Arquitectura | Autoridad de dominio de Reparaciones; persona pendiente de asignación | Ingeniería; persona pendiente | `RepairsModuleContract`; controller HTTP exacto registrado en `presentation` y compuesto por `RepairsModule` | `AppModule` para composición; frontend local vía HTTP | `tenancy` por superficie pública permitida | Internals de `tenancy`, DB/adapters desde presentation, pagos, clientes y todo módulo no aprobado |
| `users` | Directorio tenant-scoped y lifecycle de identidad; sin roles, PIN ni sesión | Arquitectura | Identity Foundation; persona pendiente de asignación | Ingeniería; persona pendiente | `UsersModuleContract` | `AppModule` para composición | `tenancy` por superficie pública permitida | Roles, PIN, sesión, autorización e internals de tenancy |

## Superficies Nest separadas

`TenancyModule`, `StationsModule` y `AccessModule` son superficies exclusivas
de composición. Sólo `AppModule` las importa y no forman parte del contrato
funcional público de los módulos.

`RepairsModule` compone su controller registrado. Ese controller pertenece
únicamente a `repairs`, delega en casos de uso de su propia aplicación y no
constituye una superficie pública intermodular. Health conserva su contrato
técnico exacto separado.

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
