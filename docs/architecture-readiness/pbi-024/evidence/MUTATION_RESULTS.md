# Resultados de mutaciones

`node scripts/run-station-mutations.mjs` sobre el SHA
`2988bcdf362505776f7bc111e3d590aee358d2ce`:

- modo: semantic;
- workspace: `controlled-temporary-copy`;
- mutaciones: 25;
- killed: 25;
- `causalMatch: true`: 25;
- survived: 0;
- skipped: 0;
- unrelated/unexpected failures: 0/0;
- timeout/parser/infrastructure/cleanup failures: 0/0/0/0;
- applied: 25/25;
- build de código mutado: 25/25 exit 0;
- fallo objetivo exacto y causal: 25/25;
- cleanup/restauración: 25/25 `PASS`.

El baseline compiló, inventarió 34 pruebas estructuradas y validó 35
declaraciones exactas por archivo + nombre completo. Cada caso modifica código
alcanzable, ejecuta `pnpm run build` y corre las pruebas objetivo de Station.
No se contabilizan sintaxis rota, comentarios, código muerto, imports
irrelevantes, substring del nombre o un exit code ajeno.

`MUT-024-01`–`MUT-024-25` cubren tenant scope de Station/binding, Station
revocada, `bindingRevision`, branch cliente, elegibilidad, `FOR UPDATE`,
efecto fuera de transacción, contexto mutable, fallback, revoke/binding,
revision, binding cross-tenant, contexto forjado, error público, revalidación
del guard, deny-to-allow, bindings múltiples, close tenant-scoped, CAS,
revocación terminal y link con binding abierto.

El `MUTATION_MANIFEST.json` autoritativo schema 2 registra resultados
estructurados, objetivos, fallos esperados/inesperados, clasificación,
`causalMatch`, reporter, duración y cleanup de cada caso. Su hash material
comparable es
`6e62a2b318e1b0c3067e6dea2715e1767e86f81ba422bc080ce65279de12c589`.
El valor anterior era el hash del objeto-resumen comparable y queda separado
como [evidencia histórica](history/INCORRECT_MATERIAL_HASH.md).

La regresión integrada ejecuta `MUT-024-01` con la prueba incorrecta de
revocación. El target incorrecto pasa, tenant scope falla y el resultado es
`UNRELATED_TEST_FAILURE`, `expectedTestsFailed: []`, `causalMatch: false` y
`killed: false`.

Las cinco ejecuciones manuales adicionales están en
[MANUAL_MUTATION_RESULTS.md](MANUAL_MUTATION_RESULTS.md).
