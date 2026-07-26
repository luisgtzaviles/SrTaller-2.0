# Política read-only/read-write

`readOnly` tiene default `false` y se traduce exclusivamente a los modos
tipados `read only` o `read write` de Kysely.

| Caso | Evidencia PostgreSQL 18.4 |
| --- | --- |
| lectura en read-only | PASS |
| escritura en read-only | `25006` → `DATABASE_TRANSACTION_READ_ONLY_VIOLATION` |
| escritura en read-write | PASS y commit visible |
| modo omitido | read-write explícito |

El modo no se ignora ni usa SQL productivo. La configuración de rol de
conexión sigue siendo una defensa adicional independiente; este contrato no
eleva privilegios ni sustituye separación de roles.
