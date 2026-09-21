# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: HARNESS — Fix Post-Merge Work Unit Snapshot Lifecycle
iteration: 1 - Lifecycle Defect Remediation
type: GOVERNANCE
risk: ARCHITECTURAL
shadow_risk: ARCHITECTURAL
branch: fix/harness-post-merge-snapshot-lifecycle
base_sha: 46ce91bc6fe0fe70362ceee730db688aa307d781
status: READY_FOR_PROMOTION
closure_mode: DERIVED
last_updated: 2026-09-21
-->

## Identity

- **Milestone:** Development Harness 2.0 lifecycle remediation.
- **Work Unit:** HARNESS — Fix Post-Merge Work Unit Snapshot Lifecycle.
- **Sprint:** none; this is an authorized governance remediation.
- **Current PBI:** `NONE`; TL-02 remains closed and TL-03 is not started.
Current PBI: NONE
- **Status:** `READY_FOR_PROMOTION`; the local candidate is frozen for its
  exact-HEAD promotion verification.
- **Progress:** `7 / 7` local Work Unit blocks complete.
- **Current work:** exact-candidate revalidation after the deliberate remote
  promotion review strengthened exact-main binding.
- **Next block:** update the existing Draft PR and require fresh authoritative
  CI on the remediated HEAD.
- **Blockers:** none.
- **Last updated:** 2026-09-21, America/Hermosillo.

## Objective

Make post-merge Work Unit closure mechanically truthful without making feature
branches claim `IDLE`, weakening validation or requiring a routine second PR.

## Why

TL-02 is materially closed by its authorized merge and exact-main CI, but its
landed `ACTIVE` snapshot makes explicit `MAIN` validation fail and blocks safe
initialization of the next authorized Work Unit.

## In Scope

- Reproduce and explain the missing feature-to-main lifecycle transition.
- Evaluate deterministic repository-native closure designs.
- Update only the Work Unit checker, initializer/closure tooling, contracts and
  regression coverage required by the selected design.
- Repair the current invalid main snapshot through this governed remediation.

## Out of Scope

- TL-02 product changes or reopening TL-02.
- Starting TL-03 or another product Work Unit.
- Product architecture, database, deploy, GitHub configuration or unrelated
  cleanup.
- Accepting `ACTIVE` as a valid main snapshot or weakening existing gates.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`DEVELOPMENT_AND_DELIVERY_WORKFLOW.md`](../delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md)
- [`SOURCE_OF_TRUTH.md`](../delivery/SOURCE_OF_TRUTH.md)
- [`DEFINITION_OF_DONE.md`](../delivery/DEFINITION_OF_DONE.md)

## Risks

- A false `IDLE` can hide failed merge or exact-main verification.
- Branch-local or uncommitted state can break handoff across agents/clones.
- Automatic post-merge mutation can recreate closure commits or bypass review.
- Relaxing `MAIN` validation can conceal the original defect.

## Plan

- [x] Confirm TL-02 material closure and reproduce `INVALID_MAIN_SNAPSHOT`.
- [x] Trace the missing transition and evaluate the minimum viable designs.
- [x] Implement the selected lifecycle/checker/tooling change.
- [x] Add full deterministic lifecycle regressions.
- [x] Prove valid main closure and next-Work-Unit preconditions without starting
  TL-03.
- [x] Run proportional architectural checks and deliberate review.
- [x] Set this Work Unit `READY_FOR_PROMOTION` and stop before remote actions.

## Current

The deterministic closure-ref design, fail-closed PR/main validation, shared
publication command, contracts and regressions are complete. Deliberate review
also bound closure to the live remote `main` ref and to an authoritative run
whose `headBranch` is exactly `main`; the remediated tree now requires its
single exact-candidate full promotion run.

## Next

Run the exact-candidate full promotion verification, update the existing Draft
PR normally and require fresh authoritative CI. Stop before merge.

## Blockers

None. The Owner explicitly authorized this one remediation to replace the
invalid landed snapshot and correct the lifecycle contract.

## Important Discoveries

- GitHub merges the tracked branch snapshot unchanged; no current step converts
  branch-operational state into a valid main representation.
- The initializer correctly rejects replacing `ACTIVE`, so the invalid main
  snapshot blocks the next Work Unit even though TL-02 is materially closed.
- TL-02 remains closed; this is a Harness defect, not product remediation.
- A deterministic annotated Git tag can preserve the reviewed branch snapshot
  while recording closure only after the ordinary merge and exact-main CI.
- PR CI must reject `ACTIVE`; otherwise an unclosable snapshot can land before
  the post-merge predicate is eligible.
- Exact SHA matching alone does not prove an exact-`main` run because the same
  commit can be the head of another CI-enabled branch; closure now requires
  `headBranch: main` explicitly.
- A stale local `origin/main` cache cannot prove synchronization with the
  authoritative remote; closure now also reads live `refs/heads/main`.

## Focused Verification

- [x] PR #64 merge and exact-main authoritative CI revalidated.
- [x] `work-unit:check --mode MAIN` reproduced `INVALID_MAIN_SNAPSHOT`.
- [x] Work Unit lifecycle regression suite: 14/14 PASS.
- [x] Governance/source-of-truth regressions: 4/4 PASS.
- [x] Explicit main-mode and next-start precondition proofs.
- [x] Typecheck, architecture, docs links/consistency/secret scan and
  `git diff --check`.
- Exact-candidate full promotion verification remains authoritative and is not
  copied into Markdown as mutable command evidence.

## Promotion Gates

- Risk is `ARCHITECTURAL`; current full promotion verification and deliberate
  architectural review remain mandatory.
- The selected design must fail closed for unmerged or failed exact-main work.
- Owner authorized ordinary branch push and one Draft PR for this Work Unit.
- Merge and deploy remain unauthorized.

## Remote Actions / Authorization

- No push, PR, merge or deploy is authorized yet.
- Promotion must stop locally at `READY_FOR_PROMOTION` for Owner authorization.

## Handoff Notes

- Preserve `apps/dev-preview-web/src/.DS_Store` as an unrelated Owner artifact.
- Do not modify TL-02 product functionality or start TL-03.
- Do not solve the defect by accepting `ACTIVE` on `main`.

## Closure Predicate

This Harness Work Unit closes only after its reviewed fix is merged, exact-main
CI is green, main derives a valid effective `IDLE` state without a routine
closure PR, and the absorbed branch has no exclusive commits. No deploy is
required.
