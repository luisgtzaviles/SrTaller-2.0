# PBI-024 — Expediente de refinamiento y autorización

## Estado

- **Resultado del refinamiento:** `PASS — PBI-024 REFINED AND READY FOR FORMAL REVIEW`.
- **Resultado de remediación:** `PASS — PBI-024 FORMAL REVIEW REMEDIATIONS COMPLETE`.
- **Revisión independiente:** `PASS — PBI-024 IMPLEMENTATION AUTHORIZED`.
- **Estado de PBI-024:** `Authorized — implementation may begin; functional
  merge blocked by DEC-051 C02`.
- **Fecha:** 2026-07-26.
- **Riesgo:** alto, fail-closed.
- **Estimación:** `L`.
- **Cambio técnico:** ninguno.
- **SHA de diseño autorizado:**
  `5b3ba7fdd27fb135cfe9d559694384a396515922`.
- **Autorización de implementación:** [emitida](IMPLEMENTATION_AUTHORIZATION.md).
- **Implementación:** no iniciada.
- **DEC051-C02:** canónicamente `Pending`, materialmente
  `Partially satisfied`; el primer merge funcional sigue bloqueado.

## Propósito

Cerrar el diseño y la planificación de la menor fundación que permita resolver
tenant, sucursal y estación desde evidencia verificada por el servidor. El
refinamiento no creó código, schema, migraciones, dependencias ni rama
funcional. La autorización posterior permite crear la rama e implementar el
alcance aprobado, pero no permite merge funcional.

## Decisiones de diseño cerradas

1. `tenancy` conserva el ownership funcional de tenant y branch conforme a
   DEC-005. `stations` será owner de Station, `stations`,
   `station_bindings`, lifecycle, bindings y contexto derivado, y consultará
   elegibilidad de branch sólo por la superficie pública de `tenancy`.
2. La salida de este PBI se denomina `TrustedStationContext`, no contexto
   operativo completo: usuario y sesión pertenecen a PBI-025.
3. Una evidencia de estación sólo es confiable después de un verifier
   server-side. Un ID crudo del cliente nunca entra al resolver.
4. La station tiene estados mínimos `Unlinked`, `Active` y `Revoked`.
5. Relink exige `Active → Unlinked → Active`; nunca es una edición silenciosa.
6. Revocación es terminal dentro de PBI-024.
7. El historial de vinculaciones es requerido; no se sobrescribe la branch
   anterior.
8. La vigencia usa `stationRevision` para detectar stale context y un row lock
   sobre la station para serializar guard, efecto y revoke dentro de la misma
   transacción `READ COMMITTED`; no existe cache.
9. Link/unlink/revoke no obtienen endpoints ni wiring administrativo hasta que
   PBI-026 aporte autorización.
10. El mecanismo criptográfico de reconocimiento se consume por puerto y queda
    para PBI-029; no es un fallback a un ID cliente.

Las decisiones técnicas internas señaladas por la primera revisión
independiente quedaron cerradas documentalmente por la remediación. Esa
remediación no se autoaprobó: una segunda revisión independiente inspeccionó
el SHA remediado y emitió el PASS registrado en
[IMPLEMENTATION_AUTHORIZATION.md](IMPLEMENTATION_AUTHORIZATION.md). Los gates
de materialización continúan vigentes.

## Reconciliación con PBI-023

PBI-023 materializó temporalmente `BranchRepositoryPort`, su adapter Kysely y
el registro físico de `branches` bajo `stations`. Ese cierre no modificó
DEC-005 ni transfirió ownership funcional. Una implementación futura de
PBI-024 debe reconciliar la ubicación física del contrato/adapter y el registro
de ownership hacia `tenancy` antes de que el resolver consuma branch.

La distinción normativa es:

- ownership funcional: `tenancy` gobierna identidad, existencia y elegibilidad
  mínima de branch;
- ownership físico temporal: la ubicación heredada de PBI-023 es deuda de
  materialización, no autoridad;
- dependencia pública: `stations → tenancy` mediante `tenancy/index.ts`;
- FK: `station_bindings` puede referenciar `branches` sin crear co-ownership;
- transacción: aplicación coordina ambos puertos sobre el mismo contexto
  transaccional sin exponer Kysely ni consultar tablas ajenas.

## Estado actual reconstruido

| Superficie | Estado observado |
| --- | --- |
| `tenancy` | `TenantId`, port y adapter Kysely tenant-scoped; aún sin contrato público de branch |
| `stations` | port/adapter Kysely temporal para `branches`; sin entidad Station |
| `access` | módulo/composición de marcador; sin identidad o autorización |
| Schema | sólo `tenants` y `branches` |
| Contexto | no existe resolver, guard, factory ni contexto runtime |
| Wiring | módulos Nest importados; adapters registrados sólo a nivel type |
| Transacciones | runner explícito disponible; no existe consumidor funcional |
| Migraciones | provider/runner gobernado y una migración tenant/branch |
| `shared/` | no existe y no se necesita para este PBI |

## Índice

| Documento | Propósito |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | modelo, contratos, capas, persistencia y concurrencia |
| [STATION_LIFECYCLE.md](STATION_LIFECYCLE.md) | estados, transiciones y autoridad |
| [ALLOW_DENY_MATRIX.md](ALLOW_DENY_MATRIX.md) | matriz de seguridad y anti-enumeración |
| [ERROR_MAPPING.md](ERROR_MAPPING.md) | categorías, códigos y traducción DEC-044 |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | secuencia futura fail-closed |
| [TEST_PLAN.md](TEST_PLAN.md) | suites unitarias, aplicación, PostgreSQL y CI |
| [MUTATION_PLAN.md](MUTATION_PLAN.md) | defectos críticos que deben ser detectados |
| [EXPECTED_EVIDENCE.md](EXPECTED_EVIDENCE.md) | expediente y manifest esperados |
| [RISK_ASSESSMENT.md](RISK_ASSESSMENT.md) | riesgo alto y mitigaciones |
| [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) | criterio → autoridad → evidencia |
| [DEC_051_APPLICABILITY.md](DEC_051_APPLICABILITY.md) | condiciones de pruebas/CI |
| [DEC_063_APPLICABILITY.md](DEC_063_APPLICABILITY.md) | DoR/DoD por riesgo |
| [FORMAL_REVIEW_READINESS.md](FORMAL_REVIEW_READINESS.md) | gates y dictamen del refinamiento |
| [DEC_051_C02_TEMPORARY_TREATMENT.md](DEC_051_C02_TEMPORARY_TREATMENT.md) | permiso temporal sólo documental |
| [IMPLEMENTATION_AUTHORIZATION.md](IMPLEMENTATION_AUTHORIZATION.md) | dictamen, alcance autorizado y bloqueo de merge |

## Autoridad y límites

- [ADR-004](../../decisions/proposed/ADR-004-shared-schema-multitenancy.md)
  gobierna aislamiento y contexto confiable.
- [ADR-010](../../decisions/proposed/ADR-010-station-bound-operational-context.md)
  gobierna estación, vinculación y sucursal efectiva.
- [DEC-005](../../decisions/dec-005-modular-monolith-organization/DECISION_PROPOSAL.md)
  gobierna módulos, imports y wiring.
- [DEC-044](../../decisions/dec-044-error-strategy/DECISION_PROPOSAL.md)
  gobierna errores y anti-enumeración.
- [DEC-049](../../decisions/dec-049-persistence-ownership/DECISION_PROPOSAL.md)
  gobierna ownership, scopes y transacciones.
- [DEC-051](../../decisions/dec-051-testing-ci-strategy/DECISION_PROPOSAL.md)
  gobierna pruebas, CI y merge.
- [DEC-063](../../decisions/dec-063-definition-of-done/DECISION_PROPOSAL.md)
  gobierna riesgo, evidencia y estados.

## Siguiente acción

**Crear la rama funcional `r0/pbi-024-trusted-station-context` desde el commit
documental de autorización e iniciar exclusivamente la implementación
aprobada.**
