# Owner-scoped CI runtime variability review

## Scope

This Quality review explains the owner-scoped PostgreSQL runtime variance
observed while promoting TL-07. It does not change product behavior, tests,
suite inventory, execution order, PostgreSQL, timeouts, retries, CI gates or
infrastructure.

TL-07 remains frozen at
`1e5335734920de8a0f47a929120dcdce0c4ea3c9` in Draft PR #72. Its product and
security review is complete; TL-08 is not started.

## Exact attempt-1 failure

[Authoritative CI run 35817349160, attempt 1](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/35817349160)
ran on the exact TL-07 PR head. `VC-024 run-1` passed the connection,
transaction, migration and schema suites, then entered
`owner-scoped-adapters` at `04:16:39.585Z`. The parent killed the complete
owner-scoped process at `04:20:39.704Z`, 240,119 ms later.

| Fact | Observed result |
|---|---|
| Workflow stage | `postgresql-composite` / `owner-scoped-adapters` |
| Failure class | unchanged 240,000 ms outer `execFile` timeout |
| Inner suite and ordinal | not observable from the retained attempt-1 log |
| Inner child exit/signal | not observable; no child marker was emitted |
| Sanitized assertion/stdout/stderr | none retained; only the parent wrapper's generic error was printed |
| PostgreSQL error | none present |
| Parent result | exit code 1 |
| Cleanup | PASS |

The child-diagnostics contract added by PR #71 covers a child test that exits,
signals or reaches its own 150-second timeout while the owner-scoped parent is
still alive. Here the independent 240-second parent timeout killed that parent
before it could finish or return a marker. Therefore the historical log cannot
truthfully identify a particular inner suite. Inferring one from successful
timings would not be evidence.

The same attempt's independent `run-2` completed all eight suites in
158,981 ms, with no assertion, migration, connection, PostgreSQL or cleanup
failure.

## Exact budget boundary

The enforced 240-second boundary is the `execFile` timeout around
`scripts/test-owner-scoped-persistence-postgresql.mjs`. It includes:

- the owner-scoped image pull;
- campaign-container start, readiness and environment probes;
- eight serial, isolated child test processes;
- one fresh database create, schema check, force-drop and absence check per
  file;
- final container cleanup, material comparison and result serialization.

It excludes the preceding connection, transaction, migration and schema suites
of the larger PostgreSQL composite. This matches the accepted Quality contract:
the budget governs the complete owner-scoped wrapper, not only child test time.

The logged `campaign` duration is narrower: it starts after image/container
setup and ends after the eighth per-file execution. Consequently the reported
`232,240 ms` campaign in TL-07 attempt 2 was not the actual enforced margin.
The complete owner-scoped wrapper took `234,565 ms`, leaving `5,435 ms` before
the 240,000 ms boundary, rather than `7,760 ms`.

## Same-head suite comparison

TL-07 attempt 2 assigned each authoritative leg a different hosted worker. The
two legs executed the same SHA, inventory, order and contract:

| Suite | run-1 total | run-2 total | run-2 increase |
|---|---:|---:|---:|
| owner-scoped persistence | 697 ms | 885 ms | 27% |
| repair persistence | 16,128 ms | 22,842 ms | 42% |
| trusted Station context | 15,446 ms | 21,929 ms | 42% |
| User directory | 28,133 ms | 40,117 ms | 43% |
| access Role | 27,835 ms | 39,559 ms | 42% |
| access PIN | 51,812 ms | 73,755 ms | 42% |
| access Session | 20,408 ms | 28,563 ms | 40% |
| contextual authorization | 4,071 ms | 4,589 ms | 13% |
| **campaign** | **164,530 ms** | **232,240 ms** | **41%** |

The PIN suite is the largest absolute contributor, but its increase is
proportional to the other material suites. It accounts for about one third of
both total runtime and the observed delta; it is not an isolated regression.
Database create/drop differences contribute less than one second of the
67,710 ms campaign delta. Test-process work accounts for nearly all of it.

## Authoritative runtime series

The series uses completed campaign timings from the GitHub logs. `TIMEOUT`
means the same unchanged outer 240-second boundary fired before a campaign
summary existed.

| Evidence | run-1 | run-2 |
|---|---:|---:|
| PR #70 candidate, run 35714807423 | 219,338 ms | 214,387 ms |
| PR #70 exact-main, run 35718292289 | 219,428 ms | 208,899 ms |
| PR #71 candidate, run 35813788829 | 198,215 ms | 234,436 ms |
| PR #71 exact-main attempt 1, run 35814719045 | 231,255 ms | TIMEOUT |
| PR #71 exact-main attempt 2, same SHA | 231,447 ms | 169,319 ms |
| TL-07 PR attempt 1, run 35817349160 | TIMEOUT | 158,981 ms |
| TL-07 PR attempt 2, same SHA | 164,530 ms | 232,240 ms |

The original local Quality remediation recorded corrected campaigns of
123,654, 126,212 and 120,300 ms, plus normal composite/full campaigns of
119,883 and 115,134 ms. Local evidence is not substituted for authoritative
CI; it establishes that the same workload has substantial host-dependent
headroom outside the hosted-runner variance.

## Classification

**CI_HOST_RESOURCE_VARIABILITY**

Evidence:

- the same exact SHA can produce a fast leg, a near-budget leg and an outer
  timeout without a code or inventory change;
- seven later authoritative workflow attempts contain successful campaign
  observations spanning 158,981–234,436 ms plus two outer timeouts;
- slow versus fast same-head legs expand nearly every material child by about
  40–43%, rather than localizing to one suite;
- image versions and Azure regions do not correlate with fast/slow outcomes;
  both observed runner-image versions include fast and slow/failing legs;
- database lifecycle overhead stays bounded and does not explain the delta;
- the PostgreSQL logs contain no connection, migration, assertion or cleanup
  failure;
- adding TL-07's migration/tests cannot explain same-head alternation, and a
  TL-07 fast leg is faster than the earlier PR #70 legs.

The logs demonstrate hosted-worker throughput variability. They do not expose
enough host telemetry to distinguish VM performance tier from colocated-host
contention, so that lower-level mechanism is intentionally not claimed.

## Remediation decision

No repository remediation is justified for the runtime variability itself.
The accepted 240-second boundary, eight-suite inventory, serial execution,
fresh database per suite, real PostgreSQL and fail-closed behavior remain
unchanged. Raising the timeout, retrying to green, removing coverage or
parallelizing would conceal or weaken the contract.

The outer-timeout path has a bounded observability limitation: it does not
retain the active inner-suite ordinal when the parent is killed. A future
Quality change could stream a sanitized suite-start/progress marker without
moving the budget or changing pass/fail semantics, but that is not the cause
of the runtime variance and is not implemented in this review.
