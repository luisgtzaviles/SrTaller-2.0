# Matriz de trazabilidad de PBI-024

| Requisito | Autoridad | Diseño | Evidencia futura | Estado |
| --- | --- | --- | --- | --- |
| tenant/branch server-side | ADR-004/010 | [Architecture](ARCHITECTURE.md) | resolver + AD-08/09 | definido |
| station source confiable | ADR-010 | Architecture § Fuente | recognition contracts | definido; adapter secreto diferido |
| contexto inmutable | ADR-010, DEC-049 | Architecture § Construcción | unit/freeze/guard | definido |
| usuario excluido | ADR-011, PBI-025 | Architecture § Nomenclatura | public-surface test | definido |
| lifecycle mínimo | ADR-010 | [Lifecycle](STATION_LIFECYCLE.md) | unit + PG | definido |
| relink explícito | ADR-010/DEC-012 | Lifecycle § Relink | history + stale tests | definido |
| revoke fail-closed | ADR-010 | Lifecycle § Revocación | AD-03/15 | definido |
| owner `stations` | DEC-005/049, PBI-023 | Architecture § Persistencia | policy + registry | definido |
| historia de binding | ADR-010 | `station_bindings` | schema/lifecycle | definido |
| scope tenant/branch | ADR-004, DEC-049 | Architecture/modelo | two-tenant PG | definido |
| no global/wildcard | ADR-004, DEC-049 | Architecture/public API | architecture mutation | definido |
| errores tipados | DEC-044 | [Error mapping](ERROR_MAPPING.md) | mapping/contracts | definido |
| anti-enumeración | ADR-004, DEC-044 | [Allow/Deny](ALLOW_DENY_MATRIX.md) | equality negatives | definido |
| concurrency/revision | DEC-049 | Architecture § Concurrencia | CAS/race PG | definido |
| no cache/context global | DEC-005/049 | Architecture | fixture/mutation | definido |
| PostgreSQL 18.4 | ADR-003, DEC-051 | [Test plan](TEST_PLAN.md) | CI PG artifacts | gate futuro |
| mutation crítica | DEC-051/D5-R033 | [Mutation plan](MUTATION_PLAN.md) | mutation results | gate futuro |
| CI doble | DEC-051 | [Expected evidence](EXPECTED_EVIDENCE.md) | run-1/run-2/comparison | gate futuro |
| riesgo alto | DEC-051/063 | [Risk](RISK_ASSESSMENT.md) | revisión formal | listo para revisión |
| C02 preservado | DEC-051 | [C02 treatment](DEC_051_C02_TEMPORARY_TREATMENT.md) | protección/rejection | `Pending`, merge bloqueado |
| seguridad | DEC063-C06 | [DEC-063](DEC_063_APPLICABILITY.md) | checklist + dictamen | gate futuro |
| PBI-025 | ADR-011 | Architecture/integración | full operational context | no iniciado |
| PBI-026 | ADR-012/013 | Lifecycle/autoridad | admin composition | no iniciado |
| PBI-027 | DEC-037/038 | fields diferidos | clock/time contract | bloqueado |
| PBI-028 | DEC-045–048 | Error mapping/logging | audit/correlation | no iniciado |
| PBI-029 | DEC-055 | recognition boundary | credential lifecycle | no iniciado |
| no auth/PIN/roles/repair | alcance | PBI/exclusiones | diff/architecture | obligatorio |

## Cadena

```text
formal review
  → separate implementation authorization
  → checker/contracts
  → lifecycle/schema
  → adapters/resolver/guard
  → PostgreSQL + isolation + concurrency
  → mutations + run-1/run-2/comparison
  → independent closure review
  → merge only after DEC051-C02
```

## DEC-009–012

| Contrato | Materialización propuesta |
| --- | --- |
| DEC-009 contexto tenant explícito | evidence server-side + tenant scoped resolver |
| DEC-010 sucursal efectiva | binding vigente determina branch |
| DEC-011 usuario multisucursal | PBI-024 no fija branch al usuario; PBI-025 consume contexto |
| DEC-012 cambio de sucursal | unlink + link, history y revision nueva |

No se reabre su aceptación conceptual; PBI-024 prepara aplicación y pruebas.
