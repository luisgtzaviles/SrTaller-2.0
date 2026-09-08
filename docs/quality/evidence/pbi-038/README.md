# PBI-038 — Timezone Foundation Integration and Hardening Evidence

## Estado

**Integration candidate ready for Owner merge authorization.** Esta evidencia cubre el seguimiento
acotado de [PBI-027](../../../backlog/pbis/PBI-027.md); no cambia su lifecycle
`Done` ni autoriza merge, release o deploy.

## Base y contrato

- Baseline: `main` en `2b712fc3a3842f197324e8870011bf170846ddb8` al iniciar
  esta ronda.
- Owner Functional Approval: APPROVED el 2026-09-08 para la regla
  `UTC instant → Branch.timeZone presentation` y límites de calendario local
  convertidos a UTC.
- Persistencia final exigida: `America/Hermosillo`; PostgreSQL mantiene UTC.

## Evidencia en curso

| Área | Resultado |
|---|---|
| Toolchain frozen / typecheck / build | PASS — Node 24.18.0 y pnpm 11.15.1. |
| Contratos de timezone y autorización | PASS — IANA, labels, scope confiable y deny server-side. |
| DST y frontera exacta | PASS — regresión Tijuana añadida para inicio/fin DST y borde inclusivo/exclusivo. |
| PostgreSQL 18.4 Repairs | PASS — base efímera exclusiva, tenant/branch, today/week/month/from/to, Hermosillo/Cancún, inmutabilidad y frontera exacta. |
| PostgreSQL 18.4 autorización | PASS — base efímera exclusiva. |
| Full verify | PASS — `pnpm run verify` under Node 24.18.0 / pnpm 11.15.1; 624 PASS, 17 PostgreSQL material suites intentionally skipped by the general gate after isolated material execution. |
| Browser QA | PASS — admin local: Hermosillo → Cancún → Hermosillo with reload; the same Timeline instant shifted from 11:53 a.m. to 1:53 p.m.; Worklist remained functional. |
| Candidate CI | PASS — Draft [PR #40](https://github.com/luisgtzaviles/SrTaller-2.0/pull/40), candidate `d199873658bbdf067767a75f2407973f54c73309`; run-1 `102221467690`, run-2 `102221467415` and comparison `102226350998` SUCCESS in workflow `34273725808`. |
| Focused review | PASS — exact candidate reviewed: 0 BLOCKER / 0 HIGH / 0 MEDIUM; no unresolved LOW finding. |

## Límites

No se ejecutó deploy, cambio de infraestructura, base remota ni merge. No se
registran PIN, tokens o secretos en esta evidencia.
