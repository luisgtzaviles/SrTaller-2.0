# Active Development Checklist

Milestone: PBI-028 Canonical Closure & Roadmap Advance
Sprint: SPRINT-02 — Operational Authentication & Authorization
Current PBI: NONE — PBI-028 is `Done candidate`; PBI-037 remains an integrated Owner-authorized slice
Status: Documentary closure candidate; CI and focused documentary review GREEN; Owner merge authorization pending
Progress: 13 / 14 closure blocks completed
Current work: Stop at Owner merge authorization.
Next block: No next PBI action; merge authorization is the only remaining closure predicate.
Blockers: No technical blocker. Owner merge authorization, release and deploy remain unauthorized.
Updated: 2026-09-08 MST

## Canonical closure

- [x] Main revalidated: local = `origin/main`, divergence `0/0`, working tree clean
- [x] PR #37 functional integration verified: merge `ab8e8ba9a1274030e27ad920d61c66ed461bf122`
- [x] PR #37 exact-main CI `34193770228`: run-1/run-2/comparison GREEN
- [x] PR #38 PIN focus remediation verified: merge `a9bb0744ebf8b32b91a9ddf90f67570830182afc`
- [x] PR #38 exact-main CI `34197268832`: run-1/run-2/comparison GREEN
- [x] Focused review: `0 BLOCKER / 0 HIGH / 0 MEDIUM / 0 LOW`
- [x] Owner Acceptance explicitly recorded
- [x] PBI-028 scope, evidence, DoD and residual limits reconciled
- [x] PBI-037 reconciled as integrated product slice, without independent lifecycle
- [x] G5 AUDIT marked `PASS candidate`
- [x] Current PBI / WIP advanced preventively to `NONE` / `0/1`
- [x] Next candidate assessed as `NONE`; no existing PBI is selected or ready
- [x] Docs-only PR CI `34199627015`: run-1/run-2/comparison GREEN
- [x] Focused documentary review of exact HEAD: docs-only, links, consistency, diff and secret scan PASS
- [ ] Owner merge authorization

## PBI-028 — Audit and Correlation

- [x] Functional Local and real-actor Operational Note proof
- [x] Atomic, idempotent, append-only business audit with safe allowlist
- [x] Server-generated correlation on success and errors
- [x] PostgreSQL 18.4, architecture, full verify, OCI and browser proof
- [x] Functional integration and exact-main CI
- [x] Owner Acceptance
- [~] `Done candidate` — requires this closure PR's merge and exact-main CI
- [ ] `Done` effective

## PBI-037 — Users & Roles Administration

- [x] Role-to-capabilities and multi-role union proof
- [x] User-to-roles with no direct permissions
- [x] PIN-to-user/session proof; inactive user login denied
- [x] User editing, explicit PIN change and lifecycle persistence
- [x] PIN is never returned, persisted or displayed plaintext
- [x] PIN dialog focus remediation integrated and regression-covered
- [x] Integrated and traceable within PBI-028 checkpoint
- [ ] Independent `Done` state — not applicable; PBI-037 has none

## Guardrails

- [x] No new PBI started; no DoR inferred
- [x] No merge by this checklist update
- [x] No deploy, Preview remoto, Dokploy, remote DB, DNS or infrastructure change
