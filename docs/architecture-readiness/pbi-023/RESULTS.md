# Resultados consolidados de PBI-023

## Dictamen

**PASS — PBI-023 MIGRATION RUNNER VERIFIED**

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
coincidieron y limpiaron todos los probes. No existe startup, migración, tabla
o consumer productivo. PBI-023 queda `Ready`.

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
| primera migración/schema productivo | NOT RUN — Paso 9 |

## Estado de decisiones

| Elemento | Entrada | Salida |
|---|---|---|
| DEC-050 | Accepted with conditions | C01–C08 ganan evidencia parcial; product migration/CI/operation pending |
| SPIKE-002 | mandatory/pending | Completed; material evidence PASS |
| PBI-023 | Ready; migration runner authorized | Ready; migration runner verified / first productive migration authorized |
| DEC-049 | Accepted; C01–C08 por materializar | C01 y evidencia parcial C02–C07; adapters/tenant constraints pendientes |
| DEC-051 | C01/C07/C09 Satisfied | C03 sigue Partial/Pending en CI; C06 gana D5-R049 |
| DEC-063 | C01/C03/C04 Satisfied | sin cambio |

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

1. Primera migración mínima, schema/constraints owner-scoped y evidencia.
2. DEC049-C02–C07 y DEC051-C02/C03/C04/C06 conservan porciones runtime/CI.
3. DEC063-C02/C05/C06 requieren evidencia restante antes del merge persistente.

No existe bloqueo material para solicitar el Paso 9. Los gates restantes se
cierran secuencialmente y siguen impidiendo declarar implementación funcional
o merge.

## Validaciones de esta tarea

Ejecutadas con Node.js `24.18.0` y pnpm `11.15.1`:

| Gate | Resultado |
|---|---|
| `pnpm install --frozen-lockfile` | PASS — lock sin cambios |
| `pnpm run architecture` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm test` | PASS — 301 pass, 8 PG gated skip, 0 fail |
| `pnpm run test:architecture` | PASS — 242/242 |
| `pnpm run verify` | PASS |
| `pnpm run smoke:start` | PASS |
| `git diff --check` | PASS |
| PostgreSQL 18.4 dedicado | PASS — dos runs/material `397c4ec8…`/cleanup |
| documentación/JSON/enlaces/secretos | verificación final PASS |
| scope técnico | PASS — facility/tests/enforcement/evidencia |

La evidencia de este paso está en
[migration-runner/](migration-runner/README.md).

## Restricciones preservadas

- workflow, package/lock, tsconfig, AppModule, bootstrap y módulos preservados;
- cambios técnicos limitados a facility, tests/harness y enforcement exacto;
- sin SQL, migraciones, schema o tablas productivos;
- Docker sólo durante tests; cero recurso residual;
- sin credenciales, `.env` o secretos preservados;
- sin PBI-024–029;
- sin merge/deploy/SSH.

## Siguiente acción

Revisar y autorizar separadamente el Paso 9: primera migración productiva
mínima para `tenants`/`branches`, constraints e índices; todavía sin
repositories, adapters ni wiring.
