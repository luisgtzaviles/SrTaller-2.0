# Resultados de planificación y dependencias de PBI-023

## Dictamen

**PASS — PBI-023 EXACT DEPENDENCIES INSTALLED**

El expediente define estimación, DEC-050, versiones candidatas, arquitectura,
schema mínimo, aislamiento, migraciones, riesgos, gates y plan. SPIKE-002
ejecutó E1–E12 dos veces contra PostgreSQL real, comparó resultados y limpió
todo recurso. El Paso 3 agregó D5-R037–D5-R047, registry fail-closed, 36
fixtures y 11 mutaciones sin tocar `src/`. El Paso 4 instaló las tres
dependencias exactas, revisó supply chain y pasó dos reinstalaciones frozen.
PBI-023 queda `Ready`, sin iniciar configuración o persistencia productiva.

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
| laboratorio/runtime/DB efímero | PASS — eliminado |
| configuración/runtime/DB productivo | NOT RUN |

## Estado de decisiones

| Elemento | Entrada | Salida |
|---|---|---|
| DEC-050 | Accepted with conditions; C01–C10 Pending | C01 Partial — package selection materialized; runtime/CI pending |
| SPIKE-002 | mandatory/pending | Completed; material evidence PASS |
| PBI-023 | Ready; dependency installation authorized | Ready; exact persistence dependencies installed / typed configuration authorized |
| DEC-049 | Accepted; C01–C08 por materializar | C01 Partial por paquetes; runtime sin cambio |
| DEC-051 | C01/C07/C09 Satisfied | sin cambio |
| DEC-063 | C01/C03/C04 Satisfied | sin cambio |

## Selecciones

- core Kysely `Migrator`/`FileMigrationProvider`;
- `kysely@0.29.4`;
- `pg@8.22.0`;
- `@types/pg@8.20.0`;
- PostgreSQL `18.4`;
- endpoint PostgreSQL real externo al test; service efímero en Linux CI;
- `node:test`; no SQLite para persistencia crítica;
- no Testcontainers/Compose en la selección inicial;
- tenant/branch + metadata como schema productivo mínimo;
- probes desechables para el spike;
- roll-forward como recuperación primaria en shared/prod futuro.

## Gates restantes

1. DEC050-C01 conserva configuración/runtime y PostgreSQL CI.
2. DEC049-C02–C07 y DEC051-C02/C03/C04/C06 conservan porciones runtime.
3. DEC063-C02/C05/C06 requieren evidencia restante antes del merge persistente.

No existe bloqueo material para solicitar el Paso 5. Los gates restantes se
cierran secuencialmente y siguen impidiendo declarar implementación o merge.

## Validaciones de esta tarea

Ejecutadas con Node.js `24.18.0` y pnpm `11.15.1`:

| Gate | Resultado |
|---|---|
| `pnpm install --frozen-lockfile` | PASS — dos reinstalaciones limpias |
| `pnpm run architecture` | PASS — tres ciclos |
| `pnpm run typecheck` | PASS — tres ciclos |
| `pnpm run build` | PASS — tres ciclos |
| `pnpm test` | PASS — 219/219 en tres ciclos |
| `pnpm run test:architecture` | PASS — 207/207 en tres ciclos |
| `pnpm run verify` | PASS — tres ciclos |
| `pnpm run smoke:start` | PASS — tres ciclos |
| `git diff --check` | PASS |
| metadata/integridad/audit | PASS — cero advisories |
| ESM/NodeNext virtual | PASS — cero diagnósticos/emisión/conexión |
| documentación/JSON/enlaces/secretos | verificación final PASS |
| scope técnico | PASS — sólo package/lock |

El expediente completo está en
[dependency-installation/](dependency-installation/README.md).

## Restricciones preservadas

- sin `src/`, workflow, scripts, tests, tsconfig o policy/checker;
- sólo package/lock exactos como superficie técnica;
- sin SQL, migraciones, schema o tablas productivos;
- sin PostgreSQL, Docker o Testcontainers en este paso;
- sin credenciales, `.env` o secretos preservados;
- sin PBI-024–029;
- sin merge/deploy/SSH.

## Siguiente acción

Autorizar separadamente el Paso 5: configuración tipada y fail-closed, todavía
sin conexión, SQL, migraciones, tablas ni adapters productivos.
