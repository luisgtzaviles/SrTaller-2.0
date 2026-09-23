# Deterministic Authoritative CI

## Status and authority

- **Status:** Approved implementation contract for the exceptional Infra Work Unit.
- **Owner decisions:** INFRA-001 through INFRA-005, 2026-09-22.
- **Scope:** trusted control plane, ephemeral Tier-2 FULL execution, evidence,
  cleanup and the narrowly authorized TL-07 subject-SHA closure.
- **Not authorized:** product deploy, persistent public-repository runner,
  timeout/gate relaxation, generic retry policy or arbitrary historical closure.

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

The initial target per leg is dedicated-class x86_64 compute with approximately
four dedicated vCPU, 16 GB RAM, sufficient NVMe storage for Docker/build/test
work, and Ubuntu 24.04/glibc. Exact provider profile and price must be verified
at provisioning time. The operational budget guard is approximately USD 25 per
month; it is an approval/monitoring boundary, not authority to under-size or
weaken verification.

The reproducible bootstrap pins Node.js 24.18.0 and pnpm 11.15.1, installs
Docker Engine and only required system tooling. PostgreSQL remains the governed
18.4 image/digest used by repository tests. Mutable shared filesystem caches
are forbidden.

## FULL and evidence

Each independent VM preserves the existing FULL contract: owner-scoped eight
suites in serial with fresh database isolation, the 240,000 ms hard budget,
all applicable TL material suites, build/runtime/UI smokes, fingerprint and
cleanup. Product verification is not rewritten for infrastructure convenience.

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
exact-subject equivalence, full material coverage, useful stable margin below
240 seconds and complete deletion. Only then may a reviewed integration
candidate route authoritative FULL to Tier 2. Reconsider the design if current
account capabilities cannot enforce the trust boundary, pricing exceeds the
guard, or shadow runs do not provide stable useful margin.
