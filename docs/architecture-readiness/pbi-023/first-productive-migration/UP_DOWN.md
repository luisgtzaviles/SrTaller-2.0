# Up, down y atomicidad

## `up`

1. crea `tenants`;
2. crea `branches`;
3. Kysely registra una fila en `kysely_migration`;
4. una segunda ejecución no produce operaciones.

## `down`

1. requiere autorización explícita del runner;
2. elimina `branches`;
3. elimina `tenants`;
4. no usa `CASCADE`.

Una tabla experimental con FK a `branches` bloqueó `down` y el runner devolvió
un error sanitizado. Tras eliminar sólo esa dependencia experimental, `down`
terminó y `reapply` reconstruyó exactamente el mismo contrato.

## Atomicidad

Una copia experimental creó las dos tablas y falló deliberadamente al intentar
crear `branches` de nuevo. La transacción del migrador revirtió tablas y
journal: cero objetos parciales y cero migración aplicada.
