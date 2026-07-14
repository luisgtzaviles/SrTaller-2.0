# ADR-003 — PostgreSQL como base de datos primaria

**Status: Proposed**
**Fecha:** TBD

## Estado del documento

Propuesta pendiente de evaluación; no define tablas, esquemas ejecutables ni proveedor administrado.

## Contexto

El dominio combina relaciones, transacciones, auditoría, consultas operativas y aislamiento multitenant. Se necesita una fuente de verdad persistente compatible con índices compuestos y, potencialmente, Row-Level Security (RLS).

## Fuerzas de decisión

- Integridad relacional y transaccional.
- Controles multitenant e índices por `tenant_id`.
- Operación, backups, recuperación y observabilidad.
- Ecosistema y portabilidad entre ambientes.

## Opciones consideradas

1. **PostgreSQL:** motor relacional con capacidades maduras, incluyendo RLS a evaluar.
2. **MySQL/MariaDB:** alternativa relacional viable, con diferencias operativas y de controles.
3. **Base documental primaria:** flexibilidad de forma, mayor coste para integridad relacional de este dominio.
4. **Persistencia políglota inicial:** optimización específica, complejidad prematura.

## Decisión propuesta

Adoptar PostgreSQL como base primaria transaccional. Redis, almacenamiento compatible con S3 y otros componentes cumplirían funciones específicas y no serían fuentes alternativas de verdad para entidades transaccionales.

## Consecuencias positivas

- Constraints, transacciones e índices adecuados al modelo previsto.
- Opción de defensa adicional con RLS.
- Amplio soporte de herramientas y servicios administrados.

## Consecuencias negativas

- Requiere diseño cuidadoso de índices y mantenimiento.
- Escala y aislamiento no se obtienen automáticamente por elegir el motor.
- Algunas cargas futuras podrían necesitar almacenes especializados.

## Riesgos

- Consultas sin contexto tenant o índices inadecuados pueden afectar seguridad y rendimiento.
- Dependencia de extensiones o proveedor podría reducir portabilidad.

## Criterios para reconsiderar

- Evidencia de carga dominante incompatible con PostgreSQL.
- Requisitos regulatorios, regionales o de aislamiento no cubiertos.

## Preguntas abiertas

- ¿Qué proveedor y versiones soportadas se evaluarán?
- ¿Qué política de extensiones y connection pooling se permitirá?

## Referencias

- [Arquitectura de datos](../../architecture/DATA_ARCHITECTURE.md)
- [Modelo multitenant](../../architecture/MULTITENANCY_MODEL.md)
- [PBI-011](../../backlog/pbis/PBI-011.md)

## Próxima revisión

Al completar PBI-011; fecha: TBD.
