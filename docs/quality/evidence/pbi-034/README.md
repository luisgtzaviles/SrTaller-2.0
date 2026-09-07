# PBI-034 — Operational Session Evidence

## Estado

- **Estado:** In progress; candidato todavía no integrado.
- **PBI actual / WIP:** PBI-034 / `1/1`.
- **Risk / size:** Critical / Large.
- **DoR:** [PASS](./DEFINITION_OF_READY.md).
- **Threat model:** [complete](./THREAT_MODEL.md).
- **Owner Start Authorization:** Identity Master Goal y decisión Owner de
  reanudación vigentes para este slice exacto.
- **DEC-005 Option A:** autorizada para composición dirigida por aristas
  explícitas y contratos públicos; materialización pendiente.
- **Released / deployed:** NO / NO.

## Baseline

- `main`: `ccdd7e243265c0f4d19e9798b8ddfa90d97e8c9e`.
- Cierre PBI-025: PR #32, merge exacto anterior.
- CI autoritativo exact-main: run `34124746317`, run-1/run-2/comparison GREEN
  en attempt 1.
- PBI-025: `Done`; G3 permanece Pending hasta cerrar PBI-034.

## Candidate scope

- Session Access-owned, una activa por Station;
- start/resolve/touch/logout/switch con expiración y revocación;
- bearer opaco en cookie segura y CSRF/origin contract;
- composición DEC-005 dirigida de Access hacia contratos públicos de Stations
  y Users;
- bootstrap Station sólo local/test;
- gate de login y actor real visible en el Application Shell;
- migración, PostgreSQL material, tests, documentación y evidencia.

## Verification matrix

| Riesgo / criterio | Evidencia | Estado |
|---|---|---|
| Contexto server-side e isolation | application/HTTP/PostgreSQL | Pending |
| Bearer/cookies/CSRF/no-store | contract tests | Pending |
| One active Session + concurrency | PostgreSQL material | Pending |
| Idle/absolute expiry | controlled clock + PostgreSQL | Pending |
| Logout/switch/reload | application + UI/local runtime | Pending |
| Lifecycle invalidation | PostgreSQL material negatives | Pending |
| DEC-005 Option A | checker + mutations | Pending |
| Light/Dark/responsive/focus | local visual validation | Pending |
| Two-run reproducibility | CI run-1/run-2/comparison | Pending |

## Boundaries

No contextual business authorization, business audit, Operational Note
retrofit, production secrets, remote infrastructure, release or deploy.
