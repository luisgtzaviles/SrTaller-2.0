# Active Work Unit Checklist

## Identity

- **Work Unit:** SR Taller Development Harness 2.0 Migration.
- **Iteration:** 1 — Operational Foundation.
- **Type:** Governance / documentation architecture.
- **Risk:** Medium under the current DEC-063 model; delivery contracts change,
  so the existing classifier is expected to fail closed to full promotion.
- **Branch:** `chore/development-harness-2`.
- **Base SHA:** `65df515ce3bd9ce9989421e3ade00fc8c1fa383a`.
- **Status:** `ACTIVE`.
- **Current PBI:** `NONE` — this is an explicitly authorized governance Work
  Unit and does not start a product PBI.
Current PBI: NONE
- **Sprint:** none active; SPRINT-03 remains `Closed`.
- **WIP:** `1/1` operational Work Unit; product PBI WIP remains `0/1`.
- **Progress:** `7 / 7` blocks complete for Iteration 1.
- **Last updated:** 2026-09-20, America/Hermosillo.

## Objective

Establish the first operational foundation of Development Harness 2.0 so the
repository itself can transfer one coherent branch between agents or a human
without depending on chat history.

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
- one local logical commit if the iteration is coherent.

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

## Current

Iteration 1 is coherent and committed locally. The Work Unit remains `ACTIVE`
because PR, promotion and closure are outside this checkpoint.

## Next

Owner review of Iteration 1, followed only by a separately authorized Iteration
2 or promotion step.

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
- `TRACEABILITY_MODEL.md` remains a proposal and cannot override the accepted
  one-candidate/exceptional-closure-PR policy.

## Focused Verification

- [x] `git diff --check`.
- [x] Markdown relative-link validation: 264 links checked.
- [x] documentation policy consistency: SPRINT-03 / Current PBI `NONE`.
- [x] secret-pattern scan over added lines: PASS.
- [x] workflow change classification: `CROSS_MODULE_HIGH_RISK`, enforced
  pipeline `FULL`, classifier mode `SHADOW`.
- [x] tracked scope contains nine Markdown files only.

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

Iteration 1 reaches its local checkpoint when the authorized documentation is
coherent, proportional checks pass and one local logical commit exists. The
Work Unit itself remains active after that checkpoint; PR, CI, review, merge,
environment validation and branch cleanup are not part of this iteration and
must not be inferred.
