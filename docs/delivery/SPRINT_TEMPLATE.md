# Plantilla de sprint

## Estado del documento

- **Estado:** Propuesta
- **Uso:** Crear una carpeta `docs/sprints/sprint-##/` sin sobrescribir el historial de sprints anteriores.
- **Nota:** Fechas, duración, responsables y estimaciones permanecen `TBD` hasta aprobación.

## Archivos del sprint

La carpeta de cada sprint debe contener, como mínimo:

```text
sprint-##/
├── SPRINT_GOAL.md
├── SPRINT_BACKLOG.md
├── RISKS_AND_BLOCKERS.md
├── REVIEW.md
└── RETROSPECTIVE.md
```

Las secciones siguientes son plantillas para esos archivos.

---

## `SPRINT_GOAL.md`

```markdown
# SPRINT-## — Objetivo

## Estado del documento
- Estado: Draft
- Sprint: SPRINT-##
- Periodo: TBD
- Estado del sprint: Planned / Active / Closed / Cancelled
- PBI actual: ninguno / PBI-###
- WIP operacional: uno

## Objetivo
[Un resultado coherente, no una lista de tareas.]

## Resultado observable
- [Qué será distinto al terminar.]

## Contexto y valor
[Relación con objetivo de producto, epics y aprendizaje esperado.]

## Incluido
- TBD

## No incluido
- TBD

## Criterios de éxito y salida
- [ ] TBD

## Supuestos y restricciones
- Hecho conocido: TBD
- Hipótesis: TBD
- Restricción: TBD

## Preguntas abiertas
- TBD

## Próxima revisión
- Fecha: TBD
- Disparador: planificación, cambio material de objetivo o cierre.
```

---

## `SPRINT_BACKLOG.md`

```markdown
# SPRINT-## — Backlog

## Estado del documento
- Estado: Draft
- Corte de información: TBD

## Compromiso
| PBI | Título | Epic | Clasificación | Estado | Dependencias | Evidencia esperada |
|---|---|---|---|---|---|---|
| PBI-### | TBD | EPIC-### | Committed | Ready | TBD | TBD |

## PBI actual
- PBI: ninguno / PBI-###
- Estado: Ready / In progress / In review
- Autorización de implementación: TBD

## Siguiente seleccionado
- PBI: ninguno / PBI-###
- Estado: Ready / Ready for review / Blocked
- Implementación iniciada: NO

## Candidatos
| PBI | Motivo para ser candidato | Condición de entrada |
|---|---|---|
| PBI-### | TBD | TBD |

## Bloqueados
| PBI | Bloqueo | Impacto | Condición de salida |
|---|---|---|---|
| PBI-### | TBD | TBD | TBD |

## Requieren input de producto
| PBI | Pregunta | Impacto | Fuente de respuesta |
|---|---|---|---|
| PBI-### | TBD | TBD | TBD |

## Cambios durante el sprint
| Cambio | Razón | Impacto en objetivo | Aprobación | Evidencia |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## Preguntas abiertas
- TBD

## Próxima revisión
- Fecha: TBD
- Disparador: planificación, cambio de alcance o revisión del sprint.
```

`Candidate` no es compromiso. Un elemento bloqueado no se cuenta como
completado. Un Sprint `Active` tiene exactamente un PBI actual y existe como
máximo un PBI `In progress` o `In review`. La incorporación o retiro de un PBI
debe conservar razón e impacto sobre el objetivo. Seleccionar el siguiente PBI
no inicia su implementación.

---

## `RISKS_AND_BLOCKERS.md`

```markdown
# SPRINT-## — Riesgos y bloqueos

## Estado del documento
- Estado: Draft
- Última revisión: TBD

## Riesgos
| Riesgo | Probabilidad | Impacto | Señal | Mitigación | Responsable | Estado |
|---|---|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD | TBD | Open |

## Bloqueos
| PBI | Bloqueo | Desde | Impacto | Condición de salida | Escalación | Estado |
|---|---|---|---|---|---|---|
| PBI-### | TBD | TBD | TBD | TBD | TBD | Open |

## Decisiones o inputs pendientes
| Elemento | Se necesita | Impacto si no llega | Fecha necesaria | Estado |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | Open |

## Preguntas abiertas
- TBD

## Próxima revisión
- Fecha: TBD
- Disparador: seguimiento del sprint o cambio de riesgo/bloqueo.
```

---

## `REVIEW.md`

```markdown
# SPRINT-## — Review

## Estado del documento
- Estado: Draft hasta realizar la review
- Fecha: TBD
- Participantes/roles: TBD

## Objetivo y resultado
- Objetivo: TBD
- Resultado: Achieved / Partially achieved / Not achieved
- Evidencia: TBD

## PBIs revisados
| PBI | Estado | Resultado mostrado | Criterios | Evidencia QA | Feedback |
|---|---|---|---|---|---|
| PBI-### | TBD | TBD | TBD | TBD | TBD |

## Trabajo no terminado
| PBI | Estado real | Razón | Siguiente decisión |
|---|---|---|---|
| PBI-### | TBD | TBD | TBD |

## Decisiones y aprendizajes
- Decisiones: sólo enlaces a registros formales TBD.
- Hipótesis validadas/refutadas: TBD.
- Nuevas preguntas o riesgos: TBD.

## Aceptación
- Product Owner: TBD
- Alcance de la aceptación: TBD
- Evidencia: TBD

## Preguntas abiertas
- TBD

## Próxima revisión
- Fecha: TBD
- Disparador: corrección de la minuta o revisión del release asociado.
```

---

## `RETROSPECTIVE.md`

```markdown
# SPRINT-## — Retrospectiva

## Estado del documento
- Estado: Draft hasta realizar la retrospectiva
- Fecha: TBD
- Tratamiento: información interna del equipo; no incluir datos sensibles.

## Señales observadas
- Funcionó y conviene conservar: TBD.
- Generó fricción: TBD.
- Sorprendió o requiere aprendizaje: TBD.

## Datos disponibles
- Flujo, calidad, bloqueos o incidentes: TBD.
- Limitaciones de los datos: TBD.

## Acciones de mejora
| Acción | Resultado esperado | Responsable | Fecha objetivo | Evidencia | Estado |
|---|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD | Open |

## Seguimiento de acciones anteriores
| Acción | Resultado | Evidencia | Decisión |
|---|---|---|---|
| TBD | TBD | TBD | TBD |

## Preguntas abiertas
- TBD

## Próxima revisión
- Fecha: TBD
- Disparador: siguiente retrospectiva o cierre de una acción.
```

## Reglas especiales para Sprint 00

- Su objetivo es fundación documental, de producto, arquitectura, calidad y entrega.
- Puede durar más o dividirse si su amplitud lo exige; no se debe fingir capacidad tradicional.
- Sus PBIs se clasifican como `Committed`, `Candidate`, `Blocked` o `Requires product input`.
- Su cierre no autoriza implementación salvo aprobación explícita del Product Owner y cumplimiento de sus criterios de salida.
- No se crean aplicaciones, dependencias, migraciones ni infraestructura durante este sprint.

## Preguntas abiertas sobre la plantilla

- ¿Qué cadencia y duración de sprint se adoptará?
- ¿Qué participantes y aprobaciones son obligatorios en review y retrospectiva?
- ¿Dónde se conservarán evidencias y minutas cuando se seleccione una herramienta?

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** cambio del workflow WIP=1, cierre de un Sprint o creación del siguiente.
- **Documentos relacionados:** [Development Workflow](./DEVELOPMENT_WORKFLOW.md), [PBI Template](./PBI_TEMPLATE.md), [Definition of Done](./DEFINITION_OF_DONE.md).
