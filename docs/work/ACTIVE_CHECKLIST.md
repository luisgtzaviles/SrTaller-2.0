# Active Work Unit Checklist

<!-- WORK_UNIT_METADATA
work_unit: TL-04 — Public Registration + Email Verification
iteration: 1 - Discovery and Readiness
type: DISCOVERY
risk: ARCHITECTURAL
shadow_risk: ARCHITECTURAL
branch: feature/tl-04-public-registration
base_sha: 07a954ea7c07304ea490f9d79edecaffa69576c5
status: BLOCKED
closure_mode: DERIVED
last_updated: 2026-09-21
-->

Milestone: Tenant Lifecycle MVP

Sprint: NONE

Current PBI: NONE

Overall state: Discovery complete / Owner Decisions Required

Progress: 7 / 9

Current work: TL-04 readiness validated; no product implementation started

Next block: Owner decides `TL4D-001–007` and separately authorizes implementation

Blockers: provider, retention/TTL, abuse signal, public host and legal documents

Last updated: 2026-09-21

## Objective

Design the public self-service registration and email-verification authority
that safely feeds TL-03, without implementing product functionality.

## Why

An anonymous visitor must become a verified, immutable server-owned bootstrap
grant without gaining a path to choose Tenant, identity, Role or capabilities.

## In Scope

- Audit public HTTP/UI, TL-02, TL-03, email and persistence foundations.
- Design Registration Attempt, password handoff, challenge and bootstrap flow.
- Define abuse, terms/privacy, schema, UI, tests and implementation blocks.
- Identify only the remaining material Owner decisions.

## Out of Scope

- Product code, migrations or database writes.
- TL-05, Branch, Station, PIN, billing, plans, Super Admin or Landing content.
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
- [!] Obtain Owner decisions `TL4D-001–007`.
- [ ] Receive separate implementation authorization.

## Current

Readiness is complete. The Work Unit is blocked before implementation on the
explicit Owner/provider/legal decisions listed in the readiness document.

## Next

Owner decides `TL4D-001–007`; then authorize or reject the implementation
iteration. TL-05 remains unstarted.

## Blockers

- Transactional email provider and sender/domain are not approved.
- Verification/attempt TTL and retention/purge are not approved.
- Public rate-limit network signal/privacy treatment is not approved.
- Public host and legal document versions/content are not approved.
- Backend + minimal UI candidate boundary needs Owner confirmation.

## Important Discoveries

- There is no outbound email port/provider/configuration in the repository.
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

## Promotion Gates

- Not eligible for implementation or promotion while Owner decisions remain.
- A future implementation candidate is `ARCHITECTURAL` and requires the full
  governed verification and deliberate review applicable at promotion time.

## Remote Actions / Authorization

- None authorized or performed.

## Handoff Notes

- Preserve `apps/dev-preview-web/src/.DS_Store` as unrelated untracked Owner
  artifact.
- No product source, schema, runtime data or external system changed.

## Closure Predicate

This discovery iteration is complete when the audit/readiness artifact is
consistent and locally validated. The TL-04 implementation Work Unit remains
blocked until the Owner decisions and a separate implementation authorization
exist.
