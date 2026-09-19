# PBI-041 — Independent Formal Re-Verification after REVIEW-041-001

## Formal verdict

**FAIL** — `REVIEW-041-001` and `REVIEW-041-002` are independently verified as
resolved, but this Formal Re-Verification's single authoritative
`verify:full` execution failed its mandatory Stage 4 Material PostgreSQL
composite. No rerun was performed. The implementation candidate is therefore
not eligible for governed remote promotion from this evidence.

This is verification evidence only. It changes no product, test, migration,
verification infrastructure or Owner data.

## Candidate identity and drift

| Check | Verified result |
|---|---|
| Branch | `feature/pbi-041-bulk-catalog-composer` |
| Verified implementation HEAD | `a18d763e7ad0f8c760c8b3c9a9cf3d6f8e7a3555` |
| Pre-FV HEAD | `ab2e0738d452a8be1bfc198d27f1102125d0484c` |
| `origin/main` | `100eb9abc8b8b3b01da5dcc312777b59bf01a615` |
| Pre-evidence divergence | 171 ahead / 0 behind |
| Candidate drift | NONE |
| Working tree before evidence | tracked clean; only pre-existing untracked `apps/dev-preview-web/src/.DS_Store` |

The exact delta `a18d763..ab2e073` contains eight Markdown evidence/status
files and no product, test, migration or executable governance change. The
governed classifier returned `DOCS_ONLY` for every path. Implementation
verification therefore binds to `a18d763e7ad0f8c760c8b3c9a9cf3d6f8e7a3555`.

## Independent REVIEW-041-001 reconstruction

The original gap was real: publication effects were derived and authorized
from a server-side Batch snapshot, but repository publication was bound only
to `SupplierVersion.lock_version`. A concurrent decision could change
`catalog_update_batches.lock_version` and the effective publication effects
without invalidating that authorization.

The current code closes that window:

1. `CatalogProtectedOperations` reads the authoritative SupplierVersion/Batch,
   derives exact effect capabilities and authorizes them.
2. `bindPublishSnapshot` overwrites any input token with the server-read
   `batch.version`; the HTTP caller cannot select the trusted token, effect
   requirements, capabilities or a decision fingerprint.
3. The typed publication port carries `expectedBatchVersion` separately from
   the SupplierVersion token.
4. The serializable repository transaction locks Version and Batch, then
   rejects a version or Batch-token mismatch before coverage evaluation, row
   reads, Resolution/Memory writes, Catalog mutation or publication audit.
5. Draft replacement, Analyze, individual decision, bulk decision and
   correction-successor predecessor invalidation advance the authoritative
   Batch token when they can change publish effects.

The `UNCHANGED -> REACTIVATE` regression is a material escalation:
`REACTIVATE` requires `catalog.items.deactivate`, while `UNCHANGED` does not.
The focused application regression proves stale rejection, forced refetch,
denial without the newly required capability and success only after fresh
authorization with the required capability and concurrency token.

The disposable PostgreSQL race regression proves that a concurrent `decide`
advances the Batch token and a stale publisher produces exactly zero Catalog,
price, Reference Cost, Resolution, Memory, successful publish-audit or Batch
publication writes. The fresh retry path passes. Idempotent replay of an
already-applied matching `clientRequestId` remains valid and the Batch token is
correctly excluded from the semantic request hash; a stale non-applied attempt
cannot poison a later fresh request.

Correction successors remain fail-closed: invalidating the stale predecessor
advances its Batch token and the predecessor cannot become publishable through
the new snapshot binding. Tenant predicates and trusted Branch/Session context
remain server-derived throughout.

### Authorization result

| Invariant | Result |
|---|---|
| Authorized effect set equals published effect set | PASS |
| Server-derived Batch snapshot | PASS |
| Concurrent decision invalidates stale Apply | PASS |
| Stale Apply durable writes | 0 |
| Refetch recomputes requirements | PASS |
| Refetch without escalated capability | DENIED |
| Refetch with capability and fresh token | PASS |
| All effect-changing decision paths bump token | PASS |
| Publish is not item/price/cost effect authority | PASS |
| Prepare is not Publish | PASS |
| Role-name authorization logic | NONE |
| Tenant/Branch isolation | PASS |
| Direct API authority injection | DENIED |
| Transactionality and idempotency | PASS |

## Acceptance matrix

All 29 product acceptance criteria remain supported by current code, focused
contracts and the independently executed PBI-041 PostgreSQL material suite.
The formal verdict still fails because the separate mandatory full gate did
not complete successfully.

| Criterion | Result | Current-candidate evidence |
|---|---|---|
| AC-01 | PASS | Paste/ingest and governed 1.5k/10k paths preserve Supplier Source/Version semantics. |
| AC-02 | PASS | Draft reload, optimistic versioning and concurrent-owner conflict contracts pass. |
| AC-03 | PASS | Server identifiers, duplicate groups and explicit winner semantics reject last-row-wins. |
| AC-04 | PASS | Preview separates observations, proposals, evidence, changes and unresolved state. |
| AC-05 | PASS | Material PostgreSQL blocks unresolved, stale and revoked publication before effects. |
| AC-06 | PASS | Apply effects and replay remain atomic and idempotent. |
| AC-07 | PASS | Only exact valid Memory may preselect known targets. |
| AC-08 | PASS | Corrected mappings preserve history; inconsistent history remains ambiguous. |
| AC-09 | PASS | Supplier title provenance and governed field-update semantics remain separate. |
| AC-10 | PASS | COMPLETE absence stays observational and does not mutate item lifecycle. |
| AC-11 | PASS | Tenant isolation covers supplier and Catalog effects. |
| AC-12 | PASS | Raw cleanup cannot cascade into structured evidence or publication effects. |
| AC-13 | PASS | Automated responsive/a11y contracts and focused 10k material budget pass. |
| AC-14 | PASS | Capture, casing, provenance, fill/undo and reload contracts pass. |
| AC-15 | PASS | Exhaustive validation and exception navigation prevent partial persistence. |
| AC-16 | PASS | Server-owned monotonic versions and feedback semantics remain covered. |
| AC-17 | PASS | Bulk retirement preserves identity/history and ADR-013 Level 2. |
| AC-18 | PASS | Exact historical targets reactivate; ambiguity remains blocked. |
| AC-19 | PASS | Reactivation and revisions remain atomic and idempotent. |
| AC-20 | PASS | Retirement derives only from created resolutions. |
| AC-21 | PASS | Virgin-Tenant new-item proof remains covered. |
| AC-22 | PASS | Actor/context/capability drift fails closed without partial retirement. |
| AC-23 | PASS | Concurrent saves allocate unique versions and replay safely. |
| AC-24 | PASS | Supplier selection alone creates no empty Version. |
| AC-25 | PASS | History/sidebar/grid accessibility contracts pass. |
| AC-26 | PASS | Draft-only Source deletion retains exact capability and ADR-013 controls. |
| AC-27 | PASS | Published/dependent Source deletion remains denied. |
| AC-28 | PASS | Safe deletion remains append-only and non-cascading. |
| AC-29 | PASS | COMPLETE coverage and applied provenance remain explainable. |

## Historical findings

| Finding | State in current candidate |
|---|---|
| `B-041-FV-001` | RESOLVED |
| `B-041-FV-002` | RESOLVED |
| `B-041-FV-003` | RESOLVED |
| `B-041-FV-004` | RESOLVED |
| `B-041-FV-005` | RESOLVED |
| `B-041-FV-006` | RESOLVED |
| `B-041-FV-007` | RESOLVED |
| `REVIEW-041-001` | RESOLVED |
| `REVIEW-041-002` | RESOLVED — `git diff --check origin/main...candidate` PASS |

No gate weakening was found. Historical FAIL/BLOCKED evidence is preserved.

## Database and material verification

The independently executed focused PBI-041 PostgreSQL suite passed `10/10`
against PostgreSQL 18.4 with 75 ordered unique migrations, a clean first apply,
second execution `0 pending`, schema/runtime compatibility and disposable
cleanup PASS. Its 10k characterization measured:

| Metric | Result |
|---|---|
| Ingest | `4,164.3 ms` |
| Analyze | `437.2 ms` |
| Preview | `40.6 ms` |
| Publish | `28,639.2 ms` |
| Historical search | `76.6 ms` |
| Heap delta | `41.9 MiB` |
| Publish budget | PASS — `<= 30,000 ms` |

The governed material inventory now contains 30 exact PBI-041 PostgreSQL
identities: the previous 29 plus the Apply authorization/Bulk Batch race
regression. AST inventory, unknown identity rejection, removal detection,
duplicate detection and no-wildcard rules passed in the 123/123 focused
contract run.

## Read-only Owner-data reconciliation

No Owner-data mutation occurred.

| Evidence | Verified result |
|---|---|
| AviCell v3 | `COMPLETE`, `FULL`, Batch `APPLIED` |
| Version ID | `382ec711-78c3-4a46-ba65-b1cb974c4b2a` |
| Physical observations | 744 |
| Decisions/effective outcomes | 742 `NEW/APPLY`; 2 `UNCHANGED/EXCLUDE` |
| Durable outcomes | 742 `CREATED`; 2 `EXCLUDED`; 742 distinct items |
| Published at | `2026-09-18 19:26:15.11+00` |
| Promoted AviCell Brand groups | 16 |
| Relinked CatalogItems | 618 |
| AviCell pending Brand items | 0 |
| Non-AviCell `Aple` | one pending group / two items, unchanged |
| Row 411 | item `8d465ac8-e2b5-4197-9ea1-ee7af1b624be`, `INACTIVE`, version 3; one zero-price and one zero-cost historical revision |
| Owner-data drift | NONE |

The Tenant summary remains 787 CatalogItems (783 active / 4 inactive), 17
canonical Brands, seven Supplier Sources, 84 Supplier Versions, 1,346
Resolutions, 788 Memory records and eight Field Policy versions.

## Authoritative verification

### Focused and base gates

| Gate | Result |
|---|---|
| Focused current-candidate contracts | PASS — 123/123 |
| PBI-041 PostgreSQL | PASS — 10/10 |
| Typecheck | PASS |
| Build | PASS |
| Architecture | PASS |
| Base `verify` | PASS — 935 pass / 0 fail / 30 governed material skips |
| Working-tree fingerprint before/after full run | MATCH |

### Single `verify:full` execution

Campaign `local-full-verification-20260919094650-ab2e0738d452` was executed
exactly once and was not retried.

| Stage | Result |
|---|---|
| 0 Candidate + integration baseline | PASS |
| 1 Toolchain | PASS |
| 2 Repository integrity | PASS |
| 3 Base verify | PASS — 935/0/30 |
| 4 Material PostgreSQL composite | **FAIL** |
| 12 Cleanup proof | PASS |
| 13 Final fingerprint/evidence | PASS |
| Final verdict | **FAIL** |

Within Stage 4, connection, transaction, migration and schema suites passed.
The `owner-scoped-adapters` suite then exited through
`scripts/test-owner-scoped-persistence-postgresql.mjs` with code 1. The
retained evidence did not include a valid child-failure marker, so the exact
inner test or harness operation is unidentified. The composite consequently
did not reach the remaining PBI-039, PBI-040, PBI-041, Preview-runtime, smoke
or authoritative full-run performance stages. Cleanup removed all governed
resources, and the candidate fingerprint remained
`634653d12806edf3b1eb2dcfc868c4b9bf6f7793453cbb52b4093ea6b33fd20b`.

The focused 10k result above is useful diagnostic evidence, but it does not
replace the required performance result from this FV's failed full execution.

## Formal findings

### FV2-041-001 — BLOCKER — Mandatory full PostgreSQL composite failed

This FV's only `verify:full` execution failed Stage 4 at
`owner-scoped-adapters`. Because a successful own full run is an explicit PASS
predicate, neither the prior remediation run nor the focused green suites can
carry the formal verdict. The unidentified inner failure also prevents a safe
classification as product, fixture or environment drift within verification
scope.

- **Disposition:** unresolved; no remediation authorized in this task.
- **Durable/Owner-data effects:** none.
- **Reruns for green:** 0.
- **Required next state:** diagnose and remediate through a separately
  authorized gate-remediation scope, then perform a new independent formal
  verification.

## Final controls

- Blockers: 1.
- Conditions: 0.
- Non-blocking observations: 0.
- Previous [`FORMAL_VERIFICATION.md`](FORMAL_VERIFICATION.md): preserved as
  historical evidence for `690282a`; superseded for current promotion
  eligibility.
- Remote PR update: not executed.
- Push: not executed.
- Merge: not executed.
- Deploy: not executed.

**PBI-041 FORMAL RE-VERIFICATION FAIL. REVIEW-041-001 is independently proven
remediated, but the current candidate failed its mandatory own full gate and
is not eligible for remote promotion.**

## Subsequent authorized remediation

This FAIL remains immutable evidence for campaign
`local-full-verification-20260919094650-ab2e0738d452`. The separately
authorized `FV2-041-001` cycle subsequently proved that no inner material test
failed: the exact owner-scoped suite passes `8/8` and the ordered composite
passes `17/17`. Historical Docker logs place the original exit in the first
image-pull/bootstrap boundary, before container creation or an inner test.

The primary cause is the harness/orchestration diagnostic gap that discarded
Docker/setup/cleanup identity. Commit `68350af` adds a strict allowlisted,
secret-free harness marker without weakening a suite or assertion. Focused and
base prerequisites pass. This does not change the FAIL above; eligibility now
depends on the new independent Formal Re-Verification required by
[`FV2_041_001_OWNER_SCOPED_POSTGRESQL_REMEDIATION.md`](FV2_041_001_OWNER_SCOPED_POSTGRESQL_REMEDIATION.md).

That subsequent review is now recorded separately as PASS in
[`FORMAL_REVERIFICATION_FV2_041_001.md`](FORMAL_REVERIFICATION_FV2_041_001.md).
This document intentionally retains its original FAIL for the earlier
campaign.
