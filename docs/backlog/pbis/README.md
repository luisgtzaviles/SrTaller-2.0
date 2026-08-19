# Índice de PBIs de SPRINT-00

## Estado del documento

**Estado:** Índice vigente reconciliado para revisión final. PBI-001–PBI-020
conservan su historia de Sprint 00; PBI-021/PBI-022 están `Done`; PBI-023 está
`Closed`; PBI-024 está autorizado para implementación en rama con merge
bloqueado por DEC051-C02 y tiene implementación sólo en una PR draft divergente;
PBI-025–PBI-029 no están autorizados. PBI-030 está integrado en `main` y
permanece `In review`; no está desplegado ni `Done` y conserva Owner Acceptance
y evidencia AT parcial. CI de PR, CI de `main` e independent review pasan.
**Estimación:** PBI-023 tiene `13 SP`; PBI-030 tiene `XL — agreed` mediante
T-shirt sizing; los demás casos conservan TBD.
**Sprint:** PBI-001–PBI-020 permanecen en su clasificación histórica de Sprint
00. PBI-021–PBI-030 están `Unassigned`.

| PBI | Resultado documental | Estado vigente |
|---|---|---|
| [PBI-001](PBI-001.md) | Define product vision and principles | Done |
| [PBI-002](PBI-002.md) | Identify actors and operational contexts | Done |
| [PBI-003](PBI-003.md) | Define initial product scope and exclusions | Done |
| [PBI-004](PBI-004.md) | Build the initial domain glossary | Done |
| [PBI-005](PBI-005.md) | Create the preliminary module map | Done |
| [PBI-006](PBI-006.md) | Document legacy SR Taller friction and lessons | Deferred |
| [PBI-007](PBI-007.md) | Define preliminary multitenancy model | Done |
| [PBI-008](PBI-008.md) | Define identity, roles and permissions model | Done |
| [PBI-009](PBI-009.md) | Define branch and device access model | Done |
| [PBI-010](PBI-010.md) | Define target application architecture | Done |
| [PBI-011](PBI-011.md) | Evaluate database strategy | Done |
| [PBI-012](PBI-012.md) | Evaluate backend framework and API strategy | Done |
| [PBI-013](PBI-013.md) | Evaluate web frontend and design system strategy | Deferred / visual V1 partially resolved |
| [PBI-014](PBI-014.md) | Define realtime and messaging architecture | Deferred |
| [PBI-015](PBI-015.md) | Define environment and deployment strategy | Done |
| [PBI-016](PBI-016.md) | Define documentation and ADR workflow | Done |
| [PBI-017](PBI-017.md) | Define testing and tenant-isolation strategy | Superseded por DEC-051 |
| [PBI-018](PBI-018.md) | Define security baseline | Deferred |
| [PBI-019](PBI-019.md) | Define observability baseline | Deferred |
| [PBI-020](PBI-020.md) | Consolidate open questions and decision gates | Deferred como registro vivo |
| [PBI-021](PBI-021.md) | Materialize and verify the DEC-004 toolchain contract | Done |
| [PBI-022](PBI-022.md) | Materialize DEC-005 modular structure and local enforcement | Done |
| [PBI-023](PBI-023.md) | Establish tenant-scoped persistence and migration foundation | Closed |
| [PBI-024](PBI-024.md) | Apply trusted tenant, branch and station context | Implemented on divergent draft branch; not integrated / merge blocked |
| [PBI-025](PBI-025.md) | Implement tenant-user PIN authentication and operational session | Blocked |
| [PBI-026](PBI-026.md) | Implement contextual capabilities and reinforced authorization | Draft |
| [PBI-027](PBI-027.md) | Define and apply the R0 temporal model | Blocked |
| [PBI-028](PBI-028.md) | Implement safe logging, business audit and observability baseline | Draft |
| [PBI-029](PBI-029.md) | Govern R0 secrets and external configuration | Draft |
| [PBI-030](PBI-030.md) | Materialize UI Foundation and Application Shell V1 | In review — integrated in main; independent review approved; AT partial; Owner Acceptance pending |

La vista de orden y clasificación se mantiene en [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md); no duplicar allí el contenido completo de cada PBI.

## Próxima revisión

Decisión Owner sobre Preview deployment de PBI-030, evidencia/aceptación
pendientes y reconciliación de PBI-024.
