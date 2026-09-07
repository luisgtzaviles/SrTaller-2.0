# PBI-033 — Roles, Assignments and Capability Catalog Evidence

## Estado del documento

- **Estado:** implementation candidate en Draft PR #28; validación local y CI
  del implementation checkpoint PASS; exact-final-HEAD CI/focused review
  pendientes tras esta reconciliación de trazabilidad.
- **Autoridad:** PBI-033, ADR-012 y Master Goal Owner de Identity.
- **Regla:** registra evidencia observada; no predeclara gates futuros.

## Candidate state

- Status: `In progress — implementation candidate`.
- Baseline: `main` at
  `db6637ee6902b9b0e4a40ba39d7f203cb6889352`; authoritative CI
  `34074457695` GREEN.
- Branch: `feature/pbi-033-roles-capabilities`.
- Draft PR: #28 — `Add tenant-scoped roles and capabilities`.
- Implementation/review checkpoint:
  `90a4a970a807fdb855587d1b55f0bcc0d58c0294`.
- Authoritative CI del checkpoint: run `34080940466`; run-1, run-2 y
  comparison `SUCCESS` sobre el mismo SHA.
- DoR: [PASS](./DEFINITION_OF_READY.md).
- Risk: High; Owner-authorized within the Identity Master Goal.
- Size: Large.
- WIP: `1/1`; PBI-033 is the only current PBI.
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
must prove fresh apply, zero-work rerun, down/reapply and cleanup on PostgreSQL
18.4 before focused review.

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

Draft PR creation, local material validation and authoritative CI of the
implementation checkpoint are complete. Because this traceability-only change
advances the branch, run-1, run-2 and comparison must still be GREEN on the
exact final HEAD. That final HEAD/CI pair is bound by GitHub and the
focused-review record without making this evidence file self-referential.

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

PBI-033 remains `In progress` until exact-HEAD CI and focused review are
complete. A green branch remains a candidate;
focused high-risk review, merge/main CI, Owner Acceptance and canonical closure
are separate gates.

## Próxima revisión

Concluir CI autoritativo y focused review sobre el HEAD final exacto del Draft
PR #28. Si un gate material falla, conservar PBI-033 `In progress` y registrar
la remediación antes de integración.
