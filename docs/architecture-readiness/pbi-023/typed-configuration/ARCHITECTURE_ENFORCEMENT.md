# Enforcement arquitectónico

## Registry

`architecture/dec-005-policy.json` registra el archivo exacto, owner
`database`, cuatro exports y consumidor futuro `database-connection.ts`.

D5-R045 recibió en el Paso 5 una transición estrecha:

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

## Transición posterior

El Paso 6 materializó el consumer y sustituyó este estado transitorio:
config ahora es `materialized-configuration` y connection es
`materialized-connection-facility`. La única diferición vigente corresponde al
consumer de connection hasta el transaction step. La evidencia actual está en
[connection-facility/ARCHITECTURE_ENFORCEMENT.md](../connection-facility/ARCHITECTURE_ENFORCEMENT.md).

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
