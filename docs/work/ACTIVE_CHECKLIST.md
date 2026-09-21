# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: QUALITY — Validate PBI-041 Transaction Performance Budget
iteration: 1 - Contract Investigation
type: QUALITY
risk: HIGH
shadow_risk: SENSITIVE
branch: chore/pbi-041-transaction-budget-review
base_sha: 4f3cf8c4ecf4827d7a92ed80386cf7738e6e4cc5
status: BLOCKED
closure_mode: DERIVED
last_updated: 2026-09-21
-->

## Identity

- **Milestone:** Tenant Lifecycle MVP promotion dependency.
- **Work Unit:** QUALITY — Validate PBI-041 Transaction Performance Budget.
- **Sprint:** none.
- **Current PBI:** `NONE`; this is a Quality investigation dependency.
Current PBI: NONE
- **Status:** `BLOCKED` pending an Owner contract decision.
- **Progress:** `7 / 7` investigation blocks complete.
- **Current work:** investigation complete; the existing promotion policy is
  unchanged and TL-02 remains paused.
- **Next block:** Owner decision on whether the 15-second historical target
  remains a one-sample hard gate or becomes a calibrated capacity target with
  mandatory diagnostics.
- **Blockers:** an explicit Owner decision is required before changing the
  governed performance contract or resuming TL-02.
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
- [x] Trace the 15-second requirement and classify its authority.
- [x] Reconstruct the historical PBI-041 performance contract.
- [x] Compare publish and transaction measurement boundaries.
- [x] Assess prior evidence quality and current variance.
- [x] Run one bounded diagnostic campaign only if needed.
- [x] Record classification, recommendation and required Owner decision.

## Current

The Quality investigation is complete. The transaction interval is measured
correctly and has conceptual value, but current evidence does not justify the
historical 15-second target as a blocking one-sample promotion threshold. No
product, threshold or gate was changed.

## Next

Obtain an explicit Owner decision on the recommended harness contract, then
open a separate remediation Work Unit if authorized. TL-02 remains frozen on
its preserved branch until the dependency is resolved.

## Blockers

`OWNER_DECISION_REQUIRED`: changing the hard-gate semantics is outside this
investigation's authority. The existing 15-second assertion remains in force.

## Important Discoveries

- TL-02 is preserved at `6ea9d15874acce1c006c204ee70933f15cb5dec1`.
- The Quality Work Unit starts from integrated `main`
  `4f3cf8c4ecf4827d7a92ed80386cf7738e6e4cc5`.
- The observed failing publish and transaction measurements were effectively
  identical because nearly all benchmarked service work occurs inside the
  transaction.
- The 15-second value entered accepted readiness documents in `0051c846`; the
  repository does not contain its empirical derivation or an explicit Owner
  selection of that exact number.
- The blocking one-sample assertion was introduced later by `6f72c569` as a
  Quality implementation choice.
- Three bounded native runs produced transaction durations of 1,475.1 ms,
  18,403.9 ms and 1,456.4 ms with no product, schema, fixture or configuration
  change. The middle run passed the 30-second publish gate but failed the
  15-second transaction gate.
- Classification: `JUSTIFIED_BUT_THRESHOLD_UNSUPPORTED`; no product regression
  was demonstrated.

## Focused Verification

- [x] Branch, baseline, tracked tree and unrelated `.DS_Store` checked.
- [x] TL-02 branch frozen before starting the Quality Work Unit.
- [x] Git history and accepted-contract trace.
- [x] Measurement-boundary inspection.
- [x] Evidence/sample-quality review.
- [x] Bounded diagnostic: three sequential fresh-database observations retained.
- [x] Work Unit checker, documentation links, secret scan and
  `git diff --check`.

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
