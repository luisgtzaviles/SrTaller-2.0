# PBI-032 — User Directory and Lifecycle Evidence

## Candidate scope

- Tenant-scoped User read model and lifecycle: `active`, `inactive`, `revoked`.
- Server-only first-user provisioning; no public HTTP write surface.
- PostgreSQL migrations for `users`, the durable first-user bootstrap gate and
  immutable lifecycle command/replay evidence.
- Optimistic lifecycle writes via `expectedVersion`, strict idempotency and
  tenant-scoped list/get projections.
- Deterministic synthetic local fixtures, separate from governed provisioning.

## Boundaries retained

- No first-user administrator role or capability.
- No PIN, session, authorization, station administration or production deploy.
- No hard delete; `revoked` remains terminal.
- No Users HTTP/UI surface before PBI-026 contextual authorization; PBI-033
  roles/grants alone are not a final authorization verdict, so the omission is
  deliberate and avoids a read bypass.

## Review evidence

- DoR PASS, Size Large and High Risk were explicitly Owner-authorized.
- Owner Start Authorization and first-user bootstrap decision are recorded in
  the governed delivery history.
- Functional PR: [#26 — User Directory and Lifecycle](https://github.com/luisgtzaviles/SrTaller-2.0/pull/26).
- Reviewed candidate: `326a11802a4be32970d4e0634a61841b6bcb9b86`;
  authoritative candidate CI [34072027504](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/34072027504)
  passed run-1, run-2 and comparison.
- Focused high-risk review: PASS; open BLOCKER/HIGH/MEDIUM/LOW findings: 0.
- Functional merge: `66aebdbb45f368755107db315772654bee5399a3`;
  authoritative `main` CI [34072709330](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/34072709330)
  passed run-1, run-2 and comparison.
- Conditional Owner Acceptance: APPROVED; its exact-candidate, exact-merge,
  scope, evidence and GREEN `main` CI predicates were satisfied.
- Closure PR [#27](https://github.com/luisgtzaviles/SrTaller-2.0/pull/27)
  merged as `db6637ee6902b9b0e4a40ba39d7f203cb6889352`; authoritative
  post-closure CI [34074457695](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/34074457695)
  passed run-1, run-2 and comparison.
- Canonical status: `Done`; `Released: NO`. See the
  [closure candidate](./CLOSURE_CANDIDATE.md).

## Local material verification

- Toolchain: Node.js `24.18.0`, pnpm `11.15.1`, PostgreSQL `18.4`.
- PostgreSQL owner-scoped runner: two independent executions, four suites per
  execution, zero skips, cleanup PASS and material comparison MATCH.
- Covered materially: fresh migration chain, zero-work rerun, down/reapply,
  bootstrap rollback/one-time/concurrency/idempotency, tenant isolation,
  lifecycle CAS/concurrency/idempotency, all approved transitions and terminal
  revocation.
- Focused application, architecture, contract, typecheck and build checks:
  PASS. Full `pnpm run verify` and exact-HEAD authoritative candidate and
  `main` CI are GREEN.
- The local bootstrap authority guard is behaviorally verified for valid,
  missing, incorrect and non-local inputs before persistence can be acquired;
  the command retains a static ordering assertion for that boundary.
- Synthetic User fixtures are deterministic, frozen, tenant-scoped and
  secret-free; local seed evidence reports their bounded count.
