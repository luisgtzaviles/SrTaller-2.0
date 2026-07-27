# Remediación de correlación causal del harness

## Autoridad y alcance

La segunda revisión formal independiente mantuvo el dictamen:

`CONDITIONAL PASS — PBI-024 IMPLEMENTATION REQUIRES FURTHER REMEDIATIONS`.

El único hallazgo pendiente era `MAJOR-01`: el harness podía aceptar como
`killed` una mutación cuando el proceso fallaba por una prueba distinta de la
declarada. Esta remediación se limita al harness, sus pruebas y la evidencia.
No modifica dominio, persistencia, concurrencia, schema, migraciones,
workflow, dependencias ni alcance funcional.

El SHA técnico remediado es
`2988bcdf362505776f7bc111e3d590aee358d2ce`.

## Reproducción previa

Antes del cambio se ejecutó `MUT-024-01`, conservando la mutación real que
elimina el scope de tenant del lookup de Station, pero declarando como prueba
esperada:

`test/station-domain.test.mjs` +
`Revoked is terminal and records the terminal instant`.

El resultado real fue:

- la prueba esperada incorrecta pasó;
- `station lookup never crosses tenant scope` falló;
- el proceso salió con código 1;
- el output también contenía el nombre de la prueba esperada porque había sido
  ejecutada;
- el algoritmo `output.includes(expectedTest)` devolvió
  `expectedFailureObserved: true` y `killed: true`.

El falso positivo era causalmente inválido: confundía «la prueba apareció en
la salida» con «la prueba exacta falló por la propiedad mutada».

## Contrato nuevo

Se seleccionó un reporter personalizado compatible con la API oficial
`node:test` de Node.js 24.18.0. Emite JSON determinista con formato
`srtaller-node-test-results/v1`.

Cada prueba queda identificada por:

1. ruta normalizada del archivo;
2. nombre completo exacto;
3. estado `PASS`, `FAIL` o `SKIP`;
4. error serializado, cuando existe.

No hay coincidencia por substring, color, TAP visual, nombre de archivo
aislado ni exit code genérico. El parser rechaza salida vacía, corrupta,
incompleta, duplicada o inconsistente.

Cada mutación declara una o más identidades exactas y una huella causal
estable basada en `ERR_TEST_FAILURE`/`testCodeFailure`. El resultado conserva:

- `mutationId`, `targetFile`, `expectedTests` y `executedTestFiles`;
- `applied`, `buildStatus` y `testProcessStatus`;
- `parsedTestResults`, `failedTests`, `expectedTestsFailed` y
  `unexpectedTestsFailed`;
- `timeout`, `infrastructureFailure`, `causalMatch` y `killed`;
- `cleanupStatus`, symlink, procesos hijos, workspace residual y preservación
  del working tree.

`killed` sólo puede ser `true` para `EXPECTED_TEST_FAILURE`, con mutación
aplicada, build verde, fallo de test, ausencia de timeout/infraestructura,
identidad objetivo exacta fallida y huella causal compatible.

## Clasificación exclusiva

El runner produce exactamente una clasificación:

- `PASS`;
- `EXPECTED_TEST_FAILURE`;
- `UNRELATED_TEST_FAILURE`;
- `BUILD_FAILURE`;
- `TEST_DISCOVERY_FAILURE`;
- `INFRASTRUCTURE_FAILURE`;
- `TIMEOUT`;
- `MUTATION_NOT_APPLIED`;
- `RESULT_PARSE_FAILURE`;
- `CLEANUP_FAILURE`.

Sólo `EXPECTED_TEST_FAILURE` equivale a muerte válida. Un fallo ajeno se
registra, produce `causalMatch: false`, `killed: false` y hace fallar la
campaña.

## Pruebas del harness

La misma ruta real de ejecución cubre:

| Caso | Condición | Resultado obligatorio |
| --- | --- | --- |
| A | expected test incorrecto | `UNRELATED_TEST_FAILURE` |
| B | cualquier prueba ajena falla | `UNRELATED_TEST_FAILURE` |
| C | target pasa y otra prueba falla | `UNRELATED_TEST_FAILURE` |
| D | substring ambiguo | sin coincidencia parcial |
| E | mismo nombre en archivo distinto | sin coincidencia cross-file |
| F | JSON inválido | `RESULT_PARSE_FAILURE` |
| G | timeout | `TIMEOUT` |
| H | build roto | `BUILD_FAILURE` |
| I | mutación sobrevive | `PASS`, `killed: false` |
| J | target exacto falla | `EXPECTED_TEST_FAILURE`, `killed: true` |

El parser tiene nueve pruebas unitarias que agregan casos PASS/FAIL/SKIP,
nombres duplicados, archivos distintos, múltiples fallos, salida vacía o
corrupta, caracteres especiales, rutas normalizadas y stack multilínea.

## Baseline y campaña

Antes de mutar, el runner compila y ejecuta las cuatro suites Station en una
copia aislada. El baseline:

- fue `PASS`;
- inventarió 34 pruebas estructuradas;
- validó 35 declaraciones exactas para `MUT-024-01`–`25`;
- rechazó targets ausentes, ambiguos, skipped o ya fallando.

La campaña final produjo:

- 25 mutaciones aplicadas;
- 25 builds `PASS`;
- 25 clasificaciones `EXPECTED_TEST_FAILURE`;
- 25 `causalMatch: true`;
- 25/25 `killed`;
- cero unrelated, unexpected, survived, timeout, parser, infrastructure o
  cleanup failures.

Las cinco demostraciones aisladas (`01`, `04`, `07`, `11`, `15`) también
confirmaron baseline target `PASS`, mutación aplicada, build `PASS`, target
exacto `FAIL`, correlación causal, muerte válida y cleanup `PASS`.

## Regresión del falso positivo

Después del fix se repitió `MUT-024-01` con la prueba incorrecta de
revocación. El resultado fue:

- `classification: UNRELATED_TEST_FAILURE`;
- `killed: false`;
- `causalMatch: false`;
- `expectedTestsFailed: []`;
- `unexpectedTestsFailed` contiene exclusivamente la prueba real de tenant
  scope;
- ejecución global rechazada.

Esta regresión forma parte del manifest autoritativo, no sólo del texto
documental.

## Cleanup

Cada ruta, incluidos parser failure y unrelated failure, valida:

- symlink controlado de `node_modules`;
- cleanup en `finally`;
- ausencia de workspace residual;
- ausencia de procesos hijos asociados al workspace;
- ausencia de archivos modificados;
- estado Git del checkout real idéntico antes/después.

## Evidencia remota

Sobre el SHA técnico `2988bcdf362505776f7bc111e3d590aee358d2ce`:

- push `30239752229`: run-1, run-2 y comparison `SUCCESS`;
- pull request `30239754842`: run-1, run-2 y comparison `SUCCESS`;
- seis artifacts descargados y parseados;
- manifests de evidencia y mutación validados con los validadores versionados;
- comparación recalculada equivalente en ambos eventos;
- hashes y digests registrados en
  [el expediente](evidence/README.md);
- escaneo de secretos y rutas personales `PASS`.

El merge ref sintético del evento pull request es
`dc93f154642f04ce6caebc3d6d12f1c8907147fa`; no es un merge real.

## Estado

`PASS — PBI-024 CAUSAL MUTATION HARNESS REMEDIATION COMPLETE`.

Este dictamen sólo cierra la remediación técnica. La verificación formal
independiente sigue pendiente. PR #3 permanece `OPEN` y `Draft`; DEC-051 C02
permanece `Pending`; el merge funcional continúa prohibido.
