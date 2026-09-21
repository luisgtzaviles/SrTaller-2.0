# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: SR Taller Development Harness 2.0 Migration
iteration: 4 - Governance and Source-of-Truth Simplification
type: GOVERNANCE
risk: MEDIUM
shadow_risk: ARCHITECTURAL
branch: chore/development-harness-2
base_sha: 65df515ce3bd9ce9989421e3ade00fc8c1fa383a
status: ACTIVE
closure_mode: DERIVED
last_updated: 2026-09-20
-->

## Identity

- **Work Unit:** SR Taller Development Harness 2.0 Migration.
- **Iteration:** 4 — Governance and Source-of-Truth Simplification.
- **Prior checkpoints:** Iterations 1, 2 and 3 complete in this branch.
- **Type / risk:** Governance; current `MEDIUM`, shadow `ARCHITECTURAL`.
- **Branch / base:** `chore/development-harness-2` from `65df515ce3bd9ce9989421e3ade00fc8c1fa383a`.
- **Status:** `ACTIVE`.
- **Current PBI:** `NONE`; this authorized governance Work Unit does not invent
  a product PBI.
Current PBI: NONE
- **Sprint:** none required; Sprint is optional planning, not this execution
  lifecycle.
- **WIP:** `1/1` Work Unit.
- **Progress:** Iteration 4 `6 / 6` blocks complete.
- **Last updated:** 2026-09-20, America/Hermosillo.

## Objective

Give each operational fact exactly one authority, retire duplicated current
state mechanisms and keep the safety/auditability of the Work Unit harness.

## Why

Git/GitHub/CI/runtime, planning documents and `ACTIVE_CHECKLIST` already answer
different questions. Manual snapshots, candidate states and default closure
documents repeat those facts and drift.

## In Scope

- permanent source-of-truth matrix;
- deprecation of `CURRENT_STATE` as an operational snapshot;
- Work Unit, PBI, optional Sprint, authorization, acceptance, evidence, review
  and closure simplification;
- current entrypoint reconciliation and historical labeling;
- deterministic governance regression tests;
- one local logical Iteration 4 commit.

## Out of Scope

- product, API, architecture, runtime, database, tenancy, auth or security;
- reduction of CI/promotion gates;
- GitHub settings or permissions;
- bulk archival moves or deletion of ADR/DEC/history;
- push, PR, merge, deploy, Dokploy, Staging or Production.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`SOURCE_OF_TRUTH.md`](../delivery/SOURCE_OF_TRUTH.md)
- [`DEVELOPMENT_AND_DELIVERY_WORKFLOW.md`](../delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`DEFINITION_OF_DONE.md`](../delivery/DEFINITION_OF_DONE.md)
- [`BRANCH_POLICY.md`](../delivery/BRANCH_POLICY.md)
- [DEC-051](../decisions/dec-051-testing-ci-strategy/DECISION_PROPOSAL.md)
- [DEC-063](../decisions/dec-063-definition-of-done/DECISION_PROPOSAL.md)

## Risks

- confusing historical evidence with current policy;
- deleting useful history while removing duplication;
- weakening technical gates through prose changes;
- making roadmap, PBI or Sprint an implementation-state mirror;
- losing the Owner's unrelated `.DS_Store`.

## Plan

- [x] Verify branch, expected HEAD, origin/main, tracked tree and Work Unit.
- [x] Build the authority matrix and classify `CURRENT_STATE` responsibilities.
- [x] Simplify lifecycle, DoD, authorization, acceptance, evidence and closure.
- [x] Reconcile entrypoints and label historical/deprecated governance.
- [x] Add/run deterministic regressions and proportional documentation checks.
- [x] Review complete diff and prepare one local logical commit.

## Current

The source matrix, deprecated `CURRENT_STATE` pointer, simplified DoD/lifecycle,
entrypoint reconciliation and deterministic enforcement are materialized and
validated. The local logical commit is the remaining mechanical handoff step.

## Next

Create the authorized local commit and stop for Owner review. Remote promotion
is outside this iteration.

## Blockers

None.

## Important Discoveries

- `CURRENT_STATE` had no unique permanent responsibility: its content was
  derivable from Git/GitHub/runtime or owned by roadmap/PBI/contracts.
- The current workflow embedded a second volatile snapshot and a mandatory
  Sprint/PBI/acceptance narrative even for non-product Work Units.
- Historical audits and proposals contained useful evidence but needed explicit
  classification so they could not override current policy.
- Environment provenance is the correct authority for deployed artefacts; its
  remaining automation gap must be visible, not filled by another snapshot.
- The former DOCS_ONLY consistency check itself enforced duplicate PBI pointers
  across `CURRENT_STATE`, roadmap, Sprint and checklist; it now verifies the
  authority matrix plus the active Work Unit instead.

## Focused Verification

- [x] Work Unit checker: `PASS`.
- [x] Governance, discovery, workflow and Work Unit regressions: `24/24 PASS`.
- [x] Markdown relative links: `4195` checked, `PASS`.
- [x] Documentation consistency: deprecated state pointer, source matrix and
  Current PBI `NONE`, `PASS`.
- [x] Typecheck: `PASS`.
- [x] Architecture and UI checks: `PASS` / `PASS`.
- [x] Secret-pattern scan over added lines: `PASS`.
- [x] `git diff --check`: `PASS`.
- [x] Risk comparison: current `CROSS_MODULE_HIGH_RISK`, shadow
  `ARCHITECTURAL`, enforced/future pipeline `FULL`, gates reduced `false`.

## Promotion Gates

- This iteration does not execute final promotion verification.
- Existing CI classification and full promotion gates remain unchanged.
- PR, CI, merge and environment validation are not part of this checkpoint.

## Remote Actions / Authorization

- Local documentation, regression test and logical commit are authorized.
- Push, PR, merge, deploy, GitHub settings and permission changes are forbidden.

## Handoff Notes

- Preserve `apps/dev-preview-web/src/.DS_Store` untracked.
- Current facts must be queried from their authority, not copied into a new
  catch-all status file.
- Historical PBI/Sprint/evidence families remain intact and are not current
  operational policy.

## Closure Predicate

Iteration 4 reaches its local checkpoint when one authority exists per fact,
`CURRENT_STATE` cannot be mistaken for current truth, current workflow uses
observable promotion facts without duplicate evidence or a named reviewer
identity, regression checks pass, and one local commit exists. The Work Unit
remains `ACTIVE`; no remote promotion is inferred.
