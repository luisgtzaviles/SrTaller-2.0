# Harness 2.0 Risk Classification

## Status and authority

This model is **SHADOW ONLY**. Current accepted policy and the existing workflow
classifier remain the active enforcement authority. No gate, review, CI stage,
exact-main verification, or Owner authority is reduced by this document.

## Proposed classes

| Class | Typical scope | Proposed development checks | Proposed promotion checks | Human judgment and escalation |
|---|---|---|---|---|
| `NORMAL` | UI within accepted architecture, ordinary feature/endpoint, local bug, tests, local refactor | explicit focused tests, typecheck/build when affected, Work Unit and diff checks | current promotion pipeline until evidence supports a future decision | escalate when the delta crosses a contract, data, authority, environment, or irreversible boundary |
| `SENSITIVE` | persistence/migrations, tenancy, authn/authz, roles/capabilities, secrets, infrastructure/deploy, destructive actions | focused domain/security/material DB checks plus relevant build/type checks | full current pipeline, explicit Owner approval, deeper domain/security review | escalate ambiguity or a fundamental-contract change to `ARCHITECTURAL` |
| `ARCHITECTURAL` | accepted ADR/DEC, module boundaries, multitenancy/stack/persistence strategy, fundamental delivery contract, infrastructure architecture | explicit architecture/contract validation and affected technical checks | full current pipeline, explicit Owner approval, architecture decision process, second deliberate review pass | stop for a new/updated ADR/DEC or Owner decision when authority is absent |

Classification uses the highest applicable class. Automation can identify
deterministic path signals, but cannot grant authority or replace human review
of intent and blast radius.

## Comparison contract

`pnpm work-unit:risk:shadow -- --base <sha> --head <sha>` reports both models:

- `currentClassification` and `existingRequiredPipeline` come from the current
  classifier;
- `proposedClassification` and `proposedFuturePipeline` are Harness 2.0 shadow
  observations;
- `activeEnforcement` is always `CURRENT_POLICY`;
- `harnessMode` is always `SHADOW_ONLY`;
- `gatesReduced` is always `false`.

This is comparison evidence, not an enforcement switch.

## Observation H2-RISK-001

Development Harness 2.0 changes scripts, tests and fundamental delivery
contracts. The current classifier is expected to report
`CROSS_MODULE_HIGH_RISK` with pipeline `FULL`; Harness 2.0 classifies the same
Work Unit as `ARCHITECTURAL`, also preserving full promotion and adding a
future architecture-decision/second-review expectation.

This observation is recorded separately. It does not count toward the existing
workflow pilot because that pilot has its own accepted sampling criteria.
