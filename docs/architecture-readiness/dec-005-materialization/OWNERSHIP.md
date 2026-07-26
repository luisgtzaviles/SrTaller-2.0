# Ownership de módulos materializados

## Regla

Este registro asigna fronteras y contratos de código. No decide ownership de
tablas, repositorios, transacciones ni datos; esos asuntos permanecen en
DEC-049. Una función no equivale a una persona y no se inventan asignaciones
individuales.

## Registro canónico

| Módulo | Propósito técnico provisional | Owner arquitectónico | Owner funcional | Mantenedores | Superficie pública | Consumidores reales | Dependencias permitidas | Dependencias prohibidas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `tenancy` | Frontera pública y módulo Nest de composición | Arquitectura | Autoridad de dominio sobre tenant, sucursal y elegibilidad mínima; persona pendiente de asignación | Ingeniería; persona pendiente | `TenancyModuleContract`, `TenantId`, `BranchId`, `parseTenantId`, `parseBranchId`, `BranchEligibilityCapability`, `BranchEligibilityQuery` y `EligibleBranchSnapshot` | `stations`, `access` | Ninguna | `stations`, `access`, internals ajenos y todo módulo no aprobado |
| `stations` | Frontera pública del contexto operativo confiable y módulo Nest de composición | Arquitectura | Autoridad de dominio sobre Station, lifecycle, bindings y contexto confiable; persona pendiente de asignación | Ingeniería; persona pendiente | `StationsModuleContract`, `StationId`, `parseStationId`, `TrustedStationContext`, `ResolveTrustedStationContext` y `RunWithTrustedStationContext` | `access` | `tenancy` sólo por su `index.ts` | `access`, internals de `tenancy` y todo módulo no aprobado |
| `access` | Frontera type-only consumidora del contexto aprobado y módulo Nest de composición | Arquitectura | Autoridad de dominio de Identity and Access con participación de Seguridad; persona pendiente de asignación | Ingeniería; persona pendiente | `AccessModuleContract` — marcador type-only que declara contexto organizacional/operativo | `AppModule` para verificación de composición | `stations`, `tenancy` | Internals de productores y todo módulo no aprobado |

## Superficies Nest separadas

`TenancyModule`, `StationsModule` y `AccessModule` son superficies exclusivas
de composición. Sólo `AppModule` las importa y no forman parte del contrato
funcional público de los módulos.

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
