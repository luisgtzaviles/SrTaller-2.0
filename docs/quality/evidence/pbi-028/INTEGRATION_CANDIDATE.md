# PBI-028 — Hardened Identity Checkpoint Integration Candidate

## Estado

- **Estado:** Integrado funcionalmente por PR #37 y remediado por PR #38;
  cierre documental candidato pendiente de merge autorizado y CI exacto.
- **Current PBI / WIP:** NONE / `0/1` en el snapshot de cierre.
- **Baseline:** `main` at
  `a9bb0744ebf8b32b91a9ddf90f67570830182afc`.
- **Recovery checkpoint:**
  `f608ef165763c86a592f5062218cd93b6ca0eb7a`.
- **Hardened implementation checkpoint:**
  `cc2b756` (`feat(identity): harden audit and administration checkpoint`).
- **Functional PR / merge:** PR #37 / `ab8e8ba9a1274030e27ad920d61c66ed461bf122`.
- **PIN focus remediation / merge:** PR #38 /
  `a9bb0744ebf8b32b91a9ddf90f67570830182afc`.
- **Risk / size:** High / Large.
- **Released / deployed:** NO / NO.

This candidate preserves PBI-028 as the sole active PBI. The Owner-authorized
PBI-037 product iteration is carried as an explicitly traceable administration
slice because its PIN, Session, authorization and database boundaries are the
same boundaries exercised by the real-actor audit proof. This does not reopen
PBI-032 or PBI-033 and does not start another milestone.

## Observable result

The local product flow is usable from a trusted Station through PIN-only login,
an Operational Session, Repairs, Repair Detail and an Operational Note whose
timeline actor is derived from the real server-side Session. Configuration now
provides business-language Users and Roles administration without direct User
permissions or credential disclosure.

## Security and consistency controls

### PIN, identity and Session

- Four-digit PIN-only login has no User selector and resolves identity inside
  the Station Branch context.
- A keyed lookup digest narrows the candidate and Argon2id performs one real or
  dummy verification. The lookup and public errors do not enumerate Users.
- Rate limiting, failed-attempt lockout and bounded hashing capacity fail
  closed.
- A database guard prevents two simultaneously eligible Users in one Branch
  from producing an ambiguous PIN result; global PIN uniqueness is not imposed.
- Provision/replacement is idempotent and serialized. Plaintext PIN is accepted
  only at the HTTP/application boundary, is never passed to persistence and is
  never returned by API or UI.
- Credential version changes and User/assignment lifecycle changes invalidate
  an affected active Session. Session replacement and logout are optimistic,
  replay-safe and same-origin/CSRF protected.

### Roles and Users administration

- Roles are reusable capability sets; a User receives one or more Roles and no
  direct permissions. Effective capabilities are the union of applicable
  active Role assignments.
- Create/edit Role, replace capability set, create/edit User, assign/revoke
  Role, set/replace PIN and active/inactive transitions use strict payloads,
  durable request identity and optimistic versions.
- Ordinary User creation has a durable request journal: an exact retry returns
  the original server-owned identity, a divergent payload conflicts, and a
  concurrent loser rolls back before replaying the winner.
- Ambiguous profile-update retries retain an immutable command and reconcile
  the authoritative User projection before issuing the same command again.
- PIN configured/administrator-continuity projections count only the supported
  credential profile and pepper version. Administration capabilities are
  canonically composed before the browser consumes them.
- Both reads and writes require the exact administration capability with
  tenant-wide authority. Mutation authority is revalidated in the same
  transaction as the effect to close the authorization TOCTOU window.
- Revoked User semantics remain terminal and the product surface has no delete
  operation.

### PBI-028 audit and correlation

- Repairs owns an append-only audit store scoped to `repairs.add_note`; it is
  separate from the timeline and has no product query/export UI.
- Note and audit event commit in the same PostgreSQL transaction. A failed
  mandatory audit write rolls back the note.
- A durable request guard provides exactly-once retry/concurrency behavior and
  retains the correlation of the confirmed effect.
- Operational authorization is revalidated inside the write transaction.
- The full Station/User/credential/grant authority guard runs before Repair
  lookup, then Session idle/absolute time is rechecked after the final blocking
  Repair lock and immediately before the atomic effect.
- Correlation is a server-generated UUID on both success and error paths,
  including malformed JSON; it is separate from `clientRequestId` and cannot be
  chosen by the frontend.
- The audit allowlist contains actor, Tenant, Branch, Station, Session,
  capability, action, resource, result, correlation and timestamp. Its schema
  contains no note body, PIN, token, cookie, headers, arbitrary payload or
  secrets.

## Local verification

| Gate | Observed result |
|---|---|
| Toolchain | Node.js `24.18.0`; pnpm `11.15.1`; PostgreSQL `18.4` |
| Frozen install | PASS |
| `pnpm run verify` | PASS on `9c9ba04` — 630 total, 613 pass, 17 expected material skips, 0 fail |
| PostgreSQL owner-scoped material | PASS — 8/8, 0 skipped, cleanup PASS |
| PostgreSQL material fingerprint | `50d539575718151676ce139a1a9b079c383559049e6207930538173ca343066d` |
| Local migration upgrade / rerun | PASS — final additive migration applied once, then the second run left `0 pending`; manifest `1165e175ff10faafbe3f8e5c71d1b065e54a0d76eabd1bdca6835d7ee84a7092` |
| Production dependency audit | PASS — 0 vulnerabilities; `qs` resolves only to `6.16.0` |
| Candidate secret scan | PASS — no private-key or provider-token signatures; literal credential-name matches were confined to synthetic tests and non-secret type/algorithm values |
| Markdown links | PASS — 601 tracked Markdown files, 0 broken local targets |
| Git hygiene | PASS — recovery evidence preserved; one ignored stale generated pnpm manifest copy removed; tracked worktree clean |
| OCI contract | PASS — exact-code image `sha256:64648ccfd42d8147765d0d5b5a2dcb7b99cd545fa5376b827a713d9b0f905a5b`; 31 fresh migrations, second run `0 applied / 0 pending`, read-only uid `1000:1000` runtime, no filesystem diff, health/routes and clean SIGTERM; verifier errors redact generated secrets |
| DEC-005 / UI / external configuration | PASS in canonical verify |
| Focused contracts | PASS — administration, role input, Session UI, note/audit and global correlation |
| Focused High-risk reviews | PASS — PBI-028, PIN/Access and UI/API each closed at `0B/0H/0M/0L` |
| PR #37 candidate CI | PASS — run `34192344782` on `a24f67f`: VC-024 run-1, run-2 and comparison SUCCESS |
| PR #37 exact-main CI | PASS — run `34193770228` on `ab8e8ba`: VC-024 run-1, run-2 and comparison SUCCESS |
| PR #38 candidate / exact-main CI | PASS — candidate run `34195845242` on `e572ff8`; exact-main run `34197268832` on `a9bb074`; both run-1, run-2 and comparison SUCCESS |
| `git diff --check` | PASS |

The material PostgreSQL runner covers PIN collision, lockout, replacement,
tenant/Station isolation, Session concurrency, role union and mutation,
authorization revocation, PBI-028 atomicity/idempotency/concurrency/rollback and
owner-scoped migrations. Focused remediation also covers successful
authentication rate-window reset, legacy credential replacement, commit-time
Session expiry after a blocking Repair lock, authority/revocation
linearization across all three transaction orderings, malformed JSON
correlation, tenant-wide administration
projection, administrator continuity and administration Session revalidation.
It also covers durable ordinary-User creation replay/conflict/concurrency,
unsupported PIN pepper-version exclusion, canonical administration capability
ordering and immutable profile retry reconciliation.
The OCI verifier uses an ephemeral database and a synthetic in-memory pepper;
no secret is built into the image or retained in command failure diagnostics.

## Browser evidence on localhost

- `/configuracion`, `/configuracion/roles` and `/configuracion/usuarios` render
  inside the existing Application Shell with human capability labels.
- Role list/create/edit/capability replacement persisted after reload.
- User list/create/edit/multi-role/status changes persisted after reload; PIN
  presentation is only `Configurado`/`Pendiente` and `Cambiar PIN`.
- Light/Dark worked; a `390 × 844` viewport had no horizontal overflow and the
  mobile administration flow remained usable.
- Repair `SR-2026-001` accepted a local synthetic note as actor `Luis`; the
  timeline kept actor and content after reload.
- The corresponding audit row confirmed `repairs.add_note`, scoped context,
  server UUID correlation and timestamp without a note-body column.
- A final hardened PIN-only walkthrough used three authorized synthetic local
  identities without recording credential values. An unknown PIN produced the
  same non-enumerating error; Efrén and Valeria each created the correct
  server-backed Session; Valeria's Session survived reload; and the explicit
  change-user action replaced Efrén with Valeria.
- Both `Ventas` users could open Repairs and Repair Detail while administration
  was denied and the Operational Note control remained absent. Valeria kept
  her identity, Role and configured-PIN indicator through deactivation; login
  was denied while inactive, then succeeded after reactivation.
- The browser was returned to the active `Luis` administrator Session on
  `/configuracion/usuarios`; the directory showed Efrén and Valeria active,
  assigned to `Ventas`, and only `Configurado` rather than any plaintext PIN.

Local URLs remain `http://127.0.0.1:4173`,
`http://127.0.0.1:3000/livez` and `http://127.0.0.1:3000/readyz`; all three
returned HTTP 200 during candidate validation.

## Closure gate still pending

Focused review closed with `0 BLOCKER / 0 HIGH / 0 MEDIUM / 0 LOW`; Owner
Acceptance was granted and PR #37/PR #38 have exact-main CI GREEN. The only
remaining predicate is the authorized merge and exact-main CI of the single
documentary closure PR. It does not authorize release or deploy.

## Residual boundaries

- Four digits remain an Owner-approved usability decision protected by
  compensating controls; it is not equivalent to a high-entropy password.
- Local fixtures and local bootstrap are not productive enrollment or
  credential distribution.
- An actor with direct privileged PostgreSQL access is outside application-level
  append-only enforcement.
- PBI-028 audit remains intentionally limited to `repairs.add_note`; extended
  observability, legal retention, export and other writes remain separate work.
- Customers, New Repair, Pricing, Payments, Inventory and deploy remain outside
  this checkpoint.
