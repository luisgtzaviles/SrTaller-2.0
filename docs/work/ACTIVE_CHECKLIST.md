# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: SR Taller Development Harness 2.0 Migration
iteration: 3 - Engineering and UI Discovery Harness
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
- **Iteration:** 3 — Engineering & UI Discovery Harness; Iterations 1 and 2
  complete.
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
- **Progress:** Iteration 1 `7 / 7`; Iteration 2 `7 / 7`; Iteration 3 `7 / 7`
  blocks complete.
- **Last updated:** 2026-09-20, America/Hermosillo.

## Objective

Make architecture, module, SaaS, persistence, testing and UI reuse conventions
discoverable to a fresh agent without changing product behavior or weakening
any accepted gate.

## Why

The repository has strong contracts and enforcement, but a fresh agent must
currently reconstruct the implementation path from several decisions, source
trees and quality documents. Iteration 3 adds concise routing and inventories;
it does not create a second architecture.

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
- a code-verified catalog of existing UI components and foundations;
- a minimal module-creation route covering boundaries, tenancy, persistence,
  authorization, errors, UI and proportional verification;
- deterministic discovery-contract regressions where they are safe;
- a no-code Customers-module dry run proving the route is sufficient;
- one local logical Iteration 3 commit.

## Out of Scope

- product, API, application architecture, persistence, schema or runtime;
- tenancy, auth, permissions or design-system implementation;
- CI behavior or reduced gates;
- GitHub settings or `empresasgalatech` permissions;
- retirement/deletion of historical documentation or `CURRENT_STATE.md`;
- product behavior, UI redesign or replacement of working page controls;
- a new module, endpoint, migration, capability or persistence write;
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
- [x] Reconfirm Iteration 2 HEAD, branch, base and tracked-clean state.
- [x] Audit fresh-agent discovery, implementation structure and UI primitives.
- [x] Materialize the component catalog and module-creation route.
- [x] Add focused deterministic discovery-contract regressions.
- [x] Dry-run a hypothetical Customers addition without implementation.
- [x] Run proportional Iteration 3 validation and review the complete delta.
- [x] Create one local logical Iteration 3 commit.

## Current

The component catalog, module-creation route, enforcement matrix, testing map,
Customers dry run and deterministic discovery regression are materialized and
validated. The single local Iteration 3 commit exists; the Work Unit remains
active for Owner review.

## Next

Owner review of Iteration 3, followed only by a separately authorized promotion
step or Harness iteration.

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
- Module boundaries are mechanically defined by
  `architecture/dec-005-policy.json`, but the physical creation path was only
  discoverable by combining that policy, accepted decisions and existing code.
- Shared React primitives are implemented and broadly consumed, but no
  operational component catalog listed their exact exports and reuse path.
- The design-system document still described implementation as unauthorized
  even though PBI-030 is integrated and `Done`.
- `TESTING_STRATEGY.md` remains useful taxonomy but still says `Propuesta`;
  accepted DEC-051/DEC-063 and current `package.json` scripts govern actual
  gates.
- A blanket ban on native page controls would be unsafe: the Composer and
  autocomplete contain specialized grid/listbox behavior. Standard controls
  should reuse shared primitives; exceptions require semantic justification
  and remain human-review territory.
- The exact Customers dry run stops on two legitimate product decisions: the
  current minimum is branch-scoped while optional Branch association is not
  decided, and no Customers-list capability exists. The harness exposes both
  rather than inventing them; neither blocks completion of Iteration 3.

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

Iteration 3:

- [x] Work Unit checker preflight: `PASS` at `71892027ba995784f41ed7a55ba874fc7b869019`.
- [x] Fresh-agent discovery audit: complete; three material routing gaps found.
- [x] Discovery-contract regressions: `3/3 PASS`.
- [x] Combined discovery/UI focused regressions: `18/18 PASS`.
- [x] UI foundation checker: `PASS`.
- [x] Typecheck: `PASS`.
- [x] DEC-005 architecture verification: `PASS`.
- [x] Markdown relative links: 226 checked, `PASS`.
- [x] Documentation consistency scan: `PASS`.
- [x] Secret-pattern scan: `PASS`.
- [x] `git diff --check`: `PASS`.
- [x] Final Work Unit checker: `PASS`; status remains `ACTIVE`.
- [x] Risk comparison remains shadow-only: current `CROSS_MODULE_HIGH_RISK`,
  proposed `ARCHITECTURAL`, gates reduced `false`.
- [x] Product/runtime/DB/schema changes: none.

## Promotion Gates

- Existing classifier determines the enforced pipeline; this Work Unit does
  not grant a reduced route.
- Required promotion verification has not been executed in this iteration.
- PR, authoritative CI, review, merge and exact-main verification remain
  pending and require their existing authority.

## Remote Actions / Authorization

- The existing branch and one local Iteration 3 commit are authorized.
- Push, PR, merge, deploy, GitHub settings and infrastructure changes are not
  authorized.

## Handoff Notes

- Preserve `.DS_Store`; do not add or delete it.
- Do not retire `CURRENT_STATE.md` or historical documentation in this
  iteration.
- Iteration 3 must leave reusable routing in permanent documentation rather
  than storing engineering conventions only in this checklist.

## Closure Predicate

Iteration 3 reaches its local checkpoint when a fresh agent can discover the
actual component inventory and the complete module path; the Customers dry run
does not require architectural invention; deterministic routing checks and
proportional validation pass; and one local logical commit exists. The Work
Unit remains active afterward. PR, CI, review, merge, environment validation
and branch cleanup are not part of this iteration and must not be inferred.
