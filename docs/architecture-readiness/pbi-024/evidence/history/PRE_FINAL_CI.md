# Intento CI anterior al SHA técnico final

Este registro preserva el intento intermedio sin presentarlo como evidencia
final.

| Campo | Evidencia histórica |
| --- | --- |
| commit | `7daa39be893264281f4c77c9f6ed8bc26dadafda` |
| push run | `30233547617`, `FAIL` |
| push run-1 | job `89876798716`, `FAIL` en PostgreSQL |
| push run-2 | job `89876798685`, `SUCCESS` |
| push comparison | job `89878896598`, `SKIPPED` |
| pull_request run | `30233549614`, `SUCCESS` |
| pull_request run-1/run-2/comparison | `89876804451` / `89876804445` / `89878993175` |
| causa | rechazo concurrente esperado observado después de liberar la barrera |
| síntoma | `STATION_CONTEXT_STALE` y `PromiseRejectionHandledWarning` |
| corrección | `2b89279eeda6fd3cfa4b76bae34460c520abd784` |

El test iniciaba operaciones concurrentes que debían rechazar, pero adjuntaba
`assert.rejects` después de liberar la barrera transaccional. Bajo un
interleaving válido, Node podía observar primero el rechazo y marcarlo como no
manejado, aun cuando la aserción posterior verificara el mismo error.

La corrección adjunta cada observador antes de liberar la barrera. No modifica
runtime, locks, workflow ni el contrato esperado. Después del cambio pasaron
tres ejecuciones PostgreSQL locales completas y los runs finales push
`30234014251` y pull_request `30234016330`.
