# PBI-032 — User Directory and Lifecycle Evidence

## Candidate scope

- Tenant-scoped User read model and lifecycle: `active`, `inactive`, `revoked`.
- Server-only first-user provisioning; no public HTTP write surface.
- PostgreSQL migrations for `users` and the durable first-user bootstrap gate.
- Optimistic lifecycle writes via `expectedVersion` and tenant-scoped queries.
- Deterministic synthetic local fixtures, separate from governed provisioning.

## Boundaries retained

- No first-user administrator role or capability.
- No PIN, session, authorization, station administration or production deploy.
- No hard delete; `revoked` remains terminal.

## Review evidence

- DoR PASS, Size Large and High Risk were explicitly Owner-authorized.
- Owner Start Authorization and first-user bootstrap decision are recorded in
  the governed delivery history.
- Candidate validation includes `pnpm run verify`, PostgreSQL local migration
  on 18.4, static contract coverage and authoritative CI pending PR creation.
