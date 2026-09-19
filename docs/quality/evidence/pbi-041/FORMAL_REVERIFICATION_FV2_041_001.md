# PBI-041 — Independent Formal Re-Verification after FV2-041-001

## Verdict

**PASS** — `REVIEW-041-001`, `REVIEW-041-002` and `FV2-041-001` are resolved
on the current local candidate. The one authoritative `verify:full` campaign
for this review passed Stages 0–13, including the previously blocked
owner-scoped PostgreSQL material suite. No formal finding remains open.

This result authorizes only the next governed delivery checkpoint described by
the Owner. It does not itself push, update PR #55, merge, deploy, grant Owner
Acceptance, mark PBI-041 Done or release product.

## Candidate identity

| Check | Result |
| --- | --- |
| Branch | `feature/pbi-041-bulk-catalog-composer` |
| Remediation base | `165719c3419423e721f884147f46b3069185ad64` |
| Verified implementation HEAD | `68350afc46fb60f059a43e686f1f98df599043e8` |
| Formal execution HEAD | `14fedc9cfb3b46afcc8da372fe1ed3633a280504` |
| Implementation delta | Harness/test only; no product, schema or migration change |
| `68350af..14fedc9` | Documentation/evidence only |
| Tracked tree before/after campaign | Clean / fingerprint MATCH |
| Preserved untracked Owner artifact | `apps/dev-preview-web/src/.DS_Store` |

The historical FAIL in
[`FORMAL_REVERIFICATION_REVIEW_041_001.md`](FORMAL_REVERIFICATION_REVIEW_041_001.md)
remains valid for its earlier campaign and is not rewritten.

## Independent finding review

### REVIEW-041-001 and REVIEW-041-002

The server-derived Batch token remains bound to the authorized Apply snapshot.
Every effect-changing decision advances the token, stale publication is
rejected before writes, a refetch recomposes exact capabilities and direct API
inputs cannot replace trusted Tenant/Branch/Session/effect authority.
`REVIEW-041-002` remains resolved by a clean integration diff. The FV2 change
does not touch these product paths.

### FV2-041-001

The original Stage 4 failure occurred in the first owner-scoped
image-pull/bootstrap boundary before any material test. The former harness
discarded Docker/setup/cleanup identity. The current runner emits only one
allowlisted operation, one exact governed test file and bounded
exit/signal/timeout state. Raw stderr, commands, credentials, database and
container identifiers, paths and SQL are absent. Forged or ambiguous markers
fail closed.

The exact runner passes 8/8 and Stage 4 passes 17/17 with zero critical skips.
No assertion, suite, skip, cleanup control or required test was removed or
weakened. Full diagnosis and focused proof are in
[`FV2_041_001_OWNER_SCOPED_POSTGRESQL_REMEDIATION.md`](FV2_041_001_OWNER_SCOPED_POSTGRESQL_REMEDIATION.md).

## Acceptance matrix

All product paths are unchanged from the independently reviewed candidate;
the new campaign re-executed base and all material PostgreSQL gates.

| Criterion | Result | Independent coverage |
| --- | --- | --- |
| AC-01 | PASS | Paste/ingest and governed large-list paths retain Supplier Source/Version semantics. |
| AC-02 | PASS | Durable drafts, optimistic versioning and concurrent-owner conflicts remain enforced. |
| AC-03 | PASS | Duplicate identity requires explicit winner; no last-row-wins behavior. |
| AC-04 | PASS | Preview separates observations, proposals, evidence, effects and attention. |
| AC-05 | PASS | Unresolved, stale and revoked publication is rejected before effects. |
| AC-06 | PASS | Apply remains atomic and idempotent. |
| AC-07 | PASS | Only exact valid Memory can preselect a known target. |
| AC-08 | PASS | Corrected mappings preserve history; contradictory history stays ambiguous. |
| AC-09 | PASS | Supplier title provenance remains separate from canonical field updates. |
| AC-10 | PASS | COMPLETE absence stays observational and does not mutate lifecycle. |
| AC-11 | PASS | Tenant isolation covers Supplier and Catalog effects. |
| AC-12 | PASS | Raw cleanup cannot cascade into structured evidence/publication effects. |
| AC-13 | PASS | Responsive/a11y contracts and current 10k budget pass. |
| AC-14 | PASS | Capture, casing, provenance, fill/undo and reload contracts pass. |
| AC-15 | PASS | Exhaustive validation and correction navigation prevent partial persistence. |
| AC-16 | PASS | Server-owned versions and feedback semantics remain monotonic. |
| AC-17 | PASS | Bulk retirement preserves identity/history and ADR-013 Level 2. |
| AC-18 | PASS | Exact historical targets reactivate; ambiguity remains blocked. |
| AC-19 | PASS | Reactivation and revisions remain atomic/idempotent. |
| AC-20 | PASS | Retirement derives only from created resolutions. |
| AC-21 | PASS | Virgin-Tenant new-item behavior remains materialized. |
| AC-22 | PASS | Actor/context/capability drift fails closed without partial retirement. |
| AC-23 | PASS | Concurrent saves allocate unique versions and replay safely. |
| AC-24 | PASS | Supplier selection alone creates no empty Version. |
| AC-25 | PASS | History/sidebar/grid accessibility contracts pass. |
| AC-26 | PASS | Draft-only Source deletion retains dedicated authority and ADR-013. |
| AC-27 | PASS | Published/dependent Source deletion remains denied. |
| AC-28 | PASS | Safe deletion stays append-only and non-cascading. |
| AC-29 | PASS | COMPLETE coverage and applied provenance remain explainable. |

Result: **29/29 PASS**.

## Architecture, authorization and isolation

| Invariant | Result |
| --- | --- |
| DEC-049 owner-scoped ports/repositories | PASS |
| ADR-004 Tenant isolation | PASS |
| Trusted Branch/Station/Session context | PASS |
| Server-derived Apply authority | PASS |
| Transaction connection reuse and atomic effects | PASS |
| Cross-Tenant access | DENIED |
| Role-name authorization | NONE |
| Granular Catalog capabilities | PASS |
| ADR-013 sensitive actions | PASS |
| Secret-safe harness diagnostics | PASS |
| Test/gate weakening | NONE |

## Database and material verification

- PostgreSQL: 18.4, UTC, UTF8, governed linux/amd64 image digest.
- Migrations: 75 ordered unique; first application 75; second application 0;
  pending 0.
- Stage 4: five suites, 17/17 tests, zero critical skips, cleanup PASS.
- PBI-039: 2/2 material tests, cleanup PASS.
- PBI-040: 1/1; 10k lookup p95 `7.55 ms` vs `750 ms` budget.
- PBI-041: 10/10; disposable container removed.
- Preview-like runtime, compiled backend and compiled UI smokes: PASS.

The full PBI-041 10k characterization measured ingest `4,104.9 ms`, Analyze
`436.3 ms`, preview `41.2 ms`, publish `28,723.2 ms`, historical search
`74.8 ms` and heap delta `41.2 MiB`. Publish remains within the unchanged
`30,000 ms` budget.

## Owner-data read-only integrity

Read-only transactions before and after the formal campaign returned the same
state:

- AviCell v3 `INGESTED / COMPLETE`, Batch `APPLIED`, 744 observations;
- 744 outcomes/resolutions: 742 `APPLY / CREATED`, two `EXCLUDE / EXCLUDED`;
- row-411 item `INACTIVE`, version 3;
- Tenant CatalogItems 787: 783 active / four inactive;
- non-AviCell `Aple` pending group remains one;
- local migration journal remains 75.

Owner data, AviCell, Catalog business state and runtime data were not mutated by
this verification.

## Authoritative local gates

| Gate | Result |
| --- | --- |
| Focused diagnostic contracts | PASS — 13/13 |
| Persistence/migration/schema contracts | PASS — 42/42 |
| Owner-scoped exact runner | PASS — 8/8 |
| Owner-scoped composite | PASS — 17/17 |
| Typecheck | PASS |
| Build | PASS |
| Architecture | PASS |
| Base `verify` | PASS — 938 pass / 0 fail / 30 governed material skips |
| Docs links/consistency/secret scan | PASS |

## Single verify:full campaign

Campaign:
`local-full-verification-20260919102126-14fedc9cfb3b`.

| Stage | Result |
| --- | --- |
| 0 Candidate + integration baseline | PASS |
| 1 Toolchain | PASS |
| 2 Repository integrity | PASS |
| 3 Base verify | PASS |
| 4 Material PostgreSQL composite | PASS — 17/17; owner-scoped 8/8 |
| 5 PBI-039 PostgreSQL | PASS |
| 6 PBI-040 PostgreSQL | PASS |
| 7 PBI-041 PostgreSQL | PASS — 10/10 |
| 8 Preview-like PostgreSQL runtime | PASS |
| 9 Compiled-smoke PostgreSQL provision | PASS |
| 10 Compiled backend smoke | PASS |
| 11 Compiled UI smoke | PASS |
| 12 Cleanup proof | PASS |
| 13 Final fingerprint/evidence | PASS |

Candidate fingerprint:
`7325e10b724c81f3f105025e4bf7871422a637897b36fc3403bbd7afb6ecfedf`.

Warnings: `VITE_MAIN_CHUNK_OVER_500_KB`, existing accepted warning. Campaign
reruns: 0. Final verdict: **PASS**.

## Final findings and controls

- Blockers: 0.
- High/Medium/Low findings: 0.
- Conditions: 0.
- `REVIEW-041-001`: RESOLVED.
- `REVIEW-041-002`: RESOLVED.
- `FV2-041-001`: RESOLVED.
- Push / PR update / merge / deploy / force push: not executed.

**NEW INDEPENDENT FORMAL RE-VERIFICATION PASS. NEW CANDIDATE MAY RESUME THE
MASTER GOVERNED DELIVERY AT PUSH / PR UPDATE ONLY UNDER THE SEPARATE OWNER
AUTHORITY ALREADY DEFINED FOR THAT WORKFLOW.**
