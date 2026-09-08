# Active Development Checklist

Milestone: Timezone Foundation — Hardening & Integration Candidate
Sprint: SPRINT-02 — Operational Authentication & Authorization
Current PBI: PBI-038 — Timezone Foundation Integration and Hardening; WIP 1/1
Status: Candidate hardening complete; local delivery checks and Draft PR preparation pending
Progress: 6 / 11
Current work: Reconcile evidence, complete delivery checks and create the Draft PR.
Next block: Wait for exact-head CI and complete focused review; no merge or deploy.
Blocked: No technical blocker.
Last updated: 2026-09-08 MST

## Integration candidate

- [x] Functional
- [x] Owner Functional Approval
- [x] Hardening — IANA/DST and exact-boundary regressions added
- [x] PostgreSQL material — isolated PostgreSQL 18.4 Repairs and authorization suites pass
- [x] Full verification — `pnpm run verify` PASS with Node 24.18.0 / pnpm 11.15.1
- [x] Browser QA — Hermosillo → Cancún → Hermosillo, reload, Repair Detail/Timeline and Worklist verified locally
- [ ] Candidate CI
- [ ] Focused review
- [ ] Merge
- [ ] Exact-main CI
- [ ] Canonical integration/closure

## Guardrails

- [x] Reuse PBI-027 IANA `Branch.timeZone`; no new migration or timezone foundation
- [x] Keep historical timestamps as UTC instants; no rewrite, session timezone change or fixed-offset authority
- [x] Keep Branch scope server-derived from Trusted Station and authorized Session
- [x] No merge, deploy, remote database, DNS or infrastructure change; candidate CI and Draft PR are authorized only for this PBI

## Timezone presentation audit — 2026-09-08

- [x] Audit complete — Dashboard, Worklist, Repair Detail, Timeline, Operational Notes, Session/Login, Users/Roles, Settings and every current `App.tsx` route reviewed
- [x] UTC storage invariant — `timestamptz` persistence and ISO read models; local PostgreSQL session remains `Etc/UTC`
- [x] IANA authority — Branch accepts IANA identifiers and rejects fixed offsets; changing `Branch.timeZone` updates presentation only
- [x] Worklist BUG remediated — server derives the Branch timezone from authorized Station/Session scope, then converts local calendar limits to UTC before PostgreSQL
- [x] `repair-view.tsx` RISK resolved — unused browser-local formatter removed; current rendered repair surfaces require the Branch timezone explicitly
- [x] Focused boundary proof — PostgreSQL 18.4 verifies Hermosillo/Cancún for today, week, month and custom from/to at UTC-midnight edges, with unchanged stored instants
- [x] Local proof — Branch switched Hermosillo → Cancún → Hermosillo with save/reload; final persisted IANA value is `America/Hermosillo`
- [x] Canonical temporal contract — registered in `docs/architecture/DATA_ARCHITECTURE.md`, including the mandatory classification for future temporal surfaces
- [x] Owner Functional Approval — accepted the completed local remediation and temporal rule; no product expansion started

## Timezone foundation review

- [x] Settings → Sucursal
- [x] IANA persistence
- [x] Human UTC label
- [x] Timeline presentation
- [x] Worklist visible timestamps
- [x] Today local boundary
- [x] Week local boundary
- [x] Month local boundary
- [x] From/to local boundaries
- [x] Browser timezone dependency removed
- [x] UTC storage invariant
- [x] Hermosillo/Cancún material proof
- [x] Restricted administration proof — Efrén logged in locally after an authorized temporary PIN reset; only Ventas was assigned, direct Sucursal access was blocked, and focused server authorization tests denied read/update
- [x] Owner Functional Approval — accepted 2026-09-08; preserve local work pending a separately authorized integration round
