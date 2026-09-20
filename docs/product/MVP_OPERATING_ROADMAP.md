# SR Taller 2.0 — MVP Operating Roadmap

## Estado del documento

- **Estado:** Roadmap aprobado; SPRINT-02 y SPRINT-03 `Closed`, con PBI-040 y
  PBI-041 `Done` después de integración, exact-main CI, Preview PASS y
  reconciliación de data scope.
- **Baseline Git observada:** Workflow Phase 1 integrado en `main` por
  `859825025cf1f9fa94a8b0ced5b91b95760e36a8`; CI exacta de `main`
  `34893081175`, `SUCCESS`.
- **Programa:** MVP Operating Roadmap.
- **Stage:** MVP.
- **Fase:** Pricing Catalog.
- **Checkpoint alcanzado:** PBI-040 Owner Accepted, integrado, Preview PASS y
  cierre documental exact-main PASS; `Done`, `Released: NO`.
- **Sprint activo:** SPRINT-03 — Price List Foundation está `Closed`; no existe
  otro Sprint activo ni trabajo de Sprint en curso.
- **Sprint 01:** `Closed`; cinco PBIs committed `Done`; ninguno `Released`.
- **PBI actual:** `NONE`.
- **Siguiente PBI candidato:** ninguno; PBI-042 permanece fuera de alcance.
- **Blocking gate:** no existe gate de PBI activo; Production no autorizada.
- **WIP operacional:** `0/1`.
- **Autoridad:** decisiones Owner de roadmap e Identity Foundation y el
  Identity Master Goal vigente.

## Objetivo

Llevar SR Taller desde la foundation actual hasta un MVP capaz de operar una
sucursal con contexto, identidad y trazabilidad reales; registrar clientes,
reparaciones, precios y cobros; y cerrar el ciclo físico mediante resolución,
entrega y terminación de custodia.

`Revenue Checkpoint` y `MVP Operativo Final` son gates diferentes. Registrar un
cobro no declara terminado el ciclo de una reparación.

## Workflow canónico del roadmap

```text
Roadmap
  ↓
Sprint activo
  ↓
PBI actual
  ↓
Discovery / decisiones Owner si aplican
  ↓
Autorización Owner de implementación
  ↓
Implementación
  ↓
Review
  ↓
Merge autorizado
  ↓
CI autoritativo de main GREEN
  ↓
Owner Acceptance
  ↓
Definition of Done y evidencia completas
  ↓
PBI Done
  ↓
Siguiente PBI sólo si Owner lo selecciona, no iniciado
```

La evidencia y documentación canónica viajan por defecto dentro del candidato
de integración. Un PR documental posterior es excepcional y no autoriza merge
ni implementación. La falta de protección técnica de `main` sigue exigiendo
revisión, autoridad aplicable y CI exacta.

## Invariantes

1. Existe como máximo un Sprint `Active`.
2. Existe como máximo un PBI actual. Puede ser `NONE` durante el avance
   documental entre el cierre candidato y el inicio autorizado del siguiente.
3. Existe como máximo un PBI en ejecución o cierre (`In progress` o
   `In review`) dentro del workflow operativo vigente.
4. `Selected/current` es un marcador de planificación, no un estado adicional
   del lifecycle del PBI.
5. El siguiente PBI no pasa a `In progress` por cerrar el anterior.
6. `Done` exige merge, CI de `main` sobre el SHA exacto, evidencia, DoD y Owner
   Acceptance aplicables.
7. `Done` no significa `Released`; deploy y release requieren alcance y
   autoridad propios.
8. Si falta prioridad, readiness o autoridad, el avance falla cerrado y no
   salta silenciosamente a otro PBI.

PBI-030, PBI-027, PBI-029, PBI-024, PBI-032, PBI-033, PBI-025, PBI-034 y
PBI-026/PBI-028/PBI-038 están `Done` y no están `Released`. G1–G5 están
`PASS`.

## Current execution pointer

| Campo | Valor vigente |
|---|---|
| Program | MVP Operating Roadmap |
| Stage | MVP |
| Phase | Pricing Catalog |
| Sprint | SPRINT-03 |
| Sprint status | Closed — PBI-040 Done; PBI-041 Done; WIP=0/1 |
| Current PBI | NONE |
| Next PBI candidate | NONE; PBI-042 remains out of scope |
| PBI-039 status | Done — PR #45 / `40684d7`; exact-main CI `34623060504` GREEN |
| PBI-040 status | Done — closure PR #52 / `a060494`; exact-main CI `34814070839` GREEN; Released NO |
| Blocking gate | Ninguno de PBI; data-scope gates pass bajo sus respectivas autoridades |

## Fases aprobadas

| Fase | Resultado | Gate principal |
|---|---|---|
| 1 — Identity & Context Foundation | Timezone, secretos, Station context, Users, Roles y Capabilities | G1–G2 |
| 2 — Operational Authentication | PIN, sesión, autorización y auditoría mínima | G3–G5 |
| 3 — Customers | Customer operativo mínimo branch-scoped | G6 |
| 4 — Real New Repair / Intake | Recepción atómica con actor real | G7 |
| 5 — Real Actor Retrofit | Cero actor sintético en writes productivos aprobados | G8 |
| 6 — UI Coherence / Polish | Login, Customers, Intake, Worklist y Detail coherentes | Gate visual propio |
| 7 — Pricing Catalog | Precios de referencia sin inventario | G9 parcial |
| 8 — Quote / Authorization | Cotización versionada y autorización comercial | G9 |
| 9 — Payments / Cash | Ledger de pagos y caja mínima si se aprueba | G10 |
| 10 — Repair Completion | Resolución, QC, entrega y fin de custodia | G11 |
| 11 — MVP E2E Hardening | Recorrido completo y aceptación Owner | G12 |

Stage 2 conserva Inventory, Costs, Purchases, Expenses, Margins,
Profitability y reportes dependientes de costos.

## Secuencia de Identity Foundation

La ejecución usa WIP=1, aunque la preparación documental de dependencias pueda
adelantarse sin iniciar implementación:

1. [PBI-027](../backlog/pbis/PBI-027.md) — Branch Timezone Minimum.
2. [PBI-029](../backlog/pbis/PBI-029.md) — Secrets and External Configuration.
3. [PBI-024](../backlog/pbis/PBI-024.md) — Trusted Station Runtime Context.
4. [PBI-032](../backlog/pbis/PBI-032.md) — User Directory and Lifecycle.
5. [PBI-033](../backlog/pbis/PBI-033.md) — Roles, Assignments and Capability Catalog.
6. [PBI-025](../backlog/pbis/PBI-025.md) — PIN Credential Authentication.
7. [PBI-034](../backlog/pbis/PBI-034.md) — Operational Session.
8. [PBI-026](../backlog/pbis/PBI-026.md) — Contextual Authorization.
9. [PBI-028](../backlog/pbis/PBI-028.md) — Minimum Business Audit and Correlation.
10. [PBI-043](../backlog/pbis/PBI-043.md) — Concurrent Operational Sessions
    remediation, `Done`, Preview PASS.
11. Operational Note como primera prueba integral con actor real.
12. Retrofit progresivo al resto de los writes de Repairs.

PBI-039 recorrió G6 Customer mínimo y G7 New Repair/Intake juntos, fue aceptado,
integrado, validado en Preview y cerrado por PR #45 / `40684d7` con CI exacta
`34623060504` GREEN. QA posterior detectó la fricción de una Session por
Station; ASC-001–008 y ADR-014 seleccionan PBI-043 como remediación separada.
PBI-043 cerró mediante PR #47/#48 y CI exacta `34732201476`. PBI-040 fue
reconciliado desde ese nuevo `main`, aceptado por el Owner e integrado mediante
PR #49/#50/#51. El SHA funcional `09e14c8`, su CI exacta `34809054770` y
Preview están PASS. En ese corte PBI-041 estaba Ready documentalmente pero aún
no seleccionado; la autorización Owner posterior lo llevó al checkpoint local
descrito en el estado vigente. PBI-042 no está iniciado.

El cierre documental PBI-040 PR #52 se integró después como `a060494`; su
exact-main CI `34814070839` quedó GREEN. PBI-040 es `Done`, `Released: NO`, sin
seleccionar ni iniciar PBI-041.

Workflow Phase 1 se integró después por PR #53 como `8598250`. Su exact-main
full CI `34893081175` quedó GREEN sin activar Option B ni reducir exact-main.
Ese merge de infraestructura no seleccionó PBI-041; su selección ocurrió
después mediante autoridad Owner separada.

[PBI-031](../backlog/pbis/PBI-031.md) conserva la administración completa de
Station binding y [PBI-035](../backlog/pbis/PBI-035.md) la autorización
reforzada. [PBI-036](../backlog/pbis/PBI-036.md) difiere observabilidad
extendida. Ninguno amplía silenciosamente el PBI actual.

## Gates formales

| Gate | Condición de salida |
|---|---|
| G0 ROADMAP | Roadmap y workflow aceptados |
| G1 CONTEXT | Trusted Station Context server-side y fail-closed |
| G2 IDENTITY | Users, Roles y assignments persistentes |
| G3 AUTHENTICATION | PIN y Operational Session GREEN |
| G4 AUTHORIZATION | Deny-by-default contextual GREEN |
| G5 AUDIT | Actor real y correlation GREEN |
| G6 CUSTOMERS | Customer mínimo GREEN |
| G7 INTAKE | New Repair atómica GREEN |
| G8 REPAIR ACTOR | Sin actor sintético en writes productivos aprobados |
| G9 PRICING | Catálogo, quote y autorización definidos y GREEN |
| G10 MONEY | Payment ledger y correcciones GREEN |
| G11 DELIVERY | Entrega y terminación de custodia GREEN |
| G12 MVP | E2E completo y Owner Acceptance GREEN |

## Dashboard de gates

| Gate | Estado | Evidencia o condición vigente |
|---|---|---|
| G0 ROADMAP | PASS | PR #17 merge `117ada7f70494b2cb35ed7adf78c3529dd271391`; CI `33821753091` GREEN |
| G1 CONTEXT | PASS | PBI-024 `Done`: Trusted Station Context server-side y fail-closed; cierre PR #25 y CI exacto `34044488745` GREEN. |
| G2 IDENTITY | PASS | PBI-032 `Done`; PBI-033 cierre PR #29 merge `d1a98c6d158cf53e1718a75c82f8eafbc3aafaf1` y CI exacto `34084930812` GREEN. |
| G3 AUTHENTICATION | PASS | PBI-025 y PBI-034 están `Done`; cierre PR #34 merge `54ddc251cda8ec7465b7913786c647f8d3ccbeac` y CI exacto `34153470560` GREEN. |
| G4 AUTHORIZATION | PASS | PBI-026 cierre PR #36 merge `0b39e3794a97c22d5471c0b6dfa278026f237b03`; CI exacto `34161029937` GREEN. |
| G5 AUDIT | PASS | PBI-028 PR #37/PR #38, cierre PR #39 merge `2b712fc3a3842f197324e8870011bf170846ddb8` y CI exacta `34249869167` GREEN. |
| G6–G12 | Pending | No existe evidencia material adicional para estos gates. |

## Cierre y avance documental de un PBI

Después del merge funcional, CI verde y aceptación Owner, se crea desde el
nuevo `main` una rama `ops/pbi-###-roadmap-advance`. El PR sólo debe:

- cerrar el PBI con evidencia exacta;
- reconciliar Product Backlog, Sprint Backlog, Roadmap y Current State;
- actualizar dependencias/preguntas afectadas;
- seleccionar el siguiente PBI sin iniciarlo.

La documentación canónica afectada viaja por defecto con el candidato de
integración. Una reconciliación documental posterior sólo aplica para governance
independiente, ADR/DEC o una inconsistencia histórica; nunca genera otro PR
sólo para reescribir un estado ya materializado por merge autorizado y CI
exact-main GREEN.

## Checkpoint de transición actual

[PBI-030](../backlog/pbis/PBI-030.md) y
[PBI-027](../backlog/pbis/PBI-027.md) están `Done` y no están `Released`.
PBI-029 también está `Done`: el Owner aceptó expresamente su resultado y su
riesgo `CRITICAL`, sin reducir la clasificación; el merge `41914c78724303d66136989937cf8f38e4ea8a88`
y CI `33988752597` GREEN completaron su cierre documental.

SPRINT-01 está `Closed`: PBI-032 está `Done` después de focused review PASS,
merge funcional, Owner Acceptance, cierre PR #27 y CI exacto post-cierre
`34074457695` GREEN. PBI-033 está `Done` después de candidate/CI exactos,
focused high-risk review PASS, merge funcional PR #28, Owner Acceptance y
cierre PR #29 con CI exacto post-cierre `34084930812` GREEN. G2 está `PASS`.

SPRINT-02 está `Closed`; PBI-026 está `Done`, G4 `PASS`; PBI-028 está `Done`,
G5 es `PASS`; PBI-038 está `Done` después de PR #40 merge
`5973f355a5e9dfc7ae562a688ded04e7eba8bc34` y CI exacta `34280510716` GREEN.
PBI-039 está `Done`: PR #45 mergeó el cierre como `40684d7` y CI exacta
`34623060504` quedó GREEN. PBI-043 integró PR #47 como `aab27d9`; CI candidata
`34729684465`, exact-main `34730090448` y Preview quedaron PASS. El cierre PR
#48 `5be5cd6` y CI `34732201476` lo dejan `Done`. PBI-040 fue Owner Accepted,
integrado por PR #49, remediado por PR #50/#51 y validado en Preview sobre
`09e14c8`; CI exacta `34809054770` quedó GREEN. El cierre PR #52 se integró
como `a060494` y exact-main `34814070839` quedó GREEN: PBI-040 está `Done` y
`Released: NO`. PBI-041 pasó Formal Re-Verification, PR #55/#56/#57, revisión
independiente, CI exactas y Preview sobre `9b7a83d`. PR #58 `cb1dca3` y su CI
exact-main `35544551782` materializaron `Done`; `Released: NO`. SPRINT-03 está
`Closed`, Current PBI `NONE`, WIP `0/1` y Next candidate `NONE`.
PBI-028/PBI-037 tienen evidencia integrada, full verify, PostgreSQL 18.4, OCI,
prueba visual y exact-main CI verdes. PBI-037 permanece un slice trazable y no
crea un segundo PBI actual.
PBI-025 está `Done`. Su
alcance funcional fue integrado por PR #30 como
`328bdf541be88b21a2e7dbea28f4a2a6f32f6986` y el CI exacto de `main`
`34094803024` quedó GREEN, pero el primer intento del CI candidato falló de
forma opaca en ambos legs Critical antes de pasar en rerun. Esa integración se
registra como desviación de DEC-051/DEC-063. El Owner ratificó expresamente
esa integración sólo para cerrar PBI-025; no existe waiver general. PR #31
restauró el gate reproducible, mergeó como
`a51ddcca13cfc43fccb77378643b6874dfb772da` y CI `34100056690` quedó GREEN
en attempt 1. Owner Acceptance: APPROVED. PR #32 integró el cierre como
`ccdd7e243265c0f4d19e9798b8ddfa90d97e8c9e` y CI exacto `34124746317`
quedó GREEN en attempt 1. PBI-034 completó threat model/DoR, candidate
`cdf2805344a5302844a8f7f6f042cb39fbe1515c`, CI `34149620560`, focused
Critical-risk review PASS, merge funcional PR #33
`f3e394b59ec7421e13b36ed6bfddff28e45c0dd7`, CI exacto de `main`
`34150632738` y Owner Acceptance `APPROVED`. El cierre PR #34 merge
`54ddc251cda8ec7465b7913786c647f8d3ccbeac` y CI exacto `34153470560` lo
dejan `Done`; G3 es `PASS`. PBI-026 pasó DoR/threat model, candidate CI,
focused Critical-risk review, merge funcional, exact-main CI y Owner
Acceptance y cierre PR #36 + CI exacto; está `Done` y G4 `PASS`. PBI-028 tiene
DoR PASS, scope High preservado, PR #37 integrado, PR #38 de foco integrado,
focused review PASS y Owner Acceptance. PR #39 mergeó como
`2b712fc3a3842f197324e8870011bf170846ddb8`, con CI `34249869167` GREEN:
PBI-028 está `Done` y G5 `PASS`. PBI-038 está `Done`; `Branch.timeZone`
permanece `America/Hermosillo` y el UTC storage invariant es `PASS`. Ningún
estado autoriza release o deploy.

## Próxima revisión

- **Disparador:** selección Owner explícita de un siguiente candidato.
- **Estado conservado:** PBI-040 `Done`, `Released: NO`; PBI-041 `Done
  candidate`, `Released: NO`; Production no autorizada.
- **Después:** no iniciar otro PBI automáticamente.
