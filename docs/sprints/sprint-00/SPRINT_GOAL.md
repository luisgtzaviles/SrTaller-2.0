# SPRINT-00 — Discovery and Architecture Foundation

## Estado del documento

- **Estado:** Formal Closure Remediation Complete / Final Review Pending.
- **Fecha de evaluación:** 2026-07-24.
- **Autoridad de Producto:** Responsable del Proyecto actuando también como Responsable de Producto.
- **Implementación funcional permitida:** no.
- **Cierre del Sprint:** pendiente de revisión final independiente.

## Objetivo

Establecer una base documental, de producto, arquitectura, calidad y entrega
antes de iniciar implementación.

## Resultado esperado

Una fuente navegable y trazable que permita revisar qué problema se resuelve,
qué sigue abierto, qué arquitectura fue aceptada, cómo se decidirá y qué
evidencia será necesaria. SPRINT-00 no exige resolver dentro de esta etapa
todos los contratos H1 de R0; sí exige hacerlos visibles, trazables y
planificables sin introducir decisiones implícitas.

## Alcance

- Visión, principios, actores, alcance, glosario, módulos y lecciones legacy.
- Modelos conceptuales de arquitectura, multitenancy, identidad, dispositivos,
  datos, realtime, seguridad, observabilidad y despliegue.
- Registro inicial de ADR-001 a ADR-009 y trazabilidad a sus decisiones
  posteriores en el [registro oficial](../../decisions/README.md).
- Epics, PBI-001 a PBI-020, workflow, calidad, operaciones y trazabilidad.
- Consolidación de preguntas, bloqueos y trabajo diferido.

## Fuera de alcance

- Funcionalidad de negocio, persistencia funcional, SQL, migraciones, endpoints,
  autenticación, PIN, sesiones o UI.
- Deploy, merge del PR #1 o autorización automática de R0.
- Aceptación automática de contratos H1 por documentarlos o agruparlos.

## Evaluación de los 15 criterios canónicos

`Met` confirma únicamente el criterio escrito. No convierte un entregable
conceptual en implementación ni cierra condiciones H1.

| # | Criterio canónico | Check | Estado | Evidencia | Remanente |
|---:|---|:---:|---|---|---|
| 1 | La visión del producto haya sido revisada. | [x] | `Met` | [Review](./REVIEW.md#resultado-por-pbi-001020) y [PBI-001](../../backlog/pbis/PBI-001.md) | Métricas cuantitativas se decidirán cuando exista evidencia de producto. |
| 2 | Los actores principales estén identificados. | [x] | `Met` | [Actores](../../product/ACTORS_AND_PERSONAS.md) y [PBI-002](../../backlog/pbis/PBI-002.md) | Variaciones operativas se validan por rebanada. |
| 3 | El mapa inicial de módulos exista. | [x] | `Met` | [Mapa de módulos](../../product/MODULE_MAP.md) y [PBI-005](../../backlog/pbis/PBI-005.md) | Los límites se aplican y prueban en R0. |
| 4 | Las preguntas críticas estén visibles. | [x] | `Met` | [Preguntas](../../product/OPEN_QUESTIONS.md), [inventario H1](../../backlog/R0_H1_EXECUTION_PLAN.md#inventario-h1) y [remediación](../../reviews/sprint-00/SPRINT_00_CLOSURE_REMEDIATION.md) | Mantener el registro vivo. |
| 5 | El modelo multitenant preliminar esté documentado. | [x] | `Met` | [Modelo](../../architecture/MULTITENANCY_MODEL.md), ADR-004 y [PBI-007](../../backlog/pbis/PBI-007.md) | Aplicación y pruebas negativas pertenecen a H1. |
| 6 | El modelo de identidad y permisos esté documentado. | [x] | `Met` | [Modelo](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md), ADR-011/012/013 y [PBI-008](../../backlog/pbis/PBI-008.md) | Mecanismos y composición por rebanada pertenecen a H1. |
| 7 | La vinculación de dispositivos esté descrita. | [x] | `Met` | [Modelo](../../architecture/BRANCH_AND_DEVICE_MODEL.md), ADR-010/011 y [PBI-009](../../backlog/pbis/PBI-009.md) | Aplicación, abuso y revocación pertenecen a H1. |
| 8 | La arquitectura objetivo preliminar exista. | [x] | `Met` | [Arquitectura objetivo](../../architecture/TARGET_ARCHITECTURE.md), DEC-005 y [PBI-010](../../backlog/pbis/PBI-010.md) | Los contratos H1 se materializan por PBIs autorizados. |
| 9 | Las alternativas principales estén registradas inicialmente en ADRs `Proposed`. | [x] | `Met` | [Registro de decisiones](../../decisions/README.md) y [matriz](../../reviews/sprint-00/ADR_READINESS_MATRIX.md) | Los estados vigentes prevalecen sobre la fotografía inicial. |
| 10 | Los ambientes estén definidos. | [x] | `Met` | [Ambientes](../../delivery/ENVIRONMENTS.md) y [PBI-015](../../backlog/pbis/PBI-015.md) | Proveedor, RTO/RPO y release se deciden antes de sus gates. |
| 11 | El flujo de trabajo esté definido. | [x] | `Met` | [Workflow](../../delivery/DEVELOPMENT_WORKFLOW.md), DoR/DoD y [PBI-016](../../backlog/pbis/PBI-016.md) | La protección de `main` sigue en DEC051-C02. |
| 12 | La estrategia de pruebas esté definida. | [x] | `Met` | DEC-051, [Testing Strategy](../../quality/TESTING_STRATEGY.md) y [PBI-017](../../backlog/pbis/PBI-017.md) | PostgreSQL real, aislamiento y demás condiciones se materializan por trigger. |
| 13 | El backlog inicial esté creado. | [x] | `Met` | [Product Backlog](../../backlog/PRODUCT_BACKLOG.md), [Sprint Backlog](./SPRINT_BACKLOG.md) y PBI-001 a PBI-020 | El backlog de R0 se refina por H1. |
| 14 | No existan decisiones críticas ocultas en conversaciones o únicamente en código. | [ ] | `Partially met` | [Auditoría](../../reviews/sprint-00/DOCUMENT_AUDIT.md), [PBI-020](../../backlog/pbis/PBI-020.md) e inventario H1 | El repositorio sólo puede atestiguar fuentes conocidas; la revisión final debe aceptar esta limitación. |
| 15 | El Product Owner haya aprobado explícitamente comenzar prototipos técnicos. | [x] | `Met` | [Decisión de Producto](./REVIEW.md#decisión-de-producto-y-b-21) | La autorización es condicional y no entra en vigor hasta cerrar Sprint 00 y superar la revisión final. |

## Resultado del Sprint Goal

- **Met:** 14.
- **Partially met:** 1.
- **Not met:** 0.
- **Not applicable:** 0.

La fundación documental está remediada, pero SPRINT-00 permanece abierto. La
revisión final independiente debe aceptar o rechazar la limitación del criterio
14 y emitir el dictamen de cierre. No se autoriza R0 en esta tarea.

## Próxima revisión

Revisión final independiente de autorización de R0 y cierre de Sprint 00,
después de verificar esta remediación y el estado `Ready` del primer PBI de R0.
