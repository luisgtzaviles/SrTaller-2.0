# Matriz de validación

## PASS

| Caso | Resultado |
|---|---|
| development application explícito | PASS |
| production application + verify-full | PASS |
| development migration + read-write + migrations true | PASS |
| test aislado + role test | PASS |
| port 1 / 65535 | PASS |
| pool min = max | PASS |
| timeout 1 / 3600000 | PASS |
| sanitización repetida | PASS determinista |
| input readonly | PASS, no se modifica |

## FAIL

| Familia | Casos cubiertos | Código |
|---|---|---|
| faltantes | cada variable shared/test | REQUIRED |
| vacíos | `""`, espacios, tab, newline-only | EMPTY |
| strings | whitespace exterior, formato, Unicode no gobernado, longitud | INVALID_STRING |
| enteros | parcial, decimal, exponente, `+`, leading zero, NaN, Infinity, Unicode | INVALID_INTEGER |
| rangos | port, pool y seis timeouts | OUT_OF_RANGE |
| boolean | cualquier forma distinta de `true`/`false` | INVALID_BOOLEAN |
| enums | environment, SSL, role, access mode | UNKNOWN_VALUE |
| combinaciones | min > max; rol/ambiente/acceso/migraciones; namespace | INCOMPATIBLE |
| producción | SSL distinto de verify-full | UNSAFE_PRODUCTION |
| test | nombre no ligado al run; role no test; fallback shared | INCOMPATIBLE |
| URL/fallback | connection strings y variables `PG*` | CONNECTION_STRING_FORBIDDEN |
| variable desconocida | cualquier clave con prefijo gobernado | UNKNOWN_VARIABLE |

Los diagnósticos prueban código, campo y ausencia del password o valor
malicioso.
