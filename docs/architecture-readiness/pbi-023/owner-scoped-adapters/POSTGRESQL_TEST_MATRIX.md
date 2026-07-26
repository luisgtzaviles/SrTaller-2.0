# Matriz PostgreSQL

## Entorno

- PostgreSQL: `18.4`;
- imagen: `postgres@sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf`;
- Node.js: `24.18.0`;
- encoding: `UTF8`;
- timezone: `UTC`;
- almacenamiento: tmpfs;
- puerto: loopback efímero;
- credenciales: sintéticas por run;
- migración: productiva, aplicada desde `dist` mediante el runner.

## Casos

| Grupo | Caso | Resultado |
|---|---|---|
| tenant | create/find/exists | PASS |
| tenant | duplicate | conflicto tipado |
| tenant | transaction commit | PASS |
| tenant | rollback | fila ausente |
| branch | create/find/exists/list | PASS |
| branch | tenant inexistente | error FK tipado |
| branch | cross-tenant find/exists | `null` / `false` |
| branch | list A/list B | sólo filas propias |
| branch | mismo branch ID A/B | permitido |
| branch | duplicate compuesto | conflicto tipado |
| concurrency | dos creates del mismo compuesto | uno PASS, uno conflicto |
| transaction | serializable + scopes A/B | PASS |
| transaction | nesting | rechazado |
| lifecycle | contexto expirado | failure tipado |
| migration | up/down | PASS |
| cleanup | schema/contenedor | cero residuo |

## Repetibilidad

El harness ejecuta dos contenedores independientes. Ambos producen el mismo
material y la comparación final es `MATCH`. PostgreSQL sigue gated fuera del
workflow; el resultado autoriza el Paso 11, no satisface aún el gate
autoritativo de CI.
