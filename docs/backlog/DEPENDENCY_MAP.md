# Mapa de dependencias del MVP Operativo

## Estado del documento

- **Estado:** Reconciliado con el roadmap Owner aprobado.
- **Baseline:** `main` en
  `5966d2f20fcf29aedf91a841a4fe331cb9bae410`; CI `34019773228` GREEN.
- **Regla de ejecución:** WIP=1; el grafo expresa dependencia, no autorización
  ni paralelismo de implementación.

## Camino vigente

```mermaid
flowchart TD
    P30[PBI-030 UI Foundation<br/>Done] --> S1[SPRINT-01 Active<br/>WIP=1]
    S1 --> P27[PBI-027 Branch Timezone<br/>Done]
    P27 --> P29[PBI-029 Secrets / Config<br/>Done]
    P29 --> P24[PBI-024 Trusted Station Runtime Context]
    P24 --> P32[PBI-032 User Directory]
    P32 --> P33[PBI-033 Roles / Assignments / Capability Catalog]
    P33 --> P25[PBI-025 PIN Credential]
    P24 --> P25
    P29 --> P25
    P25 --> P34[PBI-034 Operational Session]
    P34 --> P26[PBI-026 Contextual Authorization]
    P33 --> P26
    P26 --> P28[PBI-028 Minimum Business Audit]
    P27 --> P28
    P29 --> P28
    P28 --> NOTE[First Real-Actor Proof<br/>Operational Note]
    NOTE --> RETRO[Repair writes actor retrofit]
    RETRO --> CUSTOMERS[Customers]
    CUSTOMERS --> INTAKE[Real New Repair / Intake]
    INTAKE --> POLISH[UI Coherence]
    POLISH --> PRICING[Pricing Catalog]
    PRICING --> QUOTE[Quote / Authorization]
    QUOTE --> MONEY[Payments / Cash]
    MONEY --> DELIVERY[Resolution / QC / Delivery / Custody End]
    DELIVERY --> MVP[MVP E2E / Owner Acceptance]
    P24 -. full administration later .-> P31[PBI-031 Station Binding Administration]
    P26 -. sensitive actions .-> P35[PBI-035 Reinforced Authorization]
    P28 -. extended signals .-> P36[PBI-036 Extended Observability]
    MVP --> STAGE2[Stage 2<br/>Inventory / Costs / Profitability]
```

## Dependencias críticas

- PBI-030 ya no bloquea técnicamente timezone: su cierre sustantivo es PASS;
  la activación de Sprint 01 depende de readiness y autorización de PBI-027.
- PBI-027 resuelve la autoridad temporal por Branch antes de auditoría y
  futuros días operativos.
- PBI-029 precede bootstrap sensible y PIN; ningún secreto se hardcodea.
- PBI-024 entrega Tenant/Branch/Station server-side y un bootstrap mínimo. La
  administración completa vive en PBI-031.
- PBI-032 crea identidad estable; PBI-033 compone roles/capabilities; PBI-025
  verifica PIN; PBI-034 mantiene sesión; PBI-026 autoriza.
- PBI-028 registra actor/contexto/correlación. Sólo entonces Operational Note
  puede probar el stack real y comenzar el retrofit de Repairs.
- PBI-035 se incorpora cuando una acción concreta necesita reautenticación o
  segundo aprobador; no bloquea capacidades ordinarias.
- PBI-036 no bloquea el MVP mientras PBI-028 entregue auditoría mínima.

## Estados de transición

- PBI-030: `Done`; `Released: NO`.
- Riesgo AT/cross-browser de PBI-030: `Bajo (LOW) — ACCEPTED RESIDUAL QUALITY RISK`.
- Sprint 01: `Active`; WIP=1.
- PBI actual: ninguno durante el cierre documental de PBI-024.
- PBI-027: `Done`; `Released: NO`.
- PBI-029: `Done`; threat model/DoR, riesgo `CRITICAL`, focused security
  review, merge, CI de `main`, Owner Acceptance, cierre documental integrado y
  CI post-cierre PASS; `Released: NO`.
- PBI-024: `Done` canónico; `Released: NO`. PBI-032 es el PBI actual en review
  candidate; PBI-033 permanece candidato ordenado y no iniciado.

## Stage 2

Inventory, Purchases, Costs, Expenses, Margins y Profitability no condicionan
el Revenue Checkpoint ni el MVP operativo inicial. Permanecen explícitamente
diferidos.

## Próxima revisión

Ante Owner merge review del cierre documental PBI-024 o si cambia una
dependencia aprobada.
