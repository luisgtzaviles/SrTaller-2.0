# Product Backlog inicial

## Estado del documento

**Estado:** Reconciliado tras el cierre de Sprint 00. Las filas 1–20 conservan
su clasificación histórica y muestran el resultado vigente; PBI-021/PBI-022
son trabajos técnicos posteriores terminados; PBI-023 está autorizado y
PBI-024–PBI-029 forman la descomposición no autorizada del resto de H1.
**Prioridad:** propuesta, no aprobación final.
**Estimaciones:** TBD.
**Sprint en los PBIs:** Unassigned; la inclusión en SPRINT-00 es una propuesta de planificación.

| Orden propuesto | PBI | Tipo | Epic | Estado | Prioridad propuesta | Clasificación SPRINT-00 |
|---:|---|---|---|---|---|---|
| 1 | [PBI-001](pbis/PBI-001.md) Define product vision and principles | Discovery | EPIC-000 | Done | Alta | Committed |
| 2 | [PBI-002](pbis/PBI-002.md) Identify actors and operational contexts | Discovery | EPIC-000 | Done | Alta | Requires product input |
| 3 | [PBI-003](pbis/PBI-003.md) Define initial product scope and exclusions | Product | EPIC-000 | Done | Alta | Requires product input |
| 4 | [PBI-004](pbis/PBI-004.md) Build the initial domain glossary | Discovery | EPIC-000 | Done | Alta | Committed |
| 5 | [PBI-005](pbis/PBI-005.md) Create the preliminary module map | Architecture | EPIC-000 | Done | Alta | Committed |
| 6 | [PBI-006](pbis/PBI-006.md) Document legacy SR Taller friction and lessons | Discovery | EPIC-000 | Deferred | Alta | Committed |
| 7 | [PBI-007](pbis/PBI-007.md) Define preliminary multitenancy model | Architecture / Security | EPIC-000 | Done | Crítica | Committed |
| 8 | [PBI-008](pbis/PBI-008.md) Define identity, roles and permissions model | Product / Security | EPIC-003 | Done | Crítica | Requires product input |
| 9 | [PBI-009](pbis/PBI-009.md) Define branch and device access model | Product / Security | EPIC-004 | Done | Crítica | Requires product input |
| 10 | [PBI-010](pbis/PBI-010.md) Define target application architecture | Architecture | EPIC-001 | Done | Alta | Committed |
| 11 | [PBI-011](pbis/PBI-011.md) Evaluate database strategy | Architecture | EPIC-001 | Done | Alta | Candidate |
| 12 | [PBI-012](pbis/PBI-012.md) Evaluate backend framework and API strategy | Architecture / Technical foundation | EPIC-001 | Done | Alta | Candidate |
| 13 | [PBI-013](pbis/PBI-013.md) Evaluate web frontend and design system strategy | Product / Architecture | EPIC-001 | Deferred | Media | Blocked |
| 14 | [PBI-014](pbis/PBI-014.md) Define realtime and messaging architecture | Architecture | EPIC-008 | Deferred | Alta | Candidate |
| 15 | [PBI-015](pbis/PBI-015.md) Define environment and deployment strategy | Operations / Technical foundation | EPIC-001 | Done | Alta | Candidate |
| 16 | [PBI-016](pbis/PBI-016.md) Define documentation and ADR workflow | Technical foundation | EPIC-000 | Done | Alta | Committed |
| 17 | [PBI-017](pbis/PBI-017.md) Define testing and tenant-isolation strategy | Quality / Security | EPIC-001 | Superseded por DEC-051 | Crítica | Committed |
| 18 | [PBI-018](pbis/PBI-018.md) Define security baseline | Security | EPIC-001 | Deferred | Crítica | Committed |
| 19 | [PBI-019](pbis/PBI-019.md) Define observability baseline | Operations / Quality | EPIC-001 | Deferred | Alta | Committed |
| 20 | [PBI-020](pbis/PBI-020.md) Consolidate open questions and decision gates | Discovery / Product | EPIC-000 | Deferred como registro vivo | Crítica | Requires product input |
| 21 | [PBI-021](pbis/PBI-021.md) Materialize and verify the DEC-004 toolchain contract | Technical foundation / Quality / Operations / Security | EPIC-001 | Done | Alta | Unassigned |
| 22 | [PBI-022](pbis/PBI-022.md) Materialize DEC-005 modular structure and local enforcement | Technical foundation / Architecture / Quality | EPIC-001 | Done | Alta | Unassigned |
| 23 | [PBI-023](pbis/PBI-023.md) Establish tenant-scoped persistence and migration foundation | Persistence / Security / Quality | EPIC-001 | Ready / Authorized to start; no iniciado | Crítica | Unassigned |
| 24 | [PBI-024](pbis/PBI-024.md) Apply trusted tenant, branch and station context | Architecture / Security | EPIC-001 | Draft | Crítica | Unassigned |
| 25 | [PBI-025](pbis/PBI-025.md) Implement tenant-user PIN authentication and operational session | Identity / Security | EPIC-003 | Blocked | Crítica | Unassigned |
| 26 | [PBI-026](pbis/PBI-026.md) Implement contextual capabilities and reinforced authorization | Authorization / Security | EPIC-003 | Draft | Crítica | Unassigned |
| 27 | [PBI-027](pbis/PBI-027.md) Define and apply the R0 temporal model | Architecture / Product | EPIC-001 | Blocked | Alta | Unassigned |
| 28 | [PBI-028](pbis/PBI-028.md) Implement safe logging, business audit and observability baseline | Operations / Security / Quality | EPIC-001 | Draft | Alta | Unassigned |
| 29 | [PBI-029](pbis/PBI-029.md) Govern R0 secrets and external configuration | Security / Operations | EPIC-001 | Draft | Crítica | Unassigned |

## Interpretación

- `Crítica` indica riesgo/gate, no una promesa de ejecución inmediata.
- La clasificación de SPRINT-00 distribuye revisión; no afirma que veinte PBIs quepan en un sprint tradicional.
- PBI-001–PBI-020 conservan su clasificación histórica; el resultado vigente
  se sustenta en el [review](../sprints/sprint-00/REVIEW.md) y no reescribe el
  compromiso original.
- PBI-021/PBI-022 no se incorporan retroactivamente a Sprint 00: ambos están
  `Done`, pero su cierre no cierra el sprint.
- PBI-023–PBI-029 son propuesta H1 sin sprint. Sólo PBI-023 satisface
  documentalmente DoR y permanece sujeto a revisión final/autorización.
- Un ítem bloqueado conserva visible la condición de desbloqueo.
- El orden final requiere aprobación del Product Owner conforme al [modelo de priorización](PRIORITIZATION_MODEL.md).

## Próxima revisión

Revisión final independiente de Sprint 00 y DoR de PBI-023.
