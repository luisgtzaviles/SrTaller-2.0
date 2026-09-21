# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: SR Taller Development Harness 2.0 Migration
iteration: 2 - Work Unit Enforcement
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
- **Iteration:** 2 — Work Unit Enforcement; Iteration 1 complete.
- **Type:** Governance / documentation architecture.
- **Risk:** Medium under the current DEC-063 model. Harness 2.0 shadow risk is
  `ARCHITECTURAL`; current policy remains authoritative and requires full
  promotion.
- **Branch:** `chore/development-harness-2`.
- **Base SHA:** `65df515ce3bd9ce9989421e3ade00fc8c1fa383a`.
- **Status:** `ACTIVE`.
- **Current PBI:** `NONE` — this is an explicitly authorized governance Work
  Unit and does not start a product PBI.
Current PBI: NONE
- **Sprint:** none active; SPRINT-03 remains `Closed`.
- **WIP:** `1/1` operational Work Unit; product PBI WIP remains `0/1`.
- **Progress:** Iteration 1 `7 / 7`; Iteration 2 `7 / 7` blocks complete.
- **Last updated:** 2026-09-20, America/Hermosillo.

## Objective

Make the Work Unit contract mechanically useful through deterministic local
validation and safe initialization, without reducing any accepted gate.

## Why

The technical harness is strong, but the former checklist accumulated hundreds
of lines of historical state and several entrypoints duplicated stale Git/CI
facts. A concise Work Unit contract is needed before simplifying further
governance.

## In Scope

- concise operational `AGENTS.md`;
- Work Unit definition and lifecycle;
- truthful `ACTIVE_CHECKLIST` contract and current Work Unit;
- minimal documentation routing and directly conflicting operational pointers;
- focused documentation/governance validation;
- deterministic Work Unit checker and tests;
- safe checklist initialization command with explicit Git preconditions;
- shadow-only risk comparison and future branch-protection design;
- local preflight integration that preserves all existing checks;
- one local logical Iteration 2 commit if the result is coherent.

## Out of Scope

- product, API, application architecture, persistence, schema or runtime;
- tenancy, auth, permissions or design-system implementation;
- CI behavior or reduced gates;
- GitHub settings or `empresasgalatech` permissions;
- retirement/deletion of historical documentation or `CURRENT_STATE.md`;
- Staging, Production, Dokploy, deploy or self-hosted runners;
- push, PR or merge at this intermediate checkpoint.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`DEVELOPMENT_AND_DELIVERY_WORKFLOW.md`](../delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md)
- [`DEFINITION_OF_DONE.md`](../delivery/DEFINITION_OF_DONE.md)
- [`BRANCH_POLICY.md`](../delivery/BRANCH_POLICY.md)
- [`DEVELOPMENT_WORKFLOW_EFFICIENCY_DECISIONS.md`](../delivery/DEVELOPMENT_WORKFLOW_EFFICIENCY_DECISIONS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`RISK_CLASSIFICATION.md`](../delivery/RISK_CLASSIFICATION.md)
- [`MAIN_BRANCH_PROTECTION_CONTRACT.md`](../delivery/MAIN_BRANCH_PROTECTION_CONTRACT.md)
- [DEC-051](../decisions/dec-051-testing-ci-strategy/DECISION_PROPOSAL.md)
- [DEC-063](../decisions/dec-063-definition-of-done/DECISION_PROPOSAL.md)

## Risks

- accidentally superseding accepted PBI/Sprint/DoD policy;
- presenting a proposed risk model as accepted;
- making the checklist claim `IDLE` before merge;
- duplicating volatile Git/CI state in permanent docs;
- broadening this iteration into CI, environment or mass-document migration;
- losing unrelated `.DS_Store` or historical material.

## Plan

- [x] Verify `main`, `origin/main`, worktree and branch availability.
- [x] Create `chore/development-harness-2` from current `origin/main`.
- [x] Read the required entrypoints, delivery contracts and accepted decisions.
- [x] Materialize Work Unit lifecycle, checklist contract and concise routing.
- [x] Reconcile directly related stale/contradictory entrypoints only.
- [x] Run proportional documentation/governance checks.
- [x] Review diff and create one local logical commit.
- [x] Reconfirm Iteration 1, branch, base and clean tracked state.
- [x] Define and implement the Work Unit machine contract.
- [x] Add deterministic checker and initializer regression tests.
- [x] Materialize the shadow risk comparison and branch-protection design.
- [x] Integrate Work Unit validation into local development preflight.
- [x] Run proportional Iteration 2 validation and review the complete delta.
- [x] Create one local logical Iteration 2 commit.

## Current

Iteration 1 is coherent and committed locally. Iteration 2 machine contract,
checker, safe initializer, regression tests, shadow risk comparison, protection
design and preflight integration are complete and validated. This checklist
reconciliation lands atomically with the single Iteration 2 commit.

## Next

Owner review of Iteration 2, followed only by a separately authorized promotion
step or next Harness iteration.

## Blockers

None.

## Important Discoveries

- The previous checklist was 758 lines and contained the history of many
  completed PBI-041 checkpoints rather than one active objective.
- `main` and `origin/main` were equal at the base SHA; only the Owner's
  untracked `apps/dev-preview-web/src/.DS_Store` existed.
- Existing accepted policy still uses low/medium/high risk and keeps the
  general classifier in shadow mode. Iteration 1 must not activate a new risk
  classifier or reduce promotion gates.
- A trustworthy focused-verification selector cannot yet infer sufficient test
  coverage from changed paths. Iteration 2 will document this decision instead
  of introducing a misleading `verify:focused` command.
- Branch protection plan capabilities, aggregate check naming, admin bypass and
  recovery behavior require later verification/Owner decisions before any
  GitHub enforcement is authorized.
- Local preflight remained `PASS`; it reported the preexisting running local
  runtime as `STALE_OR_UNVERIFIABLE`, an advisory because Owner QA/runtime
  validation was not requested by this governance-only iteration.
- `TRACEABILITY_MODEL.md` remains a proposal and cannot override the accepted
  one-candidate/exceptional-closure-PR policy.

## Focused Verification

Iteration 1:

- [x] `git diff --check`.
- [x] Markdown relative-link validation: 264 links checked.
- [x] documentation policy consistency: SPRINT-03 / Current PBI `NONE`.
- [x] secret-pattern scan over added lines: PASS.
- [x] workflow change classification: `CROSS_MODULE_HIGH_RISK`, enforced
  pipeline `FULL`, classifier mode `SHADOW`.
- [x] tracked scope contains nine Markdown files only.

Iteration 2:

- [x] Work Unit checker against the active branch: `PASS`.
- [x] checker, initializer and risk comparison regressions: 8/8 `PASS`.
- [x] related workflow/classifier regressions: 20/20 `PASS`.
- [x] development preflight: `PASS`; Work Unit sub-check `PASS`.
- [x] typecheck: `PASS`.
- [x] architecture verification: `PASS`.
- [x] Markdown relative links: 154 checked, `PASS`.
- [x] documentation policy consistency: SPRINT-03 / Current PBI `NONE`.
- [x] secret-pattern scan over changed and new files: `PASS`.
- [x] `git diff --check`: `PASS`.
- [x] current classifier: `CROSS_MODULE_HIGH_RISK`, enforced pipeline `FULL`;
  Harness 2.0 shadow: `ARCHITECTURAL`; gates reduced: `false`.

## Promotion Gates

- Existing classifier determines the enforced pipeline; this Work Unit does
  not grant a reduced route.
- Required promotion verification has not been executed in this iteration.
- PR, authoritative CI, review, merge and exact-main verification remain
  pending and require their existing authority.

## Remote Actions / Authorization

- Branch creation and one local commit are authorized.
- Push is optional only for a coherent checkpoint; no push is planned now.
- PR, merge, deploy, GitHub settings and infrastructure changes are not
  authorized in Iteration 1.

## Handoff Notes

- Preserve `.DS_Store`; do not add or delete it.
- Do not retire `CURRENT_STATE.md` or historical documentation in this
  iteration.
- A future Iteration 2 should automate/check the Work Unit contract before
  simplifying existing governance.

## Closure Predicate

Iteration 2 reaches its local checkpoint when the machine contract, checker,
safe initializer, regression tests, shadow risk comparison, protection design
and preflight integration are coherent; proportional checks pass; and one
local logical commit exists. The Work Unit remains active afterward. PR, CI,
review, merge, environment validation and branch cleanup are not part of this
iteration and must not be inferred.
