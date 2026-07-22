# DEC-004 — Baseline técnica de plataforma

## Estado

- **Estado de DEC-004:** Abierta.
- **Fecha de actualización:** 2026-07-21.
- **Autoridad de esta actualización:** Arquitectura + Ingeniería.
- **Revisión obligatoria aplicada a persistencia:** Seguridad + Operaciones.
- **Efecto:** Registra componentes aceptados de la plataforma; no autoriza implementación.

## Componentes aceptados

| Componente | Decisión autoritativa | Baseline vigente |
| --- | --- | --- |
| Lenguaje | [ADR-001](../../decisions/proposed/ADR-001-typescript-as-primary-language.md) | TypeScript |
| Runtime inicial | [ADR-001](../../decisions/proposed/ADR-001-typescript-as-primary-language.md) | Node.js 24.x |
| Motor transaccional primario | [ADR-003](../../decisions/proposed/ADR-003-postgresql-primary-database.md) | PostgreSQL 18.x |
| Versión efectiva inicial de PostgreSQL | [ADR-003](../../decisions/proposed/ADR-003-postgresql-primary-database.md) | PostgreSQL 18.4 |
| Forma de aplicación | [ADR-002](../../decisions/proposed/ADR-002-modular-monolith-first.md) | Monolito modular inicial |
| Topología multitenant | [ADR-004](../../decisions/proposed/ADR-004-shared-schema-multitenancy.md) | Una base física y un esquema lógico compartidos |

La versión minor efectiva de PostgreSQL se mantiene mediante mantenimiento normal conforme a ADR-003. Cambiar el minor no reabre el ADR cuando conserva la major y supera sus validaciones. PostgreSQL 19 beta y cualquier prerelease están excluidos. PostgreSQL 17 requiere una excepción temporal por incompatibilidad demostrada.

## Componentes pendientes

| Componente | Estado |
| --- | --- |
| Framework/backend | ADR-005 `Proposed` |
| Estrategia de repositorio | ADR-009 `Proposed` |
| ORM, query builder, driver e implementación de repositorios | `DEC-049` abierta |
| Librería y ejecución de migraciones | `DEC-050` abierta |
| Proveedor, región y modalidad de PostgreSQL | Pendiente |
| Pooler externo | Pendiente |
| Extensiones PostgreSQL | Ninguna aceptada |
| RLS | Pendiente de spike; defensa adicional opcional, no obligatoria para R0 |
| Alta disponibilidad, réplicas, particionamiento y backups concretos | Pendientes |

## Estado del gate

Aceptar ADR-003 cierra la selección del motor, pero no cierra `DEC-004`. El gate continúa pendiente de ADR-005 y ADR-009, además de las restricciones y decisiones H0 aplicables.

El primer cambio ejecutable de R0 permanece bloqueado. Esta baseline no autoriza código, scaffolding, configuración, infraestructura, SQL ni migraciones.

## Política de actualización

- Arquitectura + Ingeniería mantienen la major y deciden cualquier cambio de major.
- Ingeniería + Operaciones actualizan el minor efectivo con las validaciones de ADR-003.
- Seguridad participa obligatoriamente ante vulnerabilidades y revisa cambios de major.
- Producto participa si proveedor o baseline altera alcance, coste, mercado, región, residencia o compromisos comerciales.

## Trazabilidad

- [Registro oficial de ADRs](../../decisions/README.md)
- [Inventario de bloqueantes](INVENTARIO_DE_BLOQUEANTES.md)
- [Plan de cierre](PLAN_DE_CIERRE.md)
- [Secuencia de decisiones](SECUENCIA_DE_DECISIONES.md)
- [Criterios de salida de R0](CRITERIOS_DE_SALIDA_DE_R0.md)
