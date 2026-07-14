# Documentación de SR Taller 2.0

Este índice es la puerta de entrada a la fundación documental. Todo contenido técnico es conceptual o propuesto hasta que el mecanismo de aprobación correspondiente indique lo contrario.

## Estado del documento

**Estado:** Borrador para revisión.
**Fase:** Discovery and Architecture Foundation.
**Implementación funcional:** no iniciada.

## Revisión dirigida de Sprint 00

El [paquete de revisión de Sprint 00](reviews/sprint-00/README.md) prepara la sesión de decisión sin cambiar estados ni autorizar implementación:

- [Resumen ejecutivo](reviews/sprint-00/EXECUTIVE_SUMMARY.md)
- [Auditoría documental](reviews/sprint-00/DOCUMENT_AUDIT.md)
- [Secuencia de decisiones](reviews/sprint-00/DECISION_SEQUENCE.md)
- [Cuestionario para el Product Owner](reviews/sprint-00/PRODUCT_OWNER_QUESTIONNAIRE.md)
- [Matriz de preparación de ADRs](reviews/sprint-00/ADR_READINESS_MATRIX.md)
- [Candidatos de prototipo](reviews/sprint-00/PROTOTYPE_CANDIDATES.md)
- [Recomendaciones de alcance](reviews/sprint-00/SCOPE_RECOMMENDATIONS.md)
- [Evaluación de cierre](reviews/sprint-00/SPRINT_00_CLOSURE_ASSESSMENT.md)
- [Checklist de la sesión](reviews/sprint-00/REVIEW_CHECKLIST.md)

## Producto

- [Visión](product/PRODUCT_VISION.md)
- [Principios](product/PRODUCT_PRINCIPLES.md)
- [Alcance](product/PRODUCT_SCOPE.md)
- [Fuera de alcance](product/OUT_OF_SCOPE.md)
- [Actores y personas](product/ACTORS_AND_PERSONAS.md)
- [Glosario de dominio](product/DOMAIN_GLOSSARY.md)
- [Mapa de módulos](product/MODULE_MAP.md)
- [Preguntas abiertas](product/OPEN_QUESTIONS.md)
- [Lecciones de SR Taller anterior](product/LEGACY_SR_TALLER_LESSONS.md)

## Arquitectura

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
- [ADR-001 — TypeScript](decisions/proposed/ADR-001-typescript-as-primary-language.md)
- [ADR-002 — Monolito modular](decisions/proposed/ADR-002-modular-monolith-first.md)
- [ADR-003 — PostgreSQL](decisions/proposed/ADR-003-postgresql-primary-database.md)
- [ADR-004 — Multitenancy en esquema compartido](decisions/proposed/ADR-004-shared-schema-multitenancy.md)
- [ADR-005 — NestJS](decisions/proposed/ADR-005-nestjs-backend.md)
- [ADR-006 — Next.js](decisions/proposed/ADR-006-nextjs-web-clients.md)
- [ADR-007 — Despliegues en contenedores](decisions/proposed/ADR-007-containerized-deployments.md)
- [ADR-008 — Subdominios wildcard](decisions/proposed/ADR-008-wildcard-subdomain-routing.md)
- [ADR-009 — Monorepo](decisions/proposed/ADR-009-monorepo-strategy.md)

## Entrega

- [Workflow de desarrollo](delivery/DEVELOPMENT_WORKFLOW.md)
- [Definition of Ready](delivery/DEFINITION_OF_READY.md)
- [Definition of Done](delivery/DEFINITION_OF_DONE.md)
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
- [Índice de PBIs](backlog/pbis/README.md)
- [Guía de sprints](sprints/README.md)
- [Objetivo de SPRINT-00](sprints/sprint-00/SPRINT_GOAL.md)
- [Backlog de SPRINT-00](sprints/sprint-00/SPRINT_BACKLOG.md)
- [Riesgos y bloqueos](sprints/sprint-00/RISKS_AND_BLOCKERS.md)
- [Review](sprints/sprint-00/REVIEW.md)
- [Retrospectiva](sprints/sprint-00/RETROSPECTIVE.md)

Los archivos individuales PBI-001 a PBI-020 se encuentran enlazados desde el [índice de PBIs](backlog/pbis/README.md).

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

Comenzar con la [visión](product/PRODUCT_VISION.md), continuar con [principios](product/PRODUCT_PRINCIPLES.md), [alcance](product/PRODUCT_SCOPE.md), [arquitectura objetivo](architecture/TARGET_ARCHITECTURE.md), [preguntas abiertas](product/OPEN_QUESTIONS.md), [ADRs propuestos](decisions/README.md) y finalizar con el [Sprint 00](sprints/sprint-00/SPRINT_BACKLOG.md).

## Próxima revisión

Al agregar, retirar o renombrar cualquier documento; fecha: TBD.
