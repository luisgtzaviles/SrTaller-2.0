# Plantilla de Product Backlog Item

## Uso de la plantilla

- **Estado de la plantilla:** Propuesta
- **Uso:** Copiar exclusivamente el bloque entre los dos separadores horizontales para crear `docs/backlog/pbis/PBI-###-titulo-breve.md`; las notas de la plantilla quedan en `docs/delivery`.
- **Nota:** Los valores de ejemplo son marcadores; no representan compromisos ni decisiones.

---

# PBI-### — Título orientado al resultado

## Estado del documento

- **Estado:** Draft.
- **Naturaleza:** PBI pendiente de refinamiento y aprobación.
- **Hechos, hipótesis y decisiones pendientes:** indicarlos explícitamente en las secciones aplicables.

## Identificación

| Campo | Valor |
|---|---|
| ID | `PBI-###` |
| Epic | `EPIC-###` |
| Tipo | `Discovery` / `Architecture` / `Product` / `Technical foundation` / `Security` / `Quality` / `Operations` |
| Estado | `Draft` / `Ready for review` / `Ready` / `In progress` / `In review` / `Done` / `Blocked` / `Deferred` / `Cancelled` |
| Prioridad | TBD |
| Estimación | TBD |
| Sprint | `Unassigned` o `SPRINT-##` |
| Clasificación de sprint | `Unassigned` / `Committed` / `Candidate` / `Blocked` / `Requires product input` |
| Responsable | TBD |

## Problema

¿Qué necesidad, fricción, riesgo o incertidumbre existe? Indicar quién la experimenta y qué evidencia la sustenta. Separar hechos de hipótesis.

## Valor esperado

¿Qué resultado de producto, aprendizaje o reducción de riesgo se espera? Evitar describir sólo la solución.

## Alcance

- Resultado incluido 1.
- Resultado incluido 2.

## Fuera de alcance

- Exclusión explícita 1.
- Exclusión explícita 2.

## Actores y escenarios

- **Actor:** TBD.
- **Contexto:** tenant/sucursal/dispositivo/canal TBD.
- **Escenario principal:** TBD.
- **Casos límite relevantes:** TBD.

## Criterios de aceptación

- [ ] Criterio observable y verificable 1.
- [ ] Criterio observable y verificable 2.
- [ ] Comportamiento ante error o denegación definido cuando aplica.
- [ ] Evidencia esperada disponible.

Cuando ayude a eliminar ambigüedad:

```text
Dado [precondición]
Cuando [acción o evento]
Entonces [resultado observable]
```

## Análisis transversal

| Área | Impacto | Resultado o pregunta |
|---|---|---|
| Tenant e aislamiento | `Sí` / `No` / `Por determinar` | TBD |
| Sucursal | `Sí` / `No` / `Por determinar` | TBD |
| Identidad, roles y permisos | `Sí` / `No` / `Por determinar` | TBD |
| Datos, retención o migración | `Sí` / `No` / `Por determinar` | TBD |
| Seguridad y privacidad | `Sí` / `No` / `Por determinar` | TBD |
| Auditoría | `Sí` / `No` / `Por determinar` | TBD |
| UI, responsive y accesibilidad | `Sí` / `No` / `Por determinar` | TBD |
| Realtime, jobs o caché | `Sí` / `No` / `Por determinar` | TBD |
| Integraciones | `Sí` / `No` / `Por determinar` | TBD |
| Observabilidad y soporte | `Sí` / `No` / `Por determinar` | TBD |

Cada `No` relevante debe justificarse; `Por determinar` puede impedir Ready si afecta la solución o sus criterios.

## Dependencias

- PBI/ADR/sistema/persona: TBD.
- Condición de disponibilidad: TBD.

## Riesgos

| Riesgo | Impacto | Mitigación o experimento | Estado |
|---|---|---|---|
| TBD | TBD | TBD | Abierto |

## Preguntas abiertas

| Pregunta | Bloqueante | Quién debe responder | Estado |
|---|---|---|---|
| TBD | `Sí` / `No` | TBD | Abierta |

## Evidencia esperada

- Documento o demostración: TBD.
- Pruebas automáticas/manuales: TBD.
- Evidencia QA: TBD.
- Observabilidad o validación operativa: TBD.

## Trazabilidad

- **Objetivo de producto:** TBD.
- **Epic:** `EPIC-###`; enlazar con la ruta `../EPICS.md` desde el PBI generado.
- **Documentación relacionada:** TBD.
- **Decisión arquitectónica relacionada:** `ADR-###` / Ninguna identificada.
- **Tareas técnicas:** `TASK-###` / No aplica aún.
- **Pull request/archivos modificados:** TBD.
- **Pruebas:** TBD.
- **Evidencia QA:** TBD.
- **Release:** TBD / No aplica.

## Preparación

- **Revisión contra Definition of Ready** (ruta desde el PBI: `../../delivery/DEFINITION_OF_READY.md`): Pendiente.
- **Elementos no aplicables y justificación:** TBD.
- **Fecha de revisión:** TBD.
- **Revisores:** TBD.

## Cierre

- **Revisión contra Definition of Done** (ruta desde el PBI: `../../delivery/DEFINITION_OF_DONE.md`): Pendiente.
- **Riesgos residuales:** TBD.
- **Aprobación:** TBD.
- **Fecha de cierre:** TBD.

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** cambio de estado, refinamiento, nueva evidencia, resolución de una pregunta o gate del sprint.
- **Participantes requeridos:** TBD según impacto de producto, arquitectura, seguridad, calidad u operación.

---

## Reglas de uso de la plantilla

- Usar un ID único; no reutilizar IDs cancelados.
- Mantener `Estimación: TBD` y `Sprint: Unassigned` hasta que exista acuerdo.
- No convertir hipótesis en reglas de negocio confirmadas.
- No marcar `Ready` con preguntas bloqueantes abiertas.
- Mantener `Estado` y `Clasificación de sprint` como campos independientes; `Committed` y `Requires product input` no son estados del lifecycle.
- Al copiar, convertir las rutas indicadas dentro del bloque en enlaces Markdown relativos y validar sus destinos desde `docs/backlog/pbis/`.
- Vincular evidencia en vez de declarar “probado” sin soporte.
- Para Sprint 00, redactar criterios como resultados documentales, no implementación.

## Preguntas abiertas sobre la plantilla

- ¿Qué campos serán obligatorios en la herramienta definitiva de backlog?
- ¿Qué niveles de prioridad y estados serán aprobados?
- ¿Cómo se automatizará la validación de enlaces e IDs?

## Mantenimiento de la plantilla

- **Próxima revisión de la plantilla:** TBD.
- **Disparador:** adopción de una herramienta de backlog o primera retrospectiva que detecte campos insuficientes.
- **Documentos relacionados:** [Development Workflow](./DEVELOPMENT_WORKFLOW.md), [Traceability Model](./TRACEABILITY_MODEL.md), [QA Evidence Template](../quality/QA_EVIDENCE_TEMPLATE.md).
