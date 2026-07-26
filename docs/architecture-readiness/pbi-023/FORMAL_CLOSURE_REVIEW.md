# Revisión formal independiente de cierre de PBI-023

> **Reconciliación de gobierno — 2026-07-26.** Este expediente conserva
> dictámenes intermedios como trazabilidad histórica. Las afirmaciones
> intermedias que presentaron R0 como no autorizado, Sprint 00 como abierto o
> DEC-063 como no ratificada no constituyeron una revocación, reapertura o
> cambio de decisión: fueron clasificaciones documentales obsoletas. Las
> fuentes autoritativas anteriores a esta revisión son la
> [autorización formal de R0](../R0_AUTHORIZATION.md), que registra R0
> `Authorized` con alcance limitado, el
> [cierre formal de Sprint 00](../../reviews/sprint-00/SPRINT_00_CLOSURE.md),
> que registra `Closed`, y el
> [registro de DEC-063](../../decisions/dec-063-definition-of-done/DECISION_PROPOSAL.md),
> que registra `Accepted with conditions`. No existe revocación o reapertura
> posterior. El estado vigente de esta revisión se consolida en la sección
> final.

## 1. Resultado global

**CONDITIONAL PASS — PBI-023 CLOSURE BLOCKED BY DOCUMENTARY REMEDIATIONS**

La fundación técnica de PBI-023 y su gate PostgreSQL autoritativo son
reproducibles y están respaldados por ejecución local y evidencia remota real.
No se encontró una regresión productiva, un skip crítico, un recurso residual
o una exposición de secretos.

PBI-023 no puede marcarse `Closed` en esta revisión porque:

1. el manifest consolidado versionado no valida contra el schema canónico que
   el propio expediente exige;
2. el resultado consolidado declara DEC-055 `Accepted`, mientras el registro
   oficial no contiene esa decisión y el plan H1 la mantiene `Propuesta`;
3. una afirmación documental sobre la derivación de identidades efímeras no
   describe la generación aleatoria implementada.

Estos hallazgos son documentales y no refutan el resultado técnico, pero
impiden cumplir simultáneamente las condiciones de cierre 7 y 12 del Paso 12.

## 2. Fecha, rama y entorno

| Control | Valor |
| --- | --- |
| Fecha local | `2026-07-25` |
| Repositorio | `luisgtzaviles/SrTaller-2.0` |
| Rama | `r0/pbi-023-persistence-planning` |
| Entorno de revisión | local + GitHub Actions; sin deploy ni SSH |
| Node.js local | `v24.18.0` |
| pnpm local | `11.15.1` |
| Docker local | server `29.6.2` |

## 3. Commits revisados

| Identidad | SHA |
| --- | --- |
| Base del lote PostgreSQL CI | `e6baea1c1dbe8b147e99b3dec23188905758ebd1` |
| Commit técnico | `9e38f20900e2be4df7680a936fdfee077e6c6950` |
| Commit documental final | `e78da7f26bc572ea04bc2ff44c35d2c099a0a2e7` |
| HEAD observado | `e78da7f26bc572ea04bc2ff44c35d2c099a0a2e7` |
| Upstream observado | `e78da7f26bc572ea04bc2ff44c35d2c099a0a2e7` |

## 4. Estado Git inicial

| Control | Resultado |
| --- | --- |
| Working tree inicial | limpio |
| Índice inicial | vacío |
| `HEAD...origin/r0/pbi-023-persistence-planning` | `0 0` |
| `origin/main...HEAD` | `0 12` |
| `git diff --check` base a final | PASS |

No se hizo fetch con mutación de referencias durante la emisión del dictamen;
las referencias locales y la consulta remota del PR coincidieron en el HEAD.

## 5. Estado del PR

El [PR #2](https://github.com/luisgtzaviles/SrTaller-2.0/pull/2) fue observado
como:

- `OPEN`;
- `Draft`;
- `MERGEABLE`;
- base `main`;
- head `r0/pbi-023-persistence-planning`;
- head SHA `e78da7f26bc572ea04bc2ff44c35d2c099a0a2e7`;
- sin `reviewDecision`;
- seis checks vigentes de `Authoritative Linux CI` en `SUCCESS`.

La consulta de protección de `main` no estuvo disponible o no demostró una
regla configurada; la API de rulesets respondió que la función no está
habilitada para el repositorio privado. Por ello DEC051-C02 sigue pendiente
del primer merge real y de evidencia de rechazo por checks requeridos.

## 6. Alcance del diff

Entre base y commit final se observaron 41 archivos, 1,831 inserciones y 126
eliminaciones:

| Lote | Archivos | Inserciones | Eliminaciones |
| --- | ---: | ---: | ---: |
| Commit técnico | 16 | 972 | 14 |
| Commit documental | 25 | 859 | 112 |

El lote técnico se limita al workflow, wrappers/harnesses de ejecución,
validadores y pruebas. El lote documental se limita al expediente PBI-023.

No cambian entre base y final:

- migraciones;
- schema types;
- ports o adapters productivos;
- runtime de connection, transaction o migration;
- `AppModule`;
- bootstrap;
- `package.json`;
- `pnpm-lock.yaml`;
- `Dockerfile`.

## 7. Workflow y PostgreSQL autoritativo

La inspección directa del workflow y los cinco harnesses confirmó:

- imagen exacta
  `postgres@sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf`;
- ausencia de una ruta alternativa no pinneada en el gate;
- pull con timeout de 180 segundos;
- inspección runtime del digest, plataforma `linux/amd64` y versión `18.4`;
- Docker explícito dentro de `VC-024 run-1` y `run-2`;
- un contenedor, base y puerto independientes por suite;
- `tmpfs` para el data directory, sin volumen ni red dedicada;
- polling de healthcheck y timeouts finitos;
- timeout de 240 segundos por suite;
- migraciones habilitadas sólo en los contratos que las requieren;
- cero afirmaciones de privilegios u operación productiva.

## 8. Identidad, aislamiento y credenciales

El aislamiento material pasa: cada harness genera un sufijo aleatorio,
contenedor/base independientes y password sintético aleatorio. El label
gobernado de la ejecución enlaza los contenedores con `run-1` o `run-2` para
cleanup.

La frase de
[`ENVIRONMENT.md`](postgresql-ci/ENVIRONMENT.md) que afirma que todas las
identidades se derivan de `run/job/attempt/label` no coincide literalmente con
la implementación:

- contenedor y base usan `randomBytes(6)`;
- password usa `randomBytes(18)`;
- los usuarios son nombres sintéticos fijos por suite;
- run/job/attempt se conserva en manifests y labels, no como material de todas
  las credenciales.

La implementación es efímera, sintética y aislada, pero la documentación debe
describirla con precisión.

## 9. Suites y política de skips

Los cinco flags críticos se activan en cada ejecución PostgreSQL:

- `SR_CONNECTION_PG_TEST`;
- `SR_TRANSACTION_PG_TEST`;
- `SR_MIGRATION_PG_TEST`;
- `SR_SCHEMA_PG_TEST`;
- `SR_OWNER_SCOPED_PG_TEST`.

Cada job ejecuta cinco suites, diez tests, cero skips críticos y cero fallos.
Los diez skips observados en el gate unitario ordinario son exactamente los
tests PostgreSQL protegidos por ambiente; se ejecutan después bajo el gate
crítico y no se usan para ocultar rojo.

La inspección de los harnesses y tests confirmó cobertura de:

- connection: conexión, autenticación, base inexistente, SSL, timeout, pool,
  concurrencia y cierre;
- transaction: commit, rollback, niveles de aislamiento, read-only,
  serialización, deadlock, timeout y reutilización posterior;
- migration: status, up/down, journal, advisory lock, timeout, drift,
  provider, ESM y `dist`;
- schema: base vacía, apply, introspección, constraints, índices, down/reapply
  y atomicidad;
- adapters owner-scoped: CRUD, duplicados, tenant inexistente, transacciones,
  concurrencia, aislamiento estructural, lectura cross-tenant y listados
  tenant-scoped.

## 10. Gates locales

Todos los gates se ejecutaron desde el HEAD exacto con Node.js `24.18.0`:

| Gate real | Resultado |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS; lock sin cambios |
| `pnpm run architecture` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm test` | PASS; 335 pass, 10 skips ordinarios, 0 fail |
| `pnpm run test:architecture` | PASS; 261/261 |
| `pnpm run verify` | PASS |
| `pnpm run smoke:start` | PASS |
| `git diff --check` | PASS |

El repositorio no define scripts llamados literalmente `pnpm architecture`,
`pnpm typecheck` o `pnpm smoke`; se ejecutaron sus nombres reales con
`pnpm run`, y el smoke canónico es `smoke:start`.

## 11. Dos ejecuciones PostgreSQL locales

Se ejecutó dos veces el mecanismo oficial
`scripts/run-postgresql-ci.mjs`, con labels, IDs y directorios temporales
independientes:

| Ejecución | Suites | Tests | Skips críticos | Fallos | Cleanup |
| --- | ---: | ---: | ---: | ---: | --- |
| `local-review-1` | 5 | 10 | 0 | 0 | PASS |
| `local-review-2` | 5 | 10 | 0 | 0 | PASS |

Ambas ejecuciones produjeron el mismo hash de migración, schema y comparable
PostgreSQL. Sus manifests completos difirieron en campos volátiles de
identidad, como corresponde a ejecuciones independientes.

## 12. Runs remotos

| Run | Evento | Head | Jobs | Resultado |
| --- | --- | --- | --- | --- |
| `30185110105` | push | técnico | run-1 `89748256832`, run-2 `89748256826`, comparison `89748812805` | success |
| `30185111056` | pull_request | técnico | run-1 `89748259605`, run-2 `89748259601`, comparison `89748807240` | success |
| `30185688424` | push | final | run-1 `89749840736`, run-2 `89749840691`, comparison `89750481491` | success |
| `30185689481` | pull_request | final | run-1 `89749844038`, run-2 `89749844086`, comparison `89750480669` | success |

Los cuatro runs terminaron `completed/success`. Los logs contienen dos
resúmenes PostgreSQL de 5 suites, 10 tests y 0 skips críticos por run, dos
cleanups `PASS` y un comparison `success`; PostgreSQL no fue omitido.

## 13. Push y merges sintéticos

- El push técnico ejecuta
  `9e38f20900e2be4df7680a936fdfee077e6c6950`.
- El run PR técnico conserva ese head en metadata y sus artifacts identifican
  el merge sintético
  `33e886c5bdda06a4f189fd0e0c549930222be873`.
- El push final ejecuta
  `e78da7f26bc572ea04bc2ff44c35d2c099a0a2e7`.
- El run PR final conserva ese head en metadata y sus artifacts identifican
  el merge sintético
  `70180aad1945480ef60610029c09ae5b7a25a83a`.

Los merges sintéticos validan el contexto PR, pero no sustituyen el SHA del
push como autoridad del estado de rama.

## 14. Artifacts remotos

Se descargaron fuera del repositorio los tres artifacts de cada run y se
inspeccionaron sus 28 archivos JSON. Inventario observado:

| Run | Artifact | ID | Bytes | Digest GitHub |
| --- | --- | ---: | ---: | --- |
| técnico push | comparison | `8626818956` | 415 | `1d98dd8e…ad305` |
| técnico push | run-1 | `8626816249` | 10,880 | `32773ecb…d6a53` |
| técnico push | run-2 | `8626817661` | 10,879 | `c0e7c0c6…968e0` |
| técnico PR | comparison | `8626819043` | 415 | `81e43f12…b8c3cb` |
| técnico PR | run-1 | `8626816489` | 10,880 | `d7c56491…542d67` |
| técnico PR | run-2 | `8626817060` | 10,879 | `c8bad092…b6c6b1` |
| final push | comparison | `8627017345` | 415 | `ea4a2218…795a6` |
| final push | run-1 | `8627014824` | 10,879 | `5f77bc54…ec2be2` |
| final push | run-2 | `8626997936` | 10,879 | `57fed134…c2432d` |
| final PR | comparison | `8627017985` | 414 | `c3c8600a…6522cb` |
| final PR | run-1 | `8627011225` | 10,881 | `1b693e7c…c41445` |
| final PR | run-2 | `8627014540` | 10,880 | `09770d9f…c13d43` |

Los artifacts no estaban expirados. Nombres, IDs, tamaños y hashes internos
del lote técnico coinciden con
[`ARTIFACTS.md`](postgresql-ci/ARTIFACTS.md). Los artifacts del commit final
contienen el mismo contrato material con la identidad del commit final o su
merge sintético.

## 15. Hashes y comparación

| Material | Esperado | Recalculado/observado | Resultado |
| --- | --- | --- | --- |
| Migración | `fe90675625ea189387e5bcdb888ee6a38107a6395931b20e2873b0a83bd105e8` | igual | PASS |
| Schema | `21b9c98bf5168adb316df2a8eaf059f1c24bba5d8e1a6aed07035325bd3eda4d` | igual | PASS |
| Comparable PostgreSQL | `6daf3478d4b9bb3ead212f46455516d8a1c6ed68b289f59996bcf5986695760e` | igual | PASS |

El hash de migración es SHA-256 del archivo de migración. El hash de schema se
calcula sobre la introspección normalizada de columnas, constraints, índices y
relaciones. El comparable PostgreSQL incluye imagen, versión, suites, conteos,
cleanup, aislamiento, sanitización y hashes materiales; excluye la identidad
volátil de ejecución.

La comparación global incorpora commit/ref y por eso difiere entre push y PR.
Dentro de cada par run-1/run-2 es igual. Una diferencia material genera
`equivalent: false` y hace fallar el job comparison.

## 16. Manifest de evidencia

Los ocho manifests `EVIDENCE_MANIFEST.json` reales de artifacts:

- son JSON válidos;
- usan `schemaVersion: 2`;
- validan contra
  [`evidence-manifest.schema.json`](../../delivery/evidence-manifest.schema.json);
- pasan los validadores del repositorio;
- contienen la sección PostgreSQL;
- corresponden a sus runs, artifacts y comparaciones.

El archivo consolidado versionado
[`postgresql-ci/EVIDENCE_MANIFEST.json`](postgresql-ci/EVIDENCE_MANIFEST.json)
es JSON válido y sus valores materiales corresponden a los artifacts
técnicos, pero **no valida** contra el schema canónico:

- usa `schema_version: "1.0.0"` en lugar de `schemaVersion`;
- omite campos requeridos como `contract`, `execution`, `environment`,
  `inputs`, `commands`, `dist` y `verdict`;
- usa `repository` como string en vez del objeto requerido;
- agrega propiedades raíz no admitidas por `additionalProperties: false`;
- su `toolchain` no satisface la forma canónica.

La validación produjo 26 incumplimientos de schema. El archivo funciona como
índice consolidado, pero el repositorio no declara un schema alternativo para
ese índice. Este es un bloqueo documental de cierre.

## 17. Cleanup

El workflow ejecuta cleanup aun ante fallo y cada harness remueve su
contenedor en `finally`. La revisión confirmó:

- cero contenedores gobernados después de ambos runs locales;
- cero volúmenes dedicados creados;
- cero redes dedicadas creadas;
- cero dumps;
- cero `.env`;
- cero data directories persistentes;
- eliminación de los dos directorios temporales de evidencia local/remota.

El único `.sql` encontrado en el árbol es un fixture histórico versionado de
SPIKE-009; no fue creado por esta revisión ni es residuo de PBI-023.

## 18. Sanitización y secretos

Se revisaron diff, archivos versionados relevantes, logs y artifacts
descargados. No se encontraron:

- passwords o connection strings retenidas;
- `DATABASE_URL`;
- tokens o API keys reales;
- private keys;
- GitHub tokens;
- rutas personales;
- `.env` o dumps;
- SQL con datos reales;
- credenciales o infraestructura productiva.

Las cadenas deliberadamente sensibles de fixtures negativos son datos
sintéticos de prueba y no secretos reales. No se imprimieron valores
sensibles durante la revisión.

## 19. No regresión

El diff base-final no cambia comportamiento productivo. Los cambios técnicos
son exclusivamente wrappers de ejecución, pruebas, validadores y workflow de
evidencia. No hay endpoints, controllers, wiring Nest, startup de conexión,
DDL nuevo, auth, PIN, sesiones, roles, reparaciones, RLS, deploy o datos
reales.

## 20. Matriz DEC-049

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| DEC049-C01 | Satisfied | versiones exactas, lock frozen y gates Node 24/TS 6/ESM |
| DEC049-C02 | Satisfied | registry de owner/scope y objetos mínimos revisados |
| DEC049-C03 | Satisfied | constraints y aislamiento negativo en PostgreSQL 18.4 |
| DEC049-C04 | Partially satisfied | misma conexión, pool, commit/rollback, serialización/deadlock y cleanup; política de retry de aplicación sigue fuera del slice |
| DEC049-C05 | Not activated | no existe acceso admin, raw SQL excepcional o consulta cross-tenant autorizada |
| DEC049-C06 | Partially satisfied | traducción/sanitización probadas; endpoint/job, correlación y observabilidad operacional no activados |
| DEC049-C07 | Satisfied | checker y mutaciones fail-closed cubren imports, raw SQL y ownership |
| DEC049-C08 | Not activated | RLS permanece fuera de alcance y no fue habilitado |

## 21. Matriz DEC-050

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| DEC050-C01 | Satisfied | Kysely/pg/types exactos, frozen install y gates |
| DEC050-C02 | Satisfied | naming, orden, inmutabilidad, journal y re-run |
| DEC050-C03 | Satisfied | advisory lock, concurrencia, timeout y liberación |
| DEC050-C04 | Satisfied | atomicidad, rollback, down seguro y recuperación probada |
| DEC050-C05 | Satisfied | status, manifest SHA-256, drift, artifacts y doble run |
| DEC050-C06 | Partially satisfied | credenciales sintéticas y sanitización; roles/privilegios/provider compartidos pendientes |
| DEC050-C07 | Satisfied | lifecycle completo sobre PostgreSQL 18.4 y cleanup |
| DEC050-C08 | Satisfied | migración separada de build/start; no existe deploy |
| DEC050-C09 | Satisfied | registry, constraints, índices, FK y negativos tenant-scoped |
| DEC050-C10 | Not activated | no hubo cambio destructivo/no transaccional ni producción |

## 22. Matrices DEC-051, DEC-055 y DEC-063

### DEC-051

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| DEC051-C02 | Pending external event | protección/rechazo de `main` no demostrados; primer merge real pendiente |
| DEC051-C03 | Satisfied | PostgreSQL 18.4 real, aislado, reproducible y limpiable |
| DEC051-C04 | Satisfied | casos positivos/negativos de tenant y sucursal aplicable |
| DEC051-C05 | Not activated | no existe primera API; catálogo HTTP/anti-enumeración completo no fue activado |
| DEC051-C06 | Satisfied | ownership, scopes, constraints, misma conexión y rollback automatizados |
| DEC051-C08 | Not activated | no se habilitó cuarentena o retry diagnóstico |
| DEC051-C10 | Not activated | no se habilitó escape hatch o bypass |

DEC051-C01, C07 y C09 conservan el estado `Satisfied` previo. Esta revisión no
los reabre ni usa el cierre de PBI-023 para satisfacer C02.

### DEC-055

| Tema | Estado | Evidencia |
| --- | --- | --- |
| Estado formal | Not satisfied | no existe DEC-055 en el registro oficial; el plan H1 la mantiene `Propuesta` |
| Provider de secretos | Not satisfied | no seleccionado |
| Privilegios de ambiente compartido/productivo | Not satisfied | no definidos ni probados |
| Rotación | Not satisfied | no definida ni probada |
| Operación productiva | Not activated | fuera de alcance |
| Credenciales CI | Satisfied | sólo para el scope sintético efímero de este PBI |

### DEC-063

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| DEC063-C02 | Satisfied | clasificación alto/fail-closed materializada para este PBI |
| DEC063-C05 | Satisfied | checklist de persistencia, PG real, forward/recuperación y cleanup |
| DEC063-C06 | Satisfied | aislamiento negativo, sanitización, mínimo alcance y dictamen técnico |
| DEC063-C07 | Not activated | no existe release candidate, hotfix o deploy |
| DEC063-C08 | Not activated | no se solicitó waiver o excepción |

Los estados C02/C05/C06 se evalúan únicamente para el scope de PBI-023. Esta
revisión no ratifica ni modifica el registro formal de DEC-063.

## 23. Hallazgos y remediaciones exactas

| ID | Severidad | Hallazgo | Remediación requerida |
| --- | --- | --- | --- |
| DOC-001 | bloqueante documental | el manifest consolidado no valida contra el schema canónico | definir inequívocamente si es un índice; entonces darle nombre/schema propio, o reemplazarlo por una estructura canónica que valide sin perder trazabilidad run-1/run-2/comparison |
| DOC-002 | bloqueante documental | `RESULTS.md` declara DEC-055 `Accepted` contra el plan H1 `Propuesta` y sin entrada oficial | corregir la celda a la autoridad real y mantener provider, privilegios, rotación y producción pendientes |
| DOC-003 | menor documental | `ENVIRONMENT.md` afirma derivación run/job/attempt para identidades generadas aleatoriamente | describir sufijos/passwords aleatorios y el uso separado de label/run/attempt para trazabilidad y cleanup |

Después de corregirlos debe repetirse, como mínimo:

1. validación JSON/schema;
2. validación de enlaces y whitespace;
3. revisión de estados DEC-055/DEC-063;
4. `git diff --check`;
5. comprobación de que el cambio sea documental y no altere artifacts
   históricos.

## 24. Estado final de PBI-023 y acciones no realizadas

PBI-023 conserva exactamente:

`Ready — PostgreSQL CI authoritative / PBI-023 closure review authorized`

No se cambió a `Closed`. Tampoco se:

- cambió el PR de Draft a Ready;
- aprobó, cerró o hizo merge del PR;
- emitió una nueva autorización o amplió la autorización vigente de R0;
- cerró o inició Sprint 00;
- cambió el estado canónico o las condiciones de DEC-063;
- satisfizo DEC051-C02;
- modificó código, workflow, scripts, tests, migración o schema;
- modificó package/lock;
- creó commit o push;
- hizo deploy o SSH.

El único cambio de esta revisión es este expediente documental, dejado sin
commit.

## 25. Conclusión y siguiente acción autorizada

La materialización técnica de PBI-023 es suficiente, reproducible y segura
dentro de su alcance. El cierre formal queda bloqueado exclusivamente por
DOC-001, DOC-002 y DOC-003.

La siguiente acción autorizada no es el Paso 13. Es una remediación documental
acotada que:

1. reconcilie el contrato del manifest consolidado;
2. corrija el estado sobredeclarado de DEC-055;
3. alinee la descripción de identidades efímeras con la implementación;
4. repita esta revisión de cierre.

Esta etapa intermedia registró R0 como no autorizado y Sprint 00 como abierto.
Esa clasificación era una fotografía documental obsoleta y queda
explícitamente supersedida por las decisiones formales previas: R0
`Authorized` con alcance limitado y Sprint 00 `Closed`. No existió revocación
o reapertura. PR #2 permanecía `OPEN`, `Draft` y sin merge.

## Documentary remediation record

### Identidad de la remediación

| Control | Valor |
| --- | --- |
| Fecha | `2026-07-25` |
| Rama | `r0/pbi-023-persistence-planning` |
| HEAD base | `e78da7f26bc572ea04bc2ff44c35d2c099a0a2e7` |
| Upstream inicial | alineado, `0 0` |
| Alcance | exclusivamente DOC-001, DOC-002 y DOC-003 |

Este registro no sustituye ni reescribe el dictamen histórico
**CONDITIONAL PASS — PBI-023 CLOSURE BLOCKED BY DOCUMENTARY REMEDIATIONS**.
No emite un nuevo dictamen de cierre.

### Estado de los hallazgos

| ID | Estado | Cambio aplicado |
| --- | --- | --- |
| DOC-001 | Remediated | El manifest consolidado adopta `schemaVersion: 2` y la estructura canónica de un manifest real `run-1`; el índice técnico/documental multi-run se conserva en `postgresql.consolidatedEvidence`, extensión permitida por el schema y por el validador real. |
| DOC-002 | Remediated | `RESULTS.md` usa el estado autoritativo `Propuesta` para DEC-055 y mantiene provider, privilegios, rotación y operación productiva pendientes. |
| DOC-003 | Remediated | `ENVIRONMENT.md` describe sufijos y password aleatorios sintéticos, usuario por harness, puerto efímero y trazabilidad separada mediante run/job/attempt/label. |

### Manifest remediado

Antes de la corrección se reprodujeron 26 incumplimientos:

- 8 campos requeridos ausentes;
- 13 propiedades raíz no permitidas;
- 1 tipo incorrecto para `repository`;
- 1 campo requerido ausente y 3 propiedades no permitidas en `toolchain`.

La estructura canónica se tomó del artifact real `vc024-run-1` del push
técnico `30185110105`. Se preservaron commit, inputs, commands, inventario
`dist`, PostgreSQL, migración, schema, suites, hashes, sanitización y cleanup.
El índice consolidado conserva por separado:

- push técnico y pull request técnico;
- push documental final y pull request documental final;
- run-1, run-2 y comparison;
- artifacts y hashes;
- sanitización, cleanup, aislamiento y conteos;
- commit técnico y commit documental.

Resultado:

- parser JSON estricto: `PASS`;
- schema canónico: `0` incumplimientos;
- `validateEvidenceManifest()`: `PASS`;
- ocho manifests reales de artifacts: `PASS`;
- hash de migración, hash de schema, comparable y digest PostgreSQL:
  preservados sin cambio.

### Archivos modificados

- `docs/architecture-readiness/pbi-023/postgresql-ci/EVIDENCE_MANIFEST.json`;
- `docs/architecture-readiness/pbi-023/RESULTS.md`;
- `docs/architecture-readiness/pbi-023/postgresql-ci/ENVIRONMENT.md`;
- `docs/architecture-readiness/pbi-023/FORMAL_CLOSURE_REVIEW.md`.

### Validaciones ejecutadas

| Validación | Resultado |
| --- | --- |
| `pnpm test -- test/ci-evidence.test.mjs` | PASS; el script ejecutó la suite completa: 335 pass, 10 skips PostgreSQL ordinarios, 0 fail |
| `node --test test/ci-evidence.test.mjs` | PASS; 9/9 |
| `pnpm run typecheck` | PASS |
| `pnpm run test:architecture` | PASS; 261/261 |
| JSON estricto | PASS |
| schema canónico | PASS; 0 incumplimientos |
| validador real del repositorio | PASS |
| ocho manifests remotos descargados | PASS |
| `git diff --check` | PASS |

### Límites preservados

No se modificó código, workflow, script, test, migración, schema productivo,
port, adapter, package, lockfile, `AppModule` o bootstrap. No se creó commit,
push, merge, deploy o conexión SSH.

En esta etapa intermedia PBI-023 continuaba sin cerrarse y DEC051-C02
permanecía pendiente. DEC-055 permanecía `Propuesta`. Las menciones a
DEC-063 no ratificada, R0 no autorizado y Sprint 00 abierto repetían el
snapshot obsoleto ya identificado; no cambiaron las fuentes canónicas:
DEC-063 `Accepted with conditions`, R0 `Authorized` con alcance limitado y
Sprint 00 `Closed`. PR #2 permanecía `Draft`.

Se requiere una nueva revisión formal independiente antes de cambiar el estado
de PBI-023 o del PR.

## 26. Nueva revisión formal independiente

### Dictamen

**PASS — PBI-023 FORMALLY CLOSED**

La revisión independiente posterior a las remediaciones confirmó que DOC-001,
DOC-002 y DOC-003 están completamente resueltos, sin introducir hallazgos
bloqueantes ni cambios técnicos. Este dictamen es posterior e independiente;
no reescribe el `CONDITIONAL PASS` histórico ni su registro de remediación.

### Identidad

| Control | Valor |
| --- | --- |
| Fecha | `2026-07-25` |
| Rama | `r0/pbi-023-persistence-planning` |
| HEAD inicial y final | `e78da7f26bc572ea04bc2ff44c35d2c099a0a2e7` |
| Upstream | `origin/r0/pbi-023-persistence-planning`, divergencia `0 0` |
| Entorno | local + GitHub Actions; sin deploy ni SSH |
| Node.js | `24.18.0` |
| pnpm | `11.15.1` |

### Revalidación de los hallazgos

| Hallazgo | Resultado independiente |
| --- | --- |
| DOC-001 | PASS — JSON estricto, schema canónico con cero incumplimientos y `validateEvidenceManifest()`; el material canónico coincide con el artifact técnico real y su extensión consolidada conserva la trazabilidad |
| DOC-002 | PASS — DEC-055 permanece `Propuesta`; provider, privilegios, rotación y operación productiva siguen pendientes |
| DOC-003 | PASS — `ENVIRONMENT.md` coincide con el runtime: sufijos y password aleatorios, usuario por harness, puerto efímero y label/run/job/attempt separados para trazabilidad |

El manifest versionado se contrastó con ocho manifests de evidencia, ocho
manifests PostgreSQL y cuatro comparaciones descargadas de los cuatro runs
autoritativos. Los hashes de artifacts del lote técnico hicieron `MATCH`; los
hashes de migración, schema y comparable PostgreSQL permanecen inalterados.

### Validaciones repetidas

| Validación | Resultado |
| --- | --- |
| `git diff --check` | PASS |
| `pnpm test -- test/ci-evidence.test.mjs` | PASS — 335 pass, 10 skips PostgreSQL ordinarios, 0 fail |
| `node --test test/ci-evidence.test.mjs` | PASS — 9/9 |
| `pnpm run typecheck` | PASS |
| `pnpm run test:architecture` | PASS — 261/261 |
| JSON estricto | PASS |
| schema canónico | PASS — 0 incumplimientos |
| `validateEvidenceManifest()` | PASS |
| enlaces y whitespace | PASS |
| artifacts, comparison, cleanup y sanitización | PASS |
| scope del working tree | PASS — exclusivamente documentos autorizados; índice vacío |

### Alcance y estado final

PBI-023 queda:

`Closed — PostgreSQL CI authoritative materialized and formally reviewed`

La revisión conserva explícitamente estos límites:

- DEC051-C02 continúa pendiente hasta el primer merge real a `main`;
- DEC-055 permanece `Propuesta`;
- DEC-063 permanece `Accepted with conditions`; este cierre aporta evidencia
  para PBI-023, pero no modifica el registro canónico de sus condiciones;
- R0 permanece `Authorized`, limitado al alcance de PBI-023; este cierre no
  equivale a aceptación de R0 ni amplía la autorización a otro PBI;
- Sprint 00 permanece `Closed`;
- PR #2 permanece `OPEN` y `Draft`;
- no se autorizó PBI-024, merge, release ni deploy;
- no se modificó código, workflow, scripts, tests, migración, schema,
  package/lock, `AppModule` o bootstrap;
- no se creó commit ni push.

### Siguiente acción autorizada

Repetir la decisión independiente sobre promover el PR #2 de `Draft` a
`Ready for review`. No promoverlo, hacer merge, iniciar PBI-024, release o
deploy dentro de esta reconciliación.
