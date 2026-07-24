# Plantilla de tarea técnica

## Estado del documento

- **Estado:** Materialización mínima de `DEC063-C01`
- **Uso:** Descomponer un PBI listo en trabajo técnico verificable.
- **Regla:** Una tarea no sustituye el problema, valor ni criterios del PBI y no debe introducir decisiones arquitectónicas ocultas.

---

# TASK-### — Resultado técnico acotado

## Identificación

| Campo | Valor |
|---|---|
| ID | `TASK-###` |
| PBI padre | `PBI-###` |
| Epic | `EPIC-###` |
| Estado | `Draft` / `Ready` / `In progress` / `Review` / `Done` / `Blocked` / `Cancelled` |
| Tipo | Código / Datos / Infraestructura / Pruebas / Documentación / Investigación / Operación |
| Riesgo | Bajo / Medio / Alto; ambigüedad = Alto |
| Justificación del riesgo | TBD |
| Estimación | TBD |
| Responsable | TBD |

## Objetivo técnico

Resultado concreto que habilita el PBI. Explicar la contribución sin reformularla como solución de producto independiente.

## Contexto y restricciones

- Contexto del PBI: TBD.
- Límites de módulo: TBD.
- Restricciones de tenant/sucursal/permisos: TBD.
- Compatibilidad y datos: TBD.
- Restricciones de despliegue u operación: TBD.

## Alcance

- Cambio incluido 1.
- Cambio incluido 2.

## Fuera de alcance

- Exclusión 1.
- Exclusión 2.

## Enfoque propuesto

TBD. Señalar explícitamente si es hipótesis o propuesta. Si hay alternativas con consecuencias arquitectónicas, abrir o vincular un ADR antes de ejecutar.

## Dependencias

- `PBI-###`, `TASK-###`, `ADR-###`, ambiente o acceso: TBD.

## Riesgos y controles

| Riesgo | Control o validación | Estado |
|---|---|---|
| TBD | TBD | Abierto |

Incluir según aplique: acceso cruzado entre tenants, autorización, migración de datos, pérdida de mensajes/jobs, compatibilidad y rollback.

## Criterios de finalización

- [ ] Resultado técnico disponible y vinculado al PBI.
- [ ] Pruebas acordadas ejecutadas y con evidencia.
- [ ] Impactos de tenant, sucursal y permisos verificados cuando aplican.
- [ ] Observabilidad y manejo de errores cubiertos cuando aplican.
- [ ] Documentación/ADR/runbook actualizados.
- [ ] Revisión por pares completada.
- [ ] No quedan decisiones nuevas únicamente en el cambio técnico.
- [ ] Cumple la parte aplicable de la [Definition of Done](./DEFINITION_OF_DONE.md).
- [ ] Cumple base, tipo y riesgo de [DEC-063](../decisions/dec-063-definition-of-done/DECISION_PROPOSAL.md).
- [ ] Evidencia ligada al commit mediante el [manifest canónico](./EVIDENCE_MANIFEST_TEMPLATE.json), cuando aplica.

## Plan de verificación

- Prueba unitaria: TBD / No aplica justificado.
- Prueba de integración: TBD / No aplica justificado.
- Prueba end-to-end: TBD / No aplica justificado.
- Prueba de aislamiento multitenant: TBD / No aplica justificado.
- Verificación de seguridad/permisos: TBD / No aplica justificado.
- Verificación manual/QA: TBD / No aplica justificado.

## Rollout y rollback

- Artefacto/ambiente: TBD.
- Orden de despliegue: TBD.
- Compatibilidad hacia adelante: TBD.
- Señal de éxito: TBD.
- Señal de rollback: TBD.
- Procedimiento de rollback: TBD.

## Trazabilidad y evidencia

- ADR/decisión: TBD.
- Archivos modificados: TBD.
- Pull request: TBD.
- Pruebas: TBD.
- Evidencia QA: TBD.
- Release: TBD.

## Preguntas abiertas

- TBD.

---

## Reglas de uso de la plantilla

- No crear tareas sin PBI padre. Durante un incidente urgente, registrar la acción inmediata en el incidente/bug; cualquier investigación o corrección técnica de seguimiento debe crear un PBI y enlazar su `TASK-###` antes de cerrar el seguimiento.
- No declarar valor de negocio independiente que deba ser un PBI.
- No usar la tarea para aprobar una alternativa técnica.
- Mantener alcance suficientemente pequeño para revisar y revertir.

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** primer sprint de implementación o cambio en el [modelo de trazabilidad](./TRACEABILITY_MODEL.md).
- **Documentos relacionados:** [PBI Template](./PBI_TEMPLATE.md), [Development Workflow](./DEVELOPMENT_WORKFLOW.md), [Rollback Policy](../operations/ROLLBACK_POLICY.md).
