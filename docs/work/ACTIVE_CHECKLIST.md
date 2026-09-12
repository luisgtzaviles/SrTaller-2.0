# Active Development Checklist

Milestone / Functional Goal: Concurrent Operational Sessions — architecture + PBI readiness
Sprint: SPRINT-02 — Operational Authentication & Authorization remediation
Current PBI: PBI-043 — Ready; implementation not authorized
Status: Architecture and readiness prepared for Owner implementation decision
WIP: 0/1
Progress: 8 / 8 readiness steps complete
Current: Owner review of ADR-014 and PBI-043 readiness package
Next: Explicit Owner implementation authorization or stop
Blocked: None; no unresolved product/domain decision found
Last updated: 2026-09-12 MST

## Architecture and readiness gate

- [x] Started from clean, current `main` `40684d7` with exact-main CI
  `34623060504` PASS
- [x] Preserved `feature/pbi-040-catalog-pricing-core` frozen and untouched
- [x] Materialized ASC-001…ASC-008 in ADR-014 and canonical architecture
- [x] Defined session-local switch, independent login, transaction boundaries,
  persistence transition, rollback and revocation semantics
- [x] Preserved PIN, cookies, CSRF, 60-minute idle, 12-hour absolute lifetime,
  authorization and business attribution contracts
- [x] Created PBI-043, formal DoR, Critical threat model and COS-01…COS-24
  verification matrix
- [x] Reconciled roadmap, Sprint, backlog, dependency map, workflow and branch
  lifecycle policy
- [x] Verified documentation and confirmed no product code, migration, endpoint,
  database constraint or PBI-040 change

## Current Owner gate

- [ ] Owner implementation authorization for PBI-043
- [ ] New implementation branch from an updated `main`
- [ ] Implementation, review, CI, Preview validation and Owner Acceptance — all
  future, separate gates

## Boundaries

- [x] No functional implementation or migration
- [x] No PBI-040 modification or resumption
- [x] No PBI-041/PBI-042 implementation
- [x] No push, PR, merge, release or deploy
- [x] No Production or real-data operation

The prior PBI-039 closure checklist remains preserved in
[`history/PBI-039_ACTIVE_CHECKLIST.md`](history/PBI-039_ACTIVE_CHECKLIST.md).
