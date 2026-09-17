# PBI-041 — Evidence Index

PBI-041 historical Catalog reactivation is `Owner Review ready — Owner
Acceptance pending`. This directory contains readiness and local implementation
evidence. It does not grant acceptance, integration, deployment or release
authority.

- [Implementation Evidence](IMPLEMENTATION_EVIDENCE.md)
- [Definition of Ready](DEFINITION_OF_READY.md)
- [Threat Model](THREAT_MODEL.md)
- [Test Strategy](TEST_STRATEGY.md)
- [Persistence and Migration Design](PERSISTENCE_DESIGN.md)
- [PBI](../../../backlog/pbis/PBI-041.md)
- [Price List Architecture](../../../architecture/PRICE_LIST_ARCHITECTURE.md)
- [Bulk Composer Discovery](../../../domain/PRICE_LIST_BULK_IMPORT_AUDIT_AND_DOMAIN_DESIGN.md)
- [UX-001 Supplier Selection Gate Audit](../../../domain/PRICE_LIST_UX_001_SUPPLIER_SELECTION_GATE_AUDIT.md)

PBI-040 is `Done`, `Released: NO`. PBI-041 is the single WIP and stops at local
Owner Review. Advanced Supplier Reconciliation remains a deferred outcome
without PBI ID, selection or readiness.

## UX-001 Supplier Selection Gate — local Owner Review

UX-001 is implemented locally under the accepted D01..D10 decisions. The
Composer now separates unrestricted history browsing from the explicit
supplier selection required for a new load. The local proof opened AG `v53`,
cancelled the gate with that historical view intact, selected AG explicitly,
changed it again before any save, and exercised Escape/focus restoration and
case-insensitive search. No Source, Version, draft, analysis, Catalog record,
`v52`, or `v53` was mutated during that proof. See the
[UX-001 audit and result](../../../domain/PRICE_LIST_UX_001_SUPPLIER_SELECTION_GATE_AUDIT.md).
