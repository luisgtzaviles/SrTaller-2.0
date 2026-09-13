# Auditoría de aplicabilidad de Canonical Merge

Fecha: 2026-09-13
Alcance: iteración Owner de PBI-040

## Distinción operativa

- **Edit** conserva la identidad y cambia sus atributos.
- **Pending Reconciliation** decide la identidad canónica de un valor capturado que todavía está por revisar.
- **Canonical Merge** declara que dos o más identidades antes aceptadas representan una sola identidad; reasigna relaciones vigentes y conserva las fuentes retiradas y el evento de consolidación.

Esta iteración materializa Canonical Merge únicamente para `Catalog` de Lista de precios: Category (mismo Tenant y mismo Type) y Brand (mismo Tenant, con unión de applicability). No convierte el merge en rename ni en hard delete.

## Auditoría de Repairs

| Catálogo | Dependencias autoritativas observadas | Por qué no se aplicó automáticamente |
|---|---|---|
| Device Types | Scope híbrido Platform/Tenant, pending values, eventos append-only y `repair_intakes.canonical_device_type_id`. | Falta decidir si una identidad Platform puede sobrevivir a una Tenant, cómo se conserva el texto de recepción y qué referencias operativas se reasignan frente a snapshots históricos. |
| Brands | Scope Platform/Tenant, pending values, intakes y Models dependientes; triggers exigen consistencia Brand/Model. | Fusionar Brand puede producir colisiones de Models y requiere una política explícita para consolidar o mantener modelos homónimos. |
| Models | Identidad compuesta por Brand efectiva + nombre, scope Platform/Tenant, pending values, intakes y correcciones de equipo. | Sólo “misma Brand” no basta mientras una Brand también pueda fusionarse; se necesita definir orden, colisiones y efecto sobre correcciones históricas. |
| Problem Categories | Scope Platform/Tenant, pending problem values, clasificaciones y eventos de clasificación. | Debe decidirse si las clasificaciones históricas conservan la categoría original o apuntan al superviviente, y cómo se explica esa diferencia al usuario. |
| Risks | Scope Platform/Tenant, relación many-to-many con intervenciones y eventos propios. | Debe decidirse si selecciones históricas son snapshot o relación viva y cómo se resuelven duplicados Platform/Tenant. |

## Conclusión

El patrón visual compartido ya expone una confirmación reutilizable de merge, pero los comandos, compatibilidad, relaciones y auditoría siguen perteneciendo a cada bounded context. Implementar merge de Repairs dentro de PBI-040 obligaría a inventar decisiones sobre Platform/Tenant, historia de recepción y compatibilidad Brand/Model.

Por tanto:

1. Repairs no recibe comportamiento de merge en PBI-040.
2. No existe una segunda UI comercial paralela: Lista de precios usa los primitives administrativos compartidos.
3. Un futuro discovery/PBI de Repairs deberá resolver las decisiones anteriores antes de reutilizar la interacción.
4. Esta conclusión no bloquea el checkpoint de PBI-040; conserva deliberadamente el alcance y ownership aprobados.
