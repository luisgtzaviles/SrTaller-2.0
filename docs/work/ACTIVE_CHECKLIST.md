# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: QUALITY — Validate PBI-041 Transaction Performance Budget
iteration: 1 - Contract Investigation
type: QUALITY
risk: HIGH
shadow_risk: SENSITIVE
branch: chore/pbi-041-transaction-budget-review
base_sha: 4f3cf8c4ecf4827d7a92ed80386cf7738e6e4cc5
status: ACTIVE
closure_mode: DERIVED
last_updated: 2026-09-21
-->

## Identity

- **Milestone:** Tenant Lifecycle MVP promotion dependency.
- **Work Unit:** QUALITY — Validate PBI-041 Transaction Performance Budget.
- **Sprint:** none.
- **Current PBI:** `NONE`; this is a Quality investigation dependency.
Current PBI: NONE
- **Status:** `ACTIVE`.
- **Progress:** `1 / 7` investigation blocks complete.
- **Current work:** trace the origin, authority and evidence behind the
  15-second PostgreSQL transaction gate.
- **Next block:** compare historical requirements, measurement boundaries and
  prior observations before deciding whether a bounded diagnostic is needed.
- **Blockers:** none for the investigation; TL-02 remains paused and preserved.
- **Last updated:** 2026-09-21, America/Hermosillo.

## Objective

Determine whether the PBI-041 PostgreSQL transaction duration of at most 15
seconds is justified, correctly measured and independently valuable as a hard
promotion gate.

## Why

The reconciled TL-02 candidate passes its own focused and material checks, but
PBI-041 published within 30 seconds while its nearly identical transaction
measurement exceeded the newly introduced 15-second budget. Authority and
evidence for that stricter boundary must be established before remediation.

## In Scope

- Trace the commit, documents and code that introduced the 15-second limit.
- Reconstruct the accepted historical PBI-041 performance requirement.
- Inspect publish and transaction measurement boundaries.
- Review the evidence and sampling behind the prior Quality remediation.
- Run only a small bounded diagnostic campaign if repository evidence is
  insufficient to answer the contract question.
- Classify the independent value of the transaction gate and recommend the
  smallest correct governed contract.

## Out of Scope

- Product, SQL or index optimization.
- Changing, removing or relaxing either performance threshold.
- Repeated execution until a green observation appears.
- TL-02 changes, TL-03, push, PR, merge, deploy or infrastructure changes.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`DEVELOPMENT_AND_DELIVERY_WORKFLOW.md`](../delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md)
- [`PRICE_LIST_ARCHITECTURE.md`](../architecture/PRICE_LIST_ARCHITECTURE.md)
- [`PBI-041`](../backlog/pbis/PBI-041.md)
- [`PBI-041 Performance Gate Stabilization`](../quality/evidence/pbi-041/PERFORMANCE_GATE_STABILIZATION.md)

## Risks

- Treating current code as authority could legitimize an unsupported limit.
- Selecting only fast samples could hide ordinary environmental variance.
- Retrying until green would turn diagnosis into misleading promotion proof.
- Changing policy during the audit would bypass Owner authority.
- Touching TL-02 would break preservation of the functionally green candidate.

## Plan

- [x] Pause and preserve TL-02 on its reconciled branch.
- [~] Trace the 15-second requirement and classify its authority.
- [ ] Reconstruct the historical PBI-041 performance contract.
- [ ] Compare publish and transaction measurement boundaries.
- [ ] Assess prior evidence quality and current variance.
- [ ] Run one bounded diagnostic campaign only if needed.
- [ ] Record classification, recommendation and required Owner decision.

## Current

TL-02 is frozen on its own branch after a material PBI-041 transaction result
of 20.534 seconds against 15 seconds; its publish duration remained inside the
historical 30-second budget. This Quality branch starts from current `main` and
contains no TL-02 implementation.

## Next

Use Git history, accepted contracts, test code and existing evidence to
determine when and why the transaction limit appeared and whether it protects a
distinct performance failure mode.

## Blockers

None for read-only investigation. Any policy change or product remediation
requires a new explicit Owner decision after the evidence is reported.

## Important Discoveries

- TL-02 is preserved at `6ea9d15874acce1c006c204ee70933f15cb5dec1`.
- The Quality Work Unit starts from integrated `main`
  `4f3cf8c4ecf4827d7a92ed80386cf7738e6e4cc5`.
- The observed failing publish and transaction measurements were effectively
  identical; the cause and contract value remain under investigation.

## Focused Verification

- [x] Branch, baseline, tracked tree and unrelated `.DS_Store` checked.
- [x] TL-02 branch frozen before starting the Quality Work Unit.
- [ ] Git history and accepted-contract trace.
- [ ] Measurement-boundary inspection.
- [ ] Evidence/sample-quality review.
- [ ] Bounded diagnostic, if justified.
- [ ] Work Unit checker, documentation links and `git diff --check`.

## Promotion Gates

- This investigation does not change the current 15-second or 30-second gates.
- A recommended policy change requires explicit Owner authority before
  implementation.
- Remote promotion is not authorized in this Work Unit.

## Remote Actions / Authorization

- Read-only fetch already completed while pausing TL-02.
- No push, PR, merge, deploy or remote/infrastructure mutation is authorized.

## Handoff Notes

- Preserve `apps/dev-preview-web/src/.DS_Store` as an unrelated Owner artifact.
- Do not modify or rebase `feature/tl-02-admin-identity-session`.
- Record all diagnostic observations, not only passing ones.

## Closure Predicate

This investigation reaches its checkpoint when repository authority,
measurement boundaries and available observations support one explicit gate
classification and an actionable recommendation without changing policy or
product behavior. TL-02 remains paused until the resulting Owner decision is
implemented and independently verified where required.
