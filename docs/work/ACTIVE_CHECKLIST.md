# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: TL-04 — Public Registration + Email Verification
iteration: 2 - End-to-End Implementation
type: IMPLEMENTATION
risk: ARCHITECTURAL
shadow_risk: ARCHITECTURAL
branch: feature/tl-04-public-registration
base_sha: 07a954ea7c07304ea490f9d79edecaffa69576c5
status: READY_FOR_PROMOTION
closure_mode: DERIVED
last_updated: 2026-09-21
-->

Milestone: Tenant Lifecycle MVP

Sprint: NONE

Current PBI: NONE

Overall state: Local candidate verified / Ready for authorized remote promotion

Progress: 16 / 16

Current work: Stopped at the local promotion checkpoint

Next block: Remote promotion only after explicit Owner authorization

Blockers: none; `TL4D-001–007` approved by Owner

Last updated: 2026-09-21

## Objective

Implement the public self-service registration and email-verification authority
that safely feeds TL-03 and hands off to normal TL-02 administrative login.

## Why

An anonymous visitor must become a verified, immutable server-owned bootstrap
grant without gaining a path to choose Tenant, identity, Role or capabilities.

## In Scope

- Registration Attempt, challenge, legal evidence and bounded abuse controls.
- Provider-independent delivery with local/test and Resend adapters.
- Public HTTP and minimal accessible public UI outside Operational Session.
- Authoritative handoff to TL-03 and subsequent TL-02 login.

## Out of Scope

- TL-05, Branch, Tenant ACTIVE transition, Station, PIN, billing, plans,
  Super Admin or Landing content.
- Push, PR, merge or deploy.

## Applicable Contracts

- [`AGENTS.md`](../../AGENTS.md)
- [`WORK_UNIT_LIFECYCLE.md`](../delivery/WORK_UNIT_LIFECYCLE.md)
- [`Tenant Lifecycle MVP`](../architecture/TENANT_LIFECYCLE_MVP.md)
- [`ADR-015`](../decisions/proposed/ADR-015-tenant-administrative-control-plane.md)
- [`TL-04 readiness`](../architecture-readiness/tenant-lifecycle/TL-04_PUBLIC_REGISTRATION_EMAIL_VERIFICATION_READINESS.md)

## Risks

- Public abuse, email enumeration, token replay and KDF resource exhaustion.
- Credential material crossing the pre-tenant/bootstrap boundary.
- Provider delivery failure and secret leakage.
- Duplicate or concurrent verification creating authority twice.
- Retaining pre-tenant PII longer than required.

## Plan

- [x] Initialize the governed Work Unit from closed `main`.
- [x] Audit current public HTTP, UI, email and module infrastructure.
- [x] Audit TL-02 password/admin-session and TL-03 grant/bootstrap contracts.
- [x] Design attempt lifecycle, password boundary and challenge semantics.
- [x] Design email delivery, HTTP boundary and abuse controls.
- [x] Design bootstrap handoff, schema, UI boundary and tests.
- [x] Publish repository-native readiness plan.
- [x] Record Owner decisions `TL4D-001–007` and implementation authority.
- [x] Block 1: contract/module and narrow Access bootstrap executor.
- [x] Block 2: additive persistence, lifecycle/CAS, cleanup and audit.
- [x] Block 3: TL-02 password handoff and TL-03 grant source.
- [x] Block 4: challenge lifecycle, resend and abuse controls.
- [x] Block 5: delivery port, local/test and Resend adapters.
- [x] Block 6: public HTTP boundary and sanitized errors.
- [x] Block 7: public registration/verification UI and accessibility.
- [x] Block 8: PostgreSQL/E2E/isolation, docs and promotion verification.

## Current

All eight blocks are materialized. PostgreSQL 18.4, concurrency/replay,
retention, provider contracts, Chrome responsive/accessibility proof and the
exact-candidate full gate are GREEN. TL-04 is ready for an explicitly
authorized remote promotion; no remote action has occurred.

## Next

Await explicit Owner authorization for remote promotion. TL-05 remains
unstarted.

## Blockers

- None currently. Production remains fail-closed until approved legal content,
  Resend secret and verified sender/domain are configured operationally.

## Important Discoveries

- Resend is approved only as an infrastructure adapter behind Registration's
  replaceable delivery port; secrets remain external.
- Current React routes are all behind the Station/PIN operational gate.
- TL-03 is implemented/tested internally but intentionally has no runtime
  composition or HTTP endpoint; TL-04 needs a narrow Access-owned factory.
- Registration is a new pre-tenant owner and should become a governed module
  with dependency `registration -> access`, not a generic global helper.
- The existing 20 MB JSON parser exists for Catalog; registration needs a much
  smaller route-specific bound.

## Focused Verification

- [x] Markdown links.
- [x] Documentation consistency.
- [x] Secret-pattern scan.
- [x] `git diff --check`.
- [x] `work-unit:check --mode ACTIVE`.
- [x] PostgreSQL 18.4 TL-04 material suite `3/3`; 81 migrations and rerun `0 pending`.
- [x] Chrome desktop/768/640, light/dark and keyboard proof.
- [x] Exact-candidate `verify:full` stages 0–16.

## Promotion Gates

- The implementation candidate is `ARCHITECTURAL` and requires the full
  governed verification and deliberate review applicable at promotion time.

## Remote Actions / Authorization

- Local implementation, focused tests and logical commits are authorized.
- Push, PR, merge and deploy are not authorized.

## Handoff Notes

- Preserve `apps/dev-preview-web/src/.DS_Store` as unrelated untracked Owner
  artifact.
- No remote runtime, data or external system may be changed in this Work Unit.

## Closure Predicate

TL-04 reaches `READY_FOR_PROMOTION` only after all eight blocks, material
PostgreSQL/concurrency/provider/E2E/UI evidence and exact-candidate
`verify:full` pass with a clean tracked tree.
