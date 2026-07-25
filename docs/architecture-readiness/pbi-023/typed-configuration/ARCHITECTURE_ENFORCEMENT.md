# Enforcement arquitectónico

## Registry

`architecture/dec-005-policy.json` registra el archivo exacto, owner
`database`, cuatro exports y consumidor futuro `database-connection.ts`.

D5-R045 recibió una transición estrecha:

- sólo aplica a `database-config.ts`;
- exige owner y path exactos;
- exige status `materialized-pure-config`;
- exige `consumerRequirement: deferred-until-connection-step`;
- exige cero imports;
- conserva API exacta;
- cualquier otra facility sin consumidor sigue fallando.

El fixture positivo prueba esa transición y el negativo usa
`database-types.ts` para demostrar que no se generalizó. No se agregó regla
nueva ni se neutralizó una existente.

## Controles adicionales

Las pruebas verifican:

- un solo `process.env` en `src/`, todavía en el bootstrap vigente;
- ningún acceso global/import-time desde config;
- ningún import `pg`/Kysely;
- ningún Pool, Client, Kysely, connect, query, execute o SQL;
- ningún singleton, setter o connection string;
- ningún import desde módulos de dominio/aplicación;
- path, owner, API y consumidor futuro exactos.

D5-R037–D5-R047 permanecen activos. La configuración técnica no activa scope
tenant porque no ejecuta operaciones de datos.
