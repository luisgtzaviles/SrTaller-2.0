# PBI-024 — Implementation Evidence

## Authority and boundary

- Owner High-Risk Start Authorization: granted on 2026-09-05.
- Runtime authority is only `sr_station`, an opaque bearer credential.
- `tenantId`, `branchId`, `stationId`, display metadata, request body, query,
  local storage and browser fingerprint are not accepted as authority.
- The request adapter accepts only the Cookie header and fails closed when it
  is absent, malformed, unknown or structurally invalid.

## Credential and transport

- Production-capable issuance primitive uses Node `randomBytes(32)` and emits
  a base64url opaque credential; persistence contains only SHA-256 verifier
  material plus a credential identity and revocation timestamp.
- The future enrollment serializer fixes `HttpOnly`, `SameSite=Strict` and
  `Path=/`; it adds `Secure` when requested by the server environment.
- No enrollment route, administrative UI, client bundle value or plaintext
  credential logging is included.

## Persistence and resolution

- Migration `20260905160000_stations_create_trusted_runtime_context` adds
  `stations`, `station_bindings`, `station_credentials`, and an additive
  `branches.active` guard.
- Resolver path is credential → Station → active binding → active Branch →
  Tenant, producing immutable `TrustedStationContext` only after every check.
- Composite foreign keys make tenant/station and tenant/branch mismatches fail
  in PostgreSQL. Credential, Station and binding revocation all invalidate a
  subsequent resolution.

## Local/test bootstrap

- `SR_STATION_BOOTSTRAP_SECRET` is server-only active configuration solely for
  local/test bootstrap. It is generated in ignored `.env.local` if absent and
  never printed by scripts or committed.
- The synthetic local seed persists one synthetic Station, active binding and
  only the credential hash. Bootstrap is fail-closed outside the local runtime
  guard and is not an HTTP endpoint.

## Verification performed locally

- `pnpm run local:db:reset` applied 13 migrations and reseeded PostgreSQL
  18.4 with the station bootstrap data.
- `SR_STATION_PG_TEST=1 node --test test/trusted-station-context-postgresql.test.mjs`:
  PASS for hash-only persistence, positive resolution, credential revocation,
  Station revocation, binding revocation, Branch inactivity and cross-tenant
  binding rejection.
- Unit and architecture tests cover opaque-cookie parsing, transport flags,
  request resolver input restriction, local bootstrap environment rejection,
  trusted-context immutability and the governed database registry.

## Explicit non-goals

PBI-031 owns productive enrollment and Station-binding administration. Users,
PIN, sessions, contextual authorization, business endpoint protection, remote
secret distribution, hardware attestation, deploy and release remain outside
this PBI.
