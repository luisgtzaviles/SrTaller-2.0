# Deterministic Authoritative CI

## Status and authority

- **Status:** Approved implementation contract for the exceptional Infra Work Unit.
- **Owner decisions:** INFRA-001 through INFRA-005, 2026-09-22.
- **Scope:** trusted control plane, ephemeral Tier-2 FULL execution, evidence,
  cleanup and the narrowly authorized TL-07 subject-SHA closure.
- **Not authorized:** product deploy, persistent public-repository runner,
  further timeout/gate relaxation beyond the explicitly approved owner-scoped
  360-second boundary, generic retry policy or arbitrary historical closure.

## Architecture

Tier 1 remains GitHub-hosted and owns classification, public/untrusted checks,
`DOCS_ONLY`, comparison/control-plane work where appropriate and the always
resolving promotion aggregate. Tier 2 consists of two independent, fresh,
dedicated x86_64 VMs in a separate Hetzner Cloud CI project. Each Tier-2 VM
executes one unchanged FULL leg and is deleted after evidence collection.

Preview, Dokploy, the Preview PostgreSQL volume and their credentials are not
part of this trust boundary. A Tier-2 VM never receives the Hetzner provisioning
token, Preview/Production/Cloudflare credentials, customer data or a persistent
SSH identity.

## Trusted controller and events

Only a workflow/controller already integrated into mechanically protected live
`main` may obtain access to the protected `authoritative-ci` Environment and its
minimum-scope provisioning credential. Pull requests, forks,
`pull_request_target`, labels, PR artifacts and arbitrary workflow changes
cannot provision Tier 2.

The controller validates:

1. its own SHA equals live remote `main`;
2. the explicit tested subject is authorized by the current Work Unit contract;
3. the subject is an integrated ancestor of live `main`;
4. each VM starts from the approved immutable bootstrap/image version;
5. each VM checks out the exact tested SHA;
6. both legs report the unchanged semantic evidence; and
7. every created VM is deleted and deletion is confirmed.

Tier-2 unavailability, provisioning failure, evidence mismatch or cleanup
failure blocks promotion. There is no silent GitHub-hosted FULL fallback and no
retry-to-green policy.

## Compute contract

The initial target per leg was dedicated-class x86_64 compute with four
dedicated vCPU and 16 GB RAM. Material evidence proved that profile could not
provide stable useful margin under the former 240-second owner-scoped
contract. The selected remediation profile is therefore dedicated-class
x86_64 compute with 16 dedicated vCPU, 64 GB RAM, sufficient NVMe storage for
Docker/build/test work, and Ubuntu 24.04/glibc. Exact provider profile and price
must be verified at provisioning time. The operational budget guard remains
approximately USD 25 per month; it is an approval/monitoring boundary, not
authority to under-size or weaken verification.

The reproducible bootstrap pins Node.js 24.18.0 and pnpm 11.15.1, installs
Docker Engine and only required system tooling. PostgreSQL remains the governed
18.4 image/digest used by repository tests. Mutable shared filesystem caches
are forbidden.

The materialized initial profile was Hetzner Cloud `CCX23` in `hel1`: x86 AMD,
four dedicated vCPU, 16 GB RAM and 160 GB SSD. It produced material
owner-scoped observations of 142.026 seconds, 228.103 seconds and one hard
timeout beyond 240 seconds, so it is retained as failed capacity evidence and
is no longer eligible for cutover.

The current candidate profile is `CCX43` in `hel1`: x86 AMD, 16 dedicated vCPU,
64 GB RAM and at least 360 GB SSD. The published HEL price observed on
2026-09-23 is USD 0.5216/hour per VM, excluding IPv4/tax. A 90-minute two-leg
upper lifetime therefore projects below USD 1.57 before IPv4/tax and remains
well inside both the monthly guard and the Owner's USD 10 autonomous-session
cap. It remains ephemeral-only; material provisioning must revalidate the
exact returned profile before FULL starts.

## Materialized controller and bootstrap

The protected controller uses
[`run-tier2-authoritative-ci.mjs`](../../scripts/run-tier2-authoritative-ci.mjs).
It validates current live `main`, the trusted event/ref, ancestry and the exact
authorized subject before contacting Hetzner. It then creates one temporary
spread placement group, a firewall admitting SSH only from the controller's
current IPv4 address, one ephemeral SSH key and two labeled CCX43 servers.

[`tier2-bootstrap.sh`](../../scripts/ci/tier2-bootstrap.sh) is the versioned
`ubuntu-24.04-x86_64-v1` bootstrap. It verifies Ubuntu 24.04/x86_64, installs
only the required system tools and Docker, verifies the official Node.js
24.18.0 archive against its pinned SHA-256, activates pnpm 11.15.1, clones the
public repository without credentials and checks out the exact tested SHA.
Every VM starts with fresh package/cache paths; no mutable shared cache or
persistent runner registration exists.

The controller credential is read only by the GitHub-hosted controller through
the `authoritative-ci` Environment. SSH child processes receive a scrubbed
environment. The VM receives only the public repository URL, tested SHA,
ephemeral SSH trust and the bootstrap/collector sources. The cloud token is
never an SSH argument, file, VM environment variable or evidence field.

## Provisioning and deletion contract

Every resource carries `managed-by`, `run-id`, `controller-sha` and
`expires-at` labels. A campaign fails before provisioning if any governed
resource already exists, making a prior orphan visible instead of silently
stacking cost. Normal execution deletes servers first, then firewall, spread
placement group and SSH key, and proves every provider object returns `404`.
Any deletion failure fails the campaign.

Hetzner deletion is asynchronous. The orchestrator accepts the successful
delete response variants and then polls the exact resource until the provider
returns `404`; the initial response alone is never deletion proof. After both
servers have proven `404`, a firewall `422` caused by eventual dependency
release receives only a bounded retry; no other resource/status is treated as
retryable. If a failed
campaign leaves only non-server resources, an explicit protected
`workflow_dispatch` recovery may target that exact prior run identity.
Recovery fails closed if any server from that run still exists, so it cannot
become an alternate path for terminating active compute.

The separate `Authoritative CI Orphan Sweep` workflow runs from protected
`main` every six hours and may delete only expired resources with the exact
governed label. It publishes a sanitized inventory/deletion artifact. It does
not provision servers or execute repository code on them.

## FULL and evidence

Each independent VM preserves the existing FULL contract: owner-scoped eight
suites in serial with fresh database isolation, the explicit 360,000 ms outer
owner-scoped budget, the unchanged 150,000 ms per-child budget, all applicable
TL material suites, build/runtime/UI smokes, fingerprint and cleanup. The
other four PostgreSQL composite suites retain their 240,000 ms outer budget.
Product verification is not rewritten for infrastructure convenience.

The Owner authorized the bounded outer-budget change after PR #78 supplied a
same-candidate observation of 232.704 seconds for the campaign, 235.049
seconds for its wrapper and a second hosted leg terminated exactly at 240
seconds. The 360-second boundary changes only execution tolerance for the
complete owner-scoped wrapper. It does not change assertions, fixtures, suite
inventory, serial execution, fresh-database isolation, cleanup, PASS criteria,
comparison, retries or promotion authority.

Sanitized evidence stored outside the VM binds:

- tested subject SHA and controller/workflow SHA;
- workflow/run identity;
- image/bootstrap version and provider/region/profile;
- CPU, RAM, disk and Node/pnpm/Docker/PostgreSQL versions;
- stage and eight child timings;
- semantic manifests/comparison/promotion result;
- cleanup and provider deletion proof.

Raw secrets, tokens, customer data and persistent machine identity are excluded.
Resources require TTL/orphan markers; orphan detection or failed deletion fails
the infrastructure result.

The first integrated form is deliberately `SHADOW`. `workflow_dispatch` has
two explicit, fail-closed modes:

- `normal` preserves the existing hosted authoritative classification, two
  FULL legs, comparison and `Authoritative promotion gate` semantics; and
- `tier2-shadow` runs only the lightweight trusted-context control plane and
  the protected Tier-2 experiment. It requires an explicit tested subject SHA
  and does not make the hosted FULL jobs or comparison eligible.

A material campaign is requested only through `mode=tier2-shadow` on protected
live `refs/heads/main`; an ordinary push, pull request or normal dispatch does
not spend infrastructure budget. Pull requests, forks and
`pull_request_target` cannot select the protected Environment. The lightweight
context gate verifies exact upstream repository, `main` ref, live controller
SHA, subject allowlist and ancestry before the cloud credential becomes
available. The protected orchestrator repeats those checks before contacting
Hetzner.

Shadow eligibility is independent of the hosted FULL result. In
`tier2-shadow` mode, hosted run-1, run-2 and hosted comparison are skipped and
`Authoritative promotion gate` is explicitly not applicable. The shadow job's
own failure remains visible as a failed experiment, including provisioning,
bootstrap, FULL, evidence or deletion failure, but it is never product
promotion evidence. This independence does not change authority: normal hosted
paths remain fail-closed, the promotion aggregate does not depend on or accept
the shadow job, and no Work Unit closure can consume shadow evidence. No
cutover is claimed before bounded observations and a separately reviewed
authorization exist.

Every campaign artifact declares `mode: SHADOW` and `authoritative: false` in
machine-verifiable metadata. The shadow artifact contains each leg's Full Verification summary, material
PostgreSQL manifest, eight sanitized owner-scoped child timings, machine and
toolchain facts, semantic comparison, subject/controller/run binding, cost
projection and deletion proof. Volatile smoke database/container/port names
are excluded from semantic comparison. The raw bounded verification log is
used only to extract timings and is deleted before artifact upload.

Transport readiness and test execution remain separate boundaries. Before a
leg starts FULL, a recognized SSH banner timeout or connection reset may use
one bounded transport recovery after the ordinary readiness probe. That is
bootstrap recovery, not a FULL retry: once `verify:full` starts, the leg is
executed exactly once and its result is preserved.

## Material shadow observations

The first material shadow attempt proved the trusted control plane and one
complete CCX23 leg, then failed closed before the second leg started FULL. The
completed leg ran all stages, owner-scoped PostgreSQL 8/8 within the unchanged
240-second contract, TL-07 3/3, 89 migrations, runtime/UI smokes, fingerprint
and internal cleanup. The other leg lost its pre-bootstrap SSH connection with
a banner timeout after the readiness probe.

That attempt also exposed an orchestrator cleanup defect: successful
asynchronous server-delete responses were rejected before their `404` proof,
so a dependent firewall could not be deleted in the same pass. Provider
inventory proved both VMs absent and identified only that non-billable
firewall as residual. The attempt remains failed evidence and contributes no
successful campaign or leg toward cutover readiness.

The second material shadow attempt executed FULL on both CCX23 legs after the
transport fix. One leg passed every stage with owner-scoped 8/8 in 228.103
seconds; the other exceeded the unchanged 240-second owner-scoped contract and
failed before complete child diagnostics. Its cleanup also reproduced a
firewall `422` after both servers were absent; protected exact-run recovery
removed that sole non-billable residual and provider inventory returned empty.
The attempt remains failed evidence and contributes no accepted campaign or
leg. Together, the material timings proved insufficient stable margin on CCX23
and justified the bounded CCX43 capacity remediation without changing FULL,
suite inventory, serial execution or the then-current 240-second gate. The
later PR #78 evidence and Owner decision define the separate 360-second outer
budget change documented above.

The shadow subject and a future subject-SHA closure are different contracts.
An Infra material observation normally tests the then-current trusted
controller SHA after the shadow-only workflow has been integrated. The
separately preserved TL-07 closure subject remains
`0e6193e4afa6ebe35accdac7b58e69fa992d9c43`; selecting it for a future
authoritative subject proof does not make a SHADOW artifact authoritative.

The allowed shadow state machine is:

```text
protected live main
  -> explicit mode=tier2-shadow + tested_sha
  -> lightweight trusted-context PASS
  -> two independent ephemeral VMs
  -> one unchanged FULL leg per VM
  -> sanitized SHADOW evidence
  -> proven destruction
  -> SHADOW PASS or FAIL
  -> Owner evidence review
```

It produces no promotion, closure, cutover or effective `IDLE` state.

## Governed dependency exception

`INFRA_CI_BLOCKER` is a one-purpose lifecycle exception. It may replace an
explicitly `BLOCKED` or `PROMOTION` Work Unit only when the new Work Unit is
exactly `INFRA — Deterministic Authoritative CI Runner` with type
`INFRASTRUCTURE_QUALITY`. The metadata preserves the dependent Work Unit,
branch, integrated subject SHA and prior status, and requires return. It cannot
start TL-08 or another product Work Unit and does not relax ordinary WIP rules.

## Subject-SHA attestation and closure

Exact-main closure remains the default. The subject path is available only
after the Infra dependency itself is integrated, exact-main verified and
closed. It accepts only the dependency subject declared by the integrated Infra
snapshot. The subject must be an ordinary integrated merge and an ancestor of
current live `main`.

The attestation contract `SR_TALLER_AUTHORITATIVE_SUBJECT_V1` binds the
successful `Authoritative Linux CI` workflow-dispatch run to:

- current live-main controller SHA;
- exact tested subject SHA;
- canonical workflow path;
- run identity; and
- successful promotion gate.

The closure command does not accept a caller-supplied local attestation. It
queries the exact GitHub Actions run, requires one non-expired artifact named
`authoritative-subject-attestation`, downloads it directly with `gh`, and
accepts only the single regular file
`AUTHORITATIVE_SUBJECT_ATTESTATION.json`. The artifact's GitHub run identity
must match the successful run used for closure. Until a trusted integrated
workflow emits that artifact after the required authoritative gates, subject
closure fails closed.

Mismatch, missing/failed evidence, wrong workflow/event/controller, unauthorized
ancestor or wrong closure-tag target fails closed. For the authorized TL-07
recovery, its deterministic closure tag must target
`0e6193e4afa6ebe35accdac7b58e69fa992d9c43`, never a later Infra merge.

## Main and Environment protection

Before a cloud provisioning credential becomes usable:

- `main` requires pull requests and the `Authoritative promotion gate`;
- force pushes and deletion are disabled;
- conversation resolution is required where supported;
- administrator bypass is disabled except through a separately documented
  recovery change;
- the protected `authoritative-ci` Environment is restricted to trusted `main`;
  and
- the provisioning credential has authority only inside the separate CI project.

Recovery uses repository-administrator GitHub controls to deliberately change
the protection contract with an auditable API/UI event. It never means bypassing
the required check, moving a closure ref or pushing directly to `main`.

## Cutover and reconsideration

Tier 2 remains shadow until bounded observations prove two independent hosts,
exact-subject equivalence, full material coverage, useful stable margin within
the current 360-second owner-scoped boundary and complete deletion. Only then
may a reviewed integration
candidate route authoritative FULL to Tier 2. Reconsider the design if current
account capabilities cannot enforce the trust boundary, pricing exceeds the
guard, or shadow runs do not provide stable useful margin.

The separate Hetzner project is `SR-Taller-Authoritative-CI` (project id
`16132171`). GitHub Environment `authoritative-ci` contains only the encrypted
secret named `HCLOUD_TOKEN`; the value is not repository data and must never be
documented. The project token is scoped by Hetzner to this isolated project and
has no Preview, Production, Dokploy or Cloudflare authority.
