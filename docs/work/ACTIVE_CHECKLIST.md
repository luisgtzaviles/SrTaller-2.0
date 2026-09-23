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
status: ACTIVE
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
- Cleanup failure can leave billable/orphaned compute or credentials exposed.
- Current account capabilities, current Hetzner profile/pricing or the USD 25
  monthly guard may prevent the approved design from being materialized.

## Plan

- [x] Revalidate TL-07 merge SHA, Git/GitHub baseline and current Harness.
- [x] Implement the governed dependency exception with negative regressions.
- [x] Implement the subject-SHA closure contract with fail-closed regressions.
- [~] Apply and verify the minimum mechanical `main` protection.
- [ ] Create and protect the `authoritative-ci` Environment.
- [ ] Establish the isolated Hetzner CI project and minimum-scope token.
- [ ] Implement the versioned runner bootstrap/image contract.
- [ ] Implement trusted ephemeral provisioning and deletion proof.
- [ ] Integrate unchanged FULL execution and sanitized evidence.
- [ ] Implement orphan/TTL safety.
- [ ] Run bounded shadow validation on two independent dedicated VMs.
- [ ] Prepare and verify the Tier-2 cutover candidate.
- [ ] Integrate Infra, run controlled TL-07 subject verification and close TL-07.

## Current

The exceptional Work Unit is explicit and machine-verifiable. Local Harness
changes preserve ordinary WIP behavior while allowing only this named
Infrastructure/Quality dependency over the preserved TL-07 `PROMOTION`
snapshot. Subject closure now requires a closed Infra controller, an explicitly
authorized ancestor SHA and matching successful attestation.

## Next

Complete focused regression/documentation validation, then apply the authorized
minimum `main` protection and protected Environment before any cloud credential
is made usable.

## Blockers

No blocker has been declared yet. Cloud provisioning remains fail-closed until
current Hetzner profile/pricing, isolated project access and minimum-scope
credentials are materially available.

## Important Discoveries

- The repository is public and had no branch protection, ruleset, Environment
  or self-hosted runner at Infra start.
- Local, `origin/main` and live remote `main` all resolved to the preserved
  TL-07 merge SHA at Work Unit start.
- The only unrelated worktree artifact remains
  `apps/dev-preview-web/src/.DS_Store`.
- Exact-main closure remains the default. Subject closure is limited to the
  dependency named in this checklist and cannot accept an arbitrary ancestor.

## Focused Verification

- [x] Work Unit lifecycle unit tests: 16/16 PASS after Blocks 1–2.
- [ ] Architecture/checker regression.
- [ ] Workflow/security regressions for trusted trigger and attestation.
- [ ] Shadow FULL evidence on two independent dedicated VMs.
- [ ] Promotion verification on the final Infra candidate.

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
- No product deploy, Preview/Production mutation, TL-08 start, force push,
  merge or timeout/gate weakening is authorized.
- Stop for Owner decision at any explicit capability, security, budget or
  stability condition in the authorization.

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
