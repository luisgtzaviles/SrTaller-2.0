# PBI-041 — Review Remediation 1

- **Finding:** `REVIEW-041-001` — Bulk Apply authorization snapshot race.
- **Base HEAD:** `008135663ce78a2c0b6d1a4860a221e60405012f`.
- **Implementation commits:** `f5551be`, `1d113e8`.
- **Remote actions:** none.
- **Owner data / AviCell:** unchanged.

## Root cause

`CatalogProtectedOperations.publishSupplierVersion()` derived the exact item,
price and cost capabilities from a server-side `SupplierVersionRecord`, but
the repository publication contract carried only `version.lock_version`.
`decide()` could change a READY row's effective classification and increment
`catalog_update_batches.lock_version` without changing the Supplier Version
lock. A publisher could therefore authorize snapshot A and publish snapshot B.

## Remediation

The application now binds the authorization result to the existing
authoritative `batch.version` read from the server. The typed publication port
carries `expectedBatchVersion`, and the serializable repository transaction
locks both Version and Batch and requires both optimistic tokens to match
before coverage checks, row reads or publication writes.

The batch token is injected server-side after the authoritative read; a client
cannot select the authorized snapshot. It is intentionally not part of the
semantic idempotency fingerprint: an already-applied replay with the same
request ID and hash returns the existing result without new effects, while a
non-applied stale token is rejected before writes.

Every path that can change publication effects already advances the same Batch
lock: draft replacement, Analyze, individual decision, bulk decision and
correction-successor invalidation. No schema or migration was required.

## Regression proof

The focused application regression starts with an `UNCHANGED` Apply snapshot.
A simulated concurrent change produces `REACTIVATE` and a new Batch version:

1. the original token is passed to publication and receives a typed Catalog
   conflict;
2. refetch recomputes the `catalog.items.deactivate` requirement;
3. a publisher without that capability is denied before repository publish;
4. a publisher with that capability can retry using the new Batch token.

The disposable PostgreSQL regression materially creates two CatalogItems,
retires one, analyzes an `UNCHANGED` supplier row, retargets it to the inactive
item through `decide()` and confirms the resulting `REACTIVATE` classification
increments the Batch version. Publication with the stale authorized token is
rejected and leaves CatalogItems, price/cost revisions, Resolution, Memory and
successful publication audit counts byte-for-byte/count-for-count unchanged;
the Batch remains READY. Refetch plus the current token publishes normally.

## Verification results

| Check | Result |
| --- | --- |
| Focused authorization/domain contracts | PASS — 17/17 |
| Focused Bulk/policy/orchestration contracts | PASS — 49/49 after inventory reconciliation |
| PostgreSQL PBI-041 | PASS — 10/10; 75 migrations; second run 0 pending; cleanup PASS |
| 10k benchmark | PASS — publish `28,690.3 ms` / budget `30,000 ms` |
| Typecheck | PASS |
| Build | PASS |
| Architecture | PASS |
| Migration | NONE |
| `verify` | PASS — 935 pass / 0 fail / 30 governed PostgreSQL skips |
| `verify:full` | PASS — single execution; Stages 0..13, cleanup and final fingerprint PASS |

The authoritative full campaign repeated the base gate with the same
`935/0/30` result, passed the PostgreSQL composite at `17/17`, PBI-039 at
`2/2`, PBI-040 at `1/1` and PBI-041 at `10/10`. Preview-like migration state,
compiled backend/UI smokes, cleanup and evidence fingerprint all passed. Its
PBI-041 10k benchmark recorded ingest `4,976.1 ms`, analyze `447.0 ms`, preview
`38.7 ms`, publish `2,201.8 ms`, historical search `74.8 ms` and heap delta
`93.7 MiB`; publish remains below the unchanged `30,000 ms` budget.

## Formal-verification status

The earlier PASS in [`FORMAL_VERIFICATION.md`](FORMAL_VERIFICATION.md) remains
historically true only for implementation `690282a`. It does not cover the
remediation commits above. Local authoritative verification now passes, but
the new candidate still requires a fresh independent Formal Verification.
