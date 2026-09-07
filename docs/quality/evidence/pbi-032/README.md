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
- No Users HTTP/UI surface before PBI-033 contextual authorization; omission is
  deliberate and avoids a read bypass.

## Review evidence

- DoR PASS, Size Large and High Risk were explicitly Owner-authorized.
- Owner Start Authorization and first-user bootstrap decision are recorded in
  the governed delivery history.
- Draft PR: [#26 — User Directory and Lifecycle](https://github.com/luisgtzaviles/SrTaller-2.0/pull/26).
- Candidate validation requires `pnpm run verify`, PostgreSQL 18.4 material
  tests, focused architecture/contract coverage and authoritative CI GREEN on
  the exact final PR HEAD. The final SHA and run remain pending current
  remediation and must not be inferred from an earlier HEAD.

## Local material verification

- Toolchain: Node.js `24.18.0`, pnpm `11.15.1`, PostgreSQL `18.4`.
- PostgreSQL owner-scoped runner: two independent executions, four suites per
  execution, zero skips, cleanup PASS and material comparison MATCH.
- Covered materially: fresh migration chain, zero-work rerun, down/reapply,
  bootstrap rollback/one-time/concurrency/idempotency, tenant isolation,
  lifecycle CAS/concurrency/idempotency, all approved transitions and terminal
  revocation.
- Focused application, architecture, contract, typecheck and build checks:
  PASS. Full `pnpm run verify` and exact-HEAD authoritative CI are final
  candidate gates and remain to be recorded after the current commit.
- The local bootstrap authority guard is behaviorally verified for valid,
  missing, incorrect and non-local inputs before persistence can be acquired;
  the command retains a static ordering assertion for that boundary.
- Synthetic User fixtures are deterministic, frozen, tenant-scoped and
  secret-free; local seed evidence reports their bounded count.
