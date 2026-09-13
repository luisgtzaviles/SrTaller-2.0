# Active Development Checklist

Milestone / Functional Goal: Concurrent Operational Sessions — implementation through Preview
Sprint: SPRINT-02 — Operational Authentication & Authorization remediation
Current PBI: NONE — PBI-043 Done candidate
Status: Functional implementation and Preview PASS; documentary closure active
WIP: 0/1 functional
Progress: 11 / 12 implementation-to-closure steps complete
Current: Integrate this documentary closure and obtain exact-main CI
Next: Clean absorbed PBI-043 branches; leave PBI-040 frozen for separate reconciliation
Blocked: None; no unresolved product/domain decision found
Last updated: 2026-09-12 MST

## Implementation through Preview

- [x] Integrated readiness through PR #46 as `9ed6885`; exact-main CI
  `34725827409` PASS
- [x] Preserved `feature/pbi-040-catalog-pricing-core` frozen and untouched
- [x] Implement migration, independent create, exact switch/logout and internal
  revocation contracts
- [x] Materialize COS-01…COS-22 with PostgreSQL 18.x where required
- [x] Pass focused, architecture, typecheck/build, runtime provenance and full
  verification gates without Critical skips
- [x] Prove COS-23/COS-24 with independent Chrome profiles on the same Station
- [x] Remediate the first independent review: deterministic PostgreSQL locks,
  N-session revocation, material lockout/CSRF/attribution and hardened Chrome
- [x] Complete independent Critical-risk review with no open findings
- [x] Push one branch, open PR #47 and obtain run-1/run-2/comparison PASS
- [x] Merge, validate exact-main CI and deploy/validate the integrated SHA in
  Preview only
- [x] Reconcile PBI/Sprint/current state and preserve exact evidence
- [ ] Merge closure PR, validate exact-main CI and safely clean
  absorbed PBI-043/readiness branches

## Boundaries

- [x] PBI-043 implementation only; no Session Admin UI or global Access audit
- [x] No PBI-040 modification or resumption
- [x] No PBI-041/PBI-042 implementation
- [x] Preview authorized only after merge; no Production

The prior PBI-039 closure checklist remains preserved in
[`history/PBI-039_ACTIVE_CHECKLIST.md`](history/PBI-039_ACTIVE_CHECKLIST.md).
