# Resultados consolidados de PBI-023

## Dictamen

**PASS — PBI-023 FORMALLY CLOSED**

El expediente define estimación, DEC-050, versiones candidatas, arquitectura,
schema mínimo, aislamiento, migraciones, riesgos, gates y plan. SPIKE-002
ejecutó E1–E12 dos veces contra PostgreSQL real, comparó resultados y limpió
todo recurso. El Paso 3 agregó D5-R037–D5-R047, registry fail-closed, 36
fixtures y 11 mutaciones sin tocar `src/`. El Paso 4 instaló las tres
dependencias exactas y los Pasos 5–6 materializaron configuración y conexión
controladas. El Paso 7 materializó un transaction runner explícito,
owner-internal y fail-closed, con commit/rollback, isolation, read-only,
concurrencia, errores y dos runs PostgreSQL `18.4` reales. El Paso 8
materializó `Migrator`/`FileMigrationProvider`, discovery, manifest/drift,
journal, status/up/down, lock finito y D5-R049; dos runs PostgreSQL `18.4`
coincidieron y limpiaron todos los probes. El Paso 9 añadió sólo
`tenants`/`branches`, introspección, aislamiento estructural y D5-R050–D5-R053.
El Paso 10 añadió sólo ports/adapters owner-scoped, capability interna,
errores, transacciones y aislamiento negativo; dos runs PostgreSQL `18.4`
coincidieron. No existe startup, endpoint, provider Nest ni consumer
funcional. El Paso 11 ejecutó las cinco suites críticas en PostgreSQL `18.4`
real dentro de `run-1` y `run-2`, para push y PR. Comparaciones, artifacts,
cleanup y sanitización pasaron. La revisión formal independiente confirmó las
tres remediaciones documentales, repitió los gates y cerró PBI-023 sin
ampliar la autorización limitada vigente de R0 ni autorizar PBI-024, merge o
el cambio del PR #2 a Ready.

## Checklist

| Entregable | Resultado |
|---|---|
| preflight main/branch | PASS |
| estimación Fibonacci | PASS — 13 SP |
| decisión de split | PASS — no split previo; checkpoints |
| DEC-050 | PASS WITH CONDITIONS — Accepted |
| investigación SPIKE-002 | PASS |
| ejecución SPIKE-002 | PASS — E1–E12, dos runs |
| versiones candidatas | PASS — exactas |
| diseño técnico | PASS documental |
| modelo mínimo | PASS documental |
| tenant isolation plan | PASS documental |
| DEC-049 risk/checklist | PASS documental; condiciones pendientes |
| DEC-051 applicability | PASS documental; triggers preservados |
| DEC-063 applicability | PASS documental; triggers preservados |
| implementation plan | PASS documental |
| traceability/evidence | PASS documental |
| checker/boundaries Paso 3 | PASS — D5-R037–D5-R047 |
| dependencias exactas Paso 4 | PASS — 3 directas + 13 transitivas |
| lifecycle/supply chain | PASS — cero scripts de terceros/advisories |
| doble frozen install | PASS |
| configuración tipada Paso 5 | PASS |
| connection facility Paso 6 | PASS |
| PostgreSQL 18.4 facility | PASS — dos runs, material MATCH |
| errores/sanitización/concurrencia/cierre | PASS |
| transaction runner Paso 7 | PASS |
| isolation/read-only/nesting/rollback | PASS |
| D5-R048 + capability interna | PASS |
| PostgreSQL 18.4 transaction runner | PASS — dos runs, material MATCH |
| migration runner Paso 8 | PASS |
| FileMigrationProvider/ESM/dist | PASS |
| status/up/down/journal/rollback | PASS |
| manifest/drift/lock/timeout | PASS |
| D5-R049 + capability/provider internos | PASS |
| PostgreSQL 18.4 migration runner | PASS — dos runs, material MATCH |
| laboratorio/runtime/DB efímero | PASS — eliminado |
| primera migración/schema productivo | PASS — Paso 9, dos runs/material MATCH |
| introspección/constraints/índices | PASS |
| aislamiento estructural/FK futura | PASS |
| D5-R050–D5-R053 | PASS |
| ports/adapters owner-scoped Paso 10 | PASS |
| CRUD mínimo tenant/branch | PASS |
| scope tenant + branch obligatorio | PASS |
| errores adapter sanitizados | PASS |
| aislamiento negativo adapter/query | PASS |
| PostgreSQL 18.4 adapters | PASS — dos runs, material MATCH |
| PostgreSQL 18.4 CI autoritativo Paso 11 | PASS — push y PR |
| suites/tests/skips críticos por job | PASS — 5/10/0 |
| VC-024 run-1/run-2/comparison | PASS |
| artifacts/manifests/sanitización | PASS |

## Estado de decisiones

| Elemento | Entrada | Salida |
|---|---|---|
| DEC-050 | Accepted with conditions | C01–C05 y C07–C09 materialmente ejercidas; C06 operacional parcial; C10 no activada |
| SPIKE-002 | mandatory/pending | Completed; material evidence PASS |
| PBI-023 | Ready; PostgreSQL CI autorizado | Closed — PostgreSQL CI authoritative materialized and formally reviewed |
| DEC-049 | Accepted; C01–C08 vigentes | C01–C07 con evidencia local + CI para el scope; operación productiva no afirmada |
| DEC-051 | C01/C07/C09 Satisfied | C03/C04/C06 Satisfied; C02 pendiente del primer merge |
| DEC-055 | Propuesta | sin cambio material; CI sintética PASS sólo para el scope efímero; provider, privilegios, rotación y operación productiva pendientes |
| DEC-063 | Accepted with conditions; C01/C03/C04 Satisfied | evidencia material de PBI-023 para C02/C05/C06; el registro canónico de condiciones no cambia; C07/C08 continúan por trigger |

## Selecciones

- `kysely@0.29.4`;
- `pg@8.22.0`;
- `@types/pg@8.20.0`;
- PostgreSQL `18.4`;
- endpoint PostgreSQL real externo al test; service efímero en Linux CI;
- `node:test`; no SQLite para persistencia crítica;
- no Testcontainers/Compose en la selección inicial;
- tenant/branch + metadata como schema productivo mínimo;
- probe productivo único `select 1` y harness PostgreSQL efímero;
- roll-forward como recuperación primaria en shared/prod futuro.

## Gates restantes

1. DEC051-C02: protección/revisión del primer merge funcional.
2. DEC-063 conserva `Accepted with conditions`; cualquier cambio de estado de
   sus condiciones exige una actualización formal separada de su registro.
3. Decisión explícita sobre cambiar PR #2 a Ready y efectuar merge.

El Paso 12 quedó completo. R0 conserva su autorización organizacional limitada
al alcance de PBI-023, que ya está cerrado; esto no equivale a aceptación de
R0 ni autoriza PBI-024, merge o release. DEC-055 permanece `Propuesta` y
Sprint 00 permanece `Closed`.

## Validaciones de esta tarea

Ejecutadas con Node.js `24.18.0` y pnpm `11.15.1`:

| Gate | Resultado |
|---|---|
| `pnpm install --frozen-lockfile` | PASS — lock sin cambios |
| `pnpm run architecture` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm test` | PASS — 335 pass, 10 PG gated skip, 0 fail |
| `pnpm run test:architecture` | PASS — 261/261 |
| `pnpm run verify` | PASS |
| `pnpm run smoke:start` | PASS |
| `git diff --check` | PASS |
| PostgreSQL 18.4 dedicado | PASS — dos runs/material `6daf3478…`/cleanup |
| documentación/JSON/enlaces/secretos | verificación final PASS |
| scope técnico | PASS — facility/tests/enforcement/evidencia |

La evidencia material del Paso 11 está en
[postgresql-ci/](postgresql-ci/README.md).

## Restricciones preservadas

- workflow, package/lock, tsconfig, AppModule, bootstrap y módulos ajenos
  preservados; modules tenancy/stations sólo ganan type registration;
- cambios técnicos limitados a facility, tests/harness y enforcement exacto;
- una migración productiva, sin SQL raw ni DML, limitada a dos tablas;
- Docker sólo durante tests; cero recurso residual;
- sin credenciales, `.env` o secretos preservados;
- sin PBI-024–029;
- sin merge/deploy/SSH.

## Siguiente acción

Repetir la decisión independiente sobre promover el PR #2 de `Draft` a
`Ready for review`; no ejecutar esa promoción, merge, PBI-024, release o
deploy como parte de esta reconciliación.
