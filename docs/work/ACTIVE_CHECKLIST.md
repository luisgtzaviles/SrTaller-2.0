# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: QUALITY — Correct PBI-041 Transaction Budget Enforcement
iteration: 2 - Harness Contract Remediation
type: QUALITY
risk: HIGH
shadow_risk: SENSITIVE
branch: chore/pbi-041-transaction-budget-review
base_sha: 4f3cf8c4ecf4827d7a92ed80386cf7738e6e4cc5
status: READY_FOR_PROMOTION
closure_mode: DERIVED
last_updated: 2026-09-21
-->

## Identity

- **Milestone:** Tenant Lifecycle MVP promotion dependency.
- **Work Unit:** QUALITY — Correct PBI-041 Transaction Budget Enforcement.
- **Sprint:** none.
- **Current PBI:** `NONE`; this is an authorized Quality remediation.
Current PBI: NONE
- **Status:** `READY_FOR_PROMOTION`.
- **Progress:** `6 / 6` remediation blocks complete.
- **Current work:** remediation and required local verification are complete.
- **Next block:** remote promotion only after separate Owner authorization.
- **Blockers:** none. TL-02 remains paused and preserved.
- **Last updated:** 2026-09-21, America/Hermosillo.

## Objective

Correct the PBI-041 harness so a single transaction observation above the
historical 15-second p95 target emits an explicit diagnostic without failing
promotion, while publish above 30 seconds remains a hard failure.

## Why

The accepted historical contract defines transaction duration as a p95
capacity target. The current recurring test incorrectly treats it as an
every-run maximum. Owner accepted the transaction-budget review recommendation
and authorized the minimum harness-contract correction.

## In Scope

- Preserve mandatory 10,000-row publish and transaction measurement.
- Keep publish duration above 30 seconds as a blocking failure.
- Emit `TRANSACTION_CAPACITY_TARGET_EXCEEDED` for a single transaction
  observation above 15 seconds without failing promotion on that fact alone.
- Preserve 15 seconds as the documented historical p95 target.
- Add focused regression coverage for the corrected enforcement.
- Define the future controlled calibration campaign of at least ten runs.
- Run focused checks and one authoritative `verify:full` on the final candidate.

## Out of Scope

- Product behavior, SQL, indexes or deterministic fixture changes.
- Any replacement threshold, retries, averaging or retry-to-green behavior.
- TL-02 changes or resumption, TL-03, push, PR, merge or deploy.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`DEVELOPMENT_AND_DELIVERY_WORKFLOW.md`](../delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md)
- [`PRICE_LIST_ARCHITECTURE.md`](../architecture/PRICE_LIST_ARCHITECTURE.md)
- [`PBI-041`](../backlog/pbis/PBI-041.md)
- [`PBI-041 Test Strategy`](../quality/evidence/pbi-041/TEST_STRATEGY.md)
- [`Transaction Budget Review`](../quality/evidence/pbi-041/TRANSACTION_BUDGET_REVIEW.md)

## Risks

- Accidentally weakening the 30-second publish hard gate.
- Hiding transaction duration instead of preserving it as mandatory evidence.
- Encoding retries or averaging into ordinary promotion.
- Changing product execution while correcting only harness semantics.
- Touching the preserved TL-02 candidate before this dependency is integrated.

## Plan

- [x] Revalidate branch, baseline, Owner decision and TL-02 preservation.
- [x] Implement corrected enforcement and sanitized diagnostic output.
- [x] Add regression tests for publish blocking and transaction p95 semantics.
- [x] Reconcile architecture, PBI, test strategy and Quality evidence.
- [x] Run focused validation and inspect scope.
- [x] Run authoritative `verify:full`, commit and mark promotion readiness.

## Current

The corrected harness is locally verified. It preserves the 30-second blocking
publish gate and always reports the 15-second historical p95 target plus the
current transaction observation. A single target miss produces the required
explicit diagnostic without changing the product execution path.

## Next

Await explicit Owner authority to push this exact candidate and open one remote
review. Do not resume TL-02 before integration and exact-main verification.

## Blockers

None for the authorized remediation. Remote promotion remains unauthorized.

## Important Discoveries

- TL-02 remains preserved at `6ea9d15874acce1c006c204ee70933f15cb5dec1`;
  its product candidate was not modified by this Quality branch.
- The preceding investigation classified the existing gate as
  `JUSTIFIED_BUT_THRESHOLD_UNSUPPORTED` for single-run enforcement.
- The Owner explicitly preserved 15 seconds as a p95 target and 30 seconds as
  the recurring blocking publish limit.
- Focused PostgreSQL executed the unchanged deterministic 10k path once:
  publish 1,494.0 ms and transaction 1,493.5 ms; all 10 material tests passed.
- Full verification exercised the target-miss path without a retry: publish
  21,424.3 ms remained below 30 seconds, transaction 21,423.9 ms emitted
  `TRANSACTION_CAPACITY_TARGET_EXCEEDED`, and Stage 7 remained PASS.
- The delta contains only Quality harness logic, contract tests and canonical
  documentation; no `src/`, application UI, migration, SQL or fixture changed.

## Focused Verification

- [x] Branch, baseline, tracked tree and unrelated `.DS_Store` checked.
- [x] PBI-041 performance contract tests: 6/6 PASS.
- [x] PBI-041 material PostgreSQL suite: 10/10 PASS.
- [x] Relevant bulk contract and architecture/harness tests: PASS.
- [x] Work Unit checker and `git diff --check`: PASS.
- [x] Authoritative `verify:full`: stages 0–13 and cleanup PASS.

## Promotion Gates

- Publish above 30 seconds must continue to fail.
- Transaction timing must remain present and sanitized.
- A single transaction observation above 15 seconds must emit the required
  capacity diagnostic and must not independently fail promotion.
- The final exact candidate must pass authoritative `verify:full`.

## Remote Actions / Authorization

- No push, PR, merge, deploy or remote/infrastructure mutation is authorized.

## Handoff Notes

- Preserve `apps/dev-preview-web/src/.DS_Store` as an unrelated Owner artifact.
- Do not modify or rebase `feature/tl-02-admin-identity-session`.
- Do not run a calibration campaign or retry ordinary verification into green.

## Closure Predicate

The Work Unit reaches `READY_FOR_PROMOTION` when the corrected harness and
canonical documentation are committed, focused tests pass, the exact candidate
passes one authoritative `verify:full`, tracked state is clean and TL-02
remains unchanged. Integration and TL-02 resumption require separate authority.
