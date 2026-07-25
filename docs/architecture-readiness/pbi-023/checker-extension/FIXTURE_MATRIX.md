# Matriz de fixtures PBI-023

## Conteos

- Baseline PBI-022: 98 (12 positivos, 86 negativos).
- Extensión PBI-023: 37 (6 positivos, 31 negativos).
- Vigente tras Paso 5: **135 (18 positivos, 117 negativos)**.

## Cobertura

| Regla/área | PASS | FAIL y evasiones comprobadas |
| --- | --- | --- |
| Topología completa | facility + types + tenant port + adapter + composition + tabla owner | no aplica |
| Controles inertes | comentarios, strings, homónimos, paquete ajeno, local `client.query` | no aplica |
| D5-R037 | imports dentro de roots registrados | direct, default, alias type-only, namespace, `require`, `import =`, dynamic y reexport |
| D5-R038 | `createDatabaseConnection` registrada | export `db` directo y reexport alias |
| D5-R039 | repository específico | generic renombrado `Ledger<T>` con read/write |
| D5-R040 | port sin infra | import relativo y barrel reexport de facility |
| D5-R041 | adapter owner/port/composition | adapter no registrado y adapter registrado sin composición |
| D5-R042 | migración central UTC-owner; SQL permitido allí | migración dispersa y nombre central no canónico |
| D5-R043 | port con tipos propios | alias, namespace qualified, reexport y type alias de driver |
| D5-R044 | tenant scope y tenant+branch scope estructurales | missing, nombre de scope sin estructura, optional, nullable, defaulted y branch-only |
| D5-R045 | config pura exacta sin imports puede diferir consumer; demás facilities registradas/consumidas | archivo desconocido y otra facility registrada sin consumer |
| D5-R046 | SQL sólo en migration; shadowing/local query ignorados | tagged alias, namespace `.raw` y `PoolClient.query` tipado |
| D5-R047 | adapter tenancy usa `tenants` | `branches`, tabla desconocida y argumento dinámico |

Cada fixture corre dos veces en un root temporal aislado y compara exit,
stdout, stderr, reglas y paths exactos. `docs/`, evidencia, `spikes/` y
fixtures no activadas no son inspeccionados como producto.
