# ADR-004 — Multitenancy con base y esquema compartidos

**Status: Proposed**
**Fecha:** TBD

## Estado del documento

Propuesta de aislamiento lógico pendiente de threat modeling, pruebas y evaluación de RLS.

## Contexto

La plataforma aspira a operar 1,000 o más tenants y varias sucursales por tenant. El sistema anterior dependía de filtros manuales, creando riesgo de exposición cruzada. El modelo debe reducir rutas de consulta global accidental sin hacer permanente una topología todavía no validada.

## Fuerzas de decisión

- Aislamiento como condición de seguridad.
- Coste de operación, migraciones y soporte a escala.
- Consultas y transacciones dentro de un tenant.
- Recuperación, exportación y eventual residencia de datos.

## Opciones consideradas

1. **Base y esquema compartidos con `tenant_id`:** eficiencia operativa; exige enforcement profundo.
2. **Esquema por tenant:** mayor separación lógica, migraciones y conexiones más complejas.
3. **Base por tenant:** mayor aislamiento, alto coste operativo para el objetivo de escala.
4. **Modelo híbrido:** flexibilidad futura, complejidad temprana sin segmentación comprobada.

## Decisión propuesta

Usar inicialmente una base y esquema compartidos, con `tenant_id` obligatorio en datos tenant-scoped, índices/constraints compuestos, repositorios tenant-aware y prohibición por defecto de consultas globales. Evaluar PostgreSQL RLS como defensa adicional, no como sustituto de contexto en aplicación. Las operaciones de plataforma requerirán rutas explícitas y auditadas.

## Consecuencias positivas

- Provisionamiento y migraciones uniformes.
- Uso eficiente de recursos para muchos tenants.
- Operación inicial más simple que base por tenant.

## Consecuencias negativas

- Un defecto de scoping puede tener impacto severo.
- Exportación/restauración selectiva requiere diseño adicional.
- Índices incorporarán con frecuencia el tenant, con coste de almacenamiento.

## Riesgos

- Fuga por SQL, caché, colas, rooms o archivos sin namespace; requiere controles y pruebas en cada capa.
- RLS mal configurado podría dar falsa confianza o bloquear tareas operativas.

## Criterios para reconsiderar

- Residencia de datos, contratos enterprise o escala que requieran aislamiento físico.
- Recuperación selectiva o noisy-neighbor que no puedan mitigarse de forma razonable.

## Preguntas abiertas

- ¿RLS será obligatorio y para qué tablas/roles?
- ¿Cómo se atenderán exportación, eliminación y restauración por tenant?
- ¿Qué operaciones cross-tenant necesita legítimamente la plataforma?

## Referencias

- [Modelo multitenant](../../architecture/MULTITENANCY_MODEL.md)
- [Pruebas de aislamiento](../../quality/MULTITENANT_ISOLATION_TESTING.md)
- [PBI-007](../../backlog/pbis/PBI-007.md)
- [PBI-011](../../backlog/pbis/PBI-011.md)

## Próxima revisión

Después del threat model y evaluación de RLS; fecha: TBD.
