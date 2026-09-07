# PBI-033 — Roles, Assignments and Capability Catalog Evidence

## Estado del documento

- **Estado:** cierre canónico candidato; validación material, candidate/CI
  exactos, focused high-risk review, merge funcional, CI exacto de `main` y
  Owner Acceptance condicional PASS. Cierre documental merge/CI pendiente.
- **Autoridad:** PBI-033, ADR-012 y Master Goal Owner de Identity.
- **Regla:** registra evidencia observada; no predeclara gates futuros.

## Candidate state

- Status: `Done candidate — cierre documental pendiente`; `Released: NO`.
- Baseline: `main` at
  `065b859e3db64f82f033ce75ce5fb33df9b3ade1`; authoritative CI
  `34082394514` GREEN.
- Branch: `feature/pbi-033-roles-capabilities`.
- Functional PR: #28 — `Add tenant-scoped roles and capabilities`; merged.
- Implementation/review checkpoint:
  `90a4a970a807fdb855587d1b55f0bcc0d58c0294`.
- Authoritative CI del checkpoint: run `34080940466`; run-1, run-2 y
  comparison `SUCCESS` sobre el mismo SHA.
- Reviewed candidate: `bb5a1efde19171703d0b3ce84567ff14538b32b7`.
- Candidate CI: run `34081637692`; run-1, run-2 y comparison `SUCCESS` sobre
  el mismo SHA.
- Functional merge: `065b859e3db64f82f033ce75ce5fb33df9b3ade1` at
  `2026-09-07T04:15:05Z`.
- Exact-`main` CI: run `34082394514`; run-1, run-2 y comparison `SUCCESS`.
- Focused high-risk review: PASS; findings abiertos BLOCKER/HIGH/MEDIUM: 0;
  residual grant-projection boundary LOW.
- Conditional Owner Acceptance: satisfied.
- DoR: [PASS](./DEFINITION_OF_READY.md).
- Risk: High; Owner-authorized within the Identity Master Goal.
- Size: Large.
- WIP: `0/1`; current PBI: NONE. PBI-025 is selected, not started.
- Released/deployed: NO.
- Functional commits:
  - `2453019f914fefeac01eb99d5ca70e88ec8e38cd` — modelo, migraciones y
    persistencia tenant-scoped;
  - `e5f027ac744781ee6ecd7f25c4cee06c260d0d63` — pruebas materiales,
    arquitectura y fixtures locales.

## Candidate scope

- Capability catalog: `users.read`, `access_matrix.read`, `repairs.read` and
  `repairs.add_note`.
- Tenant-scoped roles and role-capability composition.
- Multiple role assignments per User with `TENANT_WIDE` or
  `BRANCH_RESTRICTED` scope.
- Server-only assign/revoke commands with durable replay evidence,
  idempotency, optimistic revocation and concurrency protection.
- Read models for the access matrix, Users with applicable assignments and a
  deterministic grant union. They are not final login/authorization verdicts.
- Additive PostgreSQL migrations and deterministic synthetic local/test seed.

## Persistence inventory

| Migration | Materialized objects |
|---|---|
| `20260906180000_access_create_capability_catalog` | `access_capabilities` |
| `20260906181000_access_create_roles` | `access_roles`, `access_role_capabilities` |
| `20260906182000_access_create_role_assignments` | `access_role_assignments`, `access_role_assignment_commands` |

Ownership remains in `access`; Users, Branches and Tenants are referenced
through governed contracts and composite tenant-safe keys. The migration chain
proved fresh apply, zero-work rerun, down/reapply and cleanup on PostgreSQL 18.4
before focused review.

## Local/test scenario

| User | Starter role | Assignment scope |
|---|---|---|
| Jorge Sintético | Administrador | Tenant-wide |
| María Sintética | Atención al cliente | Tenant-wide |
| Carlos Sintético | Técnico | Branch-restricted to the first configured local Branch |

Fixtures are deterministic, frozen, synthetic and secret-free. They do not
create a productive bootstrap path or change the authority of names.

## Local verification

| Gate | Result |
|---|---|
| Toolchain | PASS — Node.js `24.18.0`, pnpm `11.15.1`, PostgreSQL `18.4`. |
| Domain/application/contracts | PASS — capability composition, strict scopes, server-owned IDs/time and optimistic revoke. |
| PostgreSQL material | PASS — two independent runs, 5/5 suites each, zero skips/failures, cleanup PASS and comparison MATCH. |
| Material fingerprint | `f64471e50567e72afb15095874e6cfa58dfdd0ec053a8f8561c1bc4183be26f6`. |
| PostgreSQL coverage | Fresh apply, zero-work rerun, down/reapply, composite references, tenant/Branch isolation, multi-role union, disabled/archived/revoked exclusion, concurrent replay/conflict and transactional rollback. |
| `pnpm run verify` | PASS — 476 tests, 462 pass, 0 fail and 14 governed PostgreSQL skips exercised separately by the material runner. |
| DEC-005 architecture | PASS — Access owner/port/adapter/composition registration and negative mutation coverage, including D5-R041. |
| Local fixtures | PASS — deterministic, frozen, synthetic, tenant-scoped and production-surface-free. |
| `git diff --check` | PASS. |
| External configuration / secret scan | PASS — governed external-configuration boundary and no high-confidence credential material in changed files. |

Draft PR creation, local material validation, implementation-checkpoint CI and
exact reviewed-candidate CI are complete. GitHub binds the exact pair
`bb5a1efde19171703d0b3ce84567ff14538b32b7` / `34081637692`; this file does
not require its own future SHA. PR #28 merged as
`065b859e3db64f82f033ce75ce5fb33df9b3ade1`, whose exact `main` CI
`34082394514` is GREEN.

## Boundaries retained

- No PIN, credential, Operational Session or login.
- No final contextual authorization decision; PBI-026 consumes this model.
- User lifecycle and trusted Branch validity remain separate predicates owned
  by Users and Stations; PBI-026 must intersect them before any protected
  effect.
- No public Users/Roles administration endpoint or editor.
- No direct User permissions, role inheritance, explicit deny or general ABAC.
- No reinforced authorization, remote secrets, deployment or release.

## Review boundary

PBI-033 is `Done candidate`. Candidate CI, focused high-risk review, functional
merge, exact-`main` CI and conditional Owner Acceptance are complete. Canonical
closure remains a separate gate: this documentation change needs authorized
merge and GREEN CI on its exact `main` SHA. The [closure packet](./CLOSURE_CANDIDATE.md)
records that boundary.

## Próxima revisión

Owner merge review del cierre documental candidato. Si su merge o CI exacto
falla, conservar PBI-033 y G2 como candidates y remediar dentro del alcance
documental. PBI-025 permanece seleccionado, no iniciado.
