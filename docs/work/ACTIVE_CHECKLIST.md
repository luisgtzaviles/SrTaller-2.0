# Active Development Checklist

Milestone / Functional Goal: PBI-040 Owner iteration — prevent duplicate pending references
Sprint: SPRINT-03 — Price List Foundation
Current PBI: PBI-040 — Owner Review
Status: Ready for Owner Review; Owner Acceptance remains pending
WIP: 1/1
Progress: 5 / 5 implementation blocks complete
Current: Checkpoint prepared for Owner Review
Next: Owner reviews exact reuse, near match and Brand applicability behavior
Blocked: None
Last updated: 2026-09-13 MST

## Duplicate reference prevention iteration

- [x] Audit normalization, autocomplete and pending persistence authority
- [x] Reuse exact compatible canonical Category/Brand before pending persistence
- [x] Prevent duplicate pending/canonical races and remediate existing synthetic duplicates
- [x] Add material regression, isolation, reload and UX coverage
- [x] Run governed gates and leave Chrome prepared for Owner Review

## Required outcome

- Exact normalized Category input reuses the Tenant + Type canonical identity
  and never creates a duplicate pending capture.
- Exact normalized Brand input reuses the Tenant-wide canonical identity and
  follows the governed applicability contract without creating another identity.
- Pending creation remains a server-side authority under concurrency; historical
  synthetic duplicates reconcile to the existing canon without losing capture
  provenance.
- Near matches remain human reconciliation; no fuzzy matching is introduced.

## Boundaries

- [x] PBI-040 only; Owner Acceptance is not inferred
- [x] No PBI-041/PBI-042, import, Inventory, Caja or downstream implementation
- [x] No push, PR, merge to `main`, Preview deploy or Production
- [x] PBI-039/PBI-043 remain authoritative and are not reopened

The completed PBI-043 checklist remains preserved by Git history and its
closure evidence. The prior PBI-039 checklist remains in
[`history/PBI-039_ACTIVE_CHECKLIST.md`](history/PBI-039_ACTIVE_CHECKLIST.md).
