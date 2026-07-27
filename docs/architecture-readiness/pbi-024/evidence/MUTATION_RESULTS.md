# Resultados de mutaciones

`node scripts/run-station-mutations.mjs` sobre el SHA
`e02f4acb84bf67cfa8683c0dfb0fffc202bdcd66`:

- modo: semantic;
- workspace: `controlled-temporary-copy`;
- mutaciones: 25;
- killed: 25;
- survived: 0;
- skipped: 0;
- applied: 25/25;
- build de código mutado: 25/25 exit 0;
- fallo nominal esperado: 25/25;
- cleanup/restauración: 25/25 `PASS`.

Cada caso modifica código alcanzable, ejecuta `pnpm run build` y corre las
pruebas objetivo de Station. No se contabilizan sintaxis rota, comentarios,
código muerto, imports irrelevantes o búsquedas del texto mutado.

`MUT-024-01`–`MUT-024-25` cubren tenant scope de Station/binding, Station
revocada, `bindingRevision`, branch cliente, elegibilidad, `FOR UPDATE`,
efecto fuera de transacción, contexto mutable, fallback, revoke/binding,
revision, binding cross-tenant, contexto forjado, error público, revalidación
del guard, deny-to-allow, bindings múltiples, close tenant-scoped, CAS,
revocación terminal y link con binding abierto.

El `MUTATION_MANIFEST.json` autoritativo registra archivo, transformación,
comando, test nominal, exit codes, duración y cleanup de cada caso. Su hash
material comparable es
`196df0efc0345a69e77130c589e0c3a34ddda26f24a8053699f76617deba0d7f`.

Las cinco ejecuciones manuales adicionales están en
[MANUAL_MUTATION_RESULTS.md](MANUAL_MUTATION_RESULTS.md).
