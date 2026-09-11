# SR Taller 2.0 — MVP Operating Roadmap

## Estado del documento

- **Estado:** Roadmap aprobado; SPRINT-02 activo con PBI-039 en cierre
  documental `Done candidate` después de integración y validación Preview.
- **Baseline Git observada:** `main` y `origin/main` local en
  `0d1c5760ce962d17a8292b841f5de43a8cb453a7`; CI exacta de `main`
  `34619271236`, `SUCCESS`.
- **Programa:** MVP Operating Roadmap.
- **Stage:** MVP.
- **Fase:** Operational Authentication & Authorization.
- **Checkpoint alcanzado:** Functional Slice Owner Accepted, Formal UI
  Verification, Hardening, Full Verification, re-review, integración, CI
  exacta de `main` y validación post-deploy de Preview en `PASS`.
- **Sprint activo:** SPRINT-02 — Operational Authentication & Authorization.
- **Sprint 01:** `Closed`; cinco PBIs committed `Done`; ninguno `Released`.
- **PBI actual:** `PBI-039` — `Done candidate` durante su cierre documental.
- **Siguiente PBI candidato:** `NONE`.
- **Blocking gate:** merge del PR documental de cierre y CI exacta del nuevo
  `main`; Production conserva autoridad separada.
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
PR documental de avance
  ↓
Siguiente PBI seleccionado, no iniciado
```

El avance es automático como obligación documental del workflow, no como
autorización de merge o de implementación. Mientras `DEC051-C02` permanezca
abierta, cada PR documental conserva preflight, revisión, CI y autorización
Owner explícita de merge.

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
| Phase | Operational Authentication & Authorization |
| Sprint | SPRINT-02 |
| Sprint status | Active — WIP=0/1 |
| Current PBI | PBI-039 — Done candidate; canonical closure in progress |
| Next PBI candidate | NONE |
| PBI-029 status | Done — cierre documental integrado y CI post-cierre GREEN |
| Blocking gate | Closure documentation PR merge + exact-main CI |

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
10. Operational Note como primera prueba integral con actor real.
11. Retrofit progresivo al resto de los writes de Repairs.

PBI-039 recorrió G6 Customer mínimo y G7 New Repair/Intake juntos. Su slice
funcional fue aceptado por Owner y pasó Formal UI Verification, Hardening,
Full Verification, CI y re-review. PR #42 se integró como `6c04e57…`. Dos
defectos reales descubiertos en Preview quedaron cerrados por PR #43
(`5ccc525…`) y PR #44 (`0d1c576…`); cada merge recibió CI exacta de `main`
verde y el runtime final fue validado con create/detail/reload/worklist
autenticado. El estado es `Done candidate`, WIP `0/1`; el siguiente gate es el
merge y CI de este cierre documental. No se seleccionó trabajo posterior.

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

El PR documental pasa revisión, CI y merge autorizado. Su integración
materializa el nuevo estado; no genera otro PR para cerrarse a sí mismo. El
texto preventivo pre-merge `Done candidate` se vuelve `Done` efectivo cuando
el merge autorizado y el CI de `main` sobre ese SHA quedan GREEN.

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

SPRINT-02 está `Active`; PBI-026 está `Done`, G4 `PASS`; PBI-028 está `Done`,
G5 es `PASS`; PBI-038 está `Done` después de PR #40 merge
`5973f355a5e9dfc7ae562a688ded04e7eba8bc34` y CI exacta `34280510716` GREEN.
PBI-039 está en `Done candidate`, WIP `0/1`, integrado en `main` y validado en
Preview. Este PR documental y su CI exacta de `main` materializan el `Done`
efectivo. Next candidate permanece `NONE`.
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

- **Disparador:** selección, readiness y autorización Owner de un nuevo PBI.
- **Resultado esperado si pasa:** un único PBI puede iniciar su flujo propio,
  sin inferir release o deploy.
- **Después:** no iniciar otro PBI automáticamente.
