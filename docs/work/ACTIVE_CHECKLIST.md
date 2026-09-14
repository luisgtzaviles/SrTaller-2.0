# Active Development Checklist

Milestone / Functional Goal: Development Workflow Efficiency — Phase 1
Sprint: SPRINT-03 — governance work outside product WIP
Current PBI: NONE
Status: Owner Accepted; governed integration in progress
WIP: 0/1 product PBIs — PBI-041 remains Ready, not selected or started
Progress: 10 / 10 materialization blocks
Current: Publish exact candidate and execute authoritative PR CI
Next: Independent review, authorized merge and exact-main full CI
Blocked: None
Last updated: 2026-09-14 MST

## Goal

Materialize the Owner-approved conservative workflow optimization without
reducing VC-024, exact-main, Preview validation, security, migration safety or
independent review. General risk classification and verified-tree attestation
remain shadow-only and cannot omit gates during the pilot.

## Materialization blocks

- [x] Audit PBI-039/PBI-040/PBI-043 campaigns and document recommendations.
- [x] Record Owner decisions WF-001 through WF-010 and their authority boundary.
- [x] Reconcile DEC-051 and canonical delivery documentation.
- [x] Implement fail-closed `DOCS_ONLY` classification and specialized gate.
- [x] Remove duplicated execution inside each authoritative Linux leg.
- [x] Implement unified, non-destructive development preflight.
- [x] Implement governed Preview migration-state snapshot and 24-hour freshness.
- [x] Instrument timings and findings without secrets or business data.
- [x] Implement general risk classifier and verified-tree attestation in shadow mode.
- [x] Add negative coverage, execute proportional/full gates and reconcile evidence.

## Guardrails

- DOCS_ONLY applies only to unequivocally non-executable documentation.
- Unknown or mixed deltas fail closed to the full pipeline.
- Tests, workflows, executable policies, scripts, configuration, runtime assets
  and executable evidence are never DOCS_ONLY.
- The general classifier records recommendations only during at least the next
  three implemented PBIs and cannot omit gates.
- Tree attestation records equivalence only and cannot reduce exact-main;
  `DOCS_ONLY` is the sole independently authorized reduced path.
- Migration hotfixes retain full exact-main throughout the pilot.
- Preview snapshot is advisory pre-merge unless it proves a material conflict;
  the real Preview journal is authoritative and blocking pre-deploy.
- No reset or destructive operation is performed without explicit authority.
- No PBI-041 implementation, product change, Production action or deploy.

## Owner decisions

- WF-001–WF-010: APPROVED on 2026-09-14.
- Workflow Phase 1: OWNER ACCEPTED; push, PR, CI, independent review, merge and
  absorbed-branch cleanup authorized on 2026-09-14.
- Observability targets: normal closure under 45 minutes and DOCS_ONLY under
  10 minutes; neither is an SLA or authorization to skip gates.

## Handoff boundary

This checklist tracks a governance/engineering change, not a product PBI.
Integration must preserve CI_INFRASTRUCTURE / HIGH RISK treatment, two
independent Linux legs, exact comparison, independent review and full
exact-main. Preview and Production remain unauthorized.
