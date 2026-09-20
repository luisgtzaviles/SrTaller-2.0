# PBI-041 — Preview activation and provenance remediation

## Result

- **Environment:** Dokploy Preview / `srtaller-app` only.
- **Expected integrated revision:**
  `9b7a83d02d1cd3fccf735d7e8bebd3ff16aa54ca` (PR #57).
- **Initial runtime revision:**
  `39ece042f5a3bf0800bb69d4d6e21a7d86e316ad` (PR #56).
- **Result:** `PASS` — the active Preview runtime, frontend provenance and
  backend health headers now agree on the exact PR #57 merge SHA.
- **Production:** unchanged; no Production deploy, database or infrastructure
  action occurred.

## Incident classification and root cause

Dokploy recorded a completed deployment for PR #57, but `/livez`, `/readyz`
and `runtime-provenance.json` still exposed the previous clean revision. This
was **not** a routing, proxy or application-health failure: the newly started
container was healthy but had been built with a stale Preview build argument,
`SR_BUILD_GIT_SHA=39ece042...`.

The Docker image uses that argument as its runtime provenance value. The
source branch was `main`, but the stale static argument made a build of that
source advertise the previous revision. This is classified as stale build
identity metadata, not a source, migration or data regression.

## Authorized Preview-only remediation

The Preview application's build arguments were reconciled without changing its
branch or any product configuration:

```text
SR_BUILD_GIT_SHA=9b7a83d02d1cd3fccf735d7e8bebd3ff16aa54ca
```

`NPM_TOKEN` was preserved. A single controlled Preview redeploy from `main`
then completed successfully in Dokploy. The prior stale containers stopped;
the active healthy container is `f801cb60c0e7`.

No migration was run manually, no Owner data was written, and no AviCell,
Catalog, Supplier Catalog Version, policy or authorization state changed.

## Post-remediation proof

### Exact provenance and health

| Surface | Result |
| --- | --- |
| `/livez` | `200`; `x-sr-source-revision: 9b7a83d02d1cd3fccf735d7e8bebd3ff16aa54ca`; clean |
| `/readyz` | `200`; same exact revision and clean state |
| `/runtime-provenance.json` | frontend `sourceRevision` is the same exact revision; clean |
| active container | `f801cb60c0e7`, running and healthy |

There is no mixed-revision condition between the frontend provenance and the
backend readiness/liveness headers.

### Schema compatibility

The Preview PostgreSQL migration journal contains `75` distinct applied
migrations; its newest migration is
`20260917190200_access_add_granular_catalog_capabilities`. The local governed
source manifest contains the same `75` migrations and same final entry;
therefore the deployed schema is compatible and there are `0` pending
migrations. No global database timezone or runtime setting was changed.

The snapshot-only helper was intentionally not used as post-deploy evidence:
it accepts pre-merge/pre-deploy phases and reports an absent capture as
`UNKNOWN`. The authoritative Preview migration journal above is the material
post-deploy record.

### Read-only Preview smoke

Direct requests returned:

| Route | Status |
| --- | --- |
| `/` | `200` |
| `/listas/precios` | `200` |
| `/listas/precios/carga-masiva` | `200` |
| `/configuracion/catalogos/lista-de-precios/campos-de-carga` | `200` |
| `/configuracion/catalogos?module=price-list` | `200` |
| `/configuracion/usuarios` | `200` |
| `/api/unknown` | `404` |

The Browser reload proof retained
`https://preview.srtaller.dev/listas/precios/carga-masiva` with title
`SR Taller 2.0 · Preview`. No session credentials or business writes were used.

## Performance-patch lineage and rollback

The performance remediation commit `4bcb37c` is an ancestor of the deployed
PR #57 merge `9b7a83d`; the deployed source therefore includes the approved
publish-determinism change. No rollback was required. The prior runtime was
preserved only as stopped container history and was not reactivated.

## Closure boundary

Preview activation is no longer a blocker. The subsequent canonical closure
recheck distinguishes Preview release authority from Owner-data authority:
Preview's minimal seed is not required to contain AviCell. The authoritative
Owner/local datastore is read-only evidence for AviCell integrity, while this
document remains release/runtime proof. See
[data-scope reconciliation](CANONICAL_CLOSURE_DATA_SCOPE_RECONCILIATION.md).
`Released: NO` remains unchanged.
