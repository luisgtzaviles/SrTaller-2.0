# Active Work Unit Checklist

Current PBI: NONE

<!-- WORK_UNIT_METADATA
work_unit: INFRA — Deterministic Authoritative CI Runner
iteration: 5 - deterministic capacity and cleanup
type: INFRASTRUCTURE_QUALITY
risk: ARCHITECTURAL
shadow_risk: ARCHITECTURAL
branch: fix/tier2-capacity-cleanup
base_sha: 0133d65339f2534d67764c2d770c655a6fb89214
status: ACTIVE
closure_mode: DERIVED
last_updated: 2026-09-23
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
contract. This iteration remediates the capacity and eventual firewall-release
defects demonstrated by the second material SHADOW attempt without changing
FULL, its gates or SHADOW authority.

## Why

Hosted-runner resource variance produced opposing owner-scoped timeouts for the
same TL-07 merge SHA. The product snapshot is integrated, but TL-07 remains in
`PROMOTION` because its required exact-main proof was not deterministic enough
to satisfy the former 240-second contract. The first material campaign
proved one complete deterministic leg but exposed pre-FULL transport and
cleanup defects. Their integrated remediation allowed both FULL legs to run in
the second campaign, which then proved CCX23 lacks stable capacity: one leg
timed out beyond 240 seconds and the other passed at 228.103 seconds. Both VMs
were removed; protected recovery removed the sole non-billable firewall
residual and independent inventory is empty.

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
- Independent, explicitly dispatched SHADOW eligibility on protected live
  `main`, including when hosted FULL is red.
- Explicit `normal` and `tier2-shadow` dispatch modes with no implicit mode
  inference.
- Credential-free trusted-context validation before protected Environment
  access and a mandatory explicit tested subject SHA.
- Machine-verifiable non-authoritative SHADOW metadata and negative promotion /
  closure regressions.
- One bounded recovery for recognized pre-FULL SSH transport failures; no FULL
  retry.
- Exact-run cleanup for non-server residuals, restricted to trusted live main
  and refusing any run that still contains a server.
- The Owner-authorized 360-second outer timeout only for the owner-scoped
  wrapper; all eight suites, the 150-second child timeout and the other four
  composite-suite 240-second timeouts remain unchanged.

## Out of Scope

- Product behavior, TL-08, Preview/Production/Dokploy/Cloudflare and real data.
- Any further timeout increase, retries-to-green, parallel owner-scoped suites,
  reduced suite inventory or silent GitHub-hosted FULL fallback.
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
- [x] Remove the hosted-success dependency from trusted SHADOW eligibility.
- [x] Prove SHADOW remains unable to satisfy promotion or Work Unit closure.
- [x] Diagnose the hosted FULL coupling before material provisioning.
- [x] Implement and verify explicit SHADOW-only dispatch.
- [x] Run canonical promotion verification on the implementation candidate.
- [x] Integrate shadow-only dispatch through governed PR #76.
- [x] Run the first material SHADOW attempt and preserve its failed evidence.
- [x] Remediate the demonstrated pre-FULL transport and cleanup defects.
- [x] Promote and integrate the material recovery through governed PR #77.
- [x] Remove both exact residual non-server resources with protected recovery.
- [x] Preserve the second material attempt as failed capacity evidence.
- [x] Remediate insufficient CCX23 capacity and eventual firewall release.
- [~] Apply the Owner-authorized bounded 360-second owner-scoped timeout and
  obtain a fresh normal two-leg authoritative campaign on the new PR HEAD.
- [ ] Run bounded shadow validation on two independent dedicated VMs.
- [ ] Prepare and verify the Tier-2 cutover candidate.
- [ ] Integrate Infra, run controlled TL-07 subject verification and close TL-07.

## Current

PR #78 preserved run-1 PASS with a 232.704-second owner-scoped campaign and
235.049-second wrapper, while run-2 terminated exactly at the former
240-second outer limit. The Owner classified this as host-resource variability
and authorized a new commit raising only the complete owner-scoped wrapper to
360 seconds. The candidate continues to select CCX43 and retain bounded
firewall cleanup. Historical failures remain failed evidence.

## Next

Run focused and canonical local verification on the new timeout-remediation
commit, push it normally to PR #78, and require a fresh complete two-leg
authoritative campaign before merge or material CCX43 observations.

## Blockers

PR #78 remains blocked until the new exact HEAD passes both normal hosted legs,
comparison and promotion gate. The Infra Work Unit also cannot close because no
successful material SHADOW campaign exists. There are currently no managed
Hetzner resources.

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
- PR #74 exact-main exposed a dependency deadlock: a hosted FULL failure made
  SHADOW ineligible even though hosted variability is the phenomenon SHADOW
  must measure. Owner authorized independent SHADOW eligibility without any
  authority change.
- Material-campaign preflight after PR #75 exposed a second coupling: manual
  dispatch always forced hosted FULL even though SHADOW no longer depended on
  its result. Owner authorized an explicit SHADOW-only mode; the campaign was
  not dispatched, no infrastructure was created and cost remained zero.
- Security review of the remediation removed an upstream-repository default
  from the validator so a missing caller identity fails closed like a fork;
  the SHADOW job also retains read-only repository permissions.
- Pre-push security review found that the subject-closure API accepted a local
  attestation document. The same branch now rejects local evidence and requires
  the single canonical, non-expired artifact downloaded from the exact
  successful GitHub Actions run before subject closure can proceed.
- First material SHADOW attempt cost estimate was USD 0.0466. One CCX23 leg
  passed FULL with owner-scoped 8/8 in 142.026 seconds; the other never started
  FULL after a pre-bootstrap SSH banner timeout.
- Provider inventory after the failed attempt proved zero managed servers and
  exactly one residual firewall. The firewall is non-billable, but cleanup is
  not complete until protected exact-run recovery proves zero residual
  resources.
- The cleanup bug is response-contract handling, not evidence of a VM leak:
  Hetzner returned `200` for asynchronous server deletion while the runner
  accepted only `204/404`.
- PR #77 integrated the transport and explicit-recovery remediation at merge
  SHA `0133d65339f2534d67764c2d770c655a6fb89214`. Its PR CI passed; exact-main
  hosted run `35845443267` preserved a run-2 owner-scoped 240-second timeout
  and was not retried.
- Protected recoveries `35846441443` and `35847832344` removed the exact
  firewall residuals from the first and second material attempts. Independent
  inventory `35846501183` proved zero managed resources between campaigns.
- Second material SHADOW run `35846558175` tested controller/subject
  `0133d65339f2534d67764c2d770c655a6fb89214`. One CCX23 leg completed 8/8 in
  228.103 seconds; the other exceeded 240 seconds. Campaign cost estimate was
  USD 0.0554 and the failed attempt contributes zero accepted legs.
- The selected remediation profile is CCX43 in `hel1`: 16 dedicated x86 vCPU,
  64 GB RAM, at least 360 GB SSD and USD 0.5216/hour per VM before IPv4/tax.
  This remains within the USD 10 session cap while prioritizing deterministic
  margin over premature cost optimization.
- PR #78 run `35849314937` classified FULL on exact HEAD `c12a97f`. Run-1
  passed owner-scoped 8/8 with campaign 232.704 s and wrapper 235.049 s;
  run-2 failed at the exact 240-second outer boundary, comparison skipped and
  promotion gate failed. It was not retried and no Tier-2 VM was created.
- The Owner subsequently authorized 360 seconds only for the owner-scoped
  outer wrapper. Assertions, fixtures, eight-suite inventory, serial execution,
  fresh databases, cleanup, child budget, comparison and PASS semantics remain
  unchanged.

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
- [x] Shadow-deadlock focused Harness/Infra regressions: 59/59 PASS.
- [x] Shadow eligibility matrix covers hosted green/red independence plus PR,
  fork, `pull_request_target`, non-main, stale controller and missing protected
  Environment denial.
- [x] Canonical Full Verification on final remediation implementation SHA
  `a8bca1ee881d44bd587b7d78f66c7a02a780e4ee`: stages 0–19 PASS,
  owner-scoped 8/8 in 116.940 s, TL-07 3/3, 89 migrations, rerun 0 pending,
  smokes/fingerprint/cleanup PASS.
- [ ] Shadow FULL evidence on two independent dedicated VMs.
- [x] First material attempt evidence preserved as FAIL; one leg FULL PASS,
  one leg pre-FULL transport failure, provider inventory zero servers.
- [x] Material recovery regressions: 14/14 PASS.
- [x] Base `verify` on recovery implementation: PASS (1119 tests; 1072 pass;
  47 governed PostgreSQL skips).
- [x] Canonical Full Verification on recovery implementation commit
  `ed1ddda83e474dc8e9d8195f480bd5f7770ae5a9`: stages 0–19 PASS,
  owner-scoped 8/8 in 124.602 s, PBI-041 9/9, TL-07 3/3, 89 migrations,
  rerun 0 pending, runtime/backend/UI smokes, fingerprint and cleanup PASS.
- [x] PR #77 CI on exact HEAD `88646e65f57f120543c3337d1a5cb1298713c5fb`:
  hosted run-1/run-2, owner-scoped 8/8 both, comparison and promotion gate PASS.
- [x] Second material attempt evidence preserved as FAIL; run-2 FULL PASS with
  owner-scoped 8/8 in 228.103 s, run-1 owner-scoped timeout, exact residual
  recovery PASS and final provider inventory empty.
- [x] Capacity/cleanup focused regressions: Tier-2 15/15,
  Work Unit/workflow/Tier-2 53/53, architecture and `git diff --check` PASS.
- [x] Base `verify` on capacity/cleanup implementation: PASS (1120 tests;
  1073 pass; 47 governed PostgreSQL skips), including typecheck and build.
- [x] Canonical Full Verification on capacity/cleanup implementation commit
  `f1099378d1fde7ba254bafcd798fac2601e80b4e`: stages 0–19 PASS,
  owner-scoped 8/8 in 103.799 s, PBI-041 9/9 with 16.875 s publish,
  TL-07 3/3, 89 migrations, rerun 0 pending, runtime/backend/UI smokes,
  fingerprint and cleanup PASS.
- [ ] Timeout-remediation focused regressions and canonical local verification
  on its exact implementation commit.
- [ ] Fresh normal PR #78 run-1, run-2, comparison and promotion gate on the
  new final HEAD; the failed historical run remains evidence, not a retry.
- [x] Promotion lifecycle check on the final implementation SHA: PASS.
- [x] Shadow-only workflow/Tier-2/Work Unit regressions: 65/65 PASS.
- [x] Base `verify` on the shadow-only implementation: PASS (1117 tests;
  1070 pass; 47 governed PostgreSQL skips), including typecheck and build.
- [x] Canonical Full Verification on shadow-only implementation commit
  `c92a29352e102e29afb222c9bb8b945468841dcb`: stages 0–19 PASS,
  owner-scoped 8/8 in 117.813 s, PBI-041 9/9, TL-07 3/3, 89 migrations,
  rerun 0 pending, runtime/backend/UI smokes, fingerprint and cleanup PASS.

## Promotion Gates

- Dependency exception is narrow, explicit and regression-protected.
- Subject attestation binds current trusted controller and authorized subject.
- Mechanical main/Environment protection precedes cloud-secret activation.
- Two independent ephemeral legs preserve FULL with the explicit 360-second
  owner-scoped wrapper budget and all other functional gates unchanged.
- Shadow evidence demonstrates stable useful margin and complete deletion.
- Infra integration and exact-main governance precede TL-07 subject proof.
- Owner merge authority remains separate.

## Remote Actions / Authorization

- Owner authorized the minimum GitHub protection/Environment configuration and
  isolated Hetzner CI provisioning in the stated order.
- Owner explicitly authorized creation of the project-scoped Hetzner token and
  encrypted storage as `HCLOUD_TOKEN`; the secret value was not documented or
  placed on disk/VMs.
- Owner's Master authorization permits bounded material campaigns,
  demonstrated Infra remediation, ordinary governed PR integration, a cutover
  candidate and the controlled TL-07 closure chain while every stated stop
  condition remains fail-closed.
- No product deploy, Preview/Production mutation, TL-08 start, force push,
  further timeout change or gate weakening is authorized. The exact 360-second
  owner-scoped remediation and ordinary governed Infra merges remain authorized
  while all stop conditions remain fail-closed.
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
