# Product Backlog inicial

## Estado del documento

**Estado:** Reconciliado con el MVP Operating Roadmap aprobado. PBI-001–PBI-023
conservan su historia; PBI-024–PBI-029 fueron acotados conforme a Identity &
Context Foundation; PBI-031–PBI-036 materializan los splits aprobados. PBI-030
tiene cierre completo, Owner Acceptance aprobada y riesgo AT residual LOW
aceptado; su estado es `Done` sin declarar release. PBI-033 también está
`Done`; PBI-025 y PBI-034 también están `Done`. SPRINT-02 conserva PBI-026
como único PBI actual y WIP `1/1`.
**Prioridad:** propuesta, no aprobación final.
**Estimaciones:** PBI-023 tiene `13 SP`; PBI-024 tiene `Large`; PBI-030 tiene
`XL — agreed`, PBI-032 `Large — Owner autorizado`, PBI-033, PBI-025, PBI-034
y PBI-026 `Large` mediante T-shirt sizing; las demás permanecen TBD.
**Sprint en los PBIs:** el campo de cada fila es la autoridad; Sprint 01 está
cerrado para Identity & Context Foundation; SPRINT-02 está activo para
Operational Authentication & Authorization y los ítems restantes conservan
su clasificación explícita.

| Orden propuesto | PBI | Tipo | Epic | Estado | Prioridad propuesta | Clasificación / Sprint |
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
| 13 | [PBI-013](pbis/PBI-013.md) Evaluate web frontend and design system strategy | Product / Architecture | EPIC-001 | Deferred / visual V1 partially resolved | Media | Unassigned |
| 14 | [PBI-014](pbis/PBI-014.md) Define realtime and messaging architecture | Architecture | EPIC-008 | Deferred | Alta | Candidate |
| 15 | [PBI-015](pbis/PBI-015.md) Define environment and deployment strategy | Operations / Technical foundation | EPIC-001 | Done | Alta | Candidate |
| 16 | [PBI-016](pbis/PBI-016.md) Define documentation and ADR workflow | Technical foundation | EPIC-000 | Done | Alta | Committed |
| 17 | [PBI-017](pbis/PBI-017.md) Define testing and tenant-isolation strategy | Quality / Security | EPIC-001 | Superseded por DEC-051 | Crítica | Committed |
| 18 | [PBI-018](pbis/PBI-018.md) Define security baseline | Security | EPIC-001 | Deferred | Crítica | Committed |
| 19 | [PBI-019](pbis/PBI-019.md) Define observability baseline | Operations / Quality | EPIC-001 | Deferred | Alta | Committed |
| 20 | [PBI-020](pbis/PBI-020.md) Consolidate open questions and decision gates | Discovery / Product | EPIC-000 | Deferred como registro vivo | Crítica | Requires product input |
| 21 | [PBI-021](pbis/PBI-021.md) Materialize and verify the DEC-004 toolchain contract | Technical foundation / Quality / Operations / Security | EPIC-001 | Done | Alta | Unassigned |
| 22 | [PBI-022](pbis/PBI-022.md) Materialize DEC-005 modular structure and local enforcement | Technical foundation / Architecture / Quality | EPIC-001 | Done | Alta | Unassigned |
| 23 | [PBI-023](pbis/PBI-023.md) Establish tenant-scoped persistence and migration foundation | Persistence / Security / Quality | EPIC-001 | Closed | Crítica | Gate R0 |
| 24 | [PBI-024](pbis/PBI-024.md) Trusted Station Runtime Context | Architecture / Security | EPIC-004 | Done; Released: NO | Crítica | Sprint 01 completed |
| 25 | [PBI-025](pbis/PBI-025.md) PIN Credential Authentication | Identity / Security | EPIC-003 | Done; Released: NO | Crítica | SPRINT-02 completed |
| 26 | [PBI-026](pbis/PBI-026.md) Contextual Authorization | Authorization / Security | EPIC-003 | In progress; local integration candidate | Crítica | SPRINT-02 current; Critical / Large; review/CI pending |
| 27 | [PBI-027](pbis/PBI-027.md) Branch Timezone Minimum | Architecture / Product | EPIC-001 | Done; Released: NO | Alta | Sprint 01 completed |
| 28 | [PBI-028](pbis/PBI-028.md) Minimum Business Audit and Correlation | Operations / Security / Quality | EPIC-001 | Candidate; not started | Alta | SPRINT-02 candidate; not started |
| 29 | [PBI-029](pbis/PBI-029.md) Secrets and External Configuration Foundation | Security / Operations | EPIC-001 | Done; risk acceptance, merge, CI main, cierre documental y Owner Acceptance PASS | Crítica | Cerrado; `Released: NO` |
| 30 | [PBI-030](pbis/PBI-030.md) Materialize UI Foundation and Application Shell V1 | Product / Technical foundation / Quality | EPIC-001 | Done | Alta | Unassigned |
| 31 | [PBI-031](pbis/PBI-031.md) Station Binding Administration | Administration / Security | EPIC-004 | Draft / Deferred | Crítica | Unassigned |
| 32 | [PBI-032](pbis/PBI-032.md) User Directory and Lifecycle | Identity | EPIC-003 | Done; Released: NO | Crítica | Sprint 01 completed |
| 33 | [PBI-033](pbis/PBI-033.md) Roles, Assignments and Capability Catalog | Authorization | EPIC-003 | Done; Released: NO | Crítica | Sprint 01 completed; High / Large |
| 34 | [PBI-034](pbis/PBI-034.md) Operational Session | Identity / Security | EPIC-003 | Done; Released: NO | Crítica | SPRINT-02 completed; G3 PASS |
| 35 | [PBI-035](pbis/PBI-035.md) Reinforced Authorization | Authorization / Security | EPIC-003 | Draft / Deferred | Crítica | Unassigned |
| 36 | [PBI-036](pbis/PBI-036.md) Extended Observability | Operations / Quality | EPIC-001 | Deferred | Alta | Unassigned |

## Interpretación

- `Crítica` indica riesgo/gate, no una promesa de ejecución inmediata.
- La clasificación de SPRINT-00 distribuye revisión; no afirma que veinte PBIs quepan en un sprint tradicional.
- PBI-001–PBI-020 conservan su clasificación histórica; el resultado vigente
  se sustenta en el [review](../sprints/sprint-00/REVIEW.md) y no reescribe el
  compromiso original.
- PBI-021/PBI-022 no se incorporan retroactivamente a Sprint 00: ambos están
  `Done`, pero su cierre no cierra el sprint.
- PBI-024 reemplaza su alcance histórico por Trusted Station Runtime Context.
  La PR draft #3 es sólo fuente para recuperación selectiva; no se integra
  completa ni hereda PASS actual.
- PBI-025/PBI-026/PBI-028 fueron separados de Operational Session,
  Reinforced Authorization y Extended Observability respectivamente.
- PBI-027 está `Done` tras su cierre documental canónico; `Released` y deploy
  permanecen fuera de alcance.
- PBI-029 tiene threat model/DoR `PASS`, riesgo `CRITICAL` aceptado, merge
  funcional, CI autoritativo GREEN de `main`, Owner Acceptance, cierre
  documental integrado y CI post-cierre GREEN. Está `Done`; `Released` y deploy
  permanecen fuera de alcance.
- PBI-030 tiene implementación, revisión, Owner Acceptance y disposición de
  riesgo aprobadas; el cierre se evidencia en merge `117ada7f70494b2cb35ed7adf78c3529dd271391`
  y CI `33821753091`. `Released` permanece `NO`.
- PBI-032 tiene focused review PASS, candidato funcional
  `326a11802a4be32970d4e0634a61841b6bcb9b86`, CI candidato `34072027504`,
  merge funcional `66aebdbb45f368755107db315772654bee5399a3`, CI de `main`
  `34072709330` GREEN y Owner Acceptance condicional satisfecha. El cierre PR
  #27 merge `db6637ee6902b9b0e4a40ba39d7f203cb6889352` y CI post-cierre
  `34074457695` GREEN lo dejan `Done`; `Released: NO`.
- PBI-033 tiene focused high-risk review PASS, candidate
  `bb5a1efde19171703d0b3ce84567ff14538b32b7`, CI candidato `34081637692`,
  merge funcional PR #28 `065b859e3db64f82f033ce75ce5fb33df9b3ade1`,
  CI exacto de `main` `34082394514` y Owner Acceptance condicional satisfecha.
  El cierre PR #29 merge `d1a98c6d158cf53e1718a75c82f8eafbc3aafaf1`
  y CI post-cierre `34084930812` GREEN lo dejan `Done`; `Released: NO`.
- PBI-025 está `Done`. Su alcance funcional fue integrado por
  PR #30 como `328bdf541be88b21a2e7dbea28f4a2a6f32f6986` y CI exacto de
  `main` `34094803024` GREEN. El incidente Critical y primer rojo se
  conservan; el Owner ratificó PR #30 sólo para este cierre, sin waiver
  general. PR #31 merge `a51ddcca13cfc43fccb77378643b6874dfb772da` y CI
  `34100056690` GREEN restauraron el gate. Conserva riesgo `Critical`,
  estimación `Large`, DoR `PASS` y Owner Acceptance APPROVED. PR #32 cerró el
  PBI mediante merge `ccdd7e243265c0f4d19e9798b8ddfa90d97e8c9e` y CI
  exacto `34124746317` GREEN; `Released: NO`.
- PBI-034 está `Done`: candidate
  `cdf2805344a5302844a8f7f6f042cb39fbe1515c`, CI `34149620560`, focused
  review PASS, PR #33/merge `f3e394b59ec7421e13b36ed6bfddff28e45c0dd7`,
  exact-main CI `34150632738` y Owner Acceptance `APPROVED`; cierre PR #34
  merge `54ddc251cda8ec7465b7913786c647f8d3ccbeac` y CI post-cierre
  `34153470560` GREEN. G3 es `PASS`; `Released: NO`.
- Un ítem bloqueado conserva visible la condición de desbloqueo.
- El orden final requiere aprobación del Product Owner conforme al [modelo de priorización](PRIORITIZATION_MODEL.md).

## Próxima revisión

Completar el candidato PBI-026 y focused Critical-risk review. PBI-028
permanece candidato no iniciado y conserva DoR/autoridad propios.
