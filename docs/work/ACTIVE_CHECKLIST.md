# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: QUALITY — Preserve Owner-Scoped Child Failure Diagnostics
iteration: 1 - Authorized implementation
type: QUALITY
risk: HIGH
shadow_risk: NORMAL
branch: chore/quality-owner-scoped-child-diagnostics
base_sha: 74fe2b5fd5b66ee48428953f3e027f2815c839ca
status: READY_FOR_PROMOTION
closure_mode: DERIVED
last_updated: 2026-09-22
-->

Current PBI: NONE

## Objective

Preserve bounded, sanitized child-process diagnostics for failures in the
owner-scoped PostgreSQL campaign without changing its pass/fail contract.

## Why

The prior TL-07 campaign failure identified only the child suite and exit code;
the runner discarded the assertion and PostgreSQL context needed to classify
the failure safely.

## In Scope

- Structured child stdout/stderr diagnostics with explicit bounds.
- Suite ordinal, exit code, signal and timeout classification.
- Sanitization of credentials, tokens, PINs, cookies, peppers and connection
  strings before diagnostics are retained.
- Parent failure propagation and deterministic cleanup preservation.
- Focused regression tests and policy/evidence documentation.

## Out of Scope

- TL-07 product behavior or fixture changes.
- Suite order, suite inventory, retries, parallelism or timeout changes.
- PostgreSQL semantics, migrations, deployment, TL-08 and infrastructure.
- Push, PR and merge until promotion is separately authorized.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`QUALITY_STRATEGY.md`](../quality/QUALITY_STRATEGY.md)
- [`DEFINITION_OF_DONE.md`](../delivery/DEFINITION_OF_DONE.md)

## Risks

- Diagnostic output could leak sensitive values if redaction is incomplete.
- Oversized child output could flood CI without deterministic limits.
- Error reporting must not catch, downgrade or delay fail-closed cleanup.
- TL-07 remains blocked until a new authorized exact-candidate full run passes.

## Plan

- [x] Preserve TL-07 at `8b75ba6724257044896b4c4ae26c09ef616c4d42`.
- [x] Audit the existing child-process failure path and bounded diagnosis.
- [x] Define structured, sanitized and bounded diagnostic contract.
- [x] Implement child diagnostics without changing failure semantics.
- [x] Add assertion, signal, timeout, truncation and redaction regressions.
- [x] Run focused quality, architecture and verification gates.
- [x] Run one canonical `verify:full` on this exact Quality HEAD if required.
- [ ] Reconcile readiness and stop before remote promotion unless authorized.

## Current

The diagnostic marker and parser are implemented. Existing child-failure
identity remains fail-closed; the new bounded diagnostic accompanies it and is
included by the PostgreSQL CI wrapper when a child fails.

## Next

The proportional local gates and canonical full verification pass on this
Quality candidate. The Work Unit is ready for remote promotion review; push,
PR, merge and deploy remain separately unauthorized.

## Blockers

No local verification blocker remains. TL-07 remains frozen and must not be
promoted from the previous unresolved campaign result.

## Important Discoveries

- The prior runner preserved only failed test identity, exit code, signal and
  timeout; child stdout/stderr were not retained in the parent marker.
- The new marker retains bounded head/tail streams plus a filtered failure
  summary, while redacting secret-like values before serialization.
- The existing eight-suite serial inventory, fresh-database lifecycle and
  240-second outer budget remain unchanged.

## Focused Verification

- [x] Child diagnostics unit/regression tests: assertion, signal, timeout,
  truncation, redaction and propagation.
- [x] Existing PostgreSQL workflow contract tests.
- [x] Typecheck/build as required by the Quality promotion classifier.
- [x] Architecture, Work Unit checker, links, secret scan and `git diff --check`.
- [x] Canonical `verify:full` on the exact final Quality HEAD if required.

## Promotion Gates

- [x] TL-07 product implementation unchanged and preserved on its branch.
- [x] Eight-suite inventory, 240-second budget and failure semantics unchanged.
- [x] Focused and proportional local verification.
- [x] `READY_FOR_PROMOTION` snapshot and promotion checker.
- [ ] PR/CI/review/merge — not authorized in this Work Unit step.

## Remote Actions / Authorization

- Owner authorized this local Quality Work Unit only.
- Push, PR, merge, deploy, TL-07 promotion and TL-08 remain unauthorized.
- Preserve `apps/dev-preview-web/src/.DS_Store`.

## Handoff Notes

After this Quality Work Unit is integrated and closed, resume TL-07 from its
preserved branch, merge current `main` normally, run focused continuity checks,
then execute one canonical `verify:full` to classify the original campaign
failure using the new diagnostics.

## Closure Predicate

Quality is `READY_FOR_PROMOTION` only when the diagnostic contract, focused
regressions, required local gates and exact diff pass on one clean candidate;
the eight-suite inventory, fail-closed propagation, cleanup and 240-second
budget remain unchanged; and TL-07/TL-08 remain outside this Work Unit.
