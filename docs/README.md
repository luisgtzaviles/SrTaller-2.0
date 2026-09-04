# Documentación de SR Taller 2.0

Este índice organiza la documentación actual e histórica. La entrada operativa
obligatoria es [CONTRIBUTING.md](../CONTRIBUTING.md) y el manual end-to-end es el
[workflow canónico de desarrollo y delivery](delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md).
Los documentos `Proposed` o históricos no sustituyen la baseline materializada.
La [fotografía auditada del estado actual](CURRENT_STATE.md) separa foundation,
producto y condiciones pendientes antes de la siguiente iteración.

## Estado del documento

**Estado:** Sprint 00 `Closed`; Sprint 01 `Planned — pending PBI-027
readiness/Owner authorization`; PBI-030 `Done` candidato.
**Fase:** Identity & Context Foundation preparada con WIP operacional uno; no
existe Sprint activo ni PBI actual.
**Runtime actual:** Preview en Dokploy con Visual Slice 0, health y PostgreSQL
18.4; Staging y Production no están materializados.
**Gate actual de integración:** el CI canónico de `main` está verde en
`117ada7f70494b2cb35ed7adf78c3529dd271391`, run `33821753091`; véase
[Current Repository State](CURRENT_STATE.md#11-cicd).

## Revisión dirigida de Sprint 00

El [paquete de revisión de Sprint 00](reviews/sprint-00/README.md) conserva la
auditoría inicial, la remediación y el dictamen final:

- [Resumen ejecutivo](reviews/sprint-00/EXECUTIVE_SUMMARY.md)
- [Auditoría documental](reviews/sprint-00/DOCUMENT_AUDIT.md)
- [Secuencia de decisiones](reviews/sprint-00/DECISION_SEQUENCE.md)
- [Cuestionario para el Product Owner](reviews/sprint-00/PRODUCT_OWNER_QUESTIONNAIRE.md)
- [Matriz de preparación de ADRs](reviews/sprint-00/ADR_READINESS_MATRIX.md)
- [Candidatos de prototipo](reviews/sprint-00/PROTOTYPE_CANDIDATES.md)
- [Recomendaciones de alcance](reviews/sprint-00/SCOPE_RECOMMENDATIONS.md)
- [Evaluación de cierre](reviews/sprint-00/SPRINT_00_CLOSURE_ASSESSMENT.md)
- [Remediación de cierre](reviews/sprint-00/SPRINT_00_CLOSURE_REMEDIATION.md)
- [Cierre formal](reviews/sprint-00/SPRINT_00_CLOSURE.md)
- [Autorización limitada de R0](architecture-readiness/R0_AUTHORIZATION.md)
- [Checklist de la sesión](reviews/sprint-00/REVIEW_CHECKLIST.md)

## Producto

- [Visión](product/PRODUCT_VISION.md)
- [Principios](product/PRODUCT_PRINCIPLES.md)
- [Alcance](product/PRODUCT_SCOPE.md)
- [MVP Operating Roadmap](product/MVP_OPERATING_ROADMAP.md)
- [Fuera de alcance](product/OUT_OF_SCOPE.md)
- [Actores y personas](product/ACTORS_AND_PERSONAS.md)
- [Glosario de dominio](product/DOMAIN_GLOSSARY.md)
- [Mapa de módulos](product/MODULE_MAP.md)
- [Preguntas abiertas](product/OPEN_QUESTIONS.md)
- [Lecciones de SR Taller anterior](product/LEGACY_SR_TALLER_LESSONS.md)

## Diseño de producto

- [Design System & Application Shell V1](design-system/DESIGN_SYSTEM_AND_APPLICATION_SHELL_V1.md)
- [PBI-030 — UI Foundation y Application Shell V1](backlog/pbis/PBI-030.md)
- [PBI-030 — Readiness Review](design-system/PBI_030_READINESS_REVIEW.md)
- [PBI-030 — Acuerdo técnico de estimación](design-system/PBI_030_ESTIMATION_PROPOSAL.md)
- [PBI-030 — Evidencia de implementación](quality/evidence/pbi-030/README.md)
- [PBI-030 — Revisión independiente](quality/evidence/pbi-030/INDEPENDENT_REVIEW.md)
- [PBI-030 — Auditoría final de cierre](quality/evidence/pbi-030/FINAL_CLOSURE_AUDIT.md)

La dirección visual V1 y la implementación fueron autorizadas. PBI-030 tiene
estimación `XL — agreed`, está integrado en `main` y tiene Owner Acceptance.
El riesgo AT/cross-browser residual fue aceptado como LOW; no afirma
certificación. Este candidato registra `Done`; deploy y `Released` siguen
separados.

## Dominio operativo

- [Índice y ruta de revisión](domain/README.md)
- [Estado del descubrimiento](domain/DOMAIN_DISCOVERY_STATUS.md)
- [Lenguaje ubicuo preliminar](domain/UBIQUITOUS_LANGUAGE.md)
- [Flujo central](domain/CORE_WORKFLOW.md)
- [Entrevista para el Product Owner](domain/PRODUCT_OWNER_INTERVIEW.md)
- [Reglas e invariantes candidatas](domain/BUSINESS_RULES.md)
- [Máquinas de estado](domain/STATE_MACHINES.md)
- [Eventos de dominio](domain/DOMAIN_EVENTS.md)
- [Contextos delimitados candidatos](domain/BOUNDED_CONTEXT_CANDIDATES.md)
- [Taller de Event Storming](domain/EVENT_STORMING_WORKSHOP.md)
- [Línea temporal del dominio](domain/DOMAIN_TIMELINE.md)
- [Modelo de dinero](domain/MONEY_MODEL.md)
- [Dominio de inventario](domain/INVENTORY_DOMAIN.md)
- [Matriz candidata de ownership](domain/OWNERSHIP_MATRIX.md)
- [Decisiones terminológicas](domain/DOMAIN_GLOSSARY_DECISIONS.md)
- [Trazabilidad del dominio](domain/TRACEABILITY.md)

## Arquitectura

- [Preparación arquitectónica del MVP de Reparaciones](architecture-readiness/repair-mvp/README.md)
- [Cierre y priorización de bloqueantes arquitectónicos](architecture-readiness/blocker-closure/README.md)
- [Baseline técnica de DEC-004](architecture-readiness/blocker-closure/DEC-004_BASELINE_TECNICA.md)
- [Contexto del sistema](architecture/SYSTEM_CONTEXT.md)
- [Arquitectura objetivo](architecture/TARGET_ARCHITECTURE.md)
- [Arquitectura de aplicaciones](architecture/APPLICATION_ARCHITECTURE.md)
- [Modelo multitenant](architecture/MULTITENANCY_MODEL.md)
- [Identidad, acceso y permisos](architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md)
- [Sucursales y dispositivos](architecture/BRANCH_AND_DEVICE_MODEL.md)
- [Arquitectura de datos](architecture/DATA_ARCHITECTURE.md)
- [Tiempo real y mensajería](architecture/REALTIME_AND_MESSAGING.md)
- [Integraciones](architecture/INTEGRATION_ARCHITECTURE.md)
- [Línea base de seguridad](architecture/SECURITY_BASELINE.md)
- [Observabilidad](architecture/OBSERVABILITY_STRATEGY.md)
- [Despliegue](architecture/DEPLOYMENT_STRATEGY.md)

## Decisiones

- [Registro y workflow de ADRs](decisions/README.md)
- [Plantilla de ADR](decisions/ADR_TEMPLATE.md)
- [ADR-001 — TypeScript y Node.js 24.x (Accepted)](decisions/proposed/ADR-001-typescript-as-primary-language.md)
- [ADR-002 — Monolito modular orientado al dominio (Accepted)](decisions/proposed/ADR-002-modular-monolith-first.md)
- [ADR-003 — PostgreSQL como motor primario (Accepted)](decisions/proposed/ADR-003-postgresql-primary-database.md)
- [ADR-004 — Multitenancy en esquema compartido (Accepted)](decisions/proposed/ADR-004-shared-schema-multitenancy.md)
- [ADR-005 — NestJS](decisions/proposed/ADR-005-nestjs-backend.md)
- [ADR-006 — Next.js](decisions/proposed/ADR-006-nextjs-web-clients.md)
- [ADR-007 — Despliegues en contenedores](decisions/proposed/ADR-007-containerized-deployments.md)
- [ADR-008 — Subdominios wildcard](decisions/proposed/ADR-008-wildcard-subdomain-routing.md)
- [ADR-009 — Repositorio único evolutivo y workspaces bajo demanda (Accepted)](decisions/proposed/ADR-009-monorepo-strategy.md)
- [ADR-010 — Contexto operativo por estación vinculada (Accepted)](decisions/proposed/ADR-010-station-bound-operational-context.md)
- [ADR-011 — Identidad, autenticación por PIN y sesión operativa (Accepted)](decisions/proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md)
- [ADR-012 — Roles de tenant, capacidades y autorización contextual (Accepted)](decisions/proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md)
- [ADR-013 — Acciones sensibles y autorización reforzada (Accepted)](decisions/proposed/ADR-013-sensitive-actions-and-reinforced-authorization.md)

## Entrega

- [Workflow canónico de desarrollo, delivery y operación](delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md)
- [Desarrollo local](delivery/LOCAL_DEVELOPMENT.md)
- [Workflow de desarrollo](delivery/DEVELOPMENT_WORKFLOW.md)
- [Política de ramas](delivery/BRANCH_POLICY.md)
- [Definition of Ready](delivery/DEFINITION_OF_READY.md)
- [Definition of Done](delivery/DEFINITION_OF_DONE.md)
- [Plantilla mínima de cambio técnico](delivery/TECHNICAL_CHANGE_TEMPLATE.md)
- [Plantilla de manifest de evidencia](delivery/EVIDENCE_MANIFEST_TEMPLATE.json)
- [Schema de manifest de evidencia](delivery/evidence-manifest.schema.json)
- [Plantilla de PBI](delivery/PBI_TEMPLATE.md)
- [Plantilla de bug](delivery/BUG_TEMPLATE.md)
- [Plantilla de tarea técnica](delivery/TECHNICAL_TASK_TEMPLATE.md)
- [Plantilla de sprint](delivery/SPRINT_TEMPLATE.md)
- [Proceso de release](delivery/RELEASE_PROCESS.md)
- [Estrategia de versionado](delivery/VERSIONING_STRATEGY.md)
- [Ambientes](delivery/ENVIRONMENTS.md)
- [Modelo de trazabilidad](delivery/TRACEABILITY_MODEL.md)

## Backlog y sprints

- [Guía del backlog](backlog/README.md)
- [Epics](backlog/EPICS.md)
- [Product backlog](backlog/PRODUCT_BACKLOG.md)
- [Priorización](backlog/PRIORITIZATION_MODEL.md)
- [Dependencias](backlog/DEPENDENCY_MAP.md)
- [Plan histórico de ejecución H1 para R0](backlog/R0_H1_EXECUTION_PLAN.md)
- [Índice de PBIs](backlog/pbis/README.md)
- [Guía de sprints](sprints/README.md)
- [Objetivo de SPRINT-00](sprints/sprint-00/SPRINT_GOAL.md)
- [Backlog de SPRINT-00](sprints/sprint-00/SPRINT_BACKLOG.md)
- [Riesgos y bloqueos](sprints/sprint-00/RISKS_AND_BLOCKERS.md)
- [Review](sprints/sprint-00/REVIEW.md)
- [Retrospectiva](sprints/sprint-00/RETROSPECTIVE.md)
- [Objetivo de SPRINT-01](sprints/sprint-01/SPRINT_GOAL.md)
- [Backlog de SPRINT-01](sprints/sprint-01/SPRINT_BACKLOG.md)

Los archivos individuales PBI-001 a PBI-036 se encuentran enlazados desde el
[índice de PBIs](backlog/pbis/README.md). PBI-021/PBI-022 están `Done`;
PBI-023 está `Closed`. PBI-024 fue acotado; la rama/PR histórica sólo sirve para
recuperación selectiva. PBI-024–PBI-029 y PBI-031–PBI-036 forman la partición
aprobada de Identity & Context. PBI-030 está `Done`; `Released` permanece
separado y requiere autorización propia.

## Calidad

- [Estrategia de calidad](quality/QUALITY_STRATEGY.md)
- [Estrategia de pruebas](quality/TESTING_STRATEGY.md)
- [Pruebas de aislamiento multitenant](quality/MULTITENANT_ISOLATION_TESTING.md)
- [Pruebas de seguridad](quality/SECURITY_TESTING.md)
- [Accesibilidad](quality/ACCESSIBILITY_STRATEGY.md)
- [Plantilla de evidencia QA](quality/QA_EVIDENCE_TEMPLATE.md)

## Operaciones

- [Visión de operaciones](operations/OPERATIONS_OVERVIEW.md)
- [Backup y recuperación](operations/BACKUP_AND_RECOVERY.md)
- [Gestión de incidentes](operations/INCIDENT_MANAGEMENT.md)
- [Política de migraciones](operations/MIGRATION_POLICY.md)
- [Política de rollback](operations/ROLLBACK_POLICY.md)
- [Plantilla de runbook](operations/RUNBOOK_TEMPLATE.md)

## Ruta de lectura recomendada

Para trabajar: comenzar con [CONTRIBUTING.md](../CONTRIBUTING.md), seguir el
[estado actual auditado](CURRENT_STATE.md), el
[workflow canónico](delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md), la
[política de ramas](delivery/BRANCH_POLICY.md), la
[estrategia de despliegue](architecture/DEPLOYMENT_STRATEGY.md) y
[ambientes](delivery/ENVIRONMENTS.md). Para producto, continuar con
[visión](product/PRODUCT_VISION.md), [alcance](product/PRODUCT_SCOPE.md),
[Design System V1](design-system/DESIGN_SYSTEM_AND_APPLICATION_SHELL_V1.md),
[dominio](domain/README.md) y [arquitectura objetivo](architecture/TARGET_ARCHITECTURE.md).
Sprint 00 y sus evidencias se leen como historia y trazabilidad, no como estado
operativo actual.

## Próxima revisión

Al agregar, retirar o renombrar cualquier documento; fecha: TBD.
