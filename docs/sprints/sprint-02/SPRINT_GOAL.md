# SPRINT-02 — Operational Authentication & Authorization

## Estado del documento

- **Sprint:** SPRINT-02.
- **Estado:** Closed; remediación Access integrada y validada.
- **Periodo:** TBD.
- **PBI actual:** `NONE`; [PBI-043](../../backlog/pbis/PBI-043.md) está `Done`.
- **WIP:** `0/1` funcional.
- **Baseline de cierre:** `main`/`origin/main` `5be5cd6`; CI exacta `34732201476`
  `SUCCESS`.
- **Autoridad:** Master Goal Owner del 2026-09-12 autoriza implementación, PR,
  merge gobernado y Preview; no Production.

## Objetivo

Preservar autenticación, autorización contextual y atribución real mientras se
elimina la exclusividad station-wide que impide a Users distintos operar en
perfiles o dispositivos independientes de una misma Station.

La extensión no reabre PBI-034: PBI-043 remedia un supuesto operativo de su
contrato mediante [ADR-014](../../decisions/proposed/ADR-014-concurrent-operational-sessions.md).

## Secuencia comprometida

1. PBI-025 — PIN Credential Authentication — `Done`.
2. PBI-034 — Operational Session — `Done`; contrato histórico parcialmente
   sustituido por ADR-014.
3. PBI-026 — Contextual Authorization — `Done`; G4 `PASS`.
4. PBI-028 — Minimum Business Audit and Correlation — `Done`; G5 `PASS`.
5. PBI-038 — Timezone Foundation Integration and Hardening — `Done`.
6. PBI-039 — Customer Minimum + New Repair — `Done` sobre `40684d7`.
7. PBI-043 — Concurrent Operational Sessions — `Done`; COS-01…24,
   revisión, CI, merge y Preview PASS.

PBI-040 permanece congelado fuera de `main`. No ocupa WIP y no se reanuda ni se
reconcilia hasta cerrar la remediación Access mediante sus propios gates.

## Criterios de salida de la extensión

- [x] ASC-001 a ASC-008 materializadas en ADR-014 y arquitectura canónica.
- [x] PBI-043, DoR, threat model Critical y matriz COS-01…COS-24 definidos.
- [x] Ownership, persistencia, transición, rollback y revocación delimitados.
- [x] Roadmap, backlog, dependencias, workflow y Sprint reconciliados.
- [x] Owner autorizó explícitamente iniciar PBI-043.
- [x] Implementación PBI-043 supera gates locales, revisión, CI exacta y Owner
  Acceptance aplicables.
- [x] PBI-040 se reconcilia posteriormente desde el nuevo `main` sin perder su
  WIP congelado.
- [ ] Production release/deploy: NO; no autorizado.

## Próxima revisión

- **Fecha:** al cambiar una autoridad histórica del Sprint.
- **Disparador:** nueva evidencia que contradiga su cierre; PBI-040 continúa en
  SPRINT-03 mediante autoridad separada.
