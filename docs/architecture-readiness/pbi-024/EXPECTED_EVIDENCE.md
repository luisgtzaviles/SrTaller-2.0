# Evidencia esperada de PBI-024

## Expediente mínimo

Una implementación futura debe preservar:

1. README y alcance exacto;
2. plan y risk assessment;
3. architecture y public surfaces;
4. station lifecycle;
5. allow/deny matrix;
6. error mapping;
7. migration/schema evidence;
8. unit/application/PostgreSQL results;
9. mutation results;
10. security checklist;
11. traceability;
12. evidence manifest;
13. run-1, run-2 y comparison;
14. cleanup;
15. final results y revisión independiente.

## Manifest

El JSON canónico debe incluir:

- schema version;
- PBI, commit, branch y PR;
- timestamp UTC y responsable técnico;
- OS/architecture/libc;
- Node, pnpm, TypeScript, PostgreSQL, Kysely y `pg`;
- hashes de package/lock/policy/migration;
- migrations antes/después;
- aliases sintéticos de tenant/branch/station;
- comandos allowlisted y exit codes;
- test IDs, skips y resultados;
- mutation IDs/resultados;
- cleanup;
- artifacts/hashes;
- revisión por rol;
- dictamen.

No incluye host, URL, usuario o password; environment completo; credential de
station; SQL; SQLSTATE; stack; paths personales; IDs reales; PII; PIN; tokens
o payloads.

## Artefactos

| Artefacto | Contenido mínimo |
| --- | --- |
| architecture | policy, fixtures, mutations, graph y exports |
| migration | manifest, up/down/reapply, drift, constraints, cleanup |
| schema | introspección de `stations`/`station_bindings` |
| lifecycle | todas las transiciones y negativas |
| resolver | AD-01–AD-20 y subcasos AD-05A/B, AD-07A/B, AD-11A/B/C, AD-15A/B/C |
| isolation | dos tenants/dos branches, read/write/reference negatives |
| concurrency | station row lock, ambos órdenes efecto/revoke, CAS, lost update, distinct-station non-blocking, rollback y relink stale |
| errors | DEC-044, categorías internas únicas, sanitización y unknown signal |
| security | recognition boundary, no enumeration, secrets scan |
| Linux run 1/2 | comandos, versiones, resultados y hashes |
| comparison | igualdad semántica |
| final review | reviewers, findings, conditions y verdict |

## Trazabilidad DEC-051

- C02: conservar `Pending` y bloqueo de merge;
- C03: PostgreSQL real disponible, verificar versión/lifecycle;
- C04: matriz tenant/sucursal y mutaciones completas;
- C05: sólo la parte de errores sin API; no declararla satisfecha por PBI-024;
- C06: ownership/transacción/constraints;
- C09: fixture + mutation por nueva regla;
- C08/C10: sólo si existe excepción/bypass.

## Trazabilidad DEC-063

- C02: clasificación alta, sin downgrade;
- C05: checklist de persistencia/migración;
- C06: fail-closed, anti-enumeración, mínimo privilegio y secretos;
- C07: no activada, no release;
- C08: no activada salvo waiver real.

## Criterio de completitud

Toda fila aplicable de [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) apunta
a evidencia ejecutada del mismo commit. Un texto `PASS` sin comando, run,
resultado, artifact y revisión no satisface el gate.
