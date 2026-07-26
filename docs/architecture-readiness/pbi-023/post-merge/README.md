# Evidencia post-merge de PBI-023

## Resultado

**PASS — PBI-023 POST-MERGE EVIDENCE RECORDED**

El PR #2 fue integrado correctamente en `main`. El commit resultante pasó la
CI autoritativa y la validación local sin regresiones. Este expediente registra
la integración; no amplía el alcance de R0, no inicia PBI-024 y no cambia el
estado canónico de DEC051-C02.

## Alcance

- registrar el merge real de PBI-023;
- vincular la aprobación independiente con el head revisado;
- registrar la CI autoritativa posterior al merge y sus artefactos;
- consolidar las validaciones locales posteriores al merge;
- evaluar con precisión la evidencia disponible para DEC051-C02.

No se modificó código, tests, workflow, scripts, dependencias, lockfile,
migraciones, schema ni configuración de GitHub para producir este expediente.

## Integración

| Campo | Evidencia |
|---|---|
| Pull request | [PR #2 — `feat: materialize PBI-023 PostgreSQL persistence foundation`](https://github.com/luisgtzaviles/SrTaller-2.0/pull/2) |
| Estado | `MERGED` |
| Head incorporado | `cb238b935d594093124b7b3394ed8dbf62cc3e59` |
| Merge commit | `02af76af6077582e479786cf57d93255fe89f024` |
| Fecha | `2026-07-26T18:59:13Z` |
| Ejecutor del merge | `luisgtzaviles` |
| Revisor independiente | `empresasgalatech` |
| Dictamen del review | `APPROVED` |
| SHA aprobado | `cb238b935d594093124b7b3394ed8dbf62cc3e59` |

La aprobación independiente corresponde al head exacto que fue incorporado.
El PR está cerrado por merge y el merge commit es identificable en `main`.

## CI autoritativa post-merge

El [run `30215885836`](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/30215885836)
corrió sobre el merge commit, no sobre un merge sintético:

| Campo | Resultado |
|---|---|
| Evento | `push` |
| Rama | `main` |
| SHA | `02af76af6077582e479786cf57d93255fe89f024` |
| Attempt | `1` |
| `VC-024 run-1` | `SUCCESS` |
| `VC-024 run-2` | `SUCCESS` |
| `VC-024 comparison` | `SUCCESS` |
| PostgreSQL | `18.4` real |
| Regresión | no observada |

Los dos runs y su comparación terminaron verdes. La evidencia conserva los
artefactos del mismo run y SHA:

| Artefacto | ID |
|---|---:|
| `vc024-run-1` | `8635853817` |
| `vc024-run-2` | `8635862405` |
| `vc024-comparison` | `8635865041` |

## Validación local post-merge

Las validaciones se ejecutaron con el árbol alineado en
`02af76af6077582e479786cf57d93255fe89f024`:

| Validación | Resultado |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm test` | PASS — 335 tests, 10 skips ordinarios, 0 fallos |
| `pnpm run test:architecture` | PASS — 261/261 |
| `pnpm run verify` | PASS |
| `pnpm run smoke:start` | PASS |

El resultado confirma compilación, arranque, suites y reglas arquitectónicas
sin regresión posterior a la integración.

## Alcance preservado

La integración contiene la fundación de persistencia aprobada para PBI-023:
PostgreSQL `18.4`, Kysely `0.29.4`, `pg` `8.22.0`, `@types/pg` `8.20.0`,
migración/schema mínimos, facilities de conexión/transacción/migración,
ports/adapters owner-scoped, pruebas PostgreSQL, CI y evidencia.

No introduce endpoints funcionales, frontend, reparaciones, usuarios, PIN,
sesiones, roles productivos, RLS, deploy, secretos, datos reales ni
infraestructura productiva.

## Evaluación de DEC051-C02

- **Evaluación material actual:** `Partially satisfied`.
- **Estado canónico:** `Pending`.

Evidencia lograda:

- primer merge real a `main`;
- aprobación independiente sobre el head exacto incorporado;
- merge commit y fecha identificables;
- CI autoritativa post-merge;
- `run-1`, `run-2` y `comparison` verdes;
- PostgreSQL real, artefactos y ausencia de regresión.

Evidencia ausente:

- protección efectiva de `main`;
- checks obligatorios configurados y forzados por GitHub;
- aprobación obligatoria forzada por GitHub;
- prueba controlada de rechazo de una integración incumplida.

La inspección de GitHub no mostró una regla de protección efectiva para
`main`; la consulta de reglas reportó cero reglas y la API de protección
clásica/rulesets no estuvo disponible bajo el plan actual. Esto no es evidencia
de protección y no permite declarar DEC051-C02 `Satisfied`.

El contrato y su estado canónico permanecen en
[DEC-051](../../../decisions/dec-051-testing-ci-strategy/DECISION_PROPOSAL.md);
la evaluación específica de PBI-023 está en
[DEC_051_APPLICABILITY.md](../DEC_051_APPLICABILITY.md).

## Gobierno vigente

- [PBI-023](../../../backlog/pbis/PBI-023.md): `Closed — PostgreSQL CI
  authoritative materialized and formally reviewed`.
- DEC-055: `Propuesta`.
- DEC-063: `Accepted with conditions`.
- [R0](../../R0_AUTHORIZATION.md): `Authorized`, limitado al alcance cerrado
  de PBI-023.
- Sprint 00: `Closed`.
- PBI-024: `Draft`, no iniciado y no autorizado.

## Siguiente acción requerida

Resolver el mecanismo de protección obligatoria de `main` y diseñar una prueba
de rechazo verificable para completar DEC051-C02.

Esta acción es independiente de PBI-024 y no fue ejecutada como parte de este
registro.
