# SR Taller 2.0 — MVP Operating Roadmap

## Estado del documento

- **Estado:** Roadmap aprobado; SPRINT-02 activo con PBI-026 y límite WIP=1.
- **Baseline de la reconciliación:** `main` en
  `54ddc251cda8ec7465b7913786c647f8d3ccbeac`; CI autoritativo
  `34153470560`, `SUCCESS`.
- **Programa:** MVP Operating Roadmap.
- **Stage:** MVP.
- **Fase:** Operational Authentication & Authorization.
- **Checkpoint alcanzado:** `REPAIRS OPERATIONAL FOUNDATION CHECKPOINT REACHED`.
- **Sprint activo:** SPRINT-02 — Operational Authentication & Authorization.
- **Sprint 01:** `Closed`; cinco PBIs committed `Done`; ninguno `Released`.
- **PBI actual:** PBI-026 — Contextual Authorization; `In progress`.
- **Siguiente PBI candidato:** PBI-028 — Minimum Business Audit and
  Correlation; no iniciado.
- **Blocking gate:** candidato PBI-026 completo + focused Critical-risk review
  + CI exacto GREEN.
- **WIP operacional:** `1/1`.
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

PBI-030, PBI-027, PBI-029, PBI-024, PBI-032, PBI-033, PBI-025 y PBI-034
están `Done` y no están `Released`. G1, G2 y G3 están `PASS`.

## Current execution pointer

| Campo | Valor vigente |
|---|---|
| Program | MVP Operating Roadmap |
| Stage | MVP |
| Phase | Operational Authentication & Authorization |
| Sprint | SPRINT-02 |
| Sprint status | Active — WIP=1/1 |
| Current PBI | PBI-026 — Contextual Authorization; In progress; local integration candidate not integrated |
| Next PBI candidate | PBI-028 — Minimum Business Audit and Correlation; not started |
| PBI-029 status | Done — cierre documental integrado y CI post-cierre GREEN |
| Blocking gate | PBI-026 requiere candidate completo, focused Critical-risk review y exact-head CI GREEN |

## Fases aprobadas

| Fase | Resultado | Gate principal |
|---|---|---|
| 1 — Identity & Context Foundation | Timezone, secretos, Station context, Users, Roles y Capabilities | G1–G2 |
| 2 — Operational Authentication | PIN, sesión, autorización y auditoría mínima | G3–G5 |
| 3 — Customers | Customer mínimo tenant-scoped | G6 |
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
| G4–G12 | Pending | No existe evidencia material adicional para estos gates. |

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

SPRINT-02 está `Active`; PBI-026 es el único PBI actual y WIP es `1/1`.
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
dejan `Done`; G3 es `PASS`. PBI-026 inició con DoR/threat model PASS,
Critical/Large y Owner Start vigente. PBI-028 permanece no iniciado; ningún
estado autoriza release o deploy.

## Próxima revisión

- **Disparador:** focused Critical-risk review del candidato PBI-026.
- **Resultado esperado si pasa:** candidato exacto y CI GREEN habilitan Owner
  Review; G4 sólo cambia después de integración, aceptación y cierre canónico.
- **Si falla:** PBI-026 permanece `In progress`; PBI-028 no inicia.
