# Active Development Checklist

Milestone: Hardened Identity + Users & Roles Checkpoint
Sprint: SPRINT-02 — Operational Authentication & Authorization
Current PBI: PBI-028 — Minimum Business Audit and Correlation; PBI-037 is an Owner-authorized product slice within this checkpoint
Status: Hardened local candidate; final browser proof and integration preparation in progress
Progress: 9 / 12 checkpoint blocks completed
Current work: Complete the remaining PIN/login browser walkthrough, then rerun final verification over the exact candidate.
Next block: Reconcile canonical documentation, create logical commits, Draft PR, CI run-1/run-2 and focused review.
Blockers: None. Merge and deploy remain unauthorized.
Updated: 2026-09-07 18:10 MST

## Master checkpoint

- [x] Proven functional baseline preserved
- [x] Git baseline, large mixed worktree and migrations inventoried
- [x] Canonical scope and Owner authority reconciled for hardening
- [x] Security, API, database, architecture and concurrency audit
- [x] Identity / Login UX coherent and hardened
- [x] Users & Roles UX coherent and hardened
- [x] PBI-028 audit/correlation hardened
- [x] PostgreSQL 18.4 fresh / upgrade / 0-pending verification
- [x] Full local verification
- [~] Browser QA and Owner-review localhost
- [ ] Logical commits, Draft PR, CI and focused review
- [ ] Owner merge authorization / canonical integration

## PBI-028 — Audit and Correlation

- [x] Functional Local
- [x] Owner Functional Acceptance
- [x] Hardening
- [x] Verification
- [ ] Integration candidate / CI / focused review
- [ ] Merge
- [ ] Done

## PBI-037 — Users & Roles Administration

- [x] Functional logic
- [x] UI redesign in business language
- [x] Security and API hardening
- [~] Verification (automated and PostgreSQL gates green; final PIN browser walkthrough pending)
- [ ] Integration candidate / CI / focused review

### Functional surface already proven

- [x] Roles screen
- [x] Crear rol
- [x] Editar rol
- [x] Capability matrix
- [x] Users screen
- [x] Crear usuario
- [x] Editar usuario
- [x] Asignar roles
- [x] PIN 4 dígitos
- [x] Activar / desactivar
- [x] Login con usuario creado
- [x] Permission proof
- [ ] Owner UX Review

## Required business-logic proof

- [x] Role `Ventas` created with only existing capability `repairs.read`
- [x] `Efrén Demo` has `Ventas` and a unique local four-digit PIN
- [x] `Valeria Demo` has `Ventas` and a different local four-digit PIN
- [x] Both users have no direct permissions and inherit exactly `Ventas`
- [x] PIN login creates and preserves the correct operational session for each user
- [x] Editing `Ventas` adds then removes `repairs.add_note` for both users without editing them
- [x] Server-protected Repair Detail UI reflects the changed capability
- [x] Temporary `Técnico` plus `Ventas` proves the union for Efrén Demo
- [x] Valeria Demo was deactivated, denied login, then reactivated with a persisted session after reload

## Credential presentation finding

- [x] No local source or database field contains the reported value `4511`
- [x] Operational identifiers are explicitly labelled `ID operativo`
- [x] User responses and UI expose only `pinConfigured`; no plaintext PIN, hash, verifier, or credential material

## Required user-editing proof

- [x] Efrén Demo renamed and operational identifier changed through Configuración → Usuarios
- [x] Profile change persisted after reload
- [x] Temporary `Técnico` role removed; only `Ventas` remained after reload
- [x] PIN replaced explicitly; prior PIN was denied and new PIN created Efrén's session
- [x] Efrén's effective capabilities matched only `Ventas`: Repair Detail read succeeded and Operational Note was absent
- [x] Efrén was deactivated and denied login with the new PIN
- [x] Efrén was reactivated and the new PIN authenticated again

## Hardened local browser proof

- [x] Configuración routes coherently to Users and Roles y permisos
- [x] Roles list/create/edit/capability grouping uses business labels and persists after reload
- [x] Users list/create/edit/multi-role/status changes persist after reload
- [x] User administration never renders a plaintext PIN or destructive delete action
- [x] Light/dark theme switches correctly
- [x] Mobile viewport has no horizontal overflow and preserves the user administration flow
- [x] Repair `SR-2026-001` accepts an Operational Note as real actor `Luis`
- [x] Timeline preserves the actor and note after reload
- [x] Business audit row contains the allowed action/resource/context/correlation/timestamp metadata and no note body field
- [ ] Final PIN-only error/reload/logout/switch walkthrough over the hardened UI

## Hardening evidence

- [x] PIN lookup uses keyed digest plus Argon2id verification, anonymous anti-enumeration and rate-limit/lockout controls
- [x] Branch-scoped collision guards reject ambiguous concurrently eligible PINs
- [x] PIN replacement and inactive-user login behavior are durable and covered materially
- [x] Administration reads and writes require tenant-wide server-side capability authority
- [x] Administration mutation authority is rechecked inside the same transaction as the effect
- [x] Role/user/PIN mutations use durable request identity, optimistic versions and rollback-safe persistence
- [x] PBI-028 note plus audit is atomic, idempotent, append-only and commit-authorized
- [x] Correlation UUID is generated server-side for success and error paths, including malformed JSON
- [x] PostgreSQL 18.4 material suite passed 8/8 with fresh/upgrade/second-run coverage
- [x] Local migrations report `0 pending` on consecutive runs
- [x] `pnpm install --frozen-lockfile` and `pnpm run verify` passed: 614 tests, 597 pass, 17 expected PostgreSQL skips, 0 fail
- [x] OCI image verification passed with read-only filesystem, non-root runtime, 28 fresh migrations, second run `0 applied / 0 pending`, health and route smoke, and clean SIGTERM

## Scope guard

The Owner-authorized Master Goal permits hardening, logical commits, ordinary
push, a Draft PR, CI and focused review for this accumulated local checkpoint.
It does not authorize merge, deploy, remote database or another milestone.
PBI-028 remains the canonical current PBI; PBI-037 stays explicitly traceable
as the product-administration slice and does not reopen completed foundations.
