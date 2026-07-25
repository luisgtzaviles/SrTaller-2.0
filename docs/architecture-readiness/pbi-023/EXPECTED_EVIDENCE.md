# Evidencia esperada de PBI-023

## Manifest canónico

El manifest futuro debe incluir, sin secretos:

- schema/version del manifest;
- PBI, commit, branch y PR;
- timestamp UTC;
- plataforma, arquitectura y libc;
- Node, pnpm, TypeScript, PostgreSQL, Kysely y `pg`;
- lockfile y migration file hashes;
- migration status antes/después;
- base/run alias no sensible;
- comandos allowlisted y exit code;
- test IDs y resultado;
- cleanup resultado;
- artifacts/hashes;
- dictamen y reviewers por rol.

No incluye:

- variables de entorno completas;
- host/URL/user/password reales;
- SQL, parámetros o stack;
- PIN/tokens/credenciales;
- PII;
- paths personales.

## Artefactos mínimos

| Artefacto | Contenido |
|---|---|
| dependency evidence | versiones exactas, fuentes, lock hash |
| ownership registry | objetos, owner, scope, invariantes |
| migration manifest | orden, status, SHA-256, resultado |
| PostgreSQL lifecycle | versión, create/cleanup, timeouts |
| migration run | vacío/anterior/re-run/failure/concurrency |
| transaction run | misma conexión, commit/rollback |
| isolation run | ISO-001 a ISO-020 |
| architecture run | valid/negative/mutation/double run |
| security review | redaction, privileges, secrets scan |
| Linux run 1/2 | comandos y resultados equivalentes |
| comparison | igualdad semántica y hashes esperados |
| formal verdict | PASS/CONDITIONAL/FAIL y condiciones |

## Evidencia de SPIKE-002

Debe estar separada de la implementación productiva:

- hipótesis y timebox;
- árbol/probes desechables;
- baseline exacta;
- threat cases;
- resultados CRUD/join/FK/concurrencia;
- bypasses observados;
- cleanup probado;
- decisión de conservar/rechazar patrón.

## Reglas de retención

- documentos y manifests sanitizados se versionan;
- logs crudos no se versionan;
- artefactos CI usan retención aprobada;
- una evidencia sólo acredita el commit exacto;
- re-run tras cambio material crea un manifest nuevo;
- un archivo aplicado modificado invalida la evidencia.

## Criterio de completitud

La evidencia es completa sólo si cada fila aplicable de
[TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) apunta a un artefacto real y
revisado. Texto “PASS” sin command/run/hash no satisface el gate.
