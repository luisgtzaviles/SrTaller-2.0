# Active Development Checklist

Milestone / Functional Goal: Resume PBI-040 safely from current main
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-040 — Owner Review
Status: Reconciliation in progress; no new functionality authorized
WIP: 1/1
Progress: 1 / 5 reconciliation blocks complete
Current: Resolve merge conflicts by module ownership
Next: Run focused and full preservation gates
Blocked: None
Last updated: 2026-09-12 MST

## Reconciliation to Owner Review

- [x] Verify clean `main`, PBI-043 closure, branch cleanup, frozen PBI-040 HEAD
  and exact genealogy
- [~] Merge current `main` into PBI-040 without rewriting or discarding WIP
- [ ] Prove PBI-039, PBI-040 and PBI-043 contracts with material PostgreSQL
- [ ] Prove exact local runtime and concurrent Owner/QA Sessions
- [ ] Leave Chrome on `/listas/precios`, reconcile evidence and finish clean

## Boundaries

- [x] Reconciliation only; no new Price List feature
- [x] No PBI-041/PBI-042 implementation
- [x] No push, PR, merge to `main`, Preview deploy or Production
- [x] PBI-039/PBI-043 remain authoritative and are not reopened

The completed PBI-043 checklist remains preserved by Git history and its
closure evidence. The prior PBI-039 checklist remains in
[`history/PBI-039_ACTIVE_CHECKLIST.md`](history/PBI-039_ACTIVE_CHECKLIST.md).
