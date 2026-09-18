# UX-002D — Capture Mode Friction Audit

## Scope

Read-only PBI-041 audit, 2026-09-17 MST. DB writes: 0. Product file changes:
none. `FULL` / Alta y actualización and `COMPACT` / Actualización compacta map
to the persisted `composer_mode` enum; they are not merely visual presets.

## Contract trace

| Stage | Verified behavior |
| --- | --- |
| UI | New/reset loads default to FULL. Radios lock when a Version exists. FULL shows full grid/defaults; COMPACT shows identifiers/cost/price. |
| API/domain | Mode is required. FULL requires kind/title/category/base price. COMPACT permits omissions but requires supplier code, SKU or barcode. |
| Persistence | `composer_mode` is NOT NULL, CHECK constrained, written at create, returned on reload/history, and retained after draft edits/analyze. |
| Analyze | Matching, history, candidates, duplicates, canonical naming, completeness, Coverage and Apply are common. Only an unmatched row differs. |

## Matrix

| Capability | FULL | COMPACT | Consequence |
| --- | --- | --- | --- |
| New row | May be NEW when references are governed | INVALID without target | COMPACT prohibits new items. |
| Existing price/cost update | UPDATE/UNCHANGED | Same | No difference. |
| Trusted reactivation | REACTIVATE | Same with target | No difference. |
| Canonical title | KEEP_CURRENT default, ADOPT explicit | Backend rule unchanged if proposal exists | No automatic rename. |
| Duplicates/candidates/conflicts | Same fail-closed rules | Same before no-target guard | Not mode safety. |
| PARTIAL/COMPLETE/Coverage | Independent | Independent | Not Owner load intent. |
| Apply/memory | Same RowDecision and atomic publish | Same | No difference. |

## Finding

Capture mode is **MIXED: safety policy plus implementation detail**, not Owner
intent like PARTIAL/COMPLETE. It cannot be derived safely before Analyze:
identifiers do not prove every row has a target, while trusted history and
candidates are known only during reconciliation. A supplier sheet can mix price
updates, full metadata and unknown rows; a global derived mode would be unsafe.

COMPACT's exclusive invariant is no NEW without a target. Other existing guards
remain independent: exact identifiers, trusted-history consistency,
candidate/ambiguous fail-closed, governed references, duplicate grouping,
KEEP/ADOPT, READY and atomic Apply. They do not replace the no-NEW policy.

If Owner never changes the FULL default, all current local FULL workflows remain
correct. Fixtures are not production usage statistics. COMPACT is useful for an
identified-update sheet where the Owner explicitly wants to prohibit new items.

Brand omission (v52/v53) is not inherited by either mode; FULL may require
governance and COMPACT only continues after target resolution. Reactivation and
the UX-002A.4 duplicate flow are mode-independent. PARTIAL and COMPLETE retain
their existing absence/coverage semantics in both modes.

## Options

| Option | Assessment |
| --- | --- |
| A Keep visible | Compatible but exposes a technical choice on every load. |
| B New Load gate | Adds friction to a gate already reserved for supplier/intention. |
| C Default + advanced | Recommended: FULL normal; COMPACT advanced, explained as only identified updates/no new items. |
| D Global derived | Unsafe before Analyze and fails mixed-row lists. |
| E Row-level hybrid | Strong future model but needs new policy/persistence/tests; not implemented. |

## Owner decisions pending

- UX2D-001: Does COMPACT remain an advanced safety policy?
- UX2D-002: Is global mode retained or is row-level hybrid investigated?
- UX2D-003: Is automatic pre-Analyze derivation prohibited?
- UX2D-004: Does FULL remain normal for new/insufficient rows?
- UX2D-005: Do defaults remain FULL-only without implicit history inheritance?
- UX2D-006: Do historical Versions preserve `composer_mode`? Recommendation: yes.

`replaceDraft` parses submitted mode but retains persisted `composer_mode`; UI
prevents switching it. Before future UI/API work, decide whether the backend
must reject a mismatched draft-mode request explicitly. Not remediated here.

Capture mode semantics are understood. Owner decision ready — not implemented.
