# Resultados consolidados de PBI-023

## Dictamen

**PASS — PBI-023 CONNECTION FACILITY VERIFIED**

El expediente define estimación, DEC-050, versiones candidatas, arquitectura,
schema mínimo, aislamiento, migraciones, riesgos, gates y plan. SPIKE-002
ejecutó E1–E12 dos veces contra PostgreSQL real, comparó resultados y limpió
todo recurso. El Paso 3 agregó D5-R037–D5-R047, registry fail-closed, 36
fixtures y 11 mutaciones sin tocar `src/`. El Paso 4 instaló las tres
dependencias exactas y los Pasos 5–6 materializaron configuración y conexión
controladas. La facility pasó unit tests y dos runs PostgreSQL `18.4` reales,
sin startup, migración, tabla o consumer productivo. PBI-023 queda `Ready`.

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
| laboratorio/runtime/DB efímero | PASS — eliminado |
| transaction runner/migraciones/schema | NOT RUN |

## Estado de decisiones

| Elemento | Entrada | Salida |
|---|---|---|
| DEC-050 | Accepted with conditions; C01–C10 Pending | C01 Partial — package selection materialized; runtime/CI pending |
| SPIKE-002 | mandatory/pending | Completed; material evidence PASS |
| PBI-023 | Ready; connection facility authorized | Ready; connection facility verified / transaction runner authorized |
| DEC-049 | Accepted; C01–C08 por materializar | C01 y parte facility C06/C07 verificadas; transacción/constraints pendientes |
| DEC-051 | C01/C07/C09 Satisfied | C03 sigue Pending; evidencia local no sustituye CI |
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

1. DEC050-C01 conserva configuración/runtime y PostgreSQL CI.
2. DEC049-C02–C07 y DEC051-C02/C03/C04/C06 conservan porciones runtime.
3. DEC063-C02/C05/C06 requieren evidencia restante antes del merge persistente.

No existe bloqueo material para solicitar el transaction runner. Los gates restantes se
cierran secuencialmente y siguen impidiendo declarar implementación o merge.

## Validaciones de esta tarea

Ejecutadas con Node.js `24.18.0` y pnpm `11.15.1`:

| Gate | Resultado |
|---|---|
| `pnpm install --frozen-lockfile` | PASS — lock sin cambios |
| `pnpm run architecture` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm test` | PASS — 255 pass, 6 PG gated skip, 0 fail |
| `pnpm run test:architecture` | PASS — 216/216 |
| `pnpm run verify` | PASS |
| `pnpm run smoke:start` | PASS |
| `git diff --check` | PASS |
| PostgreSQL 18.4 dedicado | PASS — dos runs/material MATCH/cleanup |
| documentación/JSON/enlaces/secretos | verificación final PASS |
| scope técnico | PASS — facility/tests/enforcement/evidencia |

La evidencia de este paso está en
[connection-facility/](connection-facility/README.md).

## Restricciones preservadas

- workflow, package/lock, tsconfig, AppModule, bootstrap y módulos preservados;
- cambios técnicos limitados a facility, tests/harness y enforcement exacto;
- sin SQL, migraciones, schema o tablas productivos;
- Docker sólo durante tests; cero recurso residual;
- sin credenciales, `.env` o secretos preservados;
- sin PBI-024–029;
- sin merge/deploy/SSH.

## Siguiente acción

Autorizar separadamente el transaction runner, todavía sin migraciones, tablas,
repositories, adapters ni wiring productivo.
