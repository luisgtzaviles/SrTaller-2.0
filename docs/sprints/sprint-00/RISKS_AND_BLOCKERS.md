# SPRINT-00 — Riesgos y bloqueos

## Estado del documento

**Estado:** Registro reconciliado para revisión final (2026-07-24).
**Owners y fechas objetivo:** definidos por rol cuando existe un PBI; no se
inventan personas o fechas.

## Riesgos

| ID | Riesgo | Impacto potencial | Señal | Respuesta propuesta | Estado |
|---|---|---|---|---|---|
| RISK-001 | Una hipótesis multitenant se trata como control suficiente | Exposición cruzada o rediseño | Un PBI omite pruebas negativas | PBI-023 y H1 exigen dos tenants, fail-closed y defensa por capas | Open / H1 |
| RISK-002 | Falta de participación de producto/operación | Requisitos y actores no validados | Decisiones sin autoridad | Producto registró B-21; conservar owners por rol y gates posteriores | Mitigated for Sprint 00 / monitor |
| RISK-003 | Alcance amplio se interpreta como primera versión | Expansión y prioridades confusas | Capacidades posteriores entran a R0 | Aplicar DEC-002/062 y exclusiones de PBI-023 | Mitigated / monitor |
| RISK-004 | ADRs Proposed se tratan como Accepted | Implementación irreversible sin trade-offs aprobados | Referencias omiten estado/autoridad | Registro oficial y gates explícitos; ADR-006–008 siguen Proposed | Mitigated / monitor |
| RISK-005 | Documentos divergen entre sí | Decisiones y criterios contradictorios | Términos/enlaces/estados no coinciden | Remediación, índices vigentes y validación global de enlaces/estados | Remediation complete / final review |
| RISK-006 | Complejidad legacy se migra sin justificación | Se conserva deuda y se ralentiza 2.0 | Requisitos basados sólo en paridad | Evaluar valor/datos por caso y aplicar política de migración | Open |
| RISK-007 | SPRINT-00 excede capacidad de revisión | Documentos superficiales o review tardía | Muchos candidatos activos y feedback acumulado | PBIs diferidos y H1 descompuesto; revisión final separada | Mitigated / final review |
| RISK-008 | Requisitos legales/regionales aparecen tarde | Rediseño de pagos, datos o suscripciones | Jurisdicción y retención siguen TBD | Discovery legal/producto antes de comprometer esas capacidades | Open |

Las evaluaciones de probabilidad y aceptación de riesgo permanecen TBD.

## Bloqueos

| Elemento | Condición bloqueante | Condición de salida |
|---|---|---|
| PBI-013 | Superficies web, audiencias y requisitos visuales no confirmados | `Deferred` al gate del primer cliente web; no bloquea cierre documental |
| PBI-006/014/018/019/020 | Remanentes fuera del objetivo terminado | `Deferred` con owner por rol e hito en cada PBI |
| B-21 | Autorización condicional todavía sin efectividad | Cierre de Sprint 00, PBI R0 `Ready` y revisión final |
| PBI-023 | DoR documental debe ser confirmado independientemente | Revisión final acepta o rechaza estado `Ready` |
| H1 | 24 contratos de aplicación/prueba abiertos | Resolver por PBI y trigger; no tratarlos como implícitos |

## Escalamiento propuesto

Un bloqueo debe indicar qué decisión falta, su impacto y autoridad por rol. No
se resuelve inventando una regla provisional silenciosa. Si el alcance puede
continuar sin esa decisión, se documenta la hipótesis reversible y se mantiene
el gate correspondiente.

## Próxima revisión

En la revisión final independiente de Sprint 00.
