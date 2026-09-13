# Active Development Checklist

Milestone / Functional Goal: Concurrent Operational Sessions — implementation through Preview
Sprint: SPRINT-02 — Operational Authentication & Authorization remediation
Current PBI: PBI-043 — In review
Status: Local functional proof complete; formal integration in progress
WIP: 1/1
Progress: 6 / 9 implementation-to-Preview steps complete
Current: Run final full verification and independent Critical review
Next: Push the single implementation branch and obtain authoritative CI
Blocked: None; no unresolved product/domain decision found
Last updated: 2026-09-12 MST

## Implementation through Preview

- [x] Integrated readiness through PR #46 as `9ed6885`; exact-main CI
  `34725827409` PASS
- [x] Preserved `feature/pbi-040-catalog-pricing-core` frozen and untouched
- [x] Implement migration, independent create, exact switch/logout and internal
  revocation contracts
- [x] Materialize COS-01…COS-22 with PostgreSQL 18.x where required
- [~] Pass focused, architecture, typecheck/build, runtime provenance and full
  verification gates without Critical skips; only `verify:full` remains
- [x] Prove COS-23/COS-24 with independent Chrome profiles on the same Station
- [ ] Complete independent Critical-risk review with no open findings
- [ ] Push one branch, open PR and obtain run-1/run-2/comparison PASS
- [ ] Merge, validate exact-main CI and deploy/validate the integrated SHA in
  Preview only
- [ ] Reconcile PBI/Sprint/current state, preserve evidence and safely clean
  absorbed PBI-043/readiness branches

## Boundaries

- [x] PBI-043 implementation only; no Session Admin UI or global Access audit
- [x] No PBI-040 modification or resumption
- [x] No PBI-041/PBI-042 implementation
- [x] Preview authorized only after merge; no Production

The prior PBI-039 closure checklist remains preserved in
[`history/PBI-039_ACTIVE_CHECKLIST.md`](history/PBI-039_ACTIVE_CHECKLIST.md).
