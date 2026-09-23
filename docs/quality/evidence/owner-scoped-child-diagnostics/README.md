# Owner-scoped child failure diagnostics

## Scope

This Quality Work Unit preserves diagnostic evidence when an owner-scoped
PostgreSQL child process fails. It does not change product behavior, SQL,
migrations, suite order, suite inventory, retries, parallelism or the existing
240-second campaign budget.

This document records the 240-second contract in force when the diagnostic
change was integrated. A later Owner decision, supported by PR #78 evidence,
authorizes 360 seconds only for the owner-scoped outer wrapper. The 150-second
child budget, diagnostics, suite inventory and fail-closed behavior remain
unchanged.

## Contract

The existing fail-closed `SR_POSTGRESQL_CHILD_FAILURE` marker remains intact.
The owner-scoped runner additionally emits a structured diagnostic marker with:

- suite and ordinal;
- exit code, signal and timeout classification, including the bounded
  `execFile-timeout` reason when applicable;
- bounded stdout and stderr;
- a bounded assertion/error summary;
- explicit truncation flags.

Each stream is bounded to 4,096 characters using deterministic head/tail
retention. Credentials, connection strings, passwords, PINs, tokens, cookies,
CSRF material, peppers and enrollment secrets are redacted before retention.

The parent PostgreSQL CI runner includes the diagnostic in its failure message,
but still fails the campaign, authoritative leg, comparison and promotion gate
exactly as before.

## Regression coverage

Focused tests cover passing children, assertion failures, signals, timeouts,
oversized output, sanitization, failure propagation, cleanup, the exact
eight-suite inventory and the unchanged 240-second budget.

TL-07 remains frozen at
`8b75ba6724257044896b4c4ae26c09ef616c4d42` until a later authorized full
verification classifies its prior non-reproducible campaign failure.
