# Source-of-Truth Contract

## Estado del documento

- **Estado:** contrato operativo vigente.
- **Propósito:** asignar cada hecho operativo a una sola autoridad preferida.
- **Principio:** una regla permanente se documenta; un hecho derivable se
  consulta en su sistema de registro y no se copia manualmente como estado.
- **Alcance:** planificación, ejecución, delivery, aceptación, ambientes e
  historia técnica.

## Matriz de autoridad

| Hecho | Fuentes anteriores o auxiliares | Autoridad preferida | Duplicados que no mandan | Acción de migración |
|---|---|---|---|---|
| Prioridades de producto | Roadmap, backlog, Sprint, `CURRENT_STATE` | Roadmap para orden/estrategia; backlog/PBI para requisito e historia | Índices, checklist, snapshots | Enlazar; no copiar el puntero en documentos operativos. |
| Work Unit actual | `ACTIVE_CHECKLIST`, chat, `CURRENT_STATE` | `docs/work/ACTIVE_CHECKLIST.md`, reconciliado contra Git | Chat, handoffs antiguos | Mantener sólo objetivo, alcance y ejecución vigente. |
| Rama actual | Checklist, handoff, documentación | Git (`git branch --show-current`) | Texto copiado | Consultar Git; el checklist sólo declara la rama esperada para validar continuidad. |
| SHA actual | Checklist, PR, evidencia Markdown | Git (`git rev-parse HEAD`) | Snapshots y reportes copiados | Consultar Git. |
| Estado de PR/review/merge | PR, checklist, evidencia | GitHub | Markdown de cierre | Consultar GitHub; conservar narrativa sólo si añade una decisión no derivable. |
| Estado de CI | Actions, evidence, PBI, roadmap | GitHub Actions sobre el SHA exacto | Copias de run/SHA | Consultar CI; no exigir transcripción para cerrar. |
| SHA/artefacto desplegado | plataforma, runtime, notas | Provenance observable del ambiente y plataforma de deployment | Snapshots documentales | Consultar el ambiente. Hasta que exista manifest automático completo, declarar cualquier ausencia como límite; no adivinar. |
| Salud del ambiente | health endpoints, plataforma, reportes | Runtime (`/livez`, `/readyz`) y plataforma | Último PASS escrito | Volver a medir cuando importe. |
| Decisiones arquitectónicas | ADR/DEC, audits, PBI | ADR/DEC aceptada y contratos ejecutables aplicables | Propuestas y auditorías históricas | Mantener historia; marcar claramente propuesta/histórico. |
| Reglas permanentes de ingeniería | AGENTS, workflow, guías, tests | Contrato temático vigente más enforcement ejecutable | Handoffs y checklists | AGENTS sólo enruta; no duplica el contrato. |
| Aceptación de producto | Markdown, chat, review, QA | Evento real de review o validación de ambiente requerido por el alcance | Declaración duplicada de `Owner Acceptance` | Preservar narrativa adicional sólo para una aceptación/riesgo que no sea derivable. |
| Historia de implementación | PBIs, evidence, checklist | Git, PR, CI y release/deployment history; PBI conserva contexto de producto | `ACTIVE_CHECKLIST` histórico | No mantener historia en el checklist actual. |
| Riesgos y excepciones | PBI, checklist, ADR/DEC, evidence | Contrato/ADR/DEC o registro de riesgo aplicable; checklist mientras esté activo | Copias sin owner ni vigencia | Promover lo duradero antes del cierre; registrar aceptación excepcional sólo cuando sea necesaria. |

## Responsabilidades documentales

- **Roadmap:** dirección, orden y gates estratégicos; no refleja cada estado
  temporal de implementación.
- **Backlog/PBI:** requisito, criterios, decisiones de producto e historia; no
  es un espejo de GitHub.
- **Sprint:** timebox/capacidad opcional de planificación. No es un gate
  universal de ingeniería.
- **ACTIVE_CHECKLIST:** ejecución actual y handoff de una Work Unit. No es
  archivo histórico ni fuente de estados remotos.
- **Git/GitHub/CI:** implementación, SHA, PR, review, merge y resultados
  técnicos derivables.
- **Runtime/plataforma:** deployment efectivo, provenance y salud.
- **ADR/DEC y contratos vigentes:** decisiones y reglas permanentes.

## Migración de `CURRENT_STATE.md`

| Sección anterior | Clasificación | Destino |
|---|---|---|
| Estado del documento / baseline | `DERIVE` | Git, GitHub y runtime. |
| Resumen ejecutivo | `RETIRE` | Era una segunda narración de las fuentes especializadas. |
| Capacidades integradas | `DERIVE` | Código, tests, PBI y roadmap; no requiere inventario manual global. |
| Delta/PBI específico | `ARCHIVE` | PBI, evidencia histórica, Git y PR correspondientes. |
| Roadmap, Sprint, Current/Next y WIP | `MOVE` | Roadmap para producto; `ACTIVE_CHECKLIST` para ejecución actual. |
| Próxima acción | `MOVE` | `ACTIVE_CHECKLIST` si está autorizada; roadmap/backlog si sólo es prioridad. |
| Ruta `docs/CURRENT_STATE.md` | `KEEP TEMPORARILY` | `DEPRECATED POINTER` para compatibilidad de enlaces, sin estado propio. |

No quedó información permanente única que exigiera otro snapshot. El contenido
retirado sigue recuperable en Git.

## Evidencia mínima útil

No se crea Markdown para volver a escribir rama, SHA, PR, CI, merge o outputs
reproducibles. Sí se conserva evidencia cuando aporta información no derivable:

- observación manual de QA;
- aceptación de riesgo o excepción de seguridad;
- razón arquitectónica;
- resultado de un sistema externo que no conserva historial suficiente;
- evidencia de incidente;
- aceptación de producto que requiere narrativa durable.

Los documentos históricos siguen siendo evidencia de su momento. No son una
fuente operativa vigente salvo que un contrato actual los incorpore
explícitamente.

## Clasificación documental

| Categoría | Uso |
|---|---|
| `ACTIVE AUTHORITATIVE` | Regla, decisión o plan vigente dentro de su materia. |
| `ACTIVE OPERATIONAL` | Trabajo temporal actual, especialmente `ACTIVE_CHECKLIST`. |
| `HISTORICAL` | Hecho o análisis de una entrega pasada; útil como historia, no como política actual. |
| `ARCHIVE CANDIDATE` | Material histórico que puede moverse después sin urgencia operativa. |
| `DEPRECATED POINTER` | Ruta conservada para no romper enlaces; sólo dirige a autoridades vigentes. |

No se hace migración masiva para lograr esta clasificación. Los índices y
cabeceras deben evitar que un documento histórico contradiga silenciosamente
al workflow vigente.

## Regla de cambio

Cuando un cambio altere una regla permanente, se actualiza el contrato dueño.
Cuando altere un hecho derivable, se actualiza su sistema de registro; no una
segunda narración manual. Si una fuente autoritativa no puede responder una
pregunta necesaria, se registra el vacío como riesgo o migración pendiente en
lugar de crear otro snapshot general.
