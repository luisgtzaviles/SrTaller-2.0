# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: SR Taller Development Harness 2.0 Migration
iteration: 5 - Promotion Readiness and GitHub Enforcement Preparation
type: GOVERNANCE
risk: MEDIUM
shadow_risk: ARCHITECTURAL
branch: chore/development-harness-2
base_sha: 65df515ce3bd9ce9989421e3ade00fc8c1fa383a
status: READY_FOR_PROMOTION
closure_mode: DERIVED
last_updated: 2026-09-20
-->

## Identity

- **Work Unit:** SR Taller Development Harness 2.0 Migration.
- **Iteration:** 5 — Promotion Readiness and GitHub Enforcement Preparation.
- **Prior checkpoints:** Iterations 1–4 complete on this branch.
- **Type / risk:** Governance; current `MEDIUM`, shadow `ARCHITECTURAL`.
- **Branch / base:** `chore/development-harness-2` from `65df515ce3bd9ce9989421e3ade00fc8c1fa383a`.
- **Status:** `READY_FOR_PROMOTION`; no push or PR has occurred.
- **Current PBI:** `NONE`; this is an authorized governance Work Unit.
Current PBI: NONE
- **Sprint:** not required; no product Sprint is started.
- **WIP:** `1/1` Work Unit.
- **Progress:** Iteration 5 `7 / 7` blocks complete.
- **Last updated:** 2026-09-20, America/Hermosillo.

## Objective

Prove the complete Harness 2.0 candidate is internally coherent and ready for
its first governed PR, while defining a safe GitHub protection configuration
without changing remote settings.

## Why

The branch now changes operational contracts and executable governance. Before
promotion it needs the current full gate, fresh-agent acceptance and one
always-resolving authoritative GitHub check suitable for future protection.

## In Scope

- audit the complete `origin/main...HEAD` delta;
- reconcile final active-governance contradictions;
- normal and sensitive fresh-agent dry runs;
- current FULL local promotion verification;
- an always-resolving, non-reductive aggregate CI check if required;
- read-only GitHub capability, checks, collaborators and settings inspection;
- exact main-protection design and concise promotion procedure;
- one final local readiness commit if repository changes are needed.

## Out of Scope

- product, application architecture, database, tenancy/auth/security behavior;
- reducing CI or replacing the current classifier with the shadow model;
- push, PR, merge, deploy, branch deletion or GitHub settings mutation;
- collaborator permission changes;
- Dokploy, Staging, Production or infrastructure mutation.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`SOURCE_OF_TRUTH.md`](../delivery/SOURCE_OF_TRUTH.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`DEVELOPMENT_AND_DELIVERY_WORKFLOW.md`](../delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md)
- [`DEFINITION_OF_DONE.md`](../delivery/DEFINITION_OF_DONE.md)
- [`BRANCH_POLICY.md`](../delivery/BRANCH_POLICY.md)
- [`RISK_CLASSIFICATION.md`](../delivery/RISK_CLASSIFICATION.md)
- [`MAIN_BRANCH_PROTECTION_CONTRACT.md`](../delivery/MAIN_BRANCH_PROTECTION_CONTRACT.md)
- [DEC-051](../decisions/dec-051-testing-ci-strategy/DECISION_PROPOSAL.md)
- [DEC-063](../decisions/dec-063-definition-of-done/DECISION_PROPOSAL.md)

## Risks

- requiring a conditional/skipped job and blocking legitimate PR classes;
- reducing gates while adding an aggregate result;
- treating GitHub capability design as already configured;
- hiding a current-policy contradiction inside historical documents;
- changing remote settings or the Owner's collaborator permissions;
- losing the unrelated `.DS_Store`.

## Plan

- [x] Verify branch, expected HEAD, origin/main, Work Unit and tracked tree.
- [x] Audit the complete branch delta and current governance consistency.
- [x] Materialize/test the aggregate check and exact protection/procedure.
- [x] Run both fresh-agent acceptance dry runs.
- [x] Run the authoritative FULL local promotion verification.
- [x] Reconcile checklist and review final candidate.
- [x] Create one local readiness commit if changes exist.

## Current

The complete local candidate is coherent and promotion-ready. The aggregate
check, exact proposed ruleset and promotion/Preview boundary are materialized;
both fresh-agent dry runs and the authoritative FULL campaign pass.

## Next

Stop for the Owner's explicit decision whether to push the branch and open its
first governed PR. Ruleset activation remains a later, separate decision.

## Blockers

None. Remote promotion and protection activation remain intentionally pending
Owner authorization.

## Important Discoveries

- Complete branch delta: 4 commits, 39 files, 2,530 insertions and 1,893
  deletions; no product/runtime/database file changed.
- Current checks are `Governed change classification`, `DOCS_ONLY fail-closed`,
  `VC-024 run-1`, `VC-024 run-2` and `VC-024 comparison`.
- Full and DOCS_ONLY jobs are mutually conditional; no existing check both
  represents the selected authoritative path and always resolves.
- GitHub reports a public user-owned repository, `main` unprotected, zero
  rulesets, Owner `ADMIN`, and `empresasgalatech` `write`.
- Repository merge settings currently allow merge commit, squash and rebase;
  automatic branch deletion is disabled; merge queue is unavailable.

## Focused Verification

- [x] Aggregate workflow regression: `PASS`.
- [x] Work Unit, governance and engineering-discovery regressions: `30/30 PASS`.
- [x] Documentation links/consistency and secret scan: `PASS` (`682` Markdown
  files and `4,197` relative links checked).
- [x] Typecheck, architecture, UI and build: `PASS` through the canonical full
  campaign.
- [x] Current authoritative `verify:full`: all 14 stages `PASS`; PostgreSQL
  composite `17/17`, PBI-039 `2/2`, PBI-040 `1/1`, PBI-041 `10/10`, 75
  migrations and second run `0 pending`; cleanup `PASS`.
- [x] `git diff --check`: `PASS`; final tracked tree is committed and clean.

## Promotion Gates

- The active classifier still requires `FULL`; shadow risk is
  `ARCHITECTURAL` and reduces no gate.
- No PR exists. `PROMOTION`, remote CI, review, merge and exact-main remain
  pending.
- Proposed required check must pass both selected paths and cannot mask a
  failed/skipped prerequisite.

## Remote Actions / Authorization

- Read-only GitHub inspection is authorized and complete for current settings.
- Local fixes, tests and one readiness commit are authorized.
- Push, PR, merge, deploy, ruleset/protection and permission changes are not
  authorized in this iteration.

## Handoff Notes

- Preserve `apps/dev-preview-web/src/.DS_Store` untracked.
- `empresasgalatech` may participate but is not an active workflow dependency.
- Preview deployment is manual and only occurs under separate authorization.

## Closure Predicate

Iteration 5 reaches `READY_FOR_PROMOTION` only after the complete branch passes
the current FULL local gate; both fresh-agent tests pass; the aggregate CI
contract is regression-protected; GitHub capabilities and proposed protection
are explicit; the final tracked tree is clean; and any Iteration 5 changes are
committed locally. Push/PR are a later Owner decision and do not occur here.
