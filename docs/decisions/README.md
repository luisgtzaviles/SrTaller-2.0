# Registro de decisiones arquitectónicas

Los Architecture Decision Records (ADRs) conservan el contexto, alternativas y consecuencias de decisiones significativas. Estar en este directorio no convierte una propuesta en decisión aceptada.

## Estado del documento

**Estado:** Workflow en uso, pendiente de completar autoridades por clase de decisión.
**Decisiones aceptadas:** trece. ADR-001, ADR-003 y ADR-009 fueron aceptados el 2026-07-21 por Arquitectura + Ingeniería; ADR-002, ADR-004 y ADR-010 a ADR-013 fueron aceptados el mismo día por la autoridad registrada en cada documento; ADR-005 fue aceptado con condiciones el 2026-07-22 por Arquitectura + Ingeniería tras las revisiones de Seguridad, Operaciones y Calidad; ADR-007 fue aceptado el 2026-08-18, ADR-014 el 2026-09-12 y ADR-015 el 2026-09-20 por el Product Owner.
**Decisiones propuestas:** dos. ADR-006 y ADR-008 conservan estado `Proposed`.

## Estados permitidos

- `Proposed`: alternativa documentada, pendiente de evaluación y aprobación.
- `Accepted`: aprobada por la autoridad registrada en el ADR.
- `Rejected`: evaluada y descartada, conservando razones.
- `Superseded`: reemplazada por otro ADR enlazado.
- `Deprecated`: ya no debe guiar trabajo nuevo.

## Flujo propuesto

1. Identificar la decisión desde un PBI o riesgo.
2. Copiar [ADR_TEMPLATE.md](ADR_TEMPLATE.md) con el siguiente ID `ADR-###`.
3. Documentar fuerzas, alternativas, trade-offs, riesgos y criterios para reconsiderar.
4. Guardar como `Proposed`; obtener revisión de producto, arquitectura, seguridad u operaciones según impacto.
5. Registrar explícitamente quién aprobó y cuándo antes de cambiar a `Accepted`.
6. Enlazar epic, PBI, documentación, pull request y evidencia futuros mediante el [modelo de trazabilidad](../delivery/TRACEABILITY_MODEL.md).

## ADRs aceptados

| ADR | Tema | Estado |
|---|---|---|
| [ADR-001](proposed/ADR-001-typescript-as-primary-language.md) | TypeScript como lenguaje principal y Node.js como runtime inicial | Accepted — 2026-07-21 |
| [ADR-002](proposed/ADR-002-modular-monolith-first.md) | Monolito modular orientado al dominio como arquitectura inicial | Accepted — 2026-07-21 |
| [ADR-003](proposed/ADR-003-postgresql-primary-database.md) | PostgreSQL como motor relacional transaccional primario | Accepted — 2026-07-21 |
| [ADR-004](proposed/ADR-004-shared-schema-multitenancy.md) | Multitenancy con base y esquema compartidos | Accepted — 2026-07-21 |
| [ADR-005](proposed/ADR-005-nestjs-backend.md) | NestJS como shell técnico del backend, con Express y REST/HTTP JSON mínima | Accepted with conditions — 2026-07-22 |
| [ADR-007](proposed/ADR-007-containerized-deployments.md) | Imagen OCI versionada para el backend inicial | Accepted — OCI app-only baseline authorized — 2026-08-18 |
| [ADR-009](proposed/ADR-009-monorepo-strategy.md) | Repositorio único evolutivo y workspaces bajo demanda | Accepted — 2026-07-21 |
| [ADR-010](proposed/ADR-010-station-bound-operational-context.md) | Contexto operativo derivado de una estación vinculada | Accepted — 2026-07-21 |
| [ADR-011](proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md) | Identidad de usuario, autenticación por PIN y sesión operativa | Accepted — 2026-07-21 |
| [ADR-012](proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md) | Roles de tenant, capacidades y autorización contextual | Accepted — 2026-07-21 |
| [ADR-013](proposed/ADR-013-sensitive-actions-and-reinforced-authorization.md) | Acciones sensibles y autorización reforzada | Accepted — 2026-07-21 |
| [ADR-014](proposed/ADR-014-concurrent-operational-sessions.md) | Sesiones operativas concurrentes por estación confiable | Accepted — 2026-09-12; supersedes partially ADR-011 |
| [ADR-015](proposed/ADR-015-tenant-administrative-control-plane.md) | Tenant Administrative Control Plane and Lifecycle | Accepted — 2026-09-20 |

Las rutas históricas bajo `proposed/` se conservan para mantener una convención estable; el estado dentro de cada documento es autoritativo.

## Decisiones técnicas complementarias

Estas decisiones no alteran el conteo de ADRs:

| Decisión | Tema | Estado |
|---|---|---|
| [DEC-004](dec-004-toolchain-contract/DECISION_PROPOSAL.md) | Contrato de toolchain reproducible | Accepted — Evidence Verified / VC-024 PASS — 2026-07-24 |
| [DEC-005](dec-005-modular-monolith-organization/DECISION_PROPOSAL.md) | Organización inicial del monolito modular | Accepted — Materialized / Formally Verified — 2026-07-23 |
| [DEC-044](dec-044-error-strategy/DECISION_PROPOSAL.md) | Estrategia de errores | Accepted — 2026-07-24 — Responsable del Proyecto; DEC044-C01 a C08 vigentes |
| [DEC-049](dec-049-persistence-ownership/DECISION_PROPOSAL.md) | Repositorios y propiedad lógica de persistencia | Accepted — 2026-07-24 — Responsable del Proyecto; DEC049-C01 a C08 vigentes |
| [DEC-050](dec-050-migration-strategy/DECISION_PROPOSAL.md) | Estrategia de migraciones y versionado | Accepted with conditions — 2026-07-24 — DEC050-C01 a C10 `Pending` |
| [DEC-051](dec-051-testing-ci-strategy/DECISION_PROPOSAL.md) | Estrategia de pruebas, CI y gates ejecutables | Accepted — 2026-07-24 — DEC051-C01/C07/C09 `Satisfied`; restantes `Pending` |
| [DEC-063](dec-063-definition-of-done/DECISION_PROPOSAL.md) | Definition of Done por tipo de trabajo y riesgo | Accepted with conditions — 2026-07-24 — DEC063-C01/C03/C04 `Satisfied`; restantes `Pending` |

## Decisiones de dominio promovidas

| Registro | Tema | Estado |
|---|---|---|
| [PLD-001–008 y PLD-018](../domain/DOMAIN_DECISION_LOG.md) | Tipos, visibilidad, costo, scope, moneda, matching, publish e IA de Lista de precios | Accepted by Product Owner — 2026-09-11 |
| [Price List Architecture](../architecture/PRICE_LIST_ARCHITECTURE.md) | Frontera modular, ownership, contratos, seguridad e importación | Accepted for PBI readiness — 2026-09-11; no autoriza implementación |

## ADRs propuestos

| ADR | Tema | Estado |
|---|---|---|
| [ADR-006](proposed/ADR-006-nextjs-web-clients.md) | Next.js para clientes web | Proposed |
| [ADR-008](proposed/ADR-008-wildcard-subdomain-routing.md) | Resolución por subdominios wildcard | Proposed |

## Reglas

- Un ADR describe una decisión; no sustituye criterios de aceptación ni diseño detallado.
- Un cambio incompatible crea o reemplaza un ADR; no reescribe la historia aceptada.
- Fecha `TBD` significa que aún no hubo decisión.
- Los experimentos para resolver incertidumbre requieren PBI y autorización; estos ADRs no autorizan implementación.

## Preguntas abiertas

- ¿Qué roles tienen autoridad para aceptar cada clase de ADR?
- ¿Se exigirá un período mínimo de comentarios?
- ¿Dónde se registrará la evidencia de experimentos técnicos autorizados?

## Próxima revisión

Antes de aceptar el siguiente ADR. La prioridad y las entradas necesarias se mantienen en el [mapa de ADRs requeridos](../architecture-readiness/blocker-closure/MAPA_DE_ADRS_REQUERIDOS.md); fecha: TBD.
