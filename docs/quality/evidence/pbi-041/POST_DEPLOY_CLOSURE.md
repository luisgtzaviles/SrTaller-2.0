# PBI-041 — Post-deploy closure evidence

## Result

- **Environment:** Dokploy Preview / `srtaller-app`.
- **Application merge:** PR #55,
  `b54a095241891807e8b399e12ef783d72f8982b5`.
- **Application exact-main CI:** `35458836014`, run-1, run-2 and comparison
  `SUCCESS`.
- **Routing remediation merge:** PR #56,
  `39ece042f5a3bf0800bb69d4d6e21a7d86e316ad`.
- **Routing remediation exact-main CI:** `35490480554`, run-1, run-2 and
  comparison `SUCCESS`.
- **Publish-determinism remediation merge:** PR #57,
  `9b7a83d02d1cd3fccf735d7e8bebd3ff16aa54ca`; exact-main CI `35539833596`,
  run-1, run-2 and comparison `SUCCESS`.
- **Active deployed SHA:** `9b7a83d02d1cd3fccf735d7e8bebd3ff16aa54ca`,
  exact and clean in frontend/backend provenance.
- **Dokploy deployment reference:** latest `srtaller-app` deployment entry
  `#1`; status `Done`, duration `1m 16s`. The current Dokploy UI did not expose
  a separate stable deployment identifier.
- **Timestamp:** `2026-09-20T04:58:37Z` merge; deployment and smoke completed
  on `2026-09-19 MST`.
- **Rollback target:** prior clean PR #56 runtime `39ece042`; not required.
- **Rollback:** not required.
- **Production:** unchanged and not authorized.

## Migration result

PR #55 deployment applied the governed PBI-041 chain to `75` migrations and a
second execution reported `0 pending`. PR #56 changed only the bounded static
SPA route allowlist and its regression coverage; it introduced no migration or
database mutation. No migration was required for the corrective deployment.

## Health and provenance

- `/`: `200`.
- `/livez`: `200`.
- `/readyz`: `200`.
- frontend provenance: `sourceRevision`
  `9b7a83d02d1cd3fccf735d7e8bebd3ff16aa54ca`, `sourceState: clean`.
- readiness provenance headers reported the same exact SHA and clean state.

## Corrected Preview smoke

- `/listas/precios/carga-masiva`: direct navigation `200`, Bulk Catalog
  Composer rendered, and reload retained the application surface.
- `/configuracion/catalogos/lista-de-precios/campos-de-carga`: direct
  navigation `200` and reload retained the React application. The current
  operational session received the product-level `Acceso no autorizado`
  result because it lacked the required contextual capability; this is the
  expected authorization boundary and not a static-route failure.
- `/api/unknown`: `404`.
- `/ruta-desconocida-pbi-041`: `404`.
- `/` and the two bounded PBI-041 routes returned the same SPA entrypoint body.

The corrective deployment changed no domain, API, capability, persistence,
Owner data or supplier version semantics. Owner data remained read-only during
post-deploy smoke.

## Data-scope authority

Preview is a governed minimal-seed environment: its current 1 CatalogItem, 0
Supplier Catalog Versions and 0 AviCell sources are valid Preview data scope,
not an Owner-data failure. AviCell integrity is verified read-only against the
governed Owner/local datastore; release integrity is verified here against
Preview. No Owner data was copied, seeded, reset or written to Preview. See
[canonical closure data-scope reconciliation](CANONICAL_CLOSURE_DATA_SCOPE_RECONCILIATION.md).

## Closure predicates

- Formal Re-Verification: `PASS`.
- Candidate CI: `PASS`.
- Independent review: `APPROVED` on exact corrective HEAD
  `2e1654875fc68e24138ee84b4a09b494b28275e1`.
- Functional and remediation merges: `PASS`.
- Exact-main CI: `PASS`.
- Preview deployment, health and smoke: `PASS`.
- Owner standing authorization covered final closure after all gates passed.
- PBI-041: `Done candidate` until this closure PR is integrated.
- Released: `NO`.
