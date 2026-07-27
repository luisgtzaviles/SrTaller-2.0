# Remediación de la revisión independiente de implementación

## Autoridad y estado

La revisión independiente de la implementación evaluó la rama en
`bbed0a636fe61b9e5122c058e3f6f73e731ab38b` y emitió:

`CONDITIONAL PASS — PBI-024 IMPLEMENTATION REQUIRES REMEDIATIONS`.

Ese dictamen no se elimina ni se reescribe. La presente remediación cierra
técnicamente sus cuatro hallazgos `MAJOR` y su hallazgo `MINOR`, pero no se
autoaprueba. El estado resultante es:

`In review — implementation remediated; formal verification pending; functional merge blocked by DEC-051 C02`.

## Hallazgos y resolución

| Hallazgo | Causa raíz | Resolución | Commit |
| --- | --- | --- | --- |
| MAJOR-01 | la suite comprobaba transformaciones textuales sin ejecutar código mutado | harness semántico en copia temporal controlada; build y pruebas objetivo reales; 25/25 killed; controles negativos del propio runner | `e02f4acb84bf67cfa8683c0dfb0fffc202bdcd66` |
| MAJOR-02 | el escenario de relink compartía conexión y podía recibir `NESTED_FORBIDDEN` | dos `DatabaseConnection`, dos backends y dos transacciones reales, barreras explícitas, ambos órdenes y verificación completa del estado PostgreSQL | `3d484f7fd4d6d5668ddee2144c57ba1aec222920` |
| MAJOR-03 | `40001`, `40P01` y `57014` perdían semántica/retryability; `23503` se traducía sin suficiente contexto | códigos separados, retryability preservada, allowlist por operación/constraint y diagnóstico técnico interno sanitizado | `d1da180a27a52ab4ad40ec36c214e171f1149837` |
| MAJOR-04 | el resolver no comparaba la revisión del binding con la Station antes de emitir confianza | rechazo fail-closed antes de la factory; incoherencia persistida se clasifica `Unexpected`; el guard transaccional permanece | `aabac6293b1671289d5a244c25283f95f841a7a6` |
| MINOR-01 | el expediente final apuntaba a una cronología y artifacts anteriores al head revisado | evidencia regenerada sobre el SHA de implementación remediada y runs push/PR nuevos; historial anterior preservado por separado | este expediente |

## Contratos cerrados por la remediación

### Mutaciones

- modo: `semantic`;
- estrategia: `controlled-temporary-copy`;
- ejecución: serial;
- dependencias: lockfile existente y `node_modules` reutilizado mediante
  symlink controlado;
- por mutación: transformación efectiva, build, test objetivo, timeout,
  captura de salida, diagnóstico esperado y cleanup en `finally`;
- contaminación: comparación exacta del estado Git antes/después;
- resultado autoritativo: `25/25`, sin supervivientes ni skips.

La elección de copia controlada, en lugar de worktree, evita depender de que
el árbol padre permanezca sin cambios durante el desarrollo de la remediación.
Cada workspace es efímero y no puede escribir sobre el checkout original.

### Concurrencia

El relink real parte de Station `Active`, binding A abierto y revisión `N`.
La transacción ganadora toma `FOR UPDATE`, cierra A, persiste
`Active → Unlinked → Active`, abre binding B y confirma. La perdedora ya
iniciada espera el lock, observa revisión stale después del commit y devuelve:

- código: `STATION_CONTEXT_STALE`;
- categoría: `Concurrency`;
- retryability: `never`.

El estado final es Station `Active`, revisión exacta `N + 2`, un único binding
abierto hacia B y el binding A cerrado. El escenario se repite invirtiendo
qué conexión gana. PID de backend y `txid_current()` demuestran identidades
transaccionales distintas; `NESTED_FORBIDDEN` se rechaza expresamente.

### Errores

- `40001` → `STATION_PERSISTENCE_SERIALIZATION_FAILURE` →
  `STATION_TRANSIENT_CONCURRENCY`, `Concurrency`, `conditional`;
- `40P01` → `STATION_PERSISTENCE_DEADLOCK` →
  `STATION_TRANSIENT_CONCURRENCY`, `Concurrency`, `conditional`;
- `57014` → `STATION_PERSISTENCE_QUERY_CANCELED` →
  `STATION_QUERY_CANCELED`, `Infrastructure`, `never`;
- `23503` sólo produce `NotFound` para una operación y constraint
  allowlisted que representan una referencia solicitada;
- un constraint desconocido, fuera de operación o una referencia persistida
  imposible produce `Unexpected`/integridad rota;
- SQLSTATE y constraint se conservan únicamente en un diagnóstico interno
  asociado al error; JSON, inspección y salida pública permanecen sanitizados.

No se añadió retry automático.

### Revisión del binding

El resolver exige
`binding.bindingRevision === station.revision` antes de consultar elegibilidad
y antes de invocar la factory. Un mismatch de la misma lectura autoritativa es
`STATION_REFERENCE_INTEGRITY_BROKEN`, categoría `Unexpected`, retryability
`never`, salida pública `INTERNAL_ERROR`/500. Un contexto emitido previamente
que queda obsoleto sigue siendo `STATION_CONTEXT_STALE`, categoría
`Concurrency`.

El guard posterior conserva la revalidación transaccional de tenant, Station,
status, revisión, binding, branch y elegibilidad antes del efecto.

## Evidencia

La implementación remediada queda fijada en
`2b89279eeda6fd3cfa4b76bae34460c520abd784`. El expediente vigente está en
[evidence](evidence/README.md), y la referencia histórica anterior en
[evidence/history/PRE_REMEDIATION.md](evidence/history/PRE_REMEDIATION.md).
El intento intermedio que reveló y preserva la carrera de observación del test
está en
[evidence/history/PRE_FINAL_CI.md](evidence/history/PRE_FINAL_CI.md).

Los workflows autoritativos nuevos son:

- push `30234014251`;
- pull request `30234016330`.

Ambos ejecutaron `VC-024 run-1`, `VC-024 run-2` y `VC-024 comparison` con
resultado `SUCCESS`. El run de pull request usa el merge ref sintético
`298a21ec2821359fe837f9768419699a856a9b71`; no representa ni autoriza un
merge real.

Antes de estos runs, el push `30233547617` sobre `7daa39b` detectó que una
promesa concurrente esperada podía rechazar después de liberar la barrera y
antes de adjuntar `assert.rejects`. El commit `2b89279` adjuntó los
observadores antes de liberar cada barrera, sin cambiar runtime ni workflow.
La corrección pasó tres ejecuciones PostgreSQL locales completas y los cuatro
jobs PostgreSQL remotos finales.

## Dictamen de remediación

`PASS — PBI-024 IMPLEMENTATION REMEDIATIONS COMPLETE`.

Este dictamen sólo confirma que la remediación está lista para una nueva
revisión independiente. PR #3 continúa `OPEN` y `Draft`; DEC-051 C02
continúa `Pending`; el merge funcional continúa prohibido.

## Segunda revisión y remediación causal

La segunda revisión formal independiente conservó los contratos de
concurrencia, errores PostgreSQL, `bindingRevision`, cronología y alcance como
satisfechos, pero detectó un `MAJOR` adicional: el harness comprobaba
`output.includes(expectedTest)` y podía aceptar como muerte el fallo de una
prueba ajena.

La reproducción previa demostró el falso positivo con `MUT-024-01`: la prueba
de tenant scope falló, la prueba configurada de revocación pasó, pero el
runner antiguo devolvió `killed: true`.

Los commits `88b22b6` y `2988bcd` sustituyen esa heurística por un reporter
JSON de `node:test`, parser estricto, identidad archivo + nombre completo,
huella causal estable, clasificación exclusiva, baseline de targets y casos
negativos A–J. El caso incorrecto ahora produce
`UNRELATED_TEST_FAILURE`, `causalMatch: false` y `killed: false`.

La campaña final sobre
`2988bcdf362505776f7bc111e3d590aee358d2ce` obtuvo 25/25 muertes causales,
cero fallos unrelated/survived/timeout/parser/infra/cleanup y cinco
demostraciones manuales `PASS`. Push `30239752229` y pull request
`30239754842` pasaron run-1/run-2/comparison; sus seis artifacts fueron
descargados y validados.

El detalle se conserva en
[CAUSAL_MUTATION_REMEDIATION.md](CAUSAL_MUTATION_REMEDIATION.md) y
[evidence/CAUSAL_CORRELATION_RESULTS.md](evidence/CAUSAL_CORRELATION_RESULTS.md).

`PASS — PBI-024 CAUSAL MUTATION HARNESS REMEDIATION COMPLETE`.

La verificación formal independiente continúa pendiente. PR #3 continúa
`OPEN` y `Draft`; DEC-051 C02 continúa `Pending`; el merge funcional
continúa prohibido.
