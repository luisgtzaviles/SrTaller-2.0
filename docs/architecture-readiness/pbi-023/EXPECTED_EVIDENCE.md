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
| [dependency evidence](dependency-installation/README.md) | versiones exactas, fuentes, cierre, scripts, lock hash, supply chain y frozen installs |
| [typed configuration](typed-configuration/README.md) | variables, validaciones, errores, sanitización, inmutabilidad y ausencia de conexión |
| ownership registry | objetos, owner, scope, invariantes |
| migration manifest | orden, status, SHA-256, resultado |
| PostgreSQL lifecycle | versión, create/cleanup, timeouts |
| migration run | vacío/anterior/re-run/failure/concurrency |
| [transaction run](transaction-runner/README.md) | misma conexión interna, commit/rollback, isolation, read-only, nesting, errores y cleanup |
| isolation run | ISO-001 a ISO-020 |
| architecture run | valid/negative/mutation/double run |
| security review | redaction, privileges, secrets scan |
| Linux run 1/2 | comandos y resultados equivalentes |
| comparison | igualdad semántica y hashes esperados |
| formal verdict | PASS/CONDITIONAL/FAIL y condiciones |

## Evidencia de SPIKE-002

Está separada de la implementación productiva en
[spike-002-evidence/](spike-002-evidence/README.md):

- hipótesis y timebox;
- árbol/probes desechables;
- baseline exacta;
- threat cases;
- resultados CRUD/join/FK/concurrencia;
- bypasses observados;
- cleanup probado;
- decisión de conservar/rechazar patrón.

El manifest real es
[EVIDENCE_MANIFEST.json](spike-002-evidence/EVIDENCE_MANIFEST.json). Los
artefactos que requieren implementación productiva continúan siendo evidencia
futura de PBI-023.

## Evidencia del transaction runner

El Paso 7 tiene manifest separado en
[transaction-runner/EVIDENCE_MANIFEST.json](transaction-runner/EVIDENCE_MANIFEST.json).
Acredita API exacta, capability owner-internal, commit/rollback, isolation,
read-only, nesting, errores, sanitización, concurrencia, dos runs PostgreSQL
`18.4`, comparación y cleanup. No acredita migration runner, migrations,
schema tenant-scoped ni PostgreSQL en CI autoritativa.

## Evidencia de instalación exacta

El Paso 4 tiene un manifest separado en
[dependency-installation/EVIDENCE_MANIFEST.json](dependency-installation/EVIDENCE_MANIFEST.json).
Acredita selección, lock, scripts, supply chain, ESM/NodeNext, checker y dos
instalaciones limpias. No acredita conexión, migrador, PostgreSQL CI o
aislamiento runtime.

## Evidencia de configuración tipada

El Paso 5 tiene un manifest separado en
[typed-configuration/EVIDENCE_MANIFEST.json](typed-configuration/EVIDENCE_MANIFEST.json).
Acredita contrato puro, fail-closed, cero defaults, namespaces, roles, TLS,
redaction, freeze, no red y enforcement. No acredita Pool, PostgreSQL,
migraciones ni aislamiento runtime.

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
