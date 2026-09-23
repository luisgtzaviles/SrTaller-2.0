# Active Work Unit Checklist

Current PBI: NONE

<!-- WORK_UNIT_METADATA
work_unit: INFRA — Deterministic Authoritative CI Runner
iteration: 1 - governed infrastructure dependency
type: INFRASTRUCTURE_QUALITY
risk: ARCHITECTURAL
shadow_risk: ARCHITECTURAL
branch: chore/deterministic-authoritative-ci-runner
base_sha: 0e6193e4afa6ebe35accdac7b58e69fa992d9c43
status: READY_FOR_PROMOTION
closure_mode: DERIVED
last_updated: 2026-09-22
dependency_exception: INFRA_CI_BLOCKER
dependency_work_unit: TL-07 — Station Inventory + Enrollment Authority
dependency_branch: feature/tl-07-station-inventory-enrollment-readiness
dependency_subject_sha: 0e6193e4afa6ebe35accdac7b58e69fa992d9c43
dependency_status: PROMOTION
dependency_return: REQUIRED
-->

## Objective

Materialize deterministic authoritative FULL execution on two independent,
ephemeral, dedicated x86_64 CI VMs without weakening the existing verification
contract, then use the trusted current-main controller to prove and close the
already integrated TL-07 subject SHA.

## Why

Hosted-runner resource variance produced opposing owner-scoped timeouts for the
same TL-07 merge SHA. The product snapshot is integrated, but TL-07 remains in
`PROMOTION` because its required exact-main proof is not deterministic enough
to satisfy the unchanged 240-second contract.

## In Scope

- The one-off, machine-verifiable dependency exception authorized by INFRA-005.
- Fail-closed subject-SHA attestation and closure authorized by INFRA-004.
- Mechanical `main` protection and protected `authoritative-ci` Environment.
- A separate Hetzner CI project/security boundary and minimum-scope token.
- Versioned Ubuntu 24.04 x86_64 bootstrap/image contract.
- Trusted ephemeral provisioning, two independent FULL legs, evidence,
  cleanup/deletion proof, bounded shadow validation and cutover candidate.
- Controlled verification and closure of TL-07 merge SHA
  `0e6193e4afa6ebe35accdac7b58e69fa992d9c43`.

## Out of Scope

- Product behavior, TL-08, Preview/Production/Dokploy/Cloudflare and real data.
- Timeout increase, retries-to-green, parallel owner-scoped suites, reduced
  suite inventory or silent GitHub-hosted FULL fallback.
- Persistent runner registration in the public product repository.
- Repository visibility changes and unrelated cleanup.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`DEVELOPMENT_AND_DELIVERY_WORKFLOW.md`](../delivery/DEVELOPMENT_AND_DELIVERY_WORKFLOW.md)
- [`MAIN_BRANCH_PROTECTION_CONTRACT.md`](../delivery/MAIN_BRANCH_PROTECTION_CONTRACT.md)
- [`SECURITY_BASELINE.md`](../architecture/SECURITY_BASELINE.md)
- [`QUALITY_STRATEGY.md`](../quality/QUALITY_STRATEGY.md)
- [`Deterministic Authoritative CI`](../delivery/DETERMINISTIC_AUTHORITATIVE_CI.md)

## Risks

- Public-repository PR code must never gain trusted provisioning authority.
- A cloud token or persistent runner registration would create root-equivalent
  infrastructure exposure if it crossed into an ephemeral test VM.
- A broad historical-SHA mechanism could counterfeit closure unless bound to
  the named dependency, current controller, workflow, run and exact subject.
- A caller-supplied local attestation could counterfeit subject verification;
  closure therefore requires the canonical non-expired artifact downloaded
  from the exact successful GitHub Actions run.
- Cleanup failure can leave billable/orphaned compute or credentials exposed.
- Current account capabilities, current Hetzner profile/pricing or the USD 25
  monthly guard may prevent the approved design from being materialized.

## Plan

- [x] Revalidate TL-07 merge SHA, Git/GitHub baseline and current Harness.
- [x] Implement the governed dependency exception with negative regressions.
- [x] Implement the subject-SHA closure contract with fail-closed regressions.
- [x] Apply and verify the minimum mechanical `main` protection.
- [x] Create and protect the `authoritative-ci` Environment.
- [x] Establish the isolated Hetzner CI project and project-scoped token.
- [x] Implement the versioned runner bootstrap/image contract.
- [x] Implement trusted ephemeral provisioning and deletion proof.
- [x] Integrate unchanged FULL execution and sanitized evidence.
- [x] Implement orphan/TTL safety.
- [ ] Run bounded shadow validation on two independent dedicated VMs.
- [ ] Prepare and verify the Tier-2 cutover candidate.
- [ ] Integrate Infra, run controlled TL-07 subject verification and close TL-07.

## Current

The isolated Hetzner project `SR-Taller-Authoritative-CI` exists with no
persistent compute. Its project-scoped token is stored only as the encrypted
`HCLOUD_TOKEN` secret in the protected `authoritative-ci` Environment. The
versioned bootstrap, two-leg controller, exact-subject validation, spread-host
placement, controller-IP firewall, ephemeral SSH identity, sanitized evidence,
verified deletion and scheduled expired-resource sweep are implemented locally.
The implementation commit `43bea4ab646b9a3203c01777cd6da54b13172673`
passed the canonical local Full Verification stages 0–19; this subsequent
checklist-only reconciliation does not misattribute that FULL run.

## Next

Request separate authority to push/open the shadow-only Infra candidate. Only
ordinary integration into protected `main` can safely execute the first Tier-2
shadow observation; shadow results then determine whether a separate cutover
candidate may proceed.

## Blockers

NONE for the local implementation candidate. Shadow validation and cutover are
intentionally unavailable before ordinary protected-main integration; that is
a trust-boundary requirement, not permission to run feature-branch code with
the cloud credential.

## Important Discoveries

- The repository is public and had no branch protection, ruleset, Environment
  or self-hosted runner at Infra start.
- Local, `origin/main` and live remote `main` all resolved to the preserved
  TL-07 merge SHA at Work Unit start.
- The only unrelated worktree artifact remains
  `apps/dev-preview-web/src/.DS_Store`.
- Exact-main closure remains the default. Subject closure is limited to the
  dependency named in this checklist and cannot accept an arbitrary ancestor.
- GitHub ruleset `main-governed-promotion` is active with zero bypass actors;
  its required check is pinned to GitHub Actions app id `15368`.
- Environment `authoritative-ci` uses a custom `main` branch policy,
  `can_admins_bypass: false` and contains only the encrypted secret named
  `HCLOUD_TOKEN`.
- Separate Hetzner project id `16132171` currently has no persistent resource.
  Its API token is project-scoped and has no Preview/Production authority.
- Authenticated Console selection confirmed CCX23 in `hel1`: x86 AMD, four
  dedicated vCPU, 16 GB RAM, 160 GB SSD, USD 0.163/hour per VM plus IPv4. The
  USD 101.49/month continuous price forbids persistent use under the guard.
- A 90-minute two-leg maximum projects below USD 0.50 before tax/IPv4; actual
  shadow observations and accumulated monthly spend still require review.
- The first code path is shadow-only. PR/fork events cannot enter it, the
  Environment independently admits only `main`, and the promotion aggregate
  remains on the current hosted FULL until bounded shadow evidence supports a
  reviewed cutover.
- Pre-push security review found that the subject-closure API accepted a local
  attestation document. The same branch now rejects local evidence and requires
  the single canonical, non-expired artifact downloaded from the exact
  successful GitHub Actions run before subject closure can proceed.

## Focused Verification

- [x] Work Unit lifecycle unit tests: 17/17 PASS after Blocks 1–2, including
  explicit non-ancestor subject and wrong closure-tag target rejection.
- [x] Subject-attestation provenance remediation: Work Unit tests 18/18 PASS,
  including wrong-run, expired and duplicate artifact rejection.
- [x] GitHub ruleset/merge-settings/Environment API readback matches Blocks 3–4.
- [x] Tier-2 focused unit/security regressions: 8/8 PASS.
- [x] Architecture/checker regression on final candidate: PASS.
- [x] Workflow/security regressions on final candidate: 63/63 PASS.
- [x] Base `verify`: PASS (1111 tests; 1064 pass; 47 governed PostgreSQL skips).
- [x] Full Verification on implementation commit `43bea4ab646b9a3203c01777cd6da54b13172673`:
  stages 0–19 PASS, owner-scoped 8/8 in 122.566 s, TL-07 3/3, 89 migrations,
  rerun 0 pending, smokes/fingerprint/cleanup PASS.
- [ ] Shadow FULL evidence on two independent dedicated VMs.
- [x] Promotion lifecycle check on the exact local Infra candidate: PASS.

## Promotion Gates

- Dependency exception is narrow, explicit and regression-protected.
- Subject attestation binds current trusted controller and authorized subject.
- Mechanical main/Environment protection precedes cloud-secret activation.
- Two independent ephemeral legs preserve the unchanged FULL/240-second gates.
- Shadow evidence demonstrates stable useful margin and complete deletion.
- Infra integration and exact-main governance precede TL-07 subject proof.
- Owner merge authority remains separate.

## Remote Actions / Authorization

- Owner authorized the minimum GitHub protection/Environment configuration and
  isolated Hetzner CI provisioning in the stated order.
- Owner explicitly authorized creation of the project-scoped Hetzner token and
  encrypted storage as `HCLOUD_TOKEN`; the secret value was not documented or
  placed on disk/VMs.
- No product deploy, Preview/Production mutation, TL-08 start, force push,
  merge or timeout/gate weakening is authorized.
- Stop for Owner decision at any explicit capability, security, budget or
  stability condition in the authorization.
- No persistent/billable VM, volume, load balancer or network was created.

## Handoff Notes

- TL-07 remains formally `PROMOTION`; its integrated subject SHA is preserved.
- The historical hosted-runner timeout evidence remains valid and unmodified.
- After Infra closes, control must return to controlled TL-07 proof; no second
  product Work Unit may start through this exception.
- Preserve `.DS_Store` untracked.

## Closure Predicate

This Infra Work Unit closes only after its reviewed candidate is merged by
ordinary authorized PR, exact-main authoritative governance is GREEN, the
approved Tier-2 path has passed bounded shadow validation, cloud cleanup is
proven, and the deterministic Infra closure ref targets its exact merge. TL-07
then closes separately only after a controlled current-main run attests the
explicit subject SHA and all TL-07 material gates, followed by its own closure
ref targeting `0e6193e4afa6ebe35accdac7b58e69fa992d9c43`.
