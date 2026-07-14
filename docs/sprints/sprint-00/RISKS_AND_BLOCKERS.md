# SPRINT-00 — Riesgos y bloqueos

## Estado del documento

**Estado:** Registro inicial abierto.
**Owners y fechas objetivo:** TBD; no se asignan sin aprobación.

## Riesgos

| ID | Riesgo | Impacto potencial | Señal | Respuesta propuesta | Estado |
|---|---|---|---|---|---|
| RISK-001 | Una hipótesis multitenant se trata como control suficiente | Exposición cruzada o rediseño | Documentos dependen sólo de filtros manuales | Revisión de seguridad y múltiples capas de defensa | Open |
| RISK-002 | Falta de participación de producto/operación | Requisitos y actores no validados | PBIs `Requires product input` no avanzan | Programar revisión; mantener preguntas abiertas | Open |
| RISK-003 | Alcance amplio se interpreta como primera versión | Expansión y prioridades confusas | Capacidades `Later` entran al plan sin decisión | Aplicar scope, epics y aprobación de backlog | Open |
| RISK-004 | ADRs Proposed se tratan como Accepted | Implementación irreversible sin trade-offs aprobados | Referencias omiten status o autoridad | Gate explícito y auditoría de estados | Open |
| RISK-005 | Documentos divergen entre sí | Decisiones y criterios contradictorios | Términos/enlaces/estados no coinciden | Índices, revisión cruzada y validación automatizable futura | Open |
| RISK-006 | Complejidad legacy se migra sin justificación | Se conserva deuda y se ralentiza 2.0 | Requisitos basados sólo en paridad | Evaluar valor/datos por caso y aplicar política de migración | Open |
| RISK-007 | SPRINT-00 excede capacidad de revisión | Documentos superficiales o review tardía | Muchos candidatos activos y feedback acumulado | Dividir etapa sin relajar criterio de salida | Open |
| RISK-008 | Requisitos legales/regionales aparecen tarde | Rediseño de pagos, datos o suscripciones | Jurisdicción y retención siguen TBD | Discovery legal/producto antes de comprometer esas capacidades | Open |

Las evaluaciones de probabilidad y aceptación de riesgo permanecen TBD.

## Bloqueos

| Elemento | Condición bloqueante | Condición de salida |
|---|---|---|
| PBI-013 | Superficies web, audiencias y requisitos visuales no confirmados | Product Owner valida alcance de clientes web y necesidades |
| PBI-002/003/008/009/020 | Respuestas de producto y operación pendientes | Revisión trazable y estado actualizado de preguntas |
| Gate de prototipos | ADRs críticos no aceptados y criterio de salida incompleto | Evidencia de checklist y aprobación explícita del Product Owner |

## Escalamiento propuesto

Un bloqueo debe indicar qué decisión falta, su impacto y quién tiene autoridad (TBD). No se resuelve inventando una regla provisional silenciosa. Si el alcance puede continuar sin esa decisión, se documenta la hipótesis reversible y se mantiene el gate correspondiente.

## Próxima revisión

En cada checkpoint de SPRINT-00; fecha: TBD.
