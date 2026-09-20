# PBI-041 — Canonical closure data-scope reconciliation

## Decision and preserved history

Canonical closure initially stopped after a read-only inspection found that
active Preview did not contain the AviCell Owner dataset. That inspection was
correct about the observed facts, but the assumed gate scope was not: Preview
is a governed minimal-seed environment, not an implicit replica of Owner
business data. The Owner explicitly rejected copying, seeding, resetting or
otherwise mutating Preview data to manufacture that identity.

The closure now keeps two independent mandatory gates:

1. **Owner-data authority:** read-only integrity against the governed
   Owner/local datastore where AviCell exists.
2. **Preview release authority:** runtime, schema, provenance and route proof
   against Dokploy Preview.

Neither authority substitutes for the other. No data was copied, seeded,
reset or mutated for this reconciliation.

## Short closure recheck

| Gate | Authority | Result |
| --- | --- | --- |
| Owner-data integrity | Governed Owner/local PostgreSQL 18.4 | PASS |
| Preview release integrity | Dokploy Preview | PASS |
| Integrated `main` | `9b7a83d02d1cd3fccf735d7e8bebd3ff16aa54ca` | PASS |
| Preview provenance | frontend and backend exact + clean at `9b7a83d` | PASS |
| Preview migrations | 75 applied / 0 pending | PASS |
| Canonical `verify` | 940 pass / 0 fail / 30 governed skips | PASS |
| Single canonical `verify:full` | stages 0–13, PostgreSQL, cleanup and fingerprint | PASS |
| 10k publish | 2,068.5 ms / 30,000 ms budget | PASS |

### Owner-data authority — read-only result

The governed Owner/local datastore reports AviCell v3 as `COMPLETE / FULL /
APPLIED`, with 744 physical observations. The already-materialized accounting
evidence records 742 effective outcomes: 742 `NEW / APPLY / CREATED` effects
and two duplicate observations `UNCHANGED / EXCLUDE`.

- AviCell pending Brands: `0`.
- Row 411: `INACTIVE`, preserving its identity and history.
- Non-AviCell `Aple`: still `PENDING` and unchanged.
- Supplier history: immutable; no unexplained Owner-data drift was observed.

The authoritative product proof remains
[UX-005.5 post-Apply integrity verification](../../../domain/PRICE_LIST_UX_0055_AVICELL_POST_APPLY_INTEGRITY_VERIFICATION.md)
and the corresponding [implementation evidence](IMPLEMENTATION_EVIDENCE.md).

### Preview release authority — minimal-seed result

The active Preview database is reachable and schema-compatible, with 75
applied migrations and 0 pending. Its governed seed currently contains 1
CatalogItem, 0 Supplier Catalog Versions and 0 AviCell sources. Those counts
are not an Owner-data integrity failure: they describe Preview's own minimal
seed scope.

`/livez`, `/readyz`, frontend provenance, direct Bulk Composer/Price List/Field
Policy/Brand/Roles routes and reload all passed on the exact clean integrated
revision. Unknown API routes remain fail-closed with `404`. The release record
is in [Preview activation and provenance remediation](PREVIEW_ACTIVATION_PROVENANCE_REMEDIATION.md)
and [post-deploy closure evidence](POST_DEPLOY_CLOSURE.md).

## Closure consequence

The data-scope blocker is resolved without weakening either gate. PBI-041 is
`Done` after PR #58 `cb1dca3` and exact-main CI `35544551782`; `Released: NO`.
Production remains unchanged.
