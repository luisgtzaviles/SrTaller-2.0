# Registro de decisiones arquitectónicas

Los Architecture Decision Records (ADRs) conservan el contexto, alternativas y consecuencias de decisiones significativas. Estar en este directorio no convierte una propuesta en decisión aceptada.

## Estado del documento

**Estado:** Workflow en uso, pendiente de completar autoridades por clase de decisión.
**Decisiones aceptadas:** ocho. ADR-001 y ADR-003 fueron aceptados el 2026-07-21 por Arquitectura + Ingeniería; ADR-002, ADR-004 y ADR-010 a ADR-013 fueron aceptados el mismo día por la autoridad registrada en cada documento.
**Decisiones propuestas:** cinco. ADR-005 a ADR-009 conservan estado `Proposed`.

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
| [ADR-010](proposed/ADR-010-station-bound-operational-context.md) | Contexto operativo derivado de una estación vinculada | Accepted — 2026-07-21 |
| [ADR-011](proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md) | Identidad de usuario, autenticación por PIN y sesión operativa | Accepted — 2026-07-21 |
| [ADR-012](proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md) | Roles de tenant, capacidades y autorización contextual | Accepted — 2026-07-21 |
| [ADR-013](proposed/ADR-013-sensitive-actions-and-reinforced-authorization.md) | Acciones sensibles y autorización reforzada | Accepted — 2026-07-21 |

Las rutas históricas bajo `proposed/` se conservan para mantener una convención estable; el estado dentro de cada documento es autoritativo.

## ADRs propuestos

| ADR | Tema | Estado |
|---|---|---|
| [ADR-005](proposed/ADR-005-nestjs-backend.md) | NestJS para backend/API | Proposed |
| [ADR-006](proposed/ADR-006-nextjs-web-clients.md) | Next.js para clientes web | Proposed |
| [ADR-007](proposed/ADR-007-containerized-deployments.md) | Despliegues en contenedores | Proposed |
| [ADR-008](proposed/ADR-008-wildcard-subdomain-routing.md) | Resolución por subdominios wildcard | Proposed |
| [ADR-009](proposed/ADR-009-monorepo-strategy.md) | Estrategia monorepo | Proposed |

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
