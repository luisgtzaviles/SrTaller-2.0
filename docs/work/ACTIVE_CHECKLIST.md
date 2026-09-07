# Active Development Checklist

Milestone: Hardened Identity + Users & Roles Checkpoint
Sprint: SPRINT-02 — Operational Authentication & Authorization
Current PBI: PBI-028 — Minimum Business Audit and Correlation; PBI-037 is an Owner-authorized product slice within this checkpoint
Status: Hardening and integration candidate preparation in progress
Progress: 3 / 12 checkpoint blocks completed
Current work: Preserve the proven local worktree and complete security, API, database, architecture and UI audits.
Next block: Remediate findings with focused tests, then run PostgreSQL and full verification.
Blockers: None. Merge and deploy remain unauthorized.
Updated: 2026-09-07 16:52 MST

## Master checkpoint

- [x] Proven functional baseline preserved
- [x] Git baseline, large mixed worktree and migrations inventoried
- [x] Canonical scope and Owner authority reconciled for hardening
- [~] Security, API, database, architecture and concurrency audit
- [ ] Identity / Login UX coherent and hardened
- [ ] Users & Roles UX coherent and hardened
- [ ] PBI-028 audit/correlation hardened
- [ ] PostgreSQL 18.4 fresh / upgrade / 0-pending verification
- [ ] Full local verification
- [ ] Browser QA and Owner-review localhost
- [ ] Logical commits, Draft PR, CI and focused review
- [ ] Owner merge authorization / canonical integration

## PBI-028 — Audit and Correlation

- [x] Functional Local
- [x] Owner Functional Acceptance
- [~] Hardening
- [ ] Verification
- [ ] Integration candidate / CI / focused review
- [ ] Merge
- [ ] Done

## PBI-037 — Users & Roles Administration

- [x] Functional logic
- [~] UI redesign in business language
- [~] Security and API hardening
- [ ] Verification
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

## Scope guard

The Owner-authorized Master Goal permits hardening, logical commits, ordinary
push, a Draft PR, CI and focused review for this accumulated local checkpoint.
It does not authorize merge, deploy, remote database or another milestone.
PBI-028 remains the canonical current PBI; PBI-037 stays explicitly traceable
as the product-administration slice and does not reopen completed foundations.
