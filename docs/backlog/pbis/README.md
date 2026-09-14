# Índice de PBIs

## Estado del documento

**Estado:** Índice reconciliado con `main` `5be5cd6` y CI exacta
`34732201476`. SPRINT-02 está `Closed` y PBI-043 `Done`. SPRINT-03 está
`Active`: PBI-040 continúa Owner Review sobre la baseline reconciliada,
PBI-041 Ready/Not authorized y PBI-042 Planned/Unassigned. WIP `1/1`.
**Estimación:** PBI-023 tiene `13 SP`; PBI-030 tiene `XL — agreed`, PBI-032,
PBI-033, PBI-025, PBI-034, PBI-026 y PBI-028 tienen `Large` mediante T-shirt
sizing; PBI-041 tiene `XL — agreed` para el outcome inicial; los demás casos
conservan TBD.
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
| [PBI-024](PBI-024.md) | Trusted Station Runtime Context | Done; Released: NO |
| [PBI-025](PBI-025.md) | PIN Credential Authentication | Done; Released: NO |
| [PBI-026](PBI-026.md) | Contextual Authorization | Done; G4 PASS; Critical / Large; Released: NO |
| [PBI-027](PBI-027.md) | Branch Timezone Minimum | Done; Released: NO |
| [PBI-028](PBI-028.md) | Minimum Business Audit and Correlation | Done; G5 PASS; Released: NO |
| [PBI-029](PBI-029.md) | Secrets and External Configuration Foundation | Done; merge, CI main, cierre documental y Owner Acceptance PASS |
| [PBI-030](PBI-030.md) | Materialize UI Foundation and Application Shell V1 | Done |
| [PBI-031](PBI-031.md) | Station Binding Administration | Draft / Deferred |
| [PBI-032](PBI-032.md) | User Directory and Lifecycle | Done; Released: NO |
| [PBI-033](PBI-033.md) | Roles, Assignments and Capability Catalog | Done; Released: NO |
| [PBI-034](PBI-034.md) | Operational Session | Done; G3 PASS; Released: NO |
| [PBI-035](PBI-035.md) | Reinforced Authorization | Draft / Deferred |
| [PBI-036](PBI-036.md) | Extended Observability | Deferred |
| [PBI-037](PBI-037.md) | Users & Roles Administration Product Iteration | Integrated slice within PBI-028; no independent lifecycle |
| [PBI-038](PBI-038.md) | Timezone Foundation Integration and Hardening | Done; Released: NO; PR #40 and exact-main CI GREEN |
| [PBI-039](PBI-039.md) | Customer Minimum + New Repair Classic 2.0 | Done; PR #45 + exact-main CI `34623060504`; Released: NO |
| [PBI-040](PBI-040.md) | Catalog & Pricing Core + Fast Price Lookup | Owner Review; acceptance pending |
| [PBI-041](PBI-041.md) | Initial Bulk Catalog Composer + Versioned Supplier Intake | Ready — implementation not authorized; SPRINT-03 Candidate/Ready |
| [PBI-042](PBI-042.md) | Catalog Item Images | Planned / Unassigned |
| [PBI-043](PBI-043.md) | Concurrent Operational Sessions — Access Foundation Remediation | Done; PR #47/#48, CI y Preview PASS; Released: NO |

La vista de orden y clasificación se mantiene en [PRODUCT_BACKLOG.md](../PRODUCT_BACKLOG.md); no duplicar allí el contenido completo de cada PBI.

## Próxima revisión

PBI-040 ocupa el WIP y su siguiente gate es Owner Review/Acceptance. No iniciar
PBI-041/PBI-042 ni autorizar push, integración o deploy por inferencia.
