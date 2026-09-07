# PBI-025 — CI flakiness incident and deterministic mitigation

## Record

| Field | Value |
|---|---|
| Date first observed | 2026-09-07 |
| Candidate | `9ce69334692e919276dbe1100d232e695b6ae115` |
| Authoritative run | [34092781952](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/34092781952) |
| Owner | Quality + Operations; Engineering owns the technical remediation |
| Classification | CI flakiness affecting a Critical authentication/persistence gate |
| Status | Open until the remediation HEAD satisfies the restoration criteria below |
| Quarantine | None; the critical suite remains blocking |

This record preserves the first red result under the flakiness rules of
[DEC-051](../../../decisions/dec-051-testing-ci-strategy/DECISION_PROPOSAL.md)
and [DEC-063](../../../decisions/dec-063-definition-of-done/DECISION_PROPOSAL.md).
The later green diagnostic attempt does not erase or replace that result.

## First observed failure

Attempt 1 of run `34092781952` executed the exact PBI-025 candidate on the
governed Node.js `24.18.0` Linux x64 environment. Both independent legs failed
in `Run PostgreSQL 18.4 persistence suites` while the
`owner-scoped-adapters` suite was running:

- `VC-024 run-1`: failed;
- `VC-024 run-2`: failed;
- `VC-024 comparison`: skipped because neither input execution completed.

Connection, transaction, migration and schema suites had already passed in
both legs. The outer runner reported only
`PostgreSQL CI operation failed: scripts/test-owner-scoped-persistence-postgresql.mjs`.
At that revision it discarded the nested child output and termination signal,
so the failing test file, assertion, exit code or signal cannot be recovered
retrospectively from the authoritative log.

## Diagnostic reproduction and frequency

Attempt 2 was a deliberate diagnostic reproduction on the same run and exact
SHA, not an automatic retry used to manufacture a green result. It produced:

- `VC-024 run-1`: `SUCCESS`;
- `VC-024 run-2`: `SUCCESS`;
- `VC-024 comparison`: `SUCCESS`.

Repository-observed frequency at the time of this record is therefore one red
attempt out of two attempts on the same SHA: `2/2` parallel legs failed in
attempt 1 and `0/2` failed in attempt 2. This sample is insufficient to assign
a stable probability. The change of outcome without a code change classifies
the event as flaky; it does not provide reliable `PASS` evidence for the
affected Critical gate by itself.

The functional merge `328bdf541be88b21a2e7dbea28f4a2a6f32f6986` then ran
[authoritative main CI 34094803024](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/34094803024)
on attempt 1. Both independent legs and comparison completed `SUCCESS`,
including the same owner-scoped PostgreSQL suite. This preserves another
successful reproduction and confirms that the merged product tree is not
deterministically red; it still does not erase or explain attempt 1 of run
`34092781952`.

An isolated stress reproduction used a read-only archive of exact candidate
`9ce69334692e919276dbe1100d232e695b6ae115` on Linux x86_64, Node.js
`24.18.0`, PostgreSQL `18.4` at the governed digest, UTC and UTF8. The same six
test files ran serially and under four-container contention with explicit CPU
and memory limits:

- baseline: `13/13` batches passed;
- `--no-maglev`: `13/13` batches passed, including five consecutive serial
  executions;
- aggregate: `156` test-file executions, zero failures, skips, stderr or
  process signals.

All disposable sources, containers, images and raw outputs were removed after
the sanitized counts and timings were recorded. The failure was not reproduced
even under stronger contention, and `--no-maglev` did not change correctness.
This evidence rejects a deterministic PBI-025 assertion or schema defect; it
does not manufacture a cause for the original opaque runner event.

## Root-cause classification

The original process-level cause is **unproven and retrospectively
unobservable** because the wrapper swallowed the nested child diagnostic and
termination signal. There is no evidence that a PBI-025 assertion, PostgreSQL
constraint or product invariant failed.

[Node.js issue #64841](https://github.com/nodejs/node/issues/64841) is related
upstream evidence: it records intermittent Linux x64 process termination under
Node.js 24.18.x and CPU contention, with `--no-maglev` as a temporary
mitigation. Later maintainer analysis attributes that issue's reproducer to an
HTTP/2/nghttp2 lifecycle defect and explicitly says Maglev is where corrupted
state surfaced, not the root cause. The owner-scoped PostgreSQL suite does not
exercise HTTP/2. Consequently, issue #64841 is evidence for a plausible Node
24.18 Linux x64/JIT failure mode only; it is **not** proof of this incident's
root cause.

## Scope and risk

The observed scope is limited to the nested critical owner-scoped PostgreSQL
test process in the authoritative CI runner. No product runtime, deployed
environment, remote database or customer data was involved. The failure still
blocks acceptance because that suite proves tenant isolation, authentication,
concurrency, migration and persistence contracts for a PBI classified
`Critical`. Under DEC-051/DEC-063, a flaky critical gate cannot be treated as
green through re-execution.

## Deterministic mitigation

The remediation is intentionally narrow:

1. invoke only the nested owner-scoped critical `node --test` process with
   `--no-maglev`; do not set a repository-wide `NODE_OPTIONS` value and do not
   alter application runtime behavior;
2. preserve the same PostgreSQL suites, assertions, ordering, blocking status
   and two-run comparison;
3. propagate a sanitized, allowlisted failure identity from the nested runner
   so a future failure distinguishes a known test file or runner-level
   termination without emitting raw child output, environment values or
   secrets;
4. keep the original failed attempt linked in this record and require a new
   exact-HEAD authoritative run after the remediation.

This removes one plausible Node 24.18 JIT failure surface, tightens the serial
timing variance observed in stress, and repairs the diagnostic blind spot. It
does not claim that Maglev caused the original event or that the incident is
closed before the restoration evidence exists.

## Restoration criteria

Confidence for the PBI-025 candidate is restored only when all of the
following are true on the remediation HEAD:

- focused contracts prove that `--no-maglev` is scoped only to the nested
  critical suite and sanitized diagnostics remain fail-closed;
- the owner-scoped PostgreSQL material suite passes five consecutive local
  Linux x64 executions without quarantine or ignored failures;
- a new authoritative exact-HEAD CI run completes `VC-024 run-1`, `VC-024
  run-2` and `VC-024 comparison` as `SUCCESS` on its first attempt;
- no BLOCKER, HIGH or MEDIUM finding remains within the remediation scope.

The `--no-maglev` mitigation may be removed only after the governed Node.js pin
moves to a version with an applicable upstream fix, or equivalent Linux x64
contention evidence passes the same nested suite without the flag, followed by
a fresh exact-HEAD two-run authoritative CI comparison. Until then, Quality +
Operations owns periodic review and Engineering owns the scoped flag and safe
diagnostics.

## Delivery boundary

This incident record does not change the PBI lifecycle state, authorize merge,
infer Owner Acceptance, reduce the `Critical` risk, declare `Done` or authorize
release/deploy. It adds no quarantine or bypass. The PBI-025 evidence index
remains authoritative for candidate, review and closure status.
